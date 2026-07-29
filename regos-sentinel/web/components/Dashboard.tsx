"use client";

import { useCallback, useEffect, useState } from "react";

import { regosApi } from "../lib/api";
import { useChangeKey } from "../lib/liveness";
import { agentNameOf, checkLabel, formatDate, labelOf } from "../lib/presentation";
import type {
  AgentId,
  CciReport,
  LiveSourceVerificationReceipt,
  PlannerKind,
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
  receipt,
  busy,
  onRunCheck,
  onOpenDecision,
  onDownloadReport,
  onVerifySource,
  onRefresh,
}: {
  state: WorkspaceState;
  receipt: LiveSourceVerificationReceipt | null;
  busy: boolean;
  onRunCheck: () => void;
  onOpenDecision: () => void;
  onDownloadReport: () => void;
  onVerifySource: () => void;
  onRefresh: () => void;
}) {
  const [cci, setCci] = useState<CciReport | null>(null);
  const [planner] = useState<PlannerKind>("DETERMINISTIC_PLAN");
  const [view, setView] = useState<"overview" | "work" | "evidence" | "ask" | "agents">("overview");
  const [evidenceKinds, setEvidenceKinds] = useState<Set<string>>(new Set());

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

      <nav className="cmd-nav" aria-label="Command centre sections">
        {([
          ["overview", "Overview"],
          ["work", "Work queue"],
          ["evidence", "Evidence"],
          ["ask", "Ask"],
          ["agents", "Agents"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`cmd-nav-pill${view === id ? " cmd-nav-pill--on" : ""}`}
            aria-pressed={view === id}
            onClick={() => setView(id)}
          >
            {label}
            {id === "work" && waiting.length > 0 && (
              <span className="cmd-nav-count">{waiting.length}</span>
            )}
          </button>
        ))}
      </nav>

      {view === "overview" && (
      <div className="bento">
        {/* ---- Status hero -------------------------------------------- */}
        <section className={`b-card b-hero b-hero--${heroTone}`}>
          <GridField />
          <div className="b-hero-body">
            {!build ? (
              <>
                <p className="b-hero-word">No check has been run yet.</p>
                <div className="btn-row">
                  <button type="button" className="btn btn--primary" disabled={busy} onClick={onRunCheck}>
                    Run the check
                  </button>
                </div>
              </>
            ) : failed.length > 0 ? (
              <>
                <p className="b-hero-figure" key={failedFlash}>
                  <span aria-hidden="true" className="b-hero-glyph">✕</span>
                  <span className={failedFlash > 0 ? "flash-change" : undefined}>{failed.length}</span>
                </p>
                <p className="b-hero-word">check did not pass.</p>
              </>
            ) : waiting.length > 0 ? (
              <>
                <p className="b-hero-figure" key={waitingFlash}>
                  <span aria-hidden="true" className="b-hero-glyph">!</span>
                  <span className={waitingFlash > 0 ? "flash-change" : undefined}>{waiting.length}</span>
                </p>
                <p className="b-hero-word">decisions are yours to make.</p>
                <div className="btn-row">
                  <button type="button" className="btn btn--primary" disabled={busy} onClick={onOpenDecision}>
                    Make the decision
                  </button>
                  <button type="button" className="btn btn--quiet" disabled={busy} onClick={onRunCheck}>
                    Run the check again
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="b-hero-figure">
                  <span aria-hidden="true" className="b-hero-glyph b-hero-glyph--ok">✓</span>
                </p>
                <p className="b-hero-word">Everything that can be settled is settled.</p>
                <div className="btn-row">
                  <button type="button" className="btn btn--primary" disabled={busy} onClick={onDownloadReport}>
                    Download the report
                  </button>
                </div>
              </>
            )}
            {waiting.length > 0 && (
              <ul className="b-hero-list">
                {waiting.slice(0, 3).map((item) => (
                  <li key={item.id}>{checkLabel(item.id, item.name)}</li>
                ))}
                {waiting.length > 3 && (
                  <li className="b-hero-more">+ {waiting.length - 3} more under Work queue</li>
                )}
              </ul>
            )}
          </div>
        </section>

        {/* ---- Score dial --------------------------------------------- */}
        <section className="b-card b-dial">
          <p className="b-label"><IconGauge /> Cyber capability score</p>
          {cci ? <CciDial report={cci} /> : <p className="b-empty">Score unavailable.</p>}
        </section>

        {/* ---- Five figures ------------------------------------------- */}
        <section className="b-kpis">
          <div className="b-kpi">
            <span className="b-kpi-icon"><IconClauses /></span>
            <span className="b-kpi-value">{active.length}</span>
            <span className="b-kpi-label">Requirements that apply</span>
          </div>
          <div className={waiting.length > 0 ? "b-kpi b-kpi--attention" : "b-kpi"}>
            <span className="b-kpi-icon"><IconDecision /></span>
            <span className="b-kpi-value">{waiting.length}</span>
            <span className="b-kpi-label">Waiting on you</span>
          </div>
          <div className="b-kpi">
            <span className="b-kpi-icon"><IconCalendar /></span>
            <span className="b-kpi-value">
              {state.deadline_computations.length - blockedDates.length}
              <span className="b-kpi-of">/{state.deadline_computations.length}</span>
            </span>
            <span className="b-kpi-label">Dates that can be worked out</span>
          </div>
          <div className="b-kpi">
            <span className="b-kpi-icon"><IconEvidence /></span>
            <span className="b-kpi-value">
              {evidenceCurrent.length}
              <span className="b-kpi-of">/{state.evidence.length}</span>
            </span>
            <span className="b-kpi-label">Evidence up to date</span>
          </div>
          <div className="b-kpi">
            <span className="b-kpi-icon"><IconInstitution /></span>
            <span className="b-kpi-value b-kpi-value--word">
              {receipt ? <StateLabel value={receipt.status} /> : "Not checked"}
            </span>
            <span className="b-kpi-label">SEBI source</span>
          </div>
        </section>

        {/* ---- Score breakdown ---------------------------------------- */}
        {cci && (
          <section className="b-card b-score">
            <p className="b-label"><IconGauge /> Score breakdown</p>
            <div className="b-score-rows">
              {cci.parameters.filter((item) => item.assessed).map((item) => (
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
            <Disclosure summary="Detail">
              <ul className="stack-s">
                {cci.parameters.map((item) => (
                  <li key={item.id}>
                    <p>
                      <strong className="strong-ink">{item.title}</strong>
                      {!item.assessed && <span className="meta"> — not assessed</span>}
                    </p>
                    <p className="meta">{item.meaning}</p>
                  </li>
                ))}
              </ul>
              <p className="meta">{cci.limitation}</p>
            </Disclosure>
          </section>
        )}
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
            <IncidentReportingClock state={state} compact />
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

          <section className="b-card vault-table">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Document</th>
                    <th scope="col">Status</th>
                    <th scope="col">Collected</th>
                    <th scope="col">Fingerprint</th>
                  </tr>
                </thead>
                <tbody>
                  {state.evidence
                    .filter((item) => evidenceKinds.size === 0 || evidenceKinds.has(item.kind))
                    .map((item) => (
                      <tr key={item.id}>
                        <td>
                          {item.name}
                          {item.reason && <p className="meta clamp2" title={item.reason}>{item.reason}</p>}
                        </td>
                        <td><StateLabel value={item.status} /></td>
                        <td className="meta">{formatDate(item.collected_at)}</td>
                        <td className="meta">No fingerprint recorded</td>
                      </tr>
                    ))}
                  {state.documents.map((doc) => {
                    const stale = receipt !== null && !receipt.hash_matches_expected;
                    return (
                      <tr key={doc.id}>
                        <td>
                          {doc.title}
                          <p className="meta">
                            <a className="proof-link" href={doc.source_url} target="_blank" rel="noreferrer">
                              official source ↗
                            </a>
                          </p>
                        </td>
                        <td>
                          {stale ? (
                            <span className="vault-stale">
                              STALE
                              <span className="meta">source changed upstream</span>
                            </span>
                          ) : (
                            <StateLabel value={receipt ? "CURRENT" : "NOT_CHECKED"} />
                          )}
                        </td>
                        <td className="meta">
                          {receipt ? formatDate(receipt.checked_at) : formatDate(doc.published_at)}
                        </td>
                        <td>
                          <span className="vault-hash mono" title={doc.content_hash}>
                            ⌾ SHA-256: {doc.content_hash.slice(0, 8)}…
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="meta">Synthetic broker data · fingerprints are real.</p>
          </section>
        </div>
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

      {build && (
        <p className="cmd-foot">
          {passed.length} of {build.tests.length} checks passed · detail under <strong>Full record</strong>.
        </p>
      )}
    </div>
  );
}
