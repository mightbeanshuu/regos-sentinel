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

MODEL_VERSION = "regos-timing/1.2.0"

# --------------------------------------------------------------------------- #
# Features
# --------------------------------------------------------------------------- #

_NUMBER_WORD = (
    r"(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen"
    r"|twenty|twenty[\s-]?one|twenty[\s-]?four|thirty|forty[\s-]?five|sixty|ninety|180)"
)
_UNIT = r"(?:minute|hour|day|week|month|year|business day|calendar day|trading day|working day)s?"

#: ``(?<![tT][+\-])`` keeps market-microstructure notation ("T+1 day settlement",
#: "T-1 day closing price") from reading as a duration — it names a convention, not
#: a period anyone must act within. Real circulars use it constantly.
_DURATION = re.compile(rf"(?<![tT][+\-])\b{_NUMBER_WORD}\s*\(?\d*\)?\s*{_UNIT}\b", re.IGNORECASE)

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

#: The phrase list above misses clock-starts real circulars actually use ("of filing",
#: "of issuance", "after pay-out", "of its operationalization"). This pattern names
#: the event-noun shapes that start a clock, mined from 26 real SEBI circulars.
_CLOCK_START_RE = re.compile(
    # Up to three intervening words lets "of cyber audit report submission" and
    # "from the time of request" name their event — real framework wording.
    r"\b(?:of|from|after|before)\s+(?:[\w'-]+\s+){0,3}?"
    r"(?:date|submission|completion|termination|receipt|issuance|filing|approval|grant"
    r"|operationali[sz]ation|commencement|detection|detecting|noticing|discovery"
    r"|intimation|obtaining|pay[\s-]{0,2}out|expiry|request|reporting|notification"
    r"|assessment|activity|exercise|incident)\b",
    re.IGNORECASE,
)

#: Wording that states the deadline outright — an explicit calendar date, or an
#: end-of-period anchor. No duration or separate trigger is needed: the date is given.
_MONTH = (
    r"(?:january|february|march|april|may|june|july|august|september|october"
    r"|november|december)"
)
_ABSOLUTE_DATE = re.compile(
    rf"\b(?:on or before|not later than|no later than|by|before|from|with effect from"
    rf"|w\.?e\.?f\.?)\s+{_MONTH}\s+\d{{1,2}},?\s+\d{{4}}"
    r"|\b(?:by|before|at)\s+(?:the\s+)?end of the\s+(?:day|week|month|quarter|year|financial year)"
    r"|\bon or before\s+(?:the\s+)?next\s+(?:trading|working|business)\s+day\b"
    rf"|\b(?:timeline|deadline)\b[^.]{{0,60}}?\bshall be\s+{_MONTH}\s+\d{{1,2}},?\s+\d{{4}}",
    re.IGNORECASE,
)

#: Named periodicities. "annually" or "half-yearly" states a period exactly as
#: "every six months" does, and real SEBI wording leans on these words heavily.
_PERIODICITY = re.compile(
    r"\b(?:annual(?:ly)?|half[\s-]?yearly|six[\s-]?monthly|quarterly|monthly|weekly|daily"
    r"|once (?:a|in a|every) (?:financial )?year|twice (?:a|every) year"
    r"|beginning of (?:the|every) financial year)\b",
    re.IGNORECASE,
)

#: "every six months" / "every financial year" is recurrence; "every request" is just
#: a quantifier. Only the time-anchored sense may count.
_RECURRENCE = re.compile(
    rf"\bevery\s+(?:\w+[\s-]+)?{_UNIT}\b|\binterval",
    re.IGNORECASE,
)

_URGENCY = (
    "immediate", "immediately", "promptly", "expedite", "timely manner",
    "as soon as", "without undue delay", "regular", "regularly", "periodic",
    "periodically", "continuous", "ongoing", "frequently",
    "whenever necessary", "stipulated time", "time bound", "reasonable time",
    "prescribed time", "required time frame", "defined timeframe",
)

#: "from time to time" is almost always narrative in real framework prose ("SEBI has
#: issued advisories from time to time") — its own feature lets the model learn that,
#: instead of it dragging every history sentence into URGENCY_ONLY.
_FROM_TIME_TO_TIME = "from time to time"

