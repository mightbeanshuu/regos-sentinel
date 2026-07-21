"use client";

import { animate, stagger } from "animejs";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { regosApi } from "../lib/api";
import type {
  BuildRun,
  CoverageEntry,
  LiveSourceVerificationReceipt,
  Obligation,
  SourceSpan,
  WorkspaceState,
} from "../lib/types";
import { VerificationField } from "./VerificationField";

const PIPELINE = ["INGEST", "COVERAGE", "COMPILE", "VERIFY", "APPLY", "OPERATE", "DIFF", "PROVE"];
const PIPELINE_LABELS: Record<string, string> = {
  INGEST: "Load source",
  COVERAGE: "Check every clause",
  COMPILE: "Draft duties",
  VERIFY: "Test meaning",
  APPLY: "Check entity",
  OPERATE: "Create work",
  DIFF: "Track change",
  PROVE: "Export proof",
};

function shortHash(value: string): string {
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

function statusTone(value: string): string {
  if (["APPROVED", "PASS", "CORRECT", "CURRENT", "COMPILED_OBLIGATION", "RESOLVED_HASHED", "APPLIES", "SCHEMA_VALIDATED", "LIVE_SOURCE_VERIFIED"].includes(value)) return "success";
  if (["FAILED", "FAIL", "INCORRECT", "NON_CONFORMING"].includes(value)) return "danger";
  if (["BLOCK", "BLOCKED", "BLOCKED_AWAITING_HUMAN", "ABSTAINED_CORRECTLY", "ABSTAINED_UNNECESSARILY", "AMBIGUOUS_REVIEW_REQUIRED", "NEEDS_REVALIDATION", "OPEN", "RECOMMENDED", "ADVISORY_REVIEW", "REVIEW_NEEDED", "SOURCE_CHANGED_REVIEW_REQUIRED", "PARTIAL_MATCH_REVIEW_REQUIRED"].includes(value)) return "warning";
  return "neutral";
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className={`status-pill ${statusTone(value)}`}>
      <span className="status-dot" aria-hidden="true" />
      {value.replaceAll("_", " ")}
    </span>
  );
}

function Pipeline({ latestBuild }: { latestBuild?: BuildRun }) {
  const reducedMotion = useReducedMotion();
  return (
    <ol className="pipeline" aria-label="Compliance compilation pipeline">
      {PIPELINE.map((stage, index) => {
        let state = "queued";
        if (!latestBuild && index === 0) state = "current";
        if (latestBuild?.status === "FAILED") {
          if (index === 0) state = "done";
          if (stage === "COVERAGE" || stage === "VERIFY") state = "failed";
          if (stage === "COMPILE") state = "current";
        }
        if (latestBuild?.status === "BLOCKED_AWAITING_HUMAN") {
          if (index === 0) state = "done";
          if (stage === "COVERAGE" || stage === "VERIFY") state = "blocked";
          if (stage === "COMPILE") state = "current";
        }
        if (latestBuild?.status === "APPROVED") state = "done";
        return (
          <motion.li
            key={stage}
            className={state}
            layout={!reducedMotion}
            transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{PIPELINE_LABELS[stage]}</strong>
          </motion.li>
        );
      })}
    </ol>
  );
}

function ProvenanceLegend() {
  return (
    <section className="provenance-legend" aria-label="Provenance value legend">
      <strong>Where each value came from</strong>
      <span><i className="source" />SOURCE_EXPLICIT <small>stated in source</small></span>
      <span><i className="deterministic" />DETERMINISTIC <small>rule-computed</small></span>
      <span><i className="suggested" />AI_SUGGESTED <small>candidate only</small></span>
      <span><i className="human" />HUMAN_POLICY <small>authorized entity input</small></span>
    </section>
  );
}

