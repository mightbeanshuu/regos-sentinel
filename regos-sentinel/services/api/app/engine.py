from __future__ import annotations

import hashlib
from calendar import monthrange
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Tuple

from .canonical import canonical_sha256
from .models import (
    ApplicabilityReceipt,
    ApplicabilityScenarioReceipt,
    AuditEvent,
    BenchmarkCase,
    BenchmarkOperatingPoint,
    BenchmarkOutcome,
    BenchmarkResult,
    BuildImpact,
    BuildRun,
    BuildStatus,
    BuildTest,
    BuildTestStatus,
    Citation,
    Control,
    CoverageStatus,
    DeadlineComputation,
    DeadlineRule,
    DeonticForce,
    EvidenceStatus,
    Manifest,
    Obligation,
    PeriodicityWindow,
    Provenance,
    ReferenceStatus,
    RegistrationFact,
    RemediationTask,
    ReviewDecision,
    ReviewerReading,
    ReviewerReadingRequest,
    ReviewRequest,
    SourceDocument,
    SourceSpan,
    WorkspaceState,
)

DEMO_EPOCH = datetime(2026, 7, 22, tzinfo=timezone.utc)


def _deterministic_time(state: WorkspaceState, seconds: int = 0) -> str:
    offset = len(state.audit_events) * 10 + seconds
    return (DEMO_EPOCH + timedelta(seconds=offset)).isoformat().replace("+00:00", "Z")


def _span(state: WorkspaceState, span_id: str):
    return next(item for item in state.source_spans if item.id == span_id)


def _citation(state: WorkspaceState, span_id: str, quote: str) -> Citation:
    span = _span(state, span_id)
    return Citation(
        document_id=span.document_id,
        span_id=span.id,
        locator=span.locator,
        quote=quote,
        source_url=span.source_url,
    )


def _has_approved_q17_review(state: WorkspaceState) -> bool:
    return any(
        review.span_id == "FAQ-Q17-A" and review.decision == "APPROVED" for review in state.reviews
    )


def _has_patch_branch(state: WorkspaceState) -> bool:
    return any(
        obligation.id == "OBL-PATCH-HIGH-001" and obligation.status == "ACTIVE"
        for obligation in state.obligations
    )


def _material_citations_complete(state: WorkspaceState) -> bool:
    active = [item for item in state.obligations if item.status == "ACTIVE"]
    required = {"actor", "action", "object", "condition", "deadline"}
    return bool(active) and all(required.issubset(item.field_citations.keys()) for item in active)


def _add_calendar_months(value: date, months: int) -> date:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, monthrange(year, month)[1])
    return date(year, month, day)


def compute_periodicity_windows(
    state: WorkspaceState, financial_year_start: int = 2026
) -> List[PeriodicityWindow]:
    if not state.entity_profile.is_qsb:
        return []

    q14 = _citation(
        state,
        "FAQ-Q14",
        "the periodicity of VAPT and cyber audit for QSBs shall be half-yearly",
    )
    q20 = _citation(
        state,
        "FAQ-Q20",
        "All the periodicities mentioned in the CSCRF are based on financial year",
    )
    next_year = financial_year_start + 1
    financial_year = f"FY {financial_year_start}–{str(next_year)[-2:]}"
    shared = {
        "standard": "VAPT and cyber audit for QSBs",
        "financial_year": financial_year,
        "calculation_basis": "INDIAN_FINANCIAL_YEAR_HALVES_NOT_ROLLING_SIX_MONTHS",
        "provenance": Provenance.DETERMINISTIC,
        "citations": [q14, q20],
    }
    return [
        PeriodicityWindow(
            id=f"PER-{financial_year_start}-H1",
            period_label="H1 · April–September",
            period_start=f"{financial_year_start}-04-01",
            period_end=f"{financial_year_start}-09-30",
            **shared,
        ),
        PeriodicityWindow(
            id=f"PER-{financial_year_start}-H2",
            period_label="H2 · October–March",
            period_start=f"{financial_year_start}-10-01",
            period_end=f"{next_year}-03-31",
            **shared,
        ),
    ]


def _compile_deadline_traces(
    state: WorkspaceState,
    patch_obligation: Obligation,
    other_obligation: Obligation,
    review_decision: ReviewDecision,
) -> List[DeadlineComputation]:
    patch_finding = next(item for item in state.findings if item.id == "F-001")
    other_finding = next(item for item in state.findings if item.id == "F-002")
    patch_trigger = date.fromisoformat(review_decision.policy_inputs["trigger_date"])
    patch_due = patch_trigger + timedelta(weeks=patch_obligation.deadline.duration)
    other_trigger = date.fromisoformat(other_finding.vapt_report_submitted_at)
    other_due = _add_calendar_months(other_trigger, other_obligation.deadline.duration)
    return [
        DeadlineComputation(
            id="DLC-PATCH-001",
            finding_id=patch_finding.id,
            obligation_id=patch_obligation.id,
            trigger_label=review_decision.policy_inputs["trigger_policy"],
            trigger_date=patch_trigger.isoformat(),
            duration_label="1 week",
            due_date=patch_due.isoformat(),
            calculation_trace=[
                f"{patch_trigger.isoformat()} · reviewer records the entity policy input",
                "+ 1 week · source-explicit duration from FAQ Q17(a)",
                f"{patch_due.isoformat()} · calculated due date",
            ],
            trigger_provenance=Provenance.HUMAN_POLICY,
            duration_provenance=Provenance.SOURCE_EXPLICIT,
            computable=True,
            human_policy_note=review_decision.reason,
            citation=patch_obligation.deadline.citation,
        ),
        DeadlineComputation(
            id="DLC-VAPT-OTHER-001",
            finding_id=other_finding.id,
            obligation_id=other_obligation.id,
            trigger_label="VAPT report submission",
            trigger_date=other_trigger.isoformat(),
            duration_label="3 calendar months",
            due_date=other_due.isoformat(),
            calculation_trace=[
                "2026-07-20 · synthetic VAPT report submission",
                "+ 3 calendar months · source-explicit rule from FAQ Q15/Q17(b)",
                "2026-10-20 · calculated due date",
            ],
            trigger_provenance=Provenance.SOURCE_EXPLICIT,
            duration_provenance=Provenance.SOURCE_EXPLICIT,
            computable=True,
            citation=other_obligation.deadline.citation,
        ),
    ]


