export type BuildStatus = "READY" | "BLOCKED_AWAITING_HUMAN" | "FAILED" | "APPROVED";

/** The four-value provenance vocabulary. Never a compound string. */
export type Provenance =
  | "SOURCE_EXPLICIT"
  | "DETERMINISTIC"
  | "AI_SUGGESTED"
  | "HUMAN_POLICY";

export interface Citation {
  document_id: string;
  span_id: string;
  locator: string;
  quote: string;
  source_url: string;
}

export interface SourceDocument {
  id: string;
  authority: string;
  title: string;
  document_type: string;
  published_at: string;
  legal_state: string;
  source_url: string;
  content_hash: string;
  content_hash_scope: string;
  corpus_scope: string;
  disclaimer: string;
}

export interface SourceSpan {
  id: string;
  document_id: string;
  question: string;
  locator: string;
  text: string;
  normative_signal: boolean;
  source_url: string;
  subject_key: string;
}

export interface LiveSourceVerificationReceipt {
  status: "LIVE_SOURCE_VERIFIED" | "SOURCE_CHANGED_REVIEW_REQUIRED" | "PARTIAL_MATCH_REVIEW_REQUIRED";
  source_url: string;
  checked_at: string;
  http_status: number;
  content_type: string;
  document_sha256: string;
  expected_document_sha256: string;
  hash_matches_expected: boolean;
  hash_scope: string;
  byte_count: number;
  page_count: number;
  checked_span_count: number;
  matched_span_ids: string[];
  missing_span_ids: string[];
  build_input: string;
  note: string;
}

