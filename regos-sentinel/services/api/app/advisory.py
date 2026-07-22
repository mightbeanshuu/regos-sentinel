"""The second real source: SEBI's 5 May 2026 AI vulnerability-detection advisory.

This is a genuine SEBI circular, published nine months after the CSCRF FAQ this
prototype was built around, and it lands squarely on the same subject matter —
patching, VAPT, virtual patching, vendor safeguards and IT Committees. It is what
makes a source-version comparison real rather than constructed.

Two things about it are worth stating plainly, because they shaped the build:

**It asks for exactly what this prototype is.** Annexure-A item 10 instructs REs to
"prepare a long-term plan for usage of AI in detection and autonomous/agentic
mitigation", under IT Committee guidance. Agentic, with a human gate.

**It is full of the defect this prototype exists to catch.** "on immediate basis",
"on a regular/continuous basis", "shall expedite", "periodically" — mandatory duties
with no stated period or clock-start. The gates block on these the same way they
block on FAQ Q17(a), and none of it was written to make the demo work.

## Extraction scope, stated honestly

The source is a seven-page bilingual (Hindi/English) PDF. The English text below was
extracted from the official PDF and human-checked. Numbered items **4 and 8 of
Annexure-A, and sub-items 5(c) and 6 (partial), did not survive text extraction** from
the bilingual layout and are therefore *not* represented here. The pack records that
gap rather than presenting itself as complete — see ``EXTRACTION_GAPS``.
"""

from __future__ import annotations

import hashlib
from typing import List

from .models import (
    Citation,
    CorpusPack,
    CorpusState,
    DeonticForce,
    Provenance,
    RegulatoryStatement,
    SourceDocument,
    SourceSpan,
)

ADVISORY_DOCUMENT_ID = "SEBI-AI-VULN-ADVISORY-2026-05-05"
ADVISORY_URL = "https://www.sebi.gov.in/sebi_data/attachdocs/may-2026/1777992004516.pdf"
ADVISORY_LANDING_URL = (
    "https://www.sebi.gov.in/legal/circulars/may-2026/"
    "advisory-on-emerging-advanced-artificial-intelligence-ai-tools-for-"
    "vulnerability-detection_101270.html"
)
ADVISORY_NUMBER = "HO/13/19/12(1)2026-ITD-1_CIMGI/10873/2026"
ADVISORY_PUBLISHED = "2026-05-05"

#: Items the text extraction did not recover from the bilingual PDF. Naming them is
#: the difference between a declared scope and a silent omission.
EXTRACTION_GAPS = [
    "Annexure-A item 4 — not recovered from the bilingual layout",
    "Annexure-A item 8 — not recovered from the bilingual layout",
    "Annexure-A item 5(c) — not recovered from the bilingual layout",
    "Annexure-A item 6, sub-items beyond (a)–(d) — partial recovery only",
    "Paragraph C sub-item (iii) — not recovered from the bilingual layout",
]


def _span(
    span_id: str,
    question: str,
    locator: str,
    text: str,
    subject_key: str = "",
    normative: bool = True,
) -> SourceSpan:
    return SourceSpan(
        id=span_id,
        document_id=ADVISORY_DOCUMENT_ID,
        question=question,
        locator=locator,
        text=text,
        normative_signal=normative,
        source_url=ADVISORY_URL,
        subject_key=subject_key,
    )


