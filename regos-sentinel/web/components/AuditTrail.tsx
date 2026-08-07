"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { apiOrigin, regosApi } from "../lib/api";
import {
  actorOf,
  checkLabel,
  checkpointOf,
  effectOf,
  eventLabelOf,
  formatTimestamp,
  labelOf,
  legalStateOf,
  plainPhrase,
  stageOf,
  stateOf,
  workTypeOf,
  type Tone,
} from "../lib/presentation";
import type {
  AiAssuranceReport,
  CorpusPackReport,
  MetricsReport,
  ScenarioCatalogue,
  WorkspaceState,
} from "../lib/types";
import {
  Callout,
  DataRow,
  Disclosure,
  Empty,
  Hash,
  Meter,
  Panel,
  SegBar,
  Skeleton,
  Stat,
  StatRow,
  StateLabel,
  Tag,
  Timeline,
} from "./ui";

/** Enum-shaped values go through the vocabulary map; sentences pass through. */
function plainValue(value: string): string {
  return /^[A-Z][A-Z0-9_]+$/.test(value) ? labelOf(value) : value;
}

const PIPELINE: Array<{ stage: string; name: string; plain: string }> = [
  { stage: "INGEST", name: "Load", plain: "Load the source and record its fingerprint" },
  { stage: "COVERAGE", name: "Cover", plain: "Give every reviewed passage a disposition" },
  { stage: "COMPILE", name: "Draft", plain: "Draft structured requirements from the passages" },
  { stage: "VERIFY", name: "Check", plain: "Run the fixed automated checks" },
  { stage: "APPLY", name: "Apply", plain: "Decide what applies to this entity" },
  { stage: "OPERATE", name: "Operate", plain: "Create work and update evidence" },
  { stage: "DIFF", name: "Compare", plain: "Record what changed against the previous version" },
  { stage: "PROVE", name: "Seal", plain: "Seal the record so the result can be reproduced" },
];

/* ---------------------------------------------------------------------------
 * Three reading levels.
 *
 * 1  Review summary     source · firm practice · decision · reviewer · follow-up · record
 * 2  Review evidence    the passages, the wording, the decisions, the checks, the evidence
 * 3  Technical appendix check codes, export schema, model and run detail, limits, raw events
 *
 * Nothing is removed between levels — everything the record held before still
 * renders here, reordered so a first reader can reconstruct one review and an
 * auditor can still reach every row.
 * ------------------------------------------------------------------------- */

const LEVELS = [
  { id: "rec-summary", index: "Level 1", label: "Review summary" },
  { id: "rec-evidence", index: "Level 2", label: "Review evidence" },
  { id: "rec-appendix", index: "Level 3", label: "Technical appendix" },
] as const;

/* ---------------------------------------------------------------------------
 * Summary helpers.
 *
 * Each fold opens with a distribution or a ratio computed from the rows inside
 * it — nothing is estimated, nothing is dropped, and each figure has exactly one
 * home: the fold that owns the rows it counts.
 * ------------------------------------------------------------------------- */

type Segment = { label: string; count: number; tone: Tone };

/**
 * Count enum values into segments. A known set of possible values keeps its zero
 * counts visible, because "0 failed" is information a compliance officer needs.
 */
function distribution(values: string[], universe?: readonly string[]): Segment[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const keys = universe ? [...universe] : [...counts.keys()];
  return keys.map((key) => ({
    label: labelOf(key),
    count: counts.get(key) ?? 0,
    tone: stateOf(key).tone,
  }));
}

/**
 * A state label may carry its plain-English hint after an em dash — "Recommended
 * — no mandatory task". That clause earns its place on a row of its own and is
 * unreadable inside a comma list, where three of them ran the summary past what
 * anyone parses. The summary keeps the name and drops the clause.
 */
