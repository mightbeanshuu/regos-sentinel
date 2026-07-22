"""Multinomial logistic regression over hand-designed features. No dependencies.

The feature set is the interesting part, not the maths. A general text classifier would
learn from bag-of-words and would key on vocabulary that happens to co-occur with a
label in eighty-seven examples — "VAPT" would end up predicting something. The features
here are instead the linguistic facts that actually decide the question:

* does the sentence state a **duration** ("three months", "24 hours", "one week");
* does it state a **clock-start** ("of submission of", "from the date of", "after
  approval from");
* does it use **urgency vocabulary** with no duration ("immediately", "periodically");
* is it **imperative** at all ("shall", "must").

That makes the model small enough to train in milliseconds and, more importantly,
readable: :func:`explain` returns the features that fired and the weight each carried,
which is an answer to "why did it say that" of the kind a regulator can actually use.

The weights are trained by ``train.py`` and committed to ``weights.json``, so nothing is
fitted at import time and the served model is exactly the reviewed one.
"""

from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

from .dataset import LABELS

WEIGHTS_PATH = Path(__file__).with_name("weights.json")

MODEL_VERSION = "regos-timing/1.0.0"

# --------------------------------------------------------------------------- #
# Features
# --------------------------------------------------------------------------- #

_NUMBER_WORD = (
    r"(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen"
    r"|thirty|sixty|ninety|180)"
)
_UNIT = r"(?:minute|hour|day|week|month|year|business day)s?"

_DURATION = re.compile(rf"\b{_NUMBER_WORD}\s*\(?\d*\)?\s*{_UNIT}\b", re.IGNORECASE)

#: Phrases that name the event a clock starts from. This is the distinction the whole
#: product turns on, so the list is explicit rather than learned from a handful of rows.
_CLOCK_START = (
    " of submission of ", " of completion of ", " from the date ", " of the date ",
    " after approval from ", " of receipt of ", " of detection of ", " of discovery",
    " of separation of ", " of becoming aware", " from the trigger", " of intimation",
    " of creation", " of approval by", " after commencement of", " of the incident",
    " of the inspection report", " of the audit report", " of the backup run",
    " of the notice", " from the end of",
)

_URGENCY = (
    "immediate", "immediately", "promptly", "expedite", "timely manner",
    "as soon as", "without undue delay", "regular", "regularly", "periodic",
    "periodically", "continuous", "ongoing", "frequently", "from time to time",
    "whenever necessary",
)

_IMPERATIVE = ("shall", "must", "are to be", "need to")


def features(text: str) -> Dict[str, float]:
    """The feature vector for one sentence. Deliberately few, deliberately legible."""
    padded = f" {' '.join(text.lower().split())} "
    duration = _DURATION.search(padded)
    clock_start = [phrase for phrase in _CLOCK_START if phrase in padded]
    urgency = [word for word in _URGENCY if word in padded]

    found: Dict[str, float] = {"bias": 1.0}
    if duration:
        found["has_duration"] = 1.0
        unit = re.search(_UNIT, duration.group(0), re.IGNORECASE)
        if unit:
            found[f"unit:{unit.group(0).lower().rstrip('s')}"] = 1.0
    if clock_start:
        found["has_clock_start"] = 1.0
    if urgency:
        found["has_urgency"] = 1.0
    if duration and clock_start:
        found["duration_and_clock_start"] = 1.0
    if duration and not clock_start:
        found["duration_without_clock_start"] = 1.0
    if urgency and not duration:
        found["urgency_without_duration"] = 1.0
    if any(word in padded for word in _IMPERATIVE):
        found["imperative"] = 1.0
    if " not exceed" in padded or " maximum" in padded or " upper" in padded:
        found["ceiling_language"] = 1.0
    if " within " in padded:
        found["within"] = 1.0
    if " every " in padded or " interval" in padded:
        found["recurrence"] = 1.0
    return found


FEATURE_NAMES: Tuple[str, ...] = (
    "bias",
    "has_duration",
    "has_clock_start",
    "has_urgency",
    "duration_and_clock_start",
    "duration_without_clock_start",
    "urgency_without_duration",
    "imperative",
    "ceiling_language",
    "within",
    "recurrence",
    "unit:minute", "unit:hour", "unit:day", "unit:week", "unit:month", "unit:year",
    "unit:business day",
)


# --------------------------------------------------------------------------- #
# The model
# --------------------------------------------------------------------------- #


def _softmax(scores: Sequence[float]) -> List[float]:
    largest = max(scores)
    exponentials = [math.exp(score - largest) for score in scores]
    total = sum(exponentials)
    return [value / total for value in exponentials]


