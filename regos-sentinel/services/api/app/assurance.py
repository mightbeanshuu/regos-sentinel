"""AI assurance — what the model did, what the code did, what the person did.

The temptation with an AI compliance product is to publish one accuracy number. This
module refuses to. Instead it reports, field by field, what the committed model
extraction proposed and what the deterministic gates did with each proposal — accepted,
overridden, or abstention upheld.

The claim this supports is narrow and true:

    RegOS uses AI to propose structure, deterministic rules to enforce safety, and a
    human to approve material interpretation.

Everything here is computed from the committed cache and live workspace state, so the
numbers move when the system does.
"""

from __future__ import annotations

from typing import List, Optional

from .model_cache import CachedCandidate, CachedExtraction, load_model_cache
from .models import (
    AbstentionRecord,
    AiAssuranceReport,
    CandidateFieldOutcome,
    PipelineActor,
    PipelineStage,
    Provenance,
    ResponsibilitySplit,
    WorkspaceState,
)

STATEMENT = (
    "RegOS uses AI to propose structure, deterministic rules to enforce safety, and a "
    "human to approve material interpretation."
)

PIPELINE = [
    PipelineStage(
        id="P1",
        name="Source parser",
        actor=PipelineActor.SOURCE,
        plain="Read the official PDF and split it into passages with page locators.",
    ),
    PipelineStage(
        id="P2",
        name="Candidate extraction",
        actor=PipelineActor.AI,
        plain="Propose who must do what, by when, and quote the wording it relied on.",
    ),
    PipelineStage(
        id="P3",
        name="Schema validation",
        actor=PipelineActor.DETERMINISTIC,
        plain="Reject any proposal that does not fit the obligation schema exactly.",
    ),
    PipelineStage(
        id="P4",
        name="Regulatory gates",
        actor=PipelineActor.DETERMINISTIC,
        plain=(
            "Refuse a date without a stated trigger, keep advice out of mandatory work, "
            "and decide applicability from entity facts."
        ),
    ),
    PipelineStage(
        id="P5",
        name="Human review",
        actor=PipelineActor.HUMAN,
        plain="A named person resolves what the source leaves open, in writing.",
    ),
    PipelineStage(
        id="P6",
        name="Approved operational work",
        actor=PipelineActor.DETERMINISTIC,
        plain="Create tasks, update evidence and seal a replayable build record.",
    ),
]

SPLIT = ResponsibilitySplit(
    ai_does=[
        "Identify candidate actors, actions and objects in a passage",
        "Extract durations that the passage states",
        "Suggest the conditions a requirement appears to depend on",
        "Preserve the exact quotation it drew each field from",
        "Flag a passage as ambiguous instead of resolving it",
    ],
    deterministic_does=[
        "Validate every proposal against the obligation schema",
        "Enforce provenance on each derived field",
        "Refuse a due date when no trigger is stated",
        "Keep recommended and permitted language out of mandatory work",
        "Calculate dates only once a valid trigger exists",
        "Decide applicability from recorded entity facts",
        "Create tasks, update evidence and seal the build record",
    ],
    human_does=[
        "Resolve material ambiguity the source leaves open",
        "Supply firm policy where the source is silent",
        "Accept or reject each candidate interpretation",
        "Give a written reason that travels with the record",
    ],
)

LIMITATION = (
    "Measured on the committed extraction cache for the reviewed FAQ scope, on one model at "
    "temperature 0. It is a prototype measurement over a small pinned input, not a statement "
    "about model accuracy in general."
)


def _obligation_for_span(state: WorkspaceState, span_id: str):
    """The live obligation compiled from a passage, preferring an active one."""
    matches = [
        item
        for item in state.obligations
        if item.deadline.citation.span_id == span_id and not item.status.startswith("SUPERSEDED")
    ]
    active = [item for item in matches if item.status == "ACTIVE"]
    return (active or matches or [None])[0]


