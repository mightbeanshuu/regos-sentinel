from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class BuildStatus(str, Enum):
    READY = "READY"
    RUNNING = "RUNNING"
    BLOCKED_AWAITING_HUMAN = "BLOCKED_AWAITING_HUMAN"
    FAILED = "FAILED"
    APPROVED = "APPROVED"


class BuildTestStatus(str, Enum):
    PASS = "PASS"
    BLOCK = "BLOCK"
    FAIL = "FAIL"


class Provenance(str, Enum):
    SOURCE_EXPLICIT = "SOURCE_EXPLICIT"
    DETERMINISTIC = "DETERMINISTIC"
    AI_SUGGESTED = "AI_SUGGESTED"
    HUMAN_POLICY = "HUMAN_POLICY"


class CoverageStatus(str, Enum):
    COMPILED = "COMPILED_OBLIGATION"
    INFORMATIONAL = "INFORMATIONAL"
    DUPLICATE = "DUPLICATE_OR_SUPERSEDED"
    OUT_OF_SCOPE = "OUT_OF_PROFILE_SCOPE"
    AMBIGUOUS = "AMBIGUOUS_REVIEW_REQUIRED"


class ReferenceStatus(str, Enum):
    UNRESOLVED = "UNRESOLVED"
    RESOLVED = "RESOLVED_HASHED"


class DeonticForce(str, Enum):
    MANDATORY = "MANDATORY"
    RECOMMENDED = "RECOMMENDED"
    PERMITTED = "PERMITTED"
    PROHIBITED = "PROHIBITED"
    DEFINITIONAL = "DEFINITIONAL"


class EvidenceStatus(str, Enum):
    CURRENT = "CURRENT"
    NEEDS_REVALIDATION = "NEEDS_REVALIDATION"


class LiveSourceStatus(str, Enum):
    VERIFIED = "LIVE_SOURCE_VERIFIED"
    CHANGED = "SOURCE_CHANGED_REVIEW_REQUIRED"
    PARTIAL = "PARTIAL_MATCH_REVIEW_REQUIRED"


class Citation(StrictModel):
    document_id: str
    span_id: str
    locator: str
    quote: str
    source_url: str


class SourceDocument(StrictModel):
    id: str
    authority: str
    title: str
    document_type: str
    published_at: str
    legal_state: str
    source_url: str
    content_hash: str
    content_hash_scope: str
    corpus_scope: str
    disclaimer: str


class SourceSpan(StrictModel):
    id: str
    document_id: str
    question: str
    locator: str
    text: str
    normative_signal: bool
    source_url: str


class LiveSourceVerificationReceipt(StrictModel):
    status: LiveSourceStatus
    source_url: str
    checked_at: str
    http_status: int
    content_type: str
    document_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    expected_document_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    hash_matches_expected: bool
    hash_scope: str
    byte_count: int = Field(ge=1)
    page_count: int = Field(ge=1)
    checked_span_count: int = Field(ge=1)
    matched_span_ids: List[str]
    missing_span_ids: List[str]
    build_input: str
    note: str


class CoverageEntry(StrictModel):
    id: str
    span_id: str
    status: CoverageStatus
    rationale: str
    obligation_ids: List[str] = Field(default_factory=list)
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None


class SourceReference(StrictModel):
    id: str
    from_span_id: str
    target_document_id: str
    target_locator: str
    relationship: str
    status: ReferenceStatus
    target_span_id: Optional[str] = None
    target_hash: Optional[str] = None
    resolution_note: Optional[str] = None


class CorpusPack(StrictModel):
    id: str
    title: str
    version: str
    published_at: str
    document_id: str
    source_url: str
    status: str
    scope_note: str
    indexed_span_count: int = Field(ge=0)
    compiled_candidate_count: int = Field(ge=0)
    content_identity_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")


class RegulatoryStatement(StrictModel):
    id: str
    span_id: str
    exact_phrase: str
    deontic_force: DeonticForce
    legalruleml_operator: str
    operational_effect: str
    classification_provenance: Provenance
    review_note: str


class RegistrationFact(StrictModel):
    registration_type: str
    cscrf_category: str
    operational: bool
    synthetic: bool = True


class EntityProfile(StrictModel):
    id: str
    legal_name: str
    entity_type: str
    cscrf_category: str
    is_qsb: bool
    environment: str
    facts_version: str
    registrations: List[RegistrationFact] = Field(default_factory=list)
    has_dormant_license: bool = False
    synthetic: bool = True


class ApplicabilityReceipt(StrictModel):
    id: str
    obligation_id: str
    applies: bool
    entity_fact: str
    rule: str
    reason: str
    provenance: Provenance
    reviewer_name: Optional[str] = None
    citation: Citation


