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
    "deadline clarity = passages stating both a period and its clock-start ÷ "
    "passages carrying any timing language"
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
    model_name: str = "RegOS timing classifier"
    model_version: str
    generated_by: str = "COMMITTED_MODEL_WEIGHTS"
    passages_total: int
    passages_normative: int
    timing_counts: dict[str, int]
    with_timing_language: int
    deadline_clarity: Optional[float]
    clarity_formula: str = CLARITY_FORMULA
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
    normative = 0

    for passage in document.passages:
        verdict, confidence = classifier.predict(passage.text)
        counts[verdict] = counts.get(verdict, 0) + 1
        if passage.classification in NORMATIVE_CLASSES:
            normative += 1
        rows.append(
            PassageScore(
                passage_id=passage.id,
                locator=passage.locator,
                classification=passage.classification,
                timing_class=verdict,
                confidence=round(confidence, 4),
            )
        )

    with_timing = (
        counts["PERIOD_AND_TRIGGER"] + counts["PERIOD_ONLY"] + counts["URGENCY_ONLY"]
    )
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
        with_timing_language=with_timing,
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
