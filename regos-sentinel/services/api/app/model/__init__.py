"""RegOS's own model: a small, offline, fully inspectable classifier.

An API key buys a very large general model that is expensive per call, needs the
network, changes underneath you without notice, and cannot be shown to a regulator who
asks *why*. For the one judgement this product turns on — does a passage of regulation
actually support a computable deadline — none of that is worth having.

So this is trained here, from a hand-labelled corpus of SEBI sentences, and shipped as
weights in the repository. It has no dependencies beyond the standard library: the
maths is a few dozen lines of multinomial logistic regression, which is enough for a
task with four classes and a strong feature signal, and which has the property that
matters more than accuracy here — **every weight can be read**.

That last point is the whole argument. Asked why a passage was classed as having no
usable deadline, this model can answer with the features that drove it and their
learned weights. A hosted frontier model cannot, and SEBI's own 5 May 2026 advisory
asks REs to plan agentic mitigation *under IT Committee guidance* — guidance being
hard to give over a decision nobody can inspect.

What it does not do is replace the deterministic rule. Both run, and where they
disagree the disagreement is surfaced for a person rather than resolved by picking a
winner. Two independent methods reaching the same answer is evidence; one overruling
the other silently is not.
"""

from .classifier import (
    TimingClassifier,
    load_classifier,
    model_card,
)

__all__ = ["TimingClassifier", "load_classifier", "model_card"]
