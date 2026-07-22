"""The four agents.

Each one reads something, proposes something, and is stopped by a gate. None of them
writes to a control, sets a deadline, or approves anything — that is not a policy they
are asked to respect, it is a capability they were never given.

======================  ==================================  =========================
agent                   reads                               proposes
======================  ==================================  =========================
Reference resolver      pinned CSCRF excerpts               where a pointer lands
Source scout            two pinned source versions          what moved between them
Adversary               compiled obligations                why one might be wrong
Extractor               a passage's own wording             whether timing is usable
======================  ==================================  =========================
"""

from __future__ import annotations

from typing import Any, Dict, List

from ..models import (
    AgentCatalogueEntry,
    AgentFinding,
    AgentId,
    Citation,
    Provenance,
    WorkspaceState,
)
from .runtime import Agent, AgentToolbox, PlannedCall, finding
from .tools import (
    CSCRF_SOURCE_URL,
    analyse_timing,
    fetch_span,
    identifiers_agree,
    list_known_sources,
    search_corpus,
    source_comparison_tool,
    verify_quote,
    workspace_tools,
)

# --------------------------------------------------------------------------- #
# 1 · Reference resolver
# --------------------------------------------------------------------------- #


class ReferenceResolver(Agent):
    """Follow a pointer like "refer Table 19 in CSCRF" to the passage it names.

    Before this agent existed the four answers were a hand-written dictionary in the
    engine. That dictionary was correct, but it was correct because a person had
    already done the work — it proved nothing about a *fifth* pointer. This agent
    searches, fetches and verifies, so a new pointer is answered the same way.

    The gate is strict: a resolution is accepted only if the target exists *and* the
    quotation the pointer relies on is verbatim in it.
    """

    agent_id = AgentId.REFERENCE_RESOLVER
    goal = "Resolve each unresolved outbound reference to a pinned, hash-verified passage."
    limitation = (
        "Searches only the pinned CSCRF excerpt corpus. It does not browse the web and "
        "cannot resolve a pointer to a passage nobody has committed."
    )

    def __init__(self, state: WorkspaceState) -> None:
        self.state = state
        bound = workspace_tools(state)
        super().__init__(
            AgentToolbox(
                {
                    "list_unresolved_references": bound["list_unresolved_references"],
                    "read_span": bound["read_span"],
                    "search_corpus": search_corpus,
                    "fetch_span": fetch_span,
                    "verify_quote": verify_quote,
                }
            )
        )

    def deterministic_plan(self) -> List[PlannedCall]:
        pending = self.state.references
        plan: List[PlannedCall] = [
            {
                "tool": "list_unresolved_references",
                "input": {},
                "rationale": "Find every pointer that still has no target.",
            }
        ]
        for reference in pending:
            if reference.status.value != "UNRESOLVED":
                continue
            plan.append(
                {
                    "tool": "search_corpus",
                    "input": {"query": reference.target_locator},
                    "rationale": f"Locate the passage {reference.id} points at.",
                }
            )
        return plan

    def gate(self, results: List[Any]) -> List[AgentFinding]:
        """Judge each *reference*, not each search.

        Two things forced this shape, both found by letting a model plan freely.

        The gate used to produce one finding per search, which under a fixed plan was
        one per reference and under a model plan was one per keystroke — a planner that
        retried a query six times manufactured six resolutions.

        Worse, it accepted any hit. The "verified verbatim" step drew its probe from the
        fetched passage and checked it against that same passage, so it could not fail.
        Verification now runs against the pointer, which the passage did not supply:
        every identifier the pointer names must be one the passage answers to.
        """
        # Candidates come from either route a plan may take to a passage: ranking it
        # with a search, or naming it outright and fetching it. One model planner did
        # the second and skipped the first entirely, which was a perfectly good way to
        # reach the answer and produced nothing the gate could see.
        candidates: Dict[str, int] = {}
        for item in results:
            if not isinstance(item, dict):
                continue
            for hit in item.get("hits") or []:
                span_id = str(hit["span_id"])
                candidates[span_id] = max(candidates.get(span_id, 0), int(hit.get("score", 0)))
            if item.get("found") and item.get("sha256") and item.get("span_id"):
                candidates.setdefault(str(item["span_id"]), 0)

        findings: List[AgentFinding] = []
        unresolved = [item for item in self.state.references if item.status.value == "UNRESOLVED"]
        for index, reference in enumerate(unresolved, start=1):
            pointer = reference.target_locator
            agreeing = sorted(
                (
                    (span_id, identifiers_agree(pointer, span_id))
                    for span_id in candidates
                ),
                key=lambda item: -candidates[item[0]],
            )
            match = next((item for item in agreeing if item[1]["agrees"]), None)

            if match is None:
                near = agreeing[0] if agreeing else None
                findings.append(
                    finding(
                        f"REF-{index:02d}",
                        "REFERENCE_UNRESOLVED",
                        f"{pointer} → unresolved",
                        (
                            f"The closest candidate was {near[0]}, and it was refused: "
                            f"{near[1]['reason']}"
                            if near
                            else "No search in this plan returned a candidate for this "
                            "pointer, so nothing was matched to it."
                        ),
                        Provenance.DETERMINISTIC,
                        accepted=False,
                        gate_reason=(
                            "A near-miss is not a resolution. The pointer stays "
                            "unresolved rather than being bound to the nearest passage."
                        ),
                    )
                )
                continue

            span_id, agreement = match
            fetched = fetch_span(span_id)
            excerpt = " ".join(str(fetched.get("text", "")).split()[:12])
            findings.append(
                finding(
                    f"REF-{index:02d}",
                    "REFERENCE_RESOLVED",
                    f"{pointer} → {span_id}",
                    f"{fetched.get('heading', span_id)}. {agreement['reason']} "
                    f"Fingerprint {str(fetched.get('sha256', ''))[:16]}…",
                    Provenance.DETERMINISTIC,
                    accepted=True,
                    gate_reason=(
                        "Every identifier the pointer names is one this passage answers "
                        "to, and the passage is pinned at the fingerprint shown."
                    ),
                    citations=[
                        Citation(
                            document_id="SEBI-CSCRF-2024-113",
                            span_id=span_id,
                            locator=str(fetched.get("locator", "")),
                            quote=excerpt,
                            source_url=CSCRF_SOURCE_URL,
                        )
                    ],
                )
            )
        return findings


