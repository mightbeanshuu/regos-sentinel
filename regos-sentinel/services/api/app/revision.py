"""Case D — controlled source-version comparison.

A regulator's text does not stand still. This module answers one question: when a
source version changes, what does a compliance system owe its user?

The answer this prototype defends is *a reviewable change report, never a silent
update*. Every change below is computed by :func:`diff_provisions` from two pinned
provision sets; nothing here is a hand-written list of "changes".

## The honesty problem, and how it is handled

SEBI has published exactly one version of the CSCRF FAQ used by this prototype
(11 June 2025). To demonstrate version comparison at all, the *second* version has
to be constructed. It therefore carries, in the data itself and not merely in the
UI copy:

* ``authority`` that names the prototype, not SEBI;
* ``legal_state`` of ``SYNTHETIC DEMONSTRATION REVISION — NOT PUBLISHED BY SEBI``;
* ``synthetic=True`` on the revision record, per invariant I5.

No passage below may ever be presented, quoted or exported as SEBI wording.
"""

from __future__ import annotations

from typing import Dict, List, Optional

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

REVISION_ID = "REV-SYNTHETIC-2026-01"
REVISION_AUTHORITY = "RegOS Sentinel prototype — synthetic demonstration revision"
REVISION_LEGAL_STATE = "SYNTHETIC DEMONSTRATION REVISION — NOT PUBLISHED BY SEBI"
REVISION_LOCATOR_PREFIX = "Synthetic revision · constructed for this demonstration"


class Provision(StrictModel):
    """One topic-identified statement, on either side of a version comparison."""

    subject_key: str
    subject: str
    locator: str
    quote: str
    strength: DeonticForce
    span_id: Optional[str] = None
    supersedes: Optional[str] = None


#: The declared comparison scope. A version diff is only honest about the topics it
#: actually looked at, so the scope is named rather than implied.
DIFF_SCOPE_KEYS = (
    "vapt.closure.timeline",
    "vapt.vendor.sla.timeline",
    "vapt.virtual.patching",
    "patch.high.severity.timeline",
    "vapt.other.observation.timeline",
)

SCOPE_NOTE = (
    "Five VAPT and patch-management topics from the reviewed pack, compared against a "
    "synthetic revision of the same five topics plus one added topic."
)


def _revision_provisions() -> List[Provision]:
    """The synthetic second version. Every quote here is prototype text, not SEBI text."""
    return [
        Provision(
            subject_key="vapt.closure.timeline",
            subject="VAPT finding closure timeline",
            locator=f"{REVISION_LOCATOR_PREFIX} · §1",
            quote="is within three (3) months of submission of VAPT report",
            strength=DeonticForce.MANDATORY,
        ),
        Provision(
            subject_key="vapt.vendor.sla.timeline",
            subject="Vendor SLA closure timelines",
            locator=f"{REVISION_LOCATOR_PREFIX} · §2",
            quote=(
                "REs shall include VAPT finding closure timelines in their service-level "
                "agreements with third-party service providers"
            ),
            strength=DeonticForce.MANDATORY,
        ),
        Provision(
            subject_key="vapt.virtual.patching",
            subject="Virtual patching as a compensatory control",
            locator=f"{REVISION_LOCATOR_PREFIX} · §3",
            quote="REs may also consider compensatory controls like virtual patching",
            strength=DeonticForce.PERMITTED,
        ),
        Provision(
            subject_key="patch.high.severity.timeline",
            subject="High-severity missing-patch timeline",
            locator=f"{REVISION_LOCATOR_PREFIX} · §4",
            quote=(
                "would be validated for non-compliances against the patch management timelines"
            ),
            strength=DeonticForce.MANDATORY,
        ),
        Provision(
            subject_key="patch.register.clock.start",
            subject="Clock-start for the patch implementation timeline",
            locator=f"{REVISION_LOCATOR_PREFIX} · §5",
            quote=(
                "the patch implementation timeline shall be counted from the date on which the "
                "vulnerability is recorded in the entity vulnerability register"
            ),
            strength=DeonticForce.MANDATORY,
        ),
        Provision(
            subject_key="vapt.observation.closure.consolidated",
            subject="Consolidated VAPT observation closure timelines",
            locator=f"{REVISION_LOCATOR_PREFIX} · §6",
            quote=(
                "closure timelines for VAPT observations other than missing patches are "
                "consolidated in the revised closure table"
            ),
            strength=DeonticForce.MANDATORY,
            supersedes="vapt.other.observation.timeline",
        ),
    ]


