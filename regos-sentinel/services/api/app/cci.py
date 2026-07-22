"""Cyber Capability Index — the number a SEBI-regulated entity is actually scored on.

CSCRF requires Market Infrastructure Institutions and Qualified REs to compute a Cyber
Capability Index: **23 weighted parameters** producing a 0–100 score that falls into one
of six maturity bands, submitted every six months by MIIs and annually by Qualified REs.
The CSCRF FAQ this product is built on goes further at Q30 and says REs "shall build an
automated tool and suitable dashboard ... for submitting compliance", and notes that
having one "is also one of the parameters marked for Cyber Capability Index".

So the index is not a feature invented for a demo. It is the score the regulator asks
for, and an automated dashboard that produces it is itself one of the things being
scored.

## The honest part

This prototype does not hold evidence for all 23 parameters, and it will not pretend to.
It computes only the parameters it can evidence from the workspace in front of it, states
how many of the 23 that is, and reports every other parameter as *not assessed* rather
than scoring it zero or quietly leaving it out. Both of those alternatives produce a
number that looks like a CCI and is not one.

That is the same rule the rest of the product runs on: where the evidence stops, the
output stops, and the gap is shown rather than filled. A partial index that says which
part it is beats a complete-looking one that cannot be defended in an audit.
"""

from __future__ import annotations

from typing import Callable, List, Optional, Tuple

from .models import CciParameter, CciReport, WorkspaceState

#: SEBI's index is built from 23 weighted parameters.
CCI_PARAMETER_COUNT = 23

#: The six maturity bands, highest first. Read from the CSCRF CCI definition.
CCI_BANDS: List[Tuple[int, str, str]] = [
    (91, "Exceptional", "Well above the standard the framework sets."),
    (81, "Optimal", "Meets the standard with room to spare."),
    (71, "Manageable", "Meets the standard, with known gaps being worked."),
    (61, "Developing", "Below the standard. A plan is expected."),
    (51, "Bare Minimum", "Only just above failing. Remediation is expected."),
    (0, "Fail", "Below the minimum the framework accepts."),
]


def band_for(score: float) -> Tuple[str, str]:
    for floor, name, meaning in CCI_BANDS:
        if score >= floor:
            return name, meaning
    return CCI_BANDS[-1][1], CCI_BANDS[-1][2]


#: One assessable parameter: a plain title, a weight, and a way to score it from state.
#: ``evaluate`` returns ``(score 0..1, evidence sentence)`` or ``None`` to abstain.
Evaluator = Callable[[WorkspaceState], Optional[Tuple[float, str]]]


def _ratio(part: int, whole: int) -> float:
    return 1.0 if whole == 0 else part / whole


# --------------------------------------------------------------------------- #
# The parameters this workspace can actually evidence
# --------------------------------------------------------------------------- #


def _evidence_currency(state: WorkspaceState) -> Optional[Tuple[float, str]]:
    if not state.evidence:
        return None
    current = [item for item in state.evidence if item.status == "CURRENT"]
    return (
        _ratio(len(current), len(state.evidence)),
        f"{len(current)} of {len(state.evidence)} evidence documents are up to date.",
    )


def _source_traceability(state: WorkspaceState) -> Optional[Tuple[float, str]]:
    active = [item for item in state.obligations if item.status.startswith("ACTIVE")]
    if not active:
        return None
    cited = [
        item
        for item in active
        if item.deadline.citation.locator and item.deadline.citation.quote
    ]
    return (
        _ratio(len(cited), len(active)),
        f"{len(cited)} of {len(active)} requirements quote the exact SEBI wording "
        "they come from.",
    )


def _reference_closure(state: WorkspaceState) -> Optional[Tuple[float, str]]:
    if not state.references:
        return None
    closed = [item for item in state.references if item.status.value == "RESOLVED_HASHED"]
    return (
        _ratio(len(closed), len(state.references)),
        f"{len(closed)} of {len(state.references)} cross-references into the main "
        "framework have been followed and fingerprinted.",
    )


def _deadline_computability(state: WorkspaceState) -> Optional[Tuple[float, str]]:
    if not state.deadline_computations:
        return None
    computable = [item for item in state.deadline_computations if item.computable]
    blocked = len(state.deadline_computations) - len(computable)
    detail = (
        f"{len(computable)} of {len(state.deadline_computations)} deadlines can be "
        "worked out from the wording."
    )
    if blocked:
        detail += (
            f" {blocked} cannot, because SEBI states a period without saying what "
            "starts it — that gap is recorded, not filled."
        )
    return _ratio(len(computable), len(state.deadline_computations)), detail


def _human_oversight(state: WorkspaceState) -> Optional[Tuple[float, str]]:
    if not state.obligations:
        return None
    if state.reviews:
        latest = state.reviews[-1]
        return (
            1.0,
            f"The material interpretation was approved by {latest.reviewer_name} "
            f"({latest.reviewer_role}), with a written reason on the record.",
        )
    return (
        0.0,
        "No named person has yet approved the interpretation the requirements rest on.",
    )


def _vendor_alignment(state: WorkspaceState) -> Optional[Tuple[float, str]]:
    if not state.vendor_slas:
        return None
    aligned = [
        item
        for item in state.vendor_slas
        if item.advisory_reference_days is None
        or item.committed_days <= item.advisory_reference_days
    ]
    return (
        _ratio(len(aligned), len(state.vendor_slas)),
        f"{len(aligned)} of {len(state.vendor_slas)} vendor agreements sit within the "
        "timeline the source refers to.",
    )