def _build_tests(state: WorkspaceState) -> List[BuildTest]:
    unresolved = [
        entry.span_id
        for entry in state.coverage
        if entry.status == CoverageStatus.AMBIGUOUS and _span(state, entry.span_id).normative_signal
    ]
    coverage_passed = not unresolved
    patch_branch = _has_patch_branch(state)
    review_passed = _has_approved_q17_review(state)
    independent_reading_committed = any(
        item.span_id == "FAQ-Q17-A" for item in state.reviewer_readings
    )
    citations_passed = _material_citations_complete(state)
    deadline_trace_passed = len(state.deadline_computations) == len(state.findings) == 2 and all(
        item.computable for item in state.deadline_computations
    )
    references_closed = bool(state.references) and all(
        item.status == ReferenceStatus.RESOLVED for item in state.references
    )
    sla_statement = next(
        (item for item in state.regulatory_statements if item.id == "STMT-Q15-SLA-ADVISORY"),
        None,
    )
    deontic_passed = (
        sla_statement is not None
        and sla_statement.deontic_force == DeonticForce.RECOMMENDED
        and all(item.status != "NON_CONFORMING" for item in state.vendor_slas)
    )
    expected_windows = {
        ("2026-04-01", "2026-09-30"),
        ("2026-10-01", "2027-03-31"),
    }
    actual_windows = {(item.period_start, item.period_end) for item in state.periodicity_windows}
    periodicity_passed = not state.entity_profile.is_qsb or actual_windows == expected_windows
    multi_registration = len(state.entity_profile.registrations) > 1
    q24_receipt = next(
        (item for item in state.applicability_scenarios if item.id == "APP-Q24-MULTI-REG"),
        None,
    )
    q25_receipt = next(
        (item for item in state.applicability_scenarios if item.id == "APP-Q25-DORMANT-LICENCE"),
        None,
    )
    applicability_passed = (
        q24_receipt is not None
        and q25_receipt is not None
        and q24_receipt.activated == multi_registration
        and q25_receipt.activated == state.entity_profile.has_dormant_license
    )
    impact_passed = not review_passed or (
        any(item.status == "ADVISORY_GAP" for item in state.vendor_slas)
        and any(item.status == EvidenceStatus.NEEDS_REVALIDATION for item in state.evidence)
        and len(state.tasks) >= 2
    )
    return [
        BuildTest(
            id="TEST-COVERAGE-001",
            name="No unresolved material source spans",
            status=BuildTestStatus.PASS if coverage_passed else BuildTestStatus.BLOCK,
            message=(
                "Every scoped normative span has a recorded disposition."
                if coverage_passed
                else "Q17 contains material deadline branches that remain uncompiled."
            ),
            related_span_ids=unresolved,
        ),
        BuildTest(
            id="TEST-PATCH-BRANCH-001",
            name="High-severity missing-patch branch exists",
            status=BuildTestStatus.PASS if patch_branch else BuildTestStatus.BLOCK,
            message=(
                "High-severity missing-patch findings use an explicit one-week rule."
                if patch_branch
                else (
                    "The current control applies three months to all VAPT findings "
                    "and misses Q17(a)."
                )
            ),
            related_span_ids=["FAQ-Q15", "FAQ-Q17-A"],
        ),
        BuildTest(
            id="TEST-HUMAN-REVIEW-001",
            name="Material interpretation has human approval",
            status=BuildTestStatus.PASS if review_passed else BuildTestStatus.BLOCK,
            message=(
                "An authorized reviewer approved the Q17 split with a recorded reason."
                if review_passed
                else (
                    "Publication is blocked until a human reviews the conflicting "
                    "deadline branches."
                )
            ),
            related_span_ids=["FAQ-Q17-A", "FAQ-Q17-B"],
        ),
        BuildTest(
            id="TEST-INDEPENDENT-READING-001",
            name="Reviewer commits an independent reading before system reveal",
            status=(
                BuildTestStatus.PASS if independent_reading_committed else BuildTestStatus.BLOCK
            ),
            message=(
                "The pre-reveal reading and reveal timestamp are persisted."
                if independent_reading_committed
                else "The system suggestion remains hidden until the reviewer commits a reading."
            ),
            related_span_ids=["FAQ-Q17-A", "FAQ-Q17-B"],
        ),
        BuildTest(
            id="TEST-CITATION-001",
            name="Material fields have exact source locators",
            status=BuildTestStatus.PASS if citations_passed else BuildTestStatus.BLOCK,
            message=(
                "Actor, action, object, condition and deadline fields are source-linked."
                if citations_passed
                else "One or more material obligation fields lack an exact source locator."
            ),
            related_span_ids=["FAQ-Q15", "FAQ-Q17-A", "FAQ-Q17-B"],
        ),
        BuildTest(
            id="TEST-REFERENCE-CLOSURE-001",
            name="Every scoped outbound reference is closed",
            status=BuildTestStatus.PASS if references_closed else BuildTestStatus.BLOCK,
            message=(
                "Q15–Q17 dependencies are linked to four hash-pinned CSCRF source spans."
                if references_closed
                else "One or more explicit Q15–Q17 CSCRF dependencies remain unresolved."
            ),
            related_span_ids=["FAQ-Q15", "FAQ-Q16", "FAQ-Q17-A"],
        ),
        BuildTest(
            id="TEST-DEONTIC-FORCE-001",
            name="Recommendations cannot create compliance failures",
            status=BuildTestStatus.PASS if deontic_passed else BuildTestStatus.BLOCK,
            message=(
                "Q15's SLA language is typed RECOMMENDED and creates an advisory, not a failure."
                if deontic_passed
                else "Recommended language was incorrectly promoted into a mandatory failure."
            ),
            related_span_ids=["FAQ-Q15"],
        ),
        BuildTest(
            id="TEST-DEADLINE-TRACE-001",
            name="Deadline calculations expose trigger provenance",
            status=BuildTestStatus.PASS if deadline_trace_passed else BuildTestStatus.BLOCK,
            message=(
                "Every synthetic finding has an inspectable calendar trace and labeled inputs."
                if deadline_trace_passed
                else (
                    "No due date is published until the rule branch and trigger input are reviewed."
                )
            ),
            related_span_ids=["FAQ-Q15", "FAQ-Q17-A", "FAQ-Q17-B"],
        ),
        BuildTest(
            id="TEST-IMPACT-001",
            name="Downstream impact is propagated",
            status=BuildTestStatus.PASS if impact_passed else BuildTestStatus.BLOCK,
            message=(
                "Control, SLA, evidence and remediation task states are internally consistent."
                if impact_passed
                else "The corrected obligation has not reached every downstream artifact."
            ),
            related_span_ids=["FAQ-Q17-A"],
        ),
        BuildTest(
            id="TEST-FY-PERIODICITY-001",
            name="QSB periodicity uses Indian financial-year halves",
            status=BuildTestStatus.PASS if periodicity_passed else BuildTestStatus.BLOCK,
            message=(
                "QSB half-years resolve to Apr–Sep and Oct–Mar under Q14 and Q20."
                if periodicity_passed
                else "The QSB schedule is missing or was calculated as rolling six months."
            ),
            related_span_ids=["FAQ-Q14", "FAQ-Q20"],
        ),
        BuildTest(
            id="TEST-APPLICABILITY-HARD-CASES-001",
            name="Applicability receipts match the registered entity facts",
            status=BuildTestStatus.PASS if applicability_passed else BuildTestStatus.BLOCK,
            message=(
                "Q24 and Q25 receipts explain both activated and excluded scenarios."
                if applicability_passed
                else "A Q24/Q25 receipt conflicts with the current synthetic entity profile."
            ),
            related_span_ids=["FAQ-Q24", "FAQ-Q25"],
        ),
    ]


