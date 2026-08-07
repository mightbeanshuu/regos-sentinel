/**
 * The single place where backend vocabulary becomes language a compliance officer reads.
 *
 * Backend enums are deliberately unchanged: the API stays precise, the presentation layer
 * stays plain. Nothing anywhere else in the web app may call `.replaceAll("_", " ")` on a
 * status value — if a state needs a label, it belongs in this file.
 *
 * Tone rules, which the whole product depends on:
 *   fail    = an actual failed test or a system error. Nothing else is ever red.
 *   review  = a human decision is expected. This is the product working correctly.
 *   ok      = completed, approved, verified.
 *   neutral = not started, reference, background, or not applicable.
 *   accent  = informational emphasis; never a success or failure signal.
 */

export type Tone = "ok" | "review" | "fail" | "neutral" | "accent";

export interface StateMeta {
  /** Sentence-case label. Never all-caps, never a raw enum. */
  label: string;
  tone: Tone;
  /** Redundant non-colour signal, so state survives greyscale and colour blindness. */
  glyph: string;
  /** Optional one-line plain explanation shown beside or beneath the label. */
  hint?: string;
}

/* The non-colour signal for each tone. `neutral` is an open ring, not a middle dot:
   a "·" in front of a label reads as a typo or a stray bullet, while an empty ring
   reads as what the tone actually means — nothing has happened here yet. */
const GLYPH: Record<Tone, string> = {
  ok: "✓",
  review: "!",
  fail: "✕",
  neutral: "○",
  accent: "→",
};

function meta(label: string, tone: Tone, hint?: string): StateMeta {
  return { label, tone, glyph: GLYPH[tone], hint };
}

