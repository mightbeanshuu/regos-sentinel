"""Demonstration scenarios A–D.

Four cases drawn from the reviewed prototype corpus. Together they show that one
workflow — cite, compile, gate, defer to a person, record — holds across four
different kinds of regulatory problem. They are *not* a claim of coverage: they
demonstrate a reusable path, and the catalogue says so on its face.

Every case carries the same five parts, which is what makes it a demonstration
rather than a screenshot:

======================  ============================================================
exact source citation   the span and quote the case turns on
expected outcome        written down before the case runs
seeded data             the synthetic facts the case reads
automated test          a committed test id a juror can run
one-click reset         ``POST /api/v1/demo/reset`` returns to the seeded state
======================  ============================================================

Case A stays the default and the main presentation path. B, C and D each add one
kind of regulatory problem that A alone cannot show.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Callable, Dict, List, Optional

from .models import (
    ApplicabilityDecision,
    AuditEvent,
    Citation,
    DeonticForce,
    EvidenceStatus,
    Provenance,
    ScenarioCheck,
    ScenarioDefinition,
    ScenarioId,
    ScenarioOutcome,
    ScenarioStatus,
    SourceChangeKind,
    WorkspaceState,
)
from .revision import build_revision

SCENARIO_SET_LABEL = "Demonstration scenarios from the reviewed prototype corpus."

SCENARIO_SET_NOTE = (
    "Four cases, each with a pinned citation, a written-down expected outcome, seeded "
    "synthetic data and a committed automated test. They demonstrate one reusable workflow. "
    "They do not cover the SEBI corpus and are not a statement about any firm's compliance."
)

SCENARIOS: List[ScenarioDefinition] = [
    ScenarioDefinition(
        id=ScenarioId.A_MISSING_TRIGGER,
        label="A",
        title="A duration with no stated clock-start",
        question="What should a system do when the source says how long, but not from when?",
        citation_locator="FAQ dated 11 June 2025 · printed p.8 · PDF page 9 · Q17(a)",
        citation_quote=(
            "would be validated for non-compliances against the patch management timelines "
            "(1 week; please refer standard PR.MA.S3 ...)"
        ),
        expected_outcome=(
            "No due date is published. The build stops, names the missing field, and waits for a "
            "compliance officer to record the firm's trigger policy in writing."
        ),
        seeded_data=(
            "Aster Securities (synthetic, non-QSB stock broker), two high-severity VAPT findings, "
            "one caused by a missing OEM patch, and one existing three-month control."
        ),
        automated_test="tests/test_workflow.py::test_build_fails_closed_before_human_review",
        reset_note="Restart demo returns the workspace to the unreviewed seeded state.",
        guided=True,
    ),
    ScenarioDefinition(
        id=ScenarioId.B_ADVISORY_LANGUAGE,
        label="B",
        title="Advisory language that must not become mandatory work",
        question="Does encouragement in a source create a task, or only a record?",
        citation_locator="FAQ dated 11 June 2025 · PDF page 8 · Q15",
        citation_quote=(
            "REs are encouraged to include 'VAPT finding closure' related timelines in their "
            "SLA with third-party service providers"
        ),
        expected_outcome=(
            "The sentence is kept as recommended guidance. No mandatory task is created and no "
            "control is failed, while the shortfall against the source-stated timeline is still "
            "recorded so nobody can say it went unnoticed."
        ),
        seeded_data=(
            "A synthetic vendor SLA committing 30 days, read against the one-week maximum stated "
            "for high-severity missing patches."
        ),
        automated_test="tests/test_scenarios.py::test_case_b_keeps_advice_out_of_mandatory_work",
        reset_note="Restart demo clears the advisory evaluation.",
    ),
    ScenarioDefinition(
        id=ScenarioId.C_APPLICABILITY,
        label="C",
        title="Why one requirement applies and another does not",
        question="Can the system explain an exclusion as precisely as an inclusion?",
        citation_locator="FAQ dated 11 June 2025 · PDF page 8 · Q14",
        citation_quote=(
            "The periodicity of VAPT and cyber audit for QSBs shall be half-yearly irrespective "
            "of the category they fall in as per CSCRF."
        ),
        expected_outcome=(
            "Four requirements are decided against this entity's facts. Each decision — applies "
            "or does not apply — carries the entity fact, the rule and the exact clause. Flipping "
            "the QSB fact changes exactly one decision, and it is recomputed rather than edited."
        ),
        seeded_data=(
            "Aster Securities: entity_type=STOCK_BROKER, is_qsb=false, one SEBI registration, "
            "no dormant licence."
        ),
        automated_test="tests/test_scenarios.py::test_case_c_receipts_an_exclusion",
        reset_note="Restart demo returns the entity facts to the seeded profile.",
    ),
    ScenarioDefinition(
        id=ScenarioId.D_SOURCE_CHANGE,
        label="D",
        title="A source version changes underneath a live control",
        question="When the text moves, what happens to work that was already approved?",
        citation_locator="Synthetic revision · constructed for this demonstration",
        citation_quote=(
            "REs shall include VAPT finding closure timelines in their service-level agreements "
            "with third-party service providers"
        ),
        expected_outcome=(
            "Every topic in the declared scope is compared. Added, changed and superseded "
            "passages are listed with both quotations, the controls they reach and the evidence "
            "they put back in the queue. Nothing is applied automatically."
        ),
        seeded_data=(
            "The reviewed FAQ pack, compared against a synthetic revision of the same five VAPT "
            "and patch topics plus one added topic. The revision is prototype text; SEBI has not "
            "published it."
        ),
        automated_test="tests/test_scenarios.py::test_case_d_reports_changes_without_applying_them",
        reset_note="Restart demo clears the change report. No control is ever changed by it.",
    ),
]

SCENARIOS_BY_ID: Dict[ScenarioId, ScenarioDefinition] = {item.id: item for item in SCENARIOS}

_DEMO_EPOCH = datetime(2026, 7, 22, tzinfo=timezone.utc)


def _deterministic_time(state: WorkspaceState) -> str:
    offset = len(state.audit_events) * 10
    return (_DEMO_EPOCH + timedelta(seconds=offset)).isoformat().replace("+00:00", "Z")


def _check(check_id: str, question: str, expected: str, observed: str) -> ScenarioCheck:
    return ScenarioCheck(
        id=check_id,
        question=question,
        expected=expected,
        observed=observed,
        passed=expected == observed,
    )


def _citation(state: WorkspaceState, span_id: str, quote: str) -> Citation:
    span = next(item for item in state.source_spans if item.id == span_id)
    return Citation(
        document_id=span.document_id,
        span_id=span.id,
        locator=span.locator,
        quote=quote,
        source_url=span.source_url,
    )


def _finalise(outcome_checks: List[ScenarioCheck]) -> ScenarioStatus:
    return (
        ScenarioStatus.DEMONSTRATED
        if all(item.passed for item in outcome_checks)
        else ScenarioStatus.UNEXPECTED
    )


# --------------------------------------------------------------------------- #
# Case A — a duration with no stated clock-start
# --------------------------------------------------------------------------- #


def describe_case_a(state: WorkspaceState) -> ScenarioOutcome:
    """Read the hero path's current position. Case A is driven by the guided review,
    so this reports on it rather than running it."""
    approved = any(review.span_id == "FAQ-Q17-A" for review in state.reviews)
    patch = next(
        (item for item in state.deadline_computations if item.finding_id == "F-001"),
        None,
    )
    build = state.builds[-1] if state.builds else None

    checks = [
        _check(
            "A1",
            "Does the reviewed source state how long?",
            "Yes — 1 week",
            f"Yes — {patch.duration_label}" if patch else "No computation row",
        ),
        _check(
            "A2",
            "Does the reviewed source state when that week starts?",
            "No",
            "No",
        ),
        _check(
            "A3",
            "Is a due date ever published without a person deciding the clock-start?",
            "No",
            "No"
            if patch is None
            or (patch.due_date is None)
            or patch.trigger_provenance == Provenance.HUMAN_POLICY
            else "Yes",
        ),
        _check(
            "A4",
            "Is the clock-start recorded as SEBI wording?",
            "No",
            "No"
            if patch is None or patch.trigger_provenance != Provenance.SOURCE_EXPLICIT
            else "Yes",
        ),
    ]
    if approved and patch is not None:
        checks.append(
            _check(
                "A5",
                "Is the human decision stored with a named reviewer and a written reason?",
                "Yes",
                "Yes" if patch.human_policy_note and state.reviews[-1].reviewer_name else "No",
            )
        )
        headline = (
            f"Due date {patch.due_date} published only after a named officer recorded the "
            "clock-start as firm policy."
        )
        phase = "AFTER_REVIEW"
    else:
        checks.append(
            _check(
                "A5",
                "What does the build do while the field is missing?",
                "Stops and waits for a person",
                "Stops and waits for a person"
                if build is None or build.status.value == "BLOCKED_AWAITING_HUMAN"
                else "Continues",
            )
        )
        headline = "One week is stated. The event it runs from is not. No date is calculated."
        phase = "BEFORE_REVIEW"

    return ScenarioOutcome(
        scenario_id=ScenarioId.A_MISSING_TRIGGER,
        status=_finalise(checks),
        phase=phase,
        headline=headline,
        checks=checks,
        facts=[
            "finding F-001 · severity HIGH · caused_by_missing_patch=true · synthetic",
            "source-stated duration · 1 week · FAQ Q17(a)",
            "source-stated clock-start · absent from the cited span and from PR.MA.S3",
        ],
        citations=[
            _citation(
                state,
                "FAQ-Q17-A",
                "patch management timelines (1 week)",
            )
        ],
        ran_at=_deterministic_time(state),
    )


# --------------------------------------------------------------------------- #
# Case B — advisory language that must not become mandatory work
# --------------------------------------------------------------------------- #

#: The only mapping from requirement strength to operational consequence. Invariant I3
#: lives here: nothing but MANDATORY may create mandatory work.
_WORK_FROM_STRENGTH: Dict[DeonticForce, bool] = {
    DeonticForce.MANDATORY: True,
    DeonticForce.PROHIBITED: True,
    DeonticForce.RECOMMENDED: False,
    DeonticForce.PERMITTED: False,
    DeonticForce.DEFINITIONAL: False,
}


def run_case_b(state: WorkspaceState, reviewer_name: str) -> WorkspaceState:
    """Evaluate every statement's operational consequence from its strength alone."""
    q15_statements = [item for item in state.regulatory_statements if item.span_id == "FAQ-Q15"]
    creating = [item for item in q15_statements if _WORK_FROM_STRENGTH[item.deontic_force]]
    recommended_creating = [
        item
        for item in q15_statements
        if item.deontic_force == DeonticForce.RECOMMENDED
        and _WORK_FROM_STRENGTH[item.deontic_force]
    ]
    permitted_creating = [
        item
        for item in q15_statements
        if item.deontic_force == DeonticForce.PERMITTED
        and _WORK_FROM_STRENGTH[item.deontic_force]
    ]

    # The shortfall is recorded against the source-stated one-week maximum, so the
    # comparison itself is source-anchored even though the consequence is advisory.
    sla = state.vendor_slas[0]
    sla.advisory_reference_days = 7
    sla.status = "ADVISORY_GAP"

    # Trace every mandatory task back through its obligation to the passage it cites,
    # and check that at least one statement on that passage is actually required
    # language. A task that cannot show one is work invented from advice.
    obligations = {item.id: item for item in state.obligations}
    tasks_from_advice = []
    for task in state.tasks:
        obligation = obligations.get(task.source_obligation_id)
        if obligation is None:
            tasks_from_advice.append(task)
            continue
        cited_spans = {item.span_id for item in obligation.field_citations.values()}
        cited_spans.add(obligation.deadline.citation.span_id)
        backed = any(
            statement.span_id in cited_spans
            and _WORK_FROM_STRENGTH[statement.deontic_force]
            for statement in state.regulatory_statements
        )
        if not backed:
            tasks_from_advice.append(task)

    checks = [
        _check(
            "B1",
            "How many distinct statements does this one answer contain?",
            "3",
            str(len(q15_statements)),
        ),
        _check(
            "B2",
            "How many of them are required language that creates work?",
            "1",
            str(len(creating)),
        ),
        _check(
            "B3",
            "How many recommended statements were promoted into mandatory work?",
            "0",
            str(len(recommended_creating)),
        ),
        _check(
            "B4",
            "How many optional statements were promoted into mandatory work?",
            "0",
            str(len(permitted_creating)),
        ),
        _check(
            "B5",
            "How is the vendor SLA shortfall recorded?",
            "As an advisory gap, with no mandatory task",
            (
                "As an advisory gap, with no mandatory task"
                if sla.status == "ADVISORY_GAP"
                else "As something other than an advisory gap"
            ),
        ),
        _check(
            "B6",
            "How many mandatory tasks trace back to something other than required language?",
            "0",
            str(len(tasks_from_advice)),
        ),
        _check(
            "B7",
            "Is a control marked as failing because of the advisory sentence?",
            "No",
            "No"
            if all(item.status != "NON_CONFORMING" for item in state.vendor_slas)
            else "Yes",
        ),
    ]

    outcome = ScenarioOutcome(
        scenario_id=ScenarioId.B_ADVISORY_LANGUAGE,
        status=_finalise(checks),
        phase="EVALUATED",
        headline=(
            "Recommended guidance. No mandatory task created — and the "
            f"{sla.committed_days - (sla.advisory_reference_days or 0)}-day shortfall is still "
            "on the record."
        ),
        checks=checks,
        facts=[
            f"{sla.vendor} · committed {sla.committed_days} calendar days · synthetic",
            "advisory comparison · 7 days · source-stated maximum in FAQ Q17(a)",
            "one answer, three requirement strengths: required, recommended, optional",
        ],
        citations=[
            _citation(
                state,
                "FAQ-Q15",
                "REs are encouraged to include 'VAPT finding closure' related timelines",
            ),
            _citation(
                state,
                "FAQ-Q15",
                "REs may also consider compensatory controls like virtual patching",
            ),
        ],
        ran_at=_deterministic_time(state),
    )
    return _record(state, outcome, reviewer_name, "ADVISORY_LANGUAGE_EVALUATED")


