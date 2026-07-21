from __future__ import annotations

import hashlib

from .model_cache import load_model_cache
from .models import (
    ApplicabilityReceipt,
    ApplicabilityScenarioReceipt,
    AuditEvent,
    Citation,
    Control,
    CorpusPack,
    CoverageEntry,
    CoverageStatus,
    DeadlineComputation,
    DeadlineRule,
    DeonticForce,
    EntityProfile,
    EvidenceItem,
    EvidenceStatus,
    Finding,
    Obligation,
    Provenance,
    ReferenceStatus,
    RegistrationFact,
    RegulatoryStatement,
    SourceDocument,
    SourceReference,
    SourceSpan,
    VendorSLA,
    WorkspaceState,
)

SOURCE_URL = "https://www.sebi.gov.in/sebi_data/faqfiles/jun-2025/1749647139924.pdf"
DOCUMENT_ID = "SEBI-CSCRF-FAQ-2025-06-11"
SCHEMA_VERSION = "obligation-schema/1.1.0"


def _span(span_id: str, question: str, locator: str, text: str, normative: bool) -> SourceSpan:
    return SourceSpan(
        id=span_id,
        document_id=DOCUMENT_ID,
        question=question,
        locator=locator,
        text=text,
        normative_signal=normative,
        source_url=SOURCE_URL,
    )


def _citation(span: SourceSpan, quote: str) -> Citation:
    return Citation(
        document_id=DOCUMENT_ID,
        span_id=span.id,
        locator=span.locator,
        quote=quote,
        source_url=SOURCE_URL,
    )


