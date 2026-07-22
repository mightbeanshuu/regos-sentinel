"use client";

import { useCallback, useEffect, useState } from "react";

import { regosApi } from "../lib/api";
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

const AGENT_PLAIN: Record<AgentId, { name: string; does: string }> = {
  REFERENCE_RESOLVER: {
    name: "Reference finder",
    does: "Follows every “see Table 19” pointer to the passage it names, and refuses if it does not match.",
  },
  EXTRACTOR: {
    name: "Deadline reader",
    does: "Reads a passage and says whether a date can honestly be worked out from it.",
  },
  SOURCE_SCOUT: {
    name: "Change watcher",
    does: "Compares the reviewed document against newer SEBI text and reports what moved.",
  },
  ADVERSARY: {
    name: "Challenger",
    does: "Tries to break each requirement before you are asked to approve it.",
  },
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

  const build = state.builds.at(-1);
  const waiting = build?.tests.filter((item) => item.status === "BLOCK") ?? [];
  const failed = build?.tests.filter((item) => item.status === "FAIL") ?? [];
  const passed = build?.tests.filter((item) => item.status === "PASS") ?? [];

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
      </section>

      {/* ---- What this thing is doing, in three sentences ---------------- */}
      <div className="how">
        <div className="how-step">
          <span className="how-num" aria-hidden="true">1</span>
          <p className="how-title">It reads the SEBI document</p>
          <p className="how-body">
            The published CSCRF FAQ and the May 2026 AI advisory, fetched from
            sebi.gov.in and fingerprinted so you can prove they have not changed.
          </p>
        </div>
        <div className="how-step">
          <span className="how-num" aria-hidden="true">2</span>
          <p className="how-title">Fixed rules check your controls against it</p>
          <p className="how-body">
            Twelve checks compare what SEBI requires with what this firm actually does,
            and each answer points at the sentence it came from.
          </p>
        </div>
        <div className="how-step">
          <span className="how-num" aria-hidden="true">3</span>
          <p className="how-title">Where the text is silent, it stops and asks you</p>
          <p className="how-body">
            SEBI sometimes says how long you have but not when the clock starts. Rather
            than invent a date, it hands you the gap to decide.
          </p>
        </div>
      </div>

      {/* ---- The one thing worth saying first ---------------------------- */}
      {!build ? (
        <Callout tone="accent" title="No check has been run yet.">
          <p>Run it to see where this firm stands against the SEBI text.</p>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" disabled={busy} onClick={onRunCheck}>
              Run the check
            </button>
          </div>
        </Callout>
      ) : failed.length > 0 ? (
        <Callout tone="fail" title={`${failed.length} check did not pass.`}>
          <p>This points to a problem in the data rather than in your compliance.</p>
        </Callout>
      ) : waiting.length > 0 ? (
        <Callout tone="review" title={`${waiting.length} decisions are yours to make.`}>
          <p>
            The system has gone as far as the SEBI wording allows. What is left needs a
            person, because the text does not answer it.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" disabled={busy} onClick={onOpenDecision}>
              Make the decision
            </button>
            <button type="button" className="btn btn--quiet" disabled={busy} onClick={onRunCheck}>
              Run the check again
            </button>
          </div>
        </Callout>
      ) : (
        <Callout tone="ok" title="Everything that can be settled is settled.">
          <p>All checks passed. The record is ready to hand to an auditor.</p>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" disabled={busy} onClick={onDownloadReport}>
              Download the report
            </button>
          </div>
        </Callout>
      )}

      {/* ---- The score SEBI asks for ------------------------------------- */}
      {cci && (
        <Panel
          title="Your cyber capability score"
          description="SEBI asks larger regulated entities for this score — every six months for market infrastructure institutions, every year for qualified entities. It is worked out live from the evidence in this workspace."
        >
          <div className="cci-layout">
            <CciDial report={cci} />
            <div className="stack-s">
              {cci.parameters.filter((item) => item.assessed).map((item) => (
                <div className="cci-row" key={item.id}>
                  <span className="cci-row-title">{item.title}</span>
                  <span className="cci-bar" aria-hidden="true">
                    <span
                      className={`cci-bar-fill${(item.score ?? 0) >= 80 ? " cci-bar-fill--ok" : (item.score ?? 0) >= 40 ? " cci-bar-fill--review" : " cci-bar-fill--fail"}`}
                      style={{ width: `${item.score ?? 0}%` }}
                    />
                  </span>
                  <span className="cci-row-score">{item.score}</span>
                </div>
              ))}
            </div>
          </div>

          <Disclosure summary="What each part means, and what is not counted">
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
        <Panel
          title="What needs you"
          description="Each of these is a question the SEBI text does not answer. Your decision is recorded with your name and your reason."
        >
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

      {/* ---- Ask it something ------------------------------------------- */}
      <AskPanel />

      {/* ---- The assistants, working in the open ------------------------- */}
      <Panel
        title="Automated checks, running in front of you"
        description="Four assistants read the SEBI text and raise problems. None of them can change a requirement, set a date, or approve anything. Start one and watch every step it takes."
      >
        <div className="agent-strip">
          {ALL_AGENTS.map((id) => {
            const run = runsById.get(id);
            return (
              <div className="agent-chip" key={id}>
                <p className="agent-chip-name">{AGENT_PLAIN[id].name}</p>
                <p className="agent-chip-does">{AGENT_PLAIN[id].does}</p>
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
        <Panel
          title="Incident reporting clocks"
          description="Each VAPT finding gets a reporting clock only when the workspace has enough to calculate it. Where SEBI does not state when the clock starts, the face stays empty."
        >
          <IncidentReportingClock state={state} />
        </Panel>
      )}

      {state.deadline_computations.length > 0 && (
        <Panel
          title="Your deadlines"
          description="Where SEBI does not say when a clock starts, no date is shown. A guess in this column would be worse than a gap."
          tight
        >
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
                            <p className="meta">
                              SEBI states the period but not what starts it, so no date
                              can be produced until you set your firm&apos;s policy.
                            </p>
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
        description="The documents behind your controls, and the SEBI text everything traces back to."
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
                <a href={document.source_url} target="_blank" rel="noreferrer">
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
          {passed.length} of {build.tests.length} checks passed. Every check, every
          quotation and the reasoning behind each figure is under <strong>Full record</strong>.
        </p>
      )}
    </div>
  );
}