const STATES: Record<string, StateMeta> = {
  // ---- Build lifecycle -------------------------------------------------
  READY: meta("Ready to start", "neutral"),
  RUNNING: meta("Checking document", "accent"),
  BLOCKED_AWAITING_HUMAN: meta(
    "Needs review",
    "review",
    "A compliance officer has to decide something the source does not state.",
  ),
  FAILED: meta("Check failed", "fail", "A fixed automated check did not pass."),
  APPROVED: meta("Approved", "ok"),
  "ACTIVE — REVIEW REQUIRED": meta(
    "Active — review still required",
    "review",
    "The control remains in force, but this source change still needs a person to decide.",
  ),
  "ACTIVE — REMEDIATION ACTIONS OPEN": meta(
    "Active — follow-up work is open",
    "review",
    "The approved control is in force and its assigned follow-up work is still open.",
  ),

  // ---- Individual checks ----------------------------------------------
  PASS: meta("Passed", "ok"),
  BLOCK: meta("Needs review", "review"),
  FAIL: meta("Check failed", "fail"),

  // ---- Live source verification ---------------------------------------
  LIVE_SOURCE_VERIFIED: meta("Source verified", "ok"),
  SOURCE_CHANGED_REVIEW_REQUIRED: meta("Source changed — needs review", "review"),
  PARTIAL_MATCH_REVIEW_REQUIRED: meta("Partly matched — needs review", "review"),

  // ---- Source coverage -------------------------------------------------
  COMPILED_OBLIGATION: meta("Actionable requirement", "ok"),
  AMBIGUOUS_REVIEW_REQUIRED: meta("Needs interpretation", "review"),
  OUT_OF_PROFILE_SCOPE: meta("Does not apply to this entity", "neutral"),
  INFORMATIONAL: meta("Background only", "neutral"),
  DUPLICATE_OR_SUPERSEDED: meta("Duplicate or superseded", "neutral"),

  // ---- Requirement strength (deontic force) ---------------------------
  MANDATORY: meta("Required", "accent"),
  RECOMMENDED: meta("Recommended — no mandatory task", "neutral"),
  PERMITTED: meta("Optional — no mandatory task", "neutral"),
  PROHIBITED: meta("Prohibited", "fail"),
  DEFINITIONAL: meta("Defines a term", "neutral"),

  // ---- Evidence and operational state ---------------------------------
  CURRENT: meta("Up to date", "ok"),
  NEEDS_REVALIDATION: meta("Review again", "review"),
  MACHINE_READ_OCR: meta(
    "Read from a scanned page",
    "review",
    "Text recovered from a scanned page by machine reading (OCR) — verify against the original before relying on it.",
  ),
  ADVISORY_GAP: meta("Advisory gap", "review", "Recorded as guidance. No mandatory task."),
  NOT_EVALUATED: meta("Not checked yet", "neutral"),
  OPEN: meta("Open", "review"),

  // ---- Provenance ------------------------------------------------------
  SOURCE_EXPLICIT: meta("Stated by SEBI", "ok"),
  DETERMINISTIC: meta("Calculated from a fixed rule", "accent"),
  AI_SUGGESTED: meta("AI draft — review required", "review"),
  HUMAN_POLICY: meta("Confirmed by compliance officer", "accent"),

  // ---- References ------------------------------------------------------
  RESOLVED_HASHED: meta(
    "Loaded and fingerprinted",
    "ok",
    "Loaded, and a fingerprint of its exact contents was recorded.",
  ),
  UNRESOLVED: meta("Not yet loaded", "review"),

  // ---- Corpus packs ----------------------------------------------------
  HERO_SCOPE_ACTIVE: meta("Reviewed demo source", "ok"),
  SOURCE_REGISTERED_NOT_COMPILED: meta("Reference only — not yet reviewed", "neutral"),
  UPLOAD_SANDBOX_AVAILABLE: meta("Open for your own document", "accent"),

  // ---- Corpus gates ----------------------------------------------------
  GATE_PASSED: meta("Cleared", "ok"),
  GATE_NOT_RUN: meta("Not attempted", "neutral"),
  GATE_NOT_APPLICABLE: meta("Deliberately not run", "neutral"),

  // ---- Demonstration scenarios ----------------------------------------
  SCENARIO_NOT_RUN: meta("Not run yet", "neutral"),
  SCENARIO_DEMONSTRATED: meta("Behaved as expected", "ok"),
  SCENARIO_UNEXPECTED_RESULT: meta(
    "Did not behave as expected",
    "fail",
    "An observed value differs from the outcome written down before the case ran.",
  ),


  // ---- Applicability ---------------------------------------------------
  APPLIES: meta("Applies", "ok"),
  SCHEMA_VALIDATED: meta(
    "Checked against the NIST reporting format",
    "ok",
    "NIST is the US standards body whose open reporting format this export follows.",
  ),

  // ---- Benchmark outcomes ---------------------------------------------
  CORRECT: meta("Correct", "ok"),
  INCORRECT: meta("Incorrect", "fail"),
  ABSTAINED_CORRECTLY: meta("Correctly asked a person to decide", "ok"),
  ABSTAINED_UNNECESSARILY: meta("Asked a person to decide when it did not need to", "review"),

  // ---- Uploaded document lifecycle ------------------------------------
  ADDED: meta("Added", "neutral"),
  READING_DOCUMENT: meta("Reading document", "accent"),
  READY_FOR_REVIEW: meta("Ready for review", "accent"),
  NEEDS_REVIEW: meta("Needs review", "review"),
  READY_FOR_APPROVAL: meta("Ready for approval", "accent"),
  COULD_NOT_READ_DOCUMENT: meta("Could not read document", "fail"),

  // ---- Document-case reading lifecycle ---------------------------------
  READING_PENDING: meta(
    "Your reading not recorded yet",
    "review",
    "Write down your own reading before the system's suggestion is revealed.",
  ),
  READING_COMMITTED: meta("Your reading recorded — approval next", "accent"),

  // ---- Who planned an agent run ---------------------------------------
  // These are "accent", not "review". The planner chooses which tool to call; it
  // does not decide anything, and the findings under it are produced by fixed
  // rules. Marking a model-planned route as needing review would say something
  // untrue about what the model contributed.
  MODEL_PLANNED: meta(
    "A model chose which steps to run",
    "accent",
    "A model picked which look-ups to make. Fixed rules produced every finding below.",
  ),
  RECORDED_MODEL_TRACE: meta(
    "Re-run of a saved model session",
    "accent",
    "The same steps a model chose earlier, run again from a saved record. Nothing was sent to the model this time.",
  ),
  DETERMINISTIC_PLAN: meta(
    "Fixed sequence of steps — not AI",
    "accent",
    "The order of steps is fixed in advance. Nothing here was chosen by a model.",
  ),

  // ---- Agent step outcomes ---------------------------------------------
  OK: meta("Completed", "ok"),
  TOOL_ERROR: meta(
    "Refused",
    "fail",
    "The tool would not accept the call. It is recorded, not hidden.",
  ),
  REJECTED_BY_GATE: meta(
    "Blocked by a safety rule",
    "review",
    "A fixed rule refused this value before it could reach a control.",
  ),

  // ---- What an agent found ---------------------------------------------
  REFERENCE_RESOLVED: meta("Cross-reference followed", "ok"),
  REFERENCE_UNRESOLVED: meta(
    "Cross-reference not followed",
    "review",
    "The document this passage points to has not been read yet.",
  ),
  REFERENCE_UNVERIFIED: meta("Possible match — not confirmed against the source", "review"),
  CHALLENGE_LANDED: meta(
    "Challenge landed",
    "review",
    "Publication is blocked until a person rules on it.",
  ),
  CHALLENGE_SURVIVED: meta(
    "Withstood every challenge",
    "ok",
    "Evidence that nothing was found. Not proof of correctness.",
  ),
  CHALLENGE_NOT_ASSESSED: meta(
    "Not examined",
    "review",
    "The cited passage was never read, so no conclusion is available.",
  ),
  NOTHING_TO_CHALLENGE: meta("No draft requirements yet, so nothing to challenge", "neutral"),
  TIMING_COMPUTABLE: meta("A date can be computed", "ok"),
  TIMING_BLOCKED: meta("No date can be computed", "review"),
  TIMING_NOT_ASSESSED: meta("Timing not assessed", "review"),
  SOURCE_VERSION_DELTA: meta("Comparison between two sources", "accent"),
  UNTIMED_DUTY_DETECTED: meta("Duty with no measurable period", "review"),

  // ---- Uploaded passage classification --------------------------------
  POSSIBLE_REQUIREMENT: meta("Possible requirement", "accent"),
  RECOMMENDATION: meta("Recommended — no mandatory task", "neutral"),
  PERMISSION: meta("Optional — no mandatory task", "neutral"),
  BACKGROUND: meta("Background only", "neutral"),

  // ---- Timing classes (Avadhi, the deadline reader) --------------------
  PERIOD_AND_TRIGGER: meta("States a period and when it starts", "ok"),
  PERIOD_ONLY: meta("Says how long, but not from when", "review"),
  URGENCY_ONLY: meta("Urgent wording, no measurable period", "review"),
  NO_TIMING: meta("No timing wording", "neutral"),

  // ---- Benchmark settings ----------------------------------------------
  CONSERVATIVE: meta("Cautious — defers more to a person", "neutral"),
  BALANCED: meta("Balanced", "neutral"),
  PERMISSIVE: meta("Permissive — defers less to a person", "neutral"),

  // ---- Assistant autonomy ----------------------------------------------
  PROPOSE_ONLY: meta(
    "Proposes only",
    "accent",
    "It can raise a problem. It can never change a record.",
  ),
};

