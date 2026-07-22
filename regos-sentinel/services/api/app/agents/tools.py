"""The tools agents may call.

Every one of these is ordinary deterministic Python over pinned corpora. That is
deliberate: the search, the quote verification and the version diff are the parts that
must be *right*, so they are the parts that must not depend on a model. A planner
decides which of them to call; none of them asks a model anything.

Note what is absent. There is no tool that writes an obligation, changes a control,
sets a deadline, or approves anything. The toolbox is the permission boundary, and it
is enforced by omission rather than by a policy an agent could talk its way around.

A second boundary sits inside the first. :data:`TOOL_SPECS` is the surface a *language
model* planner is offered, and it is deliberately narrower than the toolbox. The rule
is not that a planner may never type a string — it types search queries, and it may
offer a quotation to :func:`verify_quote` to have it refuted. The rule is that **no
string a planner writes can come back as evidence**. Every planner-visible tool returns
content drawn from a pinned corpus, or returns a verdict about the caller's own text
without repeating it into a finding.

That is why :func:`analyse_timing` is absent here while :func:`analyse_span_timing` is
present, and why :func:`compare_span_sets` is absent while
:func:`source_comparison_tool` is present. Both excluded tools take the material to be
judged as an argument, so a model calling them would be grading its own prose and a gate
downstream would treat the verdict as a fact about the regulation. Their replacements
take an identifier and read the text from pinned state. The planner picks the route; the
sources supply the content.
"""

from __future__ import annotations

import hashlib
import re
from typing import Any, Dict, List, Optional

from ..models import SourceSpan, WorkspaceState

#: Excerpts of the governing CSCRF that the reference resolver is allowed to search.
#: Pinned and hashed — the agent searches a fixed corpus, it does not browse the web.
CSCRF_CORPUS: Dict[str, Dict[str, str]] = {
    "CSCRF-TABLE-19": {
        "locator": "CSCRF Part I · PDF page 49 · Table 19",
        "heading": "Table 19 — VAPT report submission and observation closure timelines",
        "text": (
            "Report submission of VAPT: VAPT report shall be submitted after approval "
            "from respective IT Committee for REs, within one (1) month of completion of "
            "VAPT activity. Closure of findings identified during VAPT activity: Within "
            "3 months of submission of VAPT report. A graded approach (based on the "
            "criticality of observations) shall be followed for closure of the "
            "observations found during VAPT. Revalidation of VAPT shall be completed "
            "within 5 months of completion of VAPT."
        ),
    },
    "CSCRF-PR-MA-S3": {
        "locator": "CSCRF Part II · PDF pages 116–117 · PR.MA.S3 items 1 and 11",
        "heading": "PR.MA.S3 — Patch management procedures and maximum timelines",
        "text": (
            "REs shall establish and ensure that the patch management procedures include "
            "the identification, categorization and prioritization of patches and "
            "updates. An implementation timeframe for each category of patches shall be "
            "established to apply them in a timely manner. Based on the criticality of "
            "the patches, REs shall ensure that patches are implemented at both PDC and "
            "DR site within the upper or maximum time limit: High — 1 week; Moderate — "
            "2 weeks; Low — 1 month."
        ),
    },
    "CSCRF-PR-MA-G6": {
        "locator": "CSCRF Part II · PDF page 116 · PR.MA Guideline 6",
        "heading": "PR.MA Guideline 6 — Virtual patching for legacy systems",
        "text": (
            "Compensatory controls like virtual patching shall be implemented for legacy "
            "systems for a maximum period of 6 months. Further, the constraints due to "
            "which virtual patching is done shall be legitimate and documented."
        ),
    },
    "CSCRF-ANNEXURE-A": {
        "locator": "CSCRF Part III · PDF pages 133–141 · Annexure-A",
        "heading": "Annexure-A — VAPT report format",
        "text": (
            "Annexure-A: VAPT Report Format. Reporting format for market entities to "
            "submit their compliance and findings of VAPT. The format records "
            "organisation, entity type, CSCRF category and rationale, audit period, "
            "auditing organisation, IT Committee presentation date, "
            "authorised-signatory declaration, findings, open vulnerabilities, closure "
            "timelines and detailed risk information."
        ),
    },
}

CSCRF_SOURCE_URL = "https://www.sebi.gov.in/sebi_data/attachdocs/aug-2024/1724326790365.pdf"

