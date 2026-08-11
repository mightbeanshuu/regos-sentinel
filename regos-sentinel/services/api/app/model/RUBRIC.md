# The labelling rubric for the timing classifier

One standard, written down, so that both corpora can be labelled against the same
thing. Settled 2026-08-11, after `second_pull.py` (406 sentences, 109 circulars)
made the model measurably worse and the cause was recorded as an unresolved
"rubric conflict".

## The operative question

For each sentence, in this order:

**1. Does this sentence impose a duty, or does it talk about one?**

This is the question the four classes turn on, and it is the one the previous
rubrics left implicit. The same words carry different labels depending on it:

| Sentence | Label | Why |
|---|---|---|
| "Access reviews shall be carried out periodically." | `URGENCY_ONLY` | imposes a duty; its timing is unmeasurable |
| "What is the periodicity of VAPT for QSBs?" | `NO_TIMING` | asks about a duty |
| "SEBI has issued advisories from time to time." | `NO_TIMING` | reports history |
| "Periodic reports does not include research." | `NO_TIMING` | defines a term |
| "In terms of Regulation 19D(6) of AIF Regulations…" | `NO_TIMING` | cites an instrument |

A sentence that only *mentions* time — in a question, a citation, a definition, a
subject line, or a past-tense report of what was already done — imposes nothing,
and no date may be put on a calendar from it. It is `NO_TIMING` however much
timing vocabulary it contains.

**2. If it imposes a duty, can a date be put on a calendar from this sentence
alone?**

| Answer | Label |
|---|---|
| Yes — a measurable duration *and* what starts it, or a stated absolute date | `PERIOD_AND_TRIGGER` |
| No — a measurable named period, but nothing says when it starts | `PERIOD_ONLY` |
| No — the timing is a word, not a quantity | `URGENCY_ONLY` |
| There is no timing language at all | `NO_TIMING` |

`PERIOD_ONLY` is the defect this product exists to catch. It must stay clean: a
sentence belongs here only if the period is **measurable** ("30 days", "6 months",
"quarterly", "half-yearly", "at least once in 5 years"). "Periodically",
"regularly" and "on a continuous basis" are not measurable and never land here.

## How the three recorded disagreements resolve

**Commencement clauses carrying an absolute date** — "shall come into force with
effect from April 01, 2026" → `PERIOD_AND_TRIGGER`.

A date can be put on a calendar, which is the operative question, and the duty is
real: from that date the circular's provisions bind. The reading that made this
`NO_TIMING` treated "is it a *deadline*?" as the test. It is not the test; the
test is whether a date is determinable. Both corpora already labelled it this way
in practice (OLD 7 of 9, NEW 12 of 21) — the docstring's claim that the two
corpora were opposed here does not survive counting them.

**"…with effect from the date of this circular"** → `NO_TIMING`. No date appears
in the sentence, and resolving it requires knowing the instrument's own date,
which is metadata rather than something the sentence states. This is the honest
line: the classifier reads sentences, not documents.

**Vague periodicity** — "periodic", "continuous", "regular", "ongoing", "timely",
"from time to time" → `URGENCY_ONLY` **when it qualifies a duty**, `NO_TIMING`
when it appears in a question, citation, definition, or past-tense report. This
is question 1 doing the work, and it is why the two corpora looked like they
disagreed: a breadth-first harvest over 109 circulars picks up far more prose
*about* duties (FAQ questions, recitals, citations) than a targeted pull does, so
the same word appears under `NO_TIMING` much more often in `second_pull.py`
without either labeller having changed their mind.

**Citation and definition sentences that contain a period** → `NO_TIMING`, per
question 1.

## What is excluded rather than guessed at

Text cut mid-clause by extraction, table rows whose cells are timeline fragments,
form templates, and any sentence whose duty cannot be identified without the
surrounding paragraph. An excluded sentence is not a labelled sentence; the
exclusions are part of what these labels mean.

## The rule that does not bend

**No label may be assigned by the deterministic timing rule.** The product ships
the model and the rule as two independent reads and shows the reader where they
disagree (`POST /api/v1/model/explain`). Train the model on the rule's output and
they can never disagree — the agreement becomes a tautology and the check becomes
theatre. Every label is assigned by reading the sentence.

The same caution applies to relabelling in bulk: a family may be *located* by
pattern, but each member is read before its label changes.
