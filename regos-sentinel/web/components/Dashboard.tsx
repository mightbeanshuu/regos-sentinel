"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  UploadedDocument,
  WorkspaceState,
} from "../lib/types";
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
 * The decision inbox.
 *
 * One unresolved decision leads the page; everything else is the trail that
 * explains it, in one scrolling flow. There is no second navigation rail here —
 * the five global tabs are the only navigation — and every operation has exactly
 * one home, so "check the SEBI source" is a single button rather than five.
 *
 * Model identity, workspace fingerprint and connection activity sit in the footer
 * disclosure: they are how the page knows what it knows, not the case that needs
 * attention. Every figure below is read from live workspace state.
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

/** Amber is an expected hand-off to a person. Red is only ever a check that failed. */
type DeskTone = "review" | "fail" | "ok" | "neutral";

const TONE_GLYPH: Record<DeskTone, string> = {
  fail: "✕",
  review: "!",
  ok: "✓",
  neutral: "·",
};

/** One thing waiting on a person, said without implementation vocabulary. */
interface DeskItem {
  id: string;
  tone: DeskTone;
  /** Three or four words naming the state. */
  status: string;
  /** The task itself, in plain language. */
  title: string;
  /** One sentence saying why it is open. */
  reason: string;
  /** A real locator, finding name or check message. Never invented. */
  support?: string | null;
  actionLabel: string;
  onAction: () => void;
}

