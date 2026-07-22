"""Case D — comparing the reviewed corpus against a newer real SEBI source.

The second version here is not constructed. It is SEBI circular
``HO/13/19/12(1)2026-ITD-1_CIMGI/10873/2026``, the *Advisory on Emerging Advanced
Artificial Intelligence (AI) Tools for Vulnerability Detection*, published 5 May 2026
— nine months after the CSCRF FAQ this prototype was built around, on the same subject
matter. Every quotation below is the regulator's own wording.

## The relationship decides the reading

Paragraph E of the advisory says it "should be read in conjunction with the applicable
SEBI circulars (including but not limited to Cybersecurity and Cyber Resilience
framework)". It **adds** duties; it does not replace the FAQ. That single fact governs
the whole comparison:

* a topic the advisory addresses differently is a **change**;
* a topic only the advisory addresses is an **addition**;
* a topic the advisory is silent on is **not addressed** — it keeps being governed by
  the reviewed corpus, and calling that a disappearance would be a misreading.

Getting this wrong manufactures six alarming findings out of nothing, which is why the
relationship is declared explicitly rather than assumed.

## What the comparison actually surfaces

Two findings matter and neither was arranged:

**The vendor-SLA escalation.** FAQ Q15 says REs "are encouraged to" include VAPT
closure timelines in vendor SLAs — recommended, no mandatory work. The advisory says
empanelled vendors "shall implement appropriate safeguards". Same topic, strength
raised from recommended to required. This is the exact escalation Case B says the gates
must never invent — and here a real regulator performed it.

**The patch-timing shift.** Q17(a) states a period (one week) with no clock-start. The
advisory states urgency ("on immediate basis") with no period at all. Both are blocked,
for different reasons, and neither yields a date.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from .advisory import (
    ADVISORY_NUMBER,
    ADVISORY_PUBLISHED,
    advisory_content_hash,
    advisory_spans,
    advisory_statements,
)
from .agents.tools import analyse_timing
from .canonical import canonical_sha256
from .models import (
    DeonticForce,
    Provenance,
    SourceChange,
    SourceChangeKind,
    SourceRevision,
    StrictModel,
    WorkspaceState,
)

REVISION_ID = "REV-SEBI-AI-ADVISORY-2026-05-05"

#: How the newer source describes its own relationship to the reviewed corpus.
#: Taken from paragraph E, not assumed.
RELATIONSHIP = "READ_IN_CONJUNCTION_WITH"

SCOPE_NOTE = (
    "The reviewed CSCRF FAQ pack compared, topic by topic, against SEBI's 5 May 2026 "
    "AI vulnerability-detection advisory. The advisory states that it is to be read in "
    "conjunction with the CSCRF, so topics it does not address remain governed by the "
    "reviewed corpus rather than being treated as withdrawn."
)


class Provision(StrictModel):
    """One topic-identified statement, on either side of a version comparison."""

    subject_key: str
    subject: str
    locator: str
    quote: str
    strength: DeonticForce
    span_id: Optional[str] = None
    supersedes: Optional[str] = None


def _advisory_provisions() -> List[Provision]:
    """The newer side, built from the real advisory's own passages."""
    spans = {span.id: span for span in advisory_spans()}
    provisions: List[Provision] = []
    for statement in advisory_statements(list(spans.values())):
        if not statement.subject_key:
            continue
        span = spans[statement.span_id]
        provisions.append(
            Provision(
                subject_key=statement.subject_key,
                subject=statement.subject or statement.subject_key,
                locator=span.locator,
                quote=statement.exact_phrase,
                strength=statement.deontic_force,
                span_id=span.id,
            )
        )
    return sorted(provisions, key=lambda item: item.subject_key)