def run_build(state: WorkspaceState, actor: str = "system") -> WorkspaceState:
    sequence = len(state.builds) + 1
    started_at = _deterministic_time(state)
    tests = _build_tests(state)
    failed = any(item.status == BuildTestStatus.FAIL for item in tests)
    blocked = any(item.status == BuildTestStatus.BLOCK for item in tests)
    status = (
        BuildStatus.FAILED
        if failed
        else BuildStatus.BLOCKED_AWAITING_HUMAN
        if blocked
        else BuildStatus.APPROVED
    )
    review = state.reviews[-1] if state.reviews else None
    impact = BuildImpact(
        controls_changed=1 if review else 0,
        vendor_sla_advisories=sum(item.status == "ADVISORY_GAP" for item in state.vendor_slas),
        evidence_revalidation=sum(
            item.status == EvidenceStatus.NEEDS_REVALIDATION for item in state.evidence
        ),
        tasks_created=len(state.tasks),
    )
    build = BuildRun(
        id=f"BUILD-{sequence:04d}",
        run_id=f"RUN-{sequence:04d}",
        sequence=sequence,
        status=status,
        started_at=started_at,
        completed_at=_deterministic_time(state, seconds=1),
        stage="VERIFY" if failed or blocked else "PROVE",
        headline=(
            "One-week rule has no source-stated clock start"
            if blocked
            else "A deterministic build test failed"
            if failed
            else "Human-approved regulatory split compiled"
        ),
        tests=tests,
        impact=impact,
        source_version=state.source_version,
        schema_version=state.schema_version,
        ruleset_version=state.ruleset_version,
        reviewer=review.reviewer_name if review else None,
    )
    state.builds.append(build)
    state.audit_events.append(
        AuditEvent(
            id=f"AUD-{len(state.audit_events) + 1:04d}",
            event_type="COMPLIANCE_BUILD_COMPLETED",
            actor=actor,
            created_at=build.completed_at,
            details={
                "build_id": build.id,
                "status": build.status.value,
                "failed_tests": [item.id for item in tests if item.status == "FAIL"],
                "blocking_tests": [item.id for item in tests if item.status == "BLOCK"],
            },
        )
    )
    state.latest_manifest = create_manifest(state) if status == BuildStatus.APPROVED else None
    return state


