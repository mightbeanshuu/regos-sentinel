"""Tests for the user-supplied document review lane.

Every assertion here protects one promise: an uploaded PDF is read honestly, classified by a
fixed rule, never given a fabricated interpretation, and never visible to another visitor.
"""

from __future__ import annotations

from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfReader
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from app.documents import (
    MAX_PAGE_COUNT,
    PassageClass,
    _split_sentences,
    classify_passage,
)
from app.main import create_app

SECRET = "test-session-secret-that-is-longer-than-thirty-two-bytes"

MANDATORY_TEXT = (
    "A regulated entity shall close every high-severity finding within seven days of the "
    "date on which the finding is recorded in the vulnerability register maintained by it."
)
RECOMMENDATION_TEXT = (
    "Regulated entities are encouraged to include finding-closure timelines in the service "
    "agreements they sign with their third-party technology service providers."
)
PERMISSION_TEXT = (
    "A regulated entity may consider compensatory controls such as virtual patching where an "
    "original equipment manufacturer patch has a longer implementation period."
)
MIXED_TEXT = (
    "The entity shall maintain a register of all findings and is encouraged to publish a "
    "quarterly summary of the closure performance achieved against that register."
)
BACKGROUND_TEXT = (
    "This annexure records the reporting format used by market entities when they submit the "
    "results of a vulnerability assessment to the supervisory authority each year."
)


def build_pdf(paragraphs: list[list[str]]) -> bytes:
    """Render a synthetic multi-page PDF. One inner list is one page."""
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4, invariant=1)
    for page in paragraphs:
        cursor = 260 * mm
        for paragraph in page:
            words = paragraph.split()
            line = ""
            for word in words:
                if len(line) + len(word) > 88:
                    pdf.drawString(20 * mm, cursor, line)
                    cursor -= 5 * mm
                    line = word
                else:
                    line = f"{line} {word}".strip()
            pdf.drawString(20 * mm, cursor, line)
            cursor -= 11 * mm
        pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def client() -> TestClient:
    return TestClient(create_app(SECRET))


def upload(active: TestClient, payload: bytes, filename: str = "sandbox-circular.pdf"):
    return active.post(
        f"/api/v1/documents?filename={filename}&authority=Sandbox%20authority",
        content=payload,
        headers={"Content-Type": "application/pdf"},
    )


@pytest.fixture()
def sample_pdf() -> bytes:
    return build_pdf(
        [
            [MANDATORY_TEXT, RECOMMENDATION_TEXT],
            [PERMISSION_TEXT, MIXED_TEXT, BACKGROUND_TEXT],
        ]
    )


def test_classifier_separates_requirement_strengths_and_defers_when_mixed() -> None:
    assert classify_passage(MANDATORY_TEXT, {})[0] == PassageClass.POSSIBLE_REQUIREMENT
    assert classify_passage(RECOMMENDATION_TEXT, {})[0] == PassageClass.RECOMMENDATION
    assert classify_passage(PERMISSION_TEXT, {})[0] == PassageClass.PERMISSION
    assert classify_passage(BACKGROUND_TEXT, {})[0] == PassageClass.BACKGROUND
    # A passage carrying two strengths is never guessed at.
    assert classify_passage(MIXED_TEXT, {})[0] == PassageClass.NEEDS_REVIEW


def test_sentences_split_on_word_boundaries_not_bare_suffixes() -> None:
    """Regression: "providers." ends with "rs.", which must not read as an abbreviation.

    When it did, a recommendation sentence and a permission sentence were glued into one
    passage, which then reported two requirement strengths and was wrongly deferred.
    """
    block = f"{RECOMMENDATION_TEXT} {PERMISSION_TEXT}"

    units = _split_sentences(block)

    assert len(units) == 2
    assert classify_passage(units[0], {})[0] == PassageClass.RECOMMENDATION
    assert classify_passage(units[1], {})[0] == PassageClass.PERMISSION


def test_real_abbreviations_still_hold_a_sentence_together() -> None:
    block = "The entity shall pay a penalty of Rs. 5,00,000 to the authority. It shall also report."

    units = _split_sentences(block)

    assert len(units) == 2
    assert "Rs. 5,00,000" in units[0]


def test_upload_records_hash_pages_passages_and_locators(sample_pdf: bytes) -> None:
    active = client()

    response = upload(active, sample_pdf)

    assert response.status_code == 201
    document = response.json()
    assert len(document["sha256"]) == 64
    assert document["byte_count"] == len(sample_pdf)
    assert document["authority_provenance"] == "USER_PROVIDED_METADATA_NOT_VERIFIED"
    assert document["extraction_mode"] == "DETERMINISTIC_TEXT_EXTRACTION_NO_MODEL_CALL"
    assert document["scope"]["page_count"] == 2
    assert document["scope"]["passages_reviewed"] >= 5
    assert all(item["locator"].startswith("Page ") for item in document["passages"])
    assert {item["page"] for item in document["passages"]} == {1, 2}
    # Unresolved language keeps the whole document out of an "all done" state.
    assert document["scope"]["passages_needing_review"] >= 1
    assert document["state"] == "NEEDS_REVIEW"


def test_recommendation_text_never_creates_mandatory_work(sample_pdf: bytes) -> None:
    active = client()
    document = upload(active, sample_pdf).json()
    recommendation = next(
        item for item in document["passages"] if item["classification"] == "RECOMMENDATION"
    )

    response = active.post(
        f"/api/v1/documents/{document['id']}/requirements",
        json={
            "passage_id": recommendation["id"],
            "actor": "Regulated entity",
            "action": "close",
            "obligation_object": "third-party findings",
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "reason": "Attempting to promote guidance into mandatory work.",
        },
    )

    assert response.status_code == 409
    assert "guidance rather than a requirement" in response.json()["detail"]
    assert document["scope"]["recommendations_not_converted"] >= 1