function LiveWorkflow({
  receipt,
  latestBuild,
  busy,
  sourceBusy,
  onVerify,
  onRun,
}: {
  receipt: LiveSourceVerificationReceipt | null;
  latestBuild?: BuildRun;
  busy: boolean;
  sourceBusy: boolean;
  onVerify: () => Promise<void>;
  onRun: () => Promise<void>;
}) {
  const buildDone = Boolean(latestBuild);
  const reviewDone = latestBuild?.status === "APPROVED";
  const sourceVerified = receipt?.status === "LIVE_SOURCE_VERIFIED";
  const reducedMotion = useReducedMotion();
  return (
    <section className="live-workflow" id="live-workflow" aria-labelledby="live-workflow-heading">
      <div className="live-workflow-heading">
        <div>
          <span className="live-badge"><i /> LIVE DEMO</span>
          <h2 id="live-workflow-heading">Start with SEBI’s PDF. Finish with assigned work.</h2>
          <p>These buttons call the live API. Each step shows the data it actually read or changed.</p>
        </div>
        <a href="https://www.sebi.gov.in/sebi_data/faqfiles/jun-2025/1749647139924.pdf" target="_blank" rel="noreferrer" className="text-link">
          Open the same SEBI PDF ↗
        </a>
      </div>
      <ol className="journey-steps">
        <li className={receipt ? "complete" : "active"}>
          <span className="journey-number">1</span>
          <div>
            <strong>Fetch and verify the official source</strong>
            <p>Download the live 23-page FAQ, hash the full file, and find the nine reviewed passages.</p>
            <button className="secondary-button" disabled={sourceBusy || busy} onClick={() => void onVerify()} type="button">
              {sourceBusy ? "Reading SEBI PDF…" : receipt ? "Verify source again" : "Fetch official SEBI PDF"}
            </button>
          </div>
          <StatusPill value={receipt?.status ?? "READY"} />
        </li>
        <li className={buildDone ? "complete" : receipt ? "active" : ""}>
          <span className="journey-number">2</span>
          <div>
            <strong>Run the compliance checks</strong>
            <p>Test every reviewed passage against the current control and stop if a required fact is missing.</p>
            {!buildDone && (
              <button className="primary-button" disabled={busy || sourceBusy} onClick={() => void onRun()} type="button">
                {busy ? "Checking source and rules…" : sourceVerified ? "Run checks on verified SEBI passages" : "Run checks using saved reviewed passages"}
              </button>
            )}
          </div>
          <StatusPill value={latestBuild?.status ?? "READY"} />
        </li>
        <li className={reviewDone ? "complete" : latestBuild?.status === "BLOCKED_AWAITING_HUMAN" ? "active" : ""}>
          <span className="journey-number">3</span>
          <div>
            <strong>Let a compliance officer decide the missing fact</strong>
            <p>The system shows the exact text, records the officer’s policy input, recalculates dates, and opens work.</p>
            {latestBuild?.status === "BLOCKED_AWAITING_HUMAN" && (
              <button
                className="secondary-button"
                onClick={() => document.getElementById("human-review")?.scrollIntoView({
                  behavior: reducedMotion ? "auto" : "smooth",
                  block: "start",
                })}
                type="button"
              >
                Open the human review
              </button>
            )}
          </div>
          <StatusPill value={reviewDone ? "APPROVED" : latestBuild?.status === "BLOCKED_AWAITING_HUMAN" ? "REVIEW_NEEDED" : "WAITING"} />
        </li>
      </ol>
      {receipt && (
        <div className="source-receipt" aria-live="polite">
          <div><small>HTTP response</small><strong>{receipt.http_status} · {receipt.content_type}</strong></div>
          <div><small>Live file</small><strong>{receipt.page_count} pages · {(receipt.byte_count / 1024).toFixed(1)} KB</strong></div>
          <div><small>Passages found</small><strong>{receipt.matched_span_ids.length}/{receipt.checked_span_count}</strong></div>
          <div><small>Full-PDF SHA-256</small><strong title={receipt.document_sha256}>{shortHash(receipt.document_sha256)}</strong></div>
          <p>{receipt.note}</p>
        </div>
      )}
    </section>
  );
}

function CoverageRow({
  entry,
  span,
  selected,
  onSelect,
}: {
  entry: CoverageEntry;
  span: SourceSpan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button className={`coverage-row ${selected ? "selected" : ""}`} onClick={onSelect} type="button">
      <span className="coverage-copy">
        <strong>{span.question}</strong>
        <small>{entry.rationale}</small>
      </span>
      <StatusPill value={entry.status} />
    </button>
  );
}

function SourceInspector({ state }: { state: WorkspaceState }) {
  const initial = state.coverage.find((entry) => entry.status === "AMBIGUOUS_REVIEW_REQUIRED")?.span_id;
  const [selectedId, setSelectedId] = useState(initial ?? "FAQ-Q17-A");
  const selected = state.source_spans.find((span) => span.id === selectedId) ?? state.source_spans[0];
  const document = state.documents.find((item) => item.id === selected.document_id) ?? state.documents[0];
  const statements = state.regulatory_statements.filter((item) => item.span_id === selected.id);

  useEffect(() => {
    if (!state.source_spans.some((span) => span.id === selectedId)) setSelectedId(state.source_spans[0].id);
  }, [selectedId, state.source_spans]);

  return (
    <section className="workspace-grid" aria-labelledby="source-heading">
      <div className="panel coverage-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Source checklist</p>
            <h2 id="source-heading">Every reviewed passage is accounted for</h2>
          </div>
          <span className="count-badge">{state.coverage.length} spans</span>
        </div>
        <div className="coverage-list">
          {state.coverage.map((entry) => {
            const span = state.source_spans.find((item) => item.id === entry.span_id);
            if (!span) return null;
            return (
              <CoverageRow
                key={entry.id}
                entry={entry}
                span={span}
                selected={selected.id === span.id}
                onSelect={() => setSelectedId(span.id)}
              />
            );
          })}
        </div>
      </div>

      <article className="panel source-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">What SEBI says</p>
            <h2>{selected.question}</h2>
          </div>
          <a href={selected.source_url} target="_blank" rel="noreferrer" className="text-link">
            Open SEBI PDF ↗
          </a>
        </div>
        <p className="locator">{selected.locator}</p>
        <blockquote>{selected.text}</blockquote>
        {statements.length > 0 && (
          <div className="legal-force-list" aria-label="Statement legal-force classifications">
            {statements.map((statement) => (
              <div key={statement.id}>
                <span><strong>“{statement.exact_phrase}”</strong><small>{statement.operational_effect.replaceAll("_", " ")}</small></span>
                <StatusPill value={statement.deontic_force} />
              </div>
            ))}
          </div>
        )}
        <dl className="source-meta">
          <div>
            <dt>Legal state</dt>
            <dd>{document.legal_state}</dd>
          </div>
          <div>
            <dt>Excerpt hash</dt>
            <dd title={document.content_hash}>{shortHash(document.content_hash)}</dd>
          </div>
          <div>
            <dt>Scope</dt>
            <dd>{document.corpus_scope}</dd>
          </div>
        </dl>
        <p className="source-caution">{document.disclaimer}</p>
      </article>
    </section>
  );
}