# --------------------------------------------------------------------------- #
# 2 · Source scout
# --------------------------------------------------------------------------- #


class SourceScout(Agent):
    """Compare the reviewed corpus against a newer real source version.

    The newer source is SEBI's 5 May 2026 AI vulnerability-detection advisory — a
    genuine circular, not a constructed revision. The scout reports what moved. It
    does not decide what to do about it.
    """

    agent_id = AgentId.SOURCE_SCOUT
    goal = "Detect what a newer real SEBI source changes about the reviewed corpus."
    limitation = (
        "Compares pinned versions already committed to the repository. It does not "
        "crawl sebi.gov.in at build time; the jury path makes no network call."
    )

    def __init__(
        self,
        state: WorkspaceState,
        candidate: List[Dict[str, str]],
        relationship: str = "READ_IN_CONJUNCTION_WITH",
    ) -> None:
        self.state = state
        self.candidate = candidate
        self.relationship = relationship
        bound = workspace_tools(state)
        super().__init__(
            AgentToolbox(
                {
                    "list_known_sources": lambda: list_known_sources(state),
                    "list_statements": bound["list_statements"],
                    # Both sides of the comparison come from pinned state. A planner
                    # chooses the relationship and nothing else; see
                    # ``source_comparison_tool``.
                    "compare_registered_sources": source_comparison_tool(state, candidate),
                    "analyse_timing": analyse_timing,
                }
            )
        )

    def deterministic_plan(self) -> List[PlannedCall]:
        plan: List[PlannedCall] = [
            {
                "tool": "list_known_sources",
                "input": {},
                "rationale": "Establish which source versions are registered.",
            },
            {
                "tool": "compare_registered_sources",
                "input": {
                    # Paragraph E of the advisory says it is to be read *with* the CSCRF,
                    # not in place of it. Declaring that here stops the comparison
                    # reporting every untouched FAQ topic as a disappearance.
                    "relationship": self.relationship,
                },
                "rationale": (
                    "Compare the reviewed corpus against the newer advisory by topic, "
                    "on the relationship the advisory claims for itself."
                ),
            },
        ]
        for item in self.candidate:
            plan.append(
                {
                    "tool": "analyse_timing",
                    "input": {"text": item["quote"]},
                    "rationale": f"Check whether {item['subject_key']} states a usable deadline.",
                }
            )
        return plan

    def gate(self, results: List[Any]) -> List[AgentFinding]:
        findings: List[AgentFinding] = []
        comparison = next(
            (item for item in results if isinstance(item, dict) and "added" in item), None
        )
        if comparison:
            additive = comparison["relationship"] == "READ_IN_CONJUNCTION_WITH"
            detail = (
                f"Added topics: {', '.join(comparison['added']) or 'none'}. "
                f"Changed: {', '.join(comparison['changed']) or 'none'}. "
            )
            detail += (
                "Topics this source does not address, which therefore continue to be "
                f"governed by the reviewed corpus: "
                f"{', '.join(comparison['not_addressed']) or 'none'}."
                if additive
                else (
                    "Absent from the newer version and therefore escalated: "
                    f"{', '.join(comparison['absent']) or 'none'}."
                )
            )
            findings.append(
                finding(
                    "SCOUT-DIFF",
                    "SOURCE_VERSION_DELTA",
                    comparison["summary"],
                    detail,
                    Provenance.DETERMINISTIC,
                    accepted=True,
                    gate_reason="A comparison is a report. Nothing was applied to a control.",
                )
            )

        timings = [item for item in results if isinstance(item, dict) and "verdict" in item]
        blocked = [
            item
            for item in timings
            if item["verdict"] in {"URGENCY_WITHOUT_PERIOD", "PERIOD_WITHOUT_TRIGGER"}
        ]
        for index, item in enumerate(blocked, start=1):
            findings.append(
                finding(
                    f"SCOUT-TIMING-{index:02d}",
                    "UNTIMED_DUTY_DETECTED",
                    f"{item['verdict']} — no date can be derived",
                    item["note"],
                    Provenance.DETERMINISTIC,
                    accepted=True,
                    gate_reason=(
                        "Recorded as a blocked duty. The gate refuses to invent the "
                        "missing period, exactly as it does for FAQ Q17(a)."
                    ),
                )
            )
        return findings


