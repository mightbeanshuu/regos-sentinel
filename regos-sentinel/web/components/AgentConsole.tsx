"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";

import { apiOrigin } from "../lib/api";
import { agentNameOf, glossFor, labelOf, toolPlainOf } from "../lib/presentation";
import type { AgentId, PlannerKind } from "../lib/types";

/** Imperative handle so the Run-all buttons drive this console directly. */
export interface AgentConsoleHandle {
  runSequence: (agents: AgentId[]) => void;
}

/**
 * A live view of an agent working.
 *
 * The rest of this product shows conclusions. This shows the work: each tool call as
 * it is made, what came back, and the fingerprint of the step. It exists because
 * "an AI checked it" is a claim, and a compliance officer is entitled to watch the
 * claim being earned rather than take delivery of it.
 *
 * The stream is read-only by construction — it is the same run as the ordinary
 * endpoint, observed. Closing this panel does not stop the agent, and nothing typed
 * here can reach it, because there is nothing to type.
 */

type LineKind = "call" | "result" | "error" | "finding" | "review" | "meta" | "done";

interface Line {
  id: number;
  kind: LineKind;
  time: string;
  text: string;
}

/**
 * The console shows the machine's own vocabulary — that is what a console is for, and
 * a compliance officer watching one expects to see the machinery. But a verdict like
 * `PERIOD_WITHOUT_TRIGGER` is the single most important thing this product ever says,
 * and shouting it in an enum wastes it. Tool names and verdicts get a plain gloss on
 * the line beneath; everything else is left exactly as the system recorded it.
 */
function consoleNameOf(agent: AgentId): string {
  return agentNameOf(agent).toLowerCase().replaceAll(" ", "-");
}