/**
 * Two vocabularies live in their own maps because their values collide with the global
 * state table: a source change is `ADDED`, and so is a freshly uploaded document; a
 * pipeline actor is `DETERMINISTIC`, and so is a provenance value. Same word, different
 * meaning, so they get their own lookup rather than a shared one that quietly wins.
 */
const CHANGE_KINDS: Record<string, StateMeta> = {
  ADDED: meta("New passage", "accent", "Not present in the version now in force."),
  CHANGED: meta("Wording or strength changed", "review"),
  SUPERSEDED: meta(
    "Superseded",
    "review",
    "The SEBI wording that a current control relies on has been replaced by newer wording.",
  ),
  UNCHANGED: meta("No change", "neutral"),
};

const ACTORS: Record<string, StateMeta> = {
  SOURCE: meta("The source", "neutral", "Read from the official document."),
  AI: meta("AI proposes", "review", "A draft only. Nothing here reaches a control unreviewed."),
  DETERMINISTIC: meta("Fixed rules enforce", "accent", "A fixed rule, not a judgement call."),
  HUMAN: meta("A person decides", "accent", "Named, with a written reason."),
};

/** Recorded audit events, said as things that happened rather than enum names. */
const EVENT_TYPES: Record<string, string> = {
  COMPLIANCE_BUILD_COMPLETED: "The full compliance check ran",
  SCOPED_SOURCE_REFERENCES_RESOLVED: "Cross-references in the source were followed",
  INDEPENDENT_REVIEW_READING_COMMITTED: "A reviewer recorded their own reading",
  MATERIAL_INTERPRETATION_APPROVED: "A compliance officer approved an interpretation",
  ENTITY_FACT_CONFIRMED: "A fact about the firm was confirmed",
  APPLICABILITY_FACTS_CONFIRMED: "The facts that decide what applies were confirmed",
  BENCHMARK_COMPLETED: "The benchmark ran",
  DEMO_WORKSPACE_CREATED: "The demo profile was created",
  AGENT_RUN_COMPLETED: "An assistant finished its run",
};