_IMPERATIVE = ("shall", "must", "are to be", "need to")

#: RUBRIC.md turns on one question the feature set could not previously express:
#: does the sentence IMPOSE a duty, or talk ABOUT one? The same timing word takes
#: different labels either side of that line — "reviews shall be carried out
#: periodically" is URGENCY_ONLY, "what is the periodicity of VAPT?" is NO_TIMING
#: — so without these the model can only learn the word, and a corpus with more
#: prose about duties than duties teaches it the wrong answer. That is what
#: happened when `second_pull.py` was first added: URGENCY_ONLY recall fell to
#: 0.18 because breadth-first harvesting over 109 circulars collects FAQ
#: questions, recitals and citations far faster than it collects obligations.
#:
#: A question. SEBI's FAQs are full of them and they impose nothing.
_INTERROGATIVE = re.compile(
    r"\?|^\s*(?:what|whether|can|how|why|when|where|which|who|is|are|does|do|should|shall)\b"
    r"[^.?]{0,120}\?",
    re.IGNORECASE,
)

#: Pointing at an instrument rather than stating a duty. These sentences carry
#: dates and periods constantly — they are the instrument's coordinates, not a
#: deadline.
_CITATION_FRAME = re.compile(
    r"\bin terms of\b|\bvide\b|\bas specified in\b|\bread with\b|\bplease refer\b"
    r"|\brefer to\b|\bcircular no\b|\bin exercise of (?:the )?powers conferred\b"
    r"|\b(?:regulation|clause|paragraph|para|chapter|section|annexure)\s+\d"
    r"|\bmaster circular\b",
    re.IGNORECASE,
)

#: Reporting what already happened. "Transfer of securities was discontinued with
#: effect from April 01, 2019" states a real date and creates no obligation.
_REPORTED_PAST = re.compile(
    r"\b(?:was|were|has been|have been|had been|has issued|have issued|has also"
    r"|was made|were made|has mandated|had)\b",
    re.IGNORECASE,
)

#: Defining a term. "Periodic reports does not include research reports" is about
#: vocabulary.
_DEFINITION_FRAME = re.compile(
    r"\bdoes not include\b|\bshall mean\b|\bmeans\b|\bis defined as\b"
    r"|\bdefinition of\b|\brefers to\b",
    re.IGNORECASE,
)

#: Act-now urgency is a different linguistic animal from vague recurrence: "remediate
#: immediately" mandates a response; "on a periodic basis" gestures at a rhythm. Both
#: are URGENCY_ONLY, but the strong form co-occurs with duties while recurrent words
#: also live in narrative prose — one combined feature lets the second dilute the first.
_URGENCY_STRONG = (
    "immediate", "immediately", "promptly", "forthwith", "expedite",
    "as soon as", "without undue delay", "time bound",
)


#: A PDF text layer routinely breaks a word across a space — "from the end o f",
#: "th e date of receipt". Every timing pattern above matches on whole words, so a
#: single stray space inside "of" was enough to hide a clock-start the circular
#: states plainly, and the product then asked a compliance officer to supply a date
#: the source had already given. That is the one error this classifier must not
#: make, so the fragments are rejoined before anything is matched.
#:
#: Only pairs that rejoin into one of the short function words these patterns
#: actually depend on are merged. The repair therefore cannot invent a clock-start
#: that the intact sentence would not also have produced — the failure mode a
#: looser "delete suspicious spaces" rule would have introduced.
_SPLIT_REPAIRABLE = frozenset(
    {"of", "the", "from", "after", "before", "date", "end", "and", "for", "its"}
)


def _repair_split_words(text: str) -> str:
    """Rejoin PDF-split fragments, but only into a known short function word.

    Walks the tokens rather than substituting on a pattern: a regex pairs greedily
    and "end o f" binds as ("end", "o"), which strands the "f" and leaves the very
    phrase this repair exists for still broken.
    """
    tokens = text.split(" ")
    repaired: List[str] = []
    index = 0
    while index < len(tokens):
        if index + 1 < len(tokens):
            merged = f"{tokens[index]}{tokens[index + 1]}"
            if merged in _SPLIT_REPAIRABLE:
                repaired.append(merged)
                index += 2
                continue
        repaired.append(tokens[index])
        index += 1
    return " ".join(repaired)