def resolve_scoped_references(state: WorkspaceState, actor: str) -> WorkspaceState:
    source_url = "https://www.sebi.gov.in/sebi_data/attachdocs/aug-2024/1724326790365.pdf"
    fixtures = {
        "REF-Q15-TABLE-19": {
            "span_id": "CSCRF-TABLE-19",
            "question": "Table 19 — VAPT report submission and observations closure timeline",
            "locator": "CSCRF Part I · PDF page 49 · Table 19",
            "text": (
                "Report submission of VAPT: VAPT report shall be submitted after approval "
                "from respective IT Committee for REs, within one (1) month of completion of "
                "VAPT activity. Closure of findings identified during VAPT activity: Within "
                "3 months of submission of VAPT report. A graded approach (based on the "
                "criticality of observations) shall be followed for closure of the observations "
                "found during VAPT. Revalidation of VAPT shall be completed within 5 months "
                "of completion of VAPT."
            ),
            "note": (
                "Dependency closed. Table 19 states the three-month clock-start as VAPT report "
                "submission and separately records submission and revalidation timelines."
            ),
        },
        "REF-Q15-GUIDELINE-6": {
            "span_id": "CSCRF-PR-MA-G6",
            "question": "PR.MA Guideline 6 — Virtual patching for legacy systems",
            "locator": "CSCRF Part II · PDF page 116 · PR.MA Guideline 6",
            "text": (
                "Compensatory controls like virtual patching shall be implemented for legacy "
                "systems for a maximum period of 6 months. Further, the constraints due to "
                "which virtual patching is done shall be legitimate and documented."
            ),
            "note": (
                "Dependency closed. Guideline 6 supplies conditions for the permitted "
                "virtual-patching option without turning Q15's encouragement into a failure."
            ),
        },
        "REF-Q16-ANNEXURE-A": {
            "span_id": "CSCRF-ANNEXURE-A",
            "question": "Annexure-A — VAPT report format",
            "locator": "CSCRF Part III · PDF pages 133–141 · Annexure-A",
            "text": (
                "Annexure-A: VAPT Report Format. Reporting format for market entities to submit "
                "their compliance and findings of VAPT. The format records organisation, entity "
                "type, CSCRF category and rationale, audit period, auditing organisation, IT "
                "Committee presentation date, authorised-signatory declaration, findings, open "
                "vulnerabilities, closure timelines and detailed risk information."
            ),
            "note": (
                "Dependency closed. Annexure-A is pinned as the VAPT reporting-format source; "
                "the prototype maps evidence metadata but performs no regulatory submission."
            ),
        },
        "REF-Q17-PR-MA-S3": {
            "span_id": "CSCRF-PR-MA-S3",
            "question": "PR.MA.S3 — Patch-management procedures and maximum timelines",
            "locator": "CSCRF Part II · PDF pages 116–117 · PR.MA.S3 items 1 and 11",
            "text": (
                "REs shall establish and ensure that the patch management procedures include "
                "the identification, categorization and prioritization of patches and updates. "
                "An implementation timeframe for each category of patches shall be established "
                "to apply them in a timely manner. Based on the criticality of the patches, REs "
                "shall ensure that patches are implemented at both PDC and DR site within the "
                "upper or maximum time limit: High — 1 week; Moderate — 2 weeks; Low — 1 month."
            ),
            "note": (
                "Dependency closed. PR.MA.S3 confirms the high-patch one-week maximum but "
                "still does not state the event that starts the clock."
            ),
        },
    }
    unresolved = [
        reference
        for reference in state.references
        if reference.status == ReferenceStatus.UNRESOLVED and reference.id in fixtures
    ]
    if not unresolved:
        return state

    corpus_text = "\n".join(str(fixtures[key]["text"]) for key in sorted(fixtures))
    corpus_hash = hashlib.sha256(corpus_text.encode()).hexdigest()
    target_document_id = "SEBI-CSCRF-2024-113"
    target_document = next(
        (item for item in state.documents if item.id == target_document_id),
        None,
    )
    if target_document is None:
        state.documents.append(
            SourceDocument(
                id=target_document_id,
                authority="Securities and Exchange Board of India",
                title="Cybersecurity and Cyber Resilience Framework for SEBI REs",
                document_type="Circular / framework",
                published_at="2024-08-20",
                legal_state="IN FORCE — READ WITH SUBSEQUENT CLARIFICATIONS",
                source_url=source_url,
                content_hash=corpus_hash,
                content_hash_scope=(
                    "SHA-256 OF FOUR HUMAN-VERIFIED REFERENCE EXCERPTS, NOT THE FULL PDF"
                ),
                corpus_scope=(
                    "Table 19, PR.MA Guideline 6, Annexure-A header/field scope, and PR.MA.S3 "
                    "used by the Q15–Q17 prototype path"
                ),
                disclaimer=(
                    "The prototype dependency set is limited to the four referenced excerpts."
                ),
            )
        )
    else:
        target_document.content_hash = corpus_hash
        target_document.content_hash_scope = (
            "SHA-256 OF FOUR HUMAN-VERIFIED REFERENCE EXCERPTS, NOT THE FULL PDF"
        )

    resolved_ids = []
    for reference in unresolved:
        fixture = fixtures[reference.id]
        target_text = str(fixture["text"])
        target_hash = hashlib.sha256(target_text.encode()).hexdigest()
        target_span_id = str(fixture["span_id"])
        if not any(item.id == target_span_id for item in state.source_spans):
            state.source_spans.append(
                SourceSpan(
                    id=target_span_id,
                    document_id=reference.target_document_id,
                    question=str(fixture["question"]),
                    locator=str(fixture["locator"]),
                    text=target_text,
                    normative_signal=True,
                    source_url=source_url,
                )
            )
        reference.status = ReferenceStatus.RESOLVED
        reference.target_span_id = target_span_id
        reference.target_hash = target_hash
        reference.resolution_note = str(fixture["note"])
        resolved_ids.append(reference.id)

    state.audit_events.append(
        AuditEvent(
            id=f"AUD-{len(state.audit_events) + 1:04d}",
            event_type="SCOPED_SOURCE_REFERENCES_RESOLVED",
            actor=actor,
            created_at=_deterministic_time(state),
            details={
                "reference_ids": resolved_ids,
                "resolved_count": len(resolved_ids),
                "excerpt_set_hash": corpus_hash,
            },
        )
    )
    return run_build(state, actor=actor)


def resolve_q17_reference(state: WorkspaceState, actor: str) -> WorkspaceState:
    """Backward-compatible alias for recorded demo scripts."""
    return resolve_scoped_references(state, actor)


def commit_q17_reading(state: WorkspaceState, request: ReviewerReadingRequest) -> WorkspaceState:
    if any(item.span_id == "FAQ-Q17-A" for item in state.reviewer_readings):
        return state

    committed_at = _deterministic_time(state)
    reading = ReviewerReading(
        id="READ-Q17-001",
        span_id="FAQ-Q17-A",
        reviewer_name=request.reviewer_name,
        reviewer_role=request.reviewer_role,
        independent_interpretation=request.independent_interpretation,
        trigger_policy=request.trigger_policy,
        committed_at=committed_at,
        system_suggestion_revealed_at=_deterministic_time(state, seconds=1),
        revealed_system_suggestion=(
            "Q17(a) supports a one-week duration for high-severity missing-patch findings; "
            "the cited Q17(a) and scoped PR.MA.S3 spans do not state the clock-start."
        ),
    )
    state.reviewer_readings.append(reading)
    state.audit_events.append(
        AuditEvent(
            id=f"AUD-{len(state.audit_events) + 1:04d}",
            event_type="INDEPENDENT_REVIEW_READING_COMMITTED",
            actor=request.reviewer_name,
            created_at=committed_at,
            details={
                "reading_id": reading.id,
                "span_id": reading.span_id,
                "system_reveal_after_commit": True,
            },
        )
    )
    return state