/**
 * Local mirror of the reduced-motion media query. `lib/liveness` exports only the
 * value-motion hooks, and `IncidentReportingClock` carries its own copy of this
 * listener; a shared `useReducedMotion` there would replace both.
 */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return reduced;
}

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
  onOpenAssistants,
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
  /** Switches the global tab strip to "AI assistants". See the note on `openAssistants`. */
  onOpenAssistants?: () => void;
  onRunAssistants?: (documentId: string) => void;
}) {
  const [cci, setCci] = useState<CciReport | null>(null);
  // Loading and absence are different things. Until the first read comes back the
  // dial slot shows its shape; only a read that failed says the score is missing.
  const [cciState, setCciState] = useState<"loading" | "ready" | "failed">("loading");
  const [evidenceKinds, setEvidenceKinds] = useState<Set<string>>(new Set());
  const [docScore, setDocScore] = useState<DocumentScore | null>(null);
  const [docScoreState, setDocScoreState] = useState<"loading" | "ready" | "failed">("loading");

  const reducedMotion = useReducedMotion();
  const decisionRef = useRef<HTMLElement | null>(null);
  const wasBusy = useRef(busy);
  const actedHere = useRef(false);
  const [settleKey, setSettleKey] = useState(0);

  const activeDoc = documents.at(-1) ?? null;

  /**
   * Motion, once, and only for cause: when an action started here comes back, the
   * status line fades in a single time and the decision takes focus so a keyboard
   * reader lands on the thing that just changed. Nothing counts up, nothing loops,
   * and under `prefers-reduced-motion` only the focus move survives.
   */
  const track = useCallback(
    (run: () => void) => () => {
      actedHere.current = true;
      run();
    },
    [],
  );

  useEffect(() => {
    const returned = wasBusy.current && !busy;
    wasBusy.current = busy;
    if (!returned || !actedHere.current) return;
    actedHere.current = false;
    setSettleKey((key) => key + 1);
    decisionRef.current?.focus();
  }, [busy]);

  // The uploaded document's score lives off the committed model, refreshed with the doc.
  useEffect(() => {
    if (!activeDoc) { setDocScore(null); return; }
    let cancelled = false;
    setDocScoreState("loading");
    void regosApi.documentScore(activeDoc.id)
      .then((value) => { if (!cancelled) { setDocScore(value); setDocScoreState("ready"); } })
      .catch(() => { if (!cancelled) { setDocScore(null); setDocScoreState("failed"); } });
    return () => { cancelled = true; };
  }, [activeDoc, activeDoc?.passages.length]);

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

  /**
   * The AI assistants tab is a top-level destination, so this page only points at it.
   * `onOpenAssistants` is the clean route; until the page wires it, the global tab
   * button is driven directly rather than rebuilding a second navigation system here.
   */
  const openAssistants = useCallback(() => {
    if (onOpenAssistants) { onOpenAssistants(); return; }
    document.getElementById("tab-agents")?.click();
  }, [onOpenAssistants]);

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

  const sourceStale = receipt !== null && !receipt.hash_matches_expected;

  const findingTitleOf = (findingId: string) =>
    state.findings.find((item) => item.id === findingId)?.title ?? findingId;

  /**
   * Everything genuinely waiting on a person, in the order a person should meet it:
   * a check that actually failed, then the source gaps that need a named decision,
   * then the checks held open by them, then anything in an uploaded document.
   */
  const queue: DeskItem[] = [
    ...failed.map((item) => ({
      id: item.id,
      tone: "fail" as const,
      status: "Check failed",
      title: checkLabel(item.id, item.name),
      reason: "This automated check did not pass. Correct the control it covers, then run the check again.",
      support: item.message,
      actionLabel: "Open the review",
      onAction: track(onOpenDecision),
    })),
    ...blockedDates.map((item) => ({
      id: item.id,
      tone: "review" as const,
      status: "Needs your decision",
      title: "Decide what starts this reporting clock",
      reason:
        `The reviewed source states a period of ${item.duration_label} but never says what starts it, ` +
        "so no due date can be worked out. A named person has to decide the starting point.",
      support: `${findingTitleOf(item.finding_id)} · ${item.citation.locator}`,
      actionLabel: "Decide what starts the clock",
      onAction: track(onOpenDecision),
    })),
    ...waiting.map((item) => ({
      id: item.id,
      tone: "review" as const,
      status: "Needs your decision",
      title: checkLabel(item.id, item.name),
      reason: "Nothing failed here. This check is held open for a decision the source leaves to a person.",
      support: item.message,
      actionLabel: "Make the decision",
      onAction: track(onOpenDecision),
    })),
    ...(activeDoc
      ? activeDoc.passages
          .filter((item) => item.classification === "NEEDS_REVIEW")
          .map((item) => ({
            id: item.id,
            tone: "review" as const,
            status: "Needs your reading",
            title: item.locator,
            reason: item.text,
            support: activeDoc.filename,
            actionLabel: "Open the document",
            onAction: track(() => onOpenDocuments?.()),
          }))
      : []),
  ];

  /** The report exists only once nothing is failing and nothing is held open. */
  const reportReady = Boolean(build) && failed.length === 0 && waiting.length === 0;

  const lead: DeskItem =
    queue[0] ??
    (build
      ? {
          id: "settled",
          tone: "ok",
          status: "Nothing is waiting on you",
          title: "This review has no open decision",
          reason:
            `All ${build.tests.length} check${build.tests.length === 1 ? "" : "s"} in the last run are ` +
            "accounted for, and every deadline that can be worked out has been.",
          support: null,
          actionLabel: "Download the record",
          onAction: track(onDownloadReport),
        }
      : {
          id: "no-build",
          tone: "neutral",
          status: "Not started",
          title: "Run the compliance check",
          reason:
            "No check has been run in this workspace yet. It compares the SEBI source against this " +
            "firm's current control and lists whatever needs a person.",
          support: null,
          actionLabel: "Run the check",
          onAction: track(onRunCheck),
        });

  const rest = queue.slice(1);

  /** The one line that changes after an action. Every figure is read, none is invented. */
  const statusLine = [
    build
      ? `${passed.length} of ${build.tests.length} checks passed`
      : "no check has been run in this workspace yet",
    failed.length > 0
      ? `${failed.length} check${failed.length === 1 ? "" : "s"} did not pass`
      : null,
    queue.length > 0
      ? `${queue.length} item${queue.length === 1 ? "" : "s"} waiting on a person`
      : "nothing waiting on a person",
    receipt
      ? sourceStale
        ? "SEBI source has changed since this review"
        : "SEBI source verified"
      : "SEBI source not re-checked yet",
  ]
    .filter(Boolean)
    .join(" · ");

  const statusTone: DeskTone = failed.length > 0 ? "fail" : queue.length > 0 ? "review" : "ok";
  const settleClass = settleKey > 0 && !reducedMotion ? " dash-settle" : "";

  return (
    <div className="cmd dash">
      <header className="cmd-head dash-head">
        <div>
          <h1 className="cmd-title">Your compliance review</h1>
          <p className="cmd-sub">
            {state.entity_profile.legal_name} · {labelOf(state.entity_profile.entity_type)}
            {state.entity_profile.is_qsb ? " · Qualified stockbroker" : ""}
          </p>
        </div>
      </header>

      {/* ---- 1 · The one unresolved decision --------------------------------
          Everything below this block exists to explain it. It is the only thing
          in the first viewport with a primary action. */}
      <section
        className={`b-card dash-decision dash-decision--${lead.tone}`}
        ref={decisionRef}
        tabIndex={-1}
        aria-labelledby="dash-decision-title"
      >
        <p className={`dash-decision-status dash-decision-status--${lead.tone}`}>
          <span aria-hidden="true">{TONE_GLYPH[lead.tone]}</span>
          {lead.status}
        </p>
        <h2 className="dash-decision-title" id="dash-decision-title">{lead.title}</h2>
        <p className="dash-decision-reason">{lead.reason}</p>
        {lead.support && <p className="dash-decision-support">{lead.support}</p>}

        <div className="btn-row">
          <button
            type="button"
            className="btn btn--primary dash-decision-action"
            disabled={busy}
            onClick={lead.onAction}
          >
            {lead.actionLabel}
          </button>
          {reportReady && lead.id !== "settled" && (
            <button
              type="button"
              className="btn btn--quiet"
              disabled={busy}
              onClick={track(onDownloadReport)}
            >
              Download the record
            </button>
          )}
        </div>

        <p className={`dash-status${settleClass}`} key={settleKey} role="status">
          <span className={`legend-dot legend-dot--${statusTone}`} aria-hidden="true" />
          <span>{statusLine}</span>
        </p>

        {/* Reporting clocks are context for the decision above, not a module of
            their own: they are the thing the missing clock-start would start. */}
        {state.findings.length > 0 && (
          <div className="dash-clocks">
            <p className="b-label"><IconClock /> The reporting clocks this decision governs</p>
            <IncidentReportingClock state={state} compact onResolve={track(onOpenDecision)} />
          </div>
        )}
      </section>

      {/* ---- 2 · Anything else waiting -------------------------------------- */}
      {rest.length > 0 && (
        <section className="b-card dash-queue">
          <p className="b-label">
            <IconDecision /> Also waiting for you
            <span className="todo-badge">{rest.length}</span>
          </p>
          <TodoList
            items={rest.map((item) => ({
              id: item.id,
              title: item.title,
              note: item.support ? `${item.reason} — ${item.support}` : item.reason,
              tone: item.tone === "fail" ? ("fail" as const) : ("review" as const),
              actionLabel: item.actionLabel,
              onAction: item.onAction,
              disabled: busy,
            }))}
            emptyText="Nothing else is waiting on anyone."
          />
        </section>
      )}

      {/* ---- 3 · Source and evidence, as one quiet row -----------------------
          The single home of "check the SEBI source is unchanged". Fingerprints,
          per-item evidence and the kind filter open from here rather than
          arriving before anyone has a reason to inspect them. */}
      <section className="b-card dash-source">
        <div className="dash-source-row">
          <p className="b-label"><IconInstitution /> Source and evidence</p>
          <span className="dash-source-state">
            {receipt ? <StateLabel value={receipt.status} /> : <Tag value="Not re-checked yet" tone="neutral" />}
          </span>
          <span className="meta dash-source-meta">
            {receipt
              ? `Last checked ${formatTimestamp(receipt.checked_at)}`
              : `${state.documents.length} reviewed source${state.documents.length === 1 ? "" : "s"} on file`}
            {state.evidence.length > 0 &&
              ` · ${evidenceCurrent.length} of ${state.evidence.length} evidence items up to date`}
          </span>
          <button
            type="button"
            className="btn btn--secondary dash-source-check"
            disabled={busy}
            onClick={track(onVerifySource)}
          >
            Check the SEBI source is unchanged
          </button>
        </div>

        <p className="meta">
          {receipt
            ? sourceStale
              ? "The document published by SEBI no longer matches the copy reviewed here. Re-run the check before relying on these findings."
              : "The document published by SEBI is still exactly the copy that was reviewed here."
            : "The reviewed copy is held here. Checking compares it, byte for byte, with the document SEBI publishes now."}
        </p>

        <ul className="b-doclist">
          {state.documents.map((doc) => (
            <li key={doc.id}>
              <span>{doc.title}</span>
              {sourceStale ? (
                <Tag value="SOURCE_CHANGED_REVIEW_REQUIRED" />
              ) : receipt ? (
                <Tag value="LIVE_SOURCE_VERIFIED" />
              ) : (
                <Tag value="Not re-checked yet" tone="neutral" />
              )}
              <a className="proof-link" href={doc.source_url} target="_blank" rel="noreferrer">
                original ↗
              </a>
            </li>
          ))}
        </ul>

        <Disclosure summary="Every evidence item, with document fingerprints">
          <div className="stack-s">
            {state.evidence.length > 0 && (
              <Meter
                label="Evidence up to date"
                value={evidenceCurrent.length}
                max={state.evidence.length}
                tone={evidenceCurrent.length === state.evidence.length ? "ok" : "review"}
                valueLabel={`${evidenceCurrent.length}/${state.evidence.length}`}
              />
            )}

            <div className="dash-filters">
              <p className="micro">Show these kinds of evidence</p>
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
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th scope="col">Document</th><th scope="col">Status</th></tr>
                </thead>
                <tbody>
                  {state.evidence
                    .filter((item) => evidenceKinds.size === 0 || evidenceKinds.has(item.kind))
                    .map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td><StateLabel value={item.status} /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="vault-cards">
              {state.documents.map((doc) => {
                const tone = sourceStale ? "flagged" : receipt ? "verified" : "pending";
                return (
                  <article className={`vault-card vault-card--${tone}`} key={doc.id}>
                    <span className="vault-thumb" aria-hidden="true"><IconInstitution /></span>
                    <div className="vault-card-head">
                      <p className="vault-card-name">{doc.title}</p>
                      <span className={`rcx-chip rcx-chip--${sourceStale ? "fail" : receipt ? "ok" : "review"}`}>
                        {sourceStale ? "Changed on SEBI's website" : receipt ? "Verified" : "Copy saved — not re-checked yet"}
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
        </Disclosure>
      </section>

      {/* ---- 4 · The uploaded document, when one exists ---------------------- */}
      {activeDoc ? (
        <section className="b-card dash-doc">
          <div className="b-label-row">
            <p className="b-label"><IconClauses /> Your uploaded document</p>
            <div className="btn-row">
              <button type="button" className="btn btn--secondary btn--small" disabled={busy} onClick={onOpenDocuments}>
                Open the review
              </button>
              {onRunAssistants && (
                <button
                  type="button"
                  className="btn btn--quiet btn--small"
                  disabled={busy}
                  onClick={track(() => onRunAssistants(activeDoc.id))}
                >
                  Run the assistants on it
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="strong-ink">{activeDoc.filename}</p>
            <p className="meta">
              {activeDoc.scope.passages_needing_review > 0
                ? `${activeDoc.scope.passages_needing_review} passages are waiting for a person — they are listed above with everything else.`
                : activeDoc.state === "APPROVED"
                  ? "A named person has approved a requirement from this document."
                  : "Extracted and classified — nothing becomes work until a person approves it."}
            </p>
          </div>

          {activeDoc.scope.pages_machine_read.length > 0 && (
            <p className="b-ocr-pill">
              ⌾ {activeDoc.scope.pages_machine_read.length}{" "}
              {activeDoc.scope.pages_machine_read.length === 1
                ? "page was a scan, read by machine (OCR) — check it"
                : "pages were scans, read by machine (OCR) — check them"}{" "}
              against the original before relying on the wording
            </p>
          )}

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
              <span className="b-kpi-value">{activeDoc.passages.filter((item) => item.reviewed_by).length}</span>
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

          <div>
            <p className="b-label">
              <IconGauge /> Deadline clarity — read by Avadhi, the RegOS deadline reader. Its
              version is fixed, so the same document always scores the same.
            </p>
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
          </div>

          <div>
            <p className="b-label"><IconAgents /> Assistants on this document</p>
            <div className="b-context-agents">
              {ALL_AGENTS.map((id) => {
                const run = state.agent_runs
                  .filter((item) => item.agent_id === id && item.anchor_document_id === activeDoc.id)
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
          </div>
        </section>
      ) : (
        onOpenDocuments && (
          <p className="dash-aside meta">
            Reviewing a PDF of your own?{" "}
            <button type="button" className="btn btn--quiet btn--small" onClick={onOpenDocuments}>
              Open “Your own document”
            </button>
          </p>
        )
      )}

      {/* ---- 5 · Where this review stands ------------------------------------
          The figures, after the decision they support. The check run has its one
          home here, beside the numbers it produces. */}
      <section className="b-card dash-stands">
        <div className="b-label-row">
          <p className="b-label"><IconGauge /> Where this review stands</p>
          <button type="button" className="btn btn--secondary btn--small" disabled={busy} onClick={track(onRunCheck)}>
            {build ? "Run the check again" : "Run the check"}
          </button>
        </div>

        {/* Values are passed as text so no figure counts up — a compliance number
            that animates invites a reader to watch it rather than read it. */}
        <StatRow>
          <Stat
            size="l"
            label="Needs human input"
            value={String(awaitingHumanInput)}
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
              value={String(failed.length)}
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
            value={String(computableDates)}
            context={`of ${totalDeadlines} deadline${totalDeadlines === 1 ? "" : "s"}`}
          />
        </StatRow>

        {totalDeadlines > 0 && (
          <Meter
            label="Deadlines worked out from SEBI's own wording"
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
        )}

        {build ? (
          <div className="dash-progress">
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
          </div>
        ) : (
          <p className="meta">
            Check progress appears once the check has run. Nothing here is estimated in advance.
          </p>
        )}
      </section>

      {/* ---- 6 · The score, and what it is made of --------------------------- */}
      <section className="b-card dash-score">
        <p className="b-label"><IconGauge /> Cyber Capability Index — your compliance health score</p>
        {cci ? (
          <>
            <CciDial report={cci} />
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
          </>
        ) : cciState === "loading" ? (
          <Skeleton kind="dial" />
        ) : (
          <Empty
            title="Score unavailable"
            hint="The score could not be read just now."
            action={
              <button type="button" className="btn btn--secondary" disabled={busy} onClick={loadCci}>
                Try again
              </button>
            }
          />
        )}
      </section>

      {/* ---- 7 · Recent record ----------------------------------------------
          One disclosure holds everything that already happened: the audit trail,
          the shape of that activity over time, and the assistants' last steps. */}
      <section className="b-card dash-record">
        <Disclosure
          summary={
            <>
              <IconLedger /> Recent record
              <span className="meta">
                {" "}
                — {state.audit_events.length} recorded event{state.audit_events.length === 1 ? "" : "s"}
              </span>
            </>
          }
        >
          {state.audit_events.length === 0 ? (
            <Empty
              title="No events recorded yet"
              hint="Every action taken here is recorded, and appears in this list as it happens."
            />
          ) : (
            <div className="stack-s">
              <Timeline
                items={state.audit_events.slice(-8).reverse().map((event) => ({
                  id: event.id,
                  title: eventLabelOf(event.event_type),
                  meta: `${event.actor} · ${formatTimestamp(event.created_at)}`,
                }))}
              />

              {state.audit_events.length > 1 && (
                <div>
                  <p className="micro">Activity recorded so far</p>
                  <TrendChart events={state.audit_events} />
                  <ul className="segbar-legend">
                    <LegendChip tone="accent" label="recorded events" count={state.audit_events.length} />
                    <LegendChip label="readings" count={state.reviews.length} />
                    <LegendChip label="assistant runs" count={state.agent_runs.length} />
                  </ul>
                  <p className="micro">Every point is a recorded audit event. Nothing here is projected.</p>
                </div>
              )}

              <div>
                <p className="micro">Assistant activity</p>
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
            </div>
          )}
        </Disclosure>
      </section>

      {/* ---- 8 · Ask about the source ---------------------------------------- */}
      <section className="b-card dash-ask">
        <p className="b-label"><IconAsk /> Ask about these SEBI rules</p>
        <AskPanel />
      </section>

      {/* ---- 9 · Footer: the machinery, after the work ------------------------
          Model identity, workspace fingerprint and connection activity live here.
          They explain how the page knows what it knows; they are not the case
          that needs attention, so they never precede it. */}
      <footer className="dash-foot">
        <div className="dash-foot-row">
          <p className="meta">
            <IconAgents /> Four read-only assistants can support this review. They read; they
            change nothing.
          </p>
          <button type="button" className="btn btn--quiet btn--small" onClick={openAssistants}>
            Open AI assistants
          </button>
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

        <Disclosure summary="Connection and technical details">
          <LiveStrip onChange={() => { loadCci(); onRefresh(); }} />
        </Disclosure>

        <p className="meta dash-foot-note">
          Synthetic demo data. Nothing here is filed with SEBI.
        </p>
      </footer>
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
