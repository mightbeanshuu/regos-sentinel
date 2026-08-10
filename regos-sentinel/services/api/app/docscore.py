"""Per-document model scorecard — RegOS's own classifier over any uploaded PDF.

Every figure here is computed fresh from the document's extracted passages at
request time, by the committed-weights timing classifier plus the deterministic
strength rules that already classified each passage. Nothing is stored, nothing
is estimated: when a denominator is zero the field is None, never a pretend 0.

The composite figure is deliberately a single transparent ratio, stated in
`clarity_formula`, so a juror can recompute it from the rows on screen.
"""

from __future__ import annotations

from typing import List, Optional

from .documents import PassageClass, UploadedDocument
from .model.classifier import MODEL_VERSION, load_classifier
from .models import StrictModel

# Passage classes that carry normative force and therefore deserve a timing read.
NORMATIVE_CLASSES = {PassageClass.POSSIBLE_REQUIREMENT, PassageClass.NEEDS_REVIEW}

TIMING_LABELS = ("PERIOD_AND_TRIGGER", "PERIOD_ONLY", "URGENCY_ONLY", "NO_TIMING")

CLARITY_FORMULA = (
    "deadline clarity = requirement-shaped passages stating both a period and its "
    "clock-start ÷ requirement-shaped passages carrying any timing language"
)

# Why the denominator is restricted.
#
# The ratio used to run over every extracted passage. On a real 205-page framework
# that put 65 of 142 timing-bearing passages — 46% — into a compliance figure that
# had no business holding them: annexure metric-catalogue rows ("Reports of the
# contingency plan testing conducted in past one year"), the periodicity tables in
# the reporting annexure, and permissions. None of them is a duty, so none of them
# can have an unclear deadline. The number moved 24.65% → 29.58% once the
# denominator matched the claim the number makes.
#
# The excluded passages are still counted and still reported, in
# `timing_counts_all_passages` and `non_normative_timing_passages`. A narrower
# denominator is only honest if the wider one stays visible beside it.
SCOPE_NOTE = (
    "Counted over passages the strength rules read as requirement-shaped. Timing "
    "language in background text, tables, permissions and duplicates is reported "
    "separately and excluded, because a passage that creates no duty cannot carry "
    "an unclear deadline."
)


class PassageScore(StrictModel):
    passage_id: str
    locator: str
    classification: PassageClass
    timing_class: str
    confidence: float


class DocumentScore(StrictModel):
    document_id: str
    sha256: str
    model_name: str = "Avadhi — the RegOS timing classifier"
    model_version: str
    generated_by: str = "COMMITTED_MODEL_WEIGHTS"
    passages_total: int
    passages_normative: int
    #: Timing verdicts over requirement-shaped passages — the metric's own scope.
    timing_counts: dict[str, int]
    #: The same verdicts over the whole document, so the exclusion stays visible.
    timing_counts_all_passages: dict[str, int]
    with_timing_language: int
    #: Requirement-shaped passages that state a period AND what starts it.
    deadlines_with_trigger: int
    #: Timing-bearing passages left out of the ratio because they create no duty.
    non_normative_timing_passages: int
    deadline_clarity: Optional[float]
    clarity_formula: str = CLARITY_FORMULA
    scope_note: str = SCOPE_NOTE
    blocked_durations: int
    urgency_only: int
    rows: List[PassageScore]
    limitation: str


def score_document(document: UploadedDocument) -> Optional[DocumentScore]:
    """Score one uploaded document, or None when no committed model is available."""
    classifier = load_classifier()
    if classifier is None:
        return None

    rows: List[PassageScore] = []
    counts = {label: 0 for label in TIMING_LABELS}
    all_counts = {label: 0 for label in TIMING_LABELS}
    normative = 0

    for passage in document.passages:
        verdict, confidence = classifier.predict(passage.text)
        all_counts[verdict] = all_counts.get(verdict, 0) + 1
        if passage.classification in NORMATIVE_CLASSES:
            normative += 1
            counts[verdict] = counts.get(verdict, 0) + 1
        rows.append(
            PassageScore(
                passage_id=passage.id,
                locator=passage.locator,
                classification=passage.classification,
                timing_class=verdict,
                confidence=round(confidence, 4),
            )
        )

    def timing_bearing(table: dict[str, int]) -> int:
        return table["PERIOD_AND_TRIGGER"] + table["PERIOD_ONLY"] + table["URGENCY_ONLY"]

    with_timing = timing_bearing(counts)
    clarity = (
        round(counts["PERIOD_AND_TRIGGER"] / with_timing, 4) if with_timing else None
    )

    return DocumentScore(
        document_id=document.id,
        sha256=document.sha256,
        model_version=MODEL_VERSION,
        passages_total=len(document.passages),
        passages_normative=normative,
        timing_counts=counts,
        timing_counts_all_passages=all_counts,
        with_timing_language=with_timing,
        deadlines_with_trigger=counts["PERIOD_AND_TRIGGER"],
        non_normative_timing_passages=timing_bearing(all_counts) - with_timing,
        deadline_clarity=clarity,
        blocked_durations=counts["PERIOD_ONLY"],
        urgency_only=counts["URGENCY_ONLY"],
        rows=rows,
        limitation=(
            "Model verdicts describe the wording of each extracted passage, not the "
            "document's legal effect. Accuracy was measured by cross-validation on a "
            "small hand-labelled set; treat every verdict as a proposal for review."
        ),
    )