export function eventLabelOf(value: string): string {
  return EVENT_TYPES[value] ?? stateOf(value).label;
}

/** What a statement does operationally, in the reader's words. */
const EFFECTS: Record<string, string> = {
  CONTROL_GENERATING: "Creates a control",
  ADVISORY_ONLY_NO_COMPLIANCE_FAILURE: "Guidance only — missing it is not a compliance failure",
  OPTION_RECORDED_NO_TASK: "Recorded as an option — creates no task",
  CONTROL_GENERATING_AFTER_REFERENCE_CLOSURE:
    "Creates a control once the cross-reference is followed",
  CALENDAR_BASIS_FINANCIAL_YEAR: "Dates follow the Indian financial year",
  APPLICABILITY_HIGHEST_CATEGORY: "Applies at the firm's highest registration category",
  APPLICABILITY_NOT_REMOVED_BY_NON_OPERATION:
    "Still applies even if the activity is not currently carried on",
};

export function effectOf(value: string): string {
  return EFFECTS[value] ?? stateOf(value).label;
}

/** Backend work_type values (note: these keys use spaces, not underscores). */
const WORK_TYPES: Record<string, string> = {
  "MANDATORY PATCH REMEDIATION": "Apply a missing security patch",
  "MANDATORY CONTROL REMEDIATION": "Update the firm's control",
};

export function workTypeOf(value: string): string {
  return WORK_TYPES[value] ?? stateOf(value).label;
}

/** Backend legal_state strings arrive as shouted prose; say them quietly. */
const LEGAL_STATES: Record<string, string> = {
  "GUIDANCE — READ WITH CSCRF": "Guidance — read together with the CSCRF framework",
  "IN FORCE — READ WITH CSCRF": "In force — read together with the CSCRF framework",
  "IN FORCE — NOT PROCESSED BY THIS PROTOTYPE": "In force — not processed by this prototype",
  "UNKNOWN — SUPPLIED BY A VISITOR": "Status unknown — supplied by a visitor",
};

export function legalStateOf(value: string): string {
  return LEGAL_STATES[value] ?? value;
}

/**
 * Plain gloss for every read-only look-up an assistant can make. The console shows the
 * machine name and this gloss beneath; capability lists elsewhere show the gloss first.
 */
export const TOOL_PLAIN: Record<string, string> = {
  list_unresolved_references: "list the cross-references not followed yet",
  search_corpus: "search the pinned SEBI excerpts",
  fetch_span: "open one pinned excerpt and fingerprint it",
  verify_quote: "check a quotation really appears in the passage",
  read_span: "read one passage of the source in full",
  analyse_span_timing: "judge whether that passage supports a real deadline",
  analyse_timing: "judge whether wording supports a real deadline",
  list_active_obligations: "list the requirements that would reach a person",
  read_entity_facts: "read the facts about this firm",
  list_statements: "list the requirements pulled out of the source",
  list_known_sources: "list the SEBI documents registered here",
  compare_registered_sources: "compare the reviewed document against the newer one",
  compare_span_sets: "compare two sets of passages",
};

export function toolPlainOf(value: string): string | null {
  return TOOL_PLAIN[value] ?? null;
}

/**
 * The API speaks precisely and the audit record keeps its exact words. These maps say the
 * same thing to a compliance officer, keyed by the stable ids the backend already sends,
 * so no server string has to change and no sealed record moves.
 */
const CHECKPOINTS: Record<string, { name: string; description: string }> = {
  "G1-SOURCE-IDENTITY": {
    name: "The right document",
    description: "The document is tied to who published it, which version it is, and a fingerprint of its exact contents.",
  },
  "G2-SEGMENTATION": {
    name: "Split into passages",
    description: "The text is divided into numbered passages, each one findable by page and paragraph.",
  },
  "G3-COVERAGE": {
    name: "Nothing skipped",
    description: "Every passage in scope has a recorded decision about what was done with it.",
  },
  "G4-OBLIGATION-EXTRACTION": {
    name: "Duties written out",
    description: "Passages that create a duty are turned into draft requirements in a fixed format.",
  },
  "G5-PROVENANCE": {
    name: "Where each value came from",
    description: "Every value records whether SEBI's text, a fixed rule, a model or a person produced it.",
  },
  "G6-APPLICABILITY": {
    name: "Does it apply to this firm",
    description: "Each requirement is decided against the firm's own facts, with a record either way.",
  },
  "G7-HUMAN-REVIEW": {
    name: "A person approved it",
    description: "Anything open to interpretation is approved by a named person with a written reason.",
  },
  "G8-REPORT-GENERATION": {
    name: "Report and sealed record",
    description: "The approved result produces a report and a sealed record that can be reproduced exactly.",
  },
};

