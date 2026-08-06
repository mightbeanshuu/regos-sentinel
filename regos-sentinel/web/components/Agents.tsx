"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useReducedMotion } from "motion/react";

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
  AgentFinding,
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
 *
 * This choice lives inside `Technical details`. A compliance officer reading a finding
 * does not have to know who ordered the look-ups to know what was found; an evaluator
 * who wants to change it is one disclosure away.
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
    job: "Checks that every ‘see Table 19’ really points at Table 19.",
    tone: "ok",
  },
  SOURCE_SCOUT: {
    job: "Spots when SEBI’s wording quietly moves.",
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
 * reads as a sentence. Cards on this page are half of a two-column grid, so the
 * side-by-side form wrapped values two words to a line and broke fingerprints
 * mid-token. Same information, stacked, at full width.
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

/** Every distinct passage a run actually cited. Empty when a run cited nothing. */
function sourcesOf(run: AgentRun): Array<{ id: string; locator: string; url: string }> {
  const seen = new Map<string, { id: string; locator: string; url: string }>();
  for (const finding of run.findings) {
    for (const citation of finding.citations) {
      if (!seen.has(citation.span_id)) {
        seen.set(citation.span_id, {
          id: citation.span_id,
          locator: citation.locator,
          url: citation.source_url,
        });
      }
    }
  }
  return Array.from(seen.values());
}

function readingOf(run: AgentRun): ReactNode {
  return run.anchor_filename ? (
    <>Your uploaded document <span className="strong-ink">{run.anchor_filename}</span></>
  ) : (
    "The reviewed demo SEBI documents"
  );
}

/** One thin line, drawn once, from a check's card to the finding it produced. */
interface Trace {
  agent: AgentId;
  findingId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
}

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

  /** The page's single lead action: run every check on the reviewed demo documents. */
  const runExample = useCallback(
    () => onRun(() => regosApi.runAllAgents(source)),
    [onRun, source],
  );

  /**
   * A streamed run writes to the workspace on its own connection, so when it finishes
   * this page is holding state from before it started. Refetching is the whole fix.
   */
  const refresh = useCallback(() => { void onRun(regosApi.workspace); }, [onRun]);

  const runsById = new Map(state.agent_runs.map((item) => [item.agent_id, item]));
  const runCount = state.agent_runs.length;
  // Newest completion first. One run is kept per assistant, so this is at most four.
  const orderedRuns = [...state.agent_runs].sort((a, b) =>
    a.completed_at < b.completed_at ? 1 : a.completed_at > b.completed_at ? -1 : 0,
  );
  const latestRun = orderedRuns[0] ?? null;
  const findingRows = orderedRuns.flatMap((run) =>
    run.findings.map((finding) => ({ run, finding })),
  );
  const findingCount = findingRows.length;
  const awaitingPerson = findingRows.filter(
    (row) => row.finding.requires_human_review,
  ).length;
  const verifiedCount = state.agent_runs.filter((run) => run.chain_verified).length;
  const modelUnavailable = source === "MODEL_PLANNED" && planner?.model_available === false;
  const noRecording =
    source === "RECORDED_MODEL_TRACE" && planner?.recorded_available.length === 0;

  // The live console is a technical view. It is driven from inside `Technical details`.
  const consoleRef = useRef<AgentConsoleHandle | null>(null);
  const agentOrder = catalogue?.map((entry) => entry.id) ?? [];
  const notYetRun = agentOrder.filter((id) => !runsById.has(id)).length;

  /* ---- One thin line, user-triggered, never looping --------------------- */
  const reducedMotion = Boolean(useReducedMotion());
  const pageRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const findingRefs = useRef<Record<string, HTMLElement | null>>({});
  const traceTarget = useRef<{ agent: AgentId; findingId: string } | null>(null);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [drawKey, setDrawKey] = useState(0);

  const measure = useCallback((agent: AgentId, findingId: string): Trace | null => {
    const page = pageRef.current;
    const card = cardRefs.current[agent];
    const target = findingRefs.current[findingId];
    if (!page || !card || !target) return null;
    const base = page.getBoundingClientRect();
    const from = card.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const x1 = from.left - base.left + Math.min(30, from.width / 2);
    const y1 = from.top - base.top;
    const x2 = to.left - base.left + Math.min(30, to.width / 2);
    const y2 = to.bottom - base.top;
    return { agent, findingId, x1, y1, x2, y2, length: Math.hypot(x2 - x1, y2 - y1) };
  }, []);

  const recompute = useCallback(() => {
    const target = traceTarget.current;
    if (!target) {
      setTrace(null);
      return;
    }
    const next = measure(target.agent, target.findingId);
    if (!next) traceTarget.current = null;
    setTrace(next);
  }, [measure]);

  useEffect(() => {
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [recompute]);

  // Content moved (a run landed, a disclosure opened): re-anchor rather than lie.
  useEffect(() => { recompute(); }, [findingCount, runCount, settled, recompute]);

  const toggleTrace = useCallback(
    (agent: AgentId, findingId: string) => {
      if (traceTarget.current?.agent === agent) {
        traceTarget.current = null;
        setTrace(null);
        return;
      }
      traceTarget.current = { agent, findingId };
      const next = measure(agent, findingId);
      if (!next) {
        traceTarget.current = null;
        return;
      }
      setTrace(next);
      setDrawKey((count) => count + 1);
      findingRefs.current[findingId]?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "nearest",
      });
    },
    [measure, reducedMotion],
  );

  return (
    <div className="stack-l axc-page" ref={pageRef}>
      <section className="stack-s">
        <h1 className="page-title">AI assistants</h1>
        <p className="lede">Read-only checks that support your review.</p>
        <p className="meta">
          They raise problems; they cannot edit, date, or approve anything. Every step
          is recorded.
        </p>
      </section>

      {/* ---- The promise, as a pipeline. Not navigation. ------------------ */}
      <div className="ag-pipeline" aria-label="How the assistants are allowed to work">
        {["Assistants read", "Fixed rules decide", "You approve"].map((step, index) => (
          <span className="ag-node" key={step}>
            <span className={`ag-node-dot${index === 0 ? " ag-node-dot--live" : ""}`} aria-hidden="true" />
            <span className="ag-node-word">{step}</span>
            {index < 2 && <span className="ag-node-arrow" aria-hidden="true">→</span>}
          </span>
        ))}
      </div>

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

      {/* ---- Lead: the result, if one exists ----------------------------- */}
      {runCount === 0 ? (
        <section className="panel axc-lead">
          <div className="panel-body stack-s">
            <h2 className="section-title">No check has run yet</h2>
            <p className="lede">
              Nothing is claimed about an assistant until it has run. Run the four checks
              against the reviewed demo SEBI documents and the findings appear here.
            </p>
            <div>
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy || agentOrder.length === 0}
                onClick={() => void runExample()}
              >
                {busy ? "Running the checks…" : "Run this example"}
              </button>
            </div>
            <p className="micro">
              Runs all four checks against the reviewed demo SEBI documents. Nothing is
              edited, dated, filed, or approved.
            </p>
          </div>
        </section>
      ) : (
        <section className="panel axc-lead" id="ag-result">
          <div className="panel-head">
            <div className="stack-s" style={{ minWidth: 0 }}>
              <h2 className="section-title">What the checks found</h2>
              {latestRun && (
                <p className="lede">
                  Most recent: the {agentNameOf(latestRun.agent_id).toLowerCase()},{" "}
                  {formatTimestamp(latestRun.completed_at)}.
                </p>
              )}
            </div>
            <button
              type="button"
              className="btn btn--secondary btn--small"
              disabled={busy || agentOrder.length === 0}
              onClick={() => void runExample()}
            >
              {notYetRun > 0
                ? `Run the remaining ${notYetRun} ${notYetRun === 1 ? "check" : "checks"}`
                : "Run all four again"}
            </button>
          </div>
          <div className="panel-body stack">
            {findingCount === 0 ? (
              <p className="empty">
                The recorded runs raised nothing. That is evidence that nothing was found,
                not proof that there is nothing to find.
              </p>
            ) : (
              findingRows.map(({ run, finding }) => (
                <FindingRow
                  key={finding.id}
                  run={run}
                  finding={finding}
                  traced={trace?.findingId === finding.id}
                  register={(node) => { findingRefs.current[finding.id] = node; }}
                />
              ))
            )}
          </div>
        </section>
      )}

      {/* ---- Recorded counts. Only after something has actually run. ------ */}
      {runCount > 0 && (
        <div className="stack-s">
          <StatRow>
            <Stat
              size="s"
              value={runCount}
              label="Checks run"
              context={catalogue ? `of ${catalogue.length}` : undefined}
            />
            <Stat size="s" value={findingCount} label="Findings raised" />
            <Stat
              size="s"
              value={awaitingPerson}
              label="Waiting on a person"
              tone={awaitingPerson > 0 ? "review" : undefined}
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
      )}

      {/* ---- The four checks --------------------------------------------- */}
      <section className="stack-s" id="ag-cards">
        <h2 className="section-title">
          {runCount === 0 ? "The four checks available" : "The four checks"}
        </h2>

        {!settled && (
          <div className="ag-cards" aria-busy="true">
            {["a", "b", "c", "d"].map((key) => (
              <article className="ag-card" key={key}>
                <Skeleton kind="row" />
                <Skeleton kind="lines" lines={2} />
              </article>
            ))}
          </div>
        )}

        {settled && (catalogue === null || catalogue.length === 0) && (
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
        )}

        {settled && catalogue !== null && catalogue.length > 0 && (
          <div className="ag-cards">
            {catalogue.map((entry) => (
              <CheckCard
                key={entry.id}
                entry={entry}
                run={runsById.get(entry.id) ?? null}
                busy={busy}
                traced={trace?.agent === entry.id}
                onRunOne={() => void runOne(entry.id)}
                onTrace={toggleTrace}
                register={(node) => { cardRefs.current[entry.id] = node; }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---- Everything technical, in one place --------------------------- */}
      <Disclosure summary="Technical details — who planned the steps, the live log, and the model">
        <div className="stack axc-tech">
          <p className="meta">
            Nothing here changes what a check found. The findings above are produced by
            fixed rules whichever way the look-ups were ordered.
          </p>

          <section className="stack-s">
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
                <CardFact label="Recorded runs available for replay">
                  {planner.recorded_available.length > 0
                    ? planner.recorded_available.map(agentNameOf).join(", ")
                    : "None recorded yet."}
                </CardFact>
                {runCount > 0 && (
                  <CardFact label="Tamper check across recorded runs">
                    <StateLabel value={verifiedCount === runCount ? "PASS" : "FAIL"} />
                    <span className="meta">
                      {" "}{verifiedCount} of {runCount} recorded {runCount === 1 ? "run" : "runs"}{" "}
                      still recalculate to the fingerprints they were recorded with.
                    </span>
                  </CardFact>
                )}
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

          <section className="stack-s" id="ag-terminal">
            <p className="sub-title">Watch a run, step by step</p>
            <AgentConsole
              agents={agentOrder}
              planner={source}
              busy={busy}
              onFinished={refresh}
              controlRef={consoleRef}
              controls="run-all"
            />
          </section>
        </div>
      </Disclosure>

      {/* ---- One thin line, drawn once, on request ------------------------ */}
      {trace && (
        <svg className="axc-trace" aria-hidden="true" focusable="false">
          <line
            key={drawKey}
            className={`axc-trace-line${reducedMotion ? "" : " axc-trace-line--draw"}`}
            x1={trace.x1}
            y1={trace.y1}
            x2={trace.x2}
            y2={trace.y2}
            style={{ "--axc-len": trace.length } as CSSProperties}
          />
          <circle className="axc-trace-dot" cx={trace.x2} cy={trace.y2} r={3.5} />
        </svg>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * A finding, as the reader meets it: verdict, what it says, which fixed rule
 * decided that, the passage it rests on, and what a person now has to do.
 * ---------------------------------------------------------------------- */

function FindingRow({
  run,
  finding,
  traced,
  register,
}: {
  run: AgentRun;
  finding: AgentFinding;
  traced: boolean;
  register: (node: HTMLDivElement | null) => void;
}) {
  const plainSummary = glossFor(finding.summary) ?? plainPhrase(finding.summary);
  const hasTechnicalCode = plainSummary !== finding.summary;

  return (
    <div
      className={`outcome axc-finding${traced ? " axc-finding--traced" : ""}`}
      ref={register}
    >
      <p className="outcome-title">
        <StateLabel value={finding.kind} showHint />
      </p>
      <div className="outcome-body">
        <p><strong className="strong-ink">{plainSummary}</strong></p>
        <p>{plainPhrase(finding.detail)}</p>
        <p className="outcome-why">
          <strong>Fixed safety rule:</strong> {plainPhrase(finding.gate_reason)}
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
        {hasTechnicalCode && (
          <Disclosure summary="Technical finding code">
            <p className="mono">{finding.summary}</p>
          </Disclosure>
        )}
        <p className="axc-finding-foot">
          <span className="micro">
            Raised by the {agentNameOf(run.agent_id).toLowerCase()}
          </span>
          <span className="micro">
            {finding.requires_human_review
              ? "A compliance officer has to rule on this."
              : "No action is requested from a person."}
          </span>
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * One check. Its default detail is the result, the sources it read, and the
 * follow-up it produced. Planner, fingerprints and the step-by-step trace are
 * one disclosure below — reachable, not first.
 * ---------------------------------------------------------------------- */

function CheckCard({
  entry,
  run,
  busy,
  traced,
  onRunOne,
  onTrace,
  register,
}: {
  entry: AgentCatalogueEntry;
  run: AgentRun | null;
  busy: boolean;
  traced: boolean;
  onRunOne: () => void;
  onTrace: (agent: AgentId, findingId: string) => void;
  register: (node: HTMLElement | null) => void;
}) {
  const visual = AGENT_VISUAL[entry.id];
  const sources = run ? sourcesOf(run) : [];
  const needsPerson = run
    ? run.findings.filter((finding) => finding.requires_human_review).length
    : 0;
  const firstFinding = run?.findings[0] ?? null;

  return (
    <article className={`ag-card${traced ? " axc-card--traced" : ""}`} ref={register}>
      <div className="ag-card-top">
        <span className={`ag-avatar ag-avatar--${visual?.tone ?? "royal"}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round">
            <path d={AGENT_GLYPH[entry.id]} />
          </svg>
        </span>
        <span className={`ag-status${run ? " ag-status--ran" : ""}`}>
          <span className="ag-status-dot" aria-hidden="true" />
          {run
            ? `${run.findings.length} ${run.findings.length === 1 ? "finding" : "findings"}`
            : "Not run yet"}
        </span>
      </div>
      <h3 className="ag-card-name">{agentNameOf(entry.id)}</h3>
      <p className="ag-card-job">{visual?.job ?? labelOf(entry.autonomy)}</p>

      {run ? (
        <div className="stack-s axc-card-result">
          <div>
            <p className="micro">What it found</p>
            {run.findings.length === 0 ? (
              <p className="ag-card-job">Nothing to report from this run.</p>
            ) : (
              <ul className="axc-verdicts">
                {run.findings.map((finding) => (
                  <li key={finding.id}><StateLabel value={finding.kind} /></li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="micro">Sources it checked</p>
            <p className="ag-card-job">{readingOf(run)}</p>
            {sources.length > 0 && (
              <ul className="axc-sources">
                {sources.map((item) => (
                  <li key={item.id}>
                    <a
                      className="proof-link"
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.locator} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="micro">Human follow-up it produced</p>
            <p className="ag-card-job">
              {needsPerson > 0
                ? `${needsPerson} ${needsPerson === 1 ? "finding is" : "findings are"} waiting on a compliance officer.`
                : "None. Nothing from this run needs a person."}
            </p>
          </div>
        </div>
      ) : (
        <p className="ag-card-job">
          Not run yet. Nothing is claimed about this check until it has run and every
          step is recorded.
        </p>
      )}

      <div className="axc-card-actions">
        <button
          type="button"
          className="btn btn--primary ag-card-run"
          disabled={busy}
          onClick={onRunOne}
        >
          {run ? "Run again" : "Run this check"}
        </button>
        {firstFinding && (
          <button
            type="button"
            className="btn btn--quiet btn--small"
            aria-pressed={traced}
            onClick={() => onTrace(entry.id, firstFinding.id)}
          >
            {traced ? "Hide the link" : "Show what it found"}
          </button>
        )}
      </div>

      <Disclosure summary="What this check may and may not do">
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
      </Disclosure>

      {run && (
        <Disclosure summary="Technical details — planner, fingerprints and every step">
          <RunDetail run={run} />
        </Disclosure>
      )}
    </article>
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
 * One run's mechanics: who ordered the look-ups, what was read, whether the
 * chain still verifies, and the chain of calls itself. The findings this run
 * produced are shown once, above, where the reader meets them first.
 * ---------------------------------------------------------------------- */

function RunDetail({ run }: { run: AgentRun }) {
  return (
    <div className="stack">
      <StatRow>
        <Stat size="s" value={<StateLabel value={run.planner} />} label="Planned by" />
        <Stat size="s" value={run.tool_call_count} label="Look-ups made" />
        <Stat size="s" value={run.steps.length} label="Steps recorded" />
        <Stat size="s" value={run.findings.length} label="Findings" />
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

      <StepTicks run={run} />

      <div className="stack-s">
        <CardFact label="Goal">{run.goal}</CardFact>
        <CardFact label="Read">{readingOf(run)}</CardFact>
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