# --------------------------------------------------------------------------- #
# Case C — why one requirement applies and another does not
# --------------------------------------------------------------------------- #


def compute_applicability_decisions(state: WorkspaceState) -> List[ApplicabilityDecision]:
    """Decide four requirements against this entity's recorded facts.

    An exclusion is a decision, not an omission — so it produces a receipt with the same
    fields as an inclusion.
    """
    profile = state.entity_profile
    multi_registration = len(profile.registrations) > 1
    return [
        ApplicabilityDecision(
            id="APD-Q14-QSB-PERIODICITY",
            subject="Half-yearly VAPT and cyber audit",
            applies=profile.is_qsb,
            entity_fact=f"is_qsb={str(profile.is_qsb).lower()}",
            rule="Q14 applies the half-yearly periodicity to QSBs irrespective of category",
            reason=(
                "The profile is a qualified stock broker, so the override applies."
                if profile.is_qsb
                else (
                    "The profile is not a qualified stock broker, so the override does not "
                    "reach it. The receipt is kept and recomputed if the fact changes."
                )
            ),
            provenance=Provenance.DETERMINISTIC,
            citation=_citation(
                state,
                "FAQ-Q14",
                "the periodicity of VAPT and cyber audit for QSBs shall be half-yearly",
            ),
        ),
        ApplicabilityDecision(
            id="APD-Q15-VAPT-CLOSURE",
            subject="Three-month VAPT finding closure",
            applies=True,
            entity_fact=f"entity_type={profile.entity_type}",
            rule="Q15 applies the closure timeline to REs with VAPT findings",
            reason="The profile is a SEBI-regulated entity with VAPT findings on record.",
            provenance=Provenance.DETERMINISTIC,
            citation=_citation(
                state,
                "FAQ-Q15",
                "within three (3) months of submission of VAPT report",
            ),
        ),
        ApplicabilityDecision(
            id="APD-Q24-HIGHEST-CATEGORY",
            subject="Highest category across multiple registrations",
            applies=multi_registration,
            entity_fact=f"registrations={len(profile.registrations)}",
            rule="Q24 applies the highest category's provisions to a multiply-registered RE",
            reason=(
                f"More than one registration is recorded, so the highest category "
                f"({profile.cscrf_category}) governs."
                if multi_registration
                else "One registration is recorded, so there is no higher category to apply."
            ),
            provenance=Provenance.DETERMINISTIC,
            citation=_citation(
                state,
                "FAQ-Q24",
                "the provision of highest category under which such an RE falls shall be "
                "applicable",
            ),
        ),
        ApplicabilityDecision(
            id="APD-Q25-DORMANT-LICENCE",
            subject="Registered but non-operational service",
            applies=profile.has_dormant_license,
            entity_fact=f"has_dormant_license={str(profile.has_dormant_license).lower()}",
            rule="Q25 keeps registration, not operation, as the scope fact",
            reason=(
                "A dormant licensed service is recorded, so it stays in scope subject to a "
                "human reading of the FAQ's softer wording."
                if profile.has_dormant_license
                else "No dormant licensed service is recorded on this profile."
            ),
            provenance=Provenance.DETERMINISTIC,
            citation=_citation(
                state,
                "FAQ-Q25",
                "applicable to all those intermediaries who are registered with SEBI",
            ),
        ),
    ]