class DeadlineRule(StrictModel):
    trigger: Optional[str] = None
    duration: int
    unit: str
    calendar_basis: str
    trigger_provenance: Optional[Provenance] = None
    duration_provenance: Provenance
    computable: bool
    blocked_reason: Optional[str] = None
    citation: Citation

    @model_validator(mode="after")
    def validate_computability(self) -> DeadlineRule:
        if self.computable:
            if self.trigger is None or self.trigger_provenance is None:
                raise ValueError("A computable deadline rule requires a trigger and provenance.")
            if self.blocked_reason is not None:
                raise ValueError("A computable deadline rule cannot have a blocked reason.")
        else:
            if self.trigger is not None or self.trigger_provenance is not None:
                raise ValueError("An uncomputable deadline rule cannot contain a trigger.")
            if not self.blocked_reason:
                raise ValueError("An uncomputable deadline rule requires a blocked reason.")
        return self


class Finding(StrictModel):
    id: str
    title: str
    severity: str
    caused_by_missing_patch: bool
    discovered_at: Optional[str] = None
    vapt_report_submitted_at: str
    system: str
    synthetic: bool = True


class DeadlineComputation(StrictModel):
    id: str
    finding_id: str
    obligation_id: str
    trigger_label: Optional[str] = None
    trigger_date: Optional[str] = None
    duration_label: str
    due_date: Optional[str] = None
    calculation_trace: List[str]
    trigger_provenance: Optional[Provenance] = None
    duration_provenance: Provenance
    computable: bool
    blocked_reason: Optional[str] = None
    human_policy_note: Optional[str] = None
    citation: Citation

    @model_validator(mode="after")
    def validate_computation_state(self) -> DeadlineComputation:
        if self.computable:
            required = (
                self.trigger_label,
                self.trigger_date,
                self.due_date,
                self.trigger_provenance,
            )
            if any(value is None for value in required):
                raise ValueError("A computable deadline requires trigger and due-date fields.")
            if self.blocked_reason is not None:
                raise ValueError("A computable deadline cannot have a blocked reason.")
        else:
            if self.due_date is not None or self.trigger_provenance is not None:
                raise ValueError(
                    "An uncomputable deadline cannot contain a due date or trigger provenance."
                )
            if not self.blocked_reason:
                raise ValueError("An uncomputable deadline requires a blocked reason.")
        if (
            self.human_policy_note is not None
            and self.trigger_provenance != Provenance.HUMAN_POLICY
        ):
            raise ValueError("Human policy notes require a persisted HUMAN_POLICY trigger.")
        return self


class PeriodicityWindow(StrictModel):
    id: str
    standard: str
    financial_year: str
    period_label: str
    period_start: str
    period_end: str
    calculation_basis: str
    provenance: Provenance
    citations: List[Citation]


class ApplicabilityScenarioReceipt(StrictModel):
    id: str
    source_span_id: str
    scenario: str
    activated: bool
    decision: str
    entity_facts: List[str]
    reason: str
    provenance: Provenance
    reviewer_name: Optional[str] = None
    reviewed_at: Optional[str] = None
    citation: Citation


class Obligation(StrictModel):
    id: str
    version: int
    actor: str
    action: str
    object: str
    condition: str
    deadline: DeadlineRule
    control_id: str
    evidence_requirements: List[str]
    field_citations: Dict[str, Citation]
    field_provenance: Dict[str, Provenance]
    applicability: ApplicabilityReceipt
    status: str
    provenance: Provenance


class Control(StrictModel):
    id: str
    version: int
    name: str
    owner: str
    rule_summary: str
    previous_rule_summary: Optional[str] = None
    status: str
    source_obligation_ids: List[str]


class VendorSLA(StrictModel):
    id: str
    vendor: str
    service: str
    committed_days: int
    advisory_reference_days: Optional[int] = None
    status: str
    synthetic: bool = True


class EvidenceItem(StrictModel):
    id: str
    name: str
    kind: str
    control_id: str
    status: EvidenceStatus
    collected_at: str
    reason: Optional[str] = None
    synthetic: bool = True


class RemediationTask(StrictModel):
    id: str
    title: str
    owner: str
    priority: str
    status: str
    due_days: int
    source_obligation_id: str
    work_type: str
    synthetic: bool = True


class BuildTest(StrictModel):
    id: str
    name: str
    status: BuildTestStatus
    message: str
    related_span_ids: List[str] = Field(default_factory=list)


class BuildImpact(StrictModel):
    controls_changed: int = 0
    vendor_sla_advisories: int = 0
    evidence_revalidation: int = 0
    tasks_created: int = 0


class BuildRun(StrictModel):
    id: str
    run_id: str
    sequence: int
    status: BuildStatus
    started_at: str
    completed_at: str
    stage: str
    headline: str
    tests: List[BuildTest]
    impact: BuildImpact
    source_version: str
    schema_version: str
    ruleset_version: str
    reviewer: Optional[str] = None


class ModelRunReceipt(StrictModel):
    provider: str
    model_id: str
    prompt_version: str
    cache_key: str = Field(pattern=r"^[a-f0-9]{64}$")
    input_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    output_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    cache_hit: bool
    output_token_limit: int = Field(ge=1, le=4096)
    generated_at: str
    extraction_scope: str