export function checkpointOf(id: string, fallbackName: string, fallbackDescription: string) {
  return CHECKPOINTS[id] ?? { name: fallbackName, description: fallbackDescription };
}

/** The six pipeline stages on the "where the AI is" board, in the reader's words. */
const STAGES: Record<string, { name: string; plain: string }> = {
  P1: {
    name: "Reading the document",
    plain: "Reads the official PDF and splits it into passages, each findable by page.",
  },
  P2: {
    name: "Drafting the requirements",
    plain: "Proposes who must do what, by when, and quotes the wording it relied on.",
  },
  P3: {
    name: "Checking the draft's shape",
    plain: "Refuses any proposal that does not have every field it must have.",
  },
  P4: {
    name: "Applying the safety rules",
    plain: "Refuses a date with no stated starting point, keeps guidance out of mandatory work, and decides what applies from the firm's facts.",
  },
  P5: {
    name: "A person decides",
    plain: "A named person settles what the document leaves open, in writing.",
  },
  P6: {
    name: "Approved work",
    plain: "Creates tasks, updates evidence, and seals a record that can be reproduced exactly.",
  },
};

export function stageOf(id: string, fallbackName: string, fallbackPlain: string) {
  return STAGES[id] ?? { name: fallbackName, plain: fallbackPlain };
}

/**
 * Backend prose that reaches the screen word for word. Exact-match only, falling back to
 * the original, so a sentence that changes on the server is shown as written rather than
 * silently mistranslated.
 */