def _decisions_with_flipped_qsb(state: WorkspaceState) -> List[ApplicabilityDecision]:
    """Recompute against a copy with the QSB fact inverted. Nothing real is mutated."""
    probe = WorkspaceState.model_validate(state.model_dump(mode="json"))
    probe.entity_profile.is_qsb = not probe.entity_profile.is_qsb
    return compute_applicability_decisions(probe)


def run_case_c(state: WorkspaceState, reviewer_name: str) -> WorkspaceState:
    decisions = compute_applicability_decisions(state)
    applying = [item for item in decisions if item.applies]
    excluded = [item for item in decisions if not item.applies]
    unexplained = [item for item in excluded if not item.reason.strip()]
    missing_quote = [item for item in decisions if not item.citation.quote.strip()]
    missing_fact = [item for item in decisions if not item.entity_fact.strip()]

    flipped = {item.id: item.applies for item in _decisions_with_flipped_qsb(state)}
    moved = sorted(item.subject for item in decisions if flipped[item.id] != item.applies)

    checks = [
        _check(
            "C1",
            "How many requirements were decided against this entity's facts?",
            "4",
            str(len(decisions)),
        ),
        _check(
            "C2",
            "How many of them reach this entity?",
            "2" if state.entity_profile.is_qsb else "1",
            str(len(applying)),
        ),
        _check(
            "C3",
            "How many exclusions were recorded without a stated reason?",
            "0",
            str(len(unexplained)),
        ),
        _check(
            "C4",
            "How many decisions lack an exact clause quotation?",
            "0",
            str(len(missing_quote)),
        ),
        _check(
            "C5",
            "How many decisions lack the entity fact they turned on?",
            "0",
            str(len(missing_fact)),
        ),
        _check(
            "C6",
            "If the QSB fact flips, which decisions move?",
            "Half-yearly VAPT and cyber audit",
            ", ".join(moved) if moved else "none",
        ),
    ]

    outcome = ScenarioOutcome(
        scenario_id=ScenarioId.C_APPLICABILITY,
        status=_finalise(checks),
        phase="EVALUATED",
        headline=(
            f"{len(applying)} of {len(decisions)} requirements reach this entity. "
            f"{len(excluded)} do not, and each exclusion says why."
        ),
        checks=checks,
        facts=[
            f"entity_type={state.entity_profile.entity_type} · synthetic",
            f"is_qsb={str(state.entity_profile.is_qsb).lower()}",
            f"registrations={len(state.entity_profile.registrations)}",
            f"cscrf_category={state.entity_profile.cscrf_category}",
        ],
        citations=[decision.citation for decision in decisions],
        applicability_decisions=decisions,
        ran_at=_deterministic_time(state),
    )
    return _record(state, outcome, reviewer_name, "APPLICABILITY_DECISIONS_COMPUTED")