def approve_q17(state: WorkspaceState, request: ReviewRequest) -> WorkspaceState:
    if _has_approved_q17_review(state):
        return state

    independent_reading = next(
        item for item in state.reviewer_readings if item.span_id == "FAQ-Q17-A"
    )
    q17a = _citation(
        state,
        "FAQ-Q17-A",
        "high severity ... patch management timelines (1 week)",
    )
    q17b = _citation(
        state,
        "FAQ-Q17-B",
        "Other vulnerabilities ... VAPT observation closure timelines (3 months)",
    )
    decision = ReviewDecision(
        id="REV-Q17-001",
        span_id="FAQ-Q17-A",
        decision="APPROVED",
        selected_interpretation=(
            "Split missing-patch high severity from all other VAPT observations"
        ),
        reason=request.reason,
        reviewer_name=request.reviewer_name,
        reviewer_role=request.reviewer_role,
        decided_at=_deterministic_time(state),
        policy_inputs={
            "trigger_policy": request.trigger_policy,
            "trigger_date": request.trigger_date,
            "trigger_provenance": Provenance.HUMAN_POLICY.value,
        },
        independent_reading_id=independent_reading.id,
        reviewer_agreement=request.agrees_with_system_suggestion,
    )
    state.reviews.append(decision)

    patch_applicability = ApplicabilityReceipt(
        id="APR-PATCH-HIGH-001",
        obligation_id="OBL-PATCH-HIGH-001",
        applies=True,
        entity_fact="entity_type=STOCK_BROKER; finding_severity=HIGH; caused_by_missing_patch=true",
        rule="SEBI RE + high severity + non-implementation of patch",
        reason="The synthetic finding matches every condition in the Q17(a) branch.",
        provenance=Provenance.DETERMINISTIC,
        reviewer_name=request.reviewer_name,
        citation=q17a,
    )
    patch_obligation = Obligation(
        id="OBL-PATCH-HIGH-001",
        version=1,
        actor="SEBI-regulated entity",
        action="remediate",
        object="high-severity vulnerability caused by non-implementation of a patch",
        condition="severity=HIGH and caused_by_missing_patch=true",
        deadline=DeadlineRule(
            trigger=request.trigger_policy,
            duration=1,
            unit="week",
            calendar_basis="7 calendar days in this demo ruleset",
            trigger_provenance=Provenance.HUMAN_POLICY,
            duration_provenance=Provenance.SOURCE_EXPLICIT,
            computable=True,
            citation=q17a,
        ),
        control_id="CTRL-VAPT-07",
        evidence_requirements=[
            "OEM advisory or discovery record",
            "Non-production patch test result",
            "Deployment approval",
            "Closure proof",
        ],
        field_citations={
            "actor": q17a,
            "action": q17a,
            "object": q17a,
            "condition": q17a,
            "deadline": q17a,
        },
        field_provenance={
            "actor": Provenance.SOURCE_EXPLICIT,
            "action": Provenance.SOURCE_EXPLICIT,
            "object": Provenance.SOURCE_EXPLICIT,
            "condition": Provenance.DETERMINISTIC,
            "trigger": Provenance.HUMAN_POLICY,
            "duration": Provenance.SOURCE_EXPLICIT,
        },
        applicability=patch_applicability,
        status="ACTIVE",
        provenance=Provenance.AI_SUGGESTED,
    )
    other_applicability = ApplicabilityReceipt(
        id="APR-VAPT-OTHER-001",
        obligation_id="OBL-VAPT-OTHER-001",
        applies=True,
        entity_fact="entity_type=STOCK_BROKER; caused_by_missing_patch=false",
        rule="SEBI RE + VAPT observation other than patch implementation",
        reason="The configuration finding follows Q17(b), not the Q17(a) patch branch.",
        provenance=Provenance.DETERMINISTIC,
        reviewer_name=request.reviewer_name,
        citation=q17b,
    )
    other_obligation = Obligation(
        id="OBL-VAPT-OTHER-001",
        version=1,
        actor="SEBI-regulated entity",
        action="close",
        object="other VAPT observation",
        condition="caused_by_missing_patch=false",
        deadline=DeadlineRule(
            trigger="VAPT report submission",
            duration=3,
            unit="months",
            calendar_basis="calendar months",
            trigger_provenance=Provenance.SOURCE_EXPLICIT,
            duration_provenance=Provenance.SOURCE_EXPLICIT,
            computable=True,
            citation=q17b,
        ),
        control_id="CTRL-VAPT-07",
        evidence_requirements=["VAPT report", "Risk-graded remediation record", "Closure proof"],
        field_citations={
            "actor": q17b,
            "action": q17b,
            "object": q17b,
            "condition": q17b,
            "deadline": q17b,
        },
        field_provenance={
            "actor": Provenance.SOURCE_EXPLICIT,
            "action": Provenance.SOURCE_EXPLICIT,
            "object": Provenance.SOURCE_EXPLICIT,
            "condition": Provenance.DETERMINISTIC,
            "trigger": Provenance.SOURCE_EXPLICIT,
            "duration": Provenance.SOURCE_EXPLICIT,
        },
        applicability=other_applicability,
        status="ACTIVE",
        provenance=Provenance.AI_SUGGESTED,
    )

    for obligation in state.obligations:
        if obligation.id in {"OBL-VAPT-BASE-001", "OBL-PATCH-HIGH-CANDIDATE"}:
            obligation.status = "SUPERSEDED_BY_REVIEW"
    state.obligations.extend([patch_obligation, other_obligation])
    state.deadline_computations = _compile_deadline_traces(
        state,
        patch_obligation,
        other_obligation,
        decision,
    )

    reviewed_at = decision.decided_at
    for entry in state.coverage:
        if entry.span_id == "FAQ-Q15":
            entry.rationale = "Compiled with Q17(b) into the reviewed three-month branch."
            entry.obligation_ids = [other_obligation.id]
            entry.reviewed_by = request.reviewer_name
            entry.reviewed_at = reviewed_at
        elif entry.span_id == "FAQ-Q17-A":
            entry.status = CoverageStatus.COMPILED
            entry.rationale = "Human-approved one-week high-severity missing-patch branch."
            entry.obligation_ids = [patch_obligation.id]
            entry.reviewed_by = request.reviewer_name
            entry.reviewed_at = reviewed_at
        elif entry.span_id == "FAQ-Q17-B":
            entry.status = CoverageStatus.COMPILED
            entry.rationale = "Human-approved three-month branch for other VAPT observations."
            entry.obligation_ids = [other_obligation.id]
            entry.reviewed_by = request.reviewer_name
            entry.reviewed_at = reviewed_at

    previous_control = state.controls[0]
    state.controls[0] = Control(
        id=previous_control.id,
        version=2,
        name=previous_control.name,
        owner=previous_control.owner,
        previous_rule_summary=previous_control.rule_summary,
        rule_summary=(
            "High-severity missing-patch findings: one week. Other VAPT observations: "
            "three months with a criticality-graded approach."
        ),
        status="ACTIVE — REMEDIATION ACTIONS OPEN",
        source_obligation_ids=[patch_obligation.id, other_obligation.id],
    )
    state.vendor_slas[0].advisory_reference_days = 7
    state.vendor_slas[0].status = "ADVISORY_GAP"
    evidence_reasons = {
        "EVD-VAPT-REGISTER-001": (
            "Finding classifications must be revalidated against the new patch and "
            "non-patch branches."
        ),
        "EVD-VENDOR-SLA-001": (
            "The 30-day vendor commitment is retained as an advisory gap under Q15; "
            "no failed control is created."
        ),
        "EVD-PATCH-POLICY-001": (
            "The approved control changed from a single three-month rule to a conditional "
            "one-week branch."
        ),
    }
    for evidence in state.evidence:
        evidence.status = EvidenceStatus.NEEDS_REVALIDATION
        evidence.reason = evidence_reasons[evidence.id]
    state.tasks = [
        RemediationTask(
            id="TASK-PATCH-001",
            title="Remediate F-001 under the approved one-week patch branch",
            owner="Cybersecurity Lead",
            priority="HIGH",
            status="OPEN",
            due_days=7,
            source_obligation_id=patch_obligation.id,
            work_type="MANDATORY PATCH REMEDIATION",
        ),
        RemediationTask(
            id="TASK-EVIDENCE-001",
            title="Revalidate patch policy evidence against control version 2",
            owner="Cybersecurity Lead",
            priority="HIGH",
            status="OPEN",
            due_days=7,
            source_obligation_id=patch_obligation.id,
            work_type="MANDATORY CONTROL REMEDIATION",
        ),
    ]
    state.ruleset_version = "cscrf-demo-rules/1.1.0-human-approved"
    state.audit_events.append(
        AuditEvent(
            id=f"AUD-{len(state.audit_events) + 1:04d}",
            event_type="MATERIAL_INTERPRETATION_APPROVED",
            actor=request.reviewer_name,
            created_at=decision.decided_at,
            details={
                "review_id": decision.id,
                "span_ids": ["FAQ-Q17-A", "FAQ-Q17-B"],
                "reason": request.reason,
                "independent_reading_id": independent_reading.id,
                "reviewer_agreement": request.agrees_with_system_suggestion,
            },
        )
    )
    state = run_build(state, actor=request.reviewer_name)
    state = run_benchmark(state)
    state.latest_manifest = create_manifest(state)
    return state


