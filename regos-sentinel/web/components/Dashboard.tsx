"use client";

import { useCallback, useEffect, useState } from "react";

import { regosApi } from "../lib/api";
import { useChangeKey } from "../lib/liveness";
import { agentNameOf, checkLabel, formatDate, labelOf } from "../lib/presentation";
import type {
  AgentId,
  CciReport,
  DocumentScore,
  LiveSourceVerificationReceipt,
  PlannerKind,
  UploadedDocument,
  WorkspaceState,
} from "../lib/types";
import { AgentConsole } from "./AgentConsole";
import { AskPanel } from "./AskPanel";
import { CciDial } from "./CciDial";
import { IncidentReportingClock } from "./IncidentReportingClock";
import { LiveStrip } from "./LiveStrip";
import { Disclosure, StateLabel } from "./ui";
import {
  GridField,
  IconAgents,
  IconAsk,
  IconCalendar,
  IconClauses,
  IconClock,
  IconDecision,
  IconEvidence,
  IconGauge,
  IconInstitution,
  IconLedger,
} from "./vector";

/**
 * The command centre: one dark bento board, everything above the fold that a
 * person accountable for compliance needs. Every figure is computed from live
 * state on each load; the strip at the top pulses against the real workspace.
 */

const ALL_AGENTS: AgentId[] = [
  "REFERENCE_RESOLVER",
  "EXTRACTOR",
  "SOURCE_SCOUT",
  "ADVERSARY",
];

const AGENT_PLAIN: Record<AgentId, { name: string }> = {
  REFERENCE_RESOLVER: { name: "Reference finder" },
  EXTRACTOR: { name: "Deadline reader" },
  SOURCE_SCOUT: { name: "Change watcher" },
  ADVERSARY: { name: "Challenger" },
};

/** Refresh cadence for the live figures. Slow enough to be free, fast enough to be live. */
const REFRESH_MS = 20_000;