def _audit_trail_integrity(state: WorkspaceState) -> Optional[Tuple[float, str]]:
    if not state.agent_runs:
        return None
    verified = [item for item in state.agent_runs if item.chain_verified]
    return (
        _ratio(len(verified), len(state.agent_runs)),
        f"{len(verified)} of {len(state.agent_runs)} automated review runs have an "
        "intact tamper-evident record.",
    )


def _automated_dashboard(state: WorkspaceState) -> Optional[Tuple[float, str]]:
    """FAQ Q30. Having this dashboard is itself one of the scored parameters."""
    return (
        1.0,
        "An automated compliance dashboard is in place and producing this assessment, "
        "which the CSCRF FAQ (Q30) names as a scored parameter in its own right.",
    )


def _coverage_disposition(state: WorkspaceState) -> Optional[Tuple[float, str]]:
    if not state.coverage:
        return None
    settled = [
        item
        for item in state.coverage
        if item.status.value != "AMBIGUOUS_REVIEW_REQUIRED"
    ]
    return (
        _ratio(len(settled), len(state.coverage)),
        f"{len(settled)} of {len(state.coverage)} passages of the source have been "
        "given a disposition rather than left open.",
    )


#: ``(id, plain title, what it means, weight, evaluator)``.
#:
#: The weights are this prototype's own and are stated as such — SEBI publishes its
#: own weighting for the full 23, and claiming to reproduce it from evidence we do not
#: hold would be exactly the kind of invention this product exists to refuse.
PARAMETERS: List[Tuple[str, str, str, int, Evaluator]] = [
    (
        "CCI-TRACEABILITY",
        "Every requirement traces to exact SEBI wording",
        "An auditor can go from any obligation to the sentence it came from.",
        12,
        _source_traceability,
    ),
    (
        "CCI-DEADLINES",
        "Deadlines are worked out, or the gap is declared",
        "No date is published that the source does not support.",
        12,
        _deadline_computability,
    ),
    (
        "CCI-HUMAN-OVERSIGHT",
        "A named person approved the interpretation",
        "Judgement calls carry a name, a role and a written reason.",
        12,
        _human_oversight,
    ),
    (
        "CCI-COVERAGE",
        "The whole source has been dealt with",
        "No passage is silently skipped.",
        10,
        _coverage_disposition,
    ),
    (
        "CCI-REFERENCES",
        "Cross-references into the framework are closed",
        "Pointers to the main CSCRF have been followed, not assumed.",
        10,
        _reference_closure,
    ),
    (
        "CCI-EVIDENCE",
        "Supporting evidence is current",
        "The documents behind each control are up to date.",
        10,
        _evidence_currency,
    ),
    (
        "CCI-AUDIT-TRAIL",
        "The record cannot be edited after the fact",
        "Every automated review step is hash-chained and re-checkable.",
        10,
        _audit_trail_integrity,
    ),
    (
        "CCI-VENDOR",
        "Vendor commitments match the timelines",
        "Third-party agreements sit inside the periods the source refers to.",
        8,
        _vendor_alignment,
    ),
    (
        "CCI-DASHBOARD",
        "An automated compliance dashboard exists",
        "Required by the CSCRF FAQ at Q30, and scored in its own right.",
        6,
        _automated_dashboard,
    ),
]


def compute_cci(state: WorkspaceState) -> CciReport:
    """Score the parameters this workspace can evidence, and abstain on the rest."""
    rows: List[CciParameter] = []
    earned = 0.0
    available = 0

    for identifier, title, meaning, weight, evaluate in PARAMETERS:
        outcome = evaluate(state)
        if outcome is None:
            rows.append(
                CciParameter(
                    id=identifier,
                    title=title,
                    meaning=meaning,
                    weight=weight,
                    assessed=False,
                    score=None,
                    evidence="Nothing in this workspace evidences this yet.",
                )
            )
            continue
        score, evidence = outcome
        earned += score * weight
        available += weight
        rows.append(
            CciParameter(
                id=identifier,
                title=title,
                meaning=meaning,
                weight=weight,
                assessed=True,
                score=round(score * 100),
                evidence=evidence,
            )
        )

    assessed = [item for item in rows if item.assessed]
    score = round((earned / available) * 100) if available else 0
    name, meaning = band_for(score)

    return CciReport(
        score=score,
        band=name,
        band_meaning=meaning,
        parameters_assessed=len(assessed),
        parameters_total=CCI_PARAMETER_COUNT,
        parameters=rows,
        bands=[
            {"name": band_name, "floor": str(floor), "meaning": band_meaning}
            for floor, band_name, band_meaning in CCI_BANDS
        ],
        limitation=(
            f"This is a partial index. SEBI's Cyber Capability Index is built from "
            f"{CCI_PARAMETER_COUNT} weighted parameters; this workspace holds evidence "
            f"for {len(assessed)}, and the score above covers only those. The remaining "
            f"{CCI_PARAMETER_COUNT - len(assessed)} are reported as not assessed rather "
            "than scored zero or dropped, because either choice would produce a number "
            "that looks like a CCI and could not be defended. The weights are this "
            "prototype's own, not SEBI's published weighting."
        ),
        obligation=(
            "MIIs submit this every six months; Qualified REs submit it annually. The "
            "CSCRF FAQ at Q30 requires an automated tool and dashboard for submitting "
            "compliance, and counts having one as a scored parameter."
        ),
    )