#: Words that promise a timing without stating one. The gate that matters most.
_UNTIMED_URGENCY = (
    "immediate basis",
    "immediately",
    "regular/continuous",
    "continuous basis",
    "regularly",
    "periodically",
    "periodic",
    "expedite",
    "timely",
    "as soon as",
    "promptly",
    "from time to time",
)

_EXPLICIT_PERIOD = re.compile(
    r"\b(\d+|one|two|three|five|six|seven|twelve)\s*\(?\d*\)?\s*"
    r"(day|days|week|weeks|month|months|year|years|hour|hours)\b",
    re.IGNORECASE,
)

_TRIGGER_MARKERS = (
    " of submission of ",
    " of completion of ",
    " from the date ",
    " after approval from ",
    " within one (1) month of ",
    " of receipt of ",
)


# --------------------------------------------------------------------------- #
# Corpus search and quote verification — the reference resolver's tools
# --------------------------------------------------------------------------- #


#: Distinctive identifiers a regulatory pointer uses. A locator like
#: "CSCRF Part I · PDF page 49 · Table 19" is mostly boilerplate — the identifier is
#: the only part that discriminates, so it is matched first and weighted hardest.
_IDENTIFIER = re.compile(
    r"(table\s*\d+|annexure[-\s]*[a-z]|pr\.ma\.s\d+|guideline\s*\d+|pr\.ma\b)",
    re.IGNORECASE,
)


def _identifiers(text: str) -> List[str]:
    return [" ".join(match.group(0).lower().replace("-", " ").split())
            for match in _IDENTIFIER.finditer(text)]


def span_identifiers(span_id: str) -> List[str]:
    """The identifiers a pinned excerpt answers to, from its heading and its id."""
    entry = CSCRF_CORPUS.get(span_id)
    if entry is None:
        return []
    return _identifiers(f"{entry['heading']} {span_id}")


def identifiers_agree(pointer: str, span_id: str) -> Dict[str, Any]:
    """Does a pointer name the passage it was matched to?

    This exists because the resolver's original check could not fail. It drew a probe
    from the fetched passage and then verified that probe against the same passage, so
    "verified verbatim" was true by construction and every search hit became a
    resolution — a pointer to "Table 47" resolved to Table 19, and one to
    "PR.MA Guideline 5" resolved to Guideline 6, each reported as confirmed.

    The check has to compare the passage against something the passage did not supply.
    The pointer is the only such thing available, so the rule is: every identifier the
    pointer names must be one the passage answers to. Ranking a near-miss stays
    harmless; accepting one does not.
    """
    wanted = sorted(set(_identifiers(pointer)))
    held = sorted(set(span_identifiers(span_id)))
    missing = [item for item in wanted if item not in held]
    if not wanted:
        return {
            "agrees": False,
            "pointer_identifiers": [],
            "span_identifiers": held,
            "missing": [],
            "reason": (
                "The pointer names no identifier (no table, annexure, guideline or "
                "control number), so there is nothing to verify a match against."
            ),
        }
    agrees = not missing
    return {
        "agrees": agrees,
        "pointer_identifiers": wanted,
        "span_identifiers": held,
        "missing": missing,
        "reason": (
            f"The passage answers to {', '.join(held)}, which covers the pointer."
            if agrees
            else (
                f"The pointer names {', '.join(missing)}, which this passage does not "
                f"answer to — it answers to {', '.join(held) or 'nothing'}."
            )
        ),
    }


def search_corpus(query: str, limit: int = 3) -> Dict[str, Any]:
    """Rank pinned CSCRF excerpts against a query.

    Deliberately boring, with one piece of domain knowledge: regulatory pointers carry
    a distinctive identifier ("Table 19", "PR.MA.S3", "Annexure-A") surrounded by
    boilerplate. Plain term overlap drowns in the boilerplate and matches whichever
    excerpt is longest — which is precisely the failure this scoring exists to avoid.
    An identifier match therefore outranks any amount of prose overlap.
    """
    query_ids = _identifiers(query)
    terms = [item for item in re.split(r"\W+", query.lower()) if len(item) > 2]
    scored = []
    for span_id, entry in CSCRF_CORPUS.items():
        heading = entry["heading"].lower()
        body = entry["text"].lower()
        entry_ids = _identifiers(f"{entry['heading']} {span_id}")
        identifier_hit = any(item in entry_ids for item in query_ids)
        score = sum(heading.count(term) * 3 + body.count(term) for term in terms)
        if identifier_hit:
            score += 1000  # an exact identifier beats every prose signal
        if score:
            scored.append((score, span_id, entry))
    scored.sort(key=lambda item: (-item[0], item[1]))
    hits = [
        {
            "span_id": span_id,
            "locator": entry["locator"],
            "heading": entry["heading"],
            "score": score,
        }
        for score, span_id, entry in scored[:limit]
    ]
    return {
        "query": query,
        "hits": hits,
        "summary": f"{len(hits)} of {len(CSCRF_CORPUS)} pinned excerpts matched {query!r}",
    }