def set_qsb_status(state: WorkspaceState, is_qsb: bool, reviewer_name: str) -> WorkspaceState:
    reviewed_at = _deterministic_time(state)
    state.entity_profile.is_qsb = is_qsb
    state.entity_profile.facts_version = (
        f"entity-facts/{int(state.entity_profile.facts_version.split('/')[-1]) + 1}"
    )
    q14_coverage = next(entry for entry in state.coverage if entry.span_id == "FAQ-Q14")
    q14_coverage.status = CoverageStatus.COMPILED if is_qsb else CoverageStatus.OUT_OF_SCOPE
    q14_coverage.rationale = (
        "QSB fact activates the half-yearly VAPT and cyber-audit periodicity override."
        if is_qsb
        else "Non-QSB fact excludes the Q14 override; base category periodicity remains applicable."
    )
    q14_coverage.reviewed_by = reviewer_name
    q14_coverage.reviewed_at = reviewed_at
    state.periodicity_windows = compute_periodicity_windows(state)
    state.audit_events.append(
        AuditEvent(
            id=f"AUD-{len(state.audit_events) + 1:04d}",
            event_type="ENTITY_FACT_CONFIRMED",
            actor=reviewer_name,
            created_at=reviewed_at,
            details={"is_qsb": is_qsb, "source_span": "FAQ-Q14"},
        )
    )
    return state


