"""Tests for the OCR lane.

The promises under test: with no engine at all nothing changes and nothing leaves the
process; scanned pages read by either engine are merged and every recovered passage is
*labelled* machine-read; the local engine keeps working offline because it makes no
outbound call; a fragmentary remote read loses to a fuller local transcript; and when
every engine fails, the pages stay honestly unreadable — no text is ever invented.
"""

from __future__ import annotations

import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app import ocr
from app.documents import (
    EXTRACTION_MODE_TEXT,
    EXTRACTION_MODE_TEXT_PLUS_OCR,
    DocumentScope,
    _limitations,
)
from app.main import create_app
from app.ocr import OCR_ENDPOINT, local_ocr_available, ocr_available, ocr_pages
from tests.test_documents import MANDATORY_TEXT, RECOMMENDATION_TEXT, build_pdf, upload


@pytest.fixture()
def no_local_engine(monkeypatch: pytest.MonkeyPatch):
    """Force the local engine off so remote-path behaviour is deterministic on
    machines that happen to have tesseract installed."""
    monkeypatch.setattr("app.ocr.shutil.which", lambda _name: None)

SECRET = "test-session-secret-that-is-longer-than-thirty-two-bytes"

#: What the fake OCR service "reads" off the scanned page. Real normative language —
#: and deliberately different wording from the text-layer page, because identical
#: wording is (correctly) recorded as a duplicate rather than classified twice.
SCANNED_MANDATORY_TEXT = (
    "A regulated entity shall report every cyber incident to the supervisory authority "
    "within six hours of the time at which the incident is detected by its monitoring "
    "systems."
)
SCANNED_PAGE_TEXT = f"{SCANNED_MANDATORY_TEXT}\n\n{RECOMMENDATION_TEXT}"


def client() -> TestClient:
    return TestClient(create_app(SECRET))


def scanned_pdf() -> bytes:
    """Page 1 has a text layer; page 2 is empty, standing in for a scanned image."""
    return build_pdf([[MANDATORY_TEXT], []])


class FakeResponse:
    def __init__(self, payload: dict, status_code: int = 200) -> None:
        self._payload = payload
        self.status_code = status_code

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("error", request=None, response=None)

    def json(self) -> dict:
        return self._payload


# --------------------------------------------------------------------------- #
# Disabled: no key, or offline — behaviour is exactly the pre-OCR behaviour
# --------------------------------------------------------------------------- #


def test_with_no_engine_at_all_the_upload_lane_is_unchanged(
    monkeypatch: pytest.MonkeyPatch,
    no_local_engine: None,
) -> None:
    monkeypatch.delenv("OCR_SPACE_API_KEY", raising=False)

    def never(*args, **kwargs):  # pragma: no cover - the assertion is the point
        raise AssertionError("no network call may happen without a key")

    monkeypatch.setattr("app.ocr.httpx.post", never)
    active = client()

    assert ocr_available() is False
    assert active.get("/api/v1/documents/limits").json()["ocr_available"] is False

    document = upload(active, scanned_pdf()).json()
    assert document["scope"]["pages_unreadable"] == [2]
    assert document["scope"]["pages_machine_read"] == []
    assert document["extraction_mode"] == EXTRACTION_MODE_TEXT
    assert any("does not perform OCR" in line for line in document["limitations"])


def test_offline_mode_disables_the_remote_engine_even_with_a_key(
    monkeypatch: pytest.MonkeyPatch,
    no_local_engine: None,
) -> None:
    monkeypatch.setenv("OCR_SPACE_API_KEY", "test-key-not-a-real-secret")
    monkeypatch.setenv("REGOS_OFFLINE", "1")

    assert ocr_available() is False
    assert ocr_pages(scanned_pdf(), [2]) == {}