const PHRASES: Record<string, string> = {
  // What the AI proposes
  "Identify candidate actors, actions and objects in a passage":
    "Spot who must act, what they must do, and what it applies to",
  "Suggest the conditions a requirement appears to depend on":
    "Suggest the conditions a requirement appears to depend on",
  "Preserve the exact quotation it drew each field from":
    "Keep the exact quotation each value came from",
  // What fixed rules enforce
  "Validate every proposal against the obligation schema":
    "Check every proposal has each field it must have",
  "Enforce provenance on each derived field":
    "Record where every value came from",
  "Create tasks, update evidence and seal the build record":
    "Create tasks, update evidence, and seal the record",
  // What a person decides
  "Accept or reject each candidate interpretation":
    "Accept or reject each proposed reading",
  // Evidence kinds
  "Synthetic VAPT finding register metadata":
    "Synthetic register of security-test (VAPT) findings — file details only",
  "Synthetic vendor SLA metadata":
    "Synthetic vendor service-level agreement — file details only",
  "Approved policy metadata": "Approved policy — file details only",
  // Scope and measurement notes
  "None. No span of this circular has been read or classified.":
    "None. No passage of this circular has been read or sorted.",
  "Measured on the committed extraction cache for the reviewed FAQ scope, on one model at temperature 0. It is a prototype measurement over a small pinned input, not a statement about model accuracy in general.":
    "Measured on the saved reading of the reviewed FAQ, using one model with its settings fixed. It is a prototype measurement over a small, pinned input — not a claim about how accurate the model is in general.",

  // ---- Source packs and coverage -----------------------------------------
  // These reached the Full record tab in the engine's own vocabulary: span,
  // corpus, gate, schema, seeded, metadata. The backend keeps its wording; only
  // the reading changes.
  "Nine pinned spans support the Q14–Q25 demo scenarios; the pack does not represent the entire FAQ.":
    "Nine passages, each checked by a person, support the worked examples. This pack is not the whole FAQ.",
  "Nine human-verified spans used for the Q14–Q25 prototype scenarios":
    "Nine passages, each checked by a person, used for the worked examples",
  "Q14–Q25 and Preface ¶4. Obligation extraction is limited to Q15, Q17(a) and Q17(b); the remaining spans supply applicability and calendar facts.":
    "Q14–Q25 and Preface ¶4. Duties are drawn only from Q15, Q17(a) and Q17(b); the other passages supply who a rule applies to and the calendar facts.",
  "Version-pinned expansion target. Source identity is registered, while zero spans or obligations are presented as processed in this prototype.":
    "Held for a later version. The source is registered, but no passage and no duty from it has been processed in this prototype.",
  "Read and segmented from the 5 May 2026 advisory. Not compiled into this entity's control register — the advisory is registered as a second reviewed source and Case D compares the reviewed corpus against it.":
    "Read and split into passages from the 5 May 2026 advisory. Not written into this firm's control register — the advisory is registered as a second reviewed source, and Case D compares the reviewed material against it.",
  "Duration is explicit; clock-start remains unresolved in this FAQ span.":
    "The document states how long, but this passage never states what starts the clock.",
  "The reporting-format dependency is tracked for evidence-schema mapping; the prototype performs no regulatory filing.":
    "The reporting format is tracked so evidence fields can be mapped to it. The prototype files nothing with a regulator.",

  // ---- The fixed checks ("gates") and the shape they enforce ---------------
  "Q15 and Q17 obligation candidates; deterministic gates remain authoritative":
    "Draft duties from Q15 and Q17. The fixed rules remain the deciding check.",
  "No requirement has cleared the gates yet":
    "No requirement has cleared the fixed checks yet",
  "Not compiled. No requirement from this passage has cleared the gates.":
    "Not compiled. No requirement from this passage has cleared the fixed checks.",
  "Passages that create duties are turned into structured, schema-validated candidates.":
    "Passages that create duties become draft requirements, each checked against the shape a requirement must have.",
  "Reject any proposal that does not fit the obligation schema exactly.":
    "Reject any proposal that does not have exactly the fields a requirement must have.",
  "Schema validation": "Required-fields check",
  "Regulatory gates": "Regulatory checks",
  "The model returned no trigger and the gates published no date from the source. Any trigger now present came from a person and is labelled as such.":
    "The model named nothing that starts the clock, and the fixed checks published no date from the source. Any clock-start shown now came from a person, and is labelled that way.",
  "A verified chain proves the trace was not edited after the fact. It does not prove the agent was right — that is what the gates are for.":
    "A verified seal proves the record was not edited afterwards. It does not prove the assistant was right — that is what the fixed checks are for.",

  // ---- What the model proposed --------------------------------------------
  // The engine writes the programming literal `null` here. A reader is owed a
  // sentence, not a value from a data structure.
  "null — model declined to state one": "No value — the model declined to state one",

  // ---- Measurement notes on the prototype ---------------------------------
  "Agent steps recorded, and how many verified against their hash chain":
    "Assistant steps recorded, and how many were verified against their tamper-evident seal",
  "One find on one corpus. It says the check works, not that the corpus is clean.":
    "One find, in one set of sources. It says the check works — not that the sources are clean.",
  "Observed on one seeded case; the build stopped and waited for a person (12 checks ran, none of them produced a date).":
    "Observed on one prepared case; the run stopped and waited for a person (12 checks ran, none of them produced a date).",
  "Task creation is deterministic; the count follows the seeded findings.":
    "Follow-up work is created by fixed rules; the count follows the findings already loaded.",
  "Metadata only. No evidence file is read, stored or validated.":
    "File details only. No evidence file is read, stored or checked.",
  "Synthetic evidence metadata attached to the changed control.":
    "Stand-in evidence details attached to the changed control.",
  "Both sides are real SEBI documents; the newer one's English extraction is partial and its gaps are declared on the corpus pack.":
    "Both sides are real SEBI documents. The newer one's English text was only partly readable, and its gaps are declared on the source pack.",
  "Every figure below was measured on this prototype, against synthetic entity and evidence data and a small reviewed source scope. None of it is a production accuracy claim, a statement about any firm's compliance, or a statistical sample of the SEBI corpus.":
    "Every figure below was measured on this prototype, against stand-in firm and evidence data and a small set of reviewed sources. None of it is a production accuracy claim, a statement about any firm's compliance, or a representative sample of everything SEBI publishes.",

  // ---- How the parts divide the work --------------------------------------
  "RegOS uses AI to propose structure, deterministic rules to enforce safety, and a human to approve material interpretation.":
    "RegOS uses AI to propose structure, fixed rules to enforce safety, and a person to approve any interpretation that carries weight.",
  "A second opinion alongside the deterministic timing rule. Where the two disagree, the disagreement is shown to a person; the model never overrules the rule.":
    "A second opinion alongside the fixed timing rule. Where the two disagree, the disagreement is shown to a person; the model never overrules the rule.",

  // ---- Restarting the demonstration ---------------------------------------
  "Restart demo returns the workspace to the unreviewed seeded state.":
    "Restart demo returns the workspace to its starting state, with nothing reviewed.",
  "Restart demo returns the entity facts to the seeded profile.":
    "Restart demo returns the firm's details to the starting profile.",
  "Human-approved regulatory split compiled":
    "The approved rule split was recorded.",

  // ---- Read-only assistant findings --------------------------------------
  "Recorded as a blocked duty. The gate refuses to invent the missing period, exactly as it does for FAQ Q17(a).":
    "Recorded as unresolved. A fixed safety rule refuses to invent the missing period, just as it does for FAQ Q17(a).",
  "Vacuously clean; recorded so the absence is visible.":
    "Nothing existed to challenge. That absence is recorded instead of treated as proof.",
  "Vacuously complete; recorded so the absence is visible.":
    "Nothing needed a timing check. That absence is recorded instead of treated as proof.",
};

