"use client";

import { animate, stagger } from "animejs";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { formatDate, formatTimestamp, labelOf } from "../lib/presentation";
import type {
  BuildRun,
  LiveSourceVerificationReceipt,
  WorkspaceState,
} from "../lib/types";
import { Callout, Counts, DataRow, Field, Hash, Panel, Quote, StateLabel, Tag } from "./ui";
import { IncidentReportingClock } from "./IncidentReportingClock";
import { RegulationMap } from "./impact/RegulationMap";

const STEPS = [
  "Source",
  "Compare",
  "Human decision",
  "Operational impact",
  "Export",
] as const;

type StepState = "upcoming" | "current" | "done" | "blocked";

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

function Stepper({ states }: { states: StepState[] }) {
  return (
    <ol className="stepper" aria-label="Review progress">
      {STEPS.map((label, index) => {
        const status = states[index];
        return (
          <li
            key={label}
            className={`step${status === "upcoming" ? "" : ` step--${status}`}`}
            aria-current={status === "current" || status === "blocked" ? "step" : undefined}
          >
            <span className="step-marker" aria-hidden="true">
              {status === "done" ? "✓" : status === "blocked" ? "!" : index + 1}
            </span>
            <span className="step-label">
              {label}
              <span className="visually-hidden">
                {" — "}
                {status === "done"
                  ? "completed"
                  : status === "blocked"
                    ? "needs review"
                    : status === "current"
                      ? "current step"
                      : "not started"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
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

  return (
    <div className="stack-l">
      <CaseSummary
        state={state}
        control={control}
        hasBuild={Boolean(build)}
        busy={busy || sourceBusy}
        onStart={props.onRunBuild}
      />

      <Stepper states={stepStates} />

      <StepSource {...props} />

      {build && (
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
      )}

      {blocked && (
        <StepHumanDecision
          {...props}
          q17a={q17a}
          document={document}
          referencesLoaded={referencesLoaded}
          reading={reading}
          blockedDeadline={blockedDeadline}
        />
      )}

      {approved && build && reading && (
        <div className="decision-sealed" role="status">
          <span className="decision-sealed-badge" aria-hidden="true">
            <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M5 9V7a5 5 0 0 1 10 0v2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Zm8-2v2H7V7a3 3 0 0 1 6 0Z" />
            </svg>
            Sealed
          </span>
          <span className="decision-sealed-check" aria-hidden="true">✓</span>
          <div className="decision-sealed-body">
            <p className="decision-sealed-title">Decision approved</p>
          </div>
          <span className="decision-sealed-divider" aria-hidden="true" />
          <p className="decision-sealed-by">
            Recorded by: <strong>{reading.reviewer_name} ({reading.reviewer_role})</strong>
            <span className="meta"> · policy: {reading.trigger_policy}</span>
          </p>
          {state.latest_manifest?.build_id === build.id ? (
            <code
              className="decision-sealed-sha mono"
              title={state.latest_manifest.manifest_sha256}
            >
              SHA-256 · {state.latest_manifest.manifest_sha256.slice(0, 12)}…
            </code>
          ) : (
            <code className="decision-sealed-sha mono">run · {build.run_id}</code>
          )}
        </div>
      )}

      {approved && build && (
        <>
          <StepImpact state={state} build={build} reducedMotion={Boolean(reducedMotion)} />
          <StepExport
            build={build}
            busy={busy}
            onDownloadReport={props.onDownloadReport}
            onDownloadBeforeAfter={props.onDownloadBeforeAfter}
            onOpenAudit={props.onOpenAudit}
          />
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Case summary
 * ------------------------------------------------------------------------- */

function CaseSummary({
  state,
  control,
  hasBuild,
  busy,
  onStart,
}: {
  state: WorkspaceState;
  control: WorkspaceState["controls"][number];
  hasBuild: boolean;
  busy: boolean;
  onStart: () => Promise<void>;
}) {
  const findings = state.findings;
  return (
    <section className="stack">
      <div className="stack-s">
        <h1 className="page-title">
          A SEBI rule changed. Does this broker&rsquo;s existing control still work?
        </h1>
        <p className="lede">
          Source vs the firm&rsquo;s control. It stops wherever the source does not say enough.
        </p>
      </div>

      <Panel>
        <dl className="datalist">
          <DataRow label="Entity">
            <span className="strong-ink">{state.entity_profile.legal_name}</span>{" "}
            <span className="meta">
              · {state.entity_profile.cscrf_category} ·{" "}
              {state.entity_profile.is_qsb ? "QSB" : "Non-QSB"} · Synthetic demo data
            </span>
          </DataRow>
          <DataRow label="Existing control">
            <span className="strong-ink">{control.id}</span>{" "}
            <span className="meta">— {control.previous_rule_summary ?? control.rule_summary}</span>
          </DataRow>
          <DataRow label="New event">
            <p>A VAPT report contains two high-severity findings:</p>
            <ul className="stack-s" style={{ marginTop: "8px" }}>
              {findings.map((finding) => (
                <li key={finding.id} className="meta">
                  <span className="strong-ink">{finding.id}</span> — {finding.title}
                  {finding.caused_by_missing_patch ? " (missing OEM patch)" : ""}
                </li>
              ))}
            </ul>
          </DataRow>
        </dl>
      </Panel>

      {!hasBuild && (
        <div className="btn-row">
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy}
            onClick={() => void onStart()}
          >
            {busy && <span className="spinner" aria-hidden="true" />}
            {busy ? "Checking the rule against the control…" : "Review the rule change"}
          </button>
        </div>
      )}
    </section>
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
      <p className="hash-card-value mono" aria-label={`${label}: ${value}`}>{value}</p>
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
        {copied ? "✓ Copied" : "⧉ Copy hash"}
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
      description="Fetch the official document, record its fingerprint."
      aside={receipt ? <StateLabel value={receipt.status} /> : <StateLabel value="READY" />}
    >
      <div className="stack">
        <HashCard label="Source document hash" value={document.content_hash} />
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
            <p className="meta">{document.content_hash_scope.toLowerCase()}</p>
          </DataRow>
          <DataRow label="Reviewed passages">
            {state.source_spans.filter((span) => span.document_id === document.id).length}
          </DataRow>
          {receipt && (
            <>
              <DataRow label="Live file">
                {receipt.page_count} pages · {(receipt.byte_count / 1024).toFixed(1)}{" "}
                KB · HTTP {receipt.http_status}
              </DataRow>
              <DataRow label="Passages found in the live file">
                {receipt.matched_span_ids.length} of {receipt.checked_span_count}
              </DataRow>
              <DataRow label="Live file fingerprint">
                <Hash value={receipt.document_sha256} />
              </DataRow>
              <DataRow label="Checked at">{formatTimestamp(receipt.checked_at)}</DataRow>
            </>
          )}
        </dl>

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
        <div className="compare">
          <div className="compare-col">
            <p className="micro">Existing control · {control.id}</p>
            <p className="strong-ink">
              All VAPT findings — close within 3 months.
            </p>
          </div>
          <span className="compare-rel" aria-hidden="true">vs</span>
          <div className="compare-col compare-col--source">
            <p className="micro">What the source says</p>
            <ul className="stack-s">
              <li>
                <span className="strong-ink">Missing-patch, high severity</span> — one week.
                {q17a && <span className="meta"> · {q17a.locator}</span>}
              </li>
              <li>
                <span className="strong-ink">Other observations</span> — three months.
                {q15 && <span className="meta"> · {q15.locator}</span>}
              </li>
            </ul>
          </div>
        </div>

        {!approved && (
          <Callout tone="fail" title="Check failed">
            <p>One broad three-month control cannot represent both requirements.</p>
            {(failedTests.length > 0 ? failedTests : reviewNeededTests.slice(0, 1)).map((test) => (
              <p key={test.id} className="meta">{test.name} — {test.message}</p>
            ))}
          </Callout>
        )}

        {!approved && blockedDeadline && (
          <Callout tone="review" title="Human decision needed">
            <p>
              SEBI states a one-week duration, but the reviewed source does not state when that
              week starts. RegOS will not calculate a due date until a compliance officer records
              the firm&rsquo;s trigger policy.
            </p>
            <dl className="datalist" style={{ marginTop: "8px" }}>
              <DataRow label="Duration">
                {blockedDeadline.duration_label}{" "}
                <Tag value={blockedDeadline.duration_provenance} />
              </DataRow>
              <DataRow label="Starts from">
                <span className="strong-ink">Not stated in the reviewed source</span>
              </DataRow>
              <DataRow label="Due date">
                <span className="strong-ink">Not calculated</span>
                <p className="meta">{blockedDeadline.blocked_reason}</p>
              </DataRow>
            </dl>
          </Callout>
        )}

        {state.findings.length > 0 && (
          <div className="stack-s" style={{ marginTop: "16px" }}>
            <p className="sub-title">Reporting clocks for each finding</p>
            <IncidentReportingClock state={state} compact />
          </div>
        )}

        {approved && (
          <Callout tone="ok" title="Resolved by a named compliance officer">
            <p>
              The control was split into two branches after {build.reviewer}{" "}
              recorded the firm&rsquo;s trigger policy in writing.
            </p>
          </Callout>
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
                      <td>{test.name}</td>
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
  { id: "vapt", label: "VAPT report submission", policy: "Date the VAPT report is submitted to the entity" },
  { id: "patch", label: "OEM patch availability", policy: "Date the missing OEM patch becomes available" },
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
  onOpenAudit,
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
          <Callout tone="review" title="Four cited sections must be read first">
            <p>
              Q15 points to Table 19 and PR.MA Guideline 6, Q16 to Annexure-A, and Q17(a) to
              PR.MA.S3. RegOS will not accept a decision until those are loaded and fingerprinted.
            </p>
            <div className="btn-row">
              <button
                type="button"
                className="btn btn--secondary btn--small"
                disabled={busy}
                onClick={() => void onResolveReferences()}
              >
                {busy && <span className="spinner" aria-hidden="true" />}
                Load the 4 cited sections
              </button>
            </div>
          </Callout>
        ) : (
          <details className="disclosure" open={!reading}>
            <summary>
              4 cited CSCRF sections loaded and fingerprinted
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
                        Excerpt fingerprint <Hash value={reference.target_hash} />
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
                <div className="decision-card decision-card--locked" aria-label="System suggestion, hidden until you commit your reading">
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
                    <p className="meta">(Blurred until you commit your reading)</p>
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
                        {" "}· {blockedDeadline?.duration_label ?? "1 week"} from the date below; the
                        engine records the real date on approval.
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
                  <Field label="Trigger event date" hint="The date your policy points at, for the demo finding F-001.">
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
                <button
                  type="button"
                  className="btn btn--primary decision-commit-btn"
                  disabled={busy || policyChoice === "none"}
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
                {policyChoice === "none" && (
                  <p className="decision-commit-hint">
                    Pick a clock-start policy to continue — or the date stays uncomputed.
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
                  <p className="decision-card-title">Reviewer notes &amp; system alignment</p>
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
                      {labelOf("AI_SUGGESTED")} · register today: All VAPT findings → 3 months
                      (derived from Q15 alone)
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

                <div className="decision-duo">
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
                      <p className="meta">No blocked deadline on this build.</p>
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
              <aside className="decision-rail" aria-label="Actionable information and policies">
                <div className="decision-card">
                  <p className="decision-card-title">Due date calculator</p>
                  <Field
                    label="Committed trigger policy"
                    hint="Recorded before the draft interpretation was shown; cannot be edited now."
                  >
                    {(aria) => <input {...aria} value={reading.trigger_policy} disabled />}
                  </Field>
                  <Field
                    label="Trigger event date"
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
                    <span className="decision-preview-value decision-preview-value--xl">
                      {previewDueDate(triggerDate, blockedDeadline?.duration_label) ?? "No date"}
                    </span>
                    <span className="meta">
                      Based on {q17a?.locator ?? "CSCRF FAQ Q17(a)"} —{" "}
                      {blockedDeadline?.duration_label ?? "1 week"} from the trigger date.
                      Preview only; the engine records the real date on approval.
                    </span>
                  </div>
                </div>

                <div className="decision-card">
                  <p className="decision-card-title">Related sections &amp; sources</p>
                  <ul className="decision-links">
                    {state.documents.map((item) => (
                      <li key={item.id}>
                        <a
                          className="proof-link"
                          href={item.source_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.title} ↗
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
                {onOpenAudit && (
                  <button
                    type="button"
                    className="btn btn--quiet decision-commit-quiet"
                    disabled={busy}
                    onClick={onOpenAudit}
                  >
                    View the full record
                  </button>
                )}
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
}: {
  state: WorkspaceState;
  build: BuildRun;
  reducedMotion: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const control = state.controls[0];
  const sla = state.vendor_slas[0];
  const revalidating = state.evidence.filter((item) => item.status === "NEEDS_REVALIDATION");
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
      description="Every line below is read from this build's actual state."
      aside={<StateLabel value="APPROVED" />}
    >
      <div className="stack">
        <Counts
          items={[
            { value: build.impact.controls_changed, label: "control changed" },
            { value: build.impact.tasks_created, label: "mandatory tasks created" },
            { value: build.impact.vendor_sla_advisories, label: "advisory item recorded" },
            { value: build.impact.evidence_revalidation, label: "evidence items need review" },
          ]}
        />

        <Panel
          title="Regulation map"
          description="Impact of the approved change — spans, controls, evidence, tasks."
          tight
        >
          <RegulationMap state={state} />
        </Panel>

        <div className="outcome" ref={listRef}>
          <div className="outcome-item">
            <span className="outcome-marker" aria-hidden="true">1</span>
            <div className="outcome-body">
              <p className="outcome-title">Control updated</p>
              <p className="outcome-why">
                The single three-month control was split into two branches.
              </p>
              <div className="compare" style={{ marginTop: "8px" }}>
                <div className="compare-col">
                  <p className="micro">Before · version 1</p>
                  <p>{control.previous_rule_summary}</p>
                </div>
                <span className="compare-rel" aria-hidden="true">→</span>
                <div className="compare-col compare-col--source">
                  <p className="micro">After · version {control.version}</p>
                  <p>{control.rule_summary}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="outcome-item">
            <span className="outcome-marker" aria-hidden="true">2</span>
            <div className="outcome-body">
              <p className="outcome-title">Dates recalculated</p>
              {state.deadline_computations.map((computation) => {
                const finding = state.findings.find((item) => item.id === computation.finding_id);
                return (
                  <div key={computation.id} className="stack-s" style={{ marginTop: "8px" }}>
                    <p className="outcome-why">
                      <span className="strong-ink">{computation.finding_id}</span> —{" "}
                      {finding?.title}
                    </p>
                    <dl className="datalist">
                      <DataRow label="Starts from">
                        {computation.trigger_label}{" "}
                        <Tag value={computation.trigger_provenance} />
                      </DataRow>
                      <DataRow label="Duration">
                        {computation.duration_label}{" "}
                        <Tag value={computation.duration_provenance} />
                      </DataRow>
                      <DataRow label="Due date">
                        <span className="strong-ink">{formatDate(computation.due_date)}</span>
                      </DataRow>
                      <DataRow label="Source">
                        <span className="meta">{computation.citation.locator}</span>
                      </DataRow>
                    </dl>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="outcome-item">
            <span className="outcome-marker" aria-hidden="true">3</span>
            <div className="outcome-body">
              <p className="outcome-title">Work assigned</p>
              <p className="outcome-why">
                Created only from language that requires it. {state.tasks.length} mandatory{" "}
                {state.tasks.length === 1 ? "task" : "tasks"}.
              </p>
              <div className="table-scroll" style={{ marginTop: "8px" }}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Task</th>
                      <th scope="col">Owner</th>
                      <th scope="col">Due in</th>
                      <th scope="col">Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.tasks.map((task) => (
                      <tr key={task.id}>
                        <td>{task.title}</td>
                        <td>{task.owner}</td>
                        <td>{task.due_days} days</td>
                        <td className="meta">{task.work_type.toLowerCase()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="outcome-item">
            <span className="outcome-marker outcome-marker--review" aria-hidden="true">4</span>
            <div className="outcome-body">
              <p className="outcome-title">Advisory recorded</p>
              <p className="outcome-why">
                The {sla.vendor} SLA statement is guidance, not a mandatory SEBI task.{" "}
                <span className="strong-ink">No mandatory task was created from it.</span>
              </p>
              <dl className="datalist">
                <DataRow label="Committed">{sla.committed_days} calendar days</DataRow>
                <DataRow label="Advisory comparison">
                  {sla.advisory_reference_days} days
                </DataRow>
                <DataRow label="Recorded as"><StateLabel value={sla.status} /></DataRow>
              </dl>
            </div>
          </div>

          <div className="outcome-item">
            <span className="outcome-marker outcome-marker--review" aria-hidden="true">5</span>
            <div className="outcome-body">
              <p className="outcome-title">Evidence needs review</p>
              <p className="outcome-why">
                {revalidating.length} evidence{" "}
                {revalidating.length === 1 ? "item" : "items"} were marked for revalidation.
              </p>
              <div className="table-scroll" style={{ marginTop: "8px" }}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Artifact</th>
                      <th scope="col">State</th>
                      <th scope="col">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.evidence.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name} <span className="meta">· synthetic</span></td>
                        <td><StateLabel value={item.status} /></td>
                        <td className="meta">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="outcome-item">
            <span className="outcome-marker" aria-hidden="true">6</span>
            <div className="outcome-body">
              <p className="outcome-title">Audit record sealed</p>
              <dl className="datalist">
                <DataRow label="Approved by">
                  {review?.reviewer_name} · {review?.reviewer_role}
                </DataRow>
                <DataRow label="Approved at">{formatTimestamp(review?.decided_at)}</DataRow>
                <DataRow label="Written reason">{review?.reason}</DataRow>
                <DataRow label="Build">{build.id}</DataRow>
                {state.latest_manifest && (
                  <DataRow label="Record fingerprint">
                    <Hash value={state.latest_manifest.manifest_sha256} />
                  </DataRow>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------------------------
 * Step 5 — Export
 * ------------------------------------------------------------------------- */

function StepExport({
  build,
  busy,
  onDownloadReport,
  onDownloadBeforeAfter,
  onOpenAudit,
}: {
  build: BuildRun;
  busy: boolean;
  onDownloadReport: () => Promise<void>;
  onDownloadBeforeAfter: () => Promise<void>;
  onOpenAudit?: () => void;
}) {
  return (
    <Panel
      id="step-export"
      title="5 · Export the approved record"
      description="Generated from this build's actual state."
      aside={<StateLabel value="APPROVED" />}
    >
      <AnimatePresence initial={false}>
        <motion.div
          className="btn-row"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy}
            onClick={() => void onDownloadReport()}
          >
            {busy && <span className="spinner" aria-hidden="true" />}
            Download Compliance Build Report
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={busy}
            onClick={() => void onDownloadBeforeAfter()}
          >
            Download before-and-after comparison
          </button>
        </motion.div>
      </AnimatePresence>
      <p className="meta" style={{ marginTop: "12px" }}>
        Both documents are rendered from build {build.id}. Re-generating the same approved build
        produces a byte-identical file.
      </p>
      {onOpenAudit && (
        <div className="btn-row" style={{ marginTop: "12px" }}>
          <button
            type="button"
            className="btn btn--quiet btn--small"
            onClick={onOpenAudit}
          >
            Continue to the Full record — every event, hash-chained →
          </button>
        </div>
      )}
    </Panel>
  );
}
