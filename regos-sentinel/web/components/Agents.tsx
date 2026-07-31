"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { regosApi } from "../lib/api";
import { AgentConsole } from "./AgentConsole";
import type { AgentConsoleHandle } from "./AgentConsole";
import { agentNameOf, formatTimestamp, glossFor } from "../lib/presentation";
import type {
  AgentCatalogueEntry,
  AgentChallenges,
  AgentId,
  AgentRun,
  PlannerKind,
  PlannerStatus,
  WorkspaceState,
} from "../lib/types";
import { Callout, Counts, DataRow, Disclosure, Hash, Panel, StateLabel, Tag } from "./ui";

/**
 * The plan sources an operator may ask for.
 *
 * Deterministic is first and is the default because it is complete and reproducible.
 * Asking for a model plan is a deliberate act, and if the model is unreachable the run
 * falls back and the trace says which planner actually ran — never the one that was
 * requested.
 */
const PLAN_SOURCES: Array<{ id: PlannerKind; label: string; hint: string }> = [
  {
    id: "DETERMINISTIC_PLAN",
    label: "Scripted — same steps every time",
    hint: "Nothing here is AI, and it is never described as AI.",
  },
  {
    id: "MODEL_PLANNED",
    label: "Fresh plan by AI — Gemini decides the steps",
    hint: "The AI picks what to look at next, based on what it just read.",
  },
  {
    id: "RECORDED_MODEL_TRACE",
    label: "Replay — re-run a recorded session",
    hint: "The steps the AI chose before, replayed without going online.",
  },
];

/** Plain-word job lines and a tone per assistant — the approved card design. */
const AGENT_VISUAL: Record<AgentId, { job: string; tone: string }> = {
  REFERENCE_RESOLVER: {
    job: "Checks that every \u2018see Table 19\u2019 really points at Table 19.",
    tone: "ok",
  },
  SOURCE_SCOUT: {
    job: "Spots when SEBI\u2019s wording quietly moves.",
    tone: "royal",
  },
  ADVERSARY: {
    job: "Tries to break our own conclusions before a regulator can.",
    tone: "review",
  },
  EXTRACTOR: {
    job: "Asks of every sentence: can this make a calendar date?",
    tone: "green",
  },
};

const AGENT_GLYPH: Record<AgentId, string> = {
  REFERENCE_RESOLVER: "M10 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm8 14-3.8-3.8",
  SOURCE_SCOUT: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Zm10 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  ADVERSARY: "M12 3 5 5.7v5.1c0 4 2.8 7.6 7 8.7 4.2-1.1 7-4.7 7-8.7V5.7L12 3Zm0 4v4m0 0-2 3m2-3 2 3",
  EXTRACTOR: "M7 4v3M17 4v3M4 9h16M6 6h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z",
};

