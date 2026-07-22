"""Train the timing classifier and measure it honestly.

Run with ``python -m app.model.train`` from ``services/api``. Writes ``weights.json``,
which is committed, so the served model is always the one that was reviewed.

The measurement is stratified k-fold cross-validation rather than a single split,
because at eighty-seven examples a single held-out set is small enough that its score is
mostly noise. Per-class recall is reported alongside overall accuracy, and it is the
number that matters: the class this product exists to catch is ``PERIOD_ONLY``, and a
model with fine average accuracy that misses those is useless here.
"""

from __future__ import annotations

import json
from collections import defaultdict
from typing import Dict, List, Sequence, Tuple

from .classifier import TimingClassifier, features
from .dataset import EXAMPLES, LABELS, Example

FOLDS = 6


def _stratified_folds(examples: Sequence[Example], folds: int) -> List[List[Example]]:
    """Keep every fold's label mix close to the whole set's."""
    by_label: Dict[str, List[Example]] = defaultdict(list)
    for item in examples:
        by_label[item.label].append(item)
    buckets: List[List[Example]] = [[] for _ in range(folds)]
    for label in LABELS:
        for index, item in enumerate(by_label[label]):
            buckets[index % folds].append(item)
    return buckets


def _vectorise(examples: Sequence[Example]) -> List[Tuple[Dict[str, float], str]]:
    return [(features(item.text), item.label) for item in examples]


def cross_validate(folds: int = FOLDS) -> Dict[str, object]:
    buckets = _stratified_folds(EXAMPLES, folds)
    correct = 0
    total = 0
    per_class_hits: Dict[str, int] = defaultdict(int)
    per_class_total: Dict[str, int] = defaultdict(int)
    confusion: Dict[str, Dict[str, int]] = {
        label: {other: 0 for other in LABELS} for label in LABELS
    }

    for index in range(folds):
        held_out = buckets[index]
        training = [item for position, bucket in enumerate(buckets)
                    if position != index for item in bucket]
        model = TimingClassifier().fit(_vectorise(training))
        for item in held_out:
            predicted, _ = model.predict(item.text)
            confusion[item.label][predicted] += 1
            per_class_total[item.label] += 1
            total += 1
            if predicted == item.label:
                correct += 1
                per_class_hits[item.label] += 1

    return {
        "folds": folds,
        "examples": total,
        "accuracy": round(correct / total, 4) if total else 0.0,
        "recall_by_class": {
            label: round(per_class_hits[label] / per_class_total[label], 4)
            if per_class_total[label]
            else None
            for label in LABELS
        },
        "confusion": confusion,
        "note": (
            f"Stratified {folds}-fold cross-validation over {total} hand-labelled "
            "sentences, 22 of them real published SEBI wording and the rest constructed "
            "variations. A sample this size supports a claim about the lexical signal "
            "and not much else; it is reported as measured, not extrapolated."
        ),
    }


def main() -> None:
    metrics = cross_validate()
    print(json.dumps(metrics, indent=2))

    # The shipped model is trained on everything; the metrics above describe how a model
    # trained this way behaves on data it has not seen.
    model = TimingClassifier().fit(_vectorise(EXAMPLES))
    path = model.save(metrics=metrics)
    print(f"\nwrote {path}")

    print("\nlearned weights, largest first per class:")
    for label in LABELS:
        row = sorted(model.weights[label].items(), key=lambda item: -abs(item[1]))
        top = ", ".join(f"{name}={weight:+.2f}" for name, weight in row[:5])
        print(f"  {label:20} {top}")


if __name__ == "__main__":
    main()