def set_applicability_scenarios(
    state: WorkspaceState,
    has_second_registration: bool,
    has_dormant_license: bool,
    reviewer_name: str,
) -> WorkspaceState:
    registrations = [
        RegistrationFact(
            registration_type="STOCK_BROKER",
            cscrf_category="SMALL-SIZE RE",
            operational=True,
        )
    ]
    if has_second_registration:
        registrations.append(
            RegistrationFact(
                registration_type="DEPOSITORY_PARTICIPANT",
                cscrf_category="MID-SIZE RE",
                operational=True,
            )
        )
    if has_dormant_license:
        registrations.append(
            RegistrationFact(
                registration_type="INVESTMENT_ADVISER",
                cscrf_category="SMALL-SIZE RE",
                operational=False,
            )
        )

    category_rank = {"SMALL-SIZE RE": 1, "MID-SIZE RE": 2, "QUALIFIED RE": 3}
    highest_category = max(
        (item.cscrf_category for item in registrations),
        key=lambda category: category_rank[category],
    )
    state.entity_profile.registrations = registrations
    state.entity_profile.has_dormant_license = has_dormant_license
    state.entity_profile.cscrf_category = highest_category
    state.entity_profile.facts_version = (
        f"entity-facts/{int(state.entity_profile.facts_version.split('/')[-1]) + 1}"
    )
    reviewed_at = _deterministic_time(state)

    q24 = _citation(
        state,
        "FAQ-Q24",
        "the provision of highest category under which such an RE falls shall be applicable",
    )
    q25 = _citation(
        state,
        "FAQ-Q25",
        "applicable to all those intermediaries who are registered with SEBI",
    )
    multi_registration = len(registrations) > 1
    state.applicability_scenarios = [
        ApplicabilityScenarioReceipt(
            id="APP-Q24-MULTI-REG",
            source_span_id="FAQ-Q24",
            scenario="Multiple SEBI registrations use the highest applicable category",
            activated=multi_registration,
            decision=(
                f"HIGHEST_CATEGORY_APPLIED:{highest_category}"
                if multi_registration
                else "NOT_ACTIVATED_SINGLE_REGISTRATION"
            ),
            entity_facts=[
                f"registrations={len(registrations)}",
                f"highest_category={highest_category}",
            ],
            reason=(
                "Multiple synthetic registrations activate Q24's highest-category rule."
                if multi_registration
                else "The synthetic profile has a single SEBI registration."
            ),
            provenance=Provenance.DETERMINISTIC,
            reviewer_name=reviewer_name,
            reviewed_at=reviewed_at,
            citation=q24,
        ),
        ApplicabilityScenarioReceipt(
            id="APP-Q25-DORMANT-LICENCE",
            source_span_id="FAQ-Q25",
            scenario="A registered but non-operational service remains in scope",
            activated=has_dormant_license,
            decision=(
                "REMAINS_IN_SCOPE_SUBJECT_TO_HUMAN_CONFIRMATION"
                if has_dormant_license
                else "NOT_ACTIVATED_NO_DORMANT_LICENCE"
            ),
            entity_facts=[
                f"has_dormant_license={str(has_dormant_license).lower()}",
                "service_operational=false" if has_dormant_license else "service_operational=true",
            ],
            reason=(
                "Q25 says registration remains the relevant scope fact even when service "
                "operation is a business decision; final entity interpretation stays human."
                if has_dormant_license
                else "The synthetic profile has no dormant licensed service."
            ),
            provenance=Provenance.DETERMINISTIC,
            reviewer_name=reviewer_name,
            reviewed_at=reviewed_at,
            citation=q25,
        ),
    ]

    for span_id, active, rationale in [
        (
            "FAQ-Q24",
            multi_registration,
            (f"Multiple registrations activate the highest-category receipt: {highest_category}."),
        ),
        (
            "FAQ-Q25",
            has_dormant_license,
            "Dormant licensed service remains in the human-confirmed applicability scope.",
        ),
    ]:
        coverage = next(item for item in state.coverage if item.span_id == span_id)
        coverage.status = CoverageStatus.COMPILED if active else CoverageStatus.OUT_OF_SCOPE
        coverage.rationale = (
            rationale
            if active
            else (
                "Current synthetic facts do not activate this scenario; the exclusion is receipted."
            )
        )
        coverage.reviewed_by = reviewer_name
        coverage.reviewed_at = reviewed_at

    state.audit_events.append(
        AuditEvent(
            id=f"AUD-{len(state.audit_events) + 1:04d}",
            event_type="APPLICABILITY_FACTS_CONFIRMED",
            actor=reviewer_name,
            created_at=reviewed_at,
            details={
                "has_second_registration": has_second_registration,
                "has_dormant_license": has_dormant_license,
                "resulting_category": highest_category,
            },
        )
    )
    return state


def create_manifest(state: WorkspaceState) -> Manifest:
    build = state.builds[-1]
    review = state.reviews[-1]
    active_obligations = [item for item in state.obligations if item.status == "ACTIVE"]
    generated_at = build.completed_at
    source_payload = {
        "documents": [item.model_dump(mode="json") for item in state.documents],
        "version": state.source_version,
        "covered_span_ids": [item.span_id for item in state.coverage],
        "dependency_span_ids": [
            item.target_span_id for item in state.references if item.target_span_id is not None
        ],
    }
    reproducibility = {
        "schema_version": state.schema_version,
        "ruleset_version": state.ruleset_version,
        "extraction_mode": "HUMAN_VERIFIED_SEEDED_EXCERPTS",
        "model_provider": state.model_run_receipt.provider,
        "model_id": state.model_run_receipt.model_id,
        "prompt_version": state.model_run_receipt.prompt_version,
        "model_input_sha256": state.model_run_receipt.input_sha256,
        "model_output_sha256": state.model_run_receipt.output_sha256,
        "model_cache_hit": state.model_run_receipt.cache_hit,
        "model_output_token_limit": state.model_run_receipt.output_token_limit,
        "state_store": "BOUNDED_SIGNED_IN_MEMORY_SESSION",
        "offline_replay_command": "REGOS_OFFLINE=1 uv run python scripts/replay_build.py",
    }
    replay_payload = {
        "source": source_payload,
        "corpus_packs": [item.model_dump(mode="json") for item in state.corpus_packs],
        "references": [item.model_dump(mode="json") for item in state.references],
        "regulatory_statements": [
            item.model_dump(mode="json") for item in state.regulatory_statements
        ],
        "entity_profile": state.entity_profile.model_dump(mode="json"),
        "obligations": [item.model_dump(mode="json") for item in active_obligations],
        "controls": [item.model_dump(mode="json") for item in state.controls],
        "deadline_computations": [
            item.model_dump(mode="json") for item in state.deadline_computations
        ],
        "periodicity_windows": [item.model_dump(mode="json") for item in state.periodicity_windows],
        "applicability_scenarios": [
            item.model_dump(mode="json") for item in state.applicability_scenarios
        ],
        "reviewer_readings": [item.model_dump(mode="json") for item in state.reviewer_readings],
        "review_id": review.id,
        "ruleset_version": state.ruleset_version,
    }
    reproducibility["replay_input_sha256"] = canonical_sha256(replay_payload)
    payload = {
        "manifest_version": "compliance-build-manifest/1.0.0",
        "build_id": build.id,
        "generated_at": generated_at,
        "source": source_payload,
        "corpus_packs": [item.model_dump(mode="json") for item in state.corpus_packs],
        "references": [item.model_dump(mode="json") for item in state.references],
        "regulatory_statements": [
            item.model_dump(mode="json") for item in state.regulatory_statements
        ],
        "entity_profile": state.entity_profile.model_dump(mode="json"),
        "obligations": [item.model_dump(mode="json") for item in active_obligations],
        "controls": [item.model_dump(mode="json") for item in state.controls],
        "deadline_computations": [
            item.model_dump(mode="json") for item in state.deadline_computations
        ],
        "periodicity_windows": [item.model_dump(mode="json") for item in state.periodicity_windows],
        "applicability_scenarios": [
            item.model_dump(mode="json") for item in state.applicability_scenarios
        ],
        "evidence": [item.model_dump(mode="json") for item in state.evidence],
        "reviewer_readings": [item.model_dump(mode="json") for item in state.reviewer_readings],
        "reviewer": review.model_dump(mode="json"),
        "test_history": [item.model_dump(mode="json") for item in state.builds],
        "audit_event_ids": [item.id for item in state.audit_events],
        "reproducibility": reproducibility,
    }
    digest = canonical_sha256(payload)
    return Manifest(**payload, manifest_sha256=digest)


