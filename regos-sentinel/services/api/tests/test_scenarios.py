"""Tests for demonstration scenarios A–D, the corpus gates, and the AI split.

Each scenario definition names a test id. These are those tests: the promise a juror
can run. A scenario whose test does not exist is a screenshot, not a demonstration,
so :func:`test_every_scenario_names_a_test_that_exists` enforces the link.
"""

from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.corpus import GATE_SEQUENCE, corpus_reports
from app.main import create_app
from app.models import CorpusGateStatus, CorpusState, DeonticForce, Provenance, ScenarioId
from app.revision import REVISION_LEGAL_STATE, base_provisions, build_revision, diff_provisions
from app.scenarios import SCENARIOS, run_scenario
from app.seed import initial_state

TESTS_DIR = Path(__file__).parent


def client_for() -> TestClient:
    return TestClient(create_app("test-session-secret-that-is-longer-than-thirty-two-bytes"))


def approve(client: TestClient) -> dict:
    client.post("/api/v1/builds/run")
    client.post("/api/v1/references/scoped/resolve")
    client.post(
        "/api/v1/reviews/q17/reading",
        json={
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "independent_interpretation": "The duration is stated; the clock-start is not.",
            "trigger_policy": "Date the finding is recorded in the vulnerability register",
        },
    )
    return client.post(
        "/api/v1/reviews/q17/approve",
        json={
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "reason": "Q17 separates missing-patch findings from other VAPT observations.",
            "trigger_policy": "Date the finding is recorded in the vulnerability register",
            "trigger_date": "2026-07-22",
            "agrees_with_system_suggestion": True,
        },
    ).json()


# --------------------------------------------------------------------------- #
# The catalogue itself
# --------------------------------------------------------------------------- #


def test_scenario_catalogue_is_complete() -> None:
    """Every case carries all five parts. Four cases, no gaps."""
    assert [item.id for item in SCENARIOS] == [
        ScenarioId.A_MISSING_TRIGGER,
        ScenarioId.B_ADVISORY_LANGUAGE,
        ScenarioId.C_APPLICABILITY,
        ScenarioId.D_SOURCE_CHANGE,
    ]
    for scenario in SCENARIOS:
        assert scenario.citation_locator.strip()
        assert scenario.citation_quote.strip()
        assert scenario.expected_outcome.strip()
        assert scenario.seeded_data.strip()
        assert scenario.automated_test.startswith("tests/")
        assert scenario.reset_note.strip()
    assert sum(1 for item in SCENARIOS if item.guided) == 1


def test_every_scenario_names_a_test_that_exists() -> None:
    for scenario in SCENARIOS:
        path, _, node = scenario.automated_test.partition("::")
        source = (TESTS_DIR.parent / path).read_text(encoding="utf-8")
        assert f"def {node}(" in source, f"{scenario.id.value} names a missing test: {node}"


def test_catalogue_endpoint_lists_cases_and_case_a_needs_no_run() -> None:
    client = client_for()

    payload = client.get("/api/v1/scenarios").json()

    assert len(payload["scenarios"]) == 4
    assert "do not cover the SEBI corpus" in payload["note"]
    # Case A is the guided review; it reports rather than runs.
    assert [item["scenario_id"] for item in payload["outcomes"]] == ["A_MISSING_TRIGGER"]
    refused = client.post("/api/v1/scenarios/A_MISSING_TRIGGER/run")
    assert refused.status_code == 409
    assert "guided review" in refused.json()["detail"]


def test_case_a_never_shows_a_date_the_source_does_not_support() -> None:
    client = client_for()
    client.post("/api/v1/builds/run")

    before = client.get("/api/v1/scenarios/A_MISSING_TRIGGER/outcome").json()

    assert before["phase"] == "BEFORE_REVIEW"
    assert before["status"] == "SCENARIO_DEMONSTRATED"
    assert all(item["passed"] for item in before["checks"])

    approve(client)
    after = client.get("/api/v1/scenarios/A_MISSING_TRIGGER/outcome").json()

    assert after["phase"] == "AFTER_REVIEW"
    assert all(item["passed"] for item in after["checks"])
    assert "2026-07-29" in after["headline"]


