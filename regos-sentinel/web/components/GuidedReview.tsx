"use client";

import { animate, stagger } from "animejs";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  checkLabel,
  cscrfCategoryLabel,
  formatDate,
  formatTimestamp,
  labelOf,
  plainPhrase,
  workTypeOf,
} from "../lib/presentation";
import type {
  BuildRun,
  LiveSourceVerificationReceipt,
  WorkspaceState,
} from "../lib/types";
import {
  Callout,
  CompareCols,
  DataRow,
  Disclosure,
  Field,
  Hash,
  Meter,
  Panel,
  Quote,
  Stat,
  StatRow,
  StateLabel,
  Tag,
} from "./ui";
import { IncidentReportingClock } from "./IncidentReportingClock";
import { RegulationMap } from "./impact/RegulationMap";

/**
 * The five stages, in the officer's words. This array is the single source of
 * truth: the progress line and the section headings both read from it, so a
 * rename can never leave the two disagreeing.
 *
 * "Read the source" replaced "Get the official text" — the text is already
 * here; the job is to read the passage that was cited.
 */
const STEPS = [
  "Read the source",
  "Compare",
  "Make a decision",
  "What changes",
  "Download record",
] as const;

/** One heading grammar for every stage, numbered from the same array. */
function StageHead({ index }: { index: number }) {
  return (
    <h2 className="jr-h">
      <span>{index + 1}</span> {STEPS[index]}
    </h2>
  );
}

type StepState = "upcoming" | "current" | "done" | "blocked";

/** What a screen reader hears in place of the rail's coloured dot. */
const STEP_STATE_WORD: Record<StepState, string> = {
  upcoming: "not started",
  current: "current step",
  done: "completed",
  blocked: "needs your decision",
};


/**
 * The hero moment, set out as facts rather than prose.
 *
 * Three rows and a trace. The middle row is the one this product exists for:
 * the source gives a period and never gives the event it runs from, so the
 * third row cannot hold a date. "Cannot be computed" is white and large — not
 * coral, not an error, not an empty grey box. It is the system working.
 *
 * Every line comes from the engine's own `calculation_trace`. Writing a
 * plausible-looking derivation here instead would be the exact failure the
 * screen is built to demonstrate the absence of.
 */