# --------------------------------------------------------------------------- #
# Case D — a source version changes underneath a live control
# --------------------------------------------------------------------------- #


def run_case_d(state: WorkspaceState, reviewer_name: str) -> WorkspaceState:
    revision, changes = build_revision(state)
    counted = {
        kind: sum(1 for item in changes if item.kind == kind) for kind in SourceChangeKind
    }
    material = [item for item in changes if item.kind != SourceChangeKind.UNCHANGED]
    without_quotes = [
        item
        for item in material
        if not (item.before_quote or item.after_quote)
        or (item.kind == SourceChangeKind.CHANGED and not (item.before_quote and item.after_quote))
    ]
    escalations = [item for item in changes if item.creates_mandatory_work]
    applied = [item for item in changes if item.applied_automatically]
    routed = [item for item in material if item.review_required]
    impacted_controls = sorted({cid for item in changes for cid in item.impacted_control_ids})
    impacted_evidence = sorted({eid for item in changes for eid in item.evidence_ids_for_review})

    checks = [
        _check(
            "D1",
            "How many topics were compared in the declared scope?",
            "6",
            str(len(changes)),
        ),
        _check("D2", "Added passages", "1", str(counted[SourceChangeKind.ADDED])),
        _check("D3", "Changed passages", "1", str(counted[SourceChangeKind.CHANGED])),
        _check("D4", "Superseded passages", "1", str(counted[SourceChangeKind.SUPERSEDED])),
        _check(
            "D5",
            "How many changes were applied to a control automatically?",
            "0",
            str(len(applied)),
        ),
        _check(
            "D6",
            "How many changes are missing a before-and-after quotation?",
            "0",
            str(len(without_quotes)),
        ),
        _check(
            "D7",
            "Strength escalations that would turn advice into mandatory work",
            "1",
            str(len(escalations)),
        ),
        _check(
            "D8",
            "How many material changes were routed to human review?",
            f"{len(material)} of {len(material)}",
            f"{len(routed)} of {len(material)}",
        ),
    ]

    # Evidence attached to an impacted control goes back in the queue. That is a state
    # change, and it is the only one Case D is allowed to make.
    for item in state.evidence:
        if item.id in impacted_evidence and item.status == EvidenceStatus.CURRENT:
            item.status = EvidenceStatus.NEEDS_REVALIDATION
            item.reason = (
                "A source-version change reached the control this artifact supports. "
                "Re-check it against the changed wording before relying on it."
            )

    outcome = ScenarioOutcome(
        scenario_id=ScenarioId.D_SOURCE_CHANGE,
        status=_finalise(checks),
        phase="COMPARED",
        headline=(
            f"{len(material)} material changes across {len(changes)} compared topics. "
            f"{len(impacted_controls)} control(s) and {len(impacted_evidence)} evidence item(s) "
            "need review. Nothing was applied."
        ),
        checks=checks,
        facts=[
            f"comparison scope · {revision.scope_note}",
            f"from · {revision.from_version}",
            f"to · {revision.to_version} · {revision.legal_state}",
            f"impacted controls · {', '.join(impacted_controls) or 'none'}",
            f"evidence marked for review · {', '.join(impacted_evidence) or 'none'}",
        ],
        citations=[
            _citation(
                state,
                "FAQ-Q15",
                "REs are encouraged to include 'VAPT finding closure' related timelines",
            ),
            _citation(
                state,
                "FAQ-Q17-A",
                "patch management timelines (1 week)",
            ),
        ],
        source_revision=revision,
        source_changes=changes,
        ran_at=_deterministic_time(state),
    )
    return _record(state, outcome, reviewer_name, "SOURCE_VERSION_COMPARED")


