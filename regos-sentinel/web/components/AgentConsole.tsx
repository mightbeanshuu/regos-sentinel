"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiOrigin } from "../lib/api";
import type { AgentId, PlannerKind } from "../lib/types";

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

const AGENT_NAMES: Record<AgentId, string> = {
  REFERENCE_RESOLVER: "reference-resolver",
  SOURCE_SCOUT: "source-scout",
  ADVERSARY: "adversary",
  EXTRACTOR: "extractor",
};

function clockOf(): string {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

export function AgentConsole({
  agents,
  planner,
  busy,
  onFinished,
}: {
  agents: AgentId[];
  planner: PlannerKind;
  busy: boolean;
  onFinished: () => void;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState<AgentId | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
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
      push("meta", `$ regos agents run ${AGENT_NAMES[agent]} --planner ${planner}`);

      const source = new EventSource(
        `${apiOrigin}/api/v1/agents/${agent}/stream?planner=${planner}`,
        { withCredentials: true },
      );
      sourceRef.current = source;

      source.addEventListener("planner", (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        push("meta", `planner: ${data.planner}`);
        push("meta", `goal:    ${data.goal}`);
        push("meta", `tools:   ${(data.tools as string[]).join(", ")}`);
      });

      source.addEventListener("thinking", () => {
        push("meta", "… asking the model which tool to call next");
      });

      source.addEventListener("call", (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        const args = Object.keys(data.input ?? {}).length
          ? JSON.stringify(data.input)
          : "";
        push("call", `→ ${data.tool}(${args})`);
        if (data.rationale) push("meta", `   why: ${data.rationale}`);
      });

      source.addEventListener("result", (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        const kind: LineKind = data.status === "OK" ? "result" : "error";
        push(kind, `← ${data.status}  ${data.summary}`);
        push("meta", `   step ${String(data.step_sha256).slice(0, 16)}…`);
      });

      source.addEventListener("stopped", (event) => {
        push("meta", JSON.parse((event as MessageEvent).data).message);
      });

      source.addEventListener("gate", () => {
        push("meta", "── applying the gates ──────────────────");
      });

      source.addEventListener("finding", (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        const mark = data.accepted ? "✓" : "✕";
        push(data.requires_human_review ? "review" : "finding", `${mark} ${data.summary}`);
        push("meta", `   gate: ${data.gate_reason}`);
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
          push("error", "! the connection to the API dropped");
          setRunning(null);
          source.close();
        }
      });

      source.addEventListener("done", () => {
        push("done", "done.");
        setRunning(null);
        source.close();
        onFinished();
      });
    },
    [planner, push, onFinished],
  );

  return (
    <div className="console">
      <div className="console-bar">
        <span className="console-dots" aria-hidden="true">
          <span /><span /><span />
        </span>
        <span className="console-title">regos — live agent run</span>
        {running && (
          <span className="console-live">running {AGENT_NAMES[running]}</span>
        )}
      </div>

      <div className="console-body" ref={bodyRef} role="log" aria-live="polite">
        {lines.length === 0 ? (
          <p className="console-empty">
            Nothing has run yet. Start an agent below and every tool call it makes will
            appear here as it happens.
          </p>
        ) : (
          lines.map((line) => (
            <span className={`console-line console-line--${line.kind}`} key={line.id}>
              <span className="console-time">{line.time}</span>
              {line.text}
            </span>
          ))
        )}
      </div>

      <div className="console-bar" style={{ borderTop: "1px solid oklch(1 0 0 / 0.08)", borderBottom: "none" }}>
        <div className="btn-row" style={{ margin: 0, flexWrap: "wrap" }}>
          {agents.map((agent) => (
            <button
              key={agent}
              type="button"
              className="btn btn--quiet btn--small"
              disabled={busy || running !== null}
              onClick={() => run(agent)}
            >
              Watch {AGENT_NAMES[agent]}
            </button>
          ))}
          <button
            type="button"
            className="btn btn--quiet btn--small"
            disabled={lines.length === 0 || running !== null}
            onClick={() => setLines([])}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