def advisory_spans() -> List[SourceSpan]:
    """Verbatim English passages from the official PDF. Quotes are not paraphrased."""
    return [
        _span(
            "ADV-A-RISK-CONTEXT",
            "Para A — why the advisory was issued",
            "Advisory dated 5 May 2026 · PDF page 1 · Paragraph A",
            "The rapid evolution of emerging technologies including AI-driven "
            "vulnerability identification tools has introduced new dimensions of risks "
            "for Regulated Entities. Such tools may give rise to heightened risk "
            "exposure by enabling identification and potential exploitation of existing "
            "vulnerabilities using speed and scale. It may also introduce concerns "
            "relating to data confidentiality, application integrity and reliability of "
            "outputs.",
            normative=False,
        ),
        _span(
            "ADV-E-READ-WITH-CSCRF",
            "Para E — relationship to the CSCRF",
            "Advisory dated 5 May 2026 · PDF page 3 · Paragraph E",
            "This advisory should be read in conjunction with the applicable SEBI "
            "circulars (including but not limited to Cybersecurity and Cyber Resilience "
            "framework) and any subsequent updates issued by SEBI from time to time.",
            subject_key="advisory.read.with.cscrf",
        ),
        _span(
            "ADV-ANNEX-1-PATCH-IMMEDIATE",
            "Annexure-A item 1 — patching and virtual patching",
            "Advisory dated 5 May 2026 · PDF page 5 · Annexure-A item 1",
            "Update all operating systems and applications with the latest patches on "
            "immediate basis to mitigate any identified/known vulnerabilities. As an "
            "interim measure for the vulnerabilities where patches are not available, "
            "virtual patching can be considered for protecting systems and networks.",
            subject_key="patch.high.severity.timeline",
        ),
        _span(
            "ADV-ANNEX-2-VA-CONTINUOUS",
            "Annexure-A item 2 — vulnerability assessment periodicity",
            "Advisory dated 5 May 2026 · PDF page 5 · Annexure-A item 2",
            "Conduct Vulnerability Assessment (Using conventional and suitable AI based "
            "Vulnerability Assessment Tools where possible) and undertake security "
            "audits on a regular/continuous basis in accordance with Cyber Security and "
            "Cyber Resilience Framework of SEBI.",
            subject_key="vapt.periodicity",
        ),
        _span(
            "ADV-ANNEX-3-VENDOR-SAFEGUARDS",
            "Annexure-A item 3 — third-party vendors and empanelled vendors",
            "Advisory dated 5 May 2026 · PDF page 5 · Annexure-A item 3",
            "Engage with the respective RE's third party vendors to release timely "
            "patches and deploy them appropriately. Exchanges and Depositaries shall "
            "direct their empaneled application vendors (providing COTS solution to "
            "respective members) to undertake comprehensive assessment of the risks "
            "arising from the use of AI-led vulnerability detection models. Based on the "
            "assessment, vendors shall implement appropriate safeguards including "
            "updating patch, VAPT, continuous monitoring, hardening measures etc.",
            subject_key="vapt.vendor.sla.timeline",
        ),
        _span(
            "ADV-ANNEX-5D-API-WHITELIST",
            "Annexure-A item 5(d) — API connection policy",
            "Advisory dated 5 May 2026 · PDF page 5 · Annexure-A item 5(d)",
            "Connections through APIs to be strictly on a whitelist-based approach.",
            subject_key="api.whitelist",
        ),
        _span(
            "ADV-ANNEX-6C-MSOC-ONBOARD",
            "Annexure-A item 6(c) — Market SOC onboarding",
            "Advisory dated 5 May 2026 · PDF page 6 · Annexure-A item 6(c)",
            "The Market SOC (M-SOC), established by NSE and BSE, which serves as a "
            "centralized security platform, provides 24x7 real-time monitoring and "
            "threat detection across digital infrastructure. In the view of enhanced "
            "risks posed by AI-driven attacks, all eligible REs (not on boarded with any "
            "M-SOC) shall expedite the onboarding.",
            subject_key="msoc.onboarding",
        ),
        _span(
            "ADV-ANNEX-9-ASSET-INVENTORY",
            "Annexure-A item 9 — asset inventory and SBOM",
            "Advisory dated 5 May 2026 · PDF page 6 · Annexure-A item 9",
            "Periodically update Asset Inventory and Software Bill of Materials for all "
            "critical applications including open source stack.",
            subject_key="asset.inventory.periodicity",
        ),
        _span(
            "ADV-ANNEX-10-AGENTIC-PLAN",
            "Annexure-A item 10 — IT Committee guidance and the agentic-AI plan",
            "Advisory dated 5 May 2026 · PDF page 7 · Annexure-A item 10",
            "MIIs and other Regulated Entities shall seek guidance from their respective "
            "IT committees for mitigating risks emanating from AI-led vulnerability "
            "detection models. Further, all REs need to prepare a long-term plan for "
            "usage of AI in detection and autonomous/agentic mitigation. Also, undertake "
            "other measures including recalibration of risks for AI accelerated threats, "
            "AI augmented SOC transformation, and continuous vulnerability management "
            "using AI tools.",
            subject_key="ai.agentic.plan",
        ),
    ]