# --------------------------------------------------------------------------- #
# Case B — advice must not become mandatory work
# --------------------------------------------------------------------------- #


def test_case_b_keeps_advice_out_of_mandatory_work() -> None:
    client = client_for()

    state = client.post("/api/v1/scenarios/B_ADVISORY_LANGUAGE/run").json()

    outcome = next(
        item for item in state["scenario_outcomes"] if item["scenario_id"] == "B_ADVISORY_LANGUAGE"
    )
    assert outcome["status"] == "SCENARIO_DEMONSTRATED"
    assert all(item["passed"] for item in outcome["checks"]), outcome["checks"]
    assert "No mandatory task created" in outcome["headline"]

    # The advisory is recorded, and it is not a failed control.
    assert state["vendor_slas"][0]["status"] == "ADVISORY_GAP"
    assert state["vendor_slas"][0]["advisory_reference_days"] == 7
    assert state["tasks"] == []

    strengths = {
        item["id"]: item["deontic_force"]
        for item in state["regulatory_statements"]
        if item["span_id"] == "FAQ-Q15"
    }
    assert strengths == {
        "STMT-Q15-REQUIREMENT": "MANDATORY",
        "STMT-Q15-SLA-ADVISORY": "RECOMMENDED",
        "STMT-Q15-VIRTUAL-PATCH": "PERMITTED",
    }


def test_case_b_holds_after_the_hero_review_creates_real_tasks() -> None:
    """The interesting version: tasks now exist, and none of them came from advice."""
    client = client_for()
    approve(client)

    state = client.post("/api/v1/scenarios/B_ADVISORY_LANGUAGE/run").json()

    outcome = next(
        item for item in state["scenario_outcomes"] if item["scenario_id"] == "B_ADVISORY_LANGUAGE"
    )
    assert len(state["tasks"]) == 2
    assert all(item["passed"] for item in outcome["checks"]), outcome["checks"]
    traced = next(item for item in outcome["checks"] if item["id"] == "B6")
    assert traced["observed"] == "0"


# --------------------------------------------------------------------------- #
# Case C — an exclusion is a decision, not an omission
# --------------------------------------------------------------------------- #


def test_case_c_receipts_an_exclusion() -> None:
    client = client_for()

    state = client.post("/api/v1/scenarios/C_APPLICABILITY/run").json()

    outcome = next(
        item for item in state["scenario_outcomes"] if item["scenario_id"] == "C_APPLICABILITY"
    )
    assert all(item["passed"] for item in outcome["checks"]), outcome["checks"]

    decisions = {item["id"]: item for item in outcome["applicability_decisions"]}
    assert len(decisions) == 4

    excluded = decisions["APD-Q14-QSB-PERIODICITY"]
    assert excluded["applies"] is False
    assert excluded["entity_fact"] == "is_qsb=false"
    assert "half-yearly" in excluded["citation"]["quote"]
    assert excluded["citation"]["locator"].startswith("FAQ dated 11 June 2025")
    assert excluded["reason"].strip()
    assert excluded["provenance"] == Provenance.DETERMINISTIC.value

    included = decisions["APD-Q15-VAPT-CLOSURE"]
    assert included["applies"] is True
    assert included["entity_fact"] == "entity_type=STOCK_BROKER"


def test_case_c_recomputes_when_the_entity_fact_changes() -> None:
    client = client_for()
    client.patch("/api/v1/entity/profile", json={"is_qsb": True, "reviewer_name": "Aditi Rao"})

    state = client.post("/api/v1/scenarios/C_APPLICABILITY/run").json()

    outcome = next(
        item for item in state["scenario_outcomes"] if item["scenario_id"] == "C_APPLICABILITY"
    )
    decisions = {item["id"]: item for item in outcome["applicability_decisions"]}
    assert decisions["APD-Q14-QSB-PERIODICITY"]["applies"] is True
    assert decisions["APD-Q14-QSB-PERIODICITY"]["entity_fact"] == "is_qsb=true"
    assert all(item["passed"] for item in outcome["checks"]), outcome["checks"]
    # The exclusion was not edited away — the whole decision was recomputed.
    assert len(state["periodicity_windows"]) == 2


