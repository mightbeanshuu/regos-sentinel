"""The assistant: it answers with SEBI's words, or it says it cannot.

Every compliance product now ships a chatbot, and almost all of them have the same
defect — asked something the source does not cover, they produce a fluent paragraph
anyway. In this domain a confident wrong answer is worse than no answer, because it is
the kind of wrong answer someone acts on.

So this one is built the other way round. It has no generative step at all. It searches
the pinned, hash-verified passages the workspace already holds, and an answer is only
ever **a quotation from one of them plus its locator**. If nothing scores well enough,
it says so and stops. It cannot paraphrase a regulation into something the regulation
does not say, because it cannot write prose.

Two consequences worth stating out loud, because both are features:

* It runs offline. No key, no model, no per-question cost, nothing leaves the machine.
* Its refusals are real refusals. "I don't have SEBI wording that answers that" is the
  honest output for a question the source does not address, and it is the output a
  compliance officer can safely act on — by going and reading the source themselves.

Where the workspace itself holds the answer — what needs a decision, what is due — the
assistant reports state rather than searching text. Those answers are computed, and are
labelled as computed rather than quoted.

## The one place a model is allowed in

Regulatory prose is hard to read, and "read the quotation" is a poor answer to someone
who finds the quotation impenetrable. So a model may **restate a passage that retrieval
already chose** in plainer words. It is given the passage and nothing else, told to add
no fact that is not in it, and its output is shown *beside* the quotation rather than
instead of it.

The division of labour is the point. Which passage answers the question is decided by
deterministic search over pinned text. What that passage says is fixed by the passage.
The model only changes the register — and if it is unavailable, rate limited, or
disabled, the answer is still complete without it.
"""

from __future__ import annotations

import os
import re
from typing import List, Optional

import httpx

from .advisory import advisory_spans
from .agents.planner import offline, planner_model, resolve_provider
from .models import AssistantAnswer, AssistantCitation, WorkspaceState

PLAIN_PROMPT_VERSION = "regos-plain-english/v1"

_PLAIN_SYSTEM = """\
You restate one passage of Indian securities regulation in plain English for a \
compliance officer who is not a lawyer.

Hard rules:
- Use only what is in the passage. Add no obligation, number, date, deadline or \
condition that is not written there.
- If the passage states a period but not what starts it, say that plainly. Do not \
supply a start point.
- Two sentences at most. No preamble, no "this passage says", no bullet points.
- Plain words. If the passage uses a term of art, keep it but say what it means.

You are not answering a question and not giving advice. You are saying the same thing \
in easier words, and the original is shown next to yours."""