class ReviewDecision(StrictModel):
    id: str
    span_id: str
    decision: str
    selected_interpretation: str
    reason: str
    reviewer_name: str
    reviewer_role: str
    decided_at: str
    policy_inputs: Dict[str, str]
    independent_reading_id: Optional[str] = None
    reviewer_agreement: Optional[bool] = None


class ReviewerReading(StrictModel):
    id: str
    span_id: str
    reviewer_name: str
    reviewer_role: str
    independent_interpretation: str
    trigger_policy: str
    committed_at: str
    system_suggestion_revealed_at: str
    revealed_system_suggestion: str


class AuditEvent(StrictModel):
    id: str
    event_type: str
    actor: str
    created_at: str
    details: Dict[str, Any]


class Manifest(StrictModel):
    manifest_version: str
    build_id: str
    generated_at: str
    source: Dict[str, Any]
    corpus_packs: List[Dict[str, Any]] = Field(default_factory=list)
    references: List[Dict[str, Any]] = Field(default_factory=list)
    regulatory_statements: List[Dict[str, Any]] = Field(default_factory=list)
    entity_profile: Dict[str, Any]
    obligations: List[Dict[str, Any]]
    controls: List[Dict[str, Any]]
    deadline_computations: List[Dict[str, Any]] = Field(default_factory=list)
    periodicity_windows: List[Dict[str, Any]] = Field(default_factory=list)
    applicability_scenarios: List[Dict[str, Any]] = Field(default_factory=list)
    evidence: List[Dict[str, Any]]
    reviewer_readings: List[Dict[str, Any]] = Field(default_factory=list)
    reviewer: Dict[str, Any]
    test_history: List[Dict[str, Any]]
    audit_event_ids: List[str]
    reproducibility: Dict[str, Any]
    manifest_sha256: str


class BenchmarkOutcome(str, Enum):
    CORRECT = "CORRECT"
    INCORRECT = "INCORRECT"
    ABSTAINED_CORRECTLY = "ABSTAINED_CORRECTLY"
    ABSTAINED_UNNECESSARILY = "ABSTAINED_UNNECESSARILY"


class BenchmarkCase(StrictModel):
    id: str
    name: str
    expected: str
    actual: str
    status: str
    outcome: BenchmarkOutcome
    answerable_without_human_policy: bool
    answerable_with_human_policy: bool
    correct_if_forced: bool
    source_span_id: str


class BenchmarkOperatingPoint(StrictModel):
    setting: str
    policy: str
    answered: int
    total: int
    answered_pct: float
    incorrect_answers: int
    error_rate_on_answered: float
    deferred: int
    deferred_pct: float


class BenchmarkResult(StrictModel):
    run_id: str
    run_at: str
    cases: List[BenchmarkCase]
    passed: int
    failed: int
    label: str
    operating_points: List[BenchmarkOperatingPoint]


class WorkspaceState(StrictModel):
    schema_version: str
    ruleset_version: str
    source_version: str
    entity_profile: EntityProfile
    documents: List[SourceDocument]
    corpus_packs: List[CorpusPack] = Field(default_factory=list)
    source_spans: List[SourceSpan]
    coverage: List[CoverageEntry]
    references: List[SourceReference] = Field(default_factory=list)
    regulatory_statements: List[RegulatoryStatement] = Field(default_factory=list)
    findings: List[Finding] = Field(default_factory=list)
    obligations: List[Obligation]
    deadline_computations: List[DeadlineComputation] = Field(default_factory=list)
    periodicity_windows: List[PeriodicityWindow] = Field(default_factory=list)
    applicability_scenarios: List[ApplicabilityScenarioReceipt] = Field(default_factory=list)
    controls: List[Control]
    vendor_slas: List[VendorSLA]
    evidence: List[EvidenceItem]
    tasks: List[RemediationTask]
    builds: List[BuildRun]
    reviewer_readings: List[ReviewerReading] = Field(default_factory=list)
    reviews: List[ReviewDecision]
    audit_events: List[AuditEvent]
    model_run_receipt: ModelRunReceipt
    latest_manifest: Optional[Manifest] = None
    latest_benchmark: Optional[BenchmarkResult] = None


class ReviewRequest(StrictModel):
    reviewer_name: str = Field(min_length=2, max_length=80)
    reviewer_role: str = Field(default="Compliance Officer", min_length=2, max_length=80)
    reason: str = Field(min_length=8, max_length=500)
    trigger_policy: str = Field(min_length=8, max_length=200)
    trigger_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    agrees_with_system_suggestion: bool


class ReviewerReadingRequest(StrictModel):
    reviewer_name: str = Field(min_length=2, max_length=80)
    reviewer_role: str = Field(default="Compliance Officer", min_length=2, max_length=80)
    independent_interpretation: str = Field(min_length=8, max_length=800)
    trigger_policy: str = Field(min_length=8, max_length=200)


class EntityProfilePatch(StrictModel):
    is_qsb: bool
    reviewer_name: str = Field(min_length=2, max_length=80)


class ApplicabilityScenarioPatch(StrictModel):
    has_second_registration: bool
    has_dormant_license: bool
    reviewer_name: str = Field(min_length=2, max_length=80)
