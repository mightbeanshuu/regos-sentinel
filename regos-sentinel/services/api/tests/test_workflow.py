import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.canonical import verify_embedded_sha256
from app.main import create_app
from app.models import DeadlineComputation
from app.seed import initial_state
from app.store import StateStore


def client_for(tmp_path: Path) -> TestClient:
    return TestClient(create_app(tmp_path / "workspace.json"))


def test_json_demo_store_archives_a_prior_schema_before_reseeding(tmp_path: Path) -> None:
    path = tmp_path / "workspace.json"
    payload = initial_state().model_dump(mode="json")
    payload["schema_version"] = "obligation-schema/0.9.0"
    path.write_text(json.dumps(payload))

    store = StateStore(path)

    assert store.load().schema_version == "obligation-schema/1.1.0"
    backup = tmp_path / "workspace.schema-obligation-schema-0.9.0.bak.json"
    assert backup.exists()
    assert json.loads(backup.read_text())["schema_version"] == "obligation-schema/0.9.0"


def approved_state(client: TestClient) -> dict:
    client.post("/api/v1/builds/run")
    client.post("/api/v1/references/scoped/resolve")
    client.post(
        "/api/v1/reviews/q17/reading",
        json={
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "independent_interpretation": (
                "The one-week duration is explicit while the start event is not stated."
            ),
            "trigger_policy": "Proactive discovery date recorded by vulnerability management",
        },
    )
    return client.post(
        "/api/v1/reviews/q17/approve",
        json={
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "reason": "The cited Q17 branches support the corrected conditional control.",
            "trigger_policy": "Proactive discovery date recorded by vulnerability management",
            "trigger_date": "2026-07-22",
            "agrees_with_system_suggestion": True,
        },
    ).json()


def test_build_fails_closed_before_human_review(tmp_path: Path) -> None:
    client = client_for(tmp_path)

    response = client.post("/api/v1/builds/run")

    assert response.status_code == 200
    state = response.json()
    build = state["builds"][-1]
    assert build["status"] == "BLOCKED_AWAITING_HUMAN"
    assert build["headline"] == "One-week rule has no source-stated clock start"
    blocked_ids = {item["id"] for item in build["tests"] if item["status"] == "BLOCK"}
    assert "TEST-COVERAGE-001" in blocked_ids
    assert "TEST-PATCH-BRANCH-001" in blocked_ids
    assert "TEST-HUMAN-REVIEW-001" in blocked_ids
    assert "TEST-REFERENCE-CLOSURE-001" in blocked_ids
    assert "TEST-DEADLINE-TRACE-001" in blocked_ids
    patch_computation = next(
        item for item in state["deadline_computations"] if item["finding_id"] == "FND-PATCH-001"
    )
    assert patch_computation["computable"] is False
    assert patch_computation["due_date"] is None
    assert patch_computation["trigger_provenance"] is None
    assert patch_computation["blocked_reason"] == "trigger not stated in source"
    assert state["latest_manifest"] is None


def test_system_suggestion_is_absent_from_payload_until_reading_is_committed(
    tmp_path: Path,
) -> None:
    client = client_for(tmp_path)
    initial_payload = client.get("/api/v1/workspace").text
    client.post("/api/v1/builds/run")
    resolved_payload = client.post("/api/v1/references/scoped/resolve").text

    protected_text = (
        "Q17(a) supports a one-week duration for high-severity missing-patch findings"
    )
    assert protected_text not in initial_payload
    assert protected_text not in resolved_payload
    assert "revealed_system_suggestion" not in initial_payload
    assert "revealed_system_suggestion" not in resolved_payload

    response = client.post(
        "/api/v1/reviews/q17/reading",
        json={
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "independent_interpretation": (
                "The duration is stated but the event that starts the clock is absent."
            ),
            "trigger_policy": "Proactive discovery date recorded by vulnerability management",
        },
    )

    assert response.status_code == 200
    assert protected_text in response.text
    reading = response.json()["reviewer_readings"][0]
    assert reading["committed_at"] < reading["system_suggestion_revealed_at"]