def fetch_span(span_id: str) -> Dict[str, Any]:
    """Return a pinned excerpt with its fingerprint."""
    entry = CSCRF_CORPUS.get(span_id)
    if entry is None:
        return {
            "span_id": span_id,
            "found": False,
            "summary": f"{span_id} is not in the pinned CSCRF corpus",
        }
    digest = hashlib.sha256(entry["text"].encode()).hexdigest()
    return {
        "span_id": span_id,
        "found": True,
        "locator": entry["locator"],
        "heading": entry["heading"],
        "text": entry["text"],
        "sha256": digest,
        "source_url": CSCRF_SOURCE_URL,
        "summary": f"{span_id} · {entry['locator']} · sha256 {digest[:12]}…",
    }


def verify_quote(span_id: str, quote: str) -> Dict[str, Any]:
    """Check a quotation appears verbatim in the pinned excerpt.

    This is the tool that stops a model inventing a citation. A quote that does not
    appear is reported as absent — never repaired, never approximated.
    """
    entry = CSCRF_CORPUS.get(span_id)
    if entry is None:
        return {
            "span_id": span_id,
            "verbatim": False,
            "reason": "span not in the pinned corpus",
            "summary": f"cannot verify against unknown span {span_id}",
        }
    normalised_source = " ".join(entry["text"].split()).lower()
    normalised_quote = " ".join(quote.split()).lower()
    verbatim = normalised_quote in normalised_source
    return {
        "span_id": span_id,
        "quote": quote,
        "verbatim": verbatim,
        "reason": "found verbatim" if verbatim else "not present in the cited excerpt",
        "summary": f"{'verbatim' if verbatim else 'NOT FOUND'} in {span_id}",
    }


# --------------------------------------------------------------------------- #
# Timing analysis — the tool that finds the defect this product exists for
# --------------------------------------------------------------------------- #


def analyse_timing(text: str) -> Dict[str, Any]:
    """Decide whether a passage states a usable period and clock-start.

    Three outcomes matter:

    * a stated period **and** a stated trigger → a date may be computed;
    * a stated period, no trigger → the FAQ Q17(a) shape, blocked;
    * urgency words with no period at all → the advisory shape, also blocked.
    """
    lowered = " ".join(text.split()).lower()
    period_match = _EXPLICIT_PERIOD.search(lowered)
    stated_period = period_match.group(0) if period_match else None
    urgency = sorted({word for word in _UNTIMED_URGENCY if word in lowered})
    has_trigger = any(marker in lowered for marker in _TRIGGER_MARKERS)

    if stated_period and has_trigger:
        verdict = "PERIOD_AND_TRIGGER_STATED"
        note = "A period and a clock-start are both stated; a date can be computed."
    elif stated_period:
        verdict = "PERIOD_WITHOUT_TRIGGER"
        note = "A period is stated but no event starts it. No date may be produced."
    elif urgency:
        verdict = "URGENCY_WITHOUT_PERIOD"
        note = (
            "Urgency language with no measurable period. Words like "
            f"{', '.join(repr(item) for item in urgency)} do not define a deadline."
        )
    else:
        verdict = "NO_TIMING_LANGUAGE"
        note = "The passage states a duty without timing; nothing to compute."

    return {
        "verdict": verdict,
        "stated_period": stated_period,
        "urgency_words": urgency,
        "clock_start_stated": has_trigger,
        "note": note,
        "summary": f"{verdict}"
        + (f" · period={stated_period}" if stated_period else "")
        + (f" · urgency={','.join(urgency)}" if urgency else ""),
    }