# --------------------------------------------------------------------------- #
# Case D — a source version changes underneath a live control
# --------------------------------------------------------------------------- #


def test_case_d_reports_changes_without_applying_them() -> None:
    client = client_for()
    approved = approve(client)
    control_before = approved["controls"][0]

    state = client.post("/api/v1/scenarios/D_SOURCE_CHANGE/run").json()

    outcome = next(
        item for item in state["scenario_outcomes"] if item["scenario_id"] == "D_SOURCE_CHANGE"
    )
    assert all(item["passed"] for item in outcome["checks"]), outcome["checks"]

    kinds = [item["kind"] for item in outcome["source_changes"]]
    assert kinds.count("ADDED") == 1
    assert kinds.count("CHANGED") == 1
    assert kinds.count("SUPERSEDED") == 1
    assert kinds.count("UNCHANGED") == 3

    # Nothing was applied: the control is untouched by the change report.
    assert state["controls"][0] == control_before
    assert all(item["applied_automatically"] is False for item in outcome["source_changes"])
    assert all(
        item["review_required"] for item in outcome["source_changes"] if item["kind"] != "UNCHANGED"
    )

    # Every material change carries both sides of the comparison.
    for change in outcome["source_changes"]:
        if change["kind"] == "CHANGED":
            assert change["before_quote"] and change["after_quote"]
            assert change["before_strength"] == DeonticForce.RECOMMENDED.value
            assert change["after_strength"] == DeonticForce.MANDATORY.value
            assert change["creates_mandatory_work"] is True
            assert change["impacted_control_ids"] == ["CTRL-VAPT-07"]


def test_case_d_revision_is_labelled_as_prototype_text_not_sebi_text() -> None:
    revision, _ = build_revision(initial_state())

    assert revision.synthetic is True
    assert revision.legal_state == REVISION_LEGAL_STATE
    assert "NOT PUBLISHED BY SEBI" in revision.legal_state
    assert "Securities and Exchange Board of India" not in revision.authority
    assert "SEBI has not published it" in revision.disclaimer
    assert len(revision.base_content_sha256) == 64
    assert revision.base_content_sha256 != revision.revision_content_sha256


def test_case_d_escalates_a_disappearing_provision_rather_than_repealing_it() -> None:
    """A topic the revision neither restates nor supersedes is a question, not a repeal."""
    state = initial_state()
    base = base_provisions(state)
    kept = [item for item in base if item.subject_key != "vapt.virtual.patching"]

    changes = diff_provisions(state, base, kept)

    vanished = next(item for item in changes if item.subject_key == "vapt.virtual.patching")
    assert vanished.kind.value == "SUPERSEDED"
    assert vanished.review_required is True
    assert vanished.applied_automatically is False
    assert "never treated as a repeal" in vanished.note


def test_case_d_marks_impacted_evidence_for_review() -> None:
    client = client_for()
    client.post("/api/v1/builds/run")

    state = client.post("/api/v1/scenarios/D_SOURCE_CHANGE/run").json()

    assert all(item["status"] == "NEEDS_REVALIDATION" for item in state["evidence"])
    assert all("source-version change" in item["reason"] for item in state["evidence"])


# --------------------------------------------------------------------------- #
# Corpus packs and the eight gates
# --------------------------------------------------------------------------- #


def test_every_pack_is_measured_against_the_same_eight_gates() -> None:
    client = client_for()

    reports = client.get("/api/v1/corpus/packs").json()

    assert len(reports) == 3
    for report in reports:
        assert [gate["id"] for gate in report["gates"]] == [item[0] for item in GATE_SEQUENCE]
        assert report["gates_total"] == 8
        assert report["pack"]["authority"].strip()
        assert report["pack"]["legal_state"].strip()
        assert report["pack"]["extraction_scope"].strip()


def test_a_registered_pack_cannot_look_further_along_than_it_is() -> None:
    reports = {item.pack.id: item for item in corpus_reports(initial_state())}

    registered = reports["PACK-STOCK-BROKER-MC-2025"]
    assert registered.pack.status == CorpusState.REGISTERED
    assert registered.gates_passed == 1
    assert registered.gates[0].status == CorpusGateStatus.PASSED
    assert all(gate.status == CorpusGateStatus.NOT_RUN for gate in registered.gates[1:])
    assert registered.pack.indexed_span_count == 0
    assert registered.pack.compiled_candidate_count == 0