function summaryName(label: string): string {
  const name = label.split(" — ")[0];
  const [first = ""] = name.split(" ");
  // Acronyms stay as written: "VAPT report" must not become "vAPT report".
  if (first.length > 1 && first === first.toUpperCase()) return name;
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/**
 * The total first, then the breakdown. The old order ("5 Required, 1 Optional of
 * 8 statements") buried the total behind a comma list and read as though the
 * last count owned it.
 */
function spoken(segments: Segment[], noun: string): string {
  const parts = segments.filter((segment) => segment.count > 0);
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  if (parts.length === 0) return `No ${noun} recorded`;
  const named = parts.map((s) => `${s.count} ${summaryName(s.label)}`).join(", ");
  return `${total} ${noun} · ${named}`;
}

const GATE_STATES = ["GATE_PASSED", "GATE_NOT_RUN", "GATE_NOT_APPLICABLE"] as const;
const PACK_STATES = [
  "HERO_SCOPE_ACTIVE",
  "SOURCE_REGISTERED_NOT_COMPILED",
  "UPLOAD_SANDBOX_AVAILABLE",
] as const;
const COVERAGE_STATES = [
  "COMPILED_OBLIGATION",
  "AMBIGUOUS_REVIEW_REQUIRED",
  "INFORMATIONAL",
  "DUPLICATE_OR_SUPERSEDED",
  "OUT_OF_PROFILE_SCOPE",
] as const;
const DEONTIC_STATES = [
  "MANDATORY",
  "PROHIBITED",
  "RECOMMENDED",
  "PERMITTED",
  "DEFINITIONAL",
] as const;
const TEST_STATES = ["PASS", "BLOCK", "FAIL"] as const;

/* ---------------------------------------------------------------------------
 * Exports.
 *
 * Every export on this page used to be a plain anchor to `/api/v1/...` on the web
 * origin. Two things were wrong with that. It navigated the browser out of the
 * app onto a raw JSON error page whenever the endpoint's precondition was not met
 * (the record endpoint answers 409 until a manifest exists), and the path only
 * resolves at all in local development, where next.config rewrites it — the
 * deployed site has no such rewrite and answered 404.
 *
 * So exports are fetched, with the session identity the rest of the app uses, and
 * a failure is reported in place. The buttons themselves only render once the
 * state each endpoint requires actually exists.
 * ------------------------------------------------------------------------- */

/** The key `lib/api.ts` writes. Duplicated because its request helpers are private. */
const SESSION_STORAGE_KEY = "regos.session.v1";

interface OscalValidation {
  valid: boolean;
  schema_version: string;
  schema_url: string;
  schema_sha256: string;
  validator: string;
  error_count: number;
  errors: Array<{ path: string; message: string }>;
  scope: string;
}

async function exportFetch(path: string): Promise<Response> {
  const token =
    typeof window === "undefined" ? null : window.localStorage.getItem(SESSION_STORAGE_KEY);
  const response = await fetch(`${apiOrigin}/api/v1${path}`, {
    credentials: "include",
    headers: token ? { "X-RegOS-Session": token } : undefined,
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      detail?: string | { message?: string };
    };
    const detail =
      typeof payload.detail === "string"
        ? payload.detail
        : payload.detail?.message ?? `The export could not be produced (status ${response.status}).`;
    throw new Error(detail);
  }
  return response;
}

async function downloadExport(path: string, filename: string): Promise<void> {
  const response = await exportFetch(path);
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------------------------
 * Single-open folds. One `openFold` for the whole page: opening any section
 * closes the one before it, so the record is never two long tables deep.
 * ------------------------------------------------------------------------- */

function Fold({
  id,
  title,
  meta,
  openId,
  onToggle,
  children,
}: {
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  openId: string | null;
  onToggle: (id: string, open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <details
      className="disclosure rec-fold"
      id={id}
      open={openId === id}
      onToggle={(event) => onToggle(id, event.currentTarget.open)}
    >
      <summary>
        <span className="rec-fold-title">{title}</span>
        {meta ? <span className="rec-fold-meta">{meta}</span> : null}
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}

/** A 60px track beside a printed figure. The figure is the datum; the bar is redundancy. */
function InlineBar({
  value,
  max,
  tone,
  label,
  figure,
}: {
  value: number;
  max: number;
  tone: Tone;
  label: string;
  figure: ReactNode;
}) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <span className="meter meter--inline">
      <span
        className="meter-track"
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <span
          className={`meter-fill meter-fill--${tone}`}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </span>
      <span className="strong-ink">{figure}</span>
    </span>
  );
}

export function AuditTrail({
  state,
  onOpenGuidedReview,
}: {
  state: WorkspaceState;
  onOpenGuidedReview: () => void;
}) {
  const build = state.builds.at(-1);
  const manifest = state.latest_manifest;
  const benchmark = state.latest_benchmark;
  const receiptData = state.model_run_receipt;

  const [packs, setPacks] = useState<CorpusPackReport[] | null>(null);
  const [assurance, setAssurance] = useState<AiAssuranceReport | null>(null);
  const [metrics, setMetrics] = useState<MetricsReport | null>(null);
  const [catalogue, setCatalogue] = useState<ScenarioCatalogue | null>(null);
  /** Loading and absence are different things: skeleton first, empty state only after. */
  const [settled, setSettled] = useState(false);
  const [reloads, setReloads] = useState(0);

  const [openFold, setOpenFold] = useState<string | null>(null);
  const onToggleFold = useCallback((id: string, open: boolean) => {
    setOpenFold((current) => (open ? id : current === id ? null : current));
  }, []);

  const [exportBusy, setExportBusy] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [validation, setValidation] = useState<OscalValidation | null>(null);

  // These views are derived from the same workspace, so they are refetched
  // whenever the build moves. A stale gate table is worse than no gate table.
  useEffect(() => {
    let live = true;
    void Promise.all([
      regosApi.corpusPacks().catch(() => null),
      regosApi.assurance().catch(() => null),
      regosApi.metrics().catch(() => null),
      regosApi.scenarios().catch(() => null),
    ]).then(([packReports, assuranceReport, metricsReport, scenarioCatalogue]) => {
      if (!live) return;
      setPacks(packReports);
      setAssurance(assuranceReport);
      setMetrics(metricsReport);
      setCatalogue(scenarioCatalogue);
      setSettled(true);
    });
    return () => { live = false; };
  }, [state.builds.length, state.reviews.length, state.scenario_outcomes.length, reloads]);

  // A sealed record is the only thing that makes any export possible. When it is
  // withdrawn (a restart, a new build), a stale validation receipt must go too.
  useEffect(() => {
    if (!manifest) {
      setValidation(null);
      setExportError(null);
    }
  }, [manifest]);

  const retry = (
    <button
      type="button"
      className="btn btn--secondary btn--small"
      onClick={() => setReloads((count) => count + 1)}
    >
      Try again
    </button>
  );

  const jumpTo = (selector: string) => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .querySelector(selector)
      ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  const runExport = useCallback(
    async (id: string, operation: () => Promise<void>) => {
      setExportBusy(id);
      setExportError(null);
      try {
        await operation();
      } catch (caught) {
        setExportError(
          caught instanceof Error
            ? caught.message
            : "That export could not be produced. Nothing was changed.",
        );
      } finally {
        setExportBusy(null);
      }
    },
    [],
  );

  // ---- Figures, each counted from the rows in the fold that shows them -----
  const packSegments = distribution(
    state.corpus_packs.map((pack) => pack.status),
    PACK_STATES,
  );
  const coverageSegments = distribution(
    state.coverage.map((entry) => entry.status),
    COVERAGE_STATES,
  );
  const strengthSegments = distribution(
    state.regulatory_statements.map((statement) => statement.deontic_force),
    DEONTIC_STATES,
  );
  const evidenceSegments = distribution(state.evidence.map((item) => item.status));
  const latestTests = build?.tests ?? [];
  const earlierRuns = state.builds.slice(0, -1);
  const earlierTests = earlierRuns.flatMap((historical) => historical.tests);
  const testSegments = distribution(latestTests.map((test) => test.status), TEST_STATES);
  const gateSegments = packs
    ? distribution(packs.flatMap((report) => report.gates.map((gate) => gate.status)), GATE_STATES)
    : [];
  const checkpointsCleared = packs
    ? packs.reduce((sum, report) => sum + report.gates_passed, 0)
    : 0;
  const checkpointsTotal = packs
    ? packs.reduce((sum, report) => sum + report.gates_total, 0)
    : 0;

  // ---- Level 1: the causal chain, read from live state only ---------------
  const reviewedSource =
    state.corpus_packs.find((pack) => pack.status === "HERO_SCOPE_ACTIVE") ??
    state.corpus_packs[0] ??
    null;
  const control = state.controls[0] ?? null;
  const approval = state.reviews.at(-1) ?? null;
  const reading = state.reviewer_readings.at(-1) ?? null;
  const blockedComputation = state.deadline_computations.find((item) => !item.computable) ?? null;
  const blockingChecks = latestTests.filter((test) => test.status === "BLOCK");
  const failedChecks = latestTests.filter((test) => test.status === "FAIL");

  /** What still stands between this session and a sealed record. Named, never invented. */
  const remaining: { tone: "review" | "fail"; title: string; note: string } = !build
    ? {
        tone: "review",
        title: "No check has run in this session yet",
        note:
          "The record is sealed at the end of a review. Start the guided review to produce one.",
      }
    : failedChecks.length > 0
      ? {
          tone: "fail",
          title:
            failedChecks.length === 1
              ? "One check did not pass, so nothing can be sealed"
              : `${failedChecks.length} checks did not pass, so nothing can be sealed`,
          note: "A failed check has to be resolved before a record exists.",
        }
      : blockingChecks.length > 0
        ? {
            tone: "review",
            title:
              blockingChecks.length === 1
                ? "One step is waiting on a person"
                : `${blockingChecks.length} steps are waiting on a person`,
            note: build.headline,
          }
        : {
            tone: "review",
            title: "No record has been sealed yet",
            note: build.headline,
          };

  const recordAvailable = manifest !== null;
  /** OSCAL needs the sealed record and the build behind it (services/api/app/oscal.py:40). */
  const oscalAvailable = recordAvailable && state.builds.length > 0;
  const assistantRecordVerified =
    state.agent_runs.length > 0 && state.agent_runs.every((run) => run.chain_verified);

  return (
    <div className="rec-page">
      <section className="audit-hero">
        <div className="stack-s">
          <h1 className="page-title">Full record</h1>
          <p className="lede">
            What was read, how it was decided, which checks ran, and how to reproduce the result.
          </p>
        </div>
        <div className="audit-integrity">
          <span
            className={`audit-chain-badge${assistantRecordVerified ? "" : " audit-chain-badge--idle"}`}
          >
            {assistantRecordVerified
              ? "✓ Tamper check passed"
              : "○ Nothing to tamper-check yet"}
          </span>
          <p className="audit-integrity-note">
            {assistantRecordVerified
              ? "Every assistant step is still locked to the step before it."
              : "No assistant has run in this session. Each run is checked the moment it finishes."}
          </p>
        </div>
      </section>

      <section className="rec-proof-room" aria-label="Record at a glance">
        <div className="rec-proof-fact">
          <span className="rec-proof-mark" aria-hidden="true">§</span>
          <div>
            <p className="rec-proof-value">{state.corpus_packs.length}</p>
            {/* "documents", not "source entries" — the fold below counts the same
                things and calls them documents, and two names for one number is
                how a reader starts doubting both. */}
            <p className="rec-proof-label">
              {state.corpus_packs.length === 1
                ? "document in this workspace"
                : "documents in this workspace"}
            </p>
          </div>
          <StateLabel value={reviewedSource?.status} />
        </div>
        <div className="rec-proof-fact">
          <span className="rec-proof-mark" aria-hidden="true">↳</span>
          <div>
            <p className="rec-proof-value">{state.audit_events.length}</p>
            <p className="rec-proof-label">
              recorded event{state.audit_events.length === 1 ? "" : "s"}
            </p>
          </div>
          <span className="rec-proof-note">Each one actually happened here</span>
        </div>
        <div className="rec-proof-fact">
          <span className="rec-proof-mark" aria-hidden="true">✓</span>
          <div>
            <p className="rec-proof-value">{latestTests.length}</p>
            <p className="rec-proof-label">
              check{latestTests.length === 1 ? "" : "s"} in the latest run
            </p>
          </div>
          <span className="rec-proof-note">
            {latestTests.length === 0 ? "Not run yet" : spoken(testSegments, "checks")}
          </span>
        </div>
      </section>

      {/* ---- The page's only navigation: three levels, one compact row ---- */}
      <nav className="rec-toc" aria-label="On this page">
        <span className="rec-toc-label">On this page</span>
        <ul className="rec-toc-list">
          {LEVELS.map((level) => (
            <li key={level.id}>
              <button type="button" className="rec-toc-item" onClick={() => jumpTo(`#${level.id}`)}>
                <span className="rec-toc-index">{level.index}</span>
                <span>{level.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ================================================================== */}
      {/* Level 1 — Review summary                                            */}
      {/* ================================================================== */}
      <section className="rec-level" id="rec-summary">
        <header className="rec-level-head">
          <p className="micro rec-level-index">Level 1</p>
          <h2 className="section-title">Review summary</h2>
          <p className="lede">
            One reading of this review: the source it started from, the firm’s practice it was
            compared against, who decided, what follows, and whether a record exists yet.
          </p>
        </header>

        <Panel tight>
          <dl className="datalist">
            <DataRow label="Official source">
              {reviewedSource ? (
                <>
                  <span className="strong-ink">{reviewedSource.title}</span>
                  <p className="meta">
                    Version {reviewedSource.version} · published {reviewedSource.published_at} ·{" "}
                    {reviewedSource.authority}
                  </p>
                  <p className="meta">
                    <a
                      className="proof-link"
                      href={reviewedSource.source_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open official source ↗
                    </a>
                  </p>
                </>
              ) : (
                <span className="meta">No source has been registered in this session.</span>
              )}
            </DataRow>

            <DataRow label="The firm’s current practice">
              {control ? (
                <>
                  <span className="strong-ink">{control.rule_summary}</span>
                  <p className="meta">
                    {control.name} · owned by {control.owner} ·{" "}
                    <StateLabel value={control.status} />
                  </p>
                  {control.previous_rule_summary && (
                    <p className="meta">Previously: {control.previous_rule_summary}</p>
                  )}
                </>
              ) : (
                <span className="meta">No control has been registered in this session.</span>
              )}
            </DataRow>

            <DataRow label="Decision status">
              {build ? (
                <>
                  <StateLabel value={build.status} showHint />
                  <p className="meta">{plainPhrase(build.headline)}</p>
                  {blockedComputation?.blocked_reason && (
                    <p className="meta">
                      Open point: {blockedComputation.blocked_reason} ·{" "}
                      {blockedComputation.citation.locator}
                    </p>
                  )}
                </>
              ) : (
                <span className="meta">No check has run in this session yet.</span>
              )}
            </DataRow>

            <DataRow label="Reviewer">
              {approval ? (
                <>
                  <span className="strong-ink">
                    {approval.reviewer_name} · {approval.reviewer_role}
                  </span>
                  <p className="meta">Approved {formatTimestamp(approval.decided_at)}</p>
                  <p className="meta">Written reason: {approval.reason}</p>
                </>
              ) : reading ? (
                <>
                  <span className="strong-ink">
                    {reading.reviewer_name} · {reading.reviewer_role}
                  </span>
                  <p className="meta">
                    Own reading recorded {formatTimestamp(reading.committed_at)} — not yet approved.
                  </p>
                </>
              ) : (
                <span className="meta">
                  No person has recorded a reading or an approval in this session.
                </span>
              )}
            </DataRow>

            <DataRow label="Follow-up">
              {state.tasks.length === 0 ? (
                <span className="meta">
                  No follow-up work has been created. Work is created only by an approved decision.
                </span>
              ) : (
                <ul className="rec-plain-list">
                  {state.tasks.map((task) => (
                    <li key={task.id}>
                      <span className="strong-ink">{task.title}</span>
                      <p className="meta">
                        {workTypeOf(task.work_type)} · {task.owner} · due in {task.due_days} days ·{" "}
                        {labelOf(task.status)}
                        {task.synthetic ? " · synthetic" : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </DataRow>

            <DataRow label="Record">
              {recordAvailable ? (
                <>
                  <span className="strong-ink">Sealed and ready to take away</span>
                  <p className="meta">
                    Sealed from run <span className="mono">{manifest.build_id}</span>. The
                    downloads are directly below.
                  </p>
                </>
              ) : (
                <>
                  <span className="strong-ink">Not sealed yet</span>
                  <p className="meta">{remaining.title}</p>
                </>
              )}
            </DataRow>
          </dl>
        </Panel>

        {/* ---- Export lives with the availability state it depends on ---- */}
        <Panel
          title="Take this record away"
          description="An export is offered only once the state it is generated from exists."
        >
          <div className="stack">
            {!recordAvailable && (
              <Callout tone={remaining.tone} title={remaining.title}>
                <p>{plainPhrase(remaining.note)}</p>
                {failedChecks.length > 0 && (
                  <ul className="rec-check-list">
                    {failedChecks.map((test) => (
                      <li key={test.id}>
                        <StateLabel value={test.status} />
                        <span>{checkLabel(test.id, test.name)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {failedChecks.length === 0 && blockingChecks.length > 0 && (
                  <ul className="rec-check-list">
                    {blockingChecks.map((test) => (
                      <li key={test.id}>
                        <StateLabel value={test.status} />
                        <span>{checkLabel(test.id, test.name)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p>
                  The remaining step is on <strong>Review a requirement</strong>: a named person
                  records their own reading and approves an interpretation. The record is sealed
                  when they do.
                </p>
                <div className="btn-row">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={onOpenGuidedReview}
                  >
                    Go to Review a requirement
                  </button>
                </div>
              </Callout>
            )}

            {recordAvailable && (
              <>
                <div className="btn-row">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    disabled={exportBusy !== null}
                    onClick={() =>
                      void runExport("manifest", () =>
                        downloadExport(
                          "/manifests/latest?download=true",
                          `${manifest.build_id.toLowerCase()}-manifest.json`,
                        ),
                      )
                    }
                  >
                    {exportBusy === "manifest"
                      ? "Preparing…"
                      : "Download the audit-ready record"}
                  </button>
                  {oscalAvailable && (
                    <button
                      type="button"
                      className="btn btn--quiet"
                      disabled={exportBusy !== null}
                      onClick={() =>
                        void runExport("oscal", () =>
                          downloadExport(
                            "/exports/oscal/assessment-results?download=true",
                            `${manifest.build_id.toLowerCase()}-oscal-ar.json`,
                          ),
                        )
                      }
                    >
                      {exportBusy === "oscal"
                        ? "Preparing…"
                        : "Download assessment results (OSCAL 1.2.2 format)"}
                    </button>
                  )}
                </div>
                <p className="meta">
                  OSCAL is the NIST open format many regulators and auditors can import. The
                  receipt that shows this export matches that format is in the technical appendix.
                </p>
              </>
            )}

            {exportError && (
              <Callout tone="fail" title="That export could not be produced">
                <p>{exportError}</p>
                <p className="meta">Nothing in the record was changed.</p>
              </Callout>
            )}
          </div>
        </Panel>
      </section>

      {/* ================================================================== */}
      {/* Level 2 — Review evidence                                           */}
      {/* ================================================================== */}
      <section className="rec-level" id="rec-evidence">
        <header className="rec-level-head">
          <p className="micro rec-level-index">Level 2</p>
          <h2 className="section-title">Review evidence</h2>
          <p className="lede">
            The passages this review read, the exact wording it relied on, what a person decided
            and why, the checks that ran for it, and the evidence behind them. One section opens
            at a time; nothing here is removed when it is closed.
          </p>
        </header>

        <div className="rec-folds">
          {/* ---- Sources ------------------------------------------------ */}
          <Fold
            id="fr-sources"
            openId={openFold}
            onToggle={onToggleFold}
            title="The documents this review read"
            meta={spoken(packSegments, "documents")}
          >
            <div className="stack">
              <SegBar segments={packSegments} ariaLabel={spoken(packSegments, "documents")} />
              <ul className="rec-sources">
                {state.corpus_packs.map((pack) => (
                  <li className="rec-source" key={pack.id}>
                    <div className="rec-source-head">
                      <span className="strong-ink">{pack.title}</span>
                      <StateLabel value={pack.status} />
                    </div>
                    <p className="meta">{plainPhrase(pack.scope_note)}</p>
                    <p className="meta">
                      Version {pack.version} · published {pack.published_at} ·{" "}
                      {pack.indexed_span_count} reviewed passages ·{" "}
                      {pack.compiled_candidate_count} draft requirements
                    </p>
                    <p className="meta">
                      <a
                        className="proof-link"
                        href={pack.source_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open official source ↗
                      </a>
                    </p>
                    {/* A source row expands from its own trigger; nothing else moves. */}
                    <Disclosure summary="Publisher, legal state and document fingerprint">
                      <dl className="datalist">
                        <DataRow label="Published by">{pack.authority}</DataRow>
                        <DataRow label="Legal state">{legalStateOf(pack.legal_state)}</DataRow>
                        <DataRow label="How much of it was read">
                          {plainPhrase(pack.extraction_scope)}
                        </DataRow>
                        <DataRow label="Document fingerprint">
                          <Hash value={pack.content_identity_sha256} label="document" />
                        </DataRow>
                      </dl>
                    </Disclosure>
                  </li>
                ))}
              </ul>
            </div>
          </Fold>

          {/* ---- Exact wording ------------------------------------------ */}
          <Fold
            id="fr-strength"
            openId={openFold}
            onToggle={onToggleFold}
            title="The exact wording this review relied on"
            meta={spoken(strengthSegments, "statements")}
          >
            <div className="stack">
              <p className="meta">
                Only required language creates mandatory work. Encouragement is recorded, never
                converted into a task.
              </p>
              <SegBar
                segments={strengthSegments}
                ariaLabel={spoken(strengthSegments, "statements")}
              />
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Exact wording</th>
                      <th scope="col">Strength</th>
                      <th scope="col">Operational effect</th>
                      <th scope="col">Classified by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.regulatory_statements.map((statement) => (
                      <tr key={statement.id}>
                        <td style={{ fontFamily: "var(--serif)" }}>“{statement.exact_phrase}”</td>
                        <td><StateLabel value={statement.deontic_force} /></td>
                        <td className="meta">{effectOf(statement.operational_effect)}</td>
                        <td><Tag value={statement.classification_provenance} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Fold>

          {/* ---- Coverage ----------------------------------------------- */}
          <Fold
            id="fr-coverage"
            openId={openFold}
            onToggle={onToggleFold}
            title="Every passage, and what was decided about it"
            meta={spoken(coverageSegments, "passages")}
          >
            <div className="stack">
              <p className="meta">
                These counts cover only the passages declared in scope for this document.
              </p>
              <SegBar segments={coverageSegments} ariaLabel={spoken(coverageSegments, "passages")} />
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Passage</th>
                      <th scope="col">What was decided</th>
                      <th scope="col">Why</th>
                      <th scope="col">Reviewed by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.coverage.map((entry) => {
                      const span = state.source_spans.find((item) => item.id === entry.span_id);
                      return (
                        <tr key={entry.id}>
                          <td>
                            <span className="strong-ink">{span?.question ?? entry.span_id}</span>
                            <p className="meta mono">{span?.locator}</p>
                          </td>
                          <td><StateLabel value={entry.status} /></td>
                          <td className="meta">{plainPhrase(entry.rationale)}</td>
                          <td className="meta">
                            {entry.reviewed_by
                              ? `${entry.reviewed_by} · ${formatTimestamp(entry.reviewed_at)}`
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Fold>

          {/* ---- Decisions ---------------------------------------------- */}
          <Fold
            id="fr-decisions"
            openId={openFold}
            onToggle={onToggleFold}
            title="Decisions and reviewers"
            meta={
              state.reviewer_readings.length + state.reviews.length === 0
                ? "None recorded yet"
                : `${state.reviewer_readings.length} own readings, ${state.reviews.length} approvals`
            }
          >
            {state.reviewer_readings.length + state.reviews.length === 0 ? (
              <Empty
                title="No decision has been recorded yet"
                hint="A named person's own reading, and the approval that follows it, appear here as soon as a review is completed."
              />
            ) : (
              <div className="stack">
                {state.reviewer_readings.map((item) => (
                  <dl className="datalist" key={item.id}>
                    <DataRow label="Independent reading">
                      {item.independent_interpretation}
                    </DataRow>
                    <DataRow label="Recorded by">
                      {item.reviewer_name} · {item.reviewer_role}
                    </DataRow>
                    <DataRow label="Committed at">{formatTimestamp(item.committed_at)}</DataRow>
                    <DataRow label="Draft revealed at">
                      {formatTimestamp(item.system_suggestion_revealed_at)}
                    </DataRow>
                    <DataRow label="Draft shown">{item.revealed_system_suggestion}</DataRow>
                  </dl>
                ))}
                {state.reviews.map((review) => (
                  <dl className="datalist" key={review.id}>
                    <DataRow label="Decision">{review.selected_interpretation}</DataRow>
                    <DataRow label="Approved by">
                      {review.reviewer_name} · {review.reviewer_role}
                    </DataRow>
                    <DataRow label="Approved at">{formatTimestamp(review.decided_at)}</DataRow>
                    <DataRow label="Written reason">{review.reason}</DataRow>
                    <DataRow label="Agreed with the draft">
                      {review.reviewer_agreement === null
                        ? "—"
                        : review.reviewer_agreement
                          ? "Yes"
                          : "No — reason recorded above"}
                    </DataRow>
                    <DataRow label="Trigger policy">
                      {review.policy_inputs.trigger_policy} <Tag value="HUMAN_POLICY" />
                    </DataRow>
                  </dl>
                ))}
              </div>
            )}
          </Fold>

          {/* ---- Checks for this review --------------------------------- */}
          <Fold
            id="fr-checks"
            openId={openFold}
            onToggle={onToggleFold}
            title="The checks that ran for this review"
            meta={latestTests.length === 0 ? "None run yet" : spoken(testSegments, "checks")}
          >
            <div className="stack">
              {latestTests.length === 0 ? (
                <Empty
                  title="No checks have run yet"
                  hint="The fixed checks run when a review is completed or a demonstration case is played. Nothing is claimed about them until they have."
                />
              ) : (
                <>
                  <SegBar segments={testSegments} ariaLabel={spoken(testSegments, "checks")} />
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Check</th>
                          <th scope="col">Result</th>
                          <th scope="col">What it reported</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestTests.map((test) => (
                          <tr key={test.id}>
                            <td><span className="strong-ink">{checkLabel(test.id, test.name)}</span></td>
                            <td><StateLabel value={test.status} /></td>
                            <td className="meta">{test.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {build && (
                    <p className="meta">
                      From the run finished {formatTimestamp(build.completed_at)}. Its check codes
                      are in the technical appendix.
                    </p>
                  )}
                </>
              )}

              {earlierTests.length > 0 && (
                <Disclosure summary={`Checks from earlier runs (${earlierTests.length})`}>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Run</th>
                          <th scope="col">Check</th>
                          <th scope="col">Result</th>
                          <th scope="col">What it reported</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earlierRuns.flatMap((historical) =>
                          historical.tests.map((test) => (
                            <tr key={`${historical.id}-${test.id}`}>
                              <td className="mono">{historical.id}</td>
                              <td>{checkLabel(test.id, test.name)}</td>
                              <td><StateLabel value={test.status} /></td>
                              <td className="meta">{test.message}</td>
                            </tr>
                          )),
                        )}
                      </tbody>
                    </table>
                  </div>
                </Disclosure>
              )}
            </div>
          </Fold>

          {/* ---- Evidence ------------------------------------------------ */}
          <Fold
            id="fr-evidence"
            openId={openFold}
            onToggle={onToggleFold}
            title="Evidence behind the firm’s controls"
            meta={spoken(evidenceSegments, "evidence items")}
          >
            <div className="stack">
              <SegBar
                segments={evidenceSegments}
                ariaLabel={spoken(evidenceSegments, "evidence items")}
              />
              <p className="meta">Every item below is synthetic demonstration data.</p>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col">Kind</th>
                      <th scope="col">State</th>
                      <th scope="col">Collected</th>
                      <th scope="col">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.evidence.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name} <span className="meta">· synthetic</span></td>
                        <td className="meta">{plainPhrase(item.kind)}</td>
                        <td><StateLabel value={item.status} /></td>
                        <td className="meta">{formatTimestamp(item.collected_at)}</td>
                        <td className="meta">{item.reason ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Fold>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Level 3 — Technical appendix                                        */}
      {/* ================================================================== */}
      <section className="rec-level" id="rec-appendix">
        <header className="rec-level-head">
          <p className="micro rec-level-index">Level 3</p>
          <h2 className="section-title">Technical appendix</h2>
          <p className="lede">
            For an auditor or an evaluator: check codes, the export format receipt, model and run
            detail, what the measured figures do and do not prove, and every recorded event. This
            is prototype assurance, not part of the review itself.
          </p>
        </header>

        <div className="rec-folds">
          {/* ---- Reproduce ---------------------------------------------- */}
          <Fold
            id="fr-replay"
            openId={openFold}
            onToggle={onToggleFold}
            title="How to reproduce this result"
            meta={recordAvailable ? "Sealed record available" : "No sealed record yet"}
          >
            <div className="stack">
              {manifest ? (
                <div className="audit-replay">
                  <div className="audit-replay-body">
                    <p className="micro">Reproduce this result</p>
                    <code className="audit-replay-cmd">
                      python scripts/replay_build.py · input fingerprint{" "}
                      <Hash
                        value={manifest.reproducibility.replay_input_sha256}
                        label="reproduction input"
                      />
                    </code>
                    <p className="meta">
                      Anyone can run this script against the same input and must get an identical
                      result, character for character.
                    </p>
                  </div>
                </div>
              ) : (
                <Callout tone="review" title="No sealed record yet">
                  <p>
                    The replay command and the record fingerprints exist only once a review is
                    approved. The versions and model details below are already fixed and are shown
                    now.
                  </p>
                </Callout>
              )}

              <dl className="datalist">
                <DataRow label="Data format version">{state.schema_version}</DataRow>
                <DataRow label="Rule set version">{state.ruleset_version}</DataRow>
                <DataRow label="Source version">{state.source_version}</DataRow>
                <DataRow label="Model provider">{receiptData.provider}</DataRow>
                <DataRow label="Model">{receiptData.model_id}</DataRow>
                <DataRow label="Prompt version">{receiptData.prompt_version}</DataRow>
                <DataRow label="Answered from a saved record">
                  {receiptData.cache_hit ? "Yes — no live model call in this run" : "No"}
                </DataRow>
                <DataRow label="Fingerprint of what was sent to the model">
                  <Hash value={receiptData.input_sha256} />
                </DataRow>
                <DataRow label="Fingerprint of what the model returned">
                  <Hash value={receiptData.output_sha256} />
                </DataRow>
                <DataRow label="How much of the document was read">
                  {plainPhrase(receiptData.extraction_scope)}
                </DataRow>
                {manifest && (
                  <>
                    <DataRow label="Fingerprint of the sealed record">
                      <Hash value={manifest.manifest_sha256} />
                    </DataRow>
                    <DataRow label="Fingerprint of the inputs used to reproduce this">
                      <Hash value={manifest.reproducibility.replay_input_sha256} />
                    </DataRow>
                  </>
                )}
              </dl>

              {/* The committed test behind each demonstration case. This detail
                  belongs in the record, not on the working review tab. */}
              {!settled && <Skeleton kind="lines" lines={3} />}
              {settled && catalogue === null && (
                <Empty
                  title="The demonstration cases could not be loaded"
                  hint="No test path is shown unless it has been read back from the API."
                  action={retry}
                />
              )}
              {settled && catalogue !== null && (
                <div className="stack-s">
                  <p className="micro">The committed test behind each demonstration case</p>
                  <p className="meta">
                    Each case writes down its expected outcome before it runs, and a committed test
                    asserts that outcome. These are the test paths your technical auditor can run.
                  </p>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Case</th>
                          <th scope="col">What it demonstrates</th>
                          <th scope="col">Committed test</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catalogue.scenarios.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <span className="strong-ink">
                                {item.label} · {item.title}
                              </span>
                              <p className="meta">{item.citation_locator}</p>
                            </td>
                            <td className="meta">{item.expected_outcome}</td>
                            <td className="meta mono">{item.automated_test}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </Fold>

          {/* ---- Checkpoints and their codes ---------------------------- */}
          <Fold
            id="fr-checkpoints"
            openId={openFold}
            onToggle={onToggleFold}
            title="Checkpoint codes, and which each source has cleared"
            meta={
              settled && packs
                ? `${checkpointsCleared} of ${checkpointsTotal} cleared`
                : "Not loaded yet"
            }
          >
            {!settled && <Skeleton kind="lines" lines={4} />}
            {settled && packs === null && (
              <Empty
                title="The checkpoint report could not be loaded"
                hint="No figures are shown for checkpoints that have not been read back from the record."
                action={retry}
              />
            )}
            {settled && packs !== null && (
              <div className="stack">
                <p className="meta">
                  Every source goes through the same eight checkpoints. Checkpoints that were never
                  attempted are shown as not attempted.
                </p>
                <SegBar segments={gateSegments} ariaLabel={spoken(gateSegments, "checkpoints")} />
                <div>
                  {packs.map((report) => (
                    <Meter
                      key={report.pack.id}
                      label={report.pack.title}
                      value={report.gates_passed}
                      max={report.gates_total}
                      tone={report.gates_passed === report.gates_total ? "ok" : "review"}
                      valueLabel={`${report.gates_passed}/${report.gates_total}`}
                    />
                  ))}
                </div>
                {packs.map((report) => (
                  <Disclosure
                    key={report.pack.id}
                    summary={`All eight checkpoints for ${report.pack.title} — ${report.gates_passed} of ${report.gates_total} cleared`}
                  >
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th scope="col">Checkpoint</th>
                            <th scope="col">What it checks</th>
                            <th scope="col">State</th>
                            <th scope="col">What was observed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.gates.map((gate) => {
                            const said = checkpointOf(gate.id, gate.name, gate.plain);
                            return (
                              <tr key={gate.id}>
                                <td>
                                  <span className="strong-ink">{said.name}</span>
                                  <p className="meta mono">{gate.id}</p>
                                </td>
                                <td className="meta">{said.description}</td>
                                <td><StateLabel value={gate.status} /></td>
                                <td className="meta">
                                  {plainPhrase(gate.observed)}
                                  {gate.test_id && <p className="meta mono">{gate.test_id}</p>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Disclosure>
                ))}
              </div>
            )}
          </Fold>

          {/* ---- Stages every document passes through ------------------- */}
          <Fold
            id="fr-pipeline"
            openId={openFold}
            onToggle={onToggleFold}
            title="The stages every document passes through"
            meta={`${PIPELINE.length} stages`}
          >
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Stage</th>
                    <th scope="col">What it does</th>
                  </tr>
                </thead>
                <tbody>
                  {PIPELINE.map((item) => (
                    <tr key={item.stage}>
                      <td><span className="strong-ink">{plainPhrase(item.name)}</span></td>
                      <td className="meta">{plainPhrase(item.plain)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Fold>

          {/* ---- Export format receipt ---------------------------------- */}
          <Fold
            id="fr-export-schema"
            openId={openFold}
            onToggle={onToggleFold}
            title="Export format, and the receipt that it matches"
            meta={oscalAvailable ? "Available" : "Needs a sealed record"}
          >
            <div className="stack">
              <p className="meta">
                The assessment-results export follows OSCAL, the NIST open reporting format many
                regulators and auditors can import. The receipt below is produced by checking this
                session’s export against the pinned NIST definition of that format.
              </p>
              {!oscalAvailable && (
                <Callout tone="review" title="No export exists to check yet">
                  <p>
                    The OSCAL export is generated from the sealed record and the run behind it, so
                    there is nothing to validate until a review is approved.
                  </p>
                </Callout>
              )}
              {oscalAvailable && (
                <>
                  <div className="btn-row">
                    <button
                      type="button"
                      className="btn btn--secondary btn--small"
                      disabled={exportBusy !== null}
                      onClick={() =>
                        void runExport("validation", async () => {
                          const response = await exportFetch("/exports/oscal/validation");
                          setValidation((await response.json()) as OscalValidation);
                        })
                      }
                    >
                      {exportBusy === "validation"
                        ? "Checking…"
                        : validation
                          ? "Check it again"
                          : "Check this export against the NIST format"}
                    </button>
                  </div>
                  {validation && (
                    <dl className="datalist">
                      <DataRow label="Result">
                        <StateLabel value={validation.valid ? "SCHEMA_VALIDATED" : "FAIL"} />
                      </DataRow>
                      <DataRow label="Format version">{validation.schema_version}</DataRow>
                      <DataRow label="Schema">
                        <a
                          className="proof-link"
                          href={validation.schema_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open the published NIST schema ↗
                        </a>
                      </DataRow>
                      <DataRow label="Schema fingerprint">
                        <Hash value={validation.schema_sha256} label="schema" />
                      </DataRow>
                      <DataRow label="Validator">
                        <span className="mono">{validation.validator}</span>
                      </DataRow>
                      <DataRow label="Problems found">{validation.error_count}</DataRow>
                      <DataRow label="Scope of this check">
                        <span className="mono">{validation.scope}</span>
                        <p className="meta">
                          The check covers this session’s exported record only. It says the file
                          is well formed, not that the review it describes is correct.
                        </p>
                      </DataRow>
                      {validation.errors.length > 0 && (
                        <DataRow label="Reported problems">
                          <ul className="rec-plain-list">
                            {validation.errors.map((problem, index) => (
                              <li key={`${problem.path}-${index}`}>
                                <span className="meta mono">{problem.path || "(document root)"}</span>
                                <p className="meta">{problem.message}</p>
                              </li>
                            ))}
                          </ul>
                        </DataRow>
                      )}
                    </dl>
                  )}
                </>
              )}
            </div>
          </Fold>

          {/* ---- AI boundary -------------------------------------------- */}
          <Fold
            id="fr-ai"
            openId={openFold}
            onToggle={onToggleFold}
            title="Where the AI is, and where it is not"
            meta={
              settled && assurance
                ? `${assurance.accepted_field_count} accepted, ${assurance.rejected_field_count} refused or replaced`
                : "Not loaded yet"
            }
          >
            {!settled && <Skeleton kind="lines" lines={4} />}
            {settled && assurance === null && (
              <Empty
                title="This report could not be loaded"
                hint="Nothing is asserted about what the model did until the record has been read back."
                action={retry}
              />
            )}
            {settled && assurance !== null && (
              <div className="stack">
                <p className="lede">{plainPhrase(assurance.statement)}</p>
                <StatRow>
                  <Stat
                    size="s"
                    value={assurance.candidate_count}
                    label="Draft requirements the model returned"
                  />
                  <Stat
                    size="s"
                    value={assurance.accepted_field_count}
                    label="Values accepted after the safety rules ran"
                    context={`of ${assurance.accepted_field_count + assurance.rejected_field_count}`}
                  />
                  <Stat
                    size="s"
                    value={assurance.rejected_field_count}
                    label="Values the safety rules refused or replaced"
                    tone={assurance.rejected_field_count > 0 ? "review" : undefined}
                  />
                </StatRow>

                <SegBar
                  segments={[
                    { label: "Accepted", count: assurance.accepted_field_count, tone: "ok" },
                    {
                      label: "Refused or replaced",
                      count: assurance.rejected_field_count,
                      tone: "review",
                    },
                  ]}
                  ariaLabel={`${assurance.accepted_field_count} values accepted, ${assurance.rejected_field_count} refused or replaced`}
                />

                <div className="compare">
                  <div className="compare-col">
                    <p className="micro">The model proposes</p>
                    <ul className="stack-s">
                      {assurance.split.ai_does.map((item) => (
                        <li key={item} className="meta">{plainPhrase(item)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="compare-col">
                    <p className="micro">Fixed rules enforce</p>
                    <ul className="stack-s">
                      {assurance.split.deterministic_does.map((item) => (
                        <li key={item} className="meta">{plainPhrase(item)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="compare-col compare-col--source">
                    <p className="micro">A person decides</p>
                    <ul className="stack-s">
                      {assurance.split.human_does.map((item) => (
                        <li key={item} className="meta">{plainPhrase(item)}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {assurance.abstentions.map((record) => (
                  <Callout
                    key={`${record.candidate_id}-${record.field}`}
                    tone={record.gate_upheld_abstention ? "ok" : "fail"}
                    title={
                      record.gate_upheld_abstention
                        ? `The model declined to state a ${record.field}, and the rules held that line`
                        : `The model declined to state a ${record.field}, but a value got through`
                    }
                  >
                    <p className="meta mono">{record.candidate_id}</p>
                    <p>{plainPhrase(record.note)}</p>
                  </Callout>
                ))}

                <Disclosure summary={`Each stage, and who does it (${assurance.pipeline.length})`}>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Stage</th>
                          <th scope="col">Who does it</th>
                          <th scope="col">What happens</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assurance.pipeline.map((stage) => {
                          const actor = actorOf(stage.actor);
                          const said = stageOf(stage.id, stage.name, stage.plain);
                          return (
                            <tr key={stage.id}>
                              <td><span className="strong-ink">{said.name}</span></td>
                              <td>
                                <span className={`state state--${actor.tone}`}>
                                  <span className="state-glyph" aria-hidden="true">
                                    {actor.glyph}
                                  </span>
                                  <span>{actor.label}</span>
                                </span>
                              </td>
                              <td className="meta">{said.plain}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Disclosure>

                <Disclosure
                  summary={`Every value the model proposed, and what the rules did with it (${assurance.field_outcomes.length})`}
                >
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Draft requirement</th>
                          <th scope="col">Field</th>
                          <th scope="col">What the model proposed</th>
                          <th scope="col">What the rules did with it</th>
                          <th scope="col">Recorded as</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assurance.field_outcomes.map((outcome, index) => (
                          <tr key={`${outcome.candidate_id}-${outcome.field}-${index}`}>
                            <td className="mono meta">{outcome.candidate_id}</td>
                            <td>{outcome.field}</td>
                            <td className="meta">{plainPhrase(outcome.proposed)}</td>
                            <td className="meta">{plainPhrase(outcome.resolution)}</td>
                            <td>
                              {outcome.provenance_after_gates
                                ? <Tag value={outcome.provenance_after_gates} />
                                : <span className="meta">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Disclosure>

                <p className="meta">
                  Model run: {assurance.receipt.provider} · {assurance.receipt.model_id} ·{" "}
                  {assurance.receipt.cache_hit
                    ? "answered from a saved record — no live model call"
                    : "a live call to the model"}
                </p>

                <Callout tone="review" title="What this does not say">
                  <p>{plainPhrase(assurance.limitation)}</p>
                </Callout>
              </div>
            )}
          </Fold>

          {/* ---- Measured figures --------------------------------------- */}
          <Fold
            id="fr-metrics"
            openId={openFold}
            onToggle={onToggleFold}
            title="Measured on this prototype, and what it does not prove"
            meta={
              settled && metrics
                ? `${metrics.metrics.length} figures over ${metrics.case_count} cases`
                : "Not loaded yet"
            }
          >
            {!settled && <Skeleton kind="lines" lines={3} />}
            {settled && metrics === null && (
              <Empty
                title="The measured figures could not be loaded"
                hint="No figure is shown here unless a committed test produced it."
                action={retry}
              />
            )}
            {settled && metrics !== null && (
              <div className="stack">
                <p className="meta">
                  Every figure is measured by a committed test. Nothing is an estimate. Measured at{" "}
                  {formatTimestamp(metrics.measured_at)}.
                </p>

                <Callout tone="review" title="Read every number with this limit in mind">
                  <p>{plainPhrase(metrics.limitation)}</p>
                </Callout>

                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">What was measured</th>
                        <th scope="col" className="table-num">Result</th>
                        <th scope="col">On what data</th>
                        <th scope="col">What it does not prove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.metrics.map((metric) => (
                        <tr key={metric.id}>
                          <td>
                            <span className="strong-ink">{plainPhrase(metric.name)}</span>
                            <p className="meta mono">{metric.id}</p>
                          </td>
                          <td className="table-num">
                            <span className="strong-ink">{metric.value}</span>{" "}
                            <span className="meta">{metric.unit}</span>
                          </td>
                          <td className="meta">{plainPhrase(metric.dataset_scope)}</td>
                          <td className="meta">{plainPhrase(metric.limitation)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Disclosure summary="How to reproduce these figures">
                  <dl className="datalist">
                    <DataRow label="Dataset">
                      <span className="mono">{metrics.dataset_id}</span>
                      <p className="meta">{metrics.label}</p>
                    </DataRow>
                    <DataRow label="Dataset fingerprint">
                      <Hash value={metrics.dataset_sha256} label="dataset" />
                    </DataRow>
                  </dl>
                  <p className="meta">These commands are for your technical auditor.</p>
                  <dl className="datalist">
                    <DataRow label="Re-run command">
                      <span className="mono">
                        cd services/api &amp;&amp; REGOS_OFFLINE=1 uv run python
                        scripts/measure_prototype.py
                      </span>
                    </DataRow>
                    <DataRow label="Verification command">
                      <span className="mono">{metrics.metrics[0]?.test_command}</span>
                    </DataRow>
                  </dl>
                </Disclosure>
              </div>
            )}
          </Fold>

          {/* ---- Benchmark ---------------------------------------------- */}
          {benchmark && (
            <Fold
              id="fr-benchmark"
              openId={openFold}
              onToggle={onToggleFold}
              title="Measured benchmark"
              meta={`${benchmark.passed} correct, ${benchmark.failed} not correct of ${benchmark.cases.length} cases`}
            >
              <div className="stack">
                <p className="meta">{plainPhrase(benchmark.label)}</p>
                <SegBar
                  segments={[
                    { label: "Correct", count: benchmark.passed, tone: "ok" },
                    { label: "Not correct", count: benchmark.failed, tone: "review" },
                  ]}
                  ariaLabel={`${benchmark.passed} correct, ${benchmark.failed} not correct of ${benchmark.cases.length} cases`}
                />

                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Setting</th>
                        <th scope="col" className="table-num">Answered</th>
                        <th scope="col" className="table-num">Wrong when answered</th>
                        <th scope="col" className="table-num">Handed to a human</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchmark.operating_points.map((point) => (
                        <tr key={point.setting}>
                          <td>
                            <span className="strong-ink">{labelOf(point.setting)}</span>
                            <p className="meta">{plainPhrase(point.policy)}</p>
                          </td>
                          <td className="table-num">
                            <InlineBar
                              value={point.answered_pct}
                              max={100}
                              tone="accent"
                              label={`Answered, ${labelOf(point.setting)}`}
                              figure={`${point.answered_pct}%`}
                            />
                            <p className="meta">{point.answered} of {point.total}</p>
                          </td>
                          <td className="table-num">
                            <span className="strong-ink">{point.error_rate_on_answered}%</span>
                            <p className="meta">{point.incorrect_answers} wrong</p>
                          </td>
                          <td className="table-num">
                            <InlineBar
                              value={point.deferred_pct}
                              max={100}
                              tone="review"
                              label={`Handed to a human, ${labelOf(point.setting)}`}
                              figure={`${point.deferred_pct}%`}
                            />
                            <p className="meta">{point.deferred} of {point.total}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Disclosure summary={`Every benchmark case and its outcome (${benchmark.cases.length})`}>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Case</th>
                          <th scope="col">Expected</th>
                          <th scope="col">Actual</th>
                          <th scope="col">Outcome</th>
                        </tr>
                      </thead>
                      <tbody>
                        {benchmark.cases.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <span className="strong-ink">{item.name}</span>
                              <p className="meta mono">{item.source_span_id}</p>
                            </td>
                            <td className="meta">{plainValue(item.expected)}</td>
                            <td className="meta">{plainValue(item.actual)}</td>
                            <td><StateLabel value={item.outcome} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Disclosure>
              </div>
            </Fold>
          )}

          {/* ---- Raw events --------------------------------------------- */}
          <RecordedEvents
            events={state.audit_events}
            openId={openFold}
            onToggle={onToggleFold}
          />
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Recorded events — the hash-chained timeline, filterable by what acted.
 * ------------------------------------------------------------------------- */

const EVENT_FILTERS = [
  { id: "ALL", label: "All", test: () => true },
  { id: "DECISIONS", label: "Decisions", test: (t: string) => /READING|POLICY|APPROV|REVIEW|RECLASS/i.test(t) },
  { id: "CHECKS", label: "Checks", test: (t: string) => /TEST|BUILD|GATE|VERIF|CHECK/i.test(t) },
  { id: "AGENTS", label: "Assistants", test: (t: string) => /AGENT/i.test(t) },
  { id: "EXPORTS", label: "Downloads", test: (t: string) => /EXPORT|REPORT|DOWNLOAD|PACKET/i.test(t) },
] as const;

function eventTone(eventType: string): "ok" | "review" | "neutral" {
  if (/READING|POLICY|APPROV|REVIEW|RECLASS/i.test(eventType)) return "review";
  if (/VERIF/i.test(eventType)) return "ok";
  return "neutral";
}

/** How many of the most recent events stay open; the rest fold, none are dropped. */
const RECENT_EVENTS = 12;

function RecordedEvents({
  events,
  openId,
  onToggle,
}: {
  events: WorkspaceState["audit_events"];
  openId: string | null;
  onToggle: (id: string, open: boolean) => void;
}) {
  const [filter, setFilter] = useState<(typeof EVENT_FILTERS)[number]["id"]>("ALL");
  const active = EVENT_FILTERS.find((item) => item.id === filter) ?? EVENT_FILTERS[0];
  const visible = events.filter((event) => active.test(event.event_type));

  const toItem = (event: WorkspaceState["audit_events"][number]) => ({
    id: event.id,
    title: (
      <>
        {eventLabelOf(event.event_type)}
        <span className="mono timeline-id">{event.id}</span>
      </>
    ),
    meta: `${event.actor} · ${formatTimestamp(event.created_at)}`,
    tone: eventTone(event.event_type),
  });

  const split = Math.max(0, visible.length - RECENT_EVENTS);
  const earlier = visible.slice(0, split);
  const recent = visible.slice(split);

  return (
    <Fold
      id="fr-events"
      openId={openId}
      onToggle={onToggle}
      title="Every recorded event"
      meta={`${events.length} recorded`}
    >
      <div className="stack">
        <div className="audit-filters" role="group" aria-label="Filter recorded events">
          {EVENT_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`audit-filter${filter === item.id ? " audit-filter--on" : ""}`}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <Empty
            title="Nothing of this kind has been recorded yet"
            hint="Choose “All” to see every event."
            action={
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() => setFilter("ALL")}
              >
                Show every event
              </button>
            }
          />
        ) : (
          <div className="stack-s">
            {earlier.length > 0 && (
              <Disclosure summary={`Everything recorded before these (${earlier.length})`}>
                <Timeline items={earlier.map(toItem)} />
              </Disclosure>
            )}
            <Timeline items={recent.map(toItem)} />
            {earlier.length > 0 && (
              <p className="micro">
                Showing the {recent.length} most recent of {visible.length} recorded events.
              </p>
            )}
          </div>
        )}
      </div>
    </Fold>
  );
}