def advisory_content_hash(spans: List[SourceSpan]) -> str:
    return hashlib.sha256("\n".join(span.text for span in spans).encode()).hexdigest()


def advisory_document(spans: List[SourceSpan]) -> SourceDocument:
    return SourceDocument(
        id=ADVISORY_DOCUMENT_ID,
        authority="Securities and Exchange Board of India",
        title=(
            "Advisory on Emerging Advanced Artificial Intelligence (AI) Tools for "
            "Vulnerability Detection"
        ),
        document_type="Circular / advisory",
        published_at=ADVISORY_PUBLISHED,
        legal_state="IN FORCE — READ WITH CSCRF",
        source_url=ADVISORY_URL,
        content_hash=advisory_content_hash(spans),
        content_hash_scope=(
            "SHA-256 OF NINE HUMAN-CHECKED ENGLISH PASSAGES, NOT THE FULL BILINGUAL PDF"
        ),
        corpus_scope=(
            f"Circular {ADVISORY_NUMBER}. Nine English passages covering paragraphs A "
            "and E and Annexure-A items 1, 2, 3, 5(d), 6(c), 9 and 10. Items 4 and 8 "
            "and several sub-items did not survive extraction and are declared as gaps."
        ),
        disclaimer=(
            "The official document is bilingual. Only the English text is represented "
            "here, the extraction is partial, and the named gaps must be read before "
            "relying on any coverage figure."
        ),
    )


def advisory_pack(spans: List[SourceSpan]) -> CorpusPack:
    return CorpusPack(
        id="PACK-AI-VULN-ADVISORY-2026",
        title="SEBI AI vulnerability-detection advisory · 5 May 2026",
        version=ADVISORY_NUMBER,
        published_at=ADVISORY_PUBLISHED,
        document_id=ADVISORY_DOCUMENT_ID,
        source_url=ADVISORY_LANDING_URL,
        status=CorpusState.ACTIVE,
        scope_note=(
            "A real SEBI circular published after the reviewed FAQ, on the same subject "
            "matter. Nine extracted passages; five declared extraction gaps."
        ),
        indexed_span_count=len(spans),
        compiled_candidate_count=0,
        content_identity_sha256=advisory_content_hash(spans),
        authority="Securities and Exchange Board of India",
        legal_state="IN FORCE — READ WITH CSCRF",
        extraction_scope=(
            "English text only, from the official bilingual PDF. Annexure-A items 4 and "
            "8, item 5(c), part of item 6 and paragraph C(iii) are declared gaps."
        ),
        source_span_ids=[span.id for span in spans],
        validation_tests=[
            "tests/test_advisory.py::test_advisory_passages_are_verbatim_and_gaps_declared",
            "tests/test_advisory.py::test_advisory_untimed_duties_are_blocked_not_guessed",
        ],
    )