export function Agents({
  state,
  busy,
  onRun,
}: {
  state: WorkspaceState;
  busy: boolean;
  onRun: (operation: () => Promise<WorkspaceState>) => Promise<void>;
}) {
  const [catalogue, setCatalogue] = useState<AgentCatalogueEntry[] | null>(null);
  const [planner, setPlanner] = useState<PlannerStatus | null>(null);
  const [challenges, setChallenges] = useState<AgentChallenges | null>(null);
  const [source, setSource] = useState<PlannerKind>("DETERMINISTIC_PLAN");
  const [active, setActive] = useState<AgentId | null>(null);

  useEffect(() => {
    let live = true;
    void Promise.all([
      regosApi.agentCatalogue().catch(() => null),
      regosApi.plannerStatus().catch(() => null),
      regosApi.agentChallenges().catch(() => null),
    ]).then(([entries, status, landed]) => {
      if (!live) return;
      setCatalogue(entries);
      setPlanner(status);
      setChallenges(landed);
    });
    return () => { live = false; };
  }, [state.agent_runs.length, state.builds.length]);

  const runOne = useCallback(
    (id: AgentId) => onRun(() => regosApi.runAgent(id, source)),
    [onRun, source],
  );

  /**
   * A streamed run writes to the workspace on its own connection, so when it finishes
   * this page is holding state from before it started. Refetching is the whole fix.
   */
  const refresh = useCallback(() => { void onRun(regosApi.workspace); }, [onRun]);

  const runsById = new Map(state.agent_runs.map((item) => [item.agent_id, item]));
  const modelUnavailable = source === "MODEL_PLANNED" && planner?.model_available === false;
  const noRecording =
    source === "RECORDED_MODEL_TRACE" && planner?.recorded_available.length === 0;

  // Run-all drives the live console below — every tool call of all four runs
  // streams into the terminal instead of finishing silently on the server.
  const consoleRef = useRef<AgentConsoleHandle | null>(null);
  const agentOrder = catalogue?.map((entry) => entry.id) ?? [];
  const runAllLive = () => consoleRef.current?.runSequence(agentOrder);

  return (
    <div className="stack-l">
      <section className="stack-s">
        <h1 className="page-title">AI agents</h1>
        <p className="lede">
          Read-only. They raise problems; they cannot edit, date, or approve anything.
          Every step is recorded.
        </p>
      </section>

      {challenges?.blocking && (
        <Callout tone="review" title="A challenge landed. Publication is blocked.">
          <ul className="stack-s">
            {challenges.landed.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p>
            The adversary agent cannot resolve this itself and cannot edit what it
            challenged. A compliance officer has to rule on it before the build proceeds.
          </p>
        </Callout>
      )}

      <div className="ag-shell">
        {/* ---- Real sections only: the invented nav is not ported --------- */}
        <aside className="ag-side" aria-label="Assistant sections">
          {([
            ["#ag-cards", "Assistants"],
            ["#ag-terminal", "Watch them work"],
            ["#ag-plan", "Planning mode"],
          ] as const).map(([href, label]) => (
            <button
              key={href}
              type="button"
              className="side-item"
              onClick={() => document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              <span className="side-item-label">{label}</span>
            </button>
          ))}
          <button
            type="button"
            className="btn btn--primary ag-side-run"
            disabled={busy || agentOrder.length === 0}
            onClick={runAllLive}
          >
            Run all four
          </button>
          <button
            type="button"
            className="btn btn--quiet btn--small"
            disabled={busy || state.agent_runs.length === 0}
            onClick={() => void onRun(regosApi.reset)}
          >
            Clear runs
          </button>
        </aside>

        <div className="ag-main">
          {/* ---- The promise, as a pipeline ------------------------------- */}
          <div className="ag-pipeline" aria-label="How the assistants are allowed to work">
            {["Assistants read", "Fixed rules decide", "You approve"].map((step, index) => (
              <span className="ag-node" key={step}>
                <span className={`ag-node-dot${index === 0 ? " ag-node-dot--live" : ""}`} aria-hidden="true" />
                <span className="ag-node-word">{step}</span>
                {index < 2 && <span className="ag-node-arrow" aria-hidden="true">→</span>}
              </span>
            ))}
          </div>
          <p className="ag-pipeline-caption">
            No assistant can write a record. Every step is sealed in the log.
          </p>

          {/* ---- Four cards, all visible ---------------------------------- */}
          <div className="ag-cards" id="ag-cards">
            {(catalogue ?? []).map((entry) => {
              const run = runsById.get(entry.id);
              const visual = AGENT_VISUAL[entry.id];
              return (
                <article className="ag-card" key={entry.id}>
                  <div className="ag-card-top">
                    <span className={`ag-avatar ag-avatar--${visual?.tone ?? "royal"}`} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d={AGENT_GLYPH[entry.id]} />
                      </svg>
                    </span>
                    <span className={`ag-status${run ? " ag-status--ran" : ""}`}>
                      <span className="ag-status-dot" aria-hidden="true" />
                      {run ? `${run.findings.length} findings` : "Ready"}
                    </span>
                  </div>
                  <h3 className="ag-card-name">{agentNameOf(entry.id)}</h3>
                  <p className="ag-card-job">{visual?.job ?? entry.autonomy}</p>
                  {run && (
                    <span className="agent-spark" aria-hidden="true">
                      {run.steps.map((step) => (
                        <i
                          key={step.step_sha256}
                          className={step.status === "OK" ? "" : "agent-spark--warn"}
                        />
                      ))}
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn--primary ag-card-run"
                    disabled={busy}
                    onClick={() => void runOne(entry.id)}
                  >
                    {run ? "Run again" : "Run assistant"}
                  </button>
                  <Disclosure summary="Details and trace">
                    <dl className="datalist">
                      <DataRow label="Reads">{entry.reads}</DataRow>
                      <DataRow label="Proposes">{entry.proposes}</DataRow>
                      <DataRow label="Never does">{entry.never_does}</DataRow>
                      <DataRow label="Gated by">{entry.gated_by}</DataRow>
                    </dl>
                    <div className="agent-tools">
                      {entry.tools.map((tool) => (
                        <span className="agent-tool-chip mono" key={tool}>{tool}</span>
                      ))}
                    </div>
                    {run ? (
                      <RunDetail run={run} />
                    ) : (
                      <p className="empty">
                        Not run yet. Nothing is claimed about this agent until it has run and
                        its trace is recorded.
                      </p>
                    )}
                  </Disclosure>
                </article>
              );
            })}
          </div>

          {/* ---- Health strip: recorded counts only ----------------------- */}
          <div className="agent-health">
            <span>
              {[...runsById.keys()].length} of 4 assistants run ·{" "}
              {state.agent_runs.reduce((sum, run) => sum + run.findings.length, 0)} findings ·{" "}
              {state.agent_runs.length > 0 && state.agent_runs.every((run) => run.chain_verified)
                ? "every run verified"
                : `${state.agent_runs.filter((run) => run.chain_verified).length} of ${state.agent_runs.length} runs verified`}
              {" · "}{challenges?.landed.length ?? 0} challenges landed
            </span>
          </div>
        </div>

        <aside className="ag-rail">
          {/* ---- Watch them work ------------------------------------------ */}
          <section className="ag-rail-card" id="ag-terminal">
            <p className="sub-title">Watch them work</p>
            <AgentConsole
              agents={agentOrder}
              planner={source}
              busy={busy}
              onFinished={refresh}
              controlRef={consoleRef}
            />
          </section>

          {/* ---- Planning mode -------------------------------------------- */}
          <section className="ag-rail-card" id="ag-plan">
            <p className="sub-title">Planning mode</p>
            <div className="stack-s">
              {PLAN_SOURCES.map((item) => (
                <label
                  key={item.id}
                  className={`choice${source === item.id ? " choice--on" : ""}`}
                >
                  <input
                    type="radio"
                    name="plan-source"
                    value={item.id}
                    checked={source === item.id}
                    onChange={() => setSource(item.id)}
                  />
                  <span className="choice-title">
                    {item.label}
                    {item.id === planner?.default && <Tag value="Default" tone="neutral" />}
                  </span>
                  <span className="choice-hint">{item.hint}</span>
                </label>
              ))}
            </div>
            {planner && (
              <dl className="datalist">
                <DataRow label="Live model">
                  {planner.model_available
                    ? <span className="mono">{planner.model_id}</span>
                    : planner.offline
                      ? "Offline mode. Nothing here reaches the network."
                      : "No planner key configured on this deployment."}
                </DataRow>
                <DataRow label="Recorded runs">
                  {planner.recorded_available.length > 0
                    ? planner.recorded_available.map(agentNameOf).join(", ")
                    : "None recorded yet."}
                </DataRow>
              </dl>
            )}
            {modelUnavailable && (
              <p className="meta">
                A live model is not reachable — runs fall back to the scripted sequence and
                the trace says so.
              </p>
            )}
            {noRecording && (
              <p className="meta">No recording exists yet — runs fall back and say so.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * One run: what it proposed, and the chain of calls it made to get there.
 * ---------------------------------------------------------------------- */

function RunDetail({ run }: { run: AgentRun }) {
  const forReview = run.findings.filter((item) => item.requires_human_review).length;

  return (
    <div className="stack">
      <Counts
        items={[
          { value: <StateLabel value={run.planner} />, label: "Planned by" },
          { value: run.tool_call_count, label: "Tool calls" },
          { value: run.findings.length, label: "Findings" },
          { value: forReview, label: "Need a person" },
        ]}
      />

      {run.planner_note && (
        <Callout tone="neutral" title="This is not the planner that was asked for.">
          <p>{run.planner_note}</p>
          <p>
            The findings below are unaffected: they are produced by the same fixed rules
            whichever planner ran. What changed is who chose the route.
          </p>
        </Callout>
      )}

      <dl className="datalist">
        <DataRow label="Goal">{run.goal}</DataRow>
        <DataRow label="Read">
          {run.anchor_filename
            ? <>Your uploaded document <span className="strong-ink">{run.anchor_filename}</span></>
            : "The reviewed demo corpus"}
        </DataRow>
        {run.model_id && (
          <DataRow label="Model">
            <span className="mono">{run.model_id}</span>
            {run.prompt_version && <span className="meta"> · {run.prompt_version}</span>}
          </DataRow>
        )}
        <DataRow label="Chain">
          <StateLabel value={run.chain_verified ? "PASS" : "FAIL"} />
          <span className="meta">
            {run.chain_verified
              ? " Every step re-hashed and matched. Editing any one of them breaks this."
              : " The recorded chain does not recompute. Treat this trace as untrustworthy."}
          </span>
        </DataRow>
        <DataRow label="Chain head"><Hash value={run.chain_head_sha256} /></DataRow>
        <DataRow label="Completed">{formatTimestamp(run.completed_at)}</DataRow>
        <DataRow label="Limitation">{run.limitation}</DataRow>
      </dl>

      {/* ---- What it proposed, and what the gate did with it ------------- */}
      {run.findings.length > 0 && (
        <div className="stack-s">
          {run.findings.map((finding) => (
            <div className="outcome" key={finding.id}>
              <p className="outcome-title">
                <StateLabel value={finding.kind} showHint />
              </p>
              <div className="outcome-body">
                <p><strong className="strong-ink">{finding.summary}</strong></p>
                {glossFor(finding.summary) && (
                  <p className="meta">→ {glossFor(finding.summary)}</p>
                )}
                <p>{finding.detail}</p>
                <p className="outcome-why">
                  <strong>Gate:</strong> {finding.gate_reason}
                </p>
                {finding.citations.map((citation) => (
                  <p className="meta" key={citation.span_id}>
                    {citation.locator} —{" "}
                    <a
                      className="proof-link"
                      href={citation.source_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      official source ↗
                    </a>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- The trace itself -------------------------------------------- */}
      <Disclosure summary={`Every call this run made (${run.steps.length})`}>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Tool</th>
                <th scope="col">Asked for</th>
                <th scope="col">Came back</th>
                <th scope="col">Outcome</th>
                <th scope="col">Step fingerprint</th>
              </tr>
            </thead>
            <tbody>
              {run.steps.map((step) => (
                <tr key={step.step_sha256}>
                  <td>{step.index + 1}</td>
                  <td><span className="mono">{step.tool}</span></td>
                  <td>
                    <span className="mono">
                      {Object.keys(step.tool_input).length === 0
                        ? "—"
                        : JSON.stringify(step.tool_input)}
                    </span>
                    {step.rationale && <p className="meta">{step.rationale}</p>}
                  </td>
                  <td>
                    {step.tool_output_summary}
                    {glossFor(step.tool_output_summary) && (
                      <p className="meta">→ {glossFor(step.tool_output_summary)}</p>
                    )}
                  </td>
                  <td><StateLabel value={step.status} showHint /></td>
                  <td><Hash value={step.step_sha256} label="step fingerprint" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="meta">
          Each fingerprint covers the step&apos;s own content and the fingerprint before it.
          Change one call after the fact and every later one stops matching, which is what
          makes this a piece of evidence rather than a log.
        </p>
      </Disclosure>
    </div>
  );
}