def _field_outcomes(
    state: WorkspaceState,
    candidate: CachedCandidate,
) -> tuple[List[CandidateFieldOutcome], Optional[AbstentionRecord]]:
    obligation = _obligation_for_span(state, candidate.source_span_id)
    outcomes: List[CandidateFieldOutcome] = []

    if obligation is None:
        outcomes.append(
            CandidateFieldOutcome(
                candidate_id=candidate.candidate_id,
                field="candidate",
                proposed=f"{candidate.duration} {candidate.unit}",
                accepted=False,
                resolution=(
                    "Not compiled. No requirement from this passage has cleared the gates."
                ),
            )
        )
        return outcomes, None

    duration_accepted = (
        obligation.deadline.duration == candidate.duration
        and obligation.deadline.unit == candidate.unit
    )
    outcomes.append(
        CandidateFieldOutcome(
            candidate_id=candidate.candidate_id,
            field="duration",
            proposed=f"{candidate.duration} {candidate.unit}",
            accepted=duration_accepted,
            resolution=(
                "Accepted. The passage states it and the compiled requirement matches."
                if duration_accepted
                else (
                    f"Overridden. The compiled requirement uses "
                    f"{obligation.deadline.duration} {obligation.deadline.unit}."
                )
            ),
            provenance_after_gates=obligation.deadline.duration_provenance,
        )
    )

    live_trigger = obligation.deadline.trigger
    abstention: Optional[AbstentionRecord] = None
    if candidate.trigger is None:
        upheld = live_trigger is None or (
            obligation.deadline.trigger_provenance == Provenance.HUMAN_POLICY
        )
        abstention = AbstentionRecord(
            candidate_id=candidate.candidate_id,
            field="trigger",
            model_abstained=True,
            gate_upheld_abstention=upheld,
            note=(
                "The model returned no trigger and the gates published no date from the "
                "source. Any trigger now present came from a person and is labelled as such."
                if upheld
                else (
                    "The model abstained but a source-labelled trigger reached the "
                    "compiled requirement. This is exactly the failure the gate exists to stop."
                )
            ),
        )
        outcomes.append(
            CandidateFieldOutcome(
                candidate_id=candidate.candidate_id,
                field="trigger",
                proposed="null — model declined to state one",
                accepted=upheld,
                resolution=(
                    "Abstention upheld. "
                    + (
                        "Still blocked; no date exists."
                        if live_trigger is None
                        else "Resolved later by a named person, recorded as firm policy."
                    )
                    if upheld
                    else "Abstention not upheld — a trigger appeared without a person."
                ),
                provenance_after_gates=obligation.deadline.trigger_provenance,
            )
        )
    else:
        accepted = live_trigger is not None
        outcomes.append(
            CandidateFieldOutcome(
                candidate_id=candidate.candidate_id,
                field="trigger",
                proposed=candidate.trigger,
                accepted=accepted,
                resolution=(
                    "Accepted. The quoted passage states the event that starts the clock."
                    if accepted
                    else "Rejected. The gates found no stated trigger in the cited passage."
                ),
                provenance_after_gates=obligation.deadline.trigger_provenance,
            )
        )

    quote_preserved = candidate.exact_quote.strip() != ""
    outcomes.append(
        CandidateFieldOutcome(
            candidate_id=candidate.candidate_id,
            field="exact_quote",
            proposed=(
                candidate.exact_quote[:120]
                + ("…" if len(candidate.exact_quote) > 120 else "")
            ),
            accepted=quote_preserved,
            resolution=(
                "Accepted. The quotation is carried into the citation on every derived field."
                if quote_preserved
                else "Rejected. A candidate without a quotation cannot be cited."
            ),
            provenance_after_gates=Provenance.SOURCE_EXPLICIT,
        )
    )
    return outcomes, abstention


def build_assurance_report(state: WorkspaceState) -> AiAssuranceReport:
    receipt, extraction = load_model_cache(state.source_spans)
    return _report_from(state, receipt, extraction)


def _report_from(state: WorkspaceState, receipt, extraction: CachedExtraction) -> AiAssuranceReport:
    outcomes: List[CandidateFieldOutcome] = []
    abstentions: List[AbstentionRecord] = []
    for candidate in extraction.candidates:
        candidate_outcomes, abstention = _field_outcomes(state, candidate)
        outcomes.extend(candidate_outcomes)
        if abstention is not None:
            abstentions.append(abstention)

    return AiAssuranceReport(
        statement=STATEMENT,
        pipeline=PIPELINE,
        split=SPLIT,
        receipt=receipt,
        candidate_count=len(extraction.candidates),
        field_outcomes=outcomes,
        accepted_field_count=sum(1 for item in outcomes if item.accepted),
        rejected_field_count=sum(1 for item in outcomes if not item.accepted),
        abstentions=abstentions,
        benchmark=state.latest_benchmark,
        limitation=LIMITATION,
    )
