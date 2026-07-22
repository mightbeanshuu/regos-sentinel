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

      {approved && build && (
        <>
          <StepImpact state={state} build={build} reducedMotion={Boolean(reducedMotion)} />
          <StepExport
            build={build}
            busy={busy}
            onDownloadReport={props.onDownloadReport}
            onDownloadBeforeAfter={props.onDownloadBeforeAfter}
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
          RegOS reads the official source, compares it with the control the firm already owns,
          and stops wherever the source does not say enough to be safe.
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
      description="RegOS checks the official document, records its fingerprint, and identifies the reviewed passages used in this case."
      aside={receipt ? <StateLabel value={receipt.status} /> : <StateLabel value="READY" />}
    >
      <div className="stack">
        <dl className="datalist">
          <DataRow label="Document">{document.title}</DataRow>
          <DataRow label="Published">{formatDate(document.published_at)}</DataRow>
          <DataRow label="Official URL">
            <a href={document.source_url} target="_blank" rel="noreferrer">
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
      description="A factual comparison between the control the firm owns today and what the reviewed source actually says."
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
      description="The reviewed source states how long, but not from when. That gap is a firm policy decision, and it is recorded as one."
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
            <Callout tone="accent" title="Record your own reading first">
              <p>
                RegOS keeps its own draft interpretation hidden until you commit yours. Your
                answer is time-stamped and cannot be rewritten later in this session.
              </p>
            </Callout>

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
              <Field label="Reviewer role" error={roleError}>
                {(aria) => (
                  <input
                    {...aria}
                    value={reviewerRole}
                    onChange={(event) => setReviewerRole(event.target.value)}
                  />
                )}
              </Field>
            </div>

            <Field
              label="What does this passage require, in your reading?"
              hint="Write what the cited text supports, and what remains a firm decision."
              error={interpretationError}
            >
              {(aria) => (
                <textarea
                  {...aria}
                  rows={3}
                  value={interpretation}
                  onChange={(event) => setInterpretation(event.target.value)}
                />
              )}
            </Field>

            <Field
              label="What event starts the one-week period?"
              hint="This is the firm's documented policy because the reviewed source does not state the trigger. It will be recorded as “Confirmed by compliance officer”, not as wording from SEBI."
              error={policyError}
            >
              {(aria) => (
                <input
                  {...aria}
                  value={triggerPolicy}
                  onChange={(event) => setTriggerPolicy(event.target.value)}
                  placeholder="For example: the date the finding is recorded in the vulnerability register"
                />
              )}
            </Field>

            <div className="btn-row">
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy}
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
              <button
                type="button"
                className="btn btn--quiet btn--small"
                disabled={busy}
                onClick={() => {
                  setInterpretation(
                    "Q17(a) supports a one-week maximum for high-severity findings caused by missing patches. It does not state which event starts that clock.",
                  );
                  setTriggerPolicy(
                    "Date the finding is recorded in the entity vulnerability register",
                  );
                }}
              >
                Fill a synthetic demo response
              </button>
            </div>
          </div>
        ) : (
          <div className="stack">
            <Callout tone="ok" title="Your reading was recorded before the draft was revealed">
              <p className="meta">Committed {formatTimestamp(reading.committed_at)}</p>
              <p style={{ fontFamily: "var(--serif)" }}>{reading.independent_interpretation}</p>
              <p className="meta">
                {reading.reviewer_name} · {reading.reviewer_role} · policy:{" "}
                {reading.trigger_policy}
              </p>
            </Callout>

            <div className="compare">
              <div className="compare-col">
                <p className="micro">Rule in the control register today</p>
                <p className="strong-ink">All VAPT findings → 3 months</p>
                <p className="meta">Derived from Q15 alone</p>
              </div>
              <span className="compare-rel" aria-hidden="true">→</span>
              <div className="compare-col compare-col--source">
                <p className="micro">RegOS draft interpretation</p>
                <p className="strong-ink">{reading.revealed_system_suggestion}</p>
                <p className="meta">
                  Revealed {formatTimestamp(reading.system_suggestion_revealed_at)} ·{" "}
                  {labelOf("AI_SUGGESTED")}
                </p>
              </div>
            </div>

            {blockedDeadline && (
              <dl className="datalist">
                <DataRow label="Duration">
                  {blockedDeadline.duration_label} <Tag value={blockedDeadline.duration_provenance} />
                </DataRow>
                <DataRow label="Starts from">
                  Not stated in the reviewed source
                </DataRow>
                <DataRow label="Due date">
                  Not calculated <span className="meta">— {blockedDeadline.blocked_reason}</span>
                </DataRow>
              </dl>
            )}

            <div className="field-grid">
              <Field
                label="Committed trigger policy"
                hint="Recorded before the draft interpretation was shown, and cannot be edited now."
              >
                {(aria) => <input {...aria} value={reading.trigger_policy} disabled />}
              </Field>
              <Field
                label="Trigger date for the synthetic finding"
                hint="The date your policy points at, for the demo finding F-001."
              >
                {(aria) => (
                  <input
                    {...aria}
                    type="date"
                    value={triggerDate}
                    onChange={(event) => setTriggerDate(event.target.value)}
                  />
                )}
              </Field>
            </div>

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

            <Field
              label="Does your reading agree with the draft interpretation?"
              error={agreementError}
            >
              {(aria) => (
                <select
                  {...aria}
                  value={agreement}
                  onChange={(event) =>
                    setAgreement(event.target.value as "" | "AGREE" | "DISAGREE")}
                >
                  <option value="">Record agreement or disagreement…</option>
                  <option value="AGREE">Agrees with the draft interpretation</option>
                  <option value="DISAGREE">Disagrees — reason recorded above</option>
                </select>
              )}
            </Field>

            <Callout tone="review" title="How this will be stored">
              <p>
                The clock-start is recorded as <span className="strong-ink">
                  confirmed by a compliance officer
                </span>{" "}
                — never as wording from SEBI. Your name, role, reason, and the timestamps on both
                sides of the reveal are kept with the build.
              </p>
            </Callout>

            <div className="btn-row">
              <button
                type="button"
                className="btn btn--primary"
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
                Approve policy and continue
              </button>
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
          description="Blast radius from the approved change — source spans through controls, evidence, and tasks. Every node is a live workspace object."
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
}: {
  build: BuildRun;
  busy: boolean;
  onDownloadReport: () => Promise<void>;
  onDownloadBeforeAfter: () => Promise<void>;
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
    </Panel>
  );
}