function CorpusRegistry({ state }: { state: WorkspaceState }) {
  return (
    <section className="panel corpus-registry" aria-labelledby="corpus-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Source registry</p>
          <h2 id="corpus-heading">Exactly what this prototype has and has not processed</h2>
        </div>
        <span className="count-badge">{state.corpus_packs.length} packs</span>
      </div>
      <div className="corpus-pack-grid">
        {state.corpus_packs.map((pack) => (
          <article className="corpus-pack" key={pack.id}>
            <div>
              <small>{pack.published_at} · {pack.version}</small>
              <h3>{pack.title}</h3>
            </div>
            <StatusPill value={pack.status} />
            <p>{pack.scope_note}</p>
            <dl>
              <div><dt>Indexed spans</dt><dd>{pack.indexed_span_count}</dd></div>
              <div><dt>Compiled candidates</dt><dd>{pack.compiled_candidate_count}</dd></div>
              <div><dt>Identity hash</dt><dd title={pack.content_identity_sha256}>{shortHash(pack.content_identity_sha256)}</dd></div>
            </dl>
            <a href={pack.source_url} target="_blank" rel="noreferrer" className="text-link">
              Open registered source ↗
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function BuildConsole({ build, animateRun }: { build?: BuildRun; animateRun: boolean }) {
  const testListRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!build || !animateRun || reducedMotion || !testListRef.current) return;
    const rows = testListRef.current.querySelectorAll<HTMLElement>(".test-row");
    const animation = animate(rows, {
      opacity: { from: 0.45 },
      y: { from: 7 },
      delay: stagger(34),
      duration: 320,
      ease: "outQuart",
    });
    return () => {
      animation.cancel();
    };
  }, [animateRun, build, reducedMotion]);

  if (!build) {
    return (
      <motion.section className="panel empty-console" id="build-console" layout={!reducedMotion}>
        <p className="eyebrow">Compliance check</p>
        <h2>Ready to check the current rule</h2>
        <p>The starting rule gives every VAPT finding three months. Run the checks to see whether the SEBI text supports that.</p>
      </motion.section>
    );
  }
  const displayStatus = build.status === "BLOCKED_AWAITING_HUMAN" ? "BLOCKED" : build.status;
  return (
    <motion.section
      className={`panel build-console ${build.status.toLowerCase()}`}
      id="build-console"
      aria-live="polite"
      aria-busy="false"
      layout={!reducedMotion}
    >
      <div className="build-title-row">
        <div>
          <p className="eyebrow">{build.id} · {build.stage}</p>
          <h2>COMPLIANCE BUILD {displayStatus}</h2>
          <p className="build-headline">{build.headline}</p>
        </div>
        <StatusPill value={build.status} />
      </div>
      <div className="test-list" ref={testListRef}>
        {build.tests.map((test) => (
          <div className="test-row" key={test.id}>
            <span className={`test-icon ${test.status.toLowerCase()}`} aria-hidden="true">
              {test.status === "PASS" ? "✓" : test.status === "BLOCK" ? "!" : "×"}
            </span>
            <span>
              <strong>{test.name}</strong>
              <small>{test.message}</small>
            </span>
            <StatusPill value={test.status} />
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function ReviewPanel({
  onApprove,
  onCommitReading,
  onResolveReference,
  referenceResolved,
  references,
  sourceSpans,
  committedReading,
  blockedDeadline,
  busy,
}: {
  onApprove: (reviewerName: string, reason: string, triggerPolicy: string, triggerDate: string, agrees: boolean) => Promise<void>;
  onCommitReading: (reviewerName: string, independentReading: string, triggerPolicy: string) => Promise<void>;
  onResolveReference: () => Promise<void>;
  referenceResolved: boolean;
  references: WorkspaceState["references"];
  sourceSpans: SourceSpan[];
  committedReading?: WorkspaceState["reviewer_readings"][number];
  blockedDeadline?: WorkspaceState["deadline_computations"][number];
  busy: boolean;
}) {
  const [reviewerName, setReviewerName] = useState("Aditi Rao");
  const [independentReading, setIndependentReading] = useState("");
  const [reason, setReason] = useState(
    "Q17 and PR.MA.S3 support the one-week duration but do not state its clock-start; approve the split and record our entity policy separately.",
  );
  const [triggerPolicy, setTriggerPolicy] = useState("");
  const [triggerDate, setTriggerDate] = useState("2026-07-22");
  const [agreement, setAgreement] = useState<"" | "AGREE" | "DISAGREE">("");
  const activeReviewer = committedReading?.reviewer_name ?? reviewerName;
  const activePolicy = committedReading?.trigger_policy ?? triggerPolicy;
  return (
    <section className="panel review-panel" id="human-review">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Human review · system answer hidden until you respond</p>
          <h2>{committedReading ? "Compare your reading with the system" : "Read the source before seeing the system’s answer"}</h2>
        </div>
        <StatusPill value="REVIEW_NEEDED" />
      </div>
      <div className="reference-card">
        <span>
          <small>Four cited references must be checked</small>
          <strong>Q15 → Table 19 / Guideline 6 · Q16 → Annexure-A · Q17(a) → PR.MA.S3</strong>
          <em>{referenceResolved ? (committedReading ? "Hash-pinned dependencies were reviewed before the system suggestion was revealed." : "Hash-pinned dependencies are ready. Read them, then commit your own interpretation.") : "Build cannot pass while these explicit outbound references are unresolved."}</em>
        </span>
        {referenceResolved ? (
          <StatusPill value="RESOLVED_HASHED" />
        ) : (
          <button className="secondary-button" disabled={busy} onClick={() => void onResolveReference()} type="button">
            Load the 4 cited sections
          </button>
        )}
      </div>
      {referenceResolved && (
        <details className="reference-evidence" open={!committedReading}>
          <summary>
            <span><strong>4 CSCRF sections loaded and hash-pinned</strong><small>Inspect the exact passages used by this demo</small></span>
            <span aria-hidden="true">＋</span>
          </summary>
          <div className="reference-evidence-grid">
            {references.map((reference) => {
              const target = sourceSpans.find((span) => span.id === reference.target_span_id);
              return (
                <article key={reference.id}>
                  <div>
                    <strong>{target?.question ?? reference.target_locator}</strong>
                    <StatusPill value={reference.status} />
                  </div>
                  <small>{reference.target_locator}</small>
                  {target && <blockquote>{target.text}</blockquote>}
                  <p>{reference.resolution_note}</p>
                  {reference.target_hash && <code title={reference.target_hash}>Excerpt SHA-256 · {shortHash(reference.target_hash)}</code>}
                  {target && <a className="text-link" href={target.source_url} target="_blank" rel="noreferrer">Open governing CSCRF PDF ↗</a>}
                </article>
              );
            })}
          </div>
        </details>
      )}
      {!committedReading ? (
        <div className="independent-review-stage">
          <div className="review-question">
            <small>Your decision</small>
            <strong>What rule does Q17(a) support, and what event starts its one-week clock?</strong>
            <span>The system candidate is deliberately hidden until you commit.</span>
          </div>
          <label>
            Reviewer name
            <input value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} />
          </label>
          <label>
            Your independent reading
            <textarea rows={3} value={independentReading} onChange={(event) => setIndependentReading(event.target.value)} placeholder="Write what the cited text supports and what remains a policy decision…" />
          </label>
          <label>
            Entity policy you would use for clock-start
            <input value={triggerPolicy} onChange={(event) => setTriggerPolicy(event.target.value)} placeholder="Enter a policy; do not attribute it to SEBI" />
          </label>
          <div className="button-row">
            <button
              className="secondary-button"
              disabled={busy}
              onClick={() => {
                setIndependentReading(
                  "Q17(a) supports a one-week maximum for high-severity findings caused by missing patches. It does not state which event starts that clock.",
                );
                setTriggerPolicy("Date the finding is recorded in the entity vulnerability register");
              }}
              type="button"
            >
              Fill synthetic demo response
            </button>
            <button
              className="primary-button"
              type="button"
              disabled={busy || !referenceResolved || reviewerName.trim().length < 2 || independentReading.trim().length < 8 || triggerPolicy.trim().length < 8}
              onClick={() => void onCommitReading(reviewerName.trim(), independentReading.trim(), triggerPolicy.trim())}
            >
              {busy ? "Saving your reading…" : "Save my reading, then show the system view"}
            </button>
            <span>Your answer is time-stamped and cannot be rewritten later in this demo.</span>
          </div>
        </div>
      ) : (
        <div className="revealed-review-stage">
          <div className="pre-reveal-receipt">
            <small>Committed before reveal · {committedReading.committed_at}</small>
            <strong>{committedReading.independent_interpretation}</strong>
            <span>{committedReading.reviewer_name} · policy: {committedReading.trigger_policy}</span>
          </div>
          <div className="interpretation-diff">
            <div>
              <small>Rule currently in the control register</small>
              <strong>All VAPT findings → 3 months</strong>
              <span>Derived from Q15 alone</span>
            </div>
            <div className="arrow" aria-hidden="true">→</div>
            <div>
              <small>System’s source-backed suggestion</small>
              <strong>{committedReading.revealed_system_suggestion}</strong>
              <span>System view revealed after {committedReading.committed_at}</span>
            </div>
          </div>
          <div className="incomplete-rule">
            <div><small>Duration</small><strong>{blockedDeadline?.duration_label}</strong><StatusPill value={blockedDeadline?.duration_provenance ?? "SOURCE_EXPLICIT"} /></div>
            <div><small>Clock starts from</small><strong>— {blockedDeadline?.blocked_reason} —</strong><StatusPill value="UNRESOLVED" /></div>
            <div><small>Due date</small><strong>{blockedDeadline?.computable === false && blockedDeadline.due_date === null ? "CANNOT COMPUTE" : blockedDeadline?.due_date ?? "BLOCKED"}</strong><StatusPill value="BLOCKED" /></div>
          </div>
          <label>
            Decision reason
            <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <div className="policy-input-grid">
            <label>
              Committed entity policy for clock-start
              <input value={activePolicy} disabled />
            </label>
            <label>
              Synthetic trigger date
              <input type="date" value={triggerDate} onChange={(event) => setTriggerDate(event.target.value)} />
            </label>
          </div>
          <label>
            Independent reading vs system suggestion
            <select value={agreement} onChange={(event) => setAgreement(event.target.value as "" | "AGREE" | "DISAGREE")}>
              <option value="">Record agreement or disagreement…</option>
              <option value="AGREE">Agrees with system suggestion</option>
              <option value="DISAGREE">Disagrees — reason recorded above</option>
            </select>
          </label>
          <p className="policy-caution">The clock-start is stored as <strong>HUMAN_POLICY</strong>, never as a SEBI-sourced fact.</p>
          <div className="button-row">
            <button
              className="primary-button"
              type="button"
              disabled={busy || reason.trim().length < 8 || !triggerDate || !agreement}
              onClick={() => void onApprove(activeReviewer, reason.trim(), activePolicy, triggerDate, agreement === "AGREE")}
            >
            {busy ? "Applying the decision…" : "Approve, recalculate, and create work"}
            </button>
            <span>Independent reading, reveal, agreement, reason, and reviewer are persisted.</span>
          </div>
        </div>
      )}
    </section>
  );
}

function ObligationCard({ obligation }: { obligation: Obligation }) {
  return (
    <article className="obligation-card">
      <div className="obligation-topline">
        <span>{obligation.id}</span>
        <StatusPill value={obligation.provenance} />
      </div>
      <h3>{obligation.action} {obligation.object}</h3>
      <dl>
        <div><dt>Condition</dt><dd>{obligation.condition}</dd></div>
        <div><dt>Deadline</dt><dd>{obligation.deadline.duration} {obligation.deadline.unit}</dd></div>
        <div><dt>Trigger</dt><dd>{obligation.deadline.trigger}</dd></div>
        <div><dt>Owner control</dt><dd>{obligation.control_id}</dd></div>
      </dl>
      <p className="citation-line">↗ {obligation.deadline.citation.locator}</p>
    </article>
  );
}

function ApprovedWorkspace({
  state,
  onBenchmark,
  onToggleQsb,
  onSetApplicability,
  animateRun,
  busy,
}: {
  state: WorkspaceState;
  onBenchmark: () => Promise<void>;
  onToggleQsb: (value: boolean) => Promise<void>;
  onSetApplicability: (hasSecondRegistration: boolean, hasDormantLicense: boolean) => Promise<void>;
  animateRun: boolean;
  busy: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const activeObligations = state.obligations.filter((item) => item.status === "ACTIVE");
  const build = state.builds.at(-1)!;
  const control = state.controls[0];
  const sla = state.vendor_slas[0];
  const evidence = state.evidence[0];
  const hasSecondRegistration = state.entity_profile.registrations.some(
    (item) => item.registration_type === "DEPOSITORY_PARTICIPANT",
  );
  return (
    <>
      <motion.section
        className="impact-strip"
        aria-label="Build impact summary"
        initial={reducedMotion || !animateRun ? false : { opacity: 0.7, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: reducedMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div><strong>{build.impact.controls_changed}</strong><span>control changed</span></div>
        <div><strong>{build.impact.vendor_sla_advisories}</strong><span>vendor SLA advisory</span></div>
        <div><strong>{build.impact.evidence_revalidation}</strong><span>evidence needs revalidation</span></div>
        <div><strong>{build.impact.tasks_created}</strong><span>remediation tasks opened</span></div>
      </motion.section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Compiled obligations</p>
            <h2>Approved conditional control logic</h2>
          </div>
          <StatusPill value="HUMAN_APPROVED" />
        </div>
        <div className="obligation-grid">
          {activeObligations.map((obligation) => <ObligationCard key={obligation.id} obligation={obligation} />)}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Deterministic calendar trace</p>
            <h2>Due dates without hidden assumptions</h2>
          </div>
          <span className="count-badge">{state.deadline_computations.length} synthetic findings</span>
        </div>
        <div className="deadline-grid">
          {state.deadline_computations.map((computation) => {
            const finding = state.findings.find((item) => item.id === computation.finding_id);
            return (
              <article className="deadline-card" key={computation.id}>
                <div className="obligation-topline">
                  <span>{computation.finding_id} · {finding?.severity} · SYNTHETIC</span>
                  <StatusPill value={computation.duration_provenance} />
                </div>
                <h3>{finding?.title}</h3>
                <div className="due-date"><small>Calculated due date</small><strong>{computation.due_date}</strong></div>
                <ol className="calculation-trace">
                  {computation.calculation_trace.map((step) => <li key={step}>{step}</li>)}
                </ol>
                {computation.human_policy_note && <p className="assumption-note"><strong>Human policy note:</strong> {computation.human_policy_note}</p>}
                <p className="citation-line">↗ {computation.citation.locator}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="operations-grid">
        <article className="panel">
          <p className="eyebrow">Control diff · v1 → v{control.version}</p>
          <h2>{control.name}</h2>
          <div className="diff-block removed"><small>Before</small><p>{control.previous_rule_summary}</p></div>
          <div className="diff-block added"><small>After</small><p>{control.rule_summary}</p></div>
        </article>
        <article className="panel">
          <p className="eyebrow">Operational consequences</p>
          <div className="consequence-row">
            <span><strong>{sla.vendor}</strong><small>{sla.committed_days} days committed · {sla.required_days} required</small></span>
            <StatusPill value={sla.status} />
          </div>
          <div className="consequence-row">
            <span><strong>{evidence.name}</strong><small>{evidence.reason}</small></span>
            <StatusPill value={evidence.status} />
          </div>
          {state.tasks.map((task) => (
            <div className="consequence-row" key={task.id}>
              <span><strong>{task.title}</strong><small>{task.work_type} · {task.owner} · due in {task.due_days} days · synthetic</small></span>
              <StatusPill value={task.status} />
            </div>
          ))}
        </article>
      </section>

      <details className="advanced-evidence">
        <summary>
          <span><strong>Advanced evidence and edge cases</strong><small>QSB dates · applicability receipts · manifest · OSCAL · benchmark</small></span>
          <span aria-hidden="true">＋</span>
        </summary>
        <div className="advanced-evidence-body">
      <section className="operations-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Applicability Receipt</p>
              <h2>QSB periodicity override</h2>
            </div>
            <StatusPill value={state.entity_profile.is_qsb ? "APPLIES" : "OUT_OF_PROFILE_SCOPE"} />
          </div>
          <p className="profile-line">
            {state.entity_profile.legal_name} · {state.entity_profile.cscrf_category} · {state.entity_profile.is_qsb ? "QSB" : "NON-QSB"}
          </p>
          <p>Q14 makes VAPT and cyber-audit periodicity half-yearly for QSBs regardless of their CSCRF category.</p>
          <button className="secondary-button" disabled={busy} onClick={() => void onToggleQsb(!state.entity_profile.is_qsb)} type="button">
            Set profile to {state.entity_profile.is_qsb ? "non-QSB" : "QSB"} & recompute
          </button>
          {state.periodicity_windows.length > 0 && (
            <div className="periodicity-windows">
              {state.periodicity_windows.map((window) => (
                <div key={window.id}>
                  <span><strong>{window.period_label}</strong><small>{window.financial_year} · not rolling six months</small></span>
                  <code>{window.period_start} → {window.period_end}</code>
                </div>
              ))}
              <p>↗ FAQ Q14 + Q20 · deterministic financial-year calculation</p>
            </div>
          )}
        </article>

        <article className="panel manifest-card">
          <p className="eyebrow">Prove</p>
          <h2>Compliance Build Manifest</h2>
          <p>Source, schema, ruleset, reviewer, tests, evidence state, audit history, and replay input are versioned together.</p>
          <code>{state.latest_manifest ? shortHash(state.latest_manifest.manifest_sha256) : "manifest unavailable"}</code>
          <div className="button-row compact">
            <a className="primary-button link-button" href="/api/v1/manifests/latest?download=true">Export manifest</a>
            <a className="secondary-button link-button" href="/api/v1/exports/oscal/assessment-results?download=true">Export OSCAL 1.2.2</a>
            <button className="secondary-button" disabled={busy} onClick={() => void onBenchmark()} type="button">
              {busy ? "Running…" : "Run golden-set benchmark"}
            </button>
          </div>
          <p className="oscal-proof">
            <StatusPill value="SCHEMA_VALIDATED" />
            <a href="/api/v1/exports/oscal/validation" target="_blank">Open pinned NIST-schema validation receipt ↗</a>
          </p>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Applicability hard cases · synthetic facts</p>
            <h2>Every inclusion and exclusion gets a receipt</h2>
          </div>
          <span className="count-badge">FAQ Q24 + Q25</span>
        </div>
        <div className="scenario-controls">
          <button
            className={`scenario-toggle ${hasSecondRegistration ? "active" : ""}`}
            disabled={busy}
            onClick={() => void onSetApplicability(!hasSecondRegistration, state.entity_profile.has_dormant_license)}
            type="button"
          >
            <small>Entity fact</small>
            <strong>{hasSecondRegistration ? "✓" : "+"} Second SEBI registration</strong>
            <span>Tests Q24 highest-category precedence</span>
          </button>
          <button
            className={`scenario-toggle ${state.entity_profile.has_dormant_license ? "active" : ""}`}
            disabled={busy}
            onClick={() => void onSetApplicability(hasSecondRegistration, !state.entity_profile.has_dormant_license)}
            type="button"
          >
            <small>Entity fact</small>
            <strong>{state.entity_profile.has_dormant_license ? "✓" : "+"} Dormant licensed service</strong>
            <span>Tests Q25 registration-based scope</span>
          </button>
        </div>
        <div className="receipt-grid">
          {state.applicability_scenarios.map((receipt) => (
            <article className="receipt-card" key={receipt.id}>
              <div className="obligation-topline">
                <span>{receipt.source_span_id} · SYNTHETIC PROFILE</span>
                <StatusPill value={receipt.activated ? "APPLIES" : "OUT_OF_PROFILE_SCOPE"} />
              </div>
              <h3>{receipt.scenario}</h3>
              <code>{receipt.decision}</code>
              <p>{receipt.reason}</p>
              <ul>{receipt.entity_facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
              <p className="citation-line">↗ {receipt.citation.locator}</p>
            </article>
          ))}
        </div>
      </section>

      {state.latest_benchmark && (
        <section className="panel benchmark-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Measured benchmark</p><h2>{state.latest_benchmark.passed}/{state.latest_benchmark.cases.length} cases passed</h2></div>
            <span className="benchmark-label">{state.latest_benchmark.label}</span>
          </div>
          <div className="operating-point-table" role="table" aria-label="Abstention operating points">
            <div className="operating-point-head" role="row">
              <span>Setting</span><span>Answered</span><span>Wrong when answered</span><span>Handed to human</span>
            </div>
            {state.latest_benchmark.operating_points.map((point) => (
              <div className="operating-point-row" role="row" key={point.setting}>
                <span><strong>{point.setting}</strong><small>{point.policy}</small></span>
                <span><strong>{point.answered_pct}%</strong><small>{point.answered}/{point.total}</small></span>
                <span><strong>{point.error_rate_on_answered}%</strong><small>{point.incorrect_answers} cases</small></span>
                <span><strong>{point.deferred_pct}%</strong><small>{point.deferred} cases</small></span>
              </div>
            ))}
          </div>
          <div className="benchmark-table" role="table" aria-label="Benchmark cases">
            {state.latest_benchmark.cases.map((item) => (
              <div className="benchmark-row" role="row" key={item.id}>
                <span role="cell"><strong>{item.name}</strong><small>{item.source_span_id}</small></span>
                <span role="cell">Expected: {item.expected}</span>
                <span role="cell">Actual: {item.actual}</span>
                <StatusPill value={item.outcome} />
              </div>
            ))}
          </div>
        </section>
      )}
        </div>
      </details>
    </>
  );
}

export default function Home() {
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [busy, setBusy] = useState(false);
  const [sourceBusy, setSourceBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionRevision, setActionRevision] = useState(0);
  const [sourceReceipt, setSourceReceipt] = useState<LiveSourceVerificationReceipt | null>(null);

  const load = useCallback(async () => {
    try {
      setState(await regosApi.workspace());
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load RegOS API");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const act = useCallback(async (
    operation: () => Promise<WorkspaceState>,
    focusTarget?: string,
  ) => {
    setBusy(true);
    setError(null);
    try {
      setState(await operation());
      setActionRevision((value) => value + 1);
      if (focusTarget) {
        window.requestAnimationFrame(() => {
          document.getElementById(focusTarget)?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            block: "start",
          });
        });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Operation failed");
    } finally {
      setBusy(false);
    }
  }, []);

  const latestBuild = useMemo(() => state?.builds.at(-1), [state]);

  const verifyLiveSource = useCallback(async () => {
    setSourceBusy(true);
    setError(null);
    try {
      setSourceReceipt(await regosApi.verifyLiveSource());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to verify the live SEBI source");
    } finally {
      setSourceBusy(false);
    }
  }, []);

  if (!state) {
    return (
      <main className="loading-shell">
        <p className="eyebrow">RegOS Sentinel</p>
        <h1>{error ? "API connection required" : "Loading the demo workspace…"}</h1>
        <p>{error ?? "Connecting to the saved prototype state."}</p>
        {error && <button className="primary-button" onClick={() => void load()} type="button">Retry</button>}
      </main>
    );
  }

  return (
    <main>
      <header className="topbar" id="top">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span><strong>RegOS Sentinel</strong><small>SEBI rules-to-work prototype</small></span>
        </div>
        <div className="truth-labels" aria-label="Prototype data labels">
          <span>LIVE PROTOTYPE</span><span>PUBLIC SEBI SOURCE</span><span>SYNTHETIC ENTITY & EVIDENCE</span>
        </div>
        <button
          className="reset-button"
          disabled={busy || sourceBusy}
          onClick={() => {
            setSourceReceipt(null);
            void act(regosApi.reset, "top");
          }}
          type="button"
        >
          Reset demo
        </button>
      </header>

      <div className="page-shell">
        <section className="intro-row">
          <div>
            <p className="eyebrow">SEBI CSCRF FAQ · live compliance workflow</p>
            <h1>Turn SEBI guidance into dated, owned work.</h1>
            <p>Load the official PDF, catch an unsafe deadline, record the compliance officer’s decision, and watch the tasks and evidence update.</p>
          </div>
          <div className={`entity-chip ${latestBuild ? statusTone(latestBuild.status) : "neutral"}`}>
            <VerificationField status={latestBuild?.status ?? "IDLE"} />
            <div className="entity-content">
              <small>Active profile</small>
              <strong>{state.entity_profile.legal_name}</strong>
              <span>{state.entity_profile.cscrf_category} · {state.entity_profile.is_qsb ? "QSB" : "NON-QSB"} · SYNTHETIC</span>
              <em>{latestBuild ? latestBuild.status.replaceAll("_", " ") : "READY FOR BUILD"}</em>
            </div>
          </div>
        </section>

        <Pipeline latestBuild={latestBuild} />
        <ProvenanceLegend />
        {error && <div className="error-banner" role="alert">{error}</div>}

        <LiveWorkflow
          receipt={sourceReceipt}
          latestBuild={latestBuild}
          busy={busy}
          sourceBusy={sourceBusy}
          onVerify={verifyLiveSource}
          onRun={() => act(regosApi.runBuild, "build-console")}
        />

        <AnimatePresence initial={false} mode="wait">
          <BuildConsole key={latestBuild?.id ?? "empty-build"} build={latestBuild} animateRun={actionRevision > 0} />
        </AnimatePresence>

        {latestBuild?.status === "APPROVED" && (
          <ApprovedWorkspace
            state={state}
            busy={busy}
            animateRun={actionRevision > 0}
            onBenchmark={() => act(regosApi.runBenchmark)}
            onToggleQsb={(value) => act(() => regosApi.setQsb(value, "Aditi Rao"))}
            onSetApplicability={(hasSecond, hasDormant) => act(() => regosApi.setApplicabilityScenario(hasSecond, hasDormant, "Aditi Rao"))}
          />
        )}

        <SourceInspector state={state} />

        {latestBuild?.status === "BLOCKED_AWAITING_HUMAN" && (
          <ReviewPanel
            busy={busy}
            referenceResolved={state.references.every((item) => item.status === "RESOLVED_HASHED")}
            references={state.references}
            sourceSpans={state.source_spans}
            committedReading={state.reviewer_readings.find((item) => item.span_id === "FAQ-Q17-A")}
            blockedDeadline={state.deadline_computations.find((item) => item.finding_id === "FND-PATCH-001" && !item.computable)}
            onResolveReference={() => act(regosApi.resolveScopedReferences)}
            onCommitReading={(reviewerName, independentReading, triggerPolicy) => act(() => regosApi.commitQ17Reading({
              reviewer_name: reviewerName,
              reviewer_role: "Compliance Officer",
              independent_interpretation: independentReading,
              trigger_policy: triggerPolicy,
            }))}
            onApprove={(reviewerName, reason, triggerPolicy, triggerDate, agrees) => act(() => regosApi.approveQ17({
              reviewer_name: reviewerName,
              reviewer_role: "Compliance Officer",
              reason,
              trigger_policy: triggerPolicy,
              trigger_date: triggerDate,
              agrees_with_system_suggestion: agrees,
            }), "build-console")}
          />
        )}

        <details className="advanced-evidence source-registry-drawer">
          <summary>
            <span><strong>Source registry and scope limits</strong><small>See which documents are active, registered, or not processed</small></span>
            <span aria-hidden="true">＋</span>
          </summary>
          <div className="advanced-evidence-body"><CorpusRegistry state={state} /></div>
        </details>

        <footer>
          Decision support · no legal advice · no automated filing · no production write access · exact FAQ guidance must be read with governing SEBI instruments.
        </footer>
      </div>
    </main>
  );
}
