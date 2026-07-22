"use client";

import { useCallback, useEffect, useState } from "react";

import { regosApi } from "../lib/api";
import { AgentConsole } from "./AgentConsole";
import { formatTimestamp } from "../lib/presentation";
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
    label: "Fixed steps",
    hint: "The same steps in the same order every time. Nothing here is AI, and it is never described as AI.",
  },
  {
    id: "MODEL_PLANNED",
    label: "Let the AI work out the steps",
    hint: "The AI decides what to look at next, based on what it has just read.",
  },
  {
    id: "RECORDED_MODEL_TRACE",
    label: "Replay an earlier AI run",
    hint: "The same steps the AI chose before, replayed without going online.",
  },
];

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

  return (
    <div className="stack-l">
      <section className="stack-s">
        <h1 className="page-title">AI agents</h1>
        <p className="lede">
          Four assistants read the SEBI text and point out problems — a pointer that leads
          nowhere, a duty with no deadline, a figure that does not match the wording they
          cite. They can raise something. They cannot change anything: none of them is able
          to edit a requirement, set a date, or sign anything off. Every step they take is
          written down, so you can check their work instead of trusting it.
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

      {/* ---- What may plan a run ----------------------------------------- */}
      <Panel
        title="How the assistants decide what to do"
        description="The record always shows which of these actually ran — not the one you asked for, if the AI could not be reached."
      >
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
            <DataRow label="Recorded runs available">
              {planner.recorded_available.length > 0
                ? planner.recorded_available.join(", ")
                : "None recorded yet."}
            </DataRow>
          </dl>
        )}

        {modelUnavailable && (
          <Callout tone="neutral" title="A live model is not reachable from this deployment.">
            <p>
              Running an agent will fall back to the fixed sequence and label the result as
              such. A trace that misnames its own planner would be worse than no trace.
            </p>
          </Callout>
        )}
        {noRecording && (
          <Callout tone="neutral" title="No recorded model run exists for these agents yet.">
            <p>Runs will fall back to the fixed sequence and say so.</p>
          </Callout>
        )}

        <div className="btn-row">
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy}
            onClick={() => void onRun(() => regosApi.runAllAgents(source))}
          >
            Run all four assistants
          </button>
          <button
            type="button"
            className="btn btn--quiet"
            disabled={busy || state.agent_runs.length === 0}
            onClick={() => void onRun(regosApi.reset)}
          >
            Clear runs
          </button>
        </div>
      </Panel>

      {/* ---- Watch one work, live ---------------------------------------- */}
      <Panel
        title="Watch it work"
        description="Start an assistant and every step it takes appears below as it happens — what it looked at, what came back, and what the rules made of it."
      >
        <AgentConsole
          agents={catalogue?.map((entry) => entry.id) ?? []}
          planner={source}
          busy={busy}
          onFinished={refresh}
        />
      </Panel>

      {/* ---- The four agents, and what each is allowed to be -------------- */}
      {catalogue?.map((entry) => {
        const run = runsById.get(entry.id);
        return (
          <Panel
            key={entry.id}
            title={entry.name}
            description={entry.autonomy}
            aside={
              <button
                type="button"
                className="btn btn--secondary btn--small"
                disabled={busy}
                onClick={() => void runOne(entry.id)}
              >
                {run ? "Run again" : "Run this agent"}
              </button>
            }
          >
            <dl className="datalist">
              <DataRow label="Reads">{entry.reads}</DataRow>
              <DataRow label="Proposes">{entry.proposes}</DataRow>
              <DataRow label="Never does">{entry.never_does}</DataRow>
              <DataRow label="Gated by">{entry.gated_by}</DataRow>
              <DataRow label="Tools it holds">
                <span className="mono">{entry.tools.join(", ")}</span>
              </DataRow>
            </dl>

            {run ? <RunDetail run={run} /> : (
              <p className="empty">
                Not run yet. Nothing is claimed about this agent until it has been run and
                its trace recorded.
              </p>
            )}
          </Panel>
        );
      })}
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
                <p>{finding.detail}</p>
                <p className="outcome-why">
                  <strong>Gate:</strong> {finding.gate_reason}
                </p>
                {finding.citations.map((citation) => (
                  <p className="meta" key={citation.span_id}>
                    {citation.locator} —{" "}
                    <a href={citation.source_url} target="_blank" rel="noreferrer">
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
                  <td>{step.tool_output_summary}</td>
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