# --------------------------------------------------------------------------- #
# 3 · Adversary
# --------------------------------------------------------------------------- #


class Adversary(Agent):
    """Try to break each compiled obligation before a human is asked to approve it.

    This is the agent that justifies having AI here at all. It does not make the
    system produce more; it makes the system produce less, and say why. A challenge
    that lands blocks the build.
    """

    agent_id = AgentId.ADVERSARY
    goal = "Find a reason each compiled obligation should not be trusted."
    autonomy = "PROPOSE_ONLY — a landed challenge blocks; it never silently edits."
    limitation = (
        "Challenges what is compiled, against the passage cited for it. It cannot find "
        "a defect in a passage nobody compiled."
    )

    def __init__(self, state: WorkspaceState) -> None:
        self.state = state
        bound = workspace_tools(state)
        super().__init__(
            AgentToolbox(
                {
                    "list_active_obligations": bound["list_active_obligations"],
                    "read_span": bound["read_span"],
                    "verify_quote": verify_quote,
                    "analyse_timing": analyse_timing,
                    "read_entity_facts": bound["read_entity_facts"],
                }
            )
        )

    def deterministic_plan(self) -> List[PlannedCall]:
        plan: List[PlannedCall] = [
            {
                "tool": "list_active_obligations",
                "input": {},
                "rationale": "Enumerate what has been compiled and would reach a person.",
            },
            {
                "tool": "read_entity_facts",
                "input": {},
                "rationale": "Establish the facts applicability was decided against.",
            },
        ]
        for obligation in self.state.obligations:
            if obligation.status != "ACTIVE":
                continue
            plan.append(
                {
                    "tool": "read_span",
                    "input": {"span_id": obligation.deadline.citation.span_id},
                    "rationale": f"Re-read the passage cited for {obligation.id}.",
                }
            )
        return plan

    def gate(self, results: List[Any]) -> List[AgentFinding]:
        listing = next(
            (item for item in results if isinstance(item, dict) and "obligations" in item),
            None,
        )
        if not listing or not listing["obligations"]:
            return [
                finding(
                    "ADV-NONE",
                    "NOTHING_TO_CHALLENGE",
                    "No active obligation to challenge",
                    "Nothing has been compiled yet, so there is nothing that could be "
                    "wrong. Silence here is not assurance.",
                    Provenance.DETERMINISTIC,
                    accepted=True,
                    gate_reason="Vacuously clean; recorded so the absence is visible.",
                    requires_human_review=False,
                )
            ]

        spans = {
            item["span_id"]: item
            for item in results
            if isinstance(item, dict) and item.get("found") and "text" in item
        }
        findings: List[AgentFinding] = []
        for index, obligation in enumerate(listing["obligations"], start=1):
            span = spans.get(obligation["cited_span_id"])

            if span is None:
                # An inspection that did not happen is not an inspection that passed.
                # Every challenge below is guarded on having read the cited passage, so
                # a plan that skipped the read used to fall through all three and report
                # "withstood every challenge — the quotation is verbatim", for a
                # quotation nothing had looked at. A fixed plan always read them, so the
                # only way to see it was to let a model plan badly.
                findings.append(
                    finding(
                        f"ADV-{index:02d}",
                        "CHALLENGE_NOT_ASSESSED",
                        f"{obligation['obligation_id']} was not examined",
                        "The passage this obligation cites "
                        f"({obligation['cited_span_id']}) was never read during this "
                        "run, so none of the three challenges could be applied to it. "
                        "This is a gap in coverage, not a clean result.",
                        Provenance.DETERMINISTIC,
                        accepted=False,
                        gate_reason=(
                            "No conclusion is available. Reporting an unexamined "
                            "obligation as unchallenged would be assurance nobody earned."
                        ),
                        requires_human_review=True,
                    )
                )
                continue

            challenges: List[str] = []

            # Challenge 1 — is the quotation the obligation rests on really there?
            if not verify_quote_against_text(obligation["cited_quote"], span["text"]):
                challenges.append(
                    "The quotation recorded on this obligation does not appear "
                    "verbatim in the passage it cites."
                )

            # Challenge 2 — does the passage support the timing the obligation claims?
            timing = analyse_timing(span["text"])
            if obligation["computable"] and timing["verdict"] != "PERIOD_AND_TRIGGER_STATED":
                if obligation["trigger_provenance"] != Provenance.HUMAN_POLICY.value:
                    challenges.append(
                        "A date is computable here, but the cited passage does not "
                        f"state both a period and a clock-start ({timing['verdict']}), "
                        "and the trigger is not recorded as a human decision."
                    )

            # Challenge 3 — is a trigger claimed as SEBI wording that the passage lacks?
            if (
                obligation["trigger"]
                and obligation["trigger_provenance"] == Provenance.SOURCE_EXPLICIT.value
                and not any(
                    marker in span["text"].lower()
                    for marker in ("submission", "completion", "receipt", "approval")
                )
            ):
                challenges.append(
                    "The trigger is labelled as stated by SEBI, but the cited passage "
                    "contains no event that could start a clock."
                )

            landed = bool(challenges)
            findings.append(
                finding(
                    f"ADV-{index:02d}",
                    "CHALLENGE_LANDED" if landed else "CHALLENGE_SURVIVED",
                    (
                        f"{obligation['obligation_id']} — {len(challenges)} challenge(s) landed"
                        if landed
                        else f"{obligation['obligation_id']} withstood every challenge"
                    ),
                    " ".join(challenges)
                    if landed
                    else (
                        "The quotation is verbatim, the timing claim matches the passage, "
                        "and no trigger is attributed to SEBI that the passage lacks."
                    ),
                    Provenance.DETERMINISTIC,
                    accepted=True,
                    gate_reason=(
                        "A landed challenge blocks publication until a person rules on it."
                        if landed
                        else "No challenge landed. This is evidence, not proof of correctness."
                    ),
                    requires_human_review=landed,
                )
            )
        return findings