# --------------------------------------------------------------------------- #
# Workspace-reading tools — bound to one state, read-only by construction
# --------------------------------------------------------------------------- #


def workspace_tools(state: WorkspaceState) -> Dict[str, Any]:
    """Read-only views over the live workspace, closed over one state object.

    Nothing here mutates. An agent cannot reach the store.
    """

    def list_unresolved_references() -> Dict[str, Any]:
        pending = [
            {
                "reference_id": item.id,
                "from_span_id": item.from_span_id,
                "target_locator": item.target_locator,
                "relationship": item.relationship,
                "note": item.resolution_note or "",
            }
            for item in state.references
            if item.status.value == "UNRESOLVED"
        ]
        return {
            "references": pending,
            "summary": f"{len(pending)} unresolved outbound reference(s)",
        }

    def read_span(span_id: str) -> Dict[str, Any]:
        span: Optional[SourceSpan] = next(
            (item for item in state.source_spans if item.id == span_id), None
        )
        if span is None:
            return {"span_id": span_id, "found": False, "summary": f"{span_id} not in workspace"}
        return {
            "span_id": span.id,
            "found": True,
            "locator": span.locator,
            "question": span.question,
            "text": span.text,
            "subject_key": span.subject_key,
            "summary": f"{span.id} · {span.locator}",
        }

    def list_active_obligations() -> Dict[str, Any]:
        active = [
            {
                "obligation_id": item.id,
                "actor": item.actor,
                "action": item.action,
                "object": item.object,
                "condition": item.condition,
                "control_id": item.control_id,
                "duration": f"{item.deadline.duration} {item.deadline.unit}",
                "trigger": item.deadline.trigger,
                "trigger_provenance": (
                    item.deadline.trigger_provenance.value
                    if item.deadline.trigger_provenance
                    else None
                ),
                "computable": item.deadline.computable,
                "cited_span_id": item.deadline.citation.span_id,
                "cited_quote": item.deadline.citation.quote,
            }
            for item in state.obligations
            if item.status == "ACTIVE"
        ]
        return {
            "obligations": active,
            "summary": f"{len(active)} active compiled obligation(s)",
        }

    def list_statements(span_id: str = "") -> Dict[str, Any]:
        items = [
            {
                "statement_id": item.id,
                "span_id": item.span_id,
                "exact_phrase": item.exact_phrase,
                "deontic_force": item.deontic_force.value,
                "subject": item.subject,
            }
            for item in state.regulatory_statements
            if not span_id or item.span_id == span_id
        ]
        return {"statements": items, "summary": f"{len(items)} statement(s)"}

    def analyse_span_timing(span_id: str) -> Dict[str, Any]:
        """Judge the timing of a pinned passage, named by id rather than quoted.

        This is :func:`analyse_timing` with the text supplied by the workspace instead
        of by the caller. That difference is the whole point: a planner may say *which*
        passage to judge and may not say *what it says*. The verdict is returned keyed
        by ``span_id`` so a gate can match it to the passage by identity rather than by
        its position in the plan — which is what makes a model-chosen order safe.
        """
        span = next((item for item in state.source_spans if item.id == span_id), None)
        if span is None:
            return {
                "span_id": span_id,
                "found": False,
                "summary": f"{span_id} not in workspace; nothing to analyse",
            }
        verdict = analyse_timing(span.text)
        return {**verdict, "span_id": span.id, "found": True, "locator": span.locator}

    def read_entity_facts() -> Dict[str, Any]:
        profile = state.entity_profile
        return {
            "entity_type": profile.entity_type,
            "is_qsb": profile.is_qsb,
            "cscrf_category": profile.cscrf_category,
            "registrations": len(profile.registrations),
            "has_dormant_license": profile.has_dormant_license,
            "synthetic": profile.synthetic,
            "summary": (
                f"{profile.entity_type} · is_qsb={str(profile.is_qsb).lower()} · "
                f"{len(profile.registrations)} registration(s) · synthetic"
            ),
        }

    return {
        "list_unresolved_references": list_unresolved_references,
        "read_span": read_span,
        "list_active_obligations": list_active_obligations,
        "list_statements": list_statements,
        "read_entity_facts": read_entity_facts,
        "analyse_span_timing": analyse_span_timing,
    }


