"use client";

import { useCallback, useEffect, useState } from "react";

import { regosApi } from "../lib/api";
import {
  agentNameOf,
  checkLabel,
  eventLabelOf,
  formatDate,
  formatTimestamp,
  glossFor,
  labelOf,
  plainPhrase,
} from "../lib/presentation";
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
import {
  Disclosure,
  Donut,
  Empty,
  Hash,
  Meter,
  SegBar,
  Skeleton,
  Stat,
  StatRow,
  StateLabel,
  Tag,
  Timeline,
  TodoList,
} from "./ui";
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

/** Dot · word · count. The one legend grammar, shared with SegBar and the charts. */
function LegendChip({
  tone,
  label,
  count,
}: {
  tone?: "ok" | "review" | "fail" | "accent" | "neutral";
  label: string;
  count: number;
}) {
  return (
    <li className="legend-chip">
      {tone && <span className={`legend-dot legend-dot--${tone}`} aria-hidden="true" />}
      <span className="legend-label">{label}</span>
      <span className="legend-count">{count}</span>
    </li>
  );
}

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
  // Loading and absence are different things. Until the first read comes back the
  // dial slot shows its shape; only a read that failed says the score is missing.
  const [cciState, setCciState] = useState<"loading" | "ready" | "failed">("loading");
  const [planner] = useState<PlannerKind>("DETERMINISTIC_PLAN");
  const [view, setView] = useState<"overview" | "work" | "evidence" | "ask" | "agents">("work");
  const [evidenceKinds, setEvidenceKinds] = useState<Set<string>>(new Set());
  const [lens, setLens] = useState<"demo" | "document">("demo");
  const [docScore, setDocScore] = useState<DocumentScore | null>(null);
  const [docScoreState, setDocScoreState] = useState<"loading" | "ready" | "failed">("loading");

  const activeDoc = documents.at(-1) ?? null;

  // The document lens scores live off the committed model, refreshed with the doc.
  useEffect(() => {
    if (lens !== "document" || !activeDoc) { setDocScore(null); return; }
    let cancelled = false;
    setDocScoreState("loading");
    void regosApi.documentScore(activeDoc.id)
      .then((value) => { if (!cancelled) { setDocScore(value); setDocScoreState("ready"); } })
      .catch(() => { if (!cancelled) { setDocScore(null); setDocScoreState("failed"); } });
    return () => { cancelled = true; };
  }, [lens, activeDoc, activeDoc?.passages.length]);

  const loadCci = useCallback(() => {
    void regosApi.cci().then(
      (value) => { setCci(value); setCciState("ready"); },
      () => { setCci(null); setCciState("failed"); },
    );
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

  const blockedDates = state.deadline_computations.filter((item) => !item.computable);
  const evidenceCurrent = state.evidence.filter((item) => item.status === "CURRENT");
  const runsById = new Map(state.agent_runs.map((item) => [item.agent_id, item]));

  const totalDeadlines = state.deadline_computations.length;
  const computableDates = totalDeadlines - blockedDates.length;
  // A source gap is not a failure. It is an expected hand-off to a named reviewer,
  // so amber remains reserved for this state and red stays exclusive to failed checks.
  const awaitingHumanInput = waiting.length + blockedDates.length;

  const nameOfObligation = (obligationId: string) => {
    const obligation = state.obligations.find((candidate) => candidate.id === obligationId);
    return obligation ? `${obligation.action} ${obligation.object}` : obligationId;
  };

  /** Everything on the demo corpus that is genuinely waiting on a person, in order. */
  const queueItems = [
    ...failed.map((item) => ({
      id: item.id,
      title: checkLabel(item.id, item.name),
      note: "This check did not pass.",
      tone: "fail" as const,
      actionLabel: "Review",
      onAction: onOpenDecision,
      disabled: busy,
    })),
    ...waiting.map((item) => ({
      id: item.id,
      title: checkLabel(item.id, item.name),
      note: "Waiting on your decision.",
      tone: "review" as const,
      actionLabel: "Make the decision",
      onAction: onOpenDecision,
      disabled: busy,
    })),
    ...blockedDates.map((item) => ({
      id: item.id,
      title: nameOfObligation(item.obligation_id),
      note: "SEBI never says what starts this clock, so no due date can be worked out.",
      tone: "review" as const,
      actionLabel: "Set the start date",
      onAction: onOpenDecision,
      disabled: busy,
    })),
  ];

  return (
    <div className="cmd">
      <header className="cmd-head">
        <div>
          <h1 className="cmd-title">Compliance command centre</h1>
          <p className="cmd-sub">
            {labelOf(state.entity_profile.entity_type)}
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
          ["overview", "Overview", IconGauge],
          ["work", "Work queue", IconDecision],
          ["evidence", "Evidence vault", IconEvidence],
          ["ask", "Ask RegOS", IconAsk],
          ["agents", "AI assistants", IconAgents],
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
            {/* Same figure as the queue's own badge — one count, one source. */}
            {id === "work" && queueItems.length > 0 && (
              <span className="cmd-nav-count">{queueItems.length}</span>
            )}
          </button>
        ))}
        <div className="side-foot">
          <span className="side-foot-chip">Synthetic demo data. Nothing here is filed with SEBI.</span>
        </div>
      </aside>
      <div className="cmd-main">
      <div className="cmd-lens" role="group" aria-label="Choose which documents to view">
        <button
          type="button"
          className={`cmd-lens-pill${lens === "demo" ? " cmd-lens-pill--on" : ""}`}
          aria-pressed={lens === "demo"}
          onClick={() => setLens("demo")}
        >
          Demo SEBI documents
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
          <span className="meta">Upload a PDF under “Your own document” to see it here.</span>
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
                {activeDoc.scope.pages_machine_read.length === 1
                  ? "page was a scan, read by machine (OCR) — check it"
                  : "pages were scans, read by machine (OCR) — check them"}{" "}
                against the original before relying on the wording
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
          <p className="b-label"><IconGauge /> Deadline clarity — read by Avadhi, the RegOS deadline reader. Its version is fixed, so the same document always scores the same.</p>
          {docScore ? (
            <div className="stack-s b-modelread">
              <StatRow>
                <Stat
                  size="l"
                  label="Deadline clarity"
                  value={
                    docScore.deadline_clarity === null
                      ? "—"
                      : `${Math.round(docScore.deadline_clarity * 100)}%`
                  }
                  tone={docScore.blocked_durations > 0 ? "review" : undefined}
                  context={
                    docScore.deadline_clarity === null
                      ? "not computable — no timing language in this document"
                      : `${docScore.with_timing_language} of ${docScore.passages_total} passages carry timing wording`
                  }
                />
              </StatRow>
              <SegBar
                segments={Object.entries(docScore.timing_counts).map(([label, count]) => ({
                  label: labelOf(label),
                  count,
                  tone: label === "PERIOD_AND_TRIGGER" ? "ok" : label === "NO_TIMING" ? "neutral" : "review",
                }))}
                ariaLabel={Object.entries(docScore.timing_counts)
                  .map(([label, count]) => `${count} ${labelOf(label).toLowerCase()}`)
                  .join(", ")}
              />
              <p className="b-verdict">
                {docScore.with_timing_language === 0
                  ? `The model read all ${docScore.passages_total} passages — none carries timing language, so no deadline can honestly be computed here. That is the answer, not an error.`
                  : docScore.blocked_durations > 0
                    ? `${docScore.blocked_durations} ${docScore.blocked_durations === 1 ? "passage states" : "passages state"} a period with no stated start, so no lawful due date can be worked out. That gap is the one you have to close.`
                    : `${docScore.timing_counts.PERIOD_AND_TRIGGER} ${docScore.timing_counts.PERIOD_AND_TRIGGER === 1 ? "passage gives" : "passages give"} a date that can be worked out; nothing states a period without its clock-start.`}
              </p>
              <Disclosure summary="How each passage was counted">
                <div className="b-score-rows">
                  {Object.entries(docScore.timing_counts).map(([label, count]) => (
                    <Meter
                      key={label}
                      label={labelOf(label)}
                      value={count}
                      max={docScore.passages_total || 1}
                      tone={label === "PERIOD_AND_TRIGGER" ? "ok" : label === "NO_TIMING" ? "neutral" : "review"}
                      valueLabel={String(count)}
                    />
                  ))}
                </div>
                <p className="meta">How this is worked out: {plainPhrase(docScore.clarity_formula)}.</p>
                <p className="meta">{plainPhrase(docScore.limitation)}</p>
                <p className="meta">
                  The Cyber Capability Index is scored only against the demo SEBI documents —
                  no score is invented for your document.
                </p>
              </Disclosure>
            </div>
          ) : docScoreState === "loading" ? (
            <Skeleton kind="stat" />
          ) : (
            <Empty
              title="No score yet"
              hint="It appears once Avadhi, the deadline reader, has read this document."
            />
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
            <span className="b-kpi-label">Passages you have read</span>
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
          <p className="b-label">
            <IconDecision /> What needs you
            {activeDoc.scope.passages_needing_review > 0 && (
              <span className="todo-badge">{activeDoc.scope.passages_needing_review}</span>
            )}
          </p>
          <TodoList
            items={activeDoc.passages
              .filter((p) => p.classification === "NEEDS_REVIEW")
              .slice(0, 3)
              .map((p) => ({
                id: p.id,
                title: p.locator,
                note: p.text,
                tone: "review" as const,
                actionLabel: "Open the review",
                onAction: () => onOpenDocuments?.(),
                disabled: busy,
              }))}
            emptyText="Nothing in this document is waiting on a person right now."
          />
          {activeDoc.scope.passages_needing_review > 3 && (
            <p className="b-hero-more">
              {activeDoc.scope.passages_needing_review - 3} more are waiting. Open the review to see them.
            </p>
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
                  {run ? (
                    <ul className="segbar-legend">
                      <LegendChip label="findings" count={run.findings.length} />
                      <LegendChip label="steps" count={run.tool_call_count} />
                    </ul>
                  ) : (
                    <Tag value="Not run on this document" tone="neutral" />
                  )}
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
          {/* The dial takes the full column rather than 1.2fr of a two-up row: in the
              narrower column its band sentence wrapped to one word per line at 1280. */}
          <section className="b-card exec-health">
            <p className="b-label"><IconGauge /> Cyber Capability Index — your compliance health score</p>
            {cci ? (
              <CciDial report={cci} />
            ) : cciState === "loading" ? (
              <Skeleton kind="dial" />
            ) : (
              <Empty
                title="Score unavailable"
                hint="The score could not be read just now."
                action={
                  <button
                    type="button"
                    className="btn btn--secondary"
                    disabled={busy}
                    onClick={loadCci}
                  >
                    Try again
                  </button>
                }
              />
            )}
          </section>

          <StatRow>
            <Stat
              size="l"
              label="Needs human input"
              value={awaitingHumanInput}
              tone={awaitingHumanInput > 0 ? "review" : undefined}
              context={
                `${blockedDates.length} due date${blockedDates.length === 1 ? "" : "s"} cannot be worked out` +
                (waiting.length > 0
                  ? ` · ${waiting.length} check${waiting.length === 1 ? "" : "s"} wait on a decision`
                  : "")
              }
            />
            {/* A failed check is not the same thing as a source gap, so it does not
                belong in the amber tile — but it must never be demoted to a caption
                either. It keeps its own figure and the only red on this row. */}
            {build && (
              <Stat
                size="l"
                label="Checks that did not pass"
                value={failed.length}
                tone={failed.length > 0 ? "fail" : "ok"}
                context={
                  failed.length > 0
                    ? "Fix the control, then run the check again"
                    : `all ${build.tests.length} check${build.tests.length === 1 ? "" : "s"} accounted for`
                }
              />
            )}
            <Stat
              size="l"
              label="Dates that can be worked out"
              value={computableDates}
              context={`of ${totalDeadlines} deadline${totalDeadlines === 1 ? "" : "s"}`}
            />
          </StatRow>

          {totalDeadlines > 0 && (
            <section className="b-card exec-mini">
              <p className="b-label"><IconCalendar /> Where the deadlines stand</p>
              <Meter
                label="Worked out from SEBI's own wording"
                value={computableDates}
                max={totalDeadlines}
                tone={computableDates === totalDeadlines ? "ok" : "review"}
                valueLabel={`${computableDates}/${totalDeadlines}`}
                hint={
                  blockedDates.length > 0
                    ? `${blockedDates.length} ${blockedDates.length === 1 ? "deadline waits" : "deadlines wait"} on your policy — SEBI never says what starts the clock.`
                    : "Every deadline here has a start date stated by SEBI."
                }
              />
            </section>
          )}

          {/* ---- SEBI sources — live monitoring ------------------------- */}
          <section className="b-card exec-monitor">
            <div className="exec-monitor-head">
              <p className="b-label">
                <IconInstitution /> SEBI sources — live monitoring
                <span className={`exec-chip${receipt && receipt.hash_matches_expected ? " exec-chip--ok" : ""}`}>
                  <span className="exec-chip-dot" aria-hidden="true" />
                  {receipt ? <StateLabel value={receipt.status} /> : "Not checked yet"}
                </span>
              </p>
              <button type="button" className="btn btn--secondary" disabled={busy} onClick={onVerifySource}>
                Check the SEBI source is unchanged
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
                      {stale ? (
                        <Tag value="SOURCE_CHANGED_REVIEW_REQUIRED" />
                      ) : receipt ? (
                        <Tag value="LIVE_SOURCE_VERIFIED" />
                      ) : (
                        <Tag value="Not re-checked yet" tone="neutral" />
                      )}
                    </span>
                    <a className="mon-link" href={doc.source_url} target="_blank" rel="noreferrer">
                      original ↗
                    </a>
                    <button
                      type="button"
                      className="btn btn--secondary btn--small"
                      onClick={() => setView("evidence")}
                    >
                      View details
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ---- Rules requiring attention ------------------------------ */}
          <section className="b-card exec-attn">
            <p className="b-label">
              <IconDecision /> Rules requiring attention
              {failed.length + waiting.length > 0 && (
                <span className="todo-badge">{failed.length + waiting.length}</span>
              )}
            </p>
            {!build ? (
              <Empty
                title="No check has been run yet"
                hint="Run the check and anything needing a person appears here."
                action={
                  <button type="button" className="btn btn--primary" disabled={busy} onClick={onRunCheck}>
                    Run the check
                  </button>
                }
              />
            ) : (
              <>
                <TodoList
                  items={[
                    ...failed.map((item) => ({
                      id: item.id,
                      title: checkLabel(item.id, item.name),
                      note: "This check did not pass.",
                      tone: "fail" as const,
                      actionLabel: "Review",
                      onAction: onOpenDecision,
                      disabled: busy,
                    })),
                    ...waiting.slice(0, 4).map((item) => ({
                      id: item.id,
                      title: checkLabel(item.id, item.name),
                      note: "Waiting on your decision.",
                      tone: "review" as const,
                      actionLabel: "Make the decision",
                      onAction: onOpenDecision,
                      disabled: busy,
                    })),
                  ]}
                  emptyText="Everything that can be settled is settled."
                />
                {waiting.length > 4 && (
                  <p className="attn-more">
                    <button type="button" className="btn btn--quiet" onClick={() => setView("work")}>
                      + {waiting.length - 4} more under the Work queue
                    </button>
                  </p>
                )}
              </>
            )}
          </section>
        </div>

        <div className="exec-rail">
          {/* ---- Check progress donut ----------------------------------- */}
          <section className="b-card exec-progress">
            <p className="b-label"><IconClock /> Check progress</p>
            {build ? (
              <>
                <Donut
                  segments={[
                    { count: passed.length, tone: "ok", label: "passed" },
                    { count: waiting.length, tone: "review", label: "waiting on you" },
                    { count: failed.length, tone: "fail", label: "did not pass" },
                  ]}
                  centreValue={`${Math.round((passed.length / Math.max(1, build.tests.length)) * 100)}%`}
                  centreLabel="passed"
                />
                <ul className="segbar-legend">
                  <LegendChip tone="ok" label="passed" count={passed.length} />
                  <LegendChip tone="review" label="waiting on you" count={waiting.length} />
                  <LegendChip tone="fail" label="did not pass" count={failed.length} />
                </ul>
              </>
            ) : (
              <Empty title="No check has been run yet" hint="Run the check to see progress." />
            )}
          </section>

          {/* ---- Activity trend ----------------------------------------- */}
          {state.audit_events.length > 1 && (
            <section className="b-card exec-trend">
              <p className="b-label"><IconLedger /> Activity recorded so far</p>
              <TrendChart events={state.audit_events} />
              <ul className="segbar-legend">
                <LegendChip tone="accent" label="recorded events" count={state.audit_events.length} />
                <LegendChip label="readings" count={state.reviews.length} />
                <LegendChip label="assistant runs" count={state.agent_runs.length} />
              </ul>
              <p className="micro">Every point is a recorded audit event. Nothing here is projected.</p>
            </section>
          )}

          {/* ---- Score breakdown ----------------------------------------
              Deliberately not `.exec-score`: that class exists only to clamp
              `.cci-row-title` to two lines, which cut "…exact SEBI wording" down to
              "…exact SEBI…". A parameter's name is what identifies its row, so it
              wraps to a third line instead of being cut. */}
          {cci && (
            <section className="b-card">
              <p className="b-label"><IconGauge /> Score breakdown</p>
              {/* `.cci-row` rather than `Meter`: identical recipe, but this rail column is
                  ~327px and `.meter-figure`'s fixed 40px basis tips the row over its wrap
                  point, dropping the score onto a line of its own. */}
              <div className="b-score-rows">
                {cci.parameters.filter((item) => item.assessed).slice(0, 5).map((item) => (
                  <div className="cci-row" key={item.id}>
                    <span className="cci-row-title">{item.title}</span>
                    <span
                      className="cci-bar"
                      role="meter"
                      aria-label={item.title}
                      aria-valuenow={item.score ?? 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
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
                      <p className="meta">{plainPhrase(item.meaning)}</p>
                    </li>
                  ))}
                </ul>
                <p className="meta">{plainPhrase(cci.limitation)}</p>
              </Disclosure>
            </section>
          )}

          {/* ---- Quick actions ------------------------------------------ */}
          <section className="b-card exec-quick">
            <p className="b-label">Quick actions</p>
            <div className="exec-quick-list">
              <button type="button" className="exec-quick-item exec-quick-item--primary" disabled={busy} onClick={onOpenDecision}>
                <span className="exec-quick-icon"><IconDecision /></span>
                Make the decision
              </button>
              <button type="button" className="exec-quick-item" disabled={busy} onClick={onRunCheck}>
                <span className="exec-quick-icon"><IconGauge /></span>
                Run the check again
              </button>
              <button type="button" className="exec-quick-item" disabled={busy} onClick={onVerifySource}>
                <span className="exec-quick-icon"><IconInstitution /></span>
                Check the SEBI source is unchanged
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
      /*
       * Grid spans: 12 · 7+5 · 12. The `b-*` classes below are layout slots, not
       * decorative card variants: the queue and evidence span the full row, the clock
       * facts and next actions sit together, then the audit record carries the full width.
       * This keeps the single human decision visible once, with its detail available in
       * the expandable clock row rather than repeating a second deadline table.
       */
      <div className="bento">
        {/* ---- Pending cases (Stitch work-queue pattern) ---------------- */}
        <section className="b-card b-needs">
          <p className="b-label">
            <IconDecision /> Waiting for you
            {queueItems.length > 0 && <span className="todo-badge">{queueItems.length}</span>}
          </p>
          <TodoList items={queueItems} emptyText="Nothing is waiting on anyone." />
        </section>

        {/* ---- Incident clocks ---------------------------------------- */}
        {state.findings.length > 0 && (
          <section className="b-card b-deadlines">
            <p className="b-label"><IconClock /> Incident reporting clocks</p>
            <IncidentReportingClock state={state} compact onResolve={onOpenDecision} />
          </section>
        )}

        {/* ---- Quick actions ------------------------------------------- */}
        <section className="b-card b-trail">
          <p className="b-label">Quick actions</p>
          <div className="b-actions-col">
            <button type="button" className="btn btn--primary" disabled={busy} onClick={onOpenDecision}>
              Make the decision
            </button>
            <button type="button" className="btn btn--secondary" disabled={busy} onClick={onRunCheck}>
              Run the check again
            </button>
            <button type="button" className="btn btn--secondary" disabled={busy} onClick={onVerifySource}>
              Check the SEBI source is unchanged
            </button>
            {build && failed.length === 0 && waiting.length === 0 && (
              <button type="button" className="btn btn--secondary" disabled={busy} onClick={onDownloadReport}>
                Download the report
              </button>
            )}
          </div>
        </section>

        {/* ---- Audit trail timeline ------------------------------------ */}
        <section className="b-card b-trail b-audit">
          <p className="b-label"><IconLedger /> Audit trail</p>
          {state.audit_events.length === 0 ? (
            <Empty
              title="No events recorded yet"
              hint="Every action taken here is recorded, and appears in this list as it happens."
            />
          ) : (
            <Timeline
              items={state.audit_events.slice(-7).reverse().map((event) => ({
                id: event.id,
                title: eventLabelOf(event.event_type),
                meta: event.actor,
              }))}
            />
          )}
        </section>

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
              Check the SEBI source is unchanged
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
            <div className="stack-s">
              <StateLabel value={receipt.status} />
              <p className="meta">
                {receipt.hash_matches_expected
                  ? "The document published by SEBI is still exactly the copy that was reviewed here."
                  : "The document published by SEBI no longer matches the copy reviewed here. Re-run the check before relying on these findings."}
              </p>
            </div>
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
              <span>{plainPhrase(kind)}</span>
            </label>
          ))}
          <p className="vault-filter-head">SEBI sources</p>
          {state.documents.map((doc) => (
            <p className="vault-filter meta" key={doc.id}>{doc.title}</p>
          ))}
        </aside>

        {/* ---- KPIs + table ------------------------------------------- */}
        <div className="vault-main">
          <StatRow>
            <Stat
              size="l"
              label="Checks passed"
              value={build ? passed.length : "—"}
              context={build ? `of ${build.tests.length}` : "no check has been run yet"}
            />
            <Stat
              size="l"
              label="Evidence up to date"
              value={
                state.evidence.length > 0
                  ? `${Math.round((evidenceCurrent.length / state.evidence.length) * 100)}%`
                  : "—"
              }
              tone={
                state.evidence.length > 0 && evidenceCurrent.length === state.evidence.length
                  ? "ok"
                  : state.evidence.length > 0
                    ? "review"
                    : undefined
              }
              context={
                state.evidence.length > 0
                  ? `${evidenceCurrent.length} of ${state.evidence.length} items`
                  : "no evidence collected yet"
              }
            />
          </StatRow>

          <div>
            {build && (
              <Meter
                label="Checks passed"
                value={passed.length}
                max={build.tests.length}
                tone={passed.length === build.tests.length ? "ok" : "review"}
                valueLabel={`${passed.length}/${build.tests.length}`}
              />
            )}
            {state.evidence.length > 0 && (
              <Meter
                label="Evidence up to date"
                value={evidenceCurrent.length}
                max={state.evidence.length}
                tone={evidenceCurrent.length === state.evidence.length ? "ok" : "review"}
                valueLabel={`${evidenceCurrent.length}/${state.evidence.length}`}
              />
            )}
          </div>

          <button
            type="button"
            className="btn btn--primary vault-check"
            disabled={busy}
            onClick={onVerifySource}
          >
            Check the SEBI source is unchanged
          </button>

          <p className="legend-chip">
            <span
              className={`legend-dot legend-dot--${receipt ? "ok" : "neutral"}`}
              aria-hidden="true"
            />
            <span className="legend-label">
              Source last verified{" "}
              {receipt ? formatTimestamp(receipt.checked_at) : "— not checked yet"}
            </span>
          </p>

          <div className="vault-cards">
            {state.documents.map((doc) => {
              const stale = receipt !== null && !receipt.hash_matches_expected;
              const tone = stale ? "flagged" : receipt ? "verified" : "pending";
              return (
                <article className={`vault-card vault-card--${tone}`} key={doc.id}>
                  <span className="vault-thumb" aria-hidden="true"><IconInstitution /></span>
                  <div className="vault-card-head">
                    <p className="vault-card-name">{doc.title}</p>
                    <span className={`rcx-chip rcx-chip--${stale ? "fail" : receipt ? "ok" : "review"}`}>
                      {stale ? "Changed on SEBI's website" : receipt ? "Verified" : "Copy saved — not re-checked yet"}
                    </span>
                  </div>
                  <p className="micro">Document fingerprint (SHA-256)</p>
                  <Hash value={doc.content_hash} label="document" />
                  <p className="meta">
                    {receipt ? `Last verified ${formatTimestamp(receipt.checked_at)}` : `Published ${formatDate(doc.published_at)}`}
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
                  <span className="vault-thumb" aria-hidden="true"><IconEvidence /></span>
                  <div className="vault-card-head">
                    <p className="vault-card-name">{item.name}</p>
                    <span className={`rcx-chip rcx-chip--${item.status === "CURRENT" ? "ok" : "review"}`}>
                      {item.status === "CURRENT" ? "Up to date" : labelOf(item.status)}
                    </span>
                  </div>
                  <p className="micro">Document fingerprint</p>
                  <p className="vault-card-hash">No fingerprint recorded, so this item&apos;s contents cannot be verified.</p>
                  <p className="meta">
                    Collected {formatTimestamp(item.collected_at)}
                    {item.reason ? ` · ${plainPhrase(item.reason)}` : ""}
                  </p>
                </article>
              ))}
          </div>
        </div>

        {/* ---- Audit trail ------------------------------------------- */}
        <aside className="vault-trail">
          <p className="b-label"><IconLedger /> Audit trail</p>
          {state.audit_events.length === 0 ? (
            <Empty
              title="No events recorded yet"
              hint="Every action taken here is recorded, and appears in this list as it happens."
            />
          ) : (
            <div className="timeline--glow">
              <Timeline
                items={state.audit_events.slice(-8).reverse().map((event) => ({
                  id: event.id,
                  title: eventLabelOf(event.event_type),
                  meta: `${event.actor} · ${formatTimestamp(event.created_at)}`,
                }))}
              />
            </div>
          )}
        </aside>
      </div>
      )}

      {view === "ask" && (
      <div className="bento">
        <section className="b-card b-ask">
          <p className="b-label"><IconAsk /> Ask about these SEBI rules</p>
          <AskPanel />
        </section>
        <section className="b-card b-context">
          <p className="b-label"><IconAgents /> What is happening now</p>
          <LiveStrip onChange={() => { loadCci(); onRefresh(); }} />
          <div className="b-context-feed">
            <p className="b-context-feed-head">Assistant activity</p>
            {state.agent_runs.length === 0 ? (
              <p className="meta">Nothing has run yet. Run an assistant and its steps appear here.</p>
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
                        {glossFor(step.tool_output_summary) && (
                          <span className="meta"> → {glossFor(step.tool_output_summary)}</span>
                        )}
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
                  <span>{AGENT_PLAIN[id].name}</span>
                  {run ? (
                    <ul className="segbar-legend">
                      <LegendChip label="findings" count={run.findings.length} />
                      <LegendChip label="steps" count={run.tool_call_count} />
                    </ul>
                  ) : (
                    <Tag value="Not run yet" tone="neutral" />
                  )}
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
          <p className="b-label"><IconAgents /> AI assistants — they can only read; they change nothing</p>
          <div className="agent-strip">
            {ALL_AGENTS.map((id) => {
              const run = runsById.get(id);
              return (
                <div className="agent-chip" key={id}>
                  <p className="agent-chip-name">{AGENT_PLAIN[id].name}</p>
                  {run ? (
                    <ul className="segbar-legend">
                      <LegendChip label="findings" count={run.findings.length} />
                      <LegendChip label="steps" count={run.tool_call_count} />
                    </ul>
                  ) : (
                    <Tag value="Not run yet" tone="neutral" />
                  )}
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
          <span className="legend-chip">
            <span
              className={`legend-dot legend-dot--${failed.length > 0 ? "fail" : waiting.length > 0 ? "review" : "ok"}`}
              aria-hidden="true"
            />
            <span>
              {passed.length} of {build.tests.length} checks passed
            </span>
          </span>
        </p>
      )}
    </div>
  );
}

/** Cumulative recorded audit events across the session — a real series, drawn in the
 *  trend-card style; it grows as the demo is used and projects nothing. */
function TrendChart({ events }: { events: WorkspaceState["audit_events"] }) {
  const times = events
    .map((event) => Date.parse(event.created_at))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  if (times.length < 2) return null;
  const start = times[0];
  const span = Math.max(times[times.length - 1] - start, 1);
  const points = times.map((time, index) => ({
    x: 6 + ((time - start) / span) * 188,
    y: 54 - ((index + 1) / times.length) * 44,
  }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${path} L${points[points.length - 1].x.toFixed(1)},58 L${points[0].x.toFixed(1)},58 Z`;
  return (
    <>
      <svg className="exec-trend-svg" viewBox="0 0 200 60" role="img"
        aria-label={`${events.length} events recorded so far`}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="58" x2="200" y2="58" stroke="var(--line-2)" strokeWidth="0.5" />
        <path d={area} fill="url(#trend-fill)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => (
          <circle key={p.x} cx={p.x} cy={p.y} r="1.6" fill="var(--accent)" />
        ))}
      </svg>
      {/* Both ends of the real series, so the line is anchored in time rather than
          floating. No gridlines, no projection — only the two timestamps that exist. */}
      <div className="b-label-row">
        <span className="micro">first {axisStamp(times[0])}</span>
        <span className="micro">latest {axisStamp(times[times.length - 1])}</span>
      </div>
    </>
  );
}

const AXIS_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "22 Jul 04:12 UTC" — short enough to sit under a rail-width chart. */
function axisStamp(ms: number): string {
  const at = new Date(ms);
  const day = String(at.getUTCDate()).padStart(2, "0");
  const hours = String(at.getUTCHours()).padStart(2, "0");
  const minutes = String(at.getUTCMinutes()).padStart(2, "0");
  return `${day} ${AXIS_MONTHS[at.getUTCMonth()]} ${hours}:${minutes} UTC`;
}
