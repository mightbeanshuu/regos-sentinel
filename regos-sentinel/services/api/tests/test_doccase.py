"""The document case — the Case A ritual generated from any uploaded circular.

The promises under test: selection is deterministic, disclosed, and honest when there
is nothing to select; the reviewer's reading is committed before the suggestion is
revealed and cannot be rewritten; approval resolves to an ordinary signed requirement
in the document's record, with a computed due date only when a policy and a date were
actually recorded.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app
from tests.test_documents import build_pdf, upload

SECRET = "test-session-secret-that-is-longer-than-thirty-two-bytes"

#: The defect — a mandatory duty stating a period and no clock-start.
PERIOD_ONLY_TEXT = "Critical patches shall be applied within one week."
#: A computable deadline, which must NOT be chosen as the case.
PERIOD_AND_TRIGGER_TEXT = (
    "The report shall be submitted within 30 days of the date of receipt of the notice."
)
BACKGROUND_TEXT = "This circular consolidates practices observed during the review cycle."

READING = {
    "reviewer_name": "Aditi Rao",
    "reviewer_role": "Compliance Officer",
    "independent_interpretation": (
        "The wording supports a one-week maximum but names no starting event; the "
        "clock-start is a firm policy decision."
    ),
    "trigger_policy": "The date the finding is recorded at discovery, per policy VM-07.",
}

APPROVAL = {
    "actor": "the regulated entity",
    "action": "apply",
    "obligation_object": "critical patches",
    "trigger_date": "2026-07-01",
    "reason": "Discovery dates are reliably recorded, so discovery is auditable.",
    "agrees_with_system_suggestion": True,
}


def client() -> TestClient:
    return TestClient(create_app(SECRET))


def case_pdf() -> bytes:
    return build_pdf([[PERIOD_ONLY_TEXT, PERIOD_AND_TRIGGER_TEXT, BACKGROUND_TEXT]])


def uploaded(active: TestClient) -> str:
    return upload(active, case_pdf()).json()["id"]


def test_the_case_picks_the_period_without_clock_start_passage() -> None:
    active = client()
    document_id = uploaded(active)

    response = active.post(f"/api/v1/documents/{document_id}/case")

    assert response.status_code == 201
    case = response.json()
    assert case["kind"] == "PERIOD_WITHOUT_CLOCK_START"
    assert PERIOD_ONLY_TEXT in case["text"]
    assert case["duration_label"] == "one week"
    assert case["duration_value"] == 1 and case["duration_unit"] == "weeks"
    assert case["model_verdict"] == "PERIOD_ONLY"
    assert case["rule_verdict"] == "PERIOD_WITHOUT_TRIGGER"
    assert case["verdicts_agree"] is True
    assert case["candidates_considered"] >= 1
    assert case["state"] == "READING_PENDING"
    # Nothing is revealed before the reading is committed.
    assert case["reading"] is None
    assert case["approval"] is None

    # Generating again returns the same case, not a new one.
    again = active.post(f"/api/v1/documents/{document_id}/case").json()
    assert again["passage_id"] == case["passage_id"]
    assert again["generated_at"] == case["generated_at"]


def test_a_document_with_no_defect_yields_no_case_and_says_so() -> None:
    active = client()
    document_id = upload(
        active, build_pdf([[PERIOD_AND_TRIGGER_TEXT, BACKGROUND_TEXT]])
    ).json()["id"]

    response = active.post(f"/api/v1/documents/{document_id}/case")

    assert response.status_code == 404
    assert "no Case A defect" in response.json()["detail"]


def test_approval_is_refused_until_a_reading_is_committed() -> None:
    active = client()
    document_id = uploaded(active)
    active.post(f"/api/v1/documents/{document_id}/case")

    response = active.post(f"/api/v1/documents/{document_id}/case/approve", json=APPROVAL)

    assert response.status_code == 409
    assert "Commit an independent reading" in response.json()["detail"]


def test_the_reading_precedes_the_reveal_and_cannot_be_rewritten() -> None:
    active = client()
    document_id = uploaded(active)
    active.post(f"/api/v1/documents/{document_id}/case")

    committed = active.post(
        f"/api/v1/documents/{document_id}/case/reading", json=READING
    ).json()

    assert committed["state"] == "READING_COMMITTED"
    assert committed["reading"]["reviewer_name"] == "Aditi Rao"
    suggestion = committed["reading"]["revealed_system_suggestion"]
    assert "names no event that starts it" in suggestion
    assert "read it the same way" in suggestion

    second = active.post(f"/api/v1/documents/{document_id}/case/reading", json=READING)
    assert second.status_code == 409
    assert "cannot be rewritten" in second.json()["detail"]


def test_approval_seals_the_case_and_lands_a_real_requirement() -> None:
    active = client()
    document_id = uploaded(active)
    active.post(f"/api/v1/documents/{document_id}/case")
    active.post(f"/api/v1/documents/{document_id}/case/reading", json=READING)

    sealed = active.post(
        f"/api/v1/documents/{document_id}/case/approve", json=APPROVAL
    ).json()

    assert sealed["state"] == "APPROVED"
    approval = sealed["approval"]
    assert approval["due_date"] == "2026-07-08", "one week after the recorded trigger date"
    assert approval["blocked_reason"] is None
    assert approval["reviewer_name"] == "Aditi Rao"

    document = active.get(f"/api/v1/documents/{document_id}").json()
    requirement = next(
        item for item in document["requirements"] if item["id"] == approval["requirement_id"]
    )
    assert requirement["computable"] is True
    assert requirement["trigger_provenance"] == "HUMAN_POLICY"
    assert requirement["duration_value"] == 1 and requirement["duration_unit"] == "weeks"
    assert document["state"] == "APPROVED"

    # A sealed case cannot be approved twice.
    again = active.post(f"/api/v1/documents/{document_id}/case/approve", json=APPROVAL)
    assert again.status_code == 409


def test_no_trigger_date_yields_an_honestly_blocked_requirement() -> None:
    active = client()
    document_id = uploaded(active)
    active.post(f"/api/v1/documents/{document_id}/case")
    active.post(f"/api/v1/documents/{document_id}/case/reading", json=READING)

    sealed = active.post(
        f"/api/v1/documents/{document_id}/case/approve",
        json={**APPROVAL, "trigger_date": None},
    ).json()

    assert sealed["state"] == "APPROVED"
    assert sealed["approval"]["due_date"] is None
    assert sealed["approval"]["blocked_reason"], "the missing date must be named"

    document = active.get(f"/api/v1/documents/{document_id}").json()
    requirement = document["requirements"][-1]
    assert requirement["computable"] is False
    assert requirement["trigger"] is None


def test_removing_the_document_removes_its_case() -> None:
    active = client()
    document_id = uploaded(active)
    active.post(f"/api/v1/documents/{document_id}/case")

    active.delete(f"/api/v1/documents/{document_id}")

    response = active.get(f"/api/v1/documents/{document_id}/case")
    assert response.status_code == 404