def test_the_hero_pack_clears_every_gate_once_a_build_is_approved() -> None:
    client = client_for()
    approve(client)

    reports = {item["pack"]["id"]: item for item in client.get("/api/v1/corpus/packs").json()}

    hero = reports["PACK-CSCRF-FAQ-HERO"]
    assert hero["gates_passed"] == 8
    assert all(gate["test_id"] for gate in hero["gates"])
    assert hero["pack"]["source_span_ids"]
    assert hero["pack"]["validation_tests"]


def test_the_upload_lane_declares_the_gates_it_deliberately_does_not_run() -> None:
    reports = {item.pack.id: item for item in corpus_reports(initial_state(), uploaded_count=0)}

    sandbox = reports["PACK-SESSION-UPLOAD-SANDBOX"]
    skipped = [gate for gate in sandbox.gates if gate.status == CorpusGateStatus.NOT_APPLICABLE]
    assert {gate.id for gate in skipped} == {"G4-OBLIGATION-EXTRACTION", "G6-APPLICABILITY"}
    assert "No model call runs on an uploaded file" in skipped[0].observed


# --------------------------------------------------------------------------- #
# AI assurance
# --------------------------------------------------------------------------- #


def test_assurance_reports_the_split_and_never_one_accuracy_number() -> None:
    client = client_for()

    report = client.get("/api/v1/assurance").json()

    assert "propose structure" in report["statement"]
    assert [stage["actor"] for stage in report["pipeline"]] == [
        "SOURCE",
        "AI",
        "DETERMINISTIC",
        "DETERMINISTIC",
        "HUMAN",
        "DETERMINISTIC",
    ]
    assert report["split"]["ai_does"] and report["split"]["deterministic_does"]
    assert report["split"]["human_does"]
    assert report["candidate_count"] == 3
    assert report["receipt"]["cache_hit"] is True
    assert "accuracy" not in report["statement"].lower()
    assert "prototype measurement" in report["limitation"]


def test_assurance_shows_the_gate_upholding_the_model_abstention() -> None:
    client = client_for()
    client.post("/api/v1/builds/run")

    before = client.get("/api/v1/assurance").json()

    patch = next(item for item in before["abstentions"] if item["candidate_id"] == "FAQ-Q17-A")
    assert patch["model_abstained"] is True
    assert patch["gate_upheld_abstention"] is True
    assert "no date exists" in next(
        item["resolution"]
        for item in before["field_outcomes"]
        if item["candidate_id"] == "FAQ-Q17-A" and item["field"] == "trigger"
    )

    approve(client)
    after = client.get("/api/v1/assurance").json()

    resolved = next(
        item
        for item in after["field_outcomes"]
        if item["candidate_id"] == "FAQ-Q17-A" and item["field"] == "trigger"
    )
    assert resolved["provenance_after_gates"] == Provenance.HUMAN_POLICY.value
    assert "named person" in resolved["resolution"]


def test_resetting_the_demo_clears_every_scenario_outcome() -> None:
    client = client_for()
    for scenario in ("B_ADVISORY_LANGUAGE", "C_APPLICABILITY", "D_SOURCE_CHANGE"):
        client.post(f"/api/v1/scenarios/{scenario}/run")

    state = client.post("/api/v1/demo/reset").json()

    assert state["scenario_outcomes"] == []
    assert state["vendor_slas"][0]["status"] == "NOT_EVALUATED"
    assert all(item["status"] == "CURRENT" for item in state["evidence"])


def test_running_a_scenario_twice_replaces_rather_than_stacks_its_outcome() -> None:
    state = initial_state()

    state = run_scenario(state, ScenarioId.C_APPLICABILITY)
    state = run_scenario(state, ScenarioId.C_APPLICABILITY)

    matching = [
        item
        for item in state.scenario_outcomes
        if item.scenario_id == ScenarioId.C_APPLICABILITY
    ]
    assert len(matching) == 1