def test_review_persists_split_and_propagates_impact(tmp_path: Path) -> None:
    client = client_for(tmp_path)
    client.post("/api/v1/builds/run")
    resolved_response = client.post("/api/v1/references/scoped/resolve")
    assert resolved_response.status_code == 200
    resolved_state = resolved_response.json()
    assert len(resolved_state["references"]) == 4
    assert all(item["status"] == "RESOLVED_HASHED" for item in resolved_state["references"])
    assert all(len(item["target_hash"]) == 64 for item in resolved_state["references"])
    assert {item["target_span_id"] for item in resolved_state["references"]} == {
        "CSCRF-TABLE-19",
        "CSCRF-PR-MA-G6",
        "CSCRF-ANNEXURE-A",
        "CSCRF-PR-MA-S3",
    }
    reading_response = client.post(
        "/api/v1/reviews/q17/reading",
        json={
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "independent_interpretation": (
                "The one-week duration is source-explicit, but its clock-start is not."
            ),
            "trigger_policy": "Proactive discovery date recorded by vulnerability management",
        },
    )
    assert reading_response.status_code == 200

    response = client.post(
        "/api/v1/reviews/q17/approve",
        json={
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "reason": (
                "Q17 expressly separates missing-patch high-severity findings from "
                "other VAPT observations."
            ),
            "trigger_policy": "Proactive discovery date recorded by vulnerability management",
            "trigger_date": "2026-07-22",
            "agrees_with_system_suggestion": True,
        },
    )

    assert response.status_code == 200
    state = response.json()
    build = state["builds"][-1]
    assert build["status"] == "APPROVED"
    assert all(item["status"] == "PASS" for item in build["tests"])
    assert build["impact"] == {
        "controls_changed": 1,
        "vendor_sla_advisories": 1,
        "evidence_revalidation": 1,
        "tasks_created": 2,
    }

    active = {item["id"]: item for item in state["obligations"] if item["status"] == "ACTIVE"}
    assert active["OBL-PATCH-HIGH-001"]["deadline"]["duration"] == 1
    assert active["OBL-PATCH-HIGH-001"]["deadline"]["unit"] == "week"
    assert active["OBL-VAPT-OTHER-001"]["deadline"]["duration"] == 3
    assert state["vendor_slas"][0]["status"] == "ADVISORY_REVIEW"
    assert state["evidence"][0]["status"] == "NEEDS_REVALIDATION"
    due_dates = {item["finding_id"]: item["due_date"] for item in state["deadline_computations"]}
    assert due_dates == {
        "FND-PATCH-001": "2026-07-29",
        "FND-CONFIG-001": "2026-10-20",
    }
    patch_trace = next(
        item for item in state["deadline_computations"] if item["finding_id"] == "FND-PATCH-001"
    )
    assert patch_trace["trigger_provenance"] == "HUMAN_POLICY"
    assert patch_trace["trigger_label"] == (
        "Proactive discovery date recorded by vulnerability management"
    )
    assert patch_trace["human_policy_note"] == (
        "Q17 expressly separates missing-patch high-severity findings from other VAPT observations."
    )
    sla_statement = next(
        item for item in state["regulatory_statements"] if item["id"] == "STMT-Q15-SLA-ADVISORY"
    )
    assert sla_statement["deontic_force"] == "RECOMMENDED"
    assert sla_statement["operational_effect"] == "ADVISORY_ONLY_NO_COMPLIANCE_FAILURE"
    assert len(state["reviewer_readings"]) == 1
    assert state["reviews"][0]["independent_reading_id"] == "READ-Q17-001"
    assert state["reviews"][0]["reviewer_agreement"] is True
    assert state["latest_manifest"]["reproducibility"]["model_provider"] == (
        "NONE_FOR_DETERMINISTIC_DEMO_PATH"
    )


