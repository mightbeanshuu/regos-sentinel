"use client";

import { useCallback, useEffect, useState } from "react";

import { regosApi } from "../lib/api";
import { useChangeKey } from "../lib/liveness";
import { checkLabel, formatDate, labelOf } from "../lib/presentation";
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
import { Callout, Counts, Disclosure, Panel, StateLabel } from "./ui";

/**
 * The control centre: what is true right now, for the person who is accountable.
 *
 * Every number on this page is computed from live state on each load — there is no
 * stored figure, no seeded score, nothing that could drift from what the workspace
 * actually holds. It refreshes on an interval and after any action, so leaving it open
 * on a screen is a reasonable thing to do.
 *
 * The ordering is deliberate and is the answer to "what is happening, I am lost":
 * first what the product does in three sentences, then the score, then what needs a
 * person, then the machinery working in the open. Detail is available under every
 * section and never in front of it.
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

  const loadCci = useCallback(() => {
    void regosApi.cci().then(setCci).catch(() => setCci(null));
  }, []);

  // Recomputed whenever the workspace moves, and on a timer so an open screen stays true.
  useEffect(() => {
    loadCci();
  }, [loadCci, state.builds.length, state.reviews.length, state.agent_runs.length]);

  useEffect(() => {
    const timer = window.setInterval(() => { loadCci(); onRefresh(); }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [loadCci, onRefresh]);

  // Coming back to the tab is the moment staleness would show; refetch right then.
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

  // The hero figure flashes only when its own value moves — same grammar as
  // every other live figure on this page. Unchanged values stay still.
  const waitingFlash = useChangeKey(build ? waiting.length : null);
  const failedFlash = useChangeKey(build ? failed.length : null);

  const active = state.obligations.filter((item) => item.status.startsWith("ACTIVE"));
  const blockedDates = state.deadline_computations.filter((item) => !item.computable);
  const evidenceCurrent = state.evidence.filter((item) => item.status === "CURRENT");
  const runsById = new Map(state.agent_runs.map((item) => [item.agent_id, item]));

  return (
    <div className="stack-l">
      <section className="stack-s">
        <h1 className="page-title">Compliance control centre</h1>
        <p className="lede">
          {state.entity_profile.legal_name} · {labelOf(state.entity_profile.entity_type)}
          {state.entity_profile.is_qsb ? " · Qualified stockbroker" : ""}
        </p>
        <LiveStrip onChange={() => { loadCci(); onRefresh(); }} />
      </section>

      {/* ---- The establishing view: the decision and the score, one visual
              sentence above the fold. State first; explanation demoted below. */}
      <div className={cci ? "hero" : "hero hero--solo"}>
        {!build ? (
          <div className="callout callout--accent callout--hero">
            <p className="callout-title hero-headline">No check has been run yet.</p>
            <div className="btn-row">
              <button type="button" className="btn btn--primary" disabled={busy} onClick={onRunCheck}>
                Run the check
              </button>
            </div>
          </div>
        ) : failed.length > 0 ? (
          <div className="callout callout--fail callout--hero">
            <p className="callout-title hero-headline">
              <span aria-hidden="true">✕</span>
              <span
                className={failedFlash > 0 ? "hero-figure flash-change" : "hero-figure"}
                key={failedFlash}
              >
                {failed.length}
              </span>{" "}
              check did not pass.
            </p>
          </div>
        ) : waiting.length > 0 ? (
          <div className="callout callout--review callout--hero">
            <p className="callout-title hero-headline">
              <span aria-hidden="true">!</span>
              <span
                className={waitingFlash > 0 ? "hero-figure flash-change" : "hero-figure"}
                key={waitingFlash}
              >
                {waiting.length}
              </span>{" "}
              decisions are yours to make.
            </p>
            <div className="btn-row">
              <button type="button" className="btn btn--primary" disabled={busy} onClick={onOpenDecision}>
                Make the decision
              </button>
              <button type="button" className="btn btn--quiet" disabled={busy} onClick={onRunCheck}>
                Run the check again
              </button>
            </div>
          </div>
        ) : (
          <div className="callout callout--ok callout--hero">
            <p className="callout-title hero-headline">
              <span aria-hidden="true">✓</span>
              Everything that can be settled is settled.
            </p>
            <div className="btn-row">
              <button type="button" className="btn btn--primary" disabled={busy} onClick={onDownloadReport}>
                Download the report
              </button>
            </div>
          </div>
        )}

        {cci && (
          <section className="hero-dial" aria-labelledby="hero-dial-title">
            <h2 className="hero-dial-title" id="hero-dial-title">
              Your cyber capability score
            </h2>
            <CciDial report={cci} />
          </section>
        )}
      </div>

      {/* ---- Five numbers, no more -------------------------------------- */}
      <Counts
        glass
        items={[
          { value: active.length, label: "Requirements that apply" },
          { value: waiting.length, label: "Waiting on you" },
          {
            value: `${state.deadline_computations.length - blockedDates.length}/${state.deadline_computations.length}`,
            label: "Dates that can be worked out",
          },
          { value: `${evidenceCurrent.length}/${state.evidence.length}`, label: "Evidence up to date" },
          {
            value: receipt ? <StateLabel value={receipt.status} /> : "Not checked",
            label: "SEBI source",
          },
        ]}
      />

      {/* ---- What needs a person ---------------------------------------- */}
      {waiting.length > 0 && (
        <Panel title="What needs you">
          <ul className="stack-s">
            {waiting.map((item) => (
              <li key={item.id} className="outcome">
                <p className="outcome-title">
                  <span className="strong-ink">{checkLabel(item.id, item.name)}</span>
                </p>
                <div className="outcome-body"><p>{item.message}</p></div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* ---- What the score is made of ----------------------------------- */}
      {cci && (
        <Panel title="Score breakdown">
          <div className="stack-s">
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
                  <p className="meta">{item.evidence}</p>
                </li>
              ))}
            </ul>
            <Callout tone="neutral" title="Why this is a partial score">
              <p>{cci.limitation}</p>
              <p>{cci.obligation}</p>
            </Callout>
          </Disclosure>
        </Panel>
      )}

      {/* ---- Ask it something ------------------------------------------- */}
      <AskPanel />

      {/* ---- The assistants, working in the open ------------------------- */}
      <Panel title="AI agents" description="Read-only. None can change a requirement, set a date, or approve anything.">
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
      </Panel>

      {/* ---- Deadlines --------------------------------------------------- */}
      {state.findings.length > 0 && (
        <Panel title="Incident reporting clocks">
          <IncidentReportingClock state={state} />
        </Panel>
      )}

      {state.deadline_computations.length > 0 && (
        <Panel title="Deadlines" tight>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">What you have to do</th>
                  <th scope="col">How long you have</th>
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
        </Panel>
      )}

      {/* ---- Evidence and source ---------------------------------------- */}
      <Panel
        title="Evidence and source"
        aside={
          <button
            type="button"
            className="btn btn--secondary btn--small"
            disabled={busy}
            onClick={onVerifySource}
          >
            Check the source is unchanged
          </button>
        }
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th scope="col">Document</th><th scope="col">Status</th></tr>
            </thead>
            <tbody>
              {state.evidence.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td><StateLabel value={item.status} showHint /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="stack-s">
          {state.documents.map((document) => (
            <li key={document.id}>
              <p><strong className="strong-ink">{document.title}</strong></p>
              <p className="meta">
                Published {formatDate(document.published_at)} ·{" "}
                <a
                  className="proof-link"
                  href={document.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  open the original ↗
                </a>
              </p>
            </li>
          ))}
        </ul>
        {receipt && (
          <Callout tone={receipt.hash_matches_expected ? "ok" : "review"}>
            <p>
              {receipt.hash_matches_expected
                ? "Checked just now against sebi.gov.in. The published document is byte-for-byte what this workspace read."
                : "The published document no longer matches what was reviewed. This needs a look."}
            </p>
          </Callout>
        )}
      </Panel>

      {build && (
        <p className="meta">
          {passed.length} of {build.tests.length} checks passed · detail under <strong>Full record</strong>.
        </p>
      )}
    </div>
  );
}