def base_provisions(state: WorkspaceState) -> List[Provision]:
    """The reviewed side, read from live workspace state rather than restated here."""
    spans = {span.id: span for span in state.source_spans}
    provisions: List[Provision] = []
    for statement in state.regulatory_statements:
        if not statement.subject_key:
            continue
        span = spans.get(statement.span_id)
        provisions.append(
            Provision(
                subject_key=statement.subject_key,
                subject=statement.subject or statement.subject_key,
                locator=span.locator if span else statement.span_id,
                quote=statement.exact_phrase,
                strength=statement.deontic_force,
                span_id=statement.span_id,
            )
        )
    return sorted(provisions, key=lambda item: item.subject_key)


def _control_ids_for_span(state: WorkspaceState, span_id: Optional[str]) -> List[str]:
    """Controls reachable from a passage.

    Two routes, because a passage reaches a control two ways: through an obligation that
    cites it directly, and through the coverage entry that records what the passage was
    compiled into. The second route matters after a review supersedes the obligation that
    originally carried the citation — the passage still governs the control, and a change
    to it still has to reach that control.
    """
    if span_id is None:
        return []
    live = {
        obligation.id: obligation
        for obligation in state.obligations
        if not obligation.status.startswith("SUPERSEDED")
    }
    control_ids: set[str] = set()
    for obligation in live.values():
        cited = {citation.span_id for citation in obligation.field_citations.values()}
        cited.add(obligation.deadline.citation.span_id)
        if span_id in cited:
            control_ids.add(obligation.control_id)
    for entry in state.coverage:
        if entry.span_id != span_id:
            continue
        for obligation_id in entry.obligation_ids:
            obligation = live.get(obligation_id)
            if obligation is not None:
                control_ids.add(obligation.control_id)
    return sorted(control_ids)


def _evidence_for_controls(state: WorkspaceState, control_ids: List[str]) -> List[str]:
    """Conservative rule: an impacted control puts every one of its artifacts back in the queue."""
    return sorted(item.id for item in state.evidence if item.control_id in control_ids)