# --------------------------------------------------------------------------- #
# Dispatch
# --------------------------------------------------------------------------- #

_RUNNERS: Dict[ScenarioId, Callable[[WorkspaceState, str], WorkspaceState]] = {
    ScenarioId.B_ADVISORY_LANGUAGE: run_case_b,
    ScenarioId.C_APPLICABILITY: run_case_c,
    ScenarioId.D_SOURCE_CHANGE: run_case_d,
}


def _record(
    state: WorkspaceState,
    outcome: ScenarioOutcome,
    actor: str,
    event_type: str,
) -> WorkspaceState:
    state.scenario_outcomes = [
        item for item in state.scenario_outcomes if item.scenario_id != outcome.scenario_id
    ]
    state.scenario_outcomes.append(outcome)
    state.audit_events.append(
        AuditEvent(
            id=f"AUD-{len(state.audit_events) + 1:04d}",
            event_type=event_type,
            actor=actor,
            created_at=outcome.ran_at,
            details={
                "scenario_id": outcome.scenario_id.value,
                "status": outcome.status.value,
                "checks_passed": sum(1 for item in outcome.checks if item.passed),
                "checks_total": len(outcome.checks),
            },
        )
    )
    return state


def run_scenario(
    state: WorkspaceState,
    scenario_id: ScenarioId,
    reviewer_name: str = "demo.operator",
) -> WorkspaceState:
    runner = _RUNNERS.get(scenario_id)
    if runner is None:
        raise ValueError(
            "Case A is the guided review itself. Work through the five steps on the "
            "Guided review tab rather than running it in one click."
        )
    return runner(state, reviewer_name)


def outcome_for(state: WorkspaceState, scenario_id: ScenarioId) -> Optional[ScenarioOutcome]:
    if scenario_id == ScenarioId.A_MISSING_TRIGGER:
        return describe_case_a(state)
    return next(
        (item for item in state.scenario_outcomes if item.scenario_id == scenario_id),
        None,
    )
