"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { regosApi } from "../lib/api";
import { AgentConsole } from "./AgentConsole";
import type { AgentConsoleHandle } from "./AgentConsole";
import {
  agentNameOf,
  formatTimestamp,
  glossFor,
  labelOf,
  plainPhrase,
  toolPlainOf,
} from "../lib/presentation";
import type {
  AgentCatalogueEntry,
  AgentChallenges,
  AgentId,
  AgentRun,
  PlannerKind,
  PlannerStatus,
  WorkspaceState,
} from "../lib/types";
import {
  Callout,
  Disclosure,
  Empty,
  Hash,
  Skeleton,
  Stat,
  StatRow,
  StateLabel,
  Tag,
} from "./ui";

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
    label: "Replay — repeat a run the AI made earlier",
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

/**
 * A fact inside a card or a side rail: label above value, never beside it.
 *
 * The shared two-column `datalist` needs roughly 420px before its value column
 * reads as a sentence. Every card on this page is half of the middle rail — about
 * 285px of content — so the side-by-side form wrapped values two words to a line
 * and broke fingerprints mid-token. Same information, stacked, at full width.
 */
function CardFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="micro">{label}</p>
      <div className="ag-card-job">{children}</div>
    </div>
  );
}

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
  /**
   * Loading and absence are different things. Until the first response lands the
   * cards are skeletons; only a request that came back empty earns an empty state.
   */
  const [settled, setSettled] = useState(false);
  const [reloads, setReloads] = useState(0);

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
      setSettled(true);
    });
    return () => { live = false; };
  }, [state.agent_runs.length, state.builds.length, reloads]);

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
  const findingCount = state.agent_runs.reduce((sum, run) => sum + run.findings.length, 0);
  const verifiedCount = state.agent_runs.filter((run) => run.chain_verified).length;
  const runCount = state.agent_runs.length;
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
        <h1 className="page-title">AI assistants</h1>
        <p className="lede">
          These assistants can only read. They raise problems; they cannot edit, date,
          or approve anything. Every step is recorded.
        </p>
      </section>

      {challenges?.blocking && (
        <Callout tone="review" title="A challenge stands. This compliance record cannot be published until you rule on it.">
          <ul className="stack-s">
            {challenges.landed.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p>
            The Challenger cannot resolve this itself and cannot edit what it challenged.
            A compliance officer has to rule on it before the check can finish.
          </p>
        </Callout>
      )}

      {/* ---- Health strip: four recorded counts, one figure each ---------
          Four figures, one datum each, above the fold — the prose sentence this
          replaced packed all four into a line nobody could scan. -------------- */}
      <div className="stack-s">
        <StatRow>
          <Stat
            size="s"
            value={runsById.size}
            label="Assistants run"
            context={catalogue ? `of ${catalogue.length}` : undefined}
          />
          <Stat size="s" value={findingCount} label="Findings raised" />
          <Stat
            size="s"
            value={verifiedCount}
            label="Records still check out"
            context={`of ${runCount} recorded ${runCount === 1 ? "run" : "runs"}`}
            tone={runCount === 0 ? undefined : verifiedCount === runCount ? "ok" : "fail"}
          />
          <Stat
            size="s"
            value={challenges ? challenges.landed.length : "—"}
            label="Challenges landed"
            context={challenges ? undefined : "not loaded yet"}
            tone={challenges && challenges.landed.length > 0 ? "review" : undefined}
          />
        </StatRow>
        <p className="micro">Every figure counts recorded runs only. Nothing is estimated.</p>
      </div>

      <div className="ag-shell">
        {/* ---- Real sections only: the invented nav is not ported --------- */}
        <aside className="ag-side" aria-label="Assistant sections">
          {([
            ["#ag-cards", "Assistants"],
            ["#ag-terminal", "Watch them work"],
            ["#ag-plan", "Who plans the steps"],
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
            Run all four assistants
          </button>
          <button
            type="button"
            className="btn btn--quiet btn--small"
            disabled={busy || state.agent_runs.length === 0}
            onClick={() => {
              if (window.confirm("Reset the whole demo? This deletes uploaded documents, checks and approvals.")) {
                void onRun(regosApi.reset);
              }
            }}
          >
            Reset the whole demo
          </button>
          <p className="micro">Deletes uploaded documents, checks and approvals.</p>
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
          {/* ---- Four cards, all visible ---------------------------------- */}
          {!settled && (
            <div className="ag-cards" id="ag-cards" aria-busy="true">
              {["a", "b", "c", "d"].map((key) => (
                <article className="ag-card" key={key}>
                  <Skeleton kind="row" />
                  <Skeleton kind="lines" lines={2} />
                </article>
              ))}
            </div>
          )}
          {settled && (catalogue === null || catalogue.length === 0) && (
            <div id="ag-cards">
              <Empty
                title="The list of assistants could not be loaded"
                hint="Nothing is claimed about an assistant until it has run, so no figures are shown for one that is not listed."
                action={
                  <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    onClick={() => setReloads((count) => count + 1)}
                  >
                    Try again
                  </button>
                }
              />
            </div>
          )}
          {settled && catalogue !== null && catalogue.length > 0 && (
          <div className="ag-cards" id="ag-cards">
            {catalogue.map((entry) => {
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
                  <p className="ag-card-job">{visual?.job ?? labelOf(entry.autonomy)}</p>
                  {run && <StepTicks run={run} />}
                  <button
                    type="button"
                    className="btn btn--primary ag-card-run"
                    disabled={busy}
                    onClick={() => void runOne(entry.id)}
                  >
                    {run ? "Run again" : "Run assistant"}
                  </button>
                  <Disclosure summary="What it does, and every step it took">
                    <div className="stack-s">
                      <CardFact label="Reads">{plainPhrase(entry.reads)}</CardFact>
                      <CardFact label="Proposes">{plainPhrase(entry.proposes)}</CardFact>
                      <CardFact label="Never does">{plainPhrase(entry.never_does)}</CardFact>
                      <CardFact label="Blocked when">{plainPhrase(entry.gated_by)}</CardFact>
                    </div>
                    <div className="agent-tools">
                      {entry.tools.map((tool) => (
                        <span className="agent-tool-chip mono" key={tool} title={tool}>
                          {toolPlainOf(tool) ?? tool}
                        </span>
                      ))}
                    </div>
                    {run ? (
                      <RunDetail run={run} />
                    ) : (
                      <p className="empty">
                        Not run yet. Nothing is claimed about this assistant until it has run
                        and every step is recorded.
                      </p>
                    )}
                  </Disclosure>
                </article>
              );
            })}
          </div>
          )}
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
            <p className="sub-title">Who plans the steps</p>
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
              <div className="stack-s">
                <CardFact label="Live model">
                  {planner.model_available
                    ? <span className="mono">{planner.model_id}</span>
                    : planner.offline
                      ? "Offline. Nothing here goes out to the internet."
                      : "No AI model is connected here. Runs use the scripted sequence instead."}
                </CardFact>
                <CardFact label="Recorded runs">
                  {planner.recorded_available.length > 0
                    ? planner.recorded_available.map(agentNameOf).join(", ")
                    : "None recorded yet."}
                </CardFact>
              </div>
            )}
            {modelUnavailable && (
              <p className="meta">
                A live model is not reachable — runs use the scripted sequence instead,
                and the record says which one actually ran.
              </p>
            )}
            {noRecording && (
              <p className="meta">
                No recording exists yet. Runs will use the scripted sequence instead, and
                the record will say so.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Step ticks — one tick per recorded step, all the same height.
 *
 * The height of a tick used to come from a CSS `nth-child` rule, which meant it
 * encoded nothing at all. Every channel here now maps to a recorded value: one
 * tick per step, and the only variable is the colour of that step's own status,
 * which the caption and the tooltip also say in words.
 * ---------------------------------------------------------------------- */

const TICK_HEIGHT = 10;

function StepTicks({ run }: { run: AgentRun }) {
  const completed = run.steps.filter((step) => step.status === "OK").length;
  const stopped = run.steps.length - completed;

  if (run.steps.length === 0) return null;

  return (
    <div className="stack-s">
      <span
        className="agent-spark"
        role="img"
        aria-label={`${run.steps.length} recorded steps: ${completed} completed, ${stopped} stopped`}
        style={{ height: TICK_HEIGHT }}
      >
        {run.steps.map((step) => (
          <i
            key={step.step_sha256}
            title={`Step ${step.index + 1} — ${labelOf(step.status)}`}
            style={{
              height: TICK_HEIGHT,
              opacity: 1,
              background: step.status === "OK" ? "var(--ok)" : "var(--review)",
            }}
          />
        ))}
      </span>
      <p className="micro">
        One tick per recorded step — {completed} of {run.steps.length} completed
        {stopped > 0 && `, ${stopped} stopped`}.
      </p>
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
      <StatRow>
        <Stat size="s" value={<StateLabel value={run.planner} />} label="Planned by" />
        <Stat size="s" value={run.tool_call_count} label="Look-ups made" />
        <Stat size="s" value={run.findings.length} label="Findings" />
        <Stat size="s" value={forReview} label="Need a person" />
      </StatRow>

      {run.planner_note && (
        <Callout tone="neutral" title="The steps were not planned the way you asked.">
          <p>{run.planner_note}</p>
          <p>
            The findings are unaffected: they are produced by the same fixed rules
            whichever way the steps were chosen. All that changed is who chose their order.
          </p>
        </Callout>
      )}

      <div className="stack-s">
        <CardFact label="Goal">{run.goal}</CardFact>
        <CardFact label="Read">
          {run.anchor_filename
            ? <>Your uploaded document <span className="strong-ink">{run.anchor_filename}</span></>
            : "The reviewed demo SEBI documents"}
        </CardFact>
        {run.model_id && (
          <CardFact label="Model">
            <span className="mono">{run.model_id}</span>
            {run.prompt_version && <span className="meta"> · {run.prompt_version}</span>}
          </CardFact>
        )}
        <CardFact label="Tamper check">
          <StateLabel value={run.chain_verified ? "PASS" : "FAIL"} />
          <span className="meta">
            {run.chain_verified
              ? " Every step's fingerprint was recalculated and still matches. If anyone had edited a step afterwards, this would say so."
              : " The recorded fingerprints no longer match. Treat these steps as unreliable."}
          </span>
        </CardFact>
        <CardFact label="Final fingerprint"><Hash value={run.chain_head_sha256} /></CardFact>
        <CardFact label="Completed">{formatTimestamp(run.completed_at)}</CardFact>
        <CardFact label="Limitation">{plainPhrase(run.limitation)}</CardFact>
      </div>

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
                  <strong>Fixed rule applied:</strong> {finding.gate_reason}
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
      <Disclosure summary={`Every step this run took (${run.steps.length})`}>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col" className="table-num">#</th>
                <th scope="col">Used</th>
                <th scope="col">Asked for</th>
                <th scope="col">Came back</th>
                <th scope="col">Outcome</th>
                <th scope="col">Step fingerprint</th>
              </tr>
            </thead>
            <tbody>
              {run.steps.map((step) => (
                <tr key={step.step_sha256}>
                  <td className="table-num">{step.index + 1}</td>
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
        </p>
      </Disclosure>
    </div>
  );
}