def base_provisions(state: WorkspaceState) -> List[Provision]:
    """The first version, read from live workspace state rather than restated here."""
    spans = {span.id: span for span in state.source_spans}
    provisions: List[Provision] = []
    for statement in state.regulatory_statements:
        if statement.subject_key not in DIFF_SCOPE_KEYS:
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


def _human_policy_control_ids(state: WorkspaceState) -> List[str]:
    """Controls whose deadline currently rests on a person's policy rather than the source."""
    control_ids = [
        obligation.control_id
        for obligation in state.obligations
        if obligation.status == "ACTIVE"
        and obligation.deadline.trigger_provenance == Provenance.HUMAN_POLICY
    ]
    return sorted(set(control_ids))


def _evidence_for_controls(state: WorkspaceState, control_ids: List[str]) -> List[str]:
    """Conservative rule: an impacted control puts every one of its artifacts back in the queue."""
    return sorted(item.id for item in state.evidence if item.control_id in control_ids)


def diff_provisions(
    state: WorkspaceState,
    base: List[Provision],
    revision: List[Provision],
) -> List[SourceChange]:
    """Compare two provision sets by topic and derive the operational consequence of each.

    The kind of a change is decided by topic identity, exact wording and requirement
    strength — never by a stored answer. The consequence of a change is then derived
    from live workspace state, so an impacted control is one that genuinely exists.
    """
    base_by_key: Dict[str, Provision] = {item.subject_key: item for item in base}
    changes: List[SourceChange] = []
    superseded_keys = {item.supersedes for item in revision if item.supersedes}

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

        if kind == SourceChangeKind.UNCHANGED:
            impacted: List[str] = []
            impact_summary = "No operational consequence. Wording and strength both match."
            note = "Recorded so the comparison shows what was checked, not only what moved."
        elif kind == SourceChangeKind.ADDED and after.subject_key == "patch.register.clock.start":
            patch_span_id = next(
                (
                    item.span_id
                    for item in base
                    if item.subject_key == "patch.high.severity.timeline"
                ),
                None,
            )
            impacted = _human_policy_control_ids(state) or _control_ids_for_span(
                state, patch_span_id
            )
            impact_summary = (
                "A stated clock-start would replace the firm policy currently standing in for it."
            )
            note = (
                "RegOS does not switch a deadline from a person's policy to source wording on "
                "its own. The reviewer who recorded the policy has to accept the replacement."
            )
        elif kind == SourceChangeKind.ADDED:
            impacted = []
            impact_summary = "A new topic with no control mapped to it yet."
            note = "Compilation of a new topic stays a reviewed step."
        elif escalated:
            impacted = _control_ids_for_span(state, before_span_id)
            impact_summary = (
                "Requirement strength rises from recommended to required, so the same wording "
                "would now create mandatory work rather than an advisory."
            )
            note = (
                "Under the reviewed version this sentence is an advisory. A reviewer must "
                "confirm the escalation before any control is allowed to fail on it."
            )
        elif kind == SourceChangeKind.SUPERSEDED:
            impacted = _control_ids_for_span(state, before_span_id)
            impact_summary = "The passage a live control was compiled from no longer stands alone."
            note = "The superseding passage has to be read and compiled before the control moves."
        else:
            impacted = _control_ids_for_span(state, before_span_id)
            impact_summary = "Wording changed on a topic a live control depends on."
            note = "Re-reading the changed wording is a human step."

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

    # A base topic that the revision neither restates nor supersedes would be an
    # unexplained disappearance. Surfacing it is the whole point of the gate.
    for key, before in sorted(base_by_key.items()):
        restated = any(
            item.subject_key == key or item.supersedes == key for item in revision
        )
        if restated or key in superseded_keys:
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


def build_revision(state: WorkspaceState) -> tuple[SourceRevision, List[SourceChange]]:
    base = base_provisions(state)
    revision = _revision_provisions()
    changes = diff_provisions(state, base, revision)
    record = SourceRevision(
        id=REVISION_ID,
        from_version=state.source_version,
        to_version="synthetic-revision/2026-01-demo-v1",
        authority=REVISION_AUTHORITY,
        legal_state=REVISION_LEGAL_STATE,
        scope_note=SCOPE_NOTE,
        disclaimer=(
            "The second version in this comparison was written for the demonstration. SEBI has "
            "not published it, and no sentence in it may be read, quoted or exported as SEBI "
            "wording. The first version is the real reviewed FAQ pack."
        ),
        base_content_sha256=canonical_sha256([item.model_dump(mode="json") for item in base]),
        revision_content_sha256=canonical_sha256(
            [item.model_dump(mode="json") for item in revision]
        ),
        synthetic=True,
    )
    return record, changes