export interface CoverageEntry {
  id: string;
  span_id: string;
  status:
    | "COMPILED_OBLIGATION"
    | "INFORMATIONAL"
    | "DUPLICATE_OR_SUPERSEDED"
    | "OUT_OF_PROFILE_SCOPE"
    | "AMBIGUOUS_REVIEW_REQUIRED";
  rationale: string;
  obligation_ids: string[];
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface DeadlineRule {
  trigger: string | null;
  duration: number;
  unit: string;
  calendar_basis: string;
  trigger_provenance: "SOURCE_EXPLICIT" | "DETERMINISTIC" | "AI_SUGGESTED" | "HUMAN_POLICY" | null;
  duration_provenance: "SOURCE_EXPLICIT" | "DETERMINISTIC" | "AI_SUGGESTED" | "HUMAN_POLICY";
  computable: boolean;
  blocked_reason: string | null;
  citation: Citation;
}

export interface Obligation {
  id: string;
  version: number;
  actor: string;
  action: string;
  object: string;
  condition: string;
  deadline: DeadlineRule;
  control_id: string;
  evidence_requirements: string[];
  field_citations: Record<string, Citation>;
  field_provenance: Record<string, "SOURCE_EXPLICIT" | "DETERMINISTIC" | "AI_SUGGESTED" | "HUMAN_POLICY">;
  applicability: {
    id: string;
    applies: boolean;
    entity_fact: string;
    rule: string;
    reason: string;
    provenance: string;
    citation: Citation;
  };
  status: string;
  provenance: string;
}

export interface Control {
  id: string;
  version: number;
  name: string;
  owner: string;
  rule_summary: string;
  previous_rule_summary: string | null;
  status: string;
  source_obligation_ids: string[];
}

export interface BuildTest {
  id: string;
  name: string;
  status: "PASS" | "BLOCK" | "FAIL";
  message: string;
  related_span_ids: string[];
}

export interface BuildRun {
  id: string;
  run_id: string;
  sequence: number;
  status: "BLOCKED_AWAITING_HUMAN" | "FAILED" | "APPROVED";
  started_at: string;
  completed_at: string;
  stage: string;
  headline: string;
  tests: BuildTest[];
  impact: {
    controls_changed: number;
    vendor_sla_advisories: number;
    evidence_revalidation: number;
    tasks_created: number;
  };
  source_version: string;
  schema_version: string;
  ruleset_version: string;
  reviewer: string | null;
}

export interface WorkspaceState {
  schema_version: string;
  ruleset_version: string;
  source_version: string;
  entity_profile: {
    id: string;
    legal_name: string;
    entity_type: string;
    cscrf_category: string;
    is_qsb: boolean;
    environment: string;
    facts_version: string;
    registrations: Array<{
      registration_type: string;
      cscrf_category: string;
      operational: boolean;
      synthetic: boolean;
    }>;
    has_dormant_license: boolean;
    synthetic: boolean;
  };
  documents: SourceDocument[];
  corpus_packs: Array<{
    id: string;
    title: string;
    version: string;
    published_at: string;
    document_id: string;
    source_url: string;
    status: CorpusState;
    scope_note: string;
    indexed_span_count: number;
    compiled_candidate_count: number;
    content_identity_sha256: string;
    authority: string;
    legal_state: string;
    extraction_scope: string;
    source_span_ids: string[];
    validation_tests: string[];
  }>;
  source_spans: SourceSpan[];
  coverage: CoverageEntry[];
  references: Array<{
    id: string;
    from_span_id: string;
    target_document_id: string;
    target_locator: string;
    relationship: string;
    status: "UNRESOLVED" | "RESOLVED_HASHED";
    target_span_id: string | null;
    target_hash: string | null;
    resolution_note: string | null;
  }>;
  regulatory_statements: Array<{
    id: string;
    span_id: string;
    exact_phrase: string;
    deontic_force: "MANDATORY" | "RECOMMENDED" | "PERMITTED" | "PROHIBITED" | "DEFINITIONAL";
    legalruleml_operator: string;
    operational_effect: string;
    classification_provenance: string;
    review_note: string;
    subject: string;
    subject_key: string;
  }>;
  findings: Array<{
    id: string;
    title: string;
    severity: string;
    caused_by_missing_patch: boolean;
    discovered_at: string | null;
    vapt_report_submitted_at: string;
    system: string;
    synthetic: boolean;
  }>;
  obligations: Obligation[];
  deadline_computations: Array<{
    id: string;
    finding_id: string;
    obligation_id: string;
    trigger_label: string | null;
    trigger_date: string | null;
    duration_label: string;
    due_date: string | null;
    calculation_trace: string[];
    trigger_provenance: "SOURCE_EXPLICIT" | "DETERMINISTIC" | "AI_SUGGESTED" | "HUMAN_POLICY" | null;
    duration_provenance: "SOURCE_EXPLICIT" | "DETERMINISTIC" | "AI_SUGGESTED" | "HUMAN_POLICY";
    computable: boolean;
    blocked_reason: string | null;
    human_policy_note: string | null;
    citation: Citation;
  }>;
  periodicity_windows: Array<{
    id: string;
    standard: string;
    financial_year: string;
    period_label: string;
    period_start: string;
    period_end: string;
    calculation_basis: string;
    provenance: string;
    citations: Citation[];
  }>;
  applicability_scenarios: Array<{
    id: string;
    source_span_id: string;
    scenario: string;
    activated: boolean;
    decision: string;
    entity_facts: string[];
    reason: string;
    provenance: string;
    reviewer_name: string | null;
    reviewed_at: string | null;
    citation: Citation;
  }>;
  controls: Control[];
  vendor_slas: Array<{
    id: string;
    vendor: string;
    service: string;
    committed_days: number;
    advisory_reference_days: number | null;
    status: string;
    synthetic: boolean;
  }>;
  evidence: Array<{
    id: string;
    name: string;
    kind: string;
    control_id: string;
    status: string;
    collected_at: string;
    reason: string | null;
    synthetic: boolean;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    owner: string;
    priority: string;
    status: string;
    due_days: number;
    source_obligation_id: string;
    work_type: string;
    synthetic: boolean;
  }>;
  builds: BuildRun[];
  reviewer_readings: Array<{
    id: string;
    span_id: string;
    reviewer_name: string;
    reviewer_role: string;
    independent_interpretation: string;
    trigger_policy: string;
    committed_at: string;
    system_suggestion_revealed_at: string;
    revealed_system_suggestion: string;
  }>;
  reviews: Array<{
    id: string;
    span_id: string;
    decision: string;
    selected_interpretation: string;
    reason: string;
    reviewer_name: string;
    reviewer_role: string;
    decided_at: string;
    policy_inputs: Record<string, string>;
    independent_reading_id: string | null;
    reviewer_agreement: boolean | null;
  }>;
  audit_events: Array<{
    id: string;
    event_type: string;
    actor: string;
    created_at: string;
    details: Record<string, unknown>;
  }>;
  model_run_receipt: {
    provider: string;
    model_id: string;
    prompt_version: string;
    cache_key: string;
    input_sha256: string;
    output_sha256: string;
    cache_hit: boolean;
    output_token_limit: number;
    generated_at: string;
    extraction_scope: string;
  };
  latest_manifest: {
    build_id: string;
    manifest_sha256: string;
    reproducibility: { replay_input_sha256: string };
  } | null;
  latest_benchmark: {
    run_id: string;
    run_at: string;
    passed: number;
    failed: number;
    label: string;
    cases: Array<{
      id: string;
      name: string;
      expected: string;
      actual: string;
      status: "PASS" | "FAIL";
      outcome: "CORRECT" | "INCORRECT" | "ABSTAINED_CORRECTLY" | "ABSTAINED_UNNECESSARILY";
      answerable_without_human_policy: boolean;
      answerable_with_human_policy: boolean;
      correct_if_forced: boolean;
      source_span_id: string;
    }>;
    operating_points: Array<{
      setting: string;
      policy: string;
      answered: number;
      total: number;
      answered_pct: number;
      incorrect_answers: number;
      error_rate_on_answered: number;
      deferred: number;
      deferred_pct: number;
    }>;
  } | null;
  scenario_outcomes: ScenarioOutcome[];
}

// --------------------------------------------------------------------------
// Review your document — a bounded, session-private lane for a user PDF.
// --------------------------------------------------------------------------

export type PassageClass =
  | "POSSIBLE_REQUIREMENT"
  | "RECOMMENDATION"
  | "PERMISSION"
  | "BACKGROUND"
  | "DUPLICATE_OR_SUPERSEDED"
  | "NEEDS_REVIEW";

export type DocumentState =
  | "ADDED"
  | "READING_DOCUMENT"
  | "READY_FOR_REVIEW"
  | "NEEDS_REVIEW"
  | "READY_FOR_APPROVAL"
  | "APPROVED"
  | "COULD_NOT_READ_DOCUMENT";

export interface ExtractedPassage {
  id: string;
  page: number;
  ordinal: number;
  locator: string;
  text: string;
  classification: PassageClass;
  classification_provenance: Provenance;
  matched_cues: string[];
  rationale: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface DraftRequirement {
  id: string;
  passage_id: string;
  locator: string;
  quote: string;
  actor: string;
  action: string;
  obligation_object: string;
  duration_value: number | null;
  duration_unit: string | null;
  trigger: string | null;
  trigger_provenance: Provenance | null;
  computable: boolean;
  blocked_reason: string | null;
  reviewer_name: string;
  reviewer_role: string;
  reason: string;
  approved_at: string;
  provenance: Provenance;
}

export interface DocumentScope {
  page_count: number;
  pages_read: number;
  pages_unreadable: number[];
  passages_reviewed: number;
  possible_requirements: number;
  recommendations_not_converted: number;
  permissions_not_converted: number;
  background: number;
  duplicates: number;
  passages_needing_review: number;
}

export interface UploadedDocument {
  id: string;
  filename: string;
  uploaded_at: string;
  byte_count: number;
  sha256: string;
  state: DocumentState;
  authority_label: string;
  authority_provenance: string;
  extraction_mode: string;
  passages: ExtractedPassage[];
  requirements: DraftRequirement[];
  scope: DocumentScope;
  limitations: string[];
  disclaimer: string;
}

export interface DocumentLimits {
  accepted_types: string[];
  max_bytes: number;
  max_pages: number;
  ocr_available: boolean;
  model_extraction_available: boolean;
  retention: string;
}

// --------------------------------------------------------------------------
// Demonstration scenarios A–D
//
// Four cases from the reviewed prototype corpus. Case A is the guided review and
// stays the default path; B, C and D each add a kind of regulatory problem that
// A alone cannot show.
// --------------------------------------------------------------------------

export type ScenarioId =
  | "A_MISSING_TRIGGER"
  | "B_ADVISORY_LANGUAGE"
  | "C_APPLICABILITY"
  | "D_SOURCE_CHANGE";

export type ScenarioStatus =
  | "SCENARIO_NOT_RUN"
  | "SCENARIO_DEMONSTRATED"
  | "SCENARIO_UNEXPECTED_RESULT";

export type DeonticForce =
  | "MANDATORY"
  | "RECOMMENDED"
  | "PERMITTED"
  | "PROHIBITED"
  | "DEFINITIONAL";

export interface ScenarioDefinition {
  id: ScenarioId;
  label: string;
  title: string;
  question: string;
  citation_locator: string;
  citation_quote: string;
  expected_outcome: string;
  seeded_data: string;
  automated_test: string;
  reset_note: string;
  guided: boolean;
}

export interface ScenarioCheck {
  id: string;
  question: string;
  expected: string;
  observed: string;
  passed: boolean;
}

export interface ApplicabilityDecision {
  id: string;
  subject: string;
  applies: boolean;
  entity_fact: string;
  rule: string;
  reason: string;
  provenance: Provenance;
  citation: Citation;
}

export type SourceChangeKind = "ADDED" | "CHANGED" | "SUPERSEDED" | "UNCHANGED";

export interface SourceChange {
  id: string;
  kind: SourceChangeKind;
  subject: string;
  subject_key: string;
  before_locator: string | null;
  before_quote: string | null;
  before_strength: DeonticForce | null;
  after_locator: string | null;
  after_quote: string | null;
  after_strength: DeonticForce | null;
  impact_summary: string;
  impacted_control_ids: string[];
  evidence_ids_for_review: string[];
  creates_mandatory_work: boolean;
  review_required: boolean;
  applied_automatically: boolean;
  provenance: Provenance;
  note: string;
}

export interface SourceRevision {
  id: string;
  from_version: string;
  to_version: string;
  authority: string;
  legal_state: string;
  scope_note: string;
  disclaimer: string;
  base_content_sha256: string;
  revision_content_sha256: string;
  synthetic: boolean;
}

export interface ScenarioOutcome {
  scenario_id: ScenarioId;
  status: ScenarioStatus;
  phase: string;
  headline: string;
  checks: ScenarioCheck[];
  facts: string[];
  citations: Citation[];
  applicability_decisions: ApplicabilityDecision[];
  source_revision: SourceRevision | null;
  source_changes: SourceChange[];
  ran_at: string;
  provenance: Provenance;
}

export interface ScenarioCatalogue {
  label: string;
  note: string;
  scenarios: ScenarioDefinition[];
  outcomes: ScenarioOutcome[];
}

// --------------------------------------------------------------------------
// Corpus packs and the eight gates
// --------------------------------------------------------------------------

export type CorpusState =
  | "HERO_SCOPE_ACTIVE"
  | "SOURCE_REGISTERED_NOT_COMPILED"
  | "UPLOAD_SANDBOX_AVAILABLE";

export type CorpusGateStatus = "GATE_PASSED" | "GATE_NOT_RUN" | "GATE_NOT_APPLICABLE";

export interface CorpusGate {
  id: string;
  name: string;
  plain: string;
  status: CorpusGateStatus;
  observed: string;
  test_id: string | null;
}

export interface CorpusPackReport {
  pack: WorkspaceState["corpus_packs"][number];
  gates: CorpusGate[];
  gates_passed: number;
  gates_total: number;
}

// --------------------------------------------------------------------------
// AI assurance — the hybrid split, made visible
// --------------------------------------------------------------------------

export type PipelineActor = "SOURCE" | "AI" | "DETERMINISTIC" | "HUMAN";

export interface PipelineStage {
  id: string;
  name: string;
  actor: PipelineActor;
  plain: string;
}

export interface CandidateFieldOutcome {
  candidate_id: string;
  field: string;
  proposed: string;
  accepted: boolean;
  resolution: string;
  provenance_after_gates: Provenance | null;
}

export interface AbstentionRecord {
  candidate_id: string;
  field: string;
  model_abstained: boolean;
  gate_upheld_abstention: boolean;
  note: string;
}

export interface AiAssuranceReport {
  statement: string;
  pipeline: PipelineStage[];
  split: {
    ai_does: string[];
    deterministic_does: string[];
    human_does: string[];
  };
  receipt: WorkspaceState["model_run_receipt"];
  candidate_count: number;
  field_outcomes: CandidateFieldOutcome[];
  accepted_field_count: number;
  rejected_field_count: number;
  abstentions: AbstentionRecord[];
  benchmark: WorkspaceState["latest_benchmark"];
  limitation: string;
}

// --------------------------------------------------------------------------
// Measured prototype metrics
// --------------------------------------------------------------------------

export interface MeasuredMetric {
  id: string;
  name: string;
  value: string;
  unit: string;
  dataset_scope: string;
  test_command: string;
  limitation: string;
}

export interface MetricsReport {
  dataset_id: string;
  dataset_sha256: string;
  case_count: number;
  measured_at: string;
  label: string;
  metrics: MeasuredMetric[];
  limitation: string;
}