def test_requirement_without_a_trigger_calculates_no_due_date(sample_pdf: bytes) -> None:
    active = client()
    document = upload(active, sample_pdf).json()
    requirement_passage = next(
        item for item in document["passages"] if item["classification"] == "POSSIBLE_REQUIREMENT"
    )

    updated = active.post(
        f"/api/v1/documents/{document['id']}/requirements",
        json={
            "passage_id": requirement_passage["id"],
            "actor": "Regulated entity",
            "action": "close",
            "obligation_object": "high-severity finding",
            "duration_value": 7,
            "duration_unit": "days",
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "reason": "The duration is stated but the start event is not recorded here.",
        },
    ).json()

    approved = updated["requirements"][0]
    assert approved["computable"] is False
    assert approved["trigger"] is None
    assert approved["trigger_provenance"] is None
    assert "no event that starts it" in approved["blocked_reason"]
    assert approved["provenance"] == "HUMAN_POLICY"


def test_human_can_resolve_a_passage_and_then_approve_a_requirement(sample_pdf: bytes) -> None:
    active = client()
    document = upload(active, sample_pdf).json()
    mixed = next(
        item for item in document["passages"] if item["classification"] == "NEEDS_REVIEW"
    )

    resolved = active.patch(
        f"/api/v1/documents/{document['id']}/passages/{mixed['id']}",
        json={
            "classification": "POSSIBLE_REQUIREMENT",
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "rationale": "The register duty is mandatory; the summary sentence is guidance.",
        },
    ).json()

    reviewed = next(item for item in resolved["passages"] if item["id"] == mixed["id"])
    assert reviewed["classification_provenance"] == "HUMAN_POLICY"
    assert reviewed["reviewed_by"].startswith("Aditi Rao")
    assert resolved["scope"]["passages_needing_review"] == 0
    assert resolved["state"] == "READY_FOR_APPROVAL"

    approved = active.post(
        f"/api/v1/documents/{document['id']}/requirements",
        json={
            "passage_id": mixed["id"],
            "actor": "Regulated entity",
            "action": "maintain",
            "obligation_object": "register of findings",
            "duration_value": 7,
            "duration_unit": "days",
            "trigger": "Date the finding is recorded in the register",
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "reason": "The entity policy fixes the start event for this duty.",
        },
    ).json()

    assert approved["state"] == "APPROVED"
    assert approved["requirements"][0]["computable"] is True
    assert approved["requirements"][0]["trigger_provenance"] == "HUMAN_POLICY"


def test_draft_packet_is_available_before_approval_and_report_is_not(sample_pdf: bytes) -> None:
    active = client()
    document = upload(active, sample_pdf).json()

    packet = active.get(f"/api/v1/documents/{document['id']}/review-packet.pdf")
    report = active.get(f"/api/v1/documents/{document['id']}/report.pdf")

    assert packet.status_code == 200
    assert packet.headers["content-type"] == "application/pdf"
    assert packet.content.startswith(b"%PDF-")
    reader = PdfReader(BytesIO(packet.content))
    rendered = "\n".join(page.extract_text() or "" for page in reader.pages)
    assert "DRAFT" in rendered and "NOT APPROVED" in rendered
    assert "User-uploaded" in rendered

    assert report.status_code == 409
    assert "Approve at least one structured requirement" in report.json()["detail"]


def test_one_visitor_cannot_read_another_visitors_document(sample_pdf: bytes) -> None:
    app = create_app(SECRET)
    judge_one = TestClient(app)
    judge_two = TestClient(app)

    document = upload(judge_one, sample_pdf).json()

    assert judge_two.get("/api/v1/documents").json() == []
    leaked = judge_two.get(f"/api/v1/documents/{document['id']}")
    assert leaked.status_code == 404
    packet = judge_two.get(f"/api/v1/documents/{document['id']}/review-packet.pdf")
    assert packet.status_code == 404


def test_resetting_the_demo_clears_uploaded_documents(sample_pdf: bytes) -> None:
    active = client()
    upload(active, sample_pdf)

    active.post("/api/v1/demo/reset")

    assert active.get("/api/v1/documents").json() == []


@pytest.mark.parametrize(
    ("payload", "status", "fragment"),
    [
        (b"", 422, "empty"),
        (b"this is plainly not a pdf at all", 415, "not a PDF"),
        (b"%PDF-1.7\nbroken and truncated beyond repair", 422, "could not read"),
    ],
)
def test_unusable_uploads_are_rejected_with_an_actionable_reason(
    payload: bytes, status: int, fragment: str
) -> None:
    response = upload(client(), payload)

    assert response.status_code == status
    assert fragment.lower() in response.json()["detail"].lower()


def test_oversized_page_count_is_rejected() -> None:
    too_long = build_pdf([[BACKGROUND_TEXT]] * (MAX_PAGE_COUNT + 1))

    response = upload(client(), too_long)

    assert response.status_code == 413
    assert f"reads up to {MAX_PAGE_COUNT} pages" in response.json()["detail"]


def test_pages_without_extractable_text_are_reported_not_invented() -> None:
    # A page with no text objects stands in for a scanned page.
    mixed = build_pdf([[MANDATORY_TEXT], []])

    document = upload(client(), mixed).json()

    assert document["scope"]["pages_unreadable"] == [2]
    assert document["scope"]["pages_read"] == 1
    assert all(item["page"] == 1 for item in document["passages"])
    assert any("does not perform OCR" in line for line in document["limitations"])