/** Machine topic keys that can occur inside longer recorded sentences. */
const INLINE_PHRASES: Record<string, string> = {
  "Added topics:": "Newly covered:",
  "Changed:": "Changed wording:",
  "Topics this source does not address, which therefore continue to be governed by the reviewed corpus:":
    "Topics not addressed here, which remain governed by the reviewed source set:",
  "advisory.read.with.cscrf": "advisory read with the main cyber framework",
  "ai.agentic.plan": "AI action-plan guidance",
  "api.whitelist": "approved API access list",
  "applicability.dormant.licence": "rules for inactive licences",
  "applicability.highest.category": "the firm's highest registration category",
  "asset.inventory.periodicity": "asset-inventory review frequency",
  "msoc.onboarding": "managed security-operations onboarding",
  "patch.high.severity.timeline": "high-severity patch timeline",
  "periodicity.calendar.basis": "reporting calendar basis",
  "vapt.closure.timeline": "VAPT closure timeline",
  "vapt.other.observation.timeline": "timeline for other VAPT findings",
  "vapt.periodicity": "VAPT frequency",
  "vapt.qsb.periodicity": "VAPT frequency for qualified stockbrokers",
  "vapt.reporting.format": "VAPT reporting format",
  "vapt.vendor.sla.timeline": "vendor VAPT turnaround time",
  "vapt.virtual.patching": "virtual patching guidance",
};

export function plainPhrase(text: string): string {
  let plain = PHRASES[text] ?? text;
  for (const [machine, readable] of Object.entries(INLINE_PHRASES)) {
    plain = plain.replaceAll(machine, readable);
  }
  return plain;
}

/**
 * One wording for a dropped connection everywhere. The browser's raw "Failed to fetch"
 * usually means the free-tier server is waking, not a dead end.
 */
/**
 * The firm's CSCRF size band, said the way SEBI writes it rather than the way the
 * seed stores it. The words are unchanged — "SMALL-SIZE RE" only stops shouting —
 * because this band is load-bearing: it is the reason the Cyber Capability Index
 * is out of scope for this firm, and renaming it would break that argument.
 */
export function cscrfCategoryLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.replace(
    /\b[A-Z][A-Z-]+\b/g,
    (word) =>
      // "RE", "MII" and other acronyms stay upper-case; size words do not.
      word.length <= 3 && !word.includes("-")
        ? word
        : word.charAt(0) + word.slice(1).toLowerCase(),
  );
}

export function plainError(caught: unknown, fallback: string): string {
  if (
    caught instanceof TypeError ||
    (caught instanceof Error && /failed to fetch/i.test(caught.message))
  ) {
    return "RegOS is starting up — wait a few seconds and try again.";
  }
  return caught instanceof Error ? caught.message : fallback;
}

export function changeKindOf(value: string): StateMeta {
  return CHANGE_KINDS[value] ?? stateOf(value);
}

export function actorOf(value: string): StateMeta {
  return ACTORS[value] ?? stateOf(value);
}

/**
 * The twelve checks, said the way a compliance officer would say them.
 *
 * The backend names them precisely — "No unresolved material source spans" — which is
 * right for the audit record and wrong for the front page. A reader who has to decode
 * the check cannot judge whether it matters to them.
 */
