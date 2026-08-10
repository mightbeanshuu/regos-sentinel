"""Train the timing classifier and measure it honestly.

Run with ``python -m app.model.train`` from ``services/api``. Writes ``weights.json``,
which is committed, so the served model is always the one that was reviewed.

Two measurements, because they answer different questions:

* **Stratified k-fold cross-validation** over the full labelled set — how well the
  lexical signal generalises across sentences. At this sample size a single split
  would be mostly noise.
* **Document-held-out evaluation** over the real corpus — the harder, honest number.
  Sentences from the same circular share vocabulary and drafting habits, so
  sentence-level CV flatters the model. Here every real document's sentences are
  held out together, the model trains on everything else (constructed rows always
  stay in training — the claim under test is about real documents), and the held-out
  document is scored cold. This is the number to quote for "works on any circular".
"""

from __future__ import annotations

import json
from collections import defaultdict
from typing import Dict, List, Sequence, Tuple

from .classifier import TimingClassifier, features
from .dataset import EXAMPLES, LABELS, Example
from .real_corpus import REAL_EXAMPLES

FOLDS = 6

#: Everything the shipped model trains on.
#: Everything the shipped model trains on.
#:
#: `second_pull.py` — 406 hand-labelled sentences from 109 more circulars — is
#: deliberately NOT here. Adding it moved document-held-out accuracy 0.839 ->
#: 0.721 and URGENCY_ONLY recall 0.74 -> 0.18, and the reason is not volume or
#: class balance (both were tried). It is a rubric conflict, and the measurement
#: that isolates it is in that file's docstring: each corpus predicts ITSELF at
#: 89-94% and the OTHER at 65-69%. Two internally coherent labelling standards
#: disagree, and no amount of extra data resolves a disagreement about what the
#: labels mean. Reconciling them is real work with a real cost; until it is done,
#: the corpus that produced the reviewed weights is the one that trains.
ALL_EXAMPLES: List[Example] = list(EXAMPLES) + list(REAL_EXAMPLES)


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


def _score(
    model: TimingClassifier,
    held_out: Sequence[Example],
    per_class_hits: Dict[str, int],
    per_class_total: Dict[str, int],
    confusion: Dict[str, Dict[str, int]],
) -> Tuple[int, int]:
    correct = 0
    for item in held_out:
        predicted, _ = model.predict(item.text)
        confusion[item.label][predicted] += 1
        per_class_total[item.label] += 1
        if predicted == item.label:
            correct += 1
            per_class_hits[item.label] += 1
    return correct, len(held_out)


def _empty_confusion() -> Dict[str, Dict[str, int]]:
    return {label: {other: 0 for other in LABELS} for label in LABELS}


def _recall(hits: Dict[str, int], totals: Dict[str, int]) -> Dict[str, object]:
    return {
        label: round(hits[label] / totals[label], 4) if totals[label] else None
        for label in LABELS
    }


def cross_validate(folds: int = FOLDS, token_budget: int = 0) -> Dict[str, object]:
    buckets = _stratified_folds(ALL_EXAMPLES, folds)
    correct = 0
    total = 0
    per_class_hits: Dict[str, int] = defaultdict(int)
    per_class_total: Dict[str, int] = defaultdict(int)
    confusion = _empty_confusion()

    for index in range(folds):
        held_out = buckets[index]
        training = [item for position, bucket in enumerate(buckets)
                    if position != index for item in bucket]
        model = TimingClassifier().fit_texts(training, token_budget=token_budget, balanced=True)
        hits, seen = _score(model, held_out, per_class_hits, per_class_total, confusion)
        correct += hits
        total += seen

    real_count = sum(1 for item in ALL_EXAMPLES if not item.synthetic)
    return {
        "folds": folds,
        "examples": total,
        "accuracy": round(correct / total, 4) if total else 0.0,
        "recall_by_class": _recall(per_class_hits, per_class_total),
        "confusion": confusion,
        "note": (
            f"Stratified {folds}-fold cross-validation over {total} hand-labelled "
            f"sentences, {real_count} of them real published SEBI wording (the CSCRF, "
            "its FAQ, the May 2026 AI advisory, and 26 circulars pulled July 2026) and "
            "the rest constructed variations. Sentence-level CV flatters the model; "
            "quote document_held_out for the generalisation claim."
        ),
    }


def document_held_out(token_budget: int = 0) -> Dict[str, object]:
    """Hold out every real document's sentences together; train on the rest."""
    by_document: Dict[str, List[Example]] = defaultdict(list)
    for item in ALL_EXAMPLES:
        if not item.synthetic:
            by_document[item.source.split(" · ")[0]].append(item)

    correct = 0
    total = 0
    per_class_hits: Dict[str, int] = defaultdict(int)
    per_class_total: Dict[str, int] = defaultdict(int)
    confusion = _empty_confusion()

    for document, held_out in by_document.items():
        training = [
            item for item in ALL_EXAMPLES
            if item.synthetic or item.source.split(" · ")[0] != document
        ]
        model = TimingClassifier().fit_texts(training, token_budget=token_budget, balanced=True)
        hits, seen = _score(model, held_out, per_class_hits, per_class_total, confusion)
        correct += hits
        total += seen

    return {
        "documents": len(by_document),
        "examples": total,
        "accuracy": round(correct / total, 4) if total else 0.0,
        "recall_by_class": _recall(per_class_hits, per_class_total),
        "confusion": confusion,
        "note": (
            f"Leave-one-document-out over {len(by_document)} real SEBI sources, "
            f"{total} real sentences. Constructed rows always stay in training. "
            "Each document is scored by a model that has never seen any sentence "
            "from it — the honest estimate for 'upload any circular'."
        ),
    }


#: Candidate token budgets. 0 is the hand-features-only model; document-held-out
#: accuracy — the honest number — decides which candidate ships.
TOKEN_BUDGETS = (0, 80, 120)


def main() -> None:
    candidates = {}
    for budget in TOKEN_BUDGETS:
        held = document_held_out(token_budget=budget)
        candidates[budget] = held
        print(f"token_budget={budget}: document_held_out={held['accuracy']} "
              f"(n={held['examples']})")
    winner = max(candidates, key=lambda budget: (candidates[budget]["accuracy"], -budget))
    print(f"winner: token_budget={winner}")

    metrics = cross_validate(token_budget=winner)
    metrics["document_held_out"] = candidates[winner]
    metrics["token_budget"] = winner
    metrics["candidates_document_held_out"] = {
        str(budget): candidates[budget]["accuracy"] for budget in TOKEN_BUDGETS
    }
    print(json.dumps(metrics, indent=2))

    # The shipped model is trained on everything; the metrics above describe how a model
    # trained this way behaves on data it has not seen.
    model = TimingClassifier().fit_texts(ALL_EXAMPLES, token_budget=winner, balanced=True)
    path = model.save(metrics=metrics)
    print(f"\nwrote {path}")

    print("\nlearned weights, largest first per class:")
    for label in LABELS:
        row = sorted(model.weights[label].items(), key=lambda item: -abs(item[1]))
        top = ", ".join(f"{name}={weight:+.2f}" for name, weight in row[:5])
        print(f"  {label:20} {top}")


if __name__ == "__main__":
    main()