def features(text: str) -> Dict[str, float]:
    """The feature vector for one sentence. Deliberately few, deliberately legible."""
    padded = f" {_repair_split_words(' '.join(text.lower().split()))} "
    # "immediate relatives" names a family relationship, not urgency. Real transmission
    # circulars use it constantly and it must not read as a deadline.
    urgency_text = padded.replace("immediate relative", " ")
    duration = _DURATION.search(padded)
    clock_start = (
        [phrase for phrase in _CLOCK_START if phrase in padded]
        or _CLOCK_START_RE.search(padded)
    )
    urgency = [word for word in _URGENCY if word in urgency_text]
    absolute_date = _ABSOLUTE_DATE.search(padded)
    periodicity = _PERIODICITY.search(padded)

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
        if any(word in urgency_text for word in _URGENCY_STRONG):
            found["urgency_strong"] = 1.0
        else:
            found["urgency_recurrent"] = 1.0
    if duration and clock_start:
        found["duration_and_clock_start"] = 1.0
    if duration and not clock_start:
        found["duration_without_clock_start"] = 1.0
    if urgency and not duration:
        found["urgency_without_duration"] = 1.0
    if absolute_date:
        found["has_absolute_date"] = 1.0
    if periodicity:
        found["periodicity_word"] = 1.0
        if not clock_start and not absolute_date:
            found["periodicity_without_anchor"] = 1.0
    imperative = any(word in padded for word in _IMPERATIVE)
    if imperative:
        found["imperative"] = 1.0
    if _FROM_TIME_TO_TIME in padded:
        found["from_time_to_time"] = 1.0
    if urgency and not imperative:
        found["urgency_without_imperative"] = 1.0
    # An urgency word inside a "shall" duty is a mandated-urgency shape ("shall be
    # remediated immediately") — without this interaction, the framework's many
    # timing-free "shall" duties teach `imperative` to vote NO_TIMING and drown it.
    if urgency and imperative and not duration:
        found["urgency_and_imperative"] = 1.0
    if " not exceed" in padded or " maximum" in padded or " upper" in padded:
        found["ceiling_language"] = 1.0
    if " within " in padded:
        found["within"] = 1.0
    if _RECURRENCE.search(padded):
        found["recurrence"] = 1.0
    # RUBRIC.md question 1: does this impose a duty, or talk about one? Each of
    # these says "talks about", and the interactions below are where the work is
    # actually done — a timing word inside a question or a citation is the shape
    # that used to be learned as urgency.
    talks_about = False
    if _INTERROGATIVE.search(text):
        found["interrogative"] = 1.0
        talks_about = True
    if _CITATION_FRAME.search(padded):
        found["citation_frame"] = 1.0
        talks_about = True
    if _DEFINITION_FRAME.search(padded):
        found["definition_frame"] = 1.0
        talks_about = True
    # Past tense only counts as reporting when nothing in the sentence commands.
    # "REs shall ensure that backups have been tested" is still a duty.
    if _REPORTED_PAST.search(padded) and not imperative:
        found["reported_past"] = 1.0
        talks_about = True
    if talks_about and (urgency or periodicity or duration or absolute_date):
        found["timing_without_duty"] = 1.0
    return found


FEATURE_NAMES: Tuple[str, ...] = (
    "bias",
    "has_duration",
    "has_clock_start",
    "has_urgency",
    "urgency_strong",
    "urgency_recurrent",
    "duration_and_clock_start",
    "duration_without_clock_start",
    "urgency_without_duration",
    "has_absolute_date",
    "periodicity_word",
    "periodicity_without_anchor",
    "imperative",
    "from_time_to_time",
    "urgency_without_imperative",
    "urgency_and_imperative",
    "ceiling_language",
    "within",
    "recurrence",
    "interrogative",
    "citation_frame",
    "definition_frame",
    "reported_past",
    "timing_without_duty",
    "unit:minute", "unit:hour", "unit:day", "unit:week", "unit:month", "unit:year",
    "unit:business day", "unit:calendar day", "unit:trading day", "unit:working day",
)


# --------------------------------------------------------------------------- #
# Learned tokens
# --------------------------------------------------------------------------- #

