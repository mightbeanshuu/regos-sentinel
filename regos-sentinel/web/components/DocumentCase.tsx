"use client";

import { useCallback, useEffect, useState } from "react";

import { regosApi } from "../lib/api";
import { formatDate, formatTimestamp } from "../lib/presentation";
import type { DocumentCaseRecord, UploadedDocument } from "../lib/types";
import { Field, Panel, StateLabel } from "./ui";

/**
 * The Case A ritual, generated from any uploaded circular: RegOS names the worst
 * period-without-clock-start passage, the reviewer commits an independent reading
 * before the suggestion is revealed, records a clock-start policy, and approval
 * lands as an ordinary signed requirement in this document's record.
 */

const TRIGGER_POLICIES = [
  { id: "discovery", policy: "The date the finding or obligation event is discovered." },
  { id: "submission", policy: "The date the relevant report or filing is submitted." },
  { id: "effect", policy: "The date this circular takes effect for the entity." },
] as const;

const POLICY_LABELS: Record<string, string> = {
  discovery: "Date of discovery",
  submission: "Date of submission",
  effect: "Circular effect date",
};

function previewDueDate(
  dateStr: string,
  value: number | null,
  unit: string | null,
): string | null {
  if (!dateStr || value === null || !unit) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const bare = unit.replace(/s$/, "");
  if (bare === "day") date.setDate(date.getDate() + value);
  else if (bare === "week") date.setDate(date.getDate() + value * 7);
  else if (bare === "month") date.setMonth(date.getMonth() + value);
  else if (bare === "year") date.setFullYear(date.getFullYear() + value);
  else return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function DocumentCasePanel({
  document,
  busy,
  onBusy,
  onError,
  onDocumentChanged,
}: {
  document: UploadedDocument;
  busy: boolean;
  onBusy: (value: boolean) => void;
  onError: (message: string | null) => void;
  onDocumentChanged: () => void;
}) {
  const [record, setRecord] = useState<DocumentCaseRecord | null>(null);
  const [noDefect, setNoDefect] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRecord(null);
    setNoDefect(null);
    setLoaded(false);
    regosApi
      .documentCase(document.id)
      .then((value) => { if (!cancelled) { setRecord(value); setLoaded(true); } })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [document.id]);

  const act = useCallback(
    async (operation: () => Promise<DocumentCaseRecord>, refreshDocument = false) => {
      onBusy(true);
      onError(null);
      try {
        const value = await operation();
        setRecord(value);
        setNoDefect(null);
        if (refreshDocument) onDocumentChanged();
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "That action failed.";
        if (message.includes("no Case A defect")) setNoDefect(message);
        else onError(message);
      } finally {
        onBusy(false);
      }
    },
    [onBusy, onError, onDocumentChanged],
  );

  if (!loaded) return null;

  return (
    <Panel
      title="The case in this document"
      description="RegOS names the worst period-without-clock-start passage — the defect Case A demonstrates — and stages it for your decision."
      aside={record ? <StateLabel value={record.state} /> : undefined}
    >
      {!record && !noDefect && (
        <div className="stack-s">
          <p className="lede">
            The committed model reads every passage; among the possible requirements, the
            period-without-clock-start wording with the highest confidence becomes the case.
          </p>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn--primary"
              disabled={busy}
              onClick={() => void act(() => regosApi.generateDocumentCase(document.id))}
            >
              {busy && <span className="spinner" aria-hidden="true" />}
              Find the case in this document
            </button>
          </div>
          {document.scope.recommendations_not_converted > 0 && (
            <p className="meta">
              Also held: {document.scope.recommendations_not_converted}{" "}
              {document.scope.recommendations_not_converted === 1
                ? "recommendation stayed"
                : "recommendations stayed"}{" "}
              advisory — never converted into mandatory work.
            </p>
          )}
        </div>
      )}

      {noDefect && (
        <p className="lede">{noDefect}</p>
      )}

      {record && <CaseBody record={record} busy={busy} act={act} />}
    </Panel>
  );
}

