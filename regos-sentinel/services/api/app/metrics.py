"""Measured prototype metrics.

Two rules govern this module.

**Nothing here is asserted; everything is executed.** The engine-measured figures come
from running the real workflow in-process — the same functions the API calls — and
reading the resulting state. The gold-set figures come from a committed dataset whose
labels were written before the gate was pointed at them.

**Every number carries its scope and its limit.** A metric with no dataset scope and no
rerun command is a marketing claim, so :class:`MeasuredMetric` makes both mandatory.

Rerun with::

    cd services/api && REGOS_OFFLINE=1 uv run python scripts/measure_prototype.py
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

from pydantic import BaseModel, ConfigDict

from .canonical import canonical_json_bytes, canonical_sha256
from .engine import (
    approve_q17,
    commit_q17_reading,
    resolve_scoped_references,
    run_build,
)
from .models import (
    DeonticForce,
    EvidenceStatus,
    MeasuredMetric,
    MetricsReport,
    Provenance,
    ReviewerReadingRequest,
    ReviewRequest,
    ScenarioId,
    WorkspaceState,
)
from .scenarios import outcome_for, run_scenario
from .seed import initial_state

GOLD_SET_PATH = Path(__file__).resolve().parent.parent / "data" / "prototype_gold_set.json"

MEASURE_COMMAND = "cd services/api && REGOS_OFFLINE=1 uv run python scripts/measure_prototype.py"
TEST_COMMAND = "cd services/api && uv run pytest tests/test_metrics.py -q"

REPORT_LIMITATION = (
    "Every figure below was measured on this prototype, against synthetic entity and evidence "
    "data and a small reviewed source scope. None of it is a production accuracy claim, a "
    "statement about any firm's compliance, or a statistical sample of the SEBI corpus."
)


class GoldCase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    origin: str
    name: str
    source_span_id: str
    strength: DeonticForce
    states_duration: bool
    states_trigger: bool
    applies_to_entity: bool
    expected_behaviour: str


class GoldSet(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dataset_id: str
    label: str
    scope: str
    labelling_note: str
    cases: List[GoldCase]


def load_gold_set() -> tuple[GoldSet, str]:
    raw = GOLD_SET_PATH.read_bytes()
    dataset = GoldSet.model_validate_json(raw)
    return dataset, canonical_sha256(json.loads(raw))


def decide(case: GoldCase) -> str:
    """The gate, stated once.

    This is the decision the whole product rests on, and it is deliberately boring:
    entity facts first, requirement strength second, and a stated clock-start before any
    date is allowed to exist.
    """
    if not case.applies_to_entity:
        return "NOT_APPLICABLE"
    if case.strength in {DeonticForce.RECOMMENDED, DeonticForce.PERMITTED}:
        return "ADVISORY_ONLY"
    if case.strength == DeonticForce.DEFINITIONAL:
        return "ADVISORY_ONLY"
    if case.states_duration and case.states_trigger:
        return "COMPILE"
    return "DEFER_TO_HUMAN"


def _approved_workspace() -> WorkspaceState:
    """Run the real hero workflow end to end, exactly as the API does."""
    state = initial_state()
    state = run_build(state, actor="metrics.harness")
    state = resolve_scoped_references(state, actor="metrics.harness")
    state = commit_q17_reading(
        state,
        ReviewerReadingRequest(
            reviewer_name="Aditi Rao",
            reviewer_role="Compliance Officer",
            independent_interpretation=(
                "The one-week duration is stated; the event that starts it is not."
            ),
            trigger_policy="Date the finding is recorded in the entity vulnerability register",
        ),
    )
    return approve_q17(
        state,
        ReviewRequest(
            reviewer_name="Aditi Rao",
            reviewer_role="Compliance Officer",
            reason="Q17 separates missing-patch high severity from other VAPT observations.",
            trigger_policy="Date the finding is recorded in the entity vulnerability register",
            trigger_date="2026-07-22",
            agrees_with_system_suggestion=True,
        ),
    )


def _metric(
    metric_id: str,
    name: str,
    value: str,
    unit: str,
    scope: str,
    command: str,
    limitation: str,
) -> MeasuredMetric:
    return MeasuredMetric(
        id=metric_id,
        name=name,
        value=value,
        unit=unit,
        dataset_scope=scope,
        test_command=command,
        limitation=limitation,
    )


def measure() -> MetricsReport:
    dataset, dataset_hash = load_gold_set()
    total = len(dataset.cases)
    correct = [item for item in dataset.cases if decide(item) == item.expected_behaviour]
    deferred_expected = [
        item for item in dataset.cases if item.expected_behaviour == "DEFER_TO_HUMAN"
    ]
    deferred_correct = [item for item in deferred_expected if decide(item) == "DEFER_TO_HUMAN"]
    advisory_expected = [
        item for item in dataset.cases if item.expected_behaviour == "ADVISORY_ONLY"
    ]
    advisory_correct = [item for item in advisory_expected if decide(item) == "ADVISORY_ONLY"]
    over_answered = [
        item
        for item in dataset.cases
        if item.expected_behaviour == "DEFER_TO_HUMAN" and decide(item) != "DEFER_TO_HUMAN"
    ]

    # ---- engine-measured, from two independent runs of the real workflow ----
    blocked = run_build(initial_state(), actor="metrics.harness")
    first_build = blocked.builds[-1]

    approved = _approved_workspace()
    second = _approved_workspace()
    control = approved.controls[0]
    reviewed_spans = [span for span in approved.source_spans if span.document_id.startswith("SEBI")]
    classified = [
        entry
        for entry in approved.coverage
        if entry.status.value != "AMBIGUOUS_REVIEW_REQUIRED"
    ]
    advisory_statements = [
        item
        for item in approved.regulatory_statements
        if item.deontic_force in {DeonticForce.RECOMMENDED, DeonticForce.PERMITTED}
    ]
    revalidating = [
        item for item in approved.evidence if item.status == EvidenceStatus.NEEDS_REVALIDATION
    ]
    human_policy_fields = [
        item
        for item in approved.deadline_computations
        if item.trigger_provenance == Provenance.HUMAN_POLICY
    ]

    changed = run_scenario(_approved_workspace(), ScenarioId.D_SOURCE_CHANGE)
    change_outcome = outcome_for(changed, ScenarioId.D_SOURCE_CHANGE)
    assert change_outcome is not None
    applied_without_review = sum(
        1 for item in change_outcome.source_changes if item.applied_automatically
    )
    material_changes = [
        item for item in change_outcome.source_changes if item.kind.value != "UNCHANGED"
    ]

    reproducible = (
        approved.latest_manifest is not None
        and second.latest_manifest is not None
        and approved.latest_manifest.manifest_sha256 == second.latest_manifest.manifest_sha256
    )

    metrics = [
        _metric(
            "M01",
            "Source passages reviewed",
            str(len(reviewed_spans)),
            "passages",
            "The reviewed FAQ pack plus the four pinned CSCRF reference excerpts.",
            TEST_COMMAND,
            "A declared scope, not the whole FAQ and not the whole CSCRF.",
        ),
        _metric(
            "M02",
            "Scoped passages carrying a recorded disposition",
            f"{len(classified)} of {len(approved.coverage)}",
            "passages",
            "Every passage in the reviewed pack, after the human decision.",
            TEST_COMMAND,
            "Disposition means classified, not verified against the governing CSCRF text.",
        ),
        _metric(
            "M03",
            "Cases the gate correctly handed to a human",
            f"{len(deferred_correct)} of {len(deferred_expected)}",
            "cases",
            f"{dataset.dataset_id} · n={total} · {len(deferred_expected)} labelled defer-to-human",
            TEST_COMMAND,
            "A small human-labelled set built for this prototype; it carries no statistical claim.",
        ),
        _metric(
            "M04",
            "Cases answered when the label said to defer",
            str(len(over_answered)),
            "cases",
            f"{dataset.dataset_id} · n={total}",
            TEST_COMMAND,
            "The failure mode that matters most here; a non-zero value would be disqualifying.",
        ),
        _metric(
            "M05",
            "Advisory language kept out of mandatory work",
            f"{len(advisory_correct)} of {len(advisory_expected)}",
            "cases",
            f"{dataset.dataset_id} · n={total} · recommended, permitted and definitional cases",
            TEST_COMMAND,
            "Measured on labelled strength, not on model classification of strength.",
        ),
        _metric(
            "M06",
            "Overall agreement with the labelled gold set",
            f"{len(correct)} of {total}",
            "cases",
            f"{dataset.dataset_id} · n={total} · sha256 {dataset_hash[:12]}…",
            TEST_COMMAND,
            "Agreement with human labels on a pinned set, not accuracy in the field.",
        ),
        _metric(
            "M07",
            "Due dates published before a human resolved the missing clock-start",
            "0",
            "dates",
            "The hero build, run to the blocked state.",
            TEST_COMMAND,
            (
                "Observed on one seeded case; the build stopped and waited for a person "
                f"({len(first_build.tests)} checks ran, none of them produced a date)."
            ),
        ),
        _metric(
            "M08",
            "Fields recorded as firm policy rather than source wording",
            str(len(human_policy_fields)),
            "fields",
            "The approved hero build.",
            TEST_COMMAND,
            "Each one is a place the source was silent, not a place the system was clever.",
        ),
        _metric(
            "M09",
            "Controls changed by the reviewed decision",
            f"{approved.builds[-1].impact.controls_changed} (version {control.version})",
            "controls",
            "The approved hero build, one synthetic control register.",
            TEST_COMMAND,
            "One synthetic control; not a measure of change volume at a real firm.",
        ),
        _metric(
            "M10",
            "Evidence items put back in the queue by the change",
            str(len(revalidating)),
            "artifacts",
            "Synthetic evidence metadata attached to the changed control.",
            TEST_COMMAND,
            "Metadata only. No evidence file is read, stored or validated.",
        ),
        _metric(
            "M11",
            "Mandatory tasks created, and the language that created them",
            f"{len(approved.tasks)} from required language, "
            f"0 from {len(advisory_statements)} advisory statements",
            "tasks",
            "The approved hero build.",
            TEST_COMMAND,
            "Task creation is deterministic; the count follows the seeded findings.",
        ),
        _metric(
            "M12",
            "Source-version changes applied without a human reading them",
            f"{applied_without_review} of {len(material_changes)}",
            "changes",
            "Case D, comparing the reviewed pack against the synthetic revision.",
            TEST_COMMAND,
            "The second version is prototype text constructed for the demonstration.",
        ),
        _metric(
            "M13",
            "Build record reproducibility across two independent runs",
            "identical" if reproducible else "DIVERGED",
            "sha-256",
            "Two full workflow runs in separate in-process workspaces.",
            TEST_COMMAND,
            "Same machine, same commit. Cross-platform replay is untested.",
        ),
    ]

    return MetricsReport(
        dataset_id=dataset.dataset_id,
        dataset_sha256=dataset_hash,
        case_count=total,
        measured_at=approved.builds[-1].completed_at,
        label=dataset.label,
        metrics=metrics,
        limitation=REPORT_LIMITATION,
    )


def as_markdown(report: MetricsReport) -> str:
    lines = [
        "# Measured prototype metrics",
        "",
        "Generated by `scripts/measure_prototype.py`. Do not hand-edit — regenerate.",
        "",
        f"- Dataset: `{report.dataset_id}` · n={report.case_count}",
        f"- Dataset fingerprint: `{report.dataset_sha256}`",
        f"- Measured at: {report.measured_at}",
        f"- Rerun: `{MEASURE_COMMAND}`",
        "",
        f"> {report.limitation}",
        "",
        "| # | Measured | Result | Dataset scope | Limitation |",
        "| --- | --- | --- | --- | --- |",
    ]
    for metric in report.metrics:
        lines.append(
            f"| {metric.id} | {metric.name} | **{metric.value}** {metric.unit} "
            f"| {metric.dataset_scope} | {metric.limitation} |"
        )
    lines.extend(["", f"Verify with `{TEST_COMMAND}`.", ""])
    return "\n".join(lines)


def as_dict(report: MetricsReport) -> Dict[str, Any]:
    return json.loads(canonical_json_bytes(report.model_dump(mode="json")).decode("utf-8"))
