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

const GLYPH: Record<Tone, string> = {
  ok: "✓",
  review: "!",
  fail: "✕",
  neutral: "·",
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
  FAILED: meta("Check failed", "fail", "A deterministic check did not pass."),
  APPROVED: meta("Approved", "ok"),

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
  ADVISORY_GAP: meta("Advisory gap", "review", "Recorded as guidance. No mandatory task."),
  NOT_EVALUATED: meta("Not checked yet", "neutral"),
  OPEN: meta("Open", "review"),

  // ---- Provenance ------------------------------------------------------
  SOURCE_EXPLICIT: meta("Stated by SEBI", "ok"),
  DETERMINISTIC: meta("Calculated from a fixed rule", "accent"),
  AI_SUGGESTED: meta("AI draft — review required", "review"),
  HUMAN_POLICY: meta("Confirmed by compliance officer", "accent"),

  // ---- References ------------------------------------------------------
  RESOLVED_HASHED: meta("Loaded and fingerprinted", "ok"),
  UNRESOLVED: meta("Not yet loaded", "review"),

  // ---- Corpus packs ----------------------------------------------------
  HERO_SCOPE_ACTIVE: meta("Reviewed demo source", "ok"),
  SOURCE_REGISTERED_NOT_COMPILED: meta("Reference only — not yet reviewed", "neutral"),

  // ---- Applicability ---------------------------------------------------
  APPLIES: meta("Applies", "ok"),
  SCHEMA_VALIDATED: meta("Validated against the NIST schema", "ok"),

  // ---- Benchmark outcomes ---------------------------------------------
  CORRECT: meta("Correct", "ok"),
  INCORRECT: meta("Incorrect", "fail"),
  ABSTAINED_CORRECTLY: meta("Correctly deferred to a human", "ok"),
  ABSTAINED_UNNECESSARILY: meta("Deferred when it need not have", "review"),

  // ---- Uploaded document lifecycle ------------------------------------
  ADDED: meta("Added", "neutral"),
  READING_DOCUMENT: meta("Reading document", "accent"),
  READY_FOR_REVIEW: meta("Ready for review", "accent"),
  NEEDS_REVIEW: meta("Needs review", "review"),
  READY_FOR_APPROVAL: meta("Ready for approval", "accent"),
  COULD_NOT_READ_DOCUMENT: meta("Could not read document", "fail"),

  // ---- Uploaded passage classification --------------------------------
  POSSIBLE_REQUIREMENT: meta("Possible requirement", "accent"),
  RECOMMENDATION: meta("Recommended — no mandatory task", "neutral"),
  PERMISSION: meta("Optional — no mandatory task", "neutral"),
  BACKGROUND: meta("Background only", "neutral"),
};

/** Nouns and product terms that must never reach the primary workflow in raw form. */
const TERMS: Record<string, string> = {
  "Coverage Ledger": "Source coverage",
  "Inspector Mode": "Review workspace",
  "Applicability Receipt": "Why this applies",
  "Reg-Diff": "What changed",
  "Compliance Build Manifest": "Audit-ready build record",
  Manifest: "Audit-ready build record",
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