const CHECKS: Record<string, string> = {
  "TEST-COVERAGE-001": "Every part of the SEBI text has been dealt with",
  "TEST-PATCH-BRANCH-001": "The rule for high-severity security holes has been drafted",
  "TEST-HUMAN-REVIEW-001": "A compliance officer has approved the interpretation",
  "TEST-INDEPENDENT-READING-001": "The reviewer wrote down their own reading first",
  "TEST-CITATION-001": "Every figure points to the exact SEBI wording it came from",
  "TEST-REFERENCE-CLOSURE-001": "Every cross-reference to the main framework has been followed",
  "TEST-DEONTIC-FORCE-001": "Things SEBI recommends are not treated as things it requires",
  "TEST-DEADLINE-TRACE-001": "Every date shows where it came from",
  "TEST-IMPACT-001": "Every control, task and evidence item affected by this change has been listed",
  "TEST-FY-PERIODICITY-001": "Reporting periods follow the Indian financial year",
  "TEST-APPLICABILITY-HARD-CASES-001": "What applies to this firm matches its registrations",
  "TEST-ADVERSARY-001": "Nothing has been flagged as doubtful",
};

export function checkLabel(id: string, fallback: string): string {
  return CHECKS[id] ?? fallback;
}

/** Nouns and product terms that must never reach the primary workflow in raw form. */
const TERMS: Record<string, string> = {
  "Coverage Ledger": "Source coverage",
  "Inspector Mode": "Review screen",
  "Applicability Receipt": "Why this applies",
  "Reg-Diff": "What changed",
  "Compliance Build Manifest": "Audit-ready record of this review",
  Manifest: "Audit-ready record of this review",
  "Compliance Twin": "Live compliance map",
  "Deontic force": "Requirement strength",
  "Indexed spans": "Reviewed passages",
  "Compiled candidates": "Draft requirements",
  "Identity hash": "Document fingerprint",
};

/**
 * Look up a backend value. Unknown values fall back to a readable sentence-case rendering
 * rather than a raw enum, so a new backend state can never ship as SHOUTING_SNAKE_CASE.
 */
export function stateOf(value: string | null | undefined): StateMeta {
  if (!value) return meta("Not started", "neutral");
  const known = STATES[value];
  if (known) return known;
  const readable = value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (character) => character.toUpperCase());
  return meta(readable, "neutral");
}

export function labelOf(value: string | null | undefined): string {
  return stateOf(value).label;
}

export function toneOf(value: string | null | undefined): Tone {
  return stateOf(value).tone;
}

export function termOf(value: string): string {
  return TERMS[value] ?? value;
}

/** The four assistants, named for the person reading — never their enum ids. */
const AGENT_NAMES: Record<string, string> = {
  REFERENCE_RESOLVER: "Reference finder",
  EXTRACTOR: "Deadline reader",
  SOURCE_SCOUT: "Change watcher",
  ADVERSARY: "Challenger",
};

export function agentNameOf(value: string): string {
  return AGENT_NAMES[value] ?? value;
}

/**
 * Machine verdicts that may legitimately appear inside recorded agent text — the
 * trace shows the machine's own vocabulary — glossed in plain words beneath.
 * A verdict like `PERIOD_WITHOUT_TRIGGER` is the most important thing this product
 * ever says, and shouting it in an enum wastes it.
 */
const VERDICT_PLAIN: Record<string, string> = {
  PERIOD_AND_TRIGGER_STATED: "a date can be worked out — SEBI gives both the period and its start",
  PERIOD_WITHOUT_TRIGGER: "no date possible — SEBI gives the period but never says what starts it",
  URGENCY_WITHOUT_PERIOD: "no date possible — urgent-sounding words, no measurable period",
  NO_TIMING_LANGUAGE: "no timing in this passage at all",
  READ_IN_CONJUNCTION_WITH: "the newer document adds to the old one rather than replacing it",
  SUPERSEDES: "the newer document replaces the old one",
};

/** A plain gloss for any machine verdict present in a recorded line, or null. */
export function glossFor(text: string): string | null {
  for (const [term, plain] of Object.entries(VERDICT_PLAIN)) {
    if (text.includes(term)) return plain;
  }
  return null;
}

/** Visually shorten a hash while keeping the full value available for copy. */
export function shortHash(value: string, lead = 10, tail = 6): string {
  if (value.length <= lead + tail + 1) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** "2026-07-22T00:00:10Z" → "22 Jul 2026, 00:00 UTC". Stable across locales. */
export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  const month = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][parsed.getUTCMonth()];
  const hours = String(parsed.getUTCHours()).padStart(2, "0");
  const minutes = String(parsed.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${parsed.getUTCFullYear()}, ${hours}:${minutes} UTC`;
}

/** "2026-07-29" → "29 July 2026". Used for due dates, which must read unambiguously. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${Number(match[3])} ${months[Number(match[2]) - 1]} ${match[1]}`;
}