#: The docstring above argues against bag-of-words: at this sample size "VAPT" would
#: end up predicting something. The learned-token block is allowed anyway, under three
#: controls that answer that argument. A token must appear in at least
#: ``_TOKEN_MIN_DF`` sentences AND at least ``_TOKEN_MIN_SOURCES`` distinct source
#: documents (a word that lives in one circular cannot become a feature); only the
#: ``token_budget`` strongest class associations are kept; and the vocabulary is
#: rebuilt inside every training fold, so document-held-out evaluation measures the
#: block with no leakage — and decides whether it ships at all.

_TOKEN_RE = re.compile(r"[a-z]{3,}")
_TOKEN_MIN_DF = 5
_TOKEN_MIN_SOURCES = 3


def _tokens(text: str) -> set:
    return set(_TOKEN_RE.findall(text.lower()))


def _select_vocabulary(
    rows: Sequence[Tuple[str, str, str]], token_budget: int
) -> List[str]:
    """Pick the tokens whose presence most separates the labels, guarded as above.

    ``rows`` are ``(text, label, source)`` triples from the TRAINING split only.
    """
    if token_budget <= 0:
        return []
    df: Dict[str, int] = {}
    sources: Dict[str, set] = {}
    by_label: Dict[str, Dict[str, int]] = {label: {} for label in LABELS}
    label_totals: Dict[str, int] = {label: 0 for label in LABELS}
    for text, label, source in rows:
        label_totals[label] += 1
        for token in _tokens(text):
            df[token] = df.get(token, 0) + 1
            sources.setdefault(token, set()).add(source)
            by_label[label][token] = by_label[label].get(token, 0) + 1

    scored: List[Tuple[float, str]] = []
    total = sum(label_totals.values())
    for token, count in df.items():
        if count < _TOKEN_MIN_DF or len(sources[token]) < _TOKEN_MIN_SOURCES:
            continue
        strongest = 0.0
        for label in LABELS:
            inside = by_label[label].get(token, 0)
            outside = count - inside
            in_total = label_totals[label]
            out_total = total - in_total
            odds = math.log(
                ((inside + 0.5) / (in_total + 1.0))
                / ((outside + 0.5) / (out_total + 1.0))
            )
            strongest = max(strongest, abs(odds))
        scored.append((strongest, token))
    scored.sort(reverse=True)
    return sorted(token for _, token in scored[:token_budget])