# --------------------------------------------------------------------------- #
# Source-version tools — the scout's tools
# --------------------------------------------------------------------------- #


def list_known_sources(state: WorkspaceState) -> Dict[str, Any]:
    packs = [
        {
            "pack_id": pack.id,
            "document_id": pack.document_id,
            "version": pack.version,
            "published_at": pack.published_at,
            "status": pack.status.value,
            "content_identity_sha256": pack.content_identity_sha256,
            "indexed_span_count": pack.indexed_span_count,
        }
        for pack in state.corpus_packs
    ]
    return {"packs": packs, "summary": f"{len(packs)} registered corpus pack(s)"}


def compare_span_sets(
    base: List[Dict[str, str]],
    candidate: List[Dict[str, str]],
    relationship: str = "READ_IN_CONJUNCTION_WITH",
) -> Dict[str, Any]:
    """Compare two sets of `{subject_key, quote}` records by topic.

    ``relationship`` is load-bearing and must match what the newer source says about
    itself. SEBI's 5 May 2026 advisory states at paragraph E that it "should be read in
    conjunction with the applicable SEBI circulars (including but not limited to
    Cybersecurity and Cyber Resilience framework)" — it adds duties, it does not
    replace the FAQ. Under ``READ_IN_CONJUNCTION_WITH`` a topic the newer source is
    silent on is *not addressed*, which is ordinary for an additive source. Only under
    ``SUPERSEDES`` is that same silence a disappearance worth escalating.

    Reading an additive source as a replacement would manufacture alarming findings
    out of nothing, so the distinction is enforced here rather than left to the caller.
    """
    if relationship not in {"READ_IN_CONJUNCTION_WITH", "SUPERSEDES"}:
        raise ValueError(
            "relationship must be READ_IN_CONJUNCTION_WITH or SUPERSEDES; the newer "
            "source's own wording decides which."
        )
    base_by_key = {item["subject_key"]: item for item in base if item.get("subject_key")}
    cand_by_key = {
        item["subject_key"]: item for item in candidate if item.get("subject_key")
    }
    added = sorted(set(cand_by_key) - set(base_by_key))
    silent = sorted(set(base_by_key) - set(cand_by_key))
    shared = sorted(set(base_by_key) & set(cand_by_key))
    changed = [
        key
        for key in shared
        if " ".join(base_by_key[key]["quote"].split())
        != " ".join(cand_by_key[key]["quote"].split())
    ]
    unchanged = [key for key in shared if key not in changed]
    supersedes = relationship == "SUPERSEDES"
    return {
        "relationship": relationship,
        "added": added,
        "changed": changed,
        "unchanged": unchanged,
        # The same set of keys, named for what it actually means under this relationship.
        "absent": silent if supersedes else [],
        "not_addressed": [] if supersedes else silent,
        "summary": (
            f"{relationship} · {len(added)} added · {len(changed)} changed · "
            f"{len(unchanged)} unchanged · "
            + (
                f"{len(silent)} absent from the newer version"
                if supersedes
                else f"{len(silent)} untouched by this source"
            )
        ),
    }


def source_comparison_tool(state: WorkspaceState, candidate: List[Dict[str, str]]):
    """Build the planner-safe form of :func:`compare_span_sets`.

    :func:`compare_span_sets` takes both sides of the comparison as arguments, which is
    the right shape for a deterministic caller and the wrong shape for a model — asking
    a model to reproduce two sets of exact quotations invites it to approximate one.
    This closure supplies both sides from pinned state and leaves the planner exactly
    one decision: which relationship the newer source claims for itself. That decision
    is a reading of the source's own words, which is a judgement worth having a model
    make, and it is validated by :func:`compare_span_sets` before it is acted on.
    """

    def compare_registered_sources(
        relationship: str = "READ_IN_CONJUNCTION_WITH",
    ) -> Dict[str, Any]:
        base = [
            {"subject_key": item.subject_key, "quote": item.exact_phrase}
            for item in state.regulatory_statements
            if item.subject_key
        ]
        return compare_span_sets(base, candidate, relationship=relationship)

    return compare_registered_sources


# --------------------------------------------------------------------------- #
# The planner-visible surface
# --------------------------------------------------------------------------- #