function ExtractionAnalysis({
  deadline,
}: {
  deadline: WorkspaceState["deadline_computations"][number];
}) {
  return (
    <section className="rx" aria-label="How this deadline was worked out">
      <div className="rx-facts">
        <div className="rx-fact">
          <p className="romer-micro">Deadline</p>
          <p className="rx-value">{deadline.duration_label}</p>
          <StateLabel value={deadline.duration_provenance} />
        </div>
        <div className="rx-fact">
          <p className="romer-micro">Clock starts from</p>
          <p className="rx-absent">
            {deadline.trigger_label ?? "— not stated in the source —"}
          </p>
        </div>
        <div className="rx-fact">
          <p className="romer-micro">Due date</p>
          <p className={deadline.due_date ? "rx-value" : "rx-cannot"}>
            {deadline.due_date ? formatDate(deadline.due_date) : "Cannot be computed"}
          </p>
        </div>
        {!deadline.computable && (
          <p className="rx-blocked">
            <span aria-hidden="true">!</span>
            Blocked — a named reviewer has to record what starts the clock.
          </p>
        )}
      </div>

      <div className="rx-trace">
        <p className="romer-micro">How this was worked out</p>
        <ol className="rx-trace-list">
          {deadline.calculation_trace.map((line) => {
            const missing = /absent|cannot|not stated/i.test(line);
            return (
              <li className="rx-trace-row" key={line}>
                <span
                  className={`rx-trace-mark rx-trace-mark--${missing ? "review" : "ok"}`}
                  aria-hidden="true"
                >
                  {missing ? "!" : "✓"}
                </span>
                <span>{plainPhrase(line)}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/** `FAQ-Q17-A` → `Q17(a)`. A relabelling of a real id, never a new fact. */
function questionLabelOf(spanId: string): string {
  const bare = spanId.replace(/^FAQ-/, "");
  const parts = /^([A-Za-z]+\d+)-([A-Za-z])$/.exec(bare);
  return parts ? `${parts[1]}(${parts[2].toLowerCase()})` : bare;
}

interface GuidedReviewProps {
  state: WorkspaceState;
  receipt: LiveSourceVerificationReceipt | null;
  sourceError: string | null;
  busy: boolean;
  sourceBusy: boolean;
  onVerifySource: () => Promise<void>;
  onRunBuild: () => Promise<void>;
  onResolveReferences: () => Promise<void>;
  onCommitReading: (input: {
    reviewer_name: string;
    reviewer_role: string;
    independent_interpretation: string;
    trigger_policy: string;
  }) => Promise<void>;
  onApprove: (input: {
    reviewer_name: string;
    reviewer_role: string;
    reason: string;
    trigger_policy: string;
    trigger_date: string;
    agrees_with_system_suggestion: boolean;
  }) => Promise<void>;
  onDownloadReport: () => Promise<void>;
  onDownloadBeforeAfter: () => Promise<void>;
  /** Jump to the Full record tab — the workflow's final destination. */
  onOpenAudit?: () => void;
}

export function GuidedReview(props: GuidedReviewProps) {
  const { state, receipt, busy, sourceBusy } = props;
  const reducedMotion = useReducedMotion();

  const build: BuildRun | undefined = state.builds.at(-1);
  const approved = build?.status === "APPROVED";
  const blocked = build?.status === "BLOCKED_AWAITING_HUMAN";
  const failedTests = build?.tests.filter((test) => test.status === "FAIL") ?? [];
  const reviewNeededTests = build?.tests.filter((test) => test.status === "BLOCK") ?? [];

  const referencesLoaded = state.references.length > 0
    && state.references.every((item) => item.status === "RESOLVED_HASHED");
  const reading = state.reviewer_readings.find((item) => item.span_id === "FAQ-Q17-A");
  const approval = state.reviews.at(-1);
  const blockedDeadline = state.deadline_computations.find(
    (item) => item.finding_id === "F-001" && !item.computable,
  );

  const q17a = state.source_spans.find((span) => span.id === "FAQ-Q17-A");
  const q15 = state.source_spans.find((span) => span.id === "FAQ-Q15");
  const control = state.controls[0];
  const document = state.documents[0];

  const stepStates = useMemo<StepState[]>(() => {
    const steps: StepState[] = ["upcoming", "upcoming", "upcoming", "upcoming", "upcoming"];
    steps[0] = receipt ? "done" : "current";
    if (receipt || build) steps[0] = "done";
    if (build) steps[1] = approved ? "done" : "blocked";
    else steps[1] = receipt ? "current" : "upcoming";
    if (approved) steps[2] = "done";
    else if (blocked) steps[2] = "blocked";
    if (approved) {
      steps[3] = "done";
      steps[4] = "current";
    }
    return steps;
  }, [receipt, build, approved, blocked]);

  const computedDeadline = state.deadline_computations.find((item) => item.computable);
  const activeStep = stepStates.findIndex(
    (status) => status === "current" || status === "blocked",
  );

  /* How the source and the firm's practice relate, read from the run's own
     status — never inferred from a count. Amber is the expected human-input
     state; red is only ever a build that actually failed its checks. */
  const relation: { word: string; tone: "ok" | "review" | "fail" | "neutral" } = approved
    ? { word: "Matches", tone: "ok" }
    : blocked
      ? { word: "Needs your decision", tone: "review" }
      : build?.status === "FAILED"
        ? { word: "Check failed", tone: "fail" }
        : { word: "Compared", tone: "neutral" };

  /* The firm's rule as it stands right now: before approval that is the wording
     the control carried into this review; after approval it is the new version. */
  const firmRule = control
    ? approved
      ? control.rule_summary
      : control.previous_rule_summary ?? control.rule_summary
    : null;

  return (
    <div className="jr-shell jr-shell--solo">
      <div className="stack-l jr-body">
      <header className="jr-journey-head">
        <div className="stack-s">
          <h1 className="page-title">Review a requirement</h1>
          <p className="lede">
            Follow the cited source, check the firm&rsquo;s control, and record a human
            decision only where the source leaves a gap.
          </p>
        </div>
        <ol className="jr-progress" aria-label="Review progress">
          {STEPS.map((label, index) => {
            const status = stepStates[index];
            const here = index === activeStep;
            return (
              <li
                key={label}
                className={`jr-progress-item jr-progress-item--${status}`}
                aria-current={here ? "step" : undefined}
              >
                <span className="jr-progress-index" aria-hidden="true">
                  {status === "done" ? "✓" : status === "blocked" ? "!" : index + 1}
                </span>
                <span>
                  {label}
                  <span className="visually-hidden"> — {STEP_STATE_WORD[status]}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </header>
      {/* ---- The journey, in the order it is read -------------------------
          Only the steps that have a real prerequisite are rendered. This keeps
          the officer focused on the next accountable action rather than a wall
          of locked cards. */}
      <div className="stack-l">
          {/* Context, not a stage: it carries no action and no number, so the five
              numbered headings below match the five items in the progress line. */}
          <section className="jr-sect" id="jr-s0">
            <p className="romer-micro">Context parameters</p>
            <dl className="datalist jr-case-strip">
              <DataRow label="Firm">
                <span className="strong-ink">{state.entity_profile.legal_name}</span>{" "}
                <span className="meta">
                  · {cscrfCategoryLabel(state.entity_profile.cscrf_category)} · Synthetic
                  demo data
                </span>
              </DataRow>
              <DataRow label="Rule in force today">
                {control ? (
                  <>
                    <span className="romer-id">{control.id}</span>
                    <p className="meta romer-rule">{firmRule}</p>
                  </>
                ) : (
                  <span className="meta">No control recorded for this firm yet.</span>
                )}
              </DataRow>
              <DataRow label="What changed">
                <span className="strong-ink">
                  {state.findings.length} high-severity finding
                  {state.findings.length === 1 ? "" : "s"}
                </span>
                {state.findings.length > 0 && (
                  <ul className="romer-idlist">
                    {state.findings.map((finding) => (
                      <li key={finding.id}>
                        <span className="romer-id" title={finding.title}>{finding.id}</span>
                        <span className="meta">{finding.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </DataRow>
            </dl>
          </section>

          {/* Stage 1 — one source sheet. The passage is the object being read;
              the official link and the document check code support it, and the
              stage carries exactly one primary action: start the review. */}
          <section className="jr-sect" id="jr-s1">
            <StageHead index={0} />
            {document ? (
              <div className="src">
                <div className="src-head">
                  <span className="jr-docglyph" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.6a1 1 0 0 1 .7.3l5.4 5.4a1 1 0 0 1 .3.7V19a2 2 0 0 1-2 2z" />
                    </svg>
                  </span>
                  <div className="src-head-text">
                    <p className="src-title">{document.title}</p>
                    <p className="meta">
                      {document.authority} · published {formatDate(document.published_at)}
                    </p>
                  </div>
                  <a
                    className="proof-link src-open"
                    href={document.source_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open official source ↗
                  </a>
                </div>

                {q17a && (
                  <Quote
                    locator={q17a.locator}
                    text={q17a.text}
                    sourceUrl={q17a.source_url}
                    sourceLabel="Open the SEBI FAQ at this page"
                  />
                )}

                <div className="src-foot">
                  <span className="src-check">
                    <span className="micro">Document check code</span>
                    <Hash value={document.content_hash} label="source document" />
                  </span>
                  <span className="src-state">
                    {receipt ? (
                      <>
                        <StateLabel value={receipt.status} />
                        <span className="meta">
                          {receipt.matched_span_ids.length} of {receipt.checked_span_count}{" "}
                          reviewed passages found again in the file SEBI serves today ·{" "}
                          {formatTimestamp(receipt.checked_at)}
                        </span>
                      </>
                    ) : (
                      <span className="meta">
                        A saved copy of this exact text. It has not been checked against the
                        page SEBI serves today.
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="btn btn--secondary btn--small src-verify"
                    disabled={busy || sourceBusy}
                    onClick={() => void props.onVerifySource()}
                  >
                    {sourceBusy && <span className="spinner" aria-hidden="true" />}
                    {sourceBusy
                      ? "Reading the SEBI PDF…"
                      : receipt
                        ? "Check the official page again"
                        : "Check it against the official page"}
                  </button>
                </div>

                {props.sourceError && (
                  <Callout tone="review" title="The official page could not be read just now">
                    <p>
                      The saved reviewed copy is still available, and this run will record that
                      the live check was unavailable.
                    </p>
                    <p className="meta">{props.sourceError}</p>
                  </Callout>
                )}

                <Disclosure summary="All details about this source">
                  <StepSource {...props} />
                </Disclosure>

                <div className="jr-next">
                  {build ? (
                    <StateLabel value={build.status} />
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn--primary"
                        disabled={busy || sourceBusy}
                        onClick={() => void props.onRunBuild()}
                      >
                        {busy && <span className="spinner" aria-hidden="true" />}
                        Start the review
                      </button>
                      <p className="meta">
                        RegOS reads this passage against the firm&rsquo;s control and stops
                        wherever the source does not state something.
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="jr-locked">No SEBI document added yet — add one to start.</p>
            )}
          </section>

          {build && <section className="jr-sect" id="jr-s2">
            <StageHead index={1} />
            {build ? (
              <>
                {/* Source on the left, the firm's practice on the right, and the
                    relationship between them named in words between the two. Two
                    columns from 860px, stacked below it. */}
                <div className={`vs vs--${relation.tone}${reducedMotion ? " vs--still" : ""}`}>
                  <div className="vs-col vs-col--source">
                    <p className="micro">What the source says</p>
                    <div className="vs-body vs-body--quote">
                      <NumberedExcerpt
                        sections={q17a ? [{ locator: `${q17a.locator} · the rule under review`, text: q17a.text, hot: true }] : []}
                      />
                    </div>
                    {q17a && (
                      <a className="proof-link" href={q17a.source_url} target="_blank" rel="noreferrer">
                        Open official source ↗
                      </a>
                    )}
                  </div>

                  <div className="vs-rel" role="presentation">
                    <span className="vs-line" aria-hidden="true" />
                    <span className="vs-verdict">{relation.word}</span>
                  </div>

                  <div className="vs-col vs-col--firm">
                    <p className="micro">What the firm does today</p>
                    <div className="vs-body">
                      {control ? (
                        <>
                          <p className="strong-ink">{firmRule}</p>
                          <p className="meta">
                            {control.id} · {control.name} · version {control.version}
                          </p>
                        </>
                      ) : (
                        <p className="meta">No control recorded for this firm yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* The absent source fact stays in the normal reading path, with
                    its citation, wherever a decision depends on it. */}
                {blockedDeadline && !approved && (
                  <ExtractionAnalysis deadline={blockedDeadline} />
                )}
                <Disclosure summary="The full comparison">
                  <StepCompare
                    state={state}
                    build={build}
                    control={control}
                    q15={q15}
                    q17a={q17a}
                    blockedDeadline={blockedDeadline}
                    failedTests={failedTests}
                    reviewNeededTests={reviewNeededTests}
                    approved={approved}
                  />
                </Disclosure>
              </>
            ) : (
              <p className="jr-locked">Run the check to compare the rule against this firm.</p>
            )}
          </section>}

          {(blocked || approved) && <section className="jr-sect" id="jr-s3">
            <StageHead index={2} />
            {blocked ? (
              <>
                <div className="jr-doccard jr-doccard--left jr-doccard--attn">
                  <span className="micro">Needs a person</span>
                  <p className="meta">
                    {blockedDeadline?.duration_label ?? "The period"} is stated in{" "}
                    {q17a?.locator ?? "the cited source"}. The event it runs from is{" "}
                    <span className="strong-ink">not stated in the reviewed source</span>, so
                    RegOS does not work out a date. Record the firm&rsquo;s clock-start policy
                    below — it is filed as your decision, never as wording from SEBI.
                  </p>
                </div>
                {/* The form is the outcome's next step, so it sits immediately
                    beneath it rather than in a panel further down the page. */}
                <StepHumanDecision
                  {...props}
                  q17a={q17a}
                  document={document}
                  referencesLoaded={referencesLoaded}
                  reading={reading}
                  blockedDeadline={blockedDeadline}
                />
              </>
            ) : approved && reading ? (
              <div className="jr-doccard jr-doccard--left">
                <span className="micro">Recorded</span>
                <p className="meta">
                  {reading.reviewer_name} ({reading.reviewer_role}) recorded the reading and
                  the clock-start policy in writing. The full record keeps every word.
                </p>
              </div>
            ) : (
              <p className="jr-locked">
                The decision opens when the check finds something only a person may settle.
              </p>
            )}
          </section>}

          {build && <section className="jr-sect" id="jr-s4">
            <StageHead index={3} />
            {build ? (
              <>
                <CompareCols
                  before={{
                    label: approved && control
                      ? `Before · version ${control.version - 1}`
                      : "In force today",
                    body: (
                      <p className={approved ? "jr-struck" : undefined}>
                        {control
                          ? control.previous_rule_summary ?? control.rule_summary
                          : "No control recorded for this firm yet."}
                      </p>
                    ),
                  }}
                  after={{
                    label: approved && control
                      ? `After · version ${control.version}`
                      : "What the source requires",
                    body: approved && control ? (
                      <div className="stack-s">
                        <p>{control.rule_summary}</p>
                        {computedDeadline && (
                          <p className="meta">
                            First due date{" "}
                            <span className="strong-ink">{formatDate(computedDeadline.due_date)}</span>{" "}
                            · {computedDeadline.citation.locator}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="stack-s">
                        <p>
                          High-severity finding caused by a missing patch: one week
                          {q17a && <span className="meta"> · {q17a.locator}</span>}
                        </p>
                        <p>
                          Every other finding: three months
                          {q15 && <span className="meta"> · {q15.locator}</span>}
                        </p>
                        <p className="meta">
                          No due date is worked out until a person records when the week starts.
                        </p>
                      </div>
                    ),
                  }}
                />
                <p className="meta">One rule became two, because the source says two.</p>
                {approved && (
                  <Disclosure summary="Everything this change affects: controls, dates, tasks, evidence">
                    <StepImpact
                      state={state}
                      build={build}
                      reducedMotion={Boolean(reducedMotion)}
                      onRunCheck={() => void props.onRunBuild()}
                    />
                  </Disclosure>
                )}
              </>
            ) : (
              <p className="jr-locked">Changes appear after the check runs.</p>
            )}
          </section>}

          {approved && <section className="jr-sect" id="jr-s5">
            <StageHead index={4} />
            {approved && build && reading ? (
              <>
                <div className="decision-sealed" role="status" aria-live="polite">
                  <span className="decision-sealed-badge">Record sealed</span>
                  <span className="decision-sealed-check" aria-hidden="true">✓</span>
                  <div className="decision-sealed-body">
                    <p className="decision-sealed-title">Decision approved</p>
                    <p className="meta">The approval and its evidence are now locked together.</p>
                  </div>
                  <span className="decision-sealed-divider" aria-hidden="true" />
                  <p className="decision-sealed-by">
                    Recorded by{" "}
                    <strong>
                      {approval?.reviewer_name ?? reading.reviewer_name},{" "}
                      {approval?.reviewer_role ?? reading.reviewer_role}
                    </strong>
                  </p>
                  {state.latest_manifest?.build_id === build.id && (
                    <span
                      className="decision-sealed-sha mono"
                      title={`Record fingerprint: ${state.latest_manifest.manifest_sha256}`}
                    >
                      Record check code · {state.latest_manifest.manifest_sha256.slice(0, 12)}…
                    </span>
                  )}
                </div>
                <div className="jr-tiles">
                  <button type="button" className="jr-tile" disabled={busy}
                    onClick={() => void props.onDownloadReport()}>
                    <span className="jr-docglyph" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 21h10a2 2 0 0 0 2-2V9.4a1 1 0 0 0-.3-.7l-5.4-5.4a1 1 0 0 0-.7-.3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
                      </svg>
                    </span>
                    The full report
                  </button>
                  <button type="button" className="jr-tile" disabled={busy}
                    onClick={() => void props.onDownloadBeforeAfter()}>
                    <span className="jr-docglyph" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.6a1 1 0 0 1 .7.3l5.4 5.4a1 1 0 0 1 .3.7V19a2 2 0 0 1-2 2z" />
                      </svg>
                    </span>
                    Before and after
                  </button>
                </div>
                {props.onOpenAudit && (
                  <button type="button" className="btn btn--quiet btn--small" onClick={props.onOpenAudit}>
                    See the full record
                  </button>
                )}
              </>
            ) : (
              <p className="jr-locked">Proof unlocks when a named person approves the decision.</p>
            )}
          </section>}
      </div>

      <p className="meta jr-foot">
        {approved
          ? "Decision support — a person approved every outcome on this page."
          : "Decision support only — nothing on this page is final until a person approves it."}
      </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Step 1 — Source
 * ------------------------------------------------------------------------- */

/** The document fingerprint as its own card — the full value, and a copy chip. */
function HashCard({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="hash-card">
      <p className="micro">{label}</p>
      <p className="hash-card-value mono" aria-label={`${label}, full value`}>{value}</p>
      <button
        type="button"
        className="hash-copy hash-card-copy"
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(
            () => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            },
            () => setCopied(false),
          );
        }}
      >
        {copied ? "✓ Copied" : "⧉ Copy fingerprint"}
      </button>
    </div>
  );
}

function StepSource({
  state,
  receipt,
  sourceError,
  sourceBusy,
  busy,
  onVerifySource,
}: GuidedReviewProps) {
  const document = state.documents[0];
  return (
    <Panel
      id="step-source"
      title="1 · Verify what SEBI published"
      description="Download the official document and record its fingerprint."
      aside={receipt ? <StateLabel value={receipt.status} /> : <StateLabel value="READY" />}
    >
      <div className="stack">
        <HashCard label="Source document fingerprint" value={document.content_hash} />
        <dl className="datalist">
          <DataRow label="Document">{document.title}</DataRow>
          <DataRow label="Published">{formatDate(document.published_at)}</DataRow>
          <DataRow label="Official URL">
            <a
              className="proof-link"
              href={document.source_url}
              target="_blank"
              rel="noreferrer"
            >
              Open official source ↗
            </a>
          </DataRow>
          <DataRow label="Document fingerprint">
            <Hash value={document.content_hash} />
            <p className="meta">
              This fingerprint covers the four excerpts a person verified, not the whole PDF.
            </p>
          </DataRow>
          <DataRow label="Reviewed passages">
            {state.source_spans.filter((span) => span.document_id === document.id).length}
          </DataRow>
          {receipt && (
            <>
              <DataRow label="Live file">
                {receipt.page_count} pages · {(receipt.byte_count / 1024).toFixed(1)}{" "}
                KB ·{" "}
                {receipt.http_status === 200
                  ? "the SEBI page responded normally"
                  : `the SEBI page responded with an error (code ${receipt.http_status})`}
              </DataRow>
              <DataRow label="Live file fingerprint">
                <Hash value={receipt.document_sha256} />
              </DataRow>
              <DataRow label="Checked at">{formatTimestamp(receipt.checked_at)}</DataRow>
            </>
          )}
        </dl>

        {receipt && (
          <Meter
            label="Passages found in the live file"
            value={receipt.matched_span_ids.length}
            max={receipt.checked_span_count}
            tone={
              receipt.matched_span_ids.length === receipt.checked_span_count ? "ok" : "review"
            }
            valueLabel={`${receipt.matched_span_ids.length}/${receipt.checked_span_count}`}
            hint={
              receipt.matched_span_ids.length === receipt.checked_span_count
                ? "Every reviewed passage was found again in the file SEBI is serving today."
                : "Some reviewed passages were not found in the file SEBI is serving today."
            }
          />
        )}

        {receipt && (
          <Callout tone="ok" title="Source verified">
            <p>{receipt.note}</p>
          </Callout>
        )}

        {sourceError && (
          <Callout tone="review" title="Live verification unavailable">
            <p>
              We could not verify the live source. The saved reviewed copy is still available,
              but this run will record that live verification was unavailable.
            </p>
            <p className="meta">{sourceError}</p>
          </Callout>
        )}

        <div className="btn-row">
          <button
            type="button"
            className="btn btn--secondary"
            disabled={sourceBusy || busy}
            onClick={() => void onVerifySource()}
          >
            {sourceBusy && <span className="spinner" aria-hidden="true" />}
            {sourceBusy
              ? "Reading the SEBI PDF…"
              : receipt
                ? "Verify official source again"
                : "Verify official source"}
          </button>
        </div>
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------------------------
 * Step 2 — Compare
 * ------------------------------------------------------------------------- */

function StepCompare({
  state,
  build,
  control,
  q15,
  q17a,
  blockedDeadline,
  failedTests,
  reviewNeededTests,
  approved,
}: {
  state: WorkspaceState;
  build: BuildRun;
  control: WorkspaceState["controls"][number];
  q15?: WorkspaceState["source_spans"][number];
  q17a?: WorkspaceState["source_spans"][number];
  blockedDeadline?: WorkspaceState["deadline_computations"][number];
  failedTests: BuildRun["tests"];
  reviewNeededTests: BuildRun["tests"];
  approved: boolean;
}) {
  return (
    <Panel
      id="step-compare"
      title={approved ? "2 · The existing control was too broad" : "2 · The existing control is too broad"}
      description="The firm's control vs the source text."
      aside={<StateLabel value={build.status} />}
    >
      <div className="stack">
        <div className="rcx-doc">
          <div className="rcx-doc-head">
            <p className="strong-ink">Original SEBI text</p>
            {state.documents[0] && <p className="micro">{state.documents[0].title}</p>}
          </div>
          <div className="rcx-doc-body">
            <NumberedExcerpt
              sections={[
                ...(q17a ? [{ locator: `${q17a.locator} · the rule under review`, text: q17a.text, hot: true }] : []),
                ...(q15 ? [{ locator: q15.locator, text: q15.text, hot: false }] : []),
              ]}
            />
          </div>
        </div>

        {/* One comparison, one table: each finding on a row, the source and the
            firm's control in the same two columns every time. */}
        <div className="stack-s">
          <p className="sub-title">Impact on the firm&rsquo;s controls</p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Finding</th>
                  <th scope="col">What the source says</th>
                  <th scope="col">What the firm&rsquo;s control says</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="strong-ink">New duty found</span></td>
                  <td className="meta">
                    <span className="strong-ink">One week</span> for high-severity missing
                    patches{q17a && <> ({q17a.locator})</>} and{" "}
                    <span className="strong-ink">three months</span> for other observations
                    {q15 && <> ({q15.locator})</>}.
                  </td>
                  <td className="meta">
                    {control.id} closes every security-test (VAPT) finding in three months.
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span className={`rcx-chip${approved ? " rcx-chip--ok" : ""}`}>
                      {approved ? "Split into two rules" : "Action required"}
                    </span>
                  </td>
                </tr>

                {!approved && blockedDeadline && (
                  <tr>
                    <td><span className="strong-ink">Missing start date</span></td>
                    <td className="meta">
                      {blockedDeadline.duration_label}{" "}
                      <Tag value={blockedDeadline.duration_provenance} />
                      <br />
                      Starts from:{" "}
                      <span className="strong-ink">not stated in the reviewed source</span>.
                    </td>
                    <td className="meta">
                      <span className="strong-ink">No due date.</span> Nothing is calculated
                      until a compliance officer records the firm&rsquo;s clock-start policy.
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span className="rcx-chip rcx-chip--review">Needs your decision</span>
                    </td>
                  </tr>
                )}

                <tr>
                  <td>
                    <span className="strong-ink">
                      {approved ? "Already covered" : "One control cannot cover both"}
                    </span>
                  </td>
                  <td className="meta">Two deadlines, for two different kinds of finding.</td>
                  <td className="meta">
                    {approved ? (
                      <>
                        Split into two rules after {build.reviewer}{" "}
                        recorded the firm&rsquo;s clock-start policy in writing.
                      </>
                    ) : (
                      <>
                        One broad three-month control cannot represent both requirements.
                        {(failedTests.length > 0 ? failedTests : reviewNeededTests.slice(0, 1)).map(
                          (test) => (
                            <span key={test.id} style={{ display: "block", marginTop: "4px" }}>
                              {checkLabel(test.id, test.name)} — {test.message}
                            </span>
                          ),
                        )}
                      </>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span className={`rcx-chip rcx-chip--${approved ? "ok" : "fail"}`}>
                      {approved ? "Compliant" : "Did not pass"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {!approved && (
          <div className="rcx-actionbar">
            <p>This decision is recorded against your name.</p>
            <div className="btn-row">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => document.querySelector("#step-human")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                Record my decision
              </button>
            </div>
          </div>
        )}

        {state.findings.length > 0 && (
          <div className="stack-s" style={{ marginTop: "16px" }}>
            <p className="sub-title">Reporting clocks for each finding</p>
            <IncidentReportingClock state={state} compact />
          </div>
        )}

        <details className="disclosure">
          <summary>
            All {build.tests.length} checks in this run
          </summary>
          <div className="disclosure-body">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Check</th>
                    <th scope="col">Result</th>
                    <th scope="col">What it found</th>
                  </tr>
                </thead>
                <tbody>
                  {build.tests.map((test) => (
                    <tr key={test.id}>
                      <td>{checkLabel(test.id, test.name)}</td>
                      <td><StateLabel value={test.status} /></td>
                      <td className="meta">{test.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------------------------
 * Step 3 — Human decision (preserves the commit-before-reveal gate)
 * ------------------------------------------------------------------------- */

/** Preset clock-start policies the firm can adopt. The last is the honest default. */
const TRIGGER_POLICIES = [
  { id: "discovery", label: "Date of discovery", policy: "Date the finding is recorded in the entity vulnerability register" },
  { id: "vapt", label: "Date the vulnerability-test (VAPT) report is submitted", policy: "Date the VAPT report is submitted to the entity" },
  { id: "patch", label: "Date the manufacturer's (OEM) patch became available", policy: "Date the missing OEM patch becomes available" },
  { id: "none", label: "No policy (default)", policy: "" },
] as const;

/**
 * Client-side due-date preview: trigger date + the duration the source states.
 * A preview only — the engine computes and records the real date on approval.
 */
function previewDueDate(dateStr: string, durationLabel: string | undefined): string | null {
  if (!dateStr) return null;
  const match = /(\d+)\s*(day|week|month)/i.exec(durationLabel ?? "1 week");
  if (!match) return null;
  const n = Number(match[1]);
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  if (/day/i.test(match[2])) date.setDate(date.getDate() + n);
  else if (/week/i.test(match[2])) date.setDate(date.getDate() + n * 7);
  else date.setMonth(date.getMonth() + n);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StepHumanDecision({
  state,
  busy,
  q17a,
  document,
  referencesLoaded,
  reading,
  blockedDeadline,
  onResolveReferences,
  onCommitReading,
  onApprove,
}: GuidedReviewProps & {
  q17a?: WorkspaceState["source_spans"][number];
  document: WorkspaceState["documents"][number];
  referencesLoaded: boolean;
  reading?: WorkspaceState["reviewer_readings"][number];
  blockedDeadline?: WorkspaceState["deadline_computations"][number];
}) {
  const [reviewerName, setReviewerName] = useState("Aditi Rao");
  const [reviewerRole, setReviewerRole] = useState("Compliance Officer");
  const [interpretation, setInterpretation] = useState("");
  const [policyChoice, setPolicyChoice] = useState<string>("none");
  const [customPolicy, setCustomPolicy] = useState("");
  const [triggerPolicy, setTriggerPolicy] = useState("");
  const [triggerDate, setTriggerDate] = useState("2026-07-22");
  const [reason, setReason] = useState("");
  const [agreement, setAgreement] = useState<"" | "AGREE" | "DISAGREE">("");
  const [touched, setTouched] = useState(false);

  const nameError = touched && reviewerName.trim().length < 2
    ? "Enter the name of the person recording this decision. The report names them."
    : null;
  const roleError = touched && reviewerRole.trim().length < 2
    ? "Enter the role this person holds, for example Compliance Officer."
    : null;
  const interpretationError = touched && interpretation.trim().length < 8
    ? "Write what you think the cited text supports, before RegOS shows you its reading."
    : null;
  const policyError = touched && triggerPolicy.trim().length < 8
    ? "Enter the event your firm treats as the start of the one-week period."
    : null;
  const reasonError = touched && reason.trim().length < 8
    ? "Enter a written reason for the trigger policy. The report must explain why this human decision was used."
    : null;
  const agreementError = touched && !agreement
    ? "Record whether your reading agrees with the draft interpretation."
    : null;

  const readingComplete = reviewerName.trim().length >= 2
    && reviewerRole.trim().length >= 2
    && interpretation.trim().length >= 8
    && triggerPolicy.trim().length >= 8;

  const approvalComplete = reason.trim().length >= 8 && Boolean(triggerDate) && Boolean(agreement);

  return (
    <Panel
      id="step-human"
      title="3 · Confirm when the one-week period starts"
      description="The source states how long, not from when. That gap is your policy decision."
      aside={<StateLabel value="BLOCKED_AWAITING_HUMAN" />}
    >
      <div className="stack">
        {/* -- Cited dependencies --------------------------------------- */}
        {!referencesLoaded ? (
          <Callout
            tone="review"
            title={`${state.references.length || "Four"} cited sections must be read first`}
          >
            <p>
              RegOS will not accept a decision until every section these answers point to is
              read and tied to an exact-copy fingerprint.
            </p>
            {state.references.length > 0 ? (
              <dl className="datalist">
                {state.references.map((reference) => (
                  <DataRow
                    key={reference.id}
                    label={`${questionLabelOf(reference.from_span_id)} points to`}
                  >
                    {reference.target_locator} <StateLabel value={reference.status} />
                  </DataRow>
                ))}
              </dl>
            ) : (
              <p className="meta">
                Q15 points to Table 19 and PR.MA Guideline 6, Q16 to Annexure-A, and Q17(a) to
                PR.MA.S3.
              </p>
            )}
            <div className="btn-row">
              <button
                type="button"
                className="btn btn--secondary btn--small"
                disabled={busy}
                onClick={() => void onResolveReferences()}
              >
                {busy && <span className="spinner" aria-hidden="true" />}
                Load the {state.references.length || 4} cited sections
              </button>
            </div>
          </Callout>
        ) : (
          <details className="disclosure" open={!reading}>
            <summary>
              {state.references.length} cited CSCRF sections read and saved as exact copies
            </summary>
            <div className="disclosure-body stack">
              {state.references.map((reference) => {
                const target = state.source_spans.find(
                  (span) => span.id === reference.target_span_id,
                );
                return (
                  <div key={reference.id} className="stack-s">
                    <div className="passage-head">
                      <span className="sub-title">
                        {target?.question ?? reference.target_locator}
                      </span>
                      <StateLabel value={reference.status} />
                    </div>
                    {target && (
                      <Quote
                        locator={target.locator}
                        text={target.text}
                        sourceUrl={target.source_url}
                        sourceLabel="Open governing CSCRF PDF"
                      />
                    )}
                    <p className="meta">{reference.resolution_note}</p>
                    {reference.target_hash && (
                      <p className="meta">
                        Excerpt check code (fingerprint) <Hash value={reference.target_hash} />
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        )}

        {/* -- The source, beside the decision --------------------------- */}
        {q17a && (
          <Quote
            locator={q17a.locator}
            text={q17a.text}
            sourceUrl={q17a.source_url}
            sourceLabel="Open the SEBI FAQ at this page"
          />
        )}

        {!reading ? (
          <div className="stack">
            <div className="decision-grid">
              {/* -- Left: your independent reading, then the locked draft -- */}
              <div className="decision-col">
                <div className="decision-card">
                  <p className="decision-card-title">Your independent reading</p>
                  <Field
                    label="Your observation"
                    hint="Write what the cited text supports, and what remains a firm decision."
                    error={interpretationError}
                  >
                    {(aria) => (
                      <textarea
                        {...aria}
                        rows={4}
                        value={interpretation}
                        onChange={(event) => setInterpretation(event.target.value)}
                      />
                    )}
                  </Field>
                  <button
                    type="button"
                    className="btn btn--quiet btn--small"
                    disabled={busy}
                    onClick={() =>
                      setInterpretation(
                        "Q17(a) supports a one-week maximum for high-severity findings caused by missing patches. It does not state which event starts that clock.",
                      )
                    }
                  >
                    Use the demo reading — you can edit it
                  </button>
                  <div className="field-grid">
                    <Field label="Reviewer name" error={nameError}>
                      {(aria) => (
                        <input
                          {...aria}
                          value={reviewerName}
                          onChange={(event) => setReviewerName(event.target.value)}
                          autoComplete="name"
                        />
                      )}
                    </Field>
                    <Field label="Role / designation" error={roleError}>
                      {(aria) => (
                        <input
                          {...aria}
                          value={reviewerRole}
                          onChange={(event) => setReviewerRole(event.target.value)}
                        />
                      )}
                    </Field>
                  </div>
                </div>

                {/* The draft stays physically on the page but unreadable —
                    skeleton lines behind blur, never real (or fake) words. */}
                <div className="decision-card decision-card--locked" aria-label="System suggestion, hidden until you record your reading">
                  <div className="decision-skel" aria-hidden="true">
                    <span style={{ width: "34%" }} />
                    <span style={{ width: "96%" }} />
                    <span style={{ width: "88%" }} />
                    <span style={{ width: "92%" }} />
                    <span style={{ width: "56%" }} />
                  </div>
                  <div className="decision-lock-overlay">
                    <span className="decision-lock-glyph" aria-hidden="true">
                      <svg width="26" height="26" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="9" width="12" height="8" rx="1.6" />
                        <path d="M7 9V6.6a3 3 0 0 1 6 0V9" />
                      </svg>
                    </span>
                    <p className="decision-lock-title">System suggestion</p>
                    <p className="meta">(Hidden until you record your reading)</p>
                  </div>
                </div>
              </div>

              {/* -- Right: the clock-start policy, live ----------------- */}
              <div className="decision-card">
                <p className="decision-card-title">Set the clock-start policy</p>
                <p className="meta">The source states the duration, not the start. That gap is yours.</p>

                <div className={`decision-preview-row${policyChoice === "none" ? " decision-preview-row--blocked" : ""}`}>
                  <span className="decision-preview-clock" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                  </span>
                  {policyChoice === "none" ? (
                    <span>
                      Live due date preview: <strong>no date</strong>
                      <span className="meta"> — RegOS will not compute one without a recorded policy.</span>
                    </span>
                  ) : (
                    <span>
                      Live due date preview:{" "}
                      <strong>{previewDueDate(triggerDate, blockedDeadline?.duration_label) ?? "—"}</strong>
                      <span className="meta">
                        {" "}· {blockedDeadline?.duration_label ?? "1 week"} from the date below;
                        RegOS records the actual date when you approve.
                      </span>
                    </span>
                  )}
                </div>

                <div className="decision-radios" role="radiogroup" aria-label="Clock-start policy">
                  {TRIGGER_POLICIES.map((option) => (
                    <label
                      key={option.id}
                      className={`decision-radio${policyChoice === option.id ? " decision-radio--on" : ""}`}
                    >
                      <input
                        type="radio"
                        name="trigger-policy"
                        checked={policyChoice === option.id}
                        onChange={() => {
                          setPolicyChoice(option.id);
                          setTriggerPolicy(option.policy);
                        }}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                  <label className={`decision-radio${policyChoice === "custom" ? " decision-radio--on" : ""}`}>
                    <input
                      type="radio"
                      name="trigger-policy"
                      checked={policyChoice === "custom"}
                      onChange={() => {
                        setPolicyChoice("custom");
                        setTriggerPolicy(customPolicy);
                      }}
                    />
                    <span>The firm&rsquo;s own event…</span>
                  </label>
                </div>
                {policyChoice === "custom" && (
                  <Field label="Describe the event" error={policyError}>
                    {(aria) => (
                      <input
                        {...aria}
                        value={customPolicy}
                        onChange={(event) => {
                          setCustomPolicy(event.target.value);
                          setTriggerPolicy(event.target.value);
                        }}
                        placeholder="For example: the date the finding is recorded in the vulnerability register"
                      />
                    )}
                  </Field>
                )}
                {policyChoice !== "none" && (
                  <Field label="Date the clock starts" hint="The date your policy points at, for the demo finding F-001.">
                    {(aria) => (
                      <input
                        {...aria}
                        type="date"
                        value={triggerDate}
                        onChange={(event) => setTriggerDate(event.target.value)}
                      />
                    )}
                  </Field>
                )}
                {policyChoice !== "none" && policyChoice !== "custom" && policyError && (
                  <p className="field-error"><span aria-hidden="true">✕</span>{policyError}</p>
                )}
                <p className="meta">
                  Recorded as &ldquo;Confirmed by compliance officer&rdquo; — never as wording from SEBI.
                </p>
              </div>
            </div>

            <div className="decision-commit">
              <p className="decision-commit-title">This decision is recorded against your name.</p>
              <p className="decision-commit-sub">
                Your reading is time-stamped before the draft is revealed and cannot be
                rewritten later in this session.
              </p>
              <div className="btn-row">
                {/* The cited sections are a server-side precondition, not a
                    suggestion: the API rejects a reading with 409 until every
                    reference resolves. Leaving this button live meant a filled-in
                    form could be submitted, refused, and the refusal rendered in
                    the page-top banner — some 2,500px above the reader, who saw
                    a primary button do nothing at all. The gate belongs where
                    the click is, in the same shape the policy gate already uses. */}
                <button
                  type="button"
                  className="btn btn--primary decision-commit-btn"
                  disabled={busy || policyChoice === "none" || !referencesLoaded}
                  onClick={() => {
                    setTouched(true);
                    if (!readingComplete) return;
                    void onCommitReading({
                      reviewer_name: reviewerName.trim(),
                      reviewer_role: reviewerRole.trim(),
                      independent_interpretation: interpretation.trim(),
                      trigger_policy: triggerPolicy.trim(),
                    });
                  }}
                >
                  {busy && <span className="spinner" aria-hidden="true" />}
                  Record my reading, then show the draft interpretation
                </button>
                {!referencesLoaded && (
                  <p className="decision-commit-hint">
                    Read the {state.references.length || 4} cited sections first — the
                    button above them loads and fingerprints each one.
                  </p>
                )}
                {referencesLoaded && policyChoice === "none" && (
                  <p className="decision-commit-hint">
                    Pick a clock-start policy to continue — or no due date will be worked out.
                  </p>
                )}
                <button
                  type="button"
                  className="btn btn--quiet btn--small decision-commit-quiet"
                  disabled={busy}
                  onClick={() => {
                    setInterpretation(
                      "Q17(a) supports a one-week maximum for high-severity findings caused by missing patches. It does not state which event starts that clock.",
                    );
                    setPolicyChoice("discovery");
                    setTriggerPolicy(TRIGGER_POLICIES[0].policy);
                  }}
                >
                  Fill a synthetic demo response
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="stack">
            {/* -- Case meta line — every value is real state -------------- */}
            <div className="decision-meta">
              <span>
                <strong className="strong-ink">Case A</strong> · the deadline SEBI half-states
              </span>
              <span className="decision-meta-div" aria-hidden="true" />
              <StateLabel value="BLOCKED_AWAITING_HUMAN" />
              <span className="decision-meta-div" aria-hidden="true" />
              <span>
                Committed by <strong className="strong-ink">{reading.reviewer_name}</strong>{" "}
                ({reading.reviewer_role})
              </span>
              <span className="meta">· {formatTimestamp(reading.committed_at)}</span>
            </div>

            <div className="decision-layout">
              {/* -- Left column ------------------------------------------- */}
              <div className="decision-main">
                <div className="decision-card">
                  <p className="decision-card-title">Your recorded reading, and why you chose this policy</p>
                  <blockquote className="decision-quote">
                    {reading.independent_interpretation}
                  </blockquote>
                  <p className="meta">
                    Recorded before the draft was revealed · policy: {reading.trigger_policy}
                  </p>
                  <Field
                    label="Reason for this policy"
                    hint="The exported report must explain why a human decision was used here."
                    error={reasonError}
                  >
                    {(aria) => (
                      <textarea
                        {...aria}
                        rows={3}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Why this trigger is the right one for this firm…"
                      />
                    )}
                  </Field>
                </div>

                {/* System suggestion strip — judgment lives where the claim is. */}
                <div className="decision-card decision-suggest">
                  <div className="decision-suggest-body">
                    <p className="decision-card-title">System suggestion</p>
                    <p className="strong-ink">{reading.revealed_system_suggestion}</p>
                    <p className="meta">
                      Revealed {formatTimestamp(reading.system_suggestion_revealed_at)} ·{" "}
                      {labelOf("AI_SUGGESTED")} · Your register today says: close all
                      vulnerability-test (VAPT) findings within 3 months, taken from Q15 alone.
                    </p>
                  </div>
                  <div
                    className="decision-agree"
                    role="radiogroup"
                    aria-label="Agreement with the draft interpretation"
                  >
                    <button
                      type="button"
                      className={`decision-agree-chip${agreement === "AGREE" ? " decision-agree-chip--on" : ""}`}
                      aria-pressed={agreement === "AGREE"}
                      onClick={() => setAgreement("AGREE")}
                    >
                      ✓ Agrees
                    </button>
                    <button
                      type="button"
                      className={`decision-agree-chip decision-agree-chip--differ${agreement === "DISAGREE" ? " decision-agree-chip--on" : ""}`}
                      aria-pressed={agreement === "DISAGREE"}
                      onClick={() => setAgreement("DISAGREE")}
                    >
                      Differs — reason recorded
                    </button>
                  </div>
                </div>
                {agreementError && (
                  <p className="field-error"><span aria-hidden="true">✕</span>{agreementError}</p>
                )}

                {/* Full width, not two-up: a definition list inside a half-width
                    card splits again, and "Not stated in the reviewed source"
                    ends up two words per line. */}
                <div className="decision-col">
                  <div className="decision-card">
                    <p className="decision-card-title">What&rsquo;s under review</p>
                    {blockedDeadline ? (
                      <dl className="datalist">
                        <DataRow label="Duration">
                          {blockedDeadline.duration_label}{" "}
                          <Tag value={blockedDeadline.duration_provenance} />
                        </DataRow>
                        <DataRow label="Starts from">
                          Not stated in the reviewed source
                        </DataRow>
                        <DataRow label="Due date">
                          Not calculated{" "}
                          <span className="meta">— {blockedDeadline.blocked_reason}</span>
                        </DataRow>
                      </dl>
                    ) : (
                      <p className="meta">No deadline is waiting on your decision in this review run.</p>
                    )}
                  </div>
                  <div className="decision-card">
                    <p className="decision-card-title">Evidence in the record</p>
                    {state.evidence.length === 0 ? (
                      <p className="meta">No evidence has been collected yet.</p>
                    ) : (
                      <ul className="decision-links">
                        {state.evidence.slice(0, 4).map((item) => (
                          <li key={item.id}>
                            <span className="decision-link-name">{item.name}</span>
                            <StateLabel value={item.status} />
                          </li>
                        ))}
                        {state.evidence.length > 4 && (
                          <li className="meta">
                            + {state.evidence.length - 4} more under Full record
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* -- Right rail: actionable information -------------------- */}
              <aside className="decision-rail" aria-label="Due date calculator and related sources">
                <div className="decision-card">
                  <p className="decision-card-title">Due date calculator</p>
                  <Field
                    label="The clock-start policy you recorded"
                    hint="Recorded before the draft interpretation was shown; cannot be edited now."
                  >
                    {(aria) => <input {...aria} value={reading.trigger_policy} disabled />}
                  </Field>
                  <Field
                    label="Date the clock starts"
                    hint="The date your policy points at, for the demo finding F-001."
                  >
                    {(aria) => (
                      <span className="decision-date">
                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
                        </svg>
                        <input
                          {...aria}
                          type="date"
                          value={triggerDate}
                          onChange={(event) => setTriggerDate(event.target.value)}
                        />
                      </span>
                    )}
                  </Field>
                  <div className="decision-preview decision-preview--calc">
                    <span className="micro">Due date preview</span>
                    {/* A real date reads as a figure in ink; the absence of one is a
                        state, and says so in words, tone and a clock glyph. */}
                    {previewDueDate(triggerDate, blockedDeadline?.duration_label) ? (
                      <span className="decision-preview-value decision-preview-value--xl">
                        {previewDueDate(triggerDate, blockedDeadline?.duration_label)}
                      </span>
                    ) : (
                      <span
                        className="decision-preview-value decision-preview-value--xl"
                        style={{
                          color: "var(--review)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "var(--s2)",
                        }}
                      >
                        <svg
                          aria-hidden="true"
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 8v4l3 3" />
                        </svg>
                        No date
                      </span>
                    )}
                    <span className="meta">
                      Based on {q17a?.locator ?? "CSCRF FAQ Q17(a)"} —{" "}
                      {blockedDeadline?.duration_label ?? "1 week"} from the trigger date.
                      Preview only; RegOS records the actual date when you approve.
                    </span>
                  </div>
                </div>

                <div className="decision-card">
                  <p className="decision-card-title">Related sections &amp; sources</p>
                  <ul className="decision-links">
                    {/* The title wraps and the link stays a short chip: a document
                        title inside a `proof-link` cannot wrap, and a long one
                        pushed the whole page sideways. */}
                    {state.documents.map((item) => (
                      <li key={item.id}>
                        <span>{item.title}</span>
                        <a
                          className="proof-link"
                          href={item.source_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open ↗
                        </a>
                      </li>
                    ))}
                    {state.references.slice(0, 4).map((item) => (
                      <li key={item.id} className="meta">
                        {item.target_locator} · <StateLabel value={item.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>

            {/* -- Action bar ------------------------------------------------ */}
            <div className="decision-commit decision-actionbar">
              <div className="decision-actionbar-copy">
                <p className="decision-commit-title">This decision is recorded against your name.</p>
                <p className="decision-commit-sub">
                  The clock-start is recorded as confirmed by a compliance officer — never as
                  wording from SEBI. Your name, role, reason, and the timestamps on both sides
                  of the reveal are kept with the build.
                </p>
              </div>
              <div className="btn-row decision-actionbar-actions">
                <button
                  type="button"
                  className="btn btn--primary decision-commit-btn"
                  disabled={busy}
                  onClick={() => {
                    setTouched(true);
                    if (!approvalComplete) return;
                    void onApprove({
                      reviewer_name: reading.reviewer_name,
                      reviewer_role: reading.reviewer_role,
                      reason: reason.trim(),
                      trigger_policy: reading.trigger_policy,
                      trigger_date: triggerDate,
                      agrees_with_system_suggestion: agreement === "AGREE",
                    });
                  }}
                >
                  {busy && <span className="spinner" aria-hidden="true" />}
                  Approve final decision
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------------------------
 * Step 4 — Operational impact. Every row is read from live build state.
 * ------------------------------------------------------------------------- */

function StepImpact({
  state,
  build,
  reducedMotion,
  onRunCheck,
}: {
  state: WorkspaceState;
  build: BuildRun;
  reducedMotion: boolean;
  onRunCheck?: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const control = state.controls[0];
  const sla = state.vendor_slas[0];
  const revalidating = state.evidence.filter((item) => item.status === "NEEDS_REVALIDATION");
  const computable = state.deadline_computations.filter((item) => item.computable);
  const review = state.reviews.at(-1);

  useEffect(() => {
    if (reducedMotion || !listRef.current) return;
    const rows = Array.from(listRef.current.querySelectorAll<HTMLElement>(".outcome-item"));
    const animation = animate(rows, {
      opacity: { from: 0 },
      y: { from: 8 },
      delay: stagger(60),
      duration: 240,
      ease: "outQuart",
    });
    // The resting state is the CSS default: visible. Clearing the inline styles the
    // animation wrote is what guarantees that. Without this, a cancelled run (React's
    // double-invoked effects in development, or an unmount mid-flight) leaves
    // `opacity: 0` behind, and the next run animates from 0 to 0 — a blank section.
    return () => {
      animation.cancel();
      for (const row of rows) {
        row.style.opacity = "";
        row.style.transform = "";
        row.style.translate = "";
      }
    };
  }, [reducedMotion]);

  return (
    <Panel
      id="step-impact"
      title="4 · Review approved. Here is what changed."
      description="Every line below is read from this review run, not written by hand."
    >
      <div className="stack">
        <StatRow>
          <Stat value={build.impact.controls_changed} label="Controls changed" />
          <Stat value={build.impact.tasks_created} label="Mandatory tasks created" />
          <Stat value={build.impact.vendor_sla_advisories} label="Advisory items recorded" />
          <Stat
            value={build.impact.evidence_revalidation}
            label="Evidence items to review again"
            tone={build.impact.evidence_revalidation > 0 ? "review" : undefined}
          />
        </StatRow>

        <Panel
          title="Regulation map"
          description="What the approved change touches — passages, controls, evidence and tasks."
          tight
        >
          <RegulationMap state={state} onRunCheck={onRunCheck} />
        </Panel>

        {/* Six outcomes, each one line. The evidence behind a line is one click
            away, never stacked on top of the next line. */}
        <div className="outcome" ref={listRef}>
          <div className="outcome-item">
            <span className="outcome-marker" aria-hidden="true">1</span>
            <div className="outcome-body">
              <p className="outcome-title">Control updated</p>
              <p className="outcome-why">
                {control.id} moved to version {control.version} — the one three-month rule
                became two.
              </p>
              <Disclosure summary="See the wording, before and after">
                <CompareCols
                  before={{
                    label: `Before · version ${control.version - 1}`,
                    body: <p>{control.previous_rule_summary}</p>,
                  }}
                  after={{
                    label: `After · version ${control.version}`,
                    body: <p>{control.rule_summary}</p>,
                  }}
                />
              </Disclosure>
            </div>
          </div>

          <div className="outcome-item">
            <span className="outcome-marker" aria-hidden="true">2</span>
            <div className="outcome-body">
              <p className="outcome-title">Dates recalculated</p>
              <p className="outcome-why">
                {computable.length} of {state.deadline_computations.length}{" "}
                {state.deadline_computations.length === 1
                  ? "finding now has a due date"
                  : "findings now have a due date"}
                {computable.length > 0 && <>, the first on {formatDate(computable[0].due_date)}</>}.
              </p>
              <Disclosure summary="See how each date was worked out">
                <div className="stack">
                  {state.deadline_computations.map((computation) => {
                    const finding = state.findings.find((item) => item.id === computation.finding_id);
                    return (
                      <div key={computation.id} className="stack-s">
                        <p className="outcome-why">
                          <span className="strong-ink">{computation.finding_id}</span> —{" "}
                          {finding?.title}
                        </p>
                        <dl className="datalist">
                          <DataRow label="Starts from">
                            {computation.trigger_label ?? "Not stated in the reviewed source"}{" "}
                            {computation.trigger_provenance && (
                              <Tag value={computation.trigger_provenance} />
                            )}
                          </DataRow>
                          <DataRow label="Duration">
                            {computation.duration_label}{" "}
                            <Tag value={computation.duration_provenance} />
                          </DataRow>
                          <DataRow label="Due date">
                            {computation.computable ? (
                              <span className="strong-ink">{formatDate(computation.due_date)}</span>
                            ) : (
                              <>
                                <span className="strong-ink">Not calculated</span>{" "}
                                <span className="meta">— {computation.blocked_reason}</span>
                              </>
                            )}
                          </DataRow>
                          <DataRow label="Where this comes from">
                            <span className="meta">{computation.citation.locator}</span>
                          </DataRow>
                        </dl>
                      </div>
                    );
                  })}
                </div>
              </Disclosure>
            </div>
          </div>

          <div className="outcome-item">
            <span className="outcome-marker" aria-hidden="true">3</span>
            <div className="outcome-body">
              <p className="outcome-title">Work assigned</p>
              <p className="outcome-why">
                {state.tasks.length} mandatory {state.tasks.length === 1 ? "task" : "tasks"},
                created only from language that requires it.
              </p>
              <Disclosure summary="See the tasks, owners and dates">
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Task</th>
                        <th scope="col">Owner</th>
                        <th scope="col" className="table-num">Due in</th>
                        <th scope="col">Kind of work</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.tasks.map((task) => (
                        <tr key={task.id}>
                          <td>{task.title}</td>
                          <td>{task.owner}</td>
                          <td className="table-num">{task.due_days} days</td>
                          <td className="meta">{workTypeOf(task.work_type)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Disclosure>
            </div>
          </div>

          <div className="outcome-item">
            <span className="outcome-marker outcome-marker--review" aria-hidden="true">4</span>
            <div className="outcome-body">
              <p className="outcome-title">Advisory recorded</p>
              <p className="outcome-why">
                {sla.vendor}&rsquo;s {sla.committed_days}-day promise stays guidance.{" "}
                <span className="strong-ink">No mandatory task was created from it.</span>
              </p>
              <Disclosure summary="See what the vendor promised">
                <dl className="datalist">
                  <DataRow label="What the vendor promised">{sla.committed_days} calendar days</DataRow>
                  <DataRow label="What SEBI&rsquo;s guidance suggests">
                    {sla.advisory_reference_days} days
                  </DataRow>
                  <DataRow label="Recorded as"><StateLabel value={sla.status} /></DataRow>
                </dl>
              </Disclosure>
            </div>
          </div>

          <div className="outcome-item">
            <span className="outcome-marker outcome-marker--review" aria-hidden="true">5</span>
            <div className="outcome-body">
              <p className="outcome-title">Evidence needs review</p>
              <p className="outcome-why">
                {revalidating.length} evidence{" "}
                {revalidating.length === 1 ? "item" : "items"} must be reviewed again before they
                can be relied on.
              </p>
              <Disclosure summary="See every evidence item and why">
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Evidence item</th>
                        <th scope="col">Status</th>
                        <th scope="col">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.evidence.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name} <span className="meta">· synthetic</span></td>
                          <td><StateLabel value={item.status} /></td>
                          <td className="meta">{item.reason ? plainPhrase(item.reason) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Disclosure>
            </div>
          </div>

          <div className="outcome-item">
            <span className="outcome-marker" aria-hidden="true">6</span>
            <div className="outcome-body">
              <p className="outcome-title">Audit record sealed</p>
              <p className="outcome-why">
                Approved by {review?.reviewer_name} ({review?.reviewer_role}) ·{" "}
                {formatTimestamp(review?.decided_at)}
              </p>
              <Disclosure summary="See the sealed record">
                <dl className="datalist">
                  <DataRow label="Approved by">
                    {review?.reviewer_name} · {review?.reviewer_role}
                  </DataRow>
                  <DataRow label="Approved at">{formatTimestamp(review?.decided_at)}</DataRow>
                  <DataRow label="Written reason">{review?.reason}</DataRow>
                  <DataRow label="Review run">{build.id}</DataRow>
                  {state.latest_manifest && (
                    <DataRow label="Record fingerprint">
                      <Hash value={state.latest_manifest.manifest_sha256} />
                    </DataRow>
                  )}
                </dl>
              </Disclosure>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/** Reviewed passages as one continuous, line-numbered excerpt — numbers count the
 *  excerpt's own lines; the real position in the PDF stays in each locator line. */
function NumberedExcerpt({
  sections,
}: {
  sections: Array<{ locator: string; text: string; hot: boolean }>;
}) {
  let line = 0;
  const wrap = (text: string): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      if ((current + " " + word).trim().length > 74) {
        lines.push(current.trim());
        current = word;
      } else {
        current = `${current} ${word}`;
      }
    }
    if (current.trim()) lines.push(current.trim());
    return lines;
  };
  return (
    <div className="rcx-excerpt">
      {sections.map((section) => (
        <div className={section.hot ? "rcx-sect rcx-sect--hot" : "rcx-sect"} key={section.locator}>
          <p className="rcx-loc">{section.locator}</p>
          {wrap(section.text).map((row) => {
            line += 1;
            return (
              <div className="rcx-line" key={line}>
                <span className="rcx-line-no" aria-hidden="true">{line}</span>
                <span className="rcx-line-text">{row}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