def verify_quote_against_text(quote: str, text: str) -> bool:
    """Loose containment check used by the adversary's first challenge.

    Compiled citations are often a clause of a longer sentence, so a strict match
    would fire constantly. Both sides are normalised and punctuation-insensitive.
    """
    def normalise(value: str) -> str:
        return " ".join("".join(ch if ch.isalnum() else " " for ch in value.lower()).split())

    haystack, needle = normalise(text), normalise(quote)
    if needle in haystack:
        return True
    # Fall back to term coverage — a citation that shares almost nothing with its
    # passage is the failure worth reporting, not a paraphrased connective.
    terms = [item for item in needle.split() if len(item) > 3]
    if not terms:
        return True
    present = sum(1 for term in terms if term in haystack)
    return present / len(terms) >= 0.7


# --------------------------------------------------------------------------- #
# 4 · Extractor
# --------------------------------------------------------------------------- #


class Extractor(Agent):
    """Read a passage's own wording and report whether a deadline can exist.

    The existing committed extraction proposes obligation candidates. This agent does
    the narrower, harder thing the gates actually depend on: decide whether the text
    supports a date at all. It is the same judgement for the FAQ and for the advisory.
    """

    agent_id = AgentId.EXTRACTOR
    goal = "Decide, per passage, whether the wording supports a computable deadline."
    limitation = (
        "Reads wording only. It does not decide requirement strength, applicability, "
        "or what a firm's policy should be."
    )

    def __init__(self, state: WorkspaceState, span_ids: List[str]) -> None:
        self.state = state
        self.span_ids = span_ids
        bound = workspace_tools(state)
        super().__init__(
            AgentToolbox(
                {
                    "read_span": bound["read_span"],
                    "analyse_span_timing": bound["analyse_span_timing"],
                    "list_statements": bound["list_statements"],
                }
            )
        )

    def deterministic_plan(self) -> List[PlannedCall]:
        plan: List[PlannedCall] = []
        for span_id in self.span_ids:
            plan.append(
                {
                    "tool": "read_span",
                    "input": {"span_id": span_id},
                    "rationale": f"Read {span_id} in full before judging its timing.",
                }
            )
        for span_id in self.span_ids:
            plan.append(
                {
                    "tool": "analyse_span_timing",
                    "input": {"span_id": span_id},
                    "rationale": f"Judge whether {span_id} states a usable deadline.",
                }
            )
        return plan

    def gate(self, results: List[Any]) -> List[AgentFinding]:
        """Match each verdict to its passage by id, never by position in the plan.

        The earlier version paired verdicts with span ids by order, which was correct
        only because a fixed plan produced them in order. A model planner may read the
        passages in any order, skip one, or judge one twice — so the verdict carries
        its own ``span_id`` and is matched on that.
        """
        timings = {
            item["span_id"]: item
            for item in results
            if isinstance(item, dict) and "verdict" in item and item.get("span_id")
        }
        findings: List[AgentFinding] = []
        for span_id in self.span_ids:
            timing = timings.get(span_id)
            if timing is None:
                findings.append(
                    finding(
                        f"EXT-{span_id}",
                        "TIMING_NOT_ASSESSED",
                        f"{span_id} · not assessed",
                        "The plan never judged this passage's timing, so no verdict "
                        "exists for it. An absent judgement is reported as absent "
                        "rather than defaulted to a safe-looking one.",
                        Provenance.DETERMINISTIC,
                        accepted=False,
                        gate_reason="No verdict was produced for this passage.",
                    )
                )
                continue
            computable = timing["verdict"] == "PERIOD_AND_TRIGGER_STATED"
            findings.append(
                finding(
                    f"EXT-{span_id}",
                    "TIMING_COMPUTABLE" if computable else "TIMING_BLOCKED",
                    f"{span_id} · {timing['verdict']}",
                    timing["note"],
                    Provenance.DETERMINISTIC,
                    accepted=True,
                    gate_reason=(
                        "A date may be computed from this passage."
                        if computable
                        else "No date may be computed. The gap goes to a person."
                    ),
                    requires_human_review=not computable,
                )
            )
        return findings


