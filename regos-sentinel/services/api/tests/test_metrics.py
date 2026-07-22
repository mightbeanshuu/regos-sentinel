"""Tests for the measured prototype metrics.

The metrics document is generated, never written by hand. These tests check that the
generator measures rather than asserts: the dataset is committed and fingerprinted, the
labels are honoured, every metric carries a scope and a limit, and the one number that
would be disqualifying if wrong is checked directly.
"""

from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from app.metrics import GOLD_SET_PATH, as_markdown, decide, load_gold_set, measure

REPO_ROOT = Path(__file__).resolve().parents[3]
METRICS_DOC = REPO_ROOT / "docs" / "METRICS.md"


def test_gold_set_is_committed_and_labelled_before_the_gate_sees_it() -> None:
    dataset, digest = load_gold_set()

    assert GOLD_SET_PATH.exists()
    assert len(digest) == 64
    assert len(dataset.cases) == 24
    assert len({item.id for item in dataset.cases}) == 24
    assert {item.origin for item in dataset.cases} == {"REVIEWED_SOURCE", "SYNTHETIC_PROBE"}
    assert {item.expected_behaviour for item in dataset.cases} == {
        "COMPILE",
        "DEFER_TO_HUMAN",
        "ADVISORY_ONLY",
        "NOT_APPLICABLE",
    }
    assert "carries no statistical claim" in dataset.scope


def test_the_gate_never_answers_a_case_the_label_says_to_defer() -> None:
    """The failure that would disqualify the product. Checked on every labelled case."""
    dataset, _ = load_gold_set()

    over_answered = [
        item
        for item in dataset.cases
        if item.expected_behaviour == "DEFER_TO_HUMAN" and decide(item) != "DEFER_TO_HUMAN"
    ]

    assert over_answered == []


def test_a_duration_without_a_stated_trigger_is_always_deferred() -> None:
    dataset, _ = load_gold_set()

    incomplete = [
        item
        for item in dataset.cases
        if item.applies_to_entity
        and item.strength.value in {"MANDATORY", "PROHIBITED"}
        and item.states_duration
        and not item.states_trigger
    ]

    assert incomplete, "the gold set must contain the case the product exists to handle"
    assert all(decide(item) == "DEFER_TO_HUMAN" for item in incomplete)


def test_advisory_strength_never_compiles_into_work() -> None:
    dataset, _ = load_gold_set()

    advisory = [
        item
        for item in dataset.cases
        if item.applies_to_entity and item.strength.value in {"RECOMMENDED", "PERMITTED"}
    ]

    assert advisory
    assert all(decide(item) == "ADVISORY_ONLY" for item in advisory)


def test_every_metric_carries_a_scope_a_command_and_a_limit() -> None:
    report = measure()

    assert report.case_count == 24
    assert len(report.dataset_sha256) == 64
    assert report.metrics
    for metric in report.metrics:
        assert metric.value.strip()
        assert metric.unit.strip()
        assert metric.dataset_scope.strip()
        assert metric.test_command.strip()
        assert metric.limitation.strip()
    assert "None of it is a production accuracy claim" in report.limitation


def test_measurement_is_reproducible_and_matches_the_committed_document() -> None:
    first = measure()
    second = measure()

    assert first.model_dump(mode="json") == second.model_dump(mode="json")
    assert METRICS_DOC.exists(), "run scripts/measure_prototype.py and commit docs/METRICS.md"
    assert METRICS_DOC.read_text(encoding="utf-8") == as_markdown(first), (
        "docs/METRICS.md is stale — regenerate it with scripts/measure_prototype.py"
    )


def test_the_reproducibility_and_abstention_metrics_report_the_safe_values() -> None:
    report = measure()
    values = {item.id: item.value for item in report.metrics}

    assert values["M04"] == "0"
    assert values["M07"] == "0"
    assert values["M12"].startswith("0 of ")
    assert values["M13"] == "identical"


def test_metrics_endpoint_serves_the_same_measured_report() -> None:
    client = TestClient(create_app("test-session-secret-that-is-longer-than-thirty-two-bytes"))

    payload = client.get("/api/v1/metrics").json()

    assert payload["case_count"] == 24
    assert payload == json.loads(measure().model_dump_json())