def token_features(text: str, vocabulary: Sequence[str]) -> Dict[str, float]:
    if not vocabulary:
        return {}
    present = _tokens(text)
    return {f"tok:{token}": 1.0 for token in vocabulary if token in present}


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
        first_row = next(iter(self.weights.values()))
        self.vocabulary: List[str] = sorted(
            name[len("tok:"):] for name in first_row if name.startswith("tok:")
        )

    def _vector(self, text: str) -> Dict[str, float]:
        vector = features(text)
        vector.update(token_features(text, self.vocabulary))
        return vector

    # -- training ---------------------------------------------------------- #

    def fit(
        self,
        examples: Sequence[Tuple[Dict[str, float], str]],
        epochs: int = 400,
        learning_rate: float = 0.35,
        l2: float = 0.01,
        balanced: bool = False,
    ) -> TimingClassifier:
        # Balanced weighting stops the largest class from buying the bias term:
        # real corpora are mostly NO_TIMING sentences, and an unweighted fit lets
        # that majority outvote a rare-but-load-bearing shape like mandated urgency.
        counts = {label: 0 for label in LABELS}
        for _, label in examples:
            counts[label] += 1
        weight = {
            label: (
                len(examples) / (len(LABELS) * counts[label])
                if balanced and counts[label]
                else 1.0
            )
            for label in LABELS
        }
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
                        # which matters a great deal at this sample size. Learned tokens
                        # carry triple the penalty: they are auxiliary signal and must
                        # never outvote the linguistic features on a short sentence.
                        penalty = l2 * (3.0 if name.startswith("tok:") else 1.0)
                        step = weight[label] * error * value - penalty * row[name]
                        row[name] += learning_rate * step
        return self

    def fit_texts(
        self,
        examples: Sequence,
        token_budget: int = 0,
        epochs: int = 400,
        learning_rate: float = 0.35,
        l2: float = 0.01,
        balanced: bool = False,
    ) -> TimingClassifier:
        """Fit from :class:`~app.model.dataset.Example` rows directly.

        With ``token_budget > 0`` a vocabulary is selected from THESE examples only
        and token-presence features join the hand-designed ones — callers that split
        folds get a leak-free per-fold vocabulary for free.
        """
        self.vocabulary = _select_vocabulary(
            [(item.text, item.label, item.source.split(" · ")[0]) for item in examples],
            token_budget,
        )
        names = list(FEATURE_NAMES) + [f"tok:{token}" for token in self.vocabulary]
        self.weights = {label: {name: 0.0 for name in names} for label in LABELS}
        vectors = [(self._vector(item.text), item.label) for item in examples]
        return self.fit(
            vectors, epochs=epochs, learning_rate=learning_rate, l2=l2, balanced=balanced,
        )

    # -- inference --------------------------------------------------------- #

    def _probabilities(self, vector: Dict[str, float]) -> List[float]:
        scores = [
            sum(self.weights[label].get(name, 0.0) * value for name, value in vector.items())
            for label in LABELS
        ]
        return _softmax(scores)

    def predict(self, text: str) -> Tuple[str, float]:
        vector = self._vector(text)
        probabilities = self._probabilities(vector)
        best = max(range(len(LABELS)), key=lambda index: probabilities[index])
        return LABELS[best], probabilities[best]

    def explain(self, text: str) -> Dict[str, object]:
        """Why the model said what it said, feature by feature.

        This is the reason for building our own rather than calling one. A weight per
        active feature is an account of the decision that a person can argue with.
        """
        vector = self._vector(text)
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
                    "features": list(FEATURE_NAMES)
                    + [f"tok:{token}" for token in self.vocabulary],
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
    from .dataset import EXAMPLES
    from .dataset import LABELS as _LABELS
    from .real_corpus import REAL_EXAMPLES

    combined = list(EXAMPLES) + list(REAL_EXAMPLES)
    real = [item for item in combined if not item.synthetic]
    real_documents = {item.source.split(" · ")[0] for item in real}
    payload = json.loads(WEIGHTS_PATH.read_text()) if WEIGHTS_PATH.exists() else {}
    return {
        "name": "Avadhi — the RegOS timing classifier",
        "name_meaning": (
            "Avadhi (\u0905\u0935\u0927\u093f) is Hindi for 'period / stipulated duration' — "
            "the exact word SEBI's own Hindi circular text uses for the thing this "
            "model reads."
        ),
        "version": MODEL_VERSION,
        "task": (
            "Given one sentence of regulation, say whether it supports a computable "
            "deadline, states a period with no clock-start, uses urgency language "
            "without a period, or contains no timing at all."
        ),
        "architecture": (
            f"Multinomial logistic regression over {len(FEATURE_NAMES)} hand-designed "
            "linguistic features. Pure standard library — no numpy, no network, no "
            "external service."
        ),
        "training_examples": len(combined),
        "real_examples": len(real),
        "real_documents": len(real_documents),
        "label_counts": {
            label: sum(1 for item in combined if item.label == label) for label in _LABELS
        },
        "metrics": payload.get("metrics", {}),
        "why_not_an_api": (
            "A hosted model cannot show its reasoning, changes without notice, needs "
            "the network, and costs money per sentence. This one returns the features "
            "that drove each decision and the weight each carried, runs offline, and "
            "is versioned in the repository with the data it was trained on."
        ),
        "limitations": (
            f"Trained on {len(combined)} sentences: {len(real)} are real published "
            f"SEBI wording from {len(real_documents)} sources (harvested by this "
            "product's own extraction pipeline, labelled by hand), the rest are "
            "constructed variations labelled as such. It classifies one sentence at a "
            "time and has no view of surrounding context, cross-references, or the "
            "document as a whole. It does not decide what a firm must do — it decides "
            "whether a date can honestly be derived, and a deterministic rule checks "
            "the same question independently. Quote metrics.document_held_out, not "
            "cross-validation, for how it behaves on documents it has never seen."
        ),
        "intended_use": (
            "A second opinion alongside the deterministic timing rule. Where the two "
            "disagree, the disagreement is shown to a person; the model never "
            "overrules the rule."
        ),
    }