def test_manifest_is_unavailable_until_build_approved(tmp_path: Path) -> None:
    client = client_for(tmp_path)
    assert client.get("/api/v1/manifests/latest").status_code == 409
    client.post("/api/v1/builds/run")
    assert client.get("/api/v1/manifests/latest").status_code == 409
    assert (
        client.post(
            "/api/v1/reviews/q17/approve",
            json={
                "reviewer_name": "Aditi Rao",
                "reviewer_role": "Compliance Officer",
                "reason": "The cited Q17 branches support a conditional rule.",
                "trigger_policy": "Proactive discovery date in the entity policy",
                "trigger_date": "2026-07-22",
                "agrees_with_system_suggestion": True,
            },
        ).status_code
        == 409
    )
    client.post("/api/v1/references/scoped/resolve")
    assert (
        client.post(
            "/api/v1/reviews/q17/approve",
            json={
                "reviewer_name": "Aditi Rao",
                "reviewer_role": "Compliance Officer",
                "reason": "The cited Q17 branches support the corrected conditional control.",
                "trigger_policy": ("Proactive discovery date recorded by vulnerability management"),
                "trigger_date": "2026-07-22",
                "agrees_with_system_suggestion": True,
            },
        ).status_code
        == 409
    )
    client.post(
        "/api/v1/reviews/q17/reading",
        json={
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "independent_interpretation": (
                "The one-week duration is explicit while the start event is not stated."
            ),
            "trigger_policy": "Proactive discovery date recorded by vulnerability management",
        },
    )

    client.post(
        "/api/v1/reviews/q17/approve",
        json={
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "reason": "The cited Q17 branches support the corrected conditional control.",
            "trigger_policy": "Proactive discovery date recorded by vulnerability management",
            "trigger_date": "2026-07-22",
            "agrees_with_system_suggestion": True,
        },
    )
    response = client.get("/api/v1/manifests/latest")
    assert response.status_code == 200
    manifest = response.json()
    assert manifest["build_id"] == "BUILD-0003"
    assert len(manifest["manifest_sha256"]) == 64
    assert len(manifest["reproducibility"]["replay_input_sha256"]) == 64
    verification = client.post("/api/v1/manifest/verify", json=manifest)
    assert verification.status_code == 200
    assert verification.json()["match"] is True
    tampered = {**manifest, "build_id": "BUILD-TAMPERED"}
    assert client.post("/api/v1/manifest/verify", json=tampered).json()["match"] is False

    validation = client.get("/api/v1/exports/oscal/validation")
    assert validation.status_code == 200
    assert validation.json()["valid"] is True
    assert validation.json()["schema_version"] == "1.2.2"
    assert validation.json()["scope"] == "HERO_BUILD_ONLY"
    assert len(validation.json()["schema_sha256"]) == 64

    oscal = client.get("/api/v1/exports/oscal/assessment-results")
    assert oscal.status_code == 200
    artifact = oscal.json()["assessment-results"]
    assert artifact["metadata"]["oscal-version"] == "1.2.2"
    assert len(artifact["results"][0]["observations"]) == 11


def test_benchmark_reports_measured_small_golden_set(tmp_path: Path) -> None:
    client = client_for(tmp_path)
    client.post("/api/v1/builds/run")
    client.post("/api/v1/references/scoped/resolve")
    client.post(
        "/api/v1/reviews/q17/reading",
        json={
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "independent_interpretation": (
                "The one-week duration is explicit while the start event is not stated."
            ),
            "trigger_policy": "Proactive discovery date recorded by vulnerability management",
        },
    )
    client.post(
        "/api/v1/reviews/q17/approve",
        json={
            "reviewer_name": "Aditi Rao",
            "reviewer_role": "Compliance Officer",
            "reason": "The cited Q17 branches support the corrected conditional control.",
            "trigger_policy": "Proactive discovery date recorded by vulnerability management",
            "trigger_date": "2026-07-22",
            "agrees_with_system_suggestion": True,
        },
    )
    response = client.post("/api/v1/benchmarks/run")
    assert response.status_code == 200
    benchmark = response.json()["latest_benchmark"]
    assert benchmark["passed"] == 8
    assert benchmark["failed"] == 0
    assert benchmark["label"] == "SMALL HUMAN-VERIFIED GOLDEN SET · n=8 · SCOPE-LIMITED"
    assert [
        (
            point["setting"],
            point["answered_pct"],
            point["error_rate_on_answered"],
            point["deferred_pct"],
        )
        for point in benchmark["operating_points"]
    ] == [
        ("CONSERVATIVE", 75.0, 0.0, 25.0),
        ("BALANCED", 87.5, 0.0, 12.5),
        ("PERMISSIVE", 100.0, 12.5, 0.0),
    ]


def test_reset_returns_to_unreviewed_state(tmp_path: Path) -> None:
    client = client_for(tmp_path)
    client.post("/api/v1/builds/run")
    response = client.post("/api/v1/demo/reset")
    assert response.status_code == 200
    state = response.json()
    assert state["builds"] == []
    assert state["reviews"] == []
    assert state["reviewer_readings"] == []
    assert state["vendor_slas"][0]["status"] == "NOT_EVALUATED"
    packs = {item["id"]: item for item in state["corpus_packs"]}
    expansion = packs["PACK-STOCK-BROKER-MC-2025"]
    assert expansion["status"] == "SOURCE_REGISTERED_NOT_COMPILED"
    assert expansion["indexed_span_count"] == 0
    assert expansion["compiled_candidate_count"] == 0
    assert len(expansion["content_identity_sha256"]) == 64


