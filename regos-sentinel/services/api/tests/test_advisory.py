"""Tests for the second real source: SEBI's 5 May 2026 AI advisory.

The advisory is the document that lets Case D stop being a constructed comparison. It
earns that only if the passages are the regulator's own words and the extraction gaps
are declared rather than glossed over.
"""

from __future__ import annotations

from app.advisory import (
    ADVISORY_NUMBER,
    EXTRACTION_GAPS,
    advisory_document,
    advisory_pack,
    advisory_spans,
    advisory_statements,
)
from app.agents.tools import analyse_timing
from app.models import DeonticForce


def test_advisory_passages_are_verbatim_and_gaps_declared() -> None:
    spans = advisory_spans()
    pack = advisory_pack(spans)
    document = advisory_document(spans)

    assert len(spans) == 9
    assert pack.indexed_span_count == len(spans)
    assert pack.authority == "Securities and Exchange Board of India"
    assert ADVISORY_NUMBER in pack.version

    # The passage that makes the whole comparison legible: this source is additive.
    read_with = next(item for item in spans if item.id == "ADV-E-READ-WITH-CSCRF")
    assert "read in conjunction with" in read_with.text
    assert "Cyber Resilience framework" in read_with.text

    # The passage that asks for what this prototype is.
    agentic = next(item for item in spans if item.id == "ADV-ANNEX-10-AGENTIC-PLAN")
    assert "autonomous/agentic mitigation" in agentic.text
    assert "shall seek guidance from their respective IT committees" in agentic.text

    # Gaps are named, not implied by silence.
    assert len(EXTRACTION_GAPS) >= 4
    assert any("item 4" in gap for gap in EXTRACTION_GAPS)
    assert any("item 8" in gap for gap in EXTRACTION_GAPS)
    assert "declared as gaps" in document.corpus_scope
    assert "extraction is partial" in document.disclaimer
    assert "gaps" in pack.extraction_scope


def test_advisory_untimed_duties_are_blocked_not_guessed() -> None:
    """The advisory is full of mandatory duties with no measurable period.

    Four of them, in the regulator's own words: "on immediate basis",
    "on a regular/continuous basis", "shall expedite", "Periodically update". Each is a
    real duty and none of them yields a date. That is the same defect as FAQ Q17(a),
    found in a document published after this prototype was designed.
    """
    spans = advisory_spans()
    statements = advisory_statements(spans)

    mandatory = [item for item in statements if item.deontic_force == DeonticForce.MANDATORY]
    assert len(mandatory) >= 6

    untimed = [
        item
        for item in mandatory
        if analyse_timing(item.exact_phrase)["verdict"] != "PERIOD_AND_TRIGGER_STATED"
    ]
    assert len(untimed) >= 4, "the advisory's untimed duties are the point of this case"

    # None of them may be presented as computable.
    for item in untimed:
        assert "TIMING_UNRESOLVED" in item.operational_effect or (
            item.operational_effect == "CONTROL_GENERATING"
        )

    # And the one clearly-timed state requirement is not wrongly blocked.
    whitelist = next(item for item in statements if item.subject_key == "api.whitelist")
    assert whitelist.deontic_force == DeonticForce.MANDATORY
    assert whitelist.operational_effect == "CONTROL_GENERATING"


def test_the_advisory_escalates_a_topic_the_faq_only_encouraged() -> None:
    """FAQ Q15 encouraged vendor SLA timelines. The advisory requires safeguards."""
    statements = advisory_statements(advisory_spans())

    vendor = next(item for item in statements if item.subject_key == "vapt.vendor.sla.timeline")

    assert vendor.deontic_force == DeonticForce.MANDATORY
    assert "shall implement appropriate safeguards" in vendor.exact_phrase
    assert "the FAQ merely encouraged" in vendor.review_note