def initial_state() -> WorkspaceState:
    q14 = _span(
        "FAQ-Q14",
        "Q14 — QSB VAPT and cyber-audit periodicity",
        "FAQ dated 11 June 2025 · PDF page 8 · Q14",
        "The periodicity of VAPT and cyber audit for QSBs shall be half-yearly "
        "irrespective of the category they fall in as per CSCRF.",
        True,
    )
    q15 = _span(
        "FAQ-Q15",
        "Q15 — Third-party vulnerability closure",
        "FAQ dated 11 June 2025 · PDF page 8 · Q15",
        "The timeline for closure of vulnerabilities identified (irrespective of third-party "
        "applications or in-house) during VAPT activity is within three (3) months of "
        "submission of VAPT report. For more details, please refer Table 19 in CSCRF. REs are "
        "encouraged to include ‘VAPT finding closure’ related timelines in their SLA with "
        "third-party service providers to remain complied with CSCRF. REs may also consider "
        "compensatory controls like virtual patching as mentioned under Guideline 6 of "
        "‘CSCRF: Protect: Maintenance: Standard 3’. Further, REs may also consider virtual "
        "patching guidelines from CERT-In where OEM patches have longer period of "
        "implementation subject to the confirmation from their respective ‘IT Committees’.",
        True,
    )
    q16 = _span(
        "FAQ-Q16",
        "Q16 — VAPT reporting format",
        "FAQ dated 11 June 2025 · PDF pages 8–9 · Q16",
        "Please refer Section 4.3. ‘VAPT’ under ‘CSCRF Compliance, Audit Report Submission, "
        "and Timelines’ in CSCRF. It mentions VAPT related reporting, periodicity, and "
        "timelines. Further, the reporting format shall be as per CSCRF: Annexure-A.",
        True,
    )
    q17a = _span(
        "FAQ-Q17-A",
        "Q17(a) — High-severity missing-patch findings",
        "FAQ dated 11 June 2025 · printed p.8 · PDF page 9 · Q17(a)",
        "Vulnerabilities identified due to non-implementation of patches and falling under "
        "‘high’ severity would be validated for non-compliances against the patch management "
        "timelines (1 week; please refer standard PR.MA.S3 and the corresponding guidelines "
        "specified under PR.MA: Guidelines in Part II of CSCRF).",
        True,
    )
    q17b = _span(
        "FAQ-Q17-B",
        "Q17(b) — Other VAPT observations",
        "FAQ dated 11 June 2025 · printed p.8 · PDF page 9 · Q17(b)",
        "Other vulnerabilities observations apart from implementation of patches shall be "
        "validated for non-closure against the VAPT observation closure timelines (3 months). "
        "However, even for the closure of such findings, graded approach (based on the "
        "criticality) shall be followed.",
        True,
    )
    q20 = _span(
        "FAQ-Q20",
        "Q20 — Financial-year basis for CSCRF periodicities",
        "FAQ dated 11 June 2025 · PDF page 9 · Q20",
        "All the periodicities mentioned in the CSCRF are based on financial year.",
        True,
    )
    q24 = _span(
        "FAQ-Q24",
        "Q24 — Multiple SEBI registrations",
        "FAQ dated 11 June 2025 · PDF page 10 · Q24",
        "In case an RE is registered under more than one category of REs, then the "
        "provision of highest category under which such an RE falls shall be applicable "
        "to that RE.",
        True,
    )
    q25 = _span(
        "FAQ-Q25",
        "Q25 — Registered but non-operational service",
        "FAQ dated 11 June 2025 · PDF page 11 · Q25",
        "The provisions of the circulars are applicable to all those intermediaries who "
        "are registered with SEBI in the capacity of intermediary. Whether the services "
        "of the intermediaries are operational or not it is their business decisions, "
        "the provision may continue to apply.",
        True,
    )
    disclaimer = _span(
        "FAQ-PREFACE-4",
        "Preface — guidance status",
        "FAQ dated 11 June 2025 · PDF page 2 · Preface ¶4",
        "These FAQs are in the nature of providing guidance on the Cybersecurity and Cyber "
        "Resilience Framework (CSCRF) for SEBI Regulated Entities (REs), and any explanation/"
        "clarification provided herein should neither be regarded as an interpretation of "
        "CSCRF nor be treated as a binding opinion/decision of the Securities and Exchange "
        "Board of India.",
        False,
    )
    spans = [disclaimer, q14, q15, q16, q17a, q17b, q20, q24, q25]
    model_run_receipt, _ = load_model_cache(spans)
    excerpt_hash = hashlib.sha256("\n".join(span.text for span in spans).encode()).hexdigest()

    document = SourceDocument(
        id=DOCUMENT_ID,
        authority="Securities and Exchange Board of India",
        title="FAQs on CSCRF for SEBI REs and Framework for Adoption of Cloud Services",
        document_type="Official FAQ / guidance",
        published_at="2025-06-11",
        legal_state="GUIDANCE — READ WITH CSCRF",
        source_url=SOURCE_URL,
        content_hash=excerpt_hash,
        content_hash_scope="SHA-256 OF HUMAN-VERIFIED DEMO EXCERPTS, NOT THE FULL PDF",
        corpus_scope=("Nine human-verified spans used for the Q14–Q25 prototype scenarios"),
        disclaimer=(
            "Prototype output must be read with the governing Acts, Regulations and Circulars. "
            "It is decision support, not legal advice or an automated compliance conclusion."
        ),
    )

    q15_citation = _citation(q15, "within three (3) months of submission of VAPT report")
    q17_citation = _citation(q17a, "patch management timelines (1 week)")
    base_applicability = ApplicabilityReceipt(
        id="APR-VAPT-BASE-001",
        obligation_id="OBL-VAPT-BASE-001",
        applies=True,
        entity_fact="entity_type=STOCK_BROKER",
        rule="SEBI RE + VAPT finding",
        reason="The synthetic profile is a SEBI-regulated stock broker with VAPT findings.",
        provenance=Provenance.DETERMINISTIC,
        citation=q15_citation,
    )
    base_obligation = Obligation(
        id="OBL-VAPT-BASE-001",
        version=1,
        actor="SEBI-regulated entity",
        action="close",
        object="VAPT vulnerabilities",
        condition="all VAPT findings, without a missing-patch severity branch",
        deadline=DeadlineRule(
            trigger="VAPT report submission",
            duration=3,
            unit="months",
            calendar_basis="calendar months",
            trigger_provenance=Provenance.SOURCE_EXPLICIT,
            duration_provenance=Provenance.SOURCE_EXPLICIT,
            computable=True,
            citation=q15_citation,
        ),
        control_id="CTRL-VAPT-07",
        evidence_requirements=["VAPT report", "Closure proof"],
        field_citations={
            "actor": q15_citation,
            "action": q15_citation,
            "object": q15_citation,
            "deadline": q15_citation,
        },
        field_provenance={
            "actor": Provenance.SOURCE_EXPLICIT,
            "action": Provenance.SOURCE_EXPLICIT,
            "object": Provenance.SOURCE_EXPLICIT,
            "condition": Provenance.DETERMINISTIC,
            "trigger": Provenance.SOURCE_EXPLICIT,
            "duration": Provenance.SOURCE_EXPLICIT,
        },
        applicability=base_applicability,
        status="ACTIVE — SUPERSEDED AFTER REVIEW",
        provenance=Provenance.AI_SUGGESTED,
    )
    blocked_patch_applicability = ApplicabilityReceipt(
        id="APR-PATCH-HIGH-CANDIDATE",
        obligation_id="OBL-PATCH-HIGH-CANDIDATE",
        applies=True,
        entity_fact=(
            "entity_type=STOCK_BROKER; finding_severity=HIGH; "
            "caused_by_missing_patch=true; synthetic=true"
        ),
        rule="SEBI RE + high severity + non-implementation of patch",
        reason="The source states a duration but the trigger field is absent.",
        provenance=Provenance.DETERMINISTIC,
        citation=q17_citation,
    )
    blocked_patch_obligation = Obligation(
        id="OBL-PATCH-HIGH-CANDIDATE",
        version=1,
        actor="SEBI-regulated entity",
        action="remediate",
        object="high-severity vulnerability caused by non-implementation of a patch",
        condition="severity=HIGH and caused_by_missing_patch=true",
        deadline=DeadlineRule(
            duration=1,
            unit="week",
            calendar_basis="calendar basis unresolved until trigger is supplied",
            duration_provenance=Provenance.SOURCE_EXPLICIT,
            computable=False,
            blocked_reason="trigger not stated in source",
            citation=q17_citation,
        ),
        control_id="CTRL-VAPT-07",
        evidence_requirements=[],
        field_citations={
            "actor": q17_citation,
            "action": q17_citation,
            "object": q17_citation,
            "condition": q17_citation,
            "deadline": q17_citation,
        },
        field_provenance={
            "actor": Provenance.SOURCE_EXPLICIT,
            "action": Provenance.SOURCE_EXPLICIT,
            "object": Provenance.SOURCE_EXPLICIT,
            "condition": Provenance.DETERMINISTIC,
            "duration": Provenance.SOURCE_EXPLICIT,
        },
        applicability=blocked_patch_applicability,
        status="BLOCKED_INCOMPLETE_RULE",
        provenance=Provenance.AI_SUGGESTED,
    )

    now = "2026-07-22T00:00:00Z"
    return WorkspaceState(
        schema_version=SCHEMA_VERSION,
        ruleset_version="cscrf-demo-rules/1.0.0",
        source_version="cscrf-faq/2025-06-11-excerpt-v1",
        entity_profile=EntityProfile(
            id="ENT-ASTER-001",
            legal_name="Aster Securities Pvt Ltd",
            entity_type="STOCK_BROKER",
            cscrf_category="SMALL-SIZE RE",
            is_qsb=False,
            environment="SYNTHETIC DEMO PROFILE",
            facts_version="entity-facts/1",
            registrations=[
                RegistrationFact(
                    registration_type="STOCK_BROKER",
                    cscrf_category="SMALL-SIZE RE",
                    operational=True,
                )
            ],
            has_dormant_license=False,
        ),
        documents=[document],
        corpus_packs=[
            CorpusPack(
                id="PACK-CSCRF-FAQ-HERO",
                title="CSCRF FAQ · human-verified prototype scope",
                version="2025-06-11-excerpt-v1",
                published_at="2025-06-11",
                document_id=DOCUMENT_ID,
                source_url=SOURCE_URL,
                status="HERO_SCOPE_ACTIVE",
                scope_note=(
                    "Nine pinned spans support the Q14–Q25 demo scenarios; the pack does not "
                    "represent the entire FAQ."
                ),
                indexed_span_count=9,
                compiled_candidate_count=2,
                content_identity_sha256=excerpt_hash,
            ),
            CorpusPack(
                id="PACK-STOCK-BROKER-MC-2025",
                title="Master Circular for Stock Brokers",
                version="SEBI/HO/MIRSD/MIRSD-PoD/P/CIR/2025/90",
                published_at="2025-06-17",
                document_id="SEBI-STOCK-BROKER-MC-2025-90",
                source_url=(
                    "https://www.sebi.gov.in/legal/master-circulars/jun-2025/"
                    "master-circular-for-stock-brokers_94623.html"
                ),
                status="SOURCE_REGISTERED_NOT_COMPILED",
                scope_note=(
                    "Version-pinned expansion target. Source identity is registered, while zero "
                    "spans or obligations are presented as processed in this prototype."
                ),
                indexed_span_count=0,
                compiled_candidate_count=0,
                content_identity_sha256=hashlib.sha256(
                    b"SEBI/HO/MIRSD/MIRSD-PoD/P/CIR/2025/90|2025-06-17|"
                    b"https://www.sebi.gov.in/legal/master-circulars/jun-2025/"
                    b"master-circular-for-stock-brokers_94623.html"
                ).hexdigest(),
            ),
        ],
        source_spans=spans,
        coverage=[
            CoverageEntry(
                id="COV-PREFACE-4",
                span_id=disclaimer.id,
                status=CoverageStatus.INFORMATIONAL,
                rationale="Legal-status caution retained as release context.",
            ),
            CoverageEntry(
                id="COV-Q14",
                span_id=q14.id,
                status=CoverageStatus.OUT_OF_SCOPE,
                rationale=(
                    "Profile is non-QSB; receipt is retained and recomputed if the fact changes."
                ),
            ),
            CoverageEntry(
                id="COV-Q15",
                span_id=q15.id,
                status=CoverageStatus.COMPILED,
                rationale="Compiled into the generic three-month VAPT closure obligation.",
                obligation_ids=[base_obligation.id],
            ),
            CoverageEntry(
                id="COV-Q16",
                span_id=q16.id,
                status=CoverageStatus.COMPILED,
                rationale=(
                    "The reporting-format dependency is tracked for evidence-schema mapping; "
                    "the prototype performs no regulatory filing."
                ),
            ),
            CoverageEntry(
                id="COV-Q17-A",
                span_id=q17a.id,
                status=CoverageStatus.AMBIGUOUS,
                rationale=(
                    "A one-week cross-reference conflicts with the current generic "
                    "three-month control."
                ),
            ),
            CoverageEntry(
                id="COV-Q17-B",
                span_id=q17b.id,
                status=CoverageStatus.AMBIGUOUS,
                rationale="The exception branch must be reviewed with Q17(a) before publication.",
            ),
            CoverageEntry(
                id="COV-Q20",
                span_id=q20.id,
                status=CoverageStatus.COMPILED,
                rationale="Compiled as the financial-year calendar basis for periodicity rules.",
            ),
            CoverageEntry(
                id="COV-Q24",
                span_id=q24.id,
                status=CoverageStatus.OUT_OF_SCOPE,
                rationale="Current synthetic profile holds one SEBI registration.",
            ),
            CoverageEntry(
                id="COV-Q25",
                span_id=q25.id,
                status=CoverageStatus.OUT_OF_SCOPE,
                rationale="Current synthetic profile has no dormant licensed service.",
            ),
        ],
        references=[
            SourceReference(
                id="REF-Q15-TABLE-19",
                from_span_id=q15.id,
                target_document_id="SEBI-CSCRF-2024-113",
                target_locator="CSCRF Part I · PDF page 49 · Table 19",
                relationship="READ_WITH",
                status=ReferenceStatus.UNRESOLVED,
                resolution_note=(
                    "Q15 explicitly points to Table 19 for the VAPT submission and closure "
                    "timeline."
                ),
            ),
            SourceReference(
                id="REF-Q15-GUIDELINE-6",
                from_span_id=q15.id,
                target_document_id="SEBI-CSCRF-2024-113",
                target_locator="CSCRF Part II · PDF page 116 · PR.MA Guideline 6",
                relationship="READ_WITH",
                status=ReferenceStatus.UNRESOLVED,
                resolution_note=(
                    "Q15 explicitly points to the virtual-patching guidance under PR.MA.S3."
                ),
            ),
            SourceReference(
                id="REF-Q16-ANNEXURE-A",
                from_span_id=q16.id,
                target_document_id="SEBI-CSCRF-2024-113",
                target_locator="CSCRF Part III · PDF pages 133–141 · Annexure-A",
                relationship="FORMAT_DEFINED_BY",
                status=ReferenceStatus.UNRESOLVED,
                resolution_note="Q16 states that the VAPT reporting format is Annexure-A.",
            ),
            SourceReference(
                id="REF-Q17-PR-MA-S3",
                from_span_id=q17a.id,
                target_document_id="SEBI-CSCRF-2024-113",
                target_locator="CSCRF Part II · PDF pages 116–117 · PR.MA.S3",
                relationship="READ_WITH",
                status=ReferenceStatus.UNRESOLVED,
                resolution_note=(
                    "Q17(a) explicitly points to PR.MA.S3; the dependency must be ingested "
                    "before publication."
                ),
            )
        ],
        regulatory_statements=[
            RegulatoryStatement(
                id="STMT-Q15-REQUIREMENT",
                span_id=q15.id,
                exact_phrase="is within three (3) months of submission of VAPT report",
                deontic_force=DeonticForce.MANDATORY,
                legalruleml_operator="Obligation",
                operational_effect="CONTROL_GENERATING",
                classification_provenance=Provenance.DETERMINISTIC,
                review_note=(
                    "Requirement-equivalent timeline language; exact force remains reviewable."
                ),
            ),
            RegulatoryStatement(
                id="STMT-Q15-SLA-ADVISORY",
                span_id=q15.id,
                exact_phrase=(
                    "REs are encouraged to include ‘VAPT finding closure’ related timelines"
                ),
                deontic_force=DeonticForce.RECOMMENDED,
                legalruleml_operator="Recommendation",
                operational_effect="ADVISORY_ONLY_NO_COMPLIANCE_FAILURE",
                classification_provenance=Provenance.DETERMINISTIC,
                review_note="Encouragement must not be promoted to a mandatory control.",
            ),
            RegulatoryStatement(
                id="STMT-Q15-VIRTUAL-PATCH",
                span_id=q15.id,
                exact_phrase="REs may also consider compensatory controls like virtual patching",
                deontic_force=DeonticForce.PERMITTED,
                legalruleml_operator="Permission",
                operational_effect="OPTION_RECORDED_NO_TASK",
                classification_provenance=Provenance.DETERMINISTIC,
                review_note="A permission is retained without creating mandatory work.",
            ),
            RegulatoryStatement(
                id="STMT-Q17-A-REQUIREMENT",
                span_id=q17a.id,
                exact_phrase=(
                    "would be validated for non-compliances against the patch management timelines"
                ),
                deontic_force=DeonticForce.MANDATORY,
                legalruleml_operator="Obligation",
                operational_effect="CONTROL_GENERATING_AFTER_REFERENCE_CLOSURE",
                classification_provenance=Provenance.DETERMINISTIC,
                review_note=(
                    "Duration is explicit; clock-start remains unresolved in this FAQ span."
                ),
            ),
            RegulatoryStatement(
                id="STMT-Q17-B-REQUIREMENT",
                span_id=q17b.id,
                exact_phrase=(
                    "shall be validated for non-closure against the VAPT observation closure "
                    "timelines"
                ),
                deontic_force=DeonticForce.MANDATORY,
                legalruleml_operator="Obligation",
                operational_effect="CONTROL_GENERATING",
                classification_provenance=Provenance.DETERMINISTIC,
                review_note="Retains the three-month branch for other VAPT observations.",
            ),
            RegulatoryStatement(
                id="STMT-Q20-FY-BASIS",
                span_id=q20.id,
                exact_phrase=(
                    "All the periodicities mentioned in the CSCRF are based on financial year"
                ),
                deontic_force=DeonticForce.DEFINITIONAL,
                legalruleml_operator="ConstitutiveStatement",
                operational_effect="CALENDAR_BASIS_FINANCIAL_YEAR",
                classification_provenance=Provenance.DETERMINISTIC,
                review_note="Defines calendar semantics; it does not create a standalone task.",
            ),
            RegulatoryStatement(
                id="STMT-Q24-HIGHEST-CATEGORY",
                span_id=q24.id,
                exact_phrase=(
                    "the provision of highest category under which such an RE falls shall "
                    "be applicable"
                ),
                deontic_force=DeonticForce.MANDATORY,
                legalruleml_operator="Obligation",
                operational_effect="APPLICABILITY_HIGHEST_CATEGORY",
                classification_provenance=Provenance.DETERMINISTIC,
                review_note="Activated when entity facts contain multiple registrations.",
            ),
            RegulatoryStatement(
                id="STMT-Q25-DORMANT-LICENCE",
                span_id=q25.id,
                exact_phrase="applicable to all those intermediaries who are registered with SEBI",
                deontic_force=DeonticForce.MANDATORY,
                legalruleml_operator="Obligation",
                operational_effect="APPLICABILITY_NOT_REMOVED_BY_NON_OPERATION",
                classification_provenance=Provenance.DETERMINISTIC,
                review_note="The receipt retains the FAQ's softer ‘may continue’ wording.",
            ),
        ],
        findings=[
            Finding(
                id="F-001",
                title="API gateway OEM security patch not implemented",
                severity="HIGH",
                caused_by_missing_patch=True,
                discovered_at="2026-07-22",
                vapt_report_submitted_at="2026-07-20",
                system="Internet-facing API gateway",
            ),
            Finding(
                id="F-002",
                title="Administrative console security misconfiguration",
                severity="HIGH",
                caused_by_missing_patch=False,
                discovered_at="2026-07-18",
                vapt_report_submitted_at="2026-07-20",
                system="Broker operations console",
            ),
        ],
        obligations=[base_obligation, blocked_patch_obligation],
        deadline_computations=[
            DeadlineComputation(
                id="DLC-PATCH-001",
                finding_id="F-001",
                obligation_id=blocked_patch_obligation.id,
                duration_label="1 week",
                calculation_trace=[
                    "1 week · SOURCE_EXPLICIT · FAQ Q17(a)",
                    "clock-start · absent from the cited source set",
                    "due date · cannot compute",
                ],
                duration_provenance=Provenance.SOURCE_EXPLICIT,
                computable=False,
                blocked_reason="trigger not stated in source",
                citation=q17_citation,
            )
        ],
        periodicity_windows=[],
        applicability_scenarios=[
            ApplicabilityScenarioReceipt(
                id="APP-Q24-MULTI-REG",
                source_span_id=q24.id,
                scenario="Multiple SEBI registrations use the highest applicable category",
                activated=False,
                decision="NOT_ACTIVATED_SINGLE_REGISTRATION",
                entity_facts=["registrations=1", "highest_category=SMALL-SIZE RE"],
                reason="The current synthetic profile has a single SEBI registration.",
                provenance=Provenance.DETERMINISTIC,
                citation=_citation(
                    q24,
                    "the provision of highest category under which such an RE falls shall "
                    "be applicable",
                ),
            ),
            ApplicabilityScenarioReceipt(
                id="APP-Q25-DORMANT-LICENCE",
                source_span_id=q25.id,
                scenario="A registered but non-operational service remains in scope",
                activated=False,
                decision="NOT_ACTIVATED_NO_DORMANT_LICENCE",
                entity_facts=["has_dormant_license=false"],
                reason="The current synthetic profile has no dormant licensed service.",
                provenance=Provenance.DETERMINISTIC,
                citation=_citation(
                    q25,
                    "applicable to all those intermediaries who are registered with SEBI",
                ),
            ),
        ],
        controls=[
            Control(
                id="CTRL-VAPT-07",
                version=1,
                name="VAPT finding closure",
                owner="Cybersecurity Lead",
                rule_summary="All VAPT findings close within three months of report submission.",
                status="ACTIVE — REVIEW REQUIRED",
                source_obligation_ids=[base_obligation.id],
            )
        ],
        vendor_slas=[
            VendorSLA(
                id="SLA-NIMBUS-001",
                vendor="Nimbus Application Services",
                service="Critical application patching support",
                committed_days=30,
                status="NOT_EVALUATED",
            )
        ],
        evidence=[
            EvidenceItem(
                id="EVD-VAPT-REGISTER-001",
                name="vapt_register_q1.csv",
                kind="Synthetic VAPT finding register metadata",
                control_id="CTRL-VAPT-07",
                status=EvidenceStatus.CURRENT,
                collected_at="2026-07-20T10:00:00Z",
            ),
            EvidenceItem(
                id="EVD-VENDOR-SLA-001",
                name="vendor_sla.pdf",
                kind="Synthetic vendor SLA metadata",
                control_id="CTRL-VAPT-07",
                status=EvidenceStatus.CURRENT,
                collected_at="2026-07-10T08:15:00Z",
            ),
            EvidenceItem(
                id="EVD-PATCH-POLICY-001",
                name="patch_policy_v1.pdf",
                kind="Approved policy metadata",
                control_id="CTRL-VAPT-07",
                status=EvidenceStatus.CURRENT,
                collected_at="2026-07-15T09:30:00Z",
            )
        ],
        tasks=[],
        builds=[],
        reviews=[],
        audit_events=[
            AuditEvent(
                id="AUD-0001",
                event_type="DEMO_WORKSPACE_CREATED",
                actor="system",
                created_at=now,
                details={
                    "source": DOCUMENT_ID,
                    "profile": "SYNTHETIC",
                    "evidence": "SYNTHETIC_METADATA_ONLY",
                },
            )
        ],
        model_run_receipt=model_run_receipt,
    )