def _active_deadlines(state: WorkspaceState) -> Tuple[Optional[int], Optional[int]]:
    patch_days = None
    other_months = None
    for obligation in state.obligations:
        if obligation.status != "ACTIVE":
            continue
        if obligation.id == "OBL-PATCH-HIGH-001":
            patch_days = obligation.deadline.duration * 7
        if obligation.id == "OBL-VAPT-OTHER-001":
            other_months = obligation.deadline.duration
    return patch_days, other_months


def run_benchmark(state: WorkspaceState) -> WorkspaceState:
    patch_days, other_months = _active_deadlines(state)
    due_dates = {item.finding_id: item.due_date for item in state.deadline_computations}
    first_build_blocked_for_coverage = bool(
        state.builds
        and any(
            test.id == "TEST-COVERAGE-001" and test.status == BuildTestStatus.BLOCK
            for test in state.builds[0].tests
        )
    )
    cases: List[BenchmarkCase] = []

    def add(
        case_id: str,
        name: str,
        expected: str,
        actual: str,
        span_id: str,
        outcome: BenchmarkOutcome = BenchmarkOutcome.CORRECT,
        answerable_without_human_policy: bool = True,
        answerable_with_human_policy: bool = True,
        correct_if_forced: bool = True,
    ) -> None:
        cases.append(
            BenchmarkCase(
                id=case_id,
                name=name,
                expected=expected,
                actual=actual,
                status="PASS" if expected == actual else "FAIL",
                outcome=outcome,
                answerable_without_human_policy=answerable_without_human_policy,
                answerable_with_human_policy=answerable_with_human_policy,
                correct_if_forced=correct_if_forced,
                source_span_id=span_id,
            )
        )

    add(
        "BM-Q17-PATCH",
        "High-severity missing-patch deadline",
        "7 calendar days",
        f"{patch_days} calendar days" if patch_days else "branch missing",
        "FAQ-Q17-A",
    )
    add(
        "BM-Q17-OTHER",
        "Other VAPT observation deadline",
        "3 calendar months",
        f"{other_months} calendar months" if other_months else "branch missing",
        "FAQ-Q17-B",
    )
    add(
        "BM-PATCH-DUE-DATE",
        "Human-confirmed patch trigger plus one week",
        "2026-07-29",
        due_dates.get("F-001", "not calculated"),
        "FAQ-Q17-A",
        answerable_without_human_policy=False,
    )
    add(
        "BM-OTHER-DUE-DATE",
        "VAPT report submission plus three calendar months",
        "2026-10-20",
        due_dates.get("F-002", "not calculated"),
        "FAQ-Q17-B",
    )
    add(
        "BM-SLA-DEONTIC",
        "Encouraged vendor SLA language cannot create a compliance failure",
        "ADVISORY_GAP",
        state.vendor_slas[0].status,
        "FAQ-Q17-A",
    )
    add(
        "BM-EVIDENCE",
        "Evidence after material control change",
        "NEEDS_REVALIDATION",
        state.evidence[0].status.value,
        "FAQ-Q17-A",
    )
    add(
        "BM-Q14-NONQSB",
        "Q14 override for current non-QSB profile",
        "OUT_OF_PROFILE_SCOPE" if not state.entity_profile.is_qsb else "COMPILED_OBLIGATION",
        next(item.status.value for item in state.coverage if item.span_id == "FAQ-Q14"),
        "FAQ-Q14",
    )
    add(
        "BM-FAIL-CLOSED",
        "Unresolved material coverage blocks initial publication",
        "BLOCKED",
        "BLOCKED" if first_build_blocked_for_coverage else "NOT_OBSERVED",
        "FAQ-Q17-A",
        BenchmarkOutcome.ABSTAINED_CORRECTLY,
        answerable_without_human_policy=False,
        answerable_with_human_policy=False,
        correct_if_forced=False,
    )
    passed = sum(item.status == "PASS" for item in cases)
    total = len(cases)

    def operating_point(
        setting: str, policy: str, answered: int, incorrect_answers: int
    ) -> BenchmarkOperatingPoint:
        deferred = total - answered
        return BenchmarkOperatingPoint(
            setting=setting,
            policy=policy,
            answered=answered,
            total=total,
            answered_pct=round(answered * 100 / total, 1),
            incorrect_answers=incorrect_answers,
            error_rate_on_answered=(
                round(incorrect_answers * 100 / answered, 1) if answered else 0.0
            ),
            deferred=deferred,
            deferred_pct=round(deferred * 100 / total, 1),
        )

    conservative_answered = [item for item in cases if item.answerable_without_human_policy]
    balanced_answered = [item for item in cases if item.answerable_with_human_policy]
    operating_points = [
        operating_point(
            "CONSERVATIVE",
            (
                "Answer source-explicit and deterministic cases; defer human-policy and "
                "missing fields."
            ),
            answered=len(conservative_answered),
            incorrect_answers=sum(not item.correct_if_forced for item in conservative_answered),
        ),
        operating_point(
            "BALANCED",
            "Also answer persisted human-policy cases; continue to defer missing required fields.",
            answered=len(balanced_answered),
            incorrect_answers=sum(not item.correct_if_forced for item in balanced_answered),
        ),
        operating_point(
            "PERMISSIVE",
            "Force an answer even when a required trigger is absent.",
            answered=total,
            incorrect_answers=sum(not item.correct_if_forced for item in cases),
        ),
    ]
    result = BenchmarkResult(
        run_id=f"BENCH-{len(state.builds):04d}-{passed:02d}",
        run_at=_deterministic_time(state),
        cases=cases,
        passed=passed,
        failed=len(cases) - passed,
        label="SMALL HUMAN-VERIFIED GOLDEN SET · n=8 · SCOPE-LIMITED",
        operating_points=operating_points,
    )
    state.latest_benchmark = result
    state.audit_events.append(
        AuditEvent(
            id=f"AUD-{len(state.audit_events) + 1:04d}",
            event_type="BENCHMARK_COMPLETED",
            actor="system",
            created_at=result.run_at,
            details={"run_id": result.run_id, "passed": passed, "failed": result.failed},
        )
    )
    return state