export function Dashboard({
  state,
  documents = [],
  receipt,
  busy,
  onRunCheck,
  onOpenDecision,
  onDownloadReport,
  onVerifySource,
  onRefresh,
  onOpenDocuments,
  onRunAssistants,
}: {
  state: WorkspaceState;
  documents?: UploadedDocument[];
  receipt: LiveSourceVerificationReceipt | null;
  busy: boolean;
  onRunCheck: () => void;
  onOpenDecision: () => void;
  onDownloadReport: () => void;
  onVerifySource: () => void;
  onRefresh: () => void;
  onOpenDocuments?: () => void;
  onRunAssistants?: (documentId: string) => void;
}) {
  const [cci, setCci] = useState<CciReport | null>(null);
  const [planner] = useState<PlannerKind>("DETERMINISTIC_PLAN");
  const [view, setView] = useState<"overview" | "work" | "evidence" | "ask" | "agents">("work");
  const [evidenceKinds, setEvidenceKinds] = useState<Set<string>>(new Set());
  const [lens, setLens] = useState<"demo" | "document">("demo");
  const [docScore, setDocScore] = useState<DocumentScore | null>(null);

  const activeDoc = documents.at(-1) ?? null;

  // The document lens scores live off the committed model, refreshed with the doc.
  useEffect(() => {
    if (lens !== "document" || !activeDoc) { setDocScore(null); return; }
    let cancelled = false;
    void regosApi.documentScore(activeDoc.id)
      .then((value) => { if (!cancelled) setDocScore(value); })
      .catch(() => { if (!cancelled) setDocScore(null); });
    return () => { cancelled = true; };
  }, [lens, activeDoc, activeDoc?.passages.length]);

  const loadCci = useCallback(() => {
    void regosApi.cci().then(setCci).catch(() => setCci(null));
  }, []);

  useEffect(() => {
    loadCci();
  }, [loadCci, state.builds.length, state.reviews.length, state.agent_runs.length]);

  useEffect(() => {
    const timer = window.setInterval(() => { loadCci(); onRefresh(); }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [loadCci, onRefresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") { loadCci(); onRefresh(); }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadCci, onRefresh]);

  const build = state.builds.at(-1);
  const waiting = build?.tests.filter((item) => item.status === "BLOCK") ?? [];
  const failed = build?.tests.filter((item) => item.status === "FAIL") ?? [];
  const passed = build?.tests.filter((item) => item.status === "PASS") ?? [];

  const waitingFlash = useChangeKey(build ? waiting.length : null);
  const failedFlash = useChangeKey(build ? failed.length : null);

  const active = state.obligations.filter((item) => item.status.startsWith("ACTIVE"));
  const blockedDates = state.deadline_computations.filter((item) => !item.computable);
  const evidenceCurrent = state.evidence.filter((item) => item.status === "CURRENT");
  const runsById = new Map(state.agent_runs.map((item) => [item.agent_id, item]));

  const heroTone = !build ? "idle" : failed.length > 0 ? "fail" : waiting.length > 0 ? "review" : "ok";

  return (
    <div className="cmd">
      <header className="cmd-head">
        <div>
          <h1 className="cmd-title">Compliance command centre</h1>
          <p className="cmd-sub">
            {state.entity_profile.legal_name} · {labelOf(state.entity_profile.entity_type)}
            {state.entity_profile.is_qsb ? " · Qualified stockbroker" : ""}
          </p>
        </div>
        <div className="cmd-live">
          <LiveStrip onChange={() => { loadCci(); onRefresh(); }} />
        </div>
      </header>



      <div className="cmd-shell">
      <aside className="cmd-side" aria-label="Command centre sections">
        {([
          ["overview", "Dashboard", IconGauge],
          ["work", "Work queue", IconDecision],
          ["evidence", "Evidence vault", IconEvidence],
          ["ask", "Ask RegOS", IconAsk],
          ["agents", "AI agents", IconAgents],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            className={`side-item${view === id ? " side-item--on" : ""}`}
            aria-pressed={view === id}
            onClick={() => setView(id)}
          >
            <Icon />
            <span className="side-item-label">{label}</span>
            {id === "work" && waiting.length > 0 && (
              <span className="cmd-nav-count">{waiting.length}</span>
            )}
          </button>
        ))}
        <div className="side-foot">
          <span className="side-foot-chip">Synthetic demo data · no automated filing</span>
        </div>
      </aside>
      <div className="cmd-main">
      <div className="cmd-lens" role="group" aria-label="Workspace lens">
        <button
          type="button"
          className={`cmd-lens-pill${lens === "demo" ? " cmd-lens-pill--on" : ""}`}
          aria-pressed={lens === "demo"}
          onClick={() => setLens("demo")}
        >
          Demo corpus
        </button>
        <button
          type="button"
          className={`cmd-lens-pill${lens === "document" ? " cmd-lens-pill--on" : ""}`}
          aria-pressed={lens === "document"}
          onClick={() => {
            if (!activeDoc) { onOpenDocuments?.(); return; }
            setLens("document");
          }}
        >
          My document{activeDoc ? ` · ${activeDoc.filename}` : ""}
        </button>
        {!activeDoc && (
          <span className="meta">Upload a PDF under “Your own document” to switch this lens.</span>
        )}
      </div>

      {view === "overview" && lens === "document" && activeDoc && (
      <div className="bento bento--fit">
        {/* ---- Document hero ------------------------------------------ */}
        <section className={`b-card b-hero b-hero--${activeDoc.scope.passages_needing_review > 0 ? "review" : activeDoc.state === "APPROVED" ? "ok" : "idle"}`}>
          <GridField />
          <div className="b-hero-body">
            <p className="b-hero-word">{activeDoc.filename}</p>
            <p className="cmd-sub">
              {activeDoc.scope.passages_needing_review > 0
                ? `${activeDoc.scope.passages_needing_review} passages are waiting for a person.`
                : activeDoc.state === "APPROVED"
                  ? "A named person has approved a requirement from this document."
                  : "Extracted and classified — nothing becomes work until a person approves it."}
            </p>
            {activeDoc.scope.pages_machine_read.length > 0 && (
              <p className="b-ocr-pill">
                ⌾ {activeDoc.scope.pages_machine_read.length}{" "}
                {activeDoc.scope.pages_machine_read.length === 1 ? "page" : "pages"} machine-read
                (OCR) — labelled, never treated as a text layer
              </p>
            )}
            <div className="btn-row">
              <button type="button" className="btn btn--primary" disabled={busy} onClick={onOpenDocuments}>
                Open the review
              </button>
              {onRunAssistants && (
                <button
                  type="button"
                  className="btn btn--quiet"
                  disabled={busy}
                  onClick={() => { onRunAssistants(activeDoc.id); setView("agents"); }}
                >
                  Run the assistants on it
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ---- The committed model's read ------------------------------ */}
        <section className="b-card b-dial">
          <p className="b-label"><IconGauge /> Deadline clarity — committed model</p>
          {docScore ? (
            <div className="stack-s b-modelread">
              <p className="scorecard-value">
                {docScore.deadline_clarity === null ? "—" : `${Math.round(docScore.deadline_clarity * 100)}%`}
              </p>
              <p className="b-verdict">
                {docScore.with_timing_language === 0
                  ? `The model read all ${docScore.passages_total} passages — none carries timing language, so no deadline can honestly be computed here. That is the answer, not an error.`
                  : docScore.blocked_durations > 0
                    ? `${docScore.blocked_durations} ${docScore.blocked_durations === 1 ? "passage states" : "passages state"} a period with no clock-start — the defect this product exists to catch.`
                    : `${docScore.timing_counts.PERIOD_AND_TRIGGER} ${docScore.timing_counts.PERIOD_AND_TRIGGER === 1 ? "passage supports" : "passages support"} a computable date; nothing states a period without its clock-start.`}
              </p>
              <Disclosure summary="Class-by-class read">
                <div className="b-score-rows">
                  {Object.entries(docScore.timing_counts).map(([label, count]) => {
                    const max = Math.max(...Object.values(docScore.timing_counts), 1);
                    return (
                      <div className="cci-row" key={label}>
                        <span className="cci-row-title">{labelOf(label)}</span>
                        <span className="cci-bar" aria-hidden="true">
                          <span
                            className={`cci-bar-fill${label === "PERIOD_AND_TRIGGER" ? " cci-bar-fill--ok" : label === "NO_TIMING" ? "" : " cci-bar-fill--review"}`}
                            style={{ transform: `scaleX(${count / max})` }}
                          />
                        </span>
                        <span className="cci-row-score">{count}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="meta">{docScore.clarity_formula}.</p>
                <p className="meta">{docScore.limitation}</p>
                <p className="meta">
                  The cyber capability score stays on the demo corpus — its parameters need
                  workspace evidence an uploaded document does not carry. No number is
                  invented under this lens.
                </p>
              </Disclosure>
            </div>
          ) : (
            <p className="b-empty">Score loads once the model reads this document.</p>
          )}
        </section>

        {/* ---- Document figures ---------------------------------------- */}
        <section className="b-kpis b-kpis--compact">
          <div className="b-kpi">
            <span className="b-kpi-value">{activeDoc.passages.length}</span>
            <span className="b-kpi-label">Passages extracted</span>
          </div>
          <div className={activeDoc.scope.passages_needing_review > 0 ? "b-kpi b-kpi--attention" : "b-kpi"}>
            <span className="b-kpi-value">{activeDoc.scope.passages_needing_review}</span>
            <span className="b-kpi-label">Waiting on you</span>
          </div>
          <div className="b-kpi">
            <span className="b-kpi-value">{activeDoc.passages.filter((p) => p.reviewed_by).length}</span>
            <span className="b-kpi-label">Readings recorded</span>
          </div>
          <div className="b-kpi">
            <span className="b-kpi-value">{activeDoc.requirements.length}</span>
            <span className="b-kpi-label">Approvals recorded</span>
          </div>
          <div className="b-kpi">
            <span className="b-kpi-value">
              {activeDoc.scope.pages_read}
              <span className="b-kpi-of">/{activeDoc.scope.page_count}</span>
            </span>
            <span className="b-kpi-label">Pages read</span>
          </div>
        </section>

        {/* ---- What needs you ------------------------------------------ */}
        <section className="b-card b-focus">
          <p className="b-label"><IconDecision /> What needs you</p>
          {activeDoc.scope.passages_needing_review === 0 ? (
            <p className="b-empty">
              Nothing in this document is waiting on a person right now.
            </p>
          ) : (
            <ul className="b-focus-list">
              {activeDoc.passages
                .filter((p) => p.classification === "NEEDS_REVIEW")
                .slice(0, 3)
                .map((p) => (
                  <li key={p.id}>
                    <span className="mono meta">{p.locator}</span>
                    <span className="b-focus-text" title={p.text}>{p.text}</span>
                  </li>
                ))}
              {activeDoc.scope.passages_needing_review > 3 && (
                <li className="b-hero-more">
                  + {activeDoc.scope.passages_needing_review - 3} more under Open the review
                </li>
              )}
            </ul>
          )}
        </section>

        {/* ---- Assistants anchored on this document -------------------- */}
        <section className="b-card b-docagents">
          <p className="b-label"><IconAgents /> Assistants on this document</p>
          <div className="b-context-agents">
            {ALL_AGENTS.map((id) => {
              const run = state.agent_runs
                .filter((r) => r.agent_id === id && r.anchor_document_id === activeDoc.id)
                .at(-1);
              return (
                <div className="b-context-agent" key={id}>
                  <span>{AGENT_PLAIN[id].name}</span>
                  <span className="meta">
                    {run
                      ? `${run.findings.length} findings · ${run.tool_call_count} steps`
                      : "Not run on this document"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      )}

      {view === "overview" && !(lens === "document" && activeDoc) && (
      <div className="exec">
        <div className="exec-main">
          {/* ---- Health score + risk minis ------------------------------ */}
          <div className="exec-row">
            <section className="b-card exec-health">
              <p className="b-label"><IconGauge /> Compliance health score</p>
              {cci ? <CciDial report={cci} /> : <p className="b-empty">Score unavailable.</p>}
            </section>
            <div className="exec-stack">
              <section className="b-card exec-mini">
                <span className="meta">Open risks</span>
                <p className="exec-mini-figure exec-mini-figure--fail" key={failedFlash}>
                  {failed.length + blockedDates.length}
                  <span className="exec-mini-sub">
                    {failed.length} failed · {blockedDates.length} blocked date{blockedDates.length === 1 ? "" : "s"}
                  </span>
                </p>
              </section>
              <section className="b-card exec-mini">
                <div className="exec-mini-split">
                  <div>
                    <span className="meta">Dates that can be worked out</span>
                    <p className="exec-mini-figure">
                      {state.deadline_computations.length - blockedDates.length}
                      <span className="exec-mini-sub">of {state.deadline_computations.length} deadlines</span>
                    </p>
                  </div>
                  <span className={`exec-chip${receipt && receipt.hash_matches_expected ? " exec-chip--ok" : ""}`}>
                    <span className="exec-chip-dot" aria-hidden="true" />
                    SEBI source: {receipt ? <StateLabel value={receipt.status} /> : "Not checked"}
                  </span>
                </div>
              </section>
            </div>
          </div>

          {/* ---- SEBI sources — live monitoring ------------------------- */}
          <section className="b-card exec-monitor">
            <div className="exec-monitor-head">
              <p className="b-label"><IconInstitution /> SEBI sources — live monitoring</p>
              <button type="button" className="btn btn--secondary" disabled={busy} onClick={onVerifySource}>
                Check the source is unchanged
              </button>
            </div>
            <ul className="mon-list">
              {state.documents.map((doc) => {
                const stale = receipt !== null && !receipt.hash_matches_expected;
                return (
                  <li className="mon-row" key={doc.id}>
                    <span className={`mon-dot${stale ? " mon-dot--review" : ""}`} aria-hidden="true" />
                    <div className="mon-body">
                      <p className="mon-id">{doc.id}</p>
                      <p className="mon-title">{doc.title}</p>
                    </div>
                    <span className="mon-status">
                      {stale ? "Changed since pinning" : receipt ? "Verified against the original" : "Pinned · not re-checked yet"}
                    </span>
                    <a className="mon-link" href={doc.source_url} target="_blank" rel="noreferrer">
                      original ↗
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ---- Rules requiring attention ------------------------------ */}
          <section className="b-card exec-attn">
            <p className="b-label"><IconDecision /> Rules requiring attention</p>
            {!build ? (
              <div className="exec-attn-empty">
                <p className="meta">No check has been run yet.</p>
                <button type="button" className="btn btn--primary" disabled={busy} onClick={onRunCheck}>
                  Run the check
                </button>
              </div>
            ) : failed.length + waiting.length === 0 ? (
              <p className="meta">Everything that can be settled is settled.</p>
            ) : (
              <ul className="attn-list">
                {failed.map((item) => (
                  <li className="attn-row" key={item.id}>
                    <div>
                      <p className="attn-title">{checkLabel(item.id, item.name)}</p>
                      <p className="attn-due attn-due--fail">Did not pass</p>
                    </div>
                    <button type="button" className="btn btn--secondary" disabled={busy} onClick={onOpenDecision}>
                      Review
                    </button>
                  </li>
                ))}
                {waiting.slice(0, 4).map((item) => (
                  <li className="attn-row" key={item.id}>
                    <div>
                      <p className="attn-title">{checkLabel(item.id, item.name)}</p>
                      <p className="attn-due">Waiting on you</p>
                    </div>
                    <button type="button" className="btn btn--secondary" disabled={busy} onClick={onOpenDecision}>
                      Make the decision
                    </button>
                  </li>
                ))}
                {waiting.length > 4 && (
                  <li className="attn-more">
                    <button type="button" className="btn btn--quiet" onClick={() => setView("work")}>
                      + {waiting.length - 4} more under the Work queue
                    </button>
                  </li>
                )}
              </ul>
            )}
          </section>
        </div>

        <div className="exec-rail">
          {/* ---- Check progress donut ----------------------------------- */}
          <section className="b-card exec-progress">
            <p className="b-label"><IconClock /> Check progress</p>
            {build ? (
              <>
                <ExecDonut passed={passed.length} waiting={waiting.length} failed={failed.length} />
                <ul className="exec-legend">
                  <li><span className="exec-swatch exec-swatch--ok" /> {passed.length} passed</li>
                  <li><span className="exec-swatch exec-swatch--review" /> {waiting.length} waiting on you</li>
                  <li><span className="exec-swatch exec-swatch--fail" /> {failed.length} did not pass</li>
                </ul>
              </>
            ) : (
              <p className="b-empty">Run the check to see progress.</p>
            )}
          </section>

          {/* ---- Score breakdown ---------------------------------------- */}
          {cci && (
            <section className="b-card exec-score">
              <p className="b-label"><IconGauge /> Score breakdown</p>
              <div className="b-score-rows">
                {cci.parameters.filter((item) => item.assessed).slice(0, 5).map((item) => (
                  <div className="cci-row" key={item.id}>
                    <span className="cci-row-title">{item.title}</span>
                    <span className="cci-bar" aria-hidden="true">
                      <span
                        className={`cci-bar-fill${(item.score ?? 0) >= 80 ? " cci-bar-fill--ok" : (item.score ?? 0) >= 40 ? " cci-bar-fill--review" : " cci-bar-fill--fail"}`}
                        style={{ transform: `scaleX(${(item.score ?? 0) / 100})` }}
                      />
                    </span>
                    <span className="cci-row-score">{item.score}</span>
                  </div>
                ))}
              </div>
              <Disclosure summary="Every parameter">
                <ul className="stack-s">
                  {cci.parameters.map((item) => (
                    <li key={item.id}>
                      <p className="strong-ink">
                        {item.title} — {item.assessed ? `${item.score}` : "not assessed"}
                      </p>
                      <p className="meta">{item.meaning}</p>
                    </li>
                  ))}
                </ul>
                <p className="meta">{cci.limitation}</p>
              </Disclosure>
            </section>
          )}

          {/* ---- Quick actions ------------------------------------------ */}
          <section className="b-card exec-quick">
            <p className="b-label">Quick actions</p>
            <div className="exec-quick-list">
              <button type="button" className="exec-quick-item" disabled={busy} onClick={onOpenDecision}>
                <span className="exec-quick-icon"><IconDecision /></span>
                Make the decision
              </button>
              <button type="button" className="exec-quick-item" disabled={busy} onClick={onRunCheck}>
                <span className="exec-quick-icon"><IconGauge /></span>
                Run the check again
              </button>
              <button type="button" className="exec-quick-item" disabled={busy} onClick={onVerifySource}>
                <span className="exec-quick-icon"><IconInstitution /></span>
                Verify the SEBI source
              </button>
              {build && failed.length === 0 && waiting.length === 0 && (
                <button type="button" className="exec-quick-item" disabled={busy} onClick={onDownloadReport}>
                  <span className="exec-quick-icon"><IconLedger /></span>
                  Download the report
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
      )}

      {view === "work" && (
      <div className="bento">
        {/* ---- Pending cases (Stitch work-queue pattern) ---------------- */}
        <section className="b-card b-queue">
          <p className="b-label"><IconDecision /> Pending</p>
          <ul className="b-queue-list">
            {failed.map((item) => (
              <li className="b-case b-case--fail" key={item.id}>
                <p className="b-case-title">{checkLabel(item.id, item.name)}</p>
                <span className="b-case-chip b-case-chip--fail">✕ Did not pass</span>
              </li>
            ))}
            {waiting.map((item) => (
              <li className="b-case b-case--review" key={item.id}>
                <p className="b-case-title">{checkLabel(item.id, item.name)}</p>
                <span className="b-case-chip b-case-chip--review">! Needs you</span>
              </li>
            ))}
            {blockedDates.map((item) => (
              <li className="b-case b-case--review" key={item.id}>
                <p className="b-case-title">
                  {state.obligations.find((o) => o.id === item.obligation_id)
                    ? `${state.obligations.find((o) => o.id === item.obligation_id)!.action} ${state.obligations.find((o) => o.id === item.obligation_id)!.object}`
                    : item.obligation_id}
                </p>
                <span className="b-case-chip b-case-chip--review">! No start date</span>
              </li>
            ))}
            {failed.length + waiting.length + blockedDates.length === 0 && (
              <li className="b-case b-case--ok">
                <p className="b-case-title">Nothing is waiting on anyone.</p>
                <span className="b-case-chip b-case-chip--ok">✓ Clear</span>
              </li>
            )}
          </ul>
        </section>

        {/* ---- Audit trail timeline ------------------------------------ */}
        <section className="b-card b-trail">
          <p className="b-label"><IconLedger /> Audit trail</p>
          {state.audit_events.length === 0 ? (
            <p className="b-empty">No events recorded yet.</p>
          ) : (
            <ol className="timeline">
              {state.audit_events.slice(-7).reverse().map((event) => (
                <li className="timeline-row" key={event.id}>
                  <span className="timeline-node" aria-hidden="true" />
                  <div className="timeline-body">
                    <p className="timeline-event">
                      {event.event_type.replaceAll("_", " ").toLowerCase()}
                    </p>
                    <p className="meta">{event.actor}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ---- Quick actions ------------------------------------------- */}
        <section className="b-card b-actions">
          <p className="b-label">Quick actions</p>
          <div className="b-actions-col">
            <button type="button" className="btn btn--primary" disabled={busy} onClick={onOpenDecision}>
              Make the decision
            </button>
            <button type="button" className="btn btn--secondary" disabled={busy} onClick={onRunCheck}>
              Run the check again
            </button>
            <button type="button" className="btn btn--secondary" disabled={busy} onClick={onVerifySource}>
              Verify the SEBI source
            </button>
            {build && failed.length === 0 && waiting.length === 0 && (
              <button type="button" className="btn btn--secondary" disabled={busy} onClick={onDownloadReport}>
                Download the report
              </button>
            )}
          </div>
        </section>

        {/* ---- Incident clocks ---------------------------------------- */}
        {state.findings.length > 0 && (
          <section className="b-card b-clocks">
            <p className="b-label"><IconClock /> Incident reporting clocks</p>
            <IncidentReportingClock state={state} compact onResolve={onOpenDecision} />
          </section>
        )}

        {/* ---- Deadlines ---------------------------------------------- */}
        {state.deadline_computations.length > 0 && (
          <section className="b-card b-deadlines">
            <p className="b-label"><IconLedger /> Deadlines</p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">What you have to do</th>
                    <th scope="col">How long</th>
                    <th scope="col">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {state.deadline_computations.map((item) => {
                    const obligation = state.obligations.find(
                      (candidate) => candidate.id === item.obligation_id,
                    );
                    return (
                      <tr key={item.id}>
                        <td>{obligation ? `${obligation.action} ${obligation.object}` : item.obligation_id}</td>
                        <td>{item.duration_label}</td>
                        <td>
                          {item.computable ? (
                            <strong className="strong-ink">{formatDate(item.due_date)}</strong>
                          ) : (
                            <>
                              <StateLabel value="BLOCK" />
                              <p className="meta">Start not stated by SEBI — needs your policy.</p>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ---- Evidence and source ------------------------------------ */}
        <section className="b-card b-evidence">
          <div className="b-label-row">
            <p className="b-label"><IconEvidence /> Evidence and source</p>
            <button
              type="button"
              className="btn btn--secondary btn--small"
              disabled={busy}
              onClick={onVerifySource}
            >
              Check the source is unchanged
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th scope="col">Document</th><th scope="col">Status</th></tr>
              </thead>
              <tbody>
                {state.evidence.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td><StateLabel value={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="b-doclist">
            {state.documents.map((document) => (
              <li key={document.id}>
                <span>{document.title}</span>
                <a className="proof-link" href={document.source_url} target="_blank" rel="noreferrer">
                  original ↗
                </a>
              </li>
            ))}
          </ul>
          {receipt && (
            <p className={`b-receipt b-receipt--${receipt.hash_matches_expected ? "ok" : "review"}`}>
              {receipt.hash_matches_expected
                ? "✓ Byte-for-byte what this workspace read."
                : "! The published document no longer matches what was reviewed."}
            </p>
          )}
        </section>
      </div>
      )}

      {view === "evidence" && (
      <div className="vault">
        {/* ---- Filters rail ------------------------------------------- */}
        <aside className="vault-filters">
          <p className="b-label">Filters</p>
          <p className="vault-filter-head">Evidence kinds</p>
          {[...new Set(state.evidence.map((item) => item.kind))].map((kind) => (
            <label className="vault-filter" key={kind}>
              <input
                type="checkbox"
                checked={evidenceKinds.size === 0 || evidenceKinds.has(kind)}
                onChange={() => {
                  const allKinds = [...new Set(state.evidence.map((item) => item.kind))];
                  setEvidenceKinds((prior) => {
                    const next = new Set(prior.size === 0 ? allKinds : [...prior]);
                    if (next.has(kind)) next.delete(kind); else next.add(kind);
                    return next.size === allKinds.length ? new Set<string>() : next;
                  });
                }}
              />
              <span>{labelOf(kind)}</span>
            </label>
          ))}
          <p className="vault-filter-head">SEBI sources</p>
          {state.documents.map((doc) => (
            <p className="vault-filter meta" key={doc.id}>{doc.title}</p>
          ))}
        </aside>

        {/* ---- KPIs + table ------------------------------------------- */}
        <div className="vault-main">
          <div className="vault-kpis">
            <div className="b-kpi">
              <span className="b-kpi-value">
                {build ? `${passed.length}/${build.tests.length}` : "—"}
              </span>
              <span className="b-kpi-label">Checks passed</span>
            </div>
            <div className="b-kpi">
              <span className="b-kpi-value b-kpi-value--word">
                {receipt ? formatDate(receipt.checked_at) : "Not checked"}
              </span>
              <span className="b-kpi-label">Source last verified</span>
            </div>
            <div className="b-kpi">
              <span className="b-kpi-value">
                {state.evidence.length > 0
                  ? `${Math.round((evidenceCurrent.length / state.evidence.length) * 100)}%`
                  : "—"}
              </span>
              <span className="b-kpi-label">Evidence up to date</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn--primary vault-check"
            disabled={busy}
            onClick={onVerifySource}
          >
            Check source
          </button>

          <div className="vault-cards">
            {state.documents.map((doc) => {
              const stale = receipt !== null && !receipt.hash_matches_expected;
              const tone = stale ? "flagged" : receipt ? "verified" : "pending";
              return (
                <article className={`vault-card vault-card--${tone}`} key={doc.id}>
                  <div className="vault-card-head">
                    <p className="vault-card-name">{doc.title}</p>
                    <span className={`rcx-chip rcx-chip--${stale ? "fail" : receipt ? "ok" : "review"}`}>
                      {stale ? "! Changed upstream" : receipt ? "✓ Verified" : "Pinned · not re-checked"}
                    </span>
                  </div>
                  <p className="micro">Cryptographic fingerprint</p>
                  <p className="vault-card-hash mono" title={doc.content_hash}>
                    SHA-256: {doc.content_hash.slice(0, 16)}…{doc.content_hash.slice(-8)}
                  </p>
                  <p className="meta">
                    {receipt ? `Last verified ${formatDate(receipt.checked_at)}` : `Published ${formatDate(doc.published_at)}`}
                    {" · "}
                    <a className="proof-link" href={doc.source_url} target="_blank" rel="noreferrer">
                      official source ↗
                    </a>
                  </p>
                </article>
              );
            })}
            {state.evidence
              .filter((item) => evidenceKinds.size === 0 || evidenceKinds.has(item.kind))
              .map((item) => (
                <article
                  className={`vault-card vault-card--${item.status === "CURRENT" ? "verified" : "pending"}`}
                  key={item.id}
                >
                  <div className="vault-card-head">
                    <p className="vault-card-name">{item.name}</p>
                    <span className={`rcx-chip rcx-chip--${item.status === "CURRENT" ? "ok" : "review"}`}>
                      {item.status === "CURRENT" ? "✓ Up to date" : labelOf(item.status)}
                    </span>
                  </div>
                  <p className="micro">Cryptographic fingerprint</p>
                  <p className="vault-card-hash mono">No fingerprint recorded — and the vault says so</p>
                  <p className="meta">
                    Collected {formatDate(item.collected_at)}
                    {item.reason ? ` · ${item.reason}` : ""}
                  </p>
                </article>
              ))}
            <p className="meta">Synthetic broker data · fingerprints are real.</p>
          </div>
        </div>

        {/* ---- Audit trail ------------------------------------------- */}
        <aside className="vault-trail">
          <p className="b-label"><IconLedger /> Audit trail</p>
          {state.audit_events.length === 0 ? (
            <p className="b-empty">No events recorded yet.</p>
          ) : (
            <ol className="timeline timeline--glow">
              {state.audit_events.slice(-8).reverse().map((event) => (
                <li className="timeline-row" key={event.id}>
                  <span className="timeline-node" aria-hidden="true" />
                  <div className="timeline-body">
                    <p className="timeline-event">
                      {event.event_type.replaceAll("_", " ").toLowerCase()}
                    </p>
                    <p className="meta">{event.actor} · {formatDate(event.created_at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
      )}

      {view === "ask" && (
      <div className="bento">
        <section className="b-card b-ask">
          <p className="b-label"><IconAsk /> RegOS Intelligence</p>
          <AskPanel />
        </section>
        <section className="b-card b-context">
          <p className="b-label"><IconAgents /> Live context</p>
          <LiveStrip onChange={() => { loadCci(); onRefresh(); }} />
          <div className="b-context-feed">
            <p className="b-context-feed-head">Engine activity</p>
            {state.agent_runs.length === 0 ? (
              <p className="meta">No engine activity yet — run the agents to populate this feed.</p>
            ) : (
              <ul className="b-context-feed-list">
                {state.agent_runs
                  .at(-1)!
                  .steps.slice(-4)
                  .map((step) => (
                    <li key={step.step_sha256}>
                      <span className="b-context-feed-dot" aria-hidden="true" />
                      <span>
                        {agentNameOf(state.agent_runs.at(-1)!.agent_id)}: {step.tool_output_summary}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div className="b-context-agents">
            {ALL_AGENTS.map((id) => {
              const run = runsById.get(id);
              return (
                <div className="b-context-agent" key={id}>
                  <span>
                    {AGENT_PLAIN[id].name}
                    {run && (
                      <span className="b-context-bar" aria-hidden="true">
                        <span
                          style={{
                            transform: `scaleX(${Math.min(1, run.tool_call_count / Math.max(1, ...state.agent_runs.map((r) => r.tool_call_count)))})`,
                          }}
                        />
                      </span>
                    )}
                  </span>
                  <span className="meta">
                    {run ? `${run.findings.length} findings · ${run.tool_call_count} steps` : "Not run yet"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      )}

      {view === "agents" && (
      <div className="bento">
        <section className="b-card b-agents">
          <p className="b-label"><IconAgents /> AI agents — read-only</p>
          <div className="agent-strip">
            {ALL_AGENTS.map((id) => {
              const run = runsById.get(id);
              return (
                <div className="agent-chip" key={id}>
                  <p className="agent-chip-name">{AGENT_PLAIN[id].name}</p>
                  <p className="agent-chip-state">
                    {run
                      ? `${run.findings.length} findings · ${run.tool_call_count} steps`
                      : "Not run yet"}
                  </p>
                </div>
              );
            })}
          </div>
          <AgentConsole agents={ALL_AGENTS} planner={planner} busy={busy} onFinished={onRefresh} />
        </section>
      </div>
      )}

      </div>
      </div>

      {build && (
        <p className="cmd-foot">
          {passed.length} of {build.tests.length} checks passed · detail under <strong>Full record</strong>.
        </p>
      )}
    </div>
  );
}

function ExecDonut({ passed, waiting, failed }: { passed: number; waiting: number; failed: number }) {
  const total = passed + waiting + failed;
  if (total === 0) return null;
  const p = (passed / total) * 100;
  const w = (waiting / total) * 100;
  const f = (failed / total) * 100;
  const ring = "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";
  return (
    <div className="exec-donut">
      <svg viewBox="0 0 36 36" role="img" aria-label={`${passed} of ${total} checks passed`}>
        <path d={ring} fill="none" stroke="var(--line-2)" strokeWidth="3" />
        {p > 0 && (
          <path d={ring} fill="none" stroke="var(--ok)" strokeWidth="3.6" strokeLinecap="round"
            strokeDasharray={`${p} ${100 - p}`} />
        )}
        {w > 0 && (
          <path d={ring} fill="none" stroke="var(--review)" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${w} ${100 - w}`} strokeDashoffset={-p} />
        )}
        {f > 0 && (
          <path d={ring} fill="none" stroke="var(--fail)" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${f} ${100 - f}`} strokeDashoffset={-(p + w)} />
        )}
      </svg>
      <div className="exec-donut-centre">
        <span className="exec-donut-figure">{Math.round(p)}%</span>
        <span className="exec-donut-word">passed</span>
      </div>
    </div>
  );
}