# --------------------------------------------------------------------------- #
# Catalogue — what each agent is allowed to be
# --------------------------------------------------------------------------- #

CATALOGUE: List[AgentCatalogueEntry] = [
    AgentCatalogueEntry(
        id=AgentId.REFERENCE_RESOLVER,
        name="Reference resolver",
        reads="Pinned CSCRF excerpts and the workspace's unresolved pointers",
        proposes="Which passage each pointer lands on, with a fingerprint",
        never_does="Compile an obligation from what it finds",
        gated_by="Target must exist and its text must verify verbatim",
        tools=["list_unresolved_references", "read_span", "search_corpus", "fetch_span",
               "verify_quote"],
        autonomy="Proposes a resolution; a person still approves the interpretation",
    ),
    AgentCatalogueEntry(
        id=AgentId.SOURCE_SCOUT,
        name="Source scout",
        reads="Two pinned source versions, by topic",
        proposes="What was added, changed or dropped between them",
        never_does="Apply a change to a control or an evidence item",
        gated_by="Reports only; every material change routes to human review",
        tools=[
            "list_known_sources",
            "list_statements",
            "compare_registered_sources",
            "analyse_timing",
        ],
        autonomy="Proposes a change report; nothing is applied automatically",
    ),
    AgentCatalogueEntry(
        id=AgentId.ADVERSARY,
        name="Adversary",
        reads="Compiled obligations and the passages cited for them",
        proposes="Reasons an obligation should not be trusted",
        never_does="Edit or delete the obligation it challenges",
        gated_by="A landed challenge blocks publication until a person rules",
        tools=["list_active_obligations", "read_span", "verify_quote", "analyse_timing",
               "read_entity_facts"],
        autonomy="Blocks on a landed challenge; never resolves one itself",
    ),
    AgentCatalogueEntry(
        id=AgentId.EXTRACTOR,
        name="Extractor",
        reads="A passage's own wording",
        proposes="Whether that wording supports a computable deadline",
        never_does="Supply the missing period or clock-start",
        gated_by="A blocked verdict routes the gap to a person",
        tools=["read_span", "analyse_span_timing", "list_statements"],
        autonomy="Proposes a verdict; the firm's policy remains a human decision",
    ),
]