function clockOf(): string {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

export function AgentConsole({
  agents,
  planner,
  busy,
  onFinished,
  controlRef,
  controls = "per-agent",
}: {
  agents: AgentId[];
  planner: PlannerKind;
  busy: boolean;
  onFinished: () => void;
  controlRef?: MutableRefObject<AgentConsoleHandle | null>;
  /**
   * `per-agent` gives one button per assistant — the original footer, still used
   * where this console is the only place a run can be started.
   *
   * `run-all` gives a single control. The assistants page uses it because each
   * assistant already has its own run button on its own card, and four more
   * "watch the …" buttons down here were the same choice asked twice.
   */
  controls?: "per-agent" | "run-all";
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState<AgentId | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const queueRef = useRef<AgentId[]>([]);
  const counter = useRef(0);

  const push = useCallback((kind: LineKind, text: string) => {
    // The id is taken here, not inside the updater. Reading the counter inside would
    // make the updater impure: React may re-run it, and two lines pushed in the same
    // batch would then read the same value and collide on their keys.
    const id = (counter.current += 1);
    const time = clockOf();
    setLines((current) => {
      const next = [...current, { id, kind, time, text }];
      // A console that grows without bound eventually janks the tab. Keep the tail.
      return next.length > 400 ? next.slice(-400) : next;
    });
  }, []);

  // Follow the tail unless the reader has scrolled up to read something.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const atBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 80;
    if (atBottom) body.scrollTop = body.scrollHeight;
  }, [lines]);

  useEffect(() => () => sourceRef.current?.close(), []);

  const run = useCallback(
    (agent: AgentId) => {
      sourceRef.current?.close();
      setRunning(agent);
      setAnnouncement(`${agentNameOf(agent)} run started.`);
      push("meta", `$ regos agents run ${consoleNameOf(agent)} --planner ${planner}`);

      const source = new EventSource(
        `${apiOrigin}/api/v1/agents/${agent}/stream?planner=${planner}`,
        { withCredentials: true },
      );
      sourceRef.current = source;

      source.addEventListener("planner", (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        push("meta", `planner: ${data.planner}`);
        push("meta", `   ${labelOf(String(data.planner))}`);
        push("meta", `goal:    ${data.goal}`);
        push("meta", `tools:   ${(data.tools as string[]).join(", ")}`);
      });

      source.addEventListener("thinking", () => {
        push("meta", "… asking the AI what to look at next");
      });

      source.addEventListener("call", (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        const args = Object.keys(data.input ?? {}).length
          ? JSON.stringify(data.input)
          : "";
        push("call", `→ ${data.tool}(${args})`);
        const plain = toolPlainOf(String(data.tool));
        if (plain) push("meta", `   ${plain}`);
      });

      source.addEventListener("result", (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        const kind: LineKind = data.status === "OK" ? "result" : "error";
        const summary = String(data.summary ?? "");
        push(kind, `← ${data.status}  ${summary}`);
        const gloss = glossFor(summary);
        if (gloss) push("meta", `   → ${gloss}`);
        push("meta", `   step ${String(data.step_sha256).slice(0, 16)}…`);
      });

      source.addEventListener("stopped", (event) => {
        push("meta", JSON.parse((event as MessageEvent).data).message);
      });

      source.addEventListener("gate", () => {
        push("meta", "── now the fixed rules decide what this means ──");
      });

      source.addEventListener("finding", (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        const mark = data.accepted ? "✓" : "✕";
        const summary = String(data.summary ?? "");
        push(data.requires_human_review ? "review" : "finding", `${mark} ${summary}`);
        const gloss = glossFor(summary);
        if (gloss) push("meta", `   → ${gloss}`);
        push("meta", `   rule: ${data.gate_reason}`);
      });

      source.addEventListener("error", (event) => {
        // Two different errors arrive on this name: one the server sent, and the
        // browser's own when the stream drops. Only the first has a payload.
        const raw = (event as MessageEvent).data;
        if (raw) {
          push("error", `! ${JSON.parse(raw).message}`);
          return;
        }
        if (source.readyState === EventSource.CLOSED) {
          push("error", "! The connection to the RegOS server dropped, so this run stopped. Press Watch again to retry.");
          queueRef.current = [];
          setRunning(null);
          source.close();
        }
      });

      source.addEventListener("done", () => {
        push("done", "done.");
        setAnnouncement(`${agentNameOf(agent)} run finished.`);
        source.close();
        onFinished();
        const next = queueRef.current.shift();
        if (next) {
          run(next);
          return;
        }
        setRunning(null);
      });
    },
    [planner, push, onFinished],
  );

  // Run-all drives this console: each assistant streams in turn, every tool
  // call visible as it happens, and the terminal scrolls itself into view.
  const runSequence = useCallback(
    (sequence: AgentId[]) => {
      if (running !== null || sequence.length === 0) return;
      rootRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
      push("meta", `── running all ${sequence.length} assistants, one after another ──`);
      queueRef.current = sequence.slice(1);
      run(sequence[0]);
    },
    [running, push, run],
  );

  useEffect(() => {
    if (!controlRef) return;
    controlRef.current = { runSequence };
    return () => {
      controlRef.current = null;
    };
  }, [controlRef, runSequence]);

  return (
    <div className="console" ref={rootRef}>
      <div className="console-bar">
        <span className="console-dots" aria-hidden="true">
          <span /><span /><span />
        </span>
        <span className="console-title">RegOS — assistant running live</span>
        {running && (
          <span className="console-live">running {consoleNameOf(running)}</span>
        )}
      </div>

      <p className="visually-hidden" role="status" aria-live="polite">{announcement}</p>

      <div className="console-body" ref={bodyRef} role="log" aria-live="off">
        {lines.length === 0 ? (
          <p className="console-empty">
            Nothing has run yet. Start a run and every step it takes appears here as
            it happens.
          </p>
        ) : (
          lines.map((line) => (
            <span className={`console-line console-line--${line.kind}`} key={line.id}>
              <span className="console-time">{line.time}</span>
              {line.text}
            </span>
          ))
        )}
        {running !== null && (
          <span className="console-line console-line--meta" aria-hidden="true">
            <span className="console-time" />
            <span className="console-caret" />
          </span>
        )}
      </div>

      <div className="console-bar console-bar--foot">
        <div className="btn-row">
          {controls === "per-agent" &&
            agents.map((agent) => (
              <button
                key={agent}
                type="button"
                className="btn btn--quiet btn--small"
                disabled={busy || running !== null}
                onClick={() => run(agent)}
              >
                Watch the {agentNameOf(agent).toLowerCase()}
              </button>
            ))}
          {controls === "run-all" && (
            <button
              type="button"
              className="btn btn--quiet btn--small"
              disabled={busy || running !== null || agents.length === 0}
              onClick={() => runSequence(agents)}
            >
              Run all four here and watch every step
            </button>
          )}
          <button
            type="button"
            className="btn btn--quiet btn--small"
            disabled={lines.length === 0 || running !== null}
            onClick={() => setLines([])}
          >
            Clear this view
          </button>
        </div>
      </div>
    </div>
  );
}