def test_qsb_periodicity_uses_financial_year_halves(tmp_path: Path) -> None:
    client = client_for(tmp_path)

    response = client.patch(
        "/api/v1/entity/profile",
        json={"is_qsb": True, "reviewer_name": "Aditi Rao"},
    )

    assert response.status_code == 200
    state = response.json()
    assert state["entity_profile"]["is_qsb"] is True
    assert [
        (window["period_start"], window["period_end"]) for window in state["periodicity_windows"]
    ] == [
        ("2026-04-01", "2026-09-30"),
        ("2026-10-01", "2027-03-31"),
    ]
    assert all(
        window["calculation_basis"] == "INDIAN_FINANCIAL_YEAR_HALVES_NOT_ROLLING_SIX_MONTHS"
        for window in state["periodicity_windows"]
    )
    assert all(len(window["citations"]) == 2 for window in state["periodicity_windows"])

    response = client.patch(
        "/api/v1/entity/profile",
        json={"is_qsb": False, "reviewer_name": "Aditi Rao"},
    )
    assert response.json()["periodicity_windows"] == []


def test_applicability_hard_cases_generate_receipts(tmp_path: Path) -> None:
    client = client_for(tmp_path)

    response = client.patch(
        "/api/v1/applicability/scenario",
        json={
            "has_second_registration": True,
            "has_dormant_license": True,
            "reviewer_name": "Aditi Rao",
        },
    )

    assert response.status_code == 200
    state = response.json()
    assert state["entity_profile"]["cscrf_category"] == "MID-SIZE RE"
    assert len(state["entity_profile"]["registrations"]) == 3
    receipts = {item["id"]: item for item in state["applicability_scenarios"]}
    assert receipts["APP-Q24-MULTI-REG"]["activated"] is True
    assert receipts["APP-Q24-MULTI-REG"]["decision"] == ("HIGHEST_CATEGORY_APPLIED:MID-SIZE RE")
    assert receipts["APP-Q25-DORMANT-LICENCE"]["activated"] is True
    assert receipts["APP-Q25-DORMANT-LICENCE"]["decision"] == (
        "REMAINS_IN_SCOPE_SUBJECT_TO_HUMAN_CONFIRMATION"
    )
    coverage = {item["span_id"]: item["status"] for item in state["coverage"]}
    assert coverage["FAQ-Q24"] == "COMPILED_OBLIGATION"
    assert coverage["FAQ-Q25"] == "COMPILED_OBLIGATION"


def test_uncomputable_deadline_rejects_due_date_and_policy_note() -> None:
    blocked = initial_state().deadline_computations[0].model_dump(mode="json")
    assert blocked["computable"] is False

    with pytest.raises(ValidationError, match="cannot contain a due date"):
        DeadlineComputation(**{**blocked, "due_date": "2026-07-29"})

    with pytest.raises(ValidationError, match="Human policy notes require"):
        DeadlineComputation(**{**blocked, "human_policy_note": "Assumed from discovery"})


def test_committed_golden_manifest_replays_byte_for_byte() -> None:
    fixture = Path(__file__).parent / "fixtures" / "golden-manifest.json"
    payload = json.loads(fixture.read_text())
    result = verify_embedded_sha256(payload)

    assert result["match"] is True
    assert result["recomputed_sha256"] == (
        "767a935da9310726222f325d42dc7fb06517339119a0fa364dcb0a5664be8f74"
    )


def test_same_workflow_produces_identical_manifest_hashes(tmp_path: Path) -> None:
    first = approved_state(client_for(tmp_path / "first"))
    second = approved_state(client_for(tmp_path / "second"))

    assert (
        first["latest_manifest"]["manifest_sha256"]
        == (second["latest_manifest"]["manifest_sha256"])
    )
    assert (
        first["latest_manifest"]["reproducibility"]["replay_input_sha256"]
        == (second["latest_manifest"]["reproducibility"]["replay_input_sha256"])
    )