class TimingClassifier:
    """Multinomial logistic regression, trained with plain gradient descent."""

    def __init__(self, weights: Optional[Dict[str, Dict[str, float]]] = None) -> None:
        self.weights: Dict[str, Dict[str, float]] = weights or {
            label: {name: 0.0 for name in FEATURE_NAMES} for label in LABELS
        }

    # -- training ---------------------------------------------------------- #

    def fit(
        self,
        examples: Sequence[Tuple[Dict[str, float], str]],
        epochs: int = 400,
        learning_rate: float = 0.35,
        l2: float = 0.01,
    ) -> TimingClassifier:
        for _ in range(epochs):
            for vector, label in examples:
                probabilities = dict(zip(LABELS, self._probabilities(vector)))
                for candidate in LABELS:
                    error = (1.0 if candidate == label else 0.0) - probabilities[candidate]
                    row = self.weights[candidate]
                    for name, value in vector.items():
                        if name not in row:
                            continue
                        # L2 keeps a feature that fires in one example from dominating,
                        # which matters a great deal at this sample size.
                        row[name] += learning_rate * (error * value - l2 * row[name])
        return self

    # -- inference --------------------------------------------------------- #

    def _probabilities(self, vector: Dict[str, float]) -> List[float]:
        scores = [
            sum(self.weights[label].get(name, 0.0) * value for name, value in vector.items())
            for label in LABELS
        ]
        return _softmax(scores)

    def predict(self, text: str) -> Tuple[str, float]:
        vector = features(text)
        probabilities = self._probabilities(vector)
        best = max(range(len(LABELS)), key=lambda index: probabilities[index])
        return LABELS[best], probabilities[best]

    def explain(self, text: str) -> Dict[str, object]:
        """Why the model said what it said, feature by feature.

        This is the reason for building our own rather than calling one. A weight per
        active feature is an account of the decision that a person can argue with.
        """
        vector = features(text)
        label, confidence = self.predict(text)
        contributions = sorted(
            (
                {
                    "feature": name,
                    "weight": round(self.weights[label].get(name, 0.0), 4),
                }
                for name in vector
                if name in self.weights[label]
            ),
            key=lambda item: -abs(float(item["weight"])),
        )
        return {
            "label": label,
            "confidence": round(confidence, 4),
            "features_present": sorted(vector),
            "contributions": contributions,
            "model_version": MODEL_VERSION,
        }

    # -- persistence ------------------------------------------------------- #

    def save(self, path: Path = WEIGHTS_PATH, metrics: Optional[Dict] = None) -> Path:
        path.write_text(
            json.dumps(
                {
                    "model_version": MODEL_VERSION,
                    "labels": list(LABELS),
                    "features": list(FEATURE_NAMES),
                    "weights": self.weights,
                    "metrics": metrics or {},
                },
                indent=2,
                sort_keys=True,
            )
            + "\n"
        )
        return path


_CACHED: Optional[TimingClassifier] = None


def load_classifier() -> Optional[TimingClassifier]:
    """The trained model, or ``None`` if weights have not been committed."""
    global _CACHED
    if _CACHED is not None:
        return _CACHED
    if not WEIGHTS_PATH.exists():
        return None
    payload = json.loads(WEIGHTS_PATH.read_text())
    _CACHED = TimingClassifier(payload["weights"])
    return _CACHED


def model_card() -> Dict[str, object]:
    """What this model is, what it was trained on, and what it must not be used for."""
    from .dataset import EXAMPLES, counts, real_examples

    payload = json.loads(WEIGHTS_PATH.read_text()) if WEIGHTS_PATH.exists() else {}
    return {
        "name": "RegOS timing classifier",
        "version": MODEL_VERSION,
        "task": (
            "Given one sentence of regulation, say whether it supports a computable "
            "deadline, states a period with no clock-start, uses urgency language "
            "without a period, or contains no timing at all."
        ),
        "architecture": (
            "Multinomial logistic regression over 18 hand-designed linguistic features. "
            "Pure standard library — no numpy, no network, no external service."
        ),
        "training_examples": len(EXAMPLES),
        "real_examples": len(real_examples()),
        "label_counts": counts(),
        "metrics": payload.get("metrics", {}),
        "why_not_an_api": (
            "A hosted model cannot show its reasoning, changes without notice, needs "
            "the network, and costs money per sentence. This one returns the features "
            "that drove each decision and the weight each carried, runs offline, and "
            "is versioned in the repository with the data it was trained on."
        ),
        "limitations": (
            "Trained on 87 sentences, of which 22 are real published wording and the "
            "rest are constructed variations labelled as such. It classifies one "
            "sentence at a time and has no view of surrounding context, cross-"
            "references, or the document as a whole. It does not decide what a firm "
            "must do — it decides whether a date can honestly be derived, and a "
            "deterministic rule checks the same question independently."
        ),
        "intended_use": (
            "A second opinion alongside the deterministic timing rule. Where the two "
            "disagree, the disagreement is shown to a person; the model never "
            "overrules the rule."
        ),
    }