def test_offline_mode_still_reads_locally_and_makes_no_network_call(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The local engine is in-process — the sealed-engine promise survives it."""
    monkeypatch.setenv("OCR_SPACE_API_KEY", "test-key-not-a-real-secret")
    monkeypatch.setenv("REGOS_OFFLINE", "1")

    def never(*args, **kwargs):  # pragma: no cover - the assertion is the point
        raise AssertionError("offline mode must not make an outbound call")

    monkeypatch.setattr("app.ocr.httpx.post", never)
    monkeypatch.setattr("app.ocr.local_ocr_available", lambda: True)
    monkeypatch.setattr("app.ocr._local_page", lambda payload, index: SCANNED_PAGE_TEXT)
    active = client()

    assert ocr_available() is True
    document = upload(active, scanned_pdf()).json()

    assert document["scope"]["pages_unreadable"] == []
    assert document["scope"]["pages_machine_read"] == [2]
    assert document["extraction_mode"] == EXTRACTION_MODE_TEXT_PLUS_OCR
    recovered = [item for item in document["passages"] if item["page"] == 2]
    assert recovered
    assert all(
        item["classification_provenance"] == "MACHINE_READ_OCR" for item in recovered
    )


def test_a_fragmentary_remote_read_loses_to_the_fuller_local_transcript(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OCR_SPACE_API_KEY", "test-key-not-a-real-secret")
    monkeypatch.delenv("REGOS_OFFLINE", raising=False)
    monkeypatch.setattr(
        "app.ocr.httpx.post",
        lambda *args, **kwargs: FakeResponse(
            {"IsErroredOnProcessing": False, "ParsedResults": [{"ParsedText": "7 da"}]}
        ),
    )
    monkeypatch.setattr("app.ocr.local_ocr_available", lambda: True)
    monkeypatch.setattr("app.ocr._local_page", lambda payload, index: SCANNED_PAGE_TEXT)

    assert ocr_pages(scanned_pdf(), [2]) == {2: SCANNED_PAGE_TEXT}


def test_a_full_remote_read_is_kept_and_the_local_engine_is_not_consulted(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OCR_SPACE_API_KEY", "test-key-not-a-real-secret")
    monkeypatch.delenv("REGOS_OFFLINE", raising=False)
    monkeypatch.setattr(
        "app.ocr.httpx.post",
        lambda *args, **kwargs: FakeResponse(
            {
                "IsErroredOnProcessing": False,
                "ParsedResults": [{"ParsedText": SCANNED_PAGE_TEXT}],
            }
        ),
    )
    monkeypatch.setattr("app.ocr.local_ocr_available", lambda: True)

    def never_local(payload, index):  # pragma: no cover - the assertion is the point
        raise AssertionError("a full remote read must not trigger the local engine")

    monkeypatch.setattr("app.ocr._local_page", never_local)

    assert ocr_pages(scanned_pdf(), [2]) == {2: SCANNED_PAGE_TEXT}


@pytest.mark.skipif(not local_ocr_available(), reason="tesseract binary not installed")
def test_the_real_local_engine_reads_a_rendered_page() -> None:
    """Integration: rasterise → tesseract → text, all in memory, no key, no network."""
    pil = pytest.importorskip("PIL.Image")
    draw_mod = pytest.importorskip("PIL.ImageDraw")
    font_mod = pytest.importorskip("PIL.ImageFont")
    from io import BytesIO

    image = pil.new("RGB", (1400, 500), "white")
    draw = draw_mod.Draw(image)
    font = font_mod.load_default(size=40)
    draw.text(
        (60, 80),
        "The regulated entity shall close all findings within 7 days of discovery.",
        font=font,
        fill="black",
    )
    buffer = BytesIO()
    image.save(buffer, format="PDF")

    recovered = ocr_pages(buffer.getvalue(), [1])

    assert 1 in recovered
    text = recovered[1].lower()
    assert "within 7 days" in text
    assert "discovery" in text


# --------------------------------------------------------------------------- #
# Enabled: recovered text is merged, and labelled as machine-read
# --------------------------------------------------------------------------- #


def test_scanned_pages_are_machine_read_and_carry_ocr_provenance(
    monkeypatch: pytest.MonkeyPatch,
    no_local_engine: None,
) -> None:
    monkeypatch.setenv("OCR_SPACE_API_KEY", "test-key-not-a-real-secret")
    monkeypatch.delenv("REGOS_OFFLINE", raising=False)
    calls: list[dict] = []

    def fake_post(url, headers=None, data=None, files=None, timeout=None):
        calls.append({"url": url, "headers": headers, "data": data})
        return FakeResponse(
            {
                "IsErroredOnProcessing": False,
                "ParsedResults": [{"ParsedText": SCANNED_PAGE_TEXT}],
            }
        )

    monkeypatch.setattr("app.ocr.httpx.post", fake_post)
    active = client()

    assert active.get("/api/v1/documents/limits").json()["ocr_available"] is True
    document = upload(active, scanned_pdf()).json()

    # The call went to the OCR service with the env key and the default engine —
    # and the key never appears anywhere in the document payload.
    assert calls and calls[0]["url"] == OCR_ENDPOINT
    assert calls[0]["headers"]["apikey"] == "test-key-not-a-real-secret"
    assert calls[0]["data"]["OCREngine"] == "2"
    assert "test-key-not-a-real-secret" not in json.dumps(document)

    # The page is no longer unreadable — it is machine-read, and says so everywhere.
    assert document["scope"]["pages_unreadable"] == []
    assert document["scope"]["pages_machine_read"] == [2]
    assert document["extraction_mode"] == EXTRACTION_MODE_TEXT_PLUS_OCR
    assert any("machine-read" in line for line in document["limitations"])

    recovered = [item for item in document["passages"] if item["page"] == 2]
    assert recovered, "the machine-read page must contribute passages"
    for passage in recovered:
        assert passage["classification_provenance"] == "MACHINE_READ_OCR"
        assert "machine-read (OCR)" in passage["locator"]
        assert "machine-read" in passage["rationale"]

    # Text-layer passages keep their own provenance; the label discriminates.
    text_layer = [item for item in document["passages"] if item["page"] == 1]
    assert all(item["classification_provenance"] == "DETERMINISTIC" for item in text_layer)

    # And the deterministic classifier ran over the recovered wording as usual.
    assert any(
        item["classification"] == "POSSIBLE_REQUIREMENT" for item in recovered
    )


def test_a_reviewer_can_still_overrule_a_machine_read_passage(
    monkeypatch: pytest.MonkeyPatch,
    no_local_engine: None,
) -> None:
    monkeypatch.setenv("OCR_SPACE_API_KEY", "test-key-not-a-real-secret")
    monkeypatch.setattr(
        "app.ocr.httpx.post",
        lambda *args, **kwargs: FakeResponse(
            {
                "IsErroredOnProcessing": False,
                "ParsedResults": [{"ParsedText": MANDATORY_TEXT}],
            }
        ),
    )
    active = client()
    document = upload(active, scanned_pdf()).json()
    machine_read = next(item for item in document["passages"] if item["page"] == 2)

    reviewed = active.patch(
        f"/api/v1/documents/{document['id']}/passages/{machine_read['id']}",
        json={
            "classification": "BACKGROUND",
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "rationale": "The recognition garbled this line; the original page is a header.",
        },
    ).json()

    updated = next(item for item in reviewed["passages"] if item["id"] == machine_read["id"])
    assert updated["classification_provenance"] == "HUMAN_POLICY"
    assert updated["reviewed_by"].startswith("Aditi Rao")
    # The page-level machine-read label survives the review; the page still was OCR'd.
    assert reviewed["scope"]["pages_machine_read"] == [2]


# --------------------------------------------------------------------------- #
# Failure: pages stay honestly unreadable, and the attempt is recorded
# --------------------------------------------------------------------------- #


def test_an_unreachable_ocr_service_leaves_pages_honestly_unreadable(
    monkeypatch: pytest.MonkeyPatch,
    no_local_engine: None,
) -> None:
    monkeypatch.setenv("OCR_SPACE_API_KEY", "test-key-not-a-real-secret")

    def unreachable(*args, **kwargs):
        raise httpx.ConnectError("connection refused")

    monkeypatch.setattr("app.ocr.httpx.post", unreachable)
    active = client()

    document = upload(active, scanned_pdf()).json()

    assert document["scope"]["pages_unreadable"] == [2]
    assert document["scope"]["pages_machine_read"] == []
    assert document["extraction_mode"] == EXTRACTION_MODE_TEXT
    assert all(item["page"] == 1 for item in document["passages"])
    assert any(
        "Machine reading (OCR) was attempted" in line for line in document["limitations"]
    )
    assert any("No text was invented" in line for line in document["limitations"])


def test_an_ocr_error_response_yields_no_text_rather_than_garbage(
    monkeypatch: pytest.MonkeyPatch,
    no_local_engine: None,
) -> None:
    monkeypatch.setenv("OCR_SPACE_API_KEY", "test-key-not-a-real-secret")
    monkeypatch.setattr(
        "app.ocr.httpx.post",
        lambda *args, **kwargs: FakeResponse(
            {"IsErroredOnProcessing": True, "ParsedResults": []}
        ),
    )

    assert ocr_pages(scanned_pdf(), [2]) == {}


def test_machine_reading_stands_down_when_the_box_cannot_afford_it(
    tmp_path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A page render plus a tesseract process can be more memory than the box has.

    When it is, the kernel does not fail the request — it kills the process, which
    drops every other session in flight and returns a bare 502 with nothing in the
    log. That is how SEBI's 205-page CSCRF framework became impossible to upload in
    production while every local run passed: one page of 205 has no text layer.
    Refusing to read that page is a far smaller harm, and it can be disclosed.
    """
    limit = tmp_path / "memory.max"
    used = tmp_path / "memory.current"
    limit.write_text("536870912")  # a 512 MB instance

    monkeypatch.setattr(
        ocr, "_cgroup_value",
        lambda *paths: int(limit.read_text()) if "max" in paths[0] else int(used.read_text()),
    )

    used.write_text(str(500 * 1024 * 1024))  # 12 MB free
    assert ocr.free_container_memory() == 12 * 1024 * 1024
    assert ocr.machine_reading_affordable() is False
    assert ocr.local_ocr_available() is False

    used.write_text(str(100 * 1024 * 1024))  # 412 MB free
    assert ocr.machine_reading_affordable() is True


def test_no_readable_memory_limit_never_blocks_machine_reading(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A guard that guesses a limit is worse than no guard.

    On a laptop, or any host that does not put the process in a memory cgroup,
    there is no limit to read — and refusing to OCR there would break a working
    feature to defend against a constraint that does not exist.
    """
    monkeypatch.setattr(ocr, "_cgroup_value", lambda *paths: None)

    assert ocr.free_container_memory() is None
    assert ocr.machine_reading_affordable() is True


def test_a_machine_read_that_is_not_words_is_not_offered_as_wording() -> None:
    """The engine is accurate on prose and cannot decline on a diagram.

    Measured on SEBI's own CSCRF framework: the OCR of page 116 (prose) scores
    0.78, exactly what that page's own text layer scores, while the OCR of page 32
    (a flowchart) scores 0.33 and reads "S=3]l osone z 3 Incident Recovery Plan a e
    ||2228 Execution". Every fragment of that used to become a passage in a
    compliance review — presented as wording read off a SEBI circular.
    """
    diagram = (
        "S=3]l osone z 3 Incident Recovery Plan a e ||2228 Execution & & ||gsee a S "
        "2EBE Incident Recovery s s S88 3 Co ea ea 2 3 i = BS ||\\2f382 ; fo} fo} 2SeSe"
    )
    prose = (
        "REs shall establish and ensure that the patch management procedures include "
        "the identification, categorisation and prioritisation of patches and updates. "
        "An implementation timeframe for each category of patches shall be established "
        "to apply them in a timely manner. All operating systems and applications shall "
        "be updated with the latest patches on a regular basis."
    )

    assert ocr.legibility(diagram) < ocr.OCR_MIN_LEGIBILITY
    assert ocr.legibility(prose) > ocr.OCR_MIN_LEGIBILITY
    assert ocr.reads_as_prose(diagram) is False
    assert ocr.reads_as_prose(prose) is True


def test_a_short_read_is_not_judged_on_a_ratio() -> None:
    """A caption is too small a sample for the ratio to mean anything."""
    assert ocr.reads_as_prose("Annexure-B") is True
    assert ocr.reads_as_prose("   ") is False


def test_an_illegible_page_reads_differently_from_a_blank_one(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Three reasons a page went unread, and the reader needs to know which."""
    noise = "S=3]l osone z 3 a e ||2228 & & ||gsee a S 2EBE s s S88 3 Co ea ea 2 3 i = BS ||\\2f382"
    monkeypatch.setattr(ocr, "remote_ocr_available", lambda: False)
    monkeypatch.setattr(ocr, "local_ocr_available", lambda: True)
    monkeypatch.setattr(ocr, "_local_page", lambda payload, index: noise)

    recovered, illegible = ocr.ocr_pages_detailed(scanned_pdf(), [2])

    assert recovered == {}
    assert illegible == [2]

    scope = DocumentScope(
        page_count=2,
        pages_read=1,
        pages_unreadable=[2],
        passages_reviewed=3,
        possible_requirements=1,
        recommendations_not_converted=0,
        permissions_not_converted=0,
        background=2,
        duplicates=0,
        passages_needing_review=0,
    )
    lines = _limitations(scope, "circular.pdf", False, ocr_attempted=True, illegible_pages=[2])
    assert any("did not read as words" in line for line in lines)
    assert not any("returned no text" in line for line in lines)