def plain_english(passage: str) -> Optional[str]:
    """Restate a retrieved passage in plainer words, or return ``None``.

    Failure is entirely acceptable here: the quotation is the answer, and this is a
    convenience laid on top of it. Nothing downstream depends on it succeeding.
    """
    provider = resolve_provider()
    if offline() or provider is None or os.environ.get(
        "REGOS_PLAIN_ENGLISH", ""
    ).lower() in {"0", "off", "false"}:
        return None
    try:
        response = httpx.post(
            provider["url"],
            headers={
                "Authorization": f"Bearer {provider['key']}",
                "Content-Type": "application/json",
            },
            json={
                "model": planner_model(),
                "temperature": 0,
                "max_tokens": 160,
                "messages": [
                    {"role": "system", "content": _PLAIN_SYSTEM},
                    {"role": "user", "content": passage},
                ],
            },
            timeout=20,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
    except Exception:  # noqa: BLE001 — any failure just means no plain restatement
        return None
    text = " ".join(str(content or "").split())
    # A restatement longer than the passage is not a restatement.
    if not text or len(text) > max(400, len(passage)):
        return None
    return text

#: Words too common in a regulatory corpus to discriminate between passages.
_STOPWORDS = {
    "the", "and", "for", "are", "our", "with", "that", "this", "what", "when",
    "how", "does", "did", "was", "were", "have", "has", "had", "can", "should", "shall",
    "must", "will", "would", "from", "into", "about", "which", "who", "whom", "there",
    "their", "them", "they", "you", "your", "yours", "not", "any", "all", "may", "been",
    "but", "its", "it's", "sebi", "cscrf", "regulated", "entity", "entities", "please",
    "tell", "explain", "need", "needs", "know", "want", "much", "many", "long", "time",
}

#: A question has to clear this to be answered from the corpus at all.
_MINIMUM_SCORE = 2


def _terms(text: str) -> List[str]:
    return [
        word
        for word in re.split(r"\W+", text.lower())
        if len(word) > 2 and word not in _STOPWORDS
    ]


def _score(terms: List[str], haystack: str) -> int:
    lowered = haystack.lower()
    return sum(3 if len(term) > 6 else 1 for term in terms if term in lowered)


# --------------------------------------------------------------------------- #
# Questions the workspace itself answers
# --------------------------------------------------------------------------- #


def _state_answer(question: str, state: WorkspaceState) -> Optional[AssistantAnswer]:
    """Answer from live state, for the few questions that are about *this* firm."""
    lowered = question.lower()

    wants_decision = any(
        phrase in lowered
        for phrase in ("need my", "needs me", "waiting on me", "my decision", "what do i",
                       "what needs", "action", "to do", "outstanding")
    )
    wants_deadline = any(
        phrase in lowered
        for phrase in ("due", "deadline", "when is", "when do", "by when", "date")
    )

    build = state.builds[-1] if state.builds else None

    if wants_decision and build is None:
        # Falling through to a corpus search here would answer a question about *this
        # firm* with a passage of regulation, which reads like an answer and is not one.
        return AssistantAnswer(
            answer=(
                "Nothing yet, because no check has been run against this workspace. "
                "Run the check on the dashboard and anything needing your decision "
                "will be listed."
            ),
            kind="COMPUTED",
            citations=[],
            note="Read from this workspace, not from the SEBI text.",
        )

    if wants_decision and build:
        waiting = [item for item in build.tests if item.status == "BLOCK"]
        if not waiting:
            return AssistantAnswer(
                answer="Nothing is waiting on you. Every check has passed.",
                kind="COMPUTED",
                citations=[],
                note="Read from the latest check on this workspace.",
            )
        lines = "; ".join(item.message for item in waiting[:3])
        return AssistantAnswer(
            answer=(
                f"{len(waiting)} things need a decision from you. The first few: {lines}"
            ),
            kind="COMPUTED",
            citations=[],
            note="Read from the latest check on this workspace, not from the SEBI text.",
        )

    if wants_deadline and state.deadline_computations:
        blocked = [item for item in state.deadline_computations if not item.computable]
        computed = [item for item in state.deadline_computations if item.computable]
        if blocked and not computed:
            return AssistantAnswer(
                answer=(
                    "No due date can be produced yet. SEBI states how long you have but "
                    "not what starts the clock, so this product will not invent one. "
                    "Record your firm's policy for the start date and the date appears."
                ),
                kind="COMPUTED",
                citations=[],
                note="This is the gap the review workflow exists to close.",
            )
        if computed:
            first = computed[0]
            return AssistantAnswer(
                answer=f"The next due date on record is {first.due_date}.",
                kind="COMPUTED",
                citations=[],
                note="Computed from the trigger date and the period stated in the source.",
            )
    return None


# --------------------------------------------------------------------------- #
# Questions the source answers, in the source's own words
# --------------------------------------------------------------------------- #


def ask(question: str, state: WorkspaceState) -> AssistantAnswer:
    question = (question or "").strip()
    if len(question) < 3:
        return AssistantAnswer(
            answer="Ask a question and I will look for SEBI wording that answers it.",
            kind="REFUSED",
            citations=[],
            note="",
        )

    from_state = _state_answer(question, state)
    if from_state is not None:
        return from_state

    terms = _terms(question)
    if not terms:
        return AssistantAnswer(
            answer=(
                "I could not pick anything specific out of that question to search for. "
                "Try naming the topic — patching, VAPT, audits, vendors, cloud."
            ),
            kind="REFUSED",
            citations=[],
            note="",
        )

    candidates = [
        (span.id, span.locator, span.text, span.question, span.source_url)
        for span in state.source_spans
    ] + [
        (span.id, span.locator, span.text, span.question, span.source_url)
        for span in advisory_spans()
    ]

    scored = sorted(
        (
            (_score(terms, f"{text} {heading}"), span_id, locator, text, url)
            for span_id, locator, text, heading, url in candidates
        ),
        key=lambda item: -item[0],
    )
    best = scored[0] if scored else None

    if best is None or best[0] < _MINIMUM_SCORE:
        return AssistantAnswer(
            answer=(
                "I don't have SEBI wording that answers that, so I'm not going to "
                "answer it. Everything I say has to be a quotation from a document in "
                "this workspace — if it isn't there, guessing would be worse than "
                "saying nothing."
            ),
            kind="REFUSED",
            citations=[],
            note="Nothing in the reviewed passages scored high enough to be a match.",
        )

    _, span_id, locator, text, url = best
    return AssistantAnswer(
        answer=text,
        kind="QUOTED",
        # Retrieval chose the passage and retrieval built the citation. The plain
        # restatement below never touches either.
        citations=[
            AssistantCitation(span_id=span_id, locator=locator, source_url=url)
        ],
        plain=plain_english(text),
        note=(
            "This is SEBI's wording, quoted exactly, not a summary of it. Read it "
            "against the governing instruments before acting."
        ),
    )