def advisory_statements(spans: List[SourceSpan]) -> List[RegulatoryStatement]:
    """Requirement strength for each advisory passage, read from its own wording.

    Note how many are ``MANDATORY`` with no period attached. That is the point: the
    advisory creates real duties and leaves their timing open, which is the same shape
    as FAQ Q17(a) and is handled by the same gate.
    """
    by_id = {span.id: span for span in spans}

    def statement(
        statement_id: str,
        span_id: str,
        phrase: str,
        force: DeonticForce,
        operator: str,
        effect: str,
        note: str,
        subject: str,
    ) -> RegulatoryStatement:
        return RegulatoryStatement(
            id=statement_id,
            span_id=by_id[span_id].id,
            exact_phrase=phrase,
            deontic_force=force,
            legalruleml_operator=operator,
            operational_effect=effect,
            classification_provenance=Provenance.DETERMINISTIC,
            review_note=note,
            subject=subject,
            subject_key=by_id[span_id].subject_key,
        )

    return [
        statement(
            "STMT-ADV-PATCH-IMMEDIATE",
            "ADV-ANNEX-1-PATCH-IMMEDIATE",
            "Update all operating systems and applications with the latest patches on "
            "immediate basis",
            DeonticForce.MANDATORY,
            "Obligation",
            "CONTROL_GENERATING_TIMING_UNRESOLVED",
            "A duty with no stated period. 'Immediate basis' is not a measurable "
            "deadline, so no date may be produced from it.",
            "Patch application timing",
        ),
        statement(
            "STMT-ADV-VIRTUAL-PATCH",
            "ADV-ANNEX-1-PATCH-IMMEDIATE",
            "virtual patching can be considered for protecting systems and networks",
            DeonticForce.PERMITTED,
            "Permission",
            "OPTION_RECORDED_NO_TASK",
            "A permitted compensating control, carried without creating work.",
            "Virtual patching as an interim measure",
        ),
        statement(
            "STMT-ADV-VA-CONTINUOUS",
            "ADV-ANNEX-2-VA-CONTINUOUS",
            "undertake security audits on a regular/continuous basis",
            DeonticForce.MANDATORY,
            "Obligation",
            "CONTROL_GENERATING_TIMING_UNRESOLVED",
            "'Regular/continuous' states no interval. The periodicity is a firm "
            "decision, not a source fact.",
            "Vulnerability assessment periodicity",
        ),
        statement(
            "STMT-ADV-VENDOR-SAFEGUARDS",
            "ADV-ANNEX-3-VENDOR-SAFEGUARDS",
            "vendors shall implement appropriate safeguards including updating patch, "
            "VAPT, continuous monitoring, hardening measures",
            DeonticForce.MANDATORY,
            "Obligation",
            "CONTROL_GENERATING_TIMING_UNRESOLVED",
            "Directed at empanelled vendors of Exchanges and Depositories. Note the "
            "strength: the FAQ merely encouraged vendor SLA timelines.",
            "Vendor safeguards",
        ),
        statement(
            "STMT-ADV-API-WHITELIST",
            "ADV-ANNEX-5D-API-WHITELIST",
            "Connections through APIs to be strictly on a whitelist-based approach",
            DeonticForce.MANDATORY,
            "Obligation",
            "CONTROL_GENERATING",
            "A required state rather than a deadline, so no clock-start is needed.",
            "API whitelist policy",
        ),
        statement(
            "STMT-ADV-MSOC-EXPEDITE",
            "ADV-ANNEX-6C-MSOC-ONBOARD",
            "all eligible REs (not on boarded with any M-SOC) shall expedite the "
            "onboarding",
            DeonticForce.MANDATORY,
            "Obligation",
            "CONTROL_GENERATING_TIMING_UNRESOLVED",
            "'Expedite' states urgency without a date. No deadline may be derived.",
            "Market SOC onboarding",
        ),
        statement(
            "STMT-ADV-ASSET-INVENTORY",
            "ADV-ANNEX-9-ASSET-INVENTORY",
            "Periodically update Asset Inventory and Software Bill of Materials",
            DeonticForce.MANDATORY,
            "Obligation",
            "CONTROL_GENERATING_TIMING_UNRESOLVED",
            "'Periodically' states no interval.",
            "Asset inventory and SBOM upkeep",
        ),
        statement(
            "STMT-ADV-IT-COMMITTEE",
            "ADV-ANNEX-10-AGENTIC-PLAN",
            "MIIs and other Regulated Entities shall seek guidance from their "
            "respective IT committees",
            DeonticForce.MANDATORY,
            "Obligation",
            "CONTROL_GENERATING",
            "Names the human body that must be consulted before AI-derived mitigation.",
            "IT Committee guidance",
        ),
        statement(
            "STMT-ADV-AGENTIC-PLAN",
            "ADV-ANNEX-10-AGENTIC-PLAN",
            "all REs need to prepare a long-term plan for usage of AI in detection and "
            "autonomous/agentic mitigation",
            DeonticForce.MANDATORY,
            "Obligation",
            "CONTROL_GENERATING_TIMING_UNRESOLVED",
            "A duty to plan for agentic AI, with no stated deadline. The prototype "
            "treats it exactly like any other untimed duty.",
            "Long-term agentic AI plan",
        ),
    ]


def advisory_citation(spans: List[SourceSpan], span_id: str, quote: str) -> Citation:
    span = next(item for item in spans if item.id == span_id)
    return Citation(
        document_id=span.document_id,
        span_id=span.id,
        locator=span.locator,
        quote=quote,
        source_url=span.source_url,
    )
