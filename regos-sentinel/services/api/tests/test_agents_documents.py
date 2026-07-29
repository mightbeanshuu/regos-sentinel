"""Tests for agents anchored on an uploaded document.

The properties under test: the same four read-only agents can be pointed at one
uploaded document; every such run records its anchor (document id, filename, content
fingerprint) and a verified hash chain; and an agent with nothing to do on a generic
document says so honestly — it never manufactures a resolution, a comparison or a
challenge out of material that is not there.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.test_documents import MANDATORY_TEXT, MIXED_TEXT, build_pdf, upload

SECRET = "test-session-secret-that-is-longer-than-thirty-two-bytes"

POINTER_TEXT = (
    "The closure of all findings shall follow the timelines stated in Table 19 of the "
    "framework issued by the authority for regulated entities."
)


@pytest.fixture(autouse=True)
def _no_ocr_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OCR_SPACE_API_KEY", raising=False)


def client() -> TestClient:
    return TestClient(create_app(SECRET))


def uploaded(active: TestClient, paragraphs: list[list[str]]) -> dict:
    response = upload(active, build_pdf(paragraphs))
    assert response.status_code == 201
    return response.json()


def runs_by_agent(state: dict) -> dict:
    return {run["agent_id"]: run for run in state["agent_runs"]}


# --------------------------------------------------------------------------- #
# The extractor reads the document's own passages
# --------------------------------------------------------------------------- #


def test_doc_scoped_extractor_produces_verified_findings_over_an_upload() -> None:
    active = client()
    document = uploaded(active, [[MANDATORY_TEXT]])

    state = active.post(
        f"/api/v1/agents/EXTRACTOR/run?document_id={document['id']}"
    ).json()

    run = runs_by_agent(state)["EXTRACTOR"]
    assert run["anchor_document_id"] == document["id"]
    assert run["anchor_filename"] == document["filename"]
    assert run["anchor_sha256"] == document["sha256"]
    assert run["chain_verified"] is True
    assert run["steps"], "a document run records real tool calls"
    assert document["id"] in run["goal"]

    passage_ids = {item["id"] for item in document["passages"]}
    read_ids = {
        step["tool_input"]["span_id"]
        for step in run["steps"]
        if step["tool"] in {"read_span", "analyse_span_timing"}
    }
    assert read_ids and read_ids <= passage_ids, "every call names one of the doc's passages"

    verdicts = [item for item in run["findings"] if item["kind"].startswith("TIMING_")]
    assert verdicts, "requirement-shaped passages get a timing verdict"
    assert all(item["provenance"] == "DETERMINISTIC" for item in verdicts)
    # MANDATORY_TEXT states seven days but no source-stated clock start marker,
    # so the verdict must be blocked rather than helpfully completed.
    assert any(item["kind"] == "TIMING_BLOCKED" for item in verdicts)


def test_an_upload_with_no_requirement_language_is_reported_empty_not_padded() -> None:
    background_only = [
        [
            "This annexure describes the layout of the reporting template used by "
            "entities when they present the results of their annual assessment."
        ]
    ]
    active = client()
    document = uploaded(active, background_only)

    state = active.post(
        f"/api/v1/agents/EXTRACTOR/run?document_id={document['id']}"
    ).json()

    run = runs_by_agent(state)["EXTRACTOR"]
    assert [item["kind"] for item in run["findings"]] == ["NOTHING_TO_ASSESS"]
    assert run["findings"][0]["accepted_by_gate"] is True
    assert run["findings"][0]["requires_human_review"] is False
    assert run["chain_verified"] is True


# --------------------------------------------------------------------------- #
# Honest degradation: resolver and scout on a generic document
# --------------------------------------------------------------------------- #


def test_the_resolver_records_no_resolvable_references_on_a_generic_document() -> None:
    active = client()
    document = uploaded(active, [[MANDATORY_TEXT]])

    state = active.post(
        f"/api/v1/agents/REFERENCE_RESOLVER/run?document_id={document['id']}"
    ).json()

    run = runs_by_agent(state)["REFERENCE_RESOLVER"]
    assert run["anchor_document_id"] == document["id"]
    assert [item["kind"] for item in run["findings"]] == ["NO_RESOLVABLE_REFERENCES"]
    finding = run["findings"][0]
    assert "No resolvable references in this document" in finding["summary"]
    assert finding["accepted_by_gate"] is True
    assert finding["citations"] == [], "nothing resolved means nothing cited"


def test_the_resolver_resolves_a_pointer_the_document_genuinely_names() -> None:
    active = client()
    document = uploaded(active, [[POINTER_TEXT]])

    state = active.post(
        f"/api/v1/agents/REFERENCE_RESOLVER/run?document_id={document['id']}"
    ).json()

    run = runs_by_agent(state)["REFERENCE_RESOLVER"]
    resolved = [item for item in run["findings"] if item["kind"] == "REFERENCE_RESOLVED"]
    assert len(resolved) == 1
    assert resolved[0]["citations"][0]["span_id"] == "CSCRF-TABLE-19"
    assert resolved[0]["accepted_by_gate"] is True


def test_the_scout_refuses_to_compare_an_upload_against_a_source_it_is_not() -> None:
    active = client()
    document = uploaded(active, [[MANDATORY_TEXT]])

    state = active.post(
        f"/api/v1/agents/SOURCE_SCOUT/run?document_id={document['id']}"
    ).json()

    run = runs_by_agent(state)["SOURCE_SCOUT"]
    kinds = [item["kind"] for item in run["findings"]]
    assert kinds == ["SOURCE_COMPARISON_NOT_APPLICABLE"]
    assert "No comparison was invented" in run["findings"][0]["detail"]
    assert not any(item["kind"] == "SOURCE_VERSION_DELTA" for item in run["findings"])


# --------------------------------------------------------------------------- #
# The adversary challenges the document's approved requirements
# --------------------------------------------------------------------------- #


def test_the_adversary_reports_nothing_to_challenge_before_any_approval() -> None:
    active = client()
    document = uploaded(active, [[MANDATORY_TEXT]])

    state = active.post(
        f"/api/v1/agents/ADVERSARY/run?document_id={document['id']}"
    ).json()

    run = runs_by_agent(state)["ADVERSARY"]
    assert [item["kind"] for item in run["findings"]] == ["NOTHING_TO_CHALLENGE"]
    assert "no human-approved requirements" in run["findings"][0]["detail"].lower()


def test_the_adversary_examines_an_approved_requirement_and_the_chain_holds() -> None:
    active = client()
    document = uploaded(active, [[MANDATORY_TEXT]])
    passage = next(
        item
        for item in document["passages"]
        if item["classification"] == "POSSIBLE_REQUIREMENT"
    )
    approved = active.post(
        f"/api/v1/documents/{document['id']}/requirements",
        json={
            "passage_id": passage["id"],
            "actor": "Regulated entity",
            "action": "close",
            "obligation_object": "high-severity finding",
            "duration_value": 7,
            "duration_unit": "days",
            "trigger": "Date the finding is recorded in the register",
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "reason": "The entity policy fixes the start event for this duty.",
        },
    )
    assert approved.status_code == 200

    state = active.post(
        f"/api/v1/agents/ADVERSARY/run?document_id={document['id']}"
    ).json()

    run = runs_by_agent(state)["ADVERSARY"]
    assert run["chain_verified"] is True
    assert [item["kind"] for item in run["findings"]] == ["CHALLENGE_SURVIVED"]
    # A trigger a person supplied is a human decision, not a claim about the source —
    # so it must not land as a challenge, and nothing blocks.
    challenges = active.get("/api/v1/agents/challenges").json()
    assert challenges["blocking"] is False


# --------------------------------------------------------------------------- #
# Run-all, anchoring, and the API surface
# --------------------------------------------------------------------------- #


def test_run_all_on_a_document_anchors_all_four_runs_and_the_audit_trail() -> None:
    active = client()
    document = uploaded(active, [[MANDATORY_TEXT, MIXED_TEXT]])

    state = active.post(
        f"/api/v1/agents/run-all?document_id={document['id']}"
    ).json()

    assert len(state["agent_runs"]) == 4
    for run in state["agent_runs"]:
        assert run["anchor_document_id"] == document["id"]
        assert run["anchor_filename"] == document["filename"]
        assert run["anchor_sha256"] == document["sha256"]
        assert run["chain_verified"] is True

    events = [
        item
        for item in state["audit_events"]
        if item["event_type"] == "AGENT_RUN_COMPLETED"
    ]
    assert len(events) == 4
    assert all(item["details"]["anchor_document_id"] == document["id"] for item in events)


def test_corpus_runs_carry_no_anchor_so_the_two_lenses_stay_distinct() -> None:
    active = client()

    state = active.post("/api/v1/agents/run-all").json()

    for run in state["agent_runs"]:
        assert run["anchor_document_id"] is None
        assert run["anchor_filename"] is None
        assert run["anchor_sha256"] is None
    events = [
        item
        for item in state["audit_events"]
        if item["event_type"] == "AGENT_RUN_COMPLETED"
    ]
    assert all(item["details"]["anchor_document_id"] == "none" for item in events)


def test_running_agents_against_a_missing_document_is_a_404_not_a_guess() -> None:
    active = client()

    response = active.post("/api/v1/agents/EXTRACTOR/run?document_id=DOC-404")

    assert response.status_code == 404
    assert "not in this session" in response.json()["detail"]


def test_streaming_a_document_run_records_the_same_anchored_run() -> None:
    active = client()
    document = uploaded(active, [[MANDATORY_TEXT]])

    with active.stream(
        "GET",
        f"/api/v1/agents/EXTRACTOR/stream?document_id={document['id']}",
    ) as response:
        assert response.status_code == 200
        body = "".join(response.iter_text())

    assert "event: call" in body
    assert "event: finding" in body
    assert "event: done" in body

    runs = active.get("/api/v1/agents/runs").json()
    extractor = next(item for item in runs if item["agent_id"] == "EXTRACTOR")
    assert extractor["anchor_document_id"] == document["id"]
    assert extractor["chain_verified"] is True


def test_document_runs_do_not_touch_controls_or_obligations() -> None:
    active = client()
    before = active.get("/api/v1/workspace").json()
    document = uploaded(active, [[MANDATORY_TEXT]])

    after = active.post(
        f"/api/v1/agents/run-all?document_id={document['id']}"
    ).json()

    assert after["controls"] == before["controls"]
    assert after["obligations"] == before["obligations"]