function CaseBody({
  record,
  busy,
  act,
}: {
  record: DocumentCaseRecord;
  busy: boolean;
  act: (
    operation: () => Promise<DocumentCaseRecord>,
    refreshDocument?: boolean,
  ) => Promise<void>;
}) {
  return (
    <div className="stack">
      {/* -- The passage the case is made of --------------------------------- */}
      <div className="doccase-quote">
        <p className="mono meta">{record.locator}</p>
        <p className="doccase-text">{record.text}</p>
        <div className="doccase-verdicts">
          <span className="doccase-chip doccase-chip--review">
            Model: says how long, not from when · {Math.round(record.model_confidence * 100)}%
          </span>
          <span className={`doccase-chip${record.verdicts_agree ? " doccase-chip--ok" : ""}`}>
            {record.verdicts_agree
              ? "✓ Fixed rule reads it the same way"
              : "Fixed rule differs — shown, not hidden"}
          </span>
          <span className="doccase-chip">
            Picked from {record.candidates_considered}{" "}
            {record.candidates_considered === 1 ? "candidate" : "candidates"}
          </span>
        </div>
      </div>

      {record.state === "READING_PENDING" && (
        <CaseReadingStage record={record} busy={busy} act={act} />
      )}
      {record.state === "READING_COMMITTED" && (
        <CaseApprovalStage record={record} busy={busy} act={act} />
      )}
      {record.state === "APPROVED" && <CaseSealed record={record} />}

      <p className="meta clamp2" title={record.limitation}>{record.limitation}</p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Stage 1 — the independent reading, committed before the reveal.
 * ------------------------------------------------------------------------- */

function CaseReadingStage({
  record,
  busy,
  act,
}: {
  record: DocumentCaseRecord;
  busy: boolean;
  act: (
    operation: () => Promise<DocumentCaseRecord>,
    refreshDocument?: boolean,
  ) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Compliance Officer");
  const [interpretation, setInterpretation] = useState("");
  const [policyChoice, setPolicyChoice] = useState<string>("none");
  const [customPolicy, setCustomPolicy] = useState("");
  const [touched, setTouched] = useState(false);

  const policy =
    policyChoice === "custom"
      ? customPolicy
      : TRIGGER_POLICIES.find((item) => item.id === policyChoice)?.policy ?? "";

  const nameError = touched && name.trim().length < 2
    ? "Enter your name. The record names you." : null;
  const interpretationError = touched && interpretation.trim().length < 8
    ? "Write what you think the wording supports, before the suggestion is shown." : null;
  const policyError = touched && policyChoice !== "none" && policy.trim().length < 8
    ? "Describe the event your firm treats as the clock-start." : null;

  const complete = name.trim().length >= 2
    && role.trim().length >= 2
    && interpretation.trim().length >= 8
    && policy.trim().length >= 8;

  return (
    <div className="stack">
      <div className="decision-grid">
        <div className="decision-col">
          <div className="decision-card">
            <p className="decision-card-title">Your independent reading</p>
            <Field
              label="Your observation"
              hint="What does this wording support, and what remains a firm decision?"
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
                  <input {...aria} value={name} onChange={(event) => setName(event.target.value)} />
                )}
              </Field>
              <Field label="Role / designation">
                {(aria) => (
                  <input {...aria} value={role} onChange={(event) => setRole(event.target.value)} />
                )}
              </Field>
            </div>
          </div>

          <div
            className="decision-card decision-card--locked"
            aria-label="System suggestion, hidden until you commit your reading"
          >
            <div className="decision-skel" aria-hidden="true">
              <span style={{ width: "34%" }} />
              <span style={{ width: "96%" }} />
              <span style={{ width: "88%" }} />
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

        <div className="decision-card">
          <p className="decision-card-title">Set the clock-start policy</p>
          <p className="meta">
            The wording states {record.duration_label ? `“${record.duration_label}”` : "a period"}{" "}
            but not what starts it. That gap is yours.
          </p>
          <div className="decision-radios" role="radiogroup" aria-label="Clock-start policy">
            {TRIGGER_POLICIES.map((option) => (
              <label
                key={option.id}
                className={`decision-radio${policyChoice === option.id ? " decision-radio--on" : ""}`}
              >
                <input
                  type="radio"
                  name="doccase-policy"
                  checked={policyChoice === option.id}
                  onChange={() => setPolicyChoice(option.id)}
                />
                <span>{POLICY_LABELS[option.id]}</span>
              </label>
            ))}
            <label className={`decision-radio${policyChoice === "custom" ? " decision-radio--on" : ""}`}>
              <input
                type="radio"
                name="doccase-policy"
                checked={policyChoice === "custom"}
                onChange={() => setPolicyChoice("custom")}
              />
              <span>The firm&rsquo;s own event…</span>
            </label>
            <label className={`decision-radio${policyChoice === "none" ? " decision-radio--on" : ""}`}>
              <input
                type="radio"
                name="doccase-policy"
                checked={policyChoice === "none"}
                onChange={() => setPolicyChoice("none")}
              />
              <span>No policy — leave the date uncomputed</span>
            </label>
          </div>
          {policyChoice === "custom" && (
            <Field label="Describe the event" error={policyError}>
              {(aria) => (
                <input
                  {...aria}
                  value={customPolicy}
                  onChange={(event) => setCustomPolicy(event.target.value)}
                  placeholder="For example: the date the finding enters the register"
                />
              )}
            </Field>
          )}
          <p className="meta">
            Recorded as &ldquo;confirmed by a compliance officer&rdquo; — never as wording
            from the document.
          </p>
        </div>
      </div>

      <div className="decision-commit">
        <p className="decision-commit-title">Your reading is committed before the reveal.</p>
        <p className="decision-commit-sub">
          It is time-stamped before the suggestion is shown and cannot be rewritten in
          this session.
        </p>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn--primary decision-commit-btn"
            disabled={busy || policyChoice === "none"}
            onClick={() => {
              setTouched(true);
              if (!complete) return;
              void act(() =>
                regosApi.commitDocumentCaseReading(record.document_id, {
                  reviewer_name: name.trim(),
                  reviewer_role: role.trim() || "Compliance Officer",
                  independent_interpretation: interpretation.trim(),
                  trigger_policy: policy.trim(),
                }),
              );
            }}
          >
            {busy && <span className="spinner" aria-hidden="true" />}
            Record my reading, then show the suggestion
          </button>
          {policyChoice === "none" && (
            <p className="decision-commit-hint">
              Pick a clock-start policy to continue — or the date stays uncomputed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Stage 2 — committed: the reveal, the judgment, the approval.
 * ------------------------------------------------------------------------- */

function CaseApprovalStage({
  record,
  busy,
  act,
}: {
  record: DocumentCaseRecord;
  busy: boolean;
  act: (
    operation: () => Promise<DocumentCaseRecord>,
    refreshDocument?: boolean,
  ) => Promise<void>;
}) {
  const reading = record.reading!;
  const [agreement, setAgreement] = useState<"" | "AGREE" | "DISAGREE">("");
  const [reason, setReason] = useState("");
  const [actor, setActor] = useState("the regulated entity");
  const [action, setAction] = useState("");
  const [object, setObject] = useState("");
  const [triggerDate, setTriggerDate] = useState("");
  const [touched, setTouched] = useState(false);

  const reasonError = touched && reason.trim().length < 8
    ? "Explain why this policy is right, in one sentence." : null;
  const actionError = touched && action.trim().length < 2
    ? "Say what must be done — for example: apply." : null;
  const objectError = touched && object.trim().length < 2
    ? "Say what it applies to — for example: critical patches." : null;
  const agreementError = touched && !agreement
    ? "Record whether your reading agrees with the suggestion." : null;

  const complete = reason.trim().length >= 8
    && actor.trim().length >= 2
    && action.trim().length >= 2
    && object.trim().length >= 2
    && Boolean(agreement);

  return (
    <div className="stack">
      <div className="decision-layout">
        <div className="decision-main">
          <div className="decision-card">
            <p className="decision-card-title">Your committed reading</p>
            <blockquote className="decision-quote">{reading.independent_interpretation}</blockquote>
            <p className="meta">
              Committed {formatTimestamp(reading.committed_at)} · {reading.reviewer_name} ·{" "}
              {reading.reviewer_role} · policy: {reading.trigger_policy}
            </p>
          </div>

          <div className="decision-card decision-suggest">
            <div className="decision-suggest-body">
              <p className="decision-card-title">System suggestion</p>
              <p className="strong-ink">{reading.revealed_system_suggestion}</p>
              <p className="meta">
                Revealed {formatTimestamp(reading.system_suggestion_revealed_at)} · fixed-rule
                wording from the two verdicts, never model prose
              </p>
            </div>
            <div className="decision-agree" role="radiogroup" aria-label="Agreement with the suggestion">
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

          <div className="decision-card">
            <p className="decision-card-title">The requirement you are approving</p>
            <div className="field-grid">
              <Field label="Who must act?">
                {(aria) => (
                  <input {...aria} value={actor} onChange={(event) => setActor(event.target.value)} />
                )}
              </Field>
              <Field label="What must they do?" error={actionError}>
                {(aria) => (
                  <input {...aria} value={action} onChange={(event) => setAction(event.target.value)}
                    placeholder="For example: apply" />
                )}
              </Field>
              <Field label="To what?" error={objectError}>
                {(aria) => (
                  <input {...aria} value={object} onChange={(event) => setObject(event.target.value)}
                    placeholder="For example: critical patches" />
                )}
              </Field>
            </div>
            <Field label="Reason for approving" error={reasonError}>
              {(aria) => (
                <textarea {...aria} rows={2} value={reason}
                  onChange={(event) => setReason(event.target.value)} />
              )}
            </Field>
          </div>
        </div>

        <aside className="decision-rail" aria-label="Due date calculator">
          <div className="decision-card">
            <p className="decision-card-title">Due date calculator</p>
            <Field
              label="Committed trigger policy"
              hint="Recorded before the suggestion was shown; cannot be edited now."
            >
              {(aria) => <input {...aria} value={reading.trigger_policy} disabled />}
            </Field>
            <Field
              label="Trigger event date"
              hint="Leave blank and no due date will be computed — honestly blocked."
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
            <div className="decision-preview decision-preview--calc">
              <span className="micro">Due date preview</span>
              <span className="decision-preview-value decision-preview-value--xl">
                {previewDueDate(triggerDate, record.duration_value, record.duration_unit)
                  ?? "No date"}
              </span>
              <span className="meta">
                Based on {record.locator} — {record.duration_label ?? "the stated period"} from
                the trigger date. Preview only; the engine records the real date on approval.
              </span>
            </div>
          </div>
        </aside>
      </div>

      <div className="decision-commit decision-actionbar">
        <div className="decision-actionbar-copy">
          <p className="decision-commit-title">This decision is recorded against your name.</p>
          <p className="decision-commit-sub">
            Approval creates an ordinary signed requirement in this document&rsquo;s record —
            it appears under Requirements and in the exported reports.
          </p>
        </div>
        <div className="btn-row decision-actionbar-actions">
          <button
            type="button"
            className="btn btn--primary decision-commit-btn"
            disabled={busy}
            onClick={() => {
              setTouched(true);
              if (!complete) return;
              void act(
                () =>
                  regosApi.approveDocumentCase(record.document_id, {
                    actor: actor.trim(),
                    action: action.trim(),
                    obligation_object: object.trim(),
                    trigger_date: triggerDate || null,
                    reason: reason.trim(),
                    agrees_with_system_suggestion: agreement === "AGREE",
                  }),
                true,
              );
            }}
          >
            {busy && <span className="spinner" aria-hidden="true" />}
            Approve final decision
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Stage 3 — sealed.
 * ------------------------------------------------------------------------- */

function CaseSealed({ record }: { record: DocumentCaseRecord }) {
  const approval = record.approval!;
  return (
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
        Recorded by: <strong>{approval.reviewer_name} ({approval.reviewer_role})</strong>
        <span className="meta"> · policy: {approval.trigger_policy}</span>
        {approval.due_date ? (
          <span className="meta"> · due {formatDate(approval.due_date)}</span>
        ) : (
          <span className="meta"> · no due date — {approval.blocked_reason}</span>
        )}
      </p>
      <code className="decision-sealed-sha mono">req · {approval.requirement_id}</code>
    </div>
  );
}