def diff_provisions(
    state: WorkspaceState,
    base: List[Provision],
    revision: List[Provision],
    relationship: str = RELATIONSHIP,
) -> List[SourceChange]:
    """Compare two provision sets by topic and derive the consequence of each.

    The kind of a change is decided by topic identity, exact wording and requirement
    strength — never by a stored answer. The consequence is then derived from live
    workspace state, so an impacted control is one that genuinely exists.
    """
    base_by_key: Dict[str, Provision] = {item.subject_key: item for item in base}
    additive = relationship == RELATIONSHIP
    changes: List[SourceChange] = []

    for index, after in enumerate(sorted(revision, key=lambda item: item.subject_key), start=1):
        before = base_by_key.get(after.supersedes or after.subject_key)
        if after.supersedes:
            kind = SourceChangeKind.SUPERSEDED
        elif before is None:
            kind = SourceChangeKind.ADDED
        elif before.quote != after.quote or before.strength != after.strength:
            kind = SourceChangeKind.CHANGED
        else:
            kind = SourceChangeKind.UNCHANGED

        escalated = (
            before is not None
            and before.strength != DeonticForce.MANDATORY
            and after.strength == DeonticForce.MANDATORY
        )
        before_span_id = before.span_id if before else None
        timing = analyse_timing(after.quote)

        if kind == SourceChangeKind.UNCHANGED:
            impacted: List[str] = []
            impact_summary = "No operational consequence. Wording and strength both match."
            note = "Recorded so the comparison shows what was checked, not only what moved."
        elif escalated and before is not None:
            impacted = _control_ids_for_span(state, before_span_id)
            impact_summary = (
                "Requirement strength rises from "
                f"{before.strength.value.lower()} to required, so the same topic would "
                "now create mandatory work rather than an advisory."
            )
            note = (
                "Under the reviewed version this was not mandatory. A reviewer must "
                "confirm the escalation before any control is allowed to fail on it. "
                f"Timing in the newer wording: {timing['verdict']}."
            )
        elif kind == SourceChangeKind.ADDED:
            impacted = []
            impact_summary = (
                "A duty this entity's control register has no mapping for yet. "
                f"Timing: {timing['verdict']}."
            )
            note = "Compiling a new topic stays a reviewed step. " + str(timing["note"])
        elif kind == SourceChangeKind.SUPERSEDED:
            impacted = _control_ids_for_span(state, before_span_id)
            impact_summary = "The passage a live control was compiled from no longer stands alone."
            note = "The superseding passage has to be read and compiled before the control moves."
        else:
            impacted = _control_ids_for_span(state, before_span_id)
            impact_summary = (
                "Wording changed on a topic a live control depends on. "
                f"Timing in the newer wording: {timing['verdict']}."
            )
            note = f"Re-reading the changed wording is a human step. {timing['note']}"

        changes.append(
            SourceChange(
                id=f"CHG-{index:03d}",
                kind=kind,
                subject=after.subject,
                subject_key=after.supersedes or after.subject_key,
                before_locator=before.locator if before else None,
                before_quote=before.quote if before else None,
                before_strength=before.strength if before else None,
                after_locator=after.locator,
                after_quote=after.quote,
                after_strength=after.strength,
                impact_summary=impact_summary,
                impacted_control_ids=impacted,
                evidence_ids_for_review=_evidence_for_controls(state, impacted),
                creates_mandatory_work=escalated,
                review_required=kind != SourceChangeKind.UNCHANGED,
                applied_automatically=False,
                provenance=Provenance.DETERMINISTIC,
                note=note,
            )
        )

    if additive:
        # The newer source is read *with* the reviewed corpus, so its silence on a topic
        # is ordinary. Treating that silence as a repeal would invent findings.
        return changes

    restated = {item.subject_key for item in revision} | {
        item.supersedes for item in revision if item.supersedes
    }
    for key, before in sorted(base_by_key.items()):
        if key in restated:
            continue
        impacted = _control_ids_for_span(state, before.span_id)
        changes.append(
            SourceChange(
                id=f"CHG-{len(changes) + 1:03d}",
                kind=SourceChangeKind.SUPERSEDED,
                subject=before.subject,
                subject_key=key,
                before_locator=before.locator,
                before_quote=before.quote,
                before_strength=before.strength,
                impact_summary="Present in the reviewed version and absent from the revision.",
                impacted_control_ids=impacted,
                evidence_ids_for_review=_evidence_for_controls(state, impacted),
                review_required=True,
                provenance=Provenance.DETERMINISTIC,
                note="An unexplained disappearance is escalated, never treated as a repeal.",
            )
        )
    return changes


def untouched_topics(state: WorkspaceState) -> List[str]:
    """Reviewed topics the advisory does not address. Named, not silently dropped."""
    addressed = {item.subject_key for item in _advisory_provisions()}
    return sorted({item.subject_key for item in base_provisions(state)} - addressed)


def build_revision(state: WorkspaceState) -> tuple[SourceRevision, List[SourceChange]]:
    base = base_provisions(state)
    revision = _advisory_provisions()
    changes = diff_provisions(state, base, revision)
    record = SourceRevision(
        id=REVISION_ID,
        from_version=state.source_version,
        to_version=f"sebi-advisory/{ADVISORY_PUBLISHED} · {ADVISORY_NUMBER}",
        authority="Securities and Exchange Board of India",
        legal_state="IN FORCE — READ WITH CSCRF",
        scope_note=SCOPE_NOTE,
        disclaimer=(
            "Both versions in this comparison are real SEBI documents. The newer one is "
            f"circular {ADVISORY_NUMBER} dated 5 May 2026, and it states at paragraph E "
            "that it is to be read in conjunction with the CSCRF rather than in place "
            "of it. The English extraction is partial and its gaps are declared on the "
            "corpus pack."
        ),
        base_content_sha256=canonical_sha256([item.model_dump(mode="json") for item in base]),
        revision_content_sha256=advisory_content_hash(advisory_spans()),
        synthetic=False,
    )
    return record, changes