#: JSON schemas for the tools a language-model planner may choose from.
#:
#: A tool absent from this table is not hidden from the *system* — deterministic plans
#: call several of them — it is hidden from the *model*. The rule for inclusion is
#: mechanical: every property below is an identifier or a closed enumeration, so the
#: worst a wrong model choice can do is read the wrong pinned passage, which the trace
#: records and the gate discards. Nothing here lets a model supply evidence.
TOOL_SPECS: Dict[str, Dict[str, Any]] = {
    "list_unresolved_references": {
        "description": (
            "List every outbound pointer in the workspace that has no resolved target "
            "yet. Takes no arguments. Start here when the goal is to resolve pointers."
        ),
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
    "search_corpus": {
        "description": (
            "Rank the pinned CSCRF excerpts against a locator string such as "
            "'CSCRF Part I · PDF page 49 · Table 19'. Returns candidate span ids with "
            "scores. Pass the target_locator of a reference verbatim."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": (
                        "A locator or identifier copied from a reference, e.g. "
                        "'Table 19', 'PR.MA.S3', 'Annexure-A', 'PR.MA Guideline 6'."
                    ),
                },
                "limit": {"type": "integer", "minimum": 1, "maximum": 4},
            },
            "required": ["query"],
        },
    },
    "fetch_span": {
        "description": (
            "Return one pinned CSCRF excerpt in full, with its SHA-256 fingerprint. "
            "Use a span id returned by search_corpus."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "span_id": {
                    "type": "string",
                    "enum": sorted(CSCRF_CORPUS),
                }
            },
            "required": ["span_id"],
        },
    },
    "verify_quote": {
        "description": (
            "Check whether a quotation appears verbatim in a pinned CSCRF excerpt. "
            "Quote text must be copied from a passage already read, never composed."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "span_id": {"type": "string", "enum": sorted(CSCRF_CORPUS)},
                "quote": {
                    "type": "string",
                    "description": "Text copied verbatim from a passage you have read.",
                },
            },
            "required": ["span_id", "quote"],
        },
    },
    "read_span": {
        "description": (
            "Read one source passage held in the workspace, by id, e.g. 'FAQ-Q15'. "
            "Returns its locator, question and full text."
        ),
        "parameters": {
            "type": "object",
            "properties": {"span_id": {"type": "string"}},
            "required": ["span_id"],
        },
    },
    "analyse_span_timing": {
        "description": (
            "Judge whether a workspace passage states a usable deadline. Returns one "
            "of PERIOD_AND_TRIGGER_STATED, PERIOD_WITHOUT_TRIGGER, "
            "URGENCY_WITHOUT_PERIOD or NO_TIMING_LANGUAGE, keyed by span id. You name "
            "the passage; you do not supply its text."
        ),
        "parameters": {
            "type": "object",
            "properties": {"span_id": {"type": "string"}},
            "required": ["span_id"],
        },
    },
    "list_active_obligations": {
        "description": (
            "List every compiled obligation that would reach a person, with the span "
            "and quotation each one rests on. Takes no arguments."
        ),
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
    "read_entity_facts": {
        "description": (
            "Read the synthetic entity profile that applicability was decided against. "
            "Takes no arguments."
        ),
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
    "list_statements": {
        "description": (
            "List extracted regulatory statements, optionally filtered to one span id."
        ),
        "parameters": {
            "type": "object",
            "properties": {"span_id": {"type": "string"}},
            "required": [],
        },
    },
    "list_known_sources": {
        "description": (
            "List the registered corpus packs and their versions, statuses and content "
            "fingerprints. Takes no arguments."
        ),
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
    "compare_registered_sources": {
        "description": (
            "Compare the reviewed corpus against the newer registered source by topic. "
            "You choose only the relationship the newer source claims for itself: "
            "READ_IN_CONJUNCTION_WITH if it is additive, SUPERSEDES if it replaces. "
            "Read the newer source's own wording before choosing; a wrong choice "
            "reports untouched topics as disappearances."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "relationship": {
                    "type": "string",
                    "enum": ["READ_IN_CONJUNCTION_WITH", "SUPERSEDES"],
                }
            },
            "required": ["relationship"],
        },
    },
}


def planner_visible(tool_names: List[str]) -> List[Dict[str, Any]]:
    """The subset of an agent's toolbox that may be offered to a model planner."""
    return [
        {"name": name, **TOOL_SPECS[name]} for name in sorted(tool_names) if name in TOOL_SPECS
    ]
