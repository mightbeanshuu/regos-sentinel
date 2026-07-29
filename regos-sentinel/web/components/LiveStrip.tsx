"use client";

import { useEffect, useRef, useState } from "react";

import { apiOrigin } from "../lib/api";
import { useChangeKey } from "../lib/liveness";
import type { PlannerStatus } from "../lib/types";

/**
 * The dashboard's connection to the engine, shown rather than implied.
 *
 * The API emits a bounded server-sent stream of pulses; each pulse carries a
 * fingerprint recomputed from the whole workspace. When the fingerprint moves this
 * component asks the page to refetch, so a change made anywhere — another tab, an
 * agent finishing, a scenario run — appears here within seconds without anyone
 * pressing refresh. When the stream is unreachable the page's ordinary polling still
 * runs; this strip then says so instead of pretending to be live, and the whole strip
 * visibly cools so live-versus-degraded reads from across a room.
 *
 * The ledger below it is a system log of what this page actually observed: stream
 * opened, workspace changed, stream lost. Every line corresponds to a real event —
 * there is no manufactured activity, because false liveness is worse than none.
 */

type Channel = "connecting" | "live" | "polling";

interface Pulse {
  digest: string;
  at: string;
  decisions_waiting: number;
  cci_score: number | null;
  cci_band: string | null;
}

interface LedgerEvent {
  id: number;
  time: string;
  text: string;
}

const LEDGER_LIMIT = 6;

function clock(): string {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

export function LiveStrip({ onChange }: { onChange: () => void }) {
  const [channel, setChannel] = useState<Channel>("connecting");
  const [planner, setPlanner] = useState<PlannerStatus | null>(null);
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [agoSeconds, setAgoSeconds] = useState<number | null>(null);
  const [ledger, setLedger] = useState<LedgerEvent[]>([]);
  const digestRef = useRef<string | null>(null);
  const lastAtRef = useRef<number | null>(null);
  const ledgerIdRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const fingerprintFlash = useChangeKey(pulse?.digest ?? null);

  const record = (text: string) => {
    const id = (ledgerIdRef.current += 1);
    const time = clock();
    setLedger((current) => [{ id, time, text }, ...current].slice(0, LEDGER_LIMIT));
  };

  // The "updated Ns ago" figure ticks locally; only the pulse resets it.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (lastAtRef.current !== null) {
        setAgoSeconds(Math.max(0, Math.round((Date.now() - lastAtRef.current) / 1000)));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let source: EventSource | null = null;
    let disposed = false;
    let wasLive = false;

    const connect = () => {
      if (disposed) return;
      source = new EventSource(`${apiOrigin}/api/v1/live`, { withCredentials: true });

      source.addEventListener("open", (event) => {
        setChannel("live");
        if (!wasLive) record("live stream open · engine reachable");
        wasLive = true;
        const raw = (event as MessageEvent).data;
        if (raw) setPlanner(JSON.parse(raw).planner as PlannerStatus);
      });

      source.addEventListener("pulse", (event) => {
        setChannel("live");
        const data = JSON.parse((event as MessageEvent).data) as Pulse;
        lastAtRef.current = Date.now();
        setAgoSeconds(0);
        setPulse(data);
        if (digestRef.current !== null && digestRef.current !== data.digest) {
          record(`workspace changed · fingerprint ${data.digest.slice(0, 8)}`);
          onChangeRef.current();
        }
        digestRef.current = data.digest;
      });

      // The server ends every stream on purpose; reconnect quietly for the next one.
      source.addEventListener("done", () => {
        source?.close();
        window.setTimeout(connect, 1500);
      });

      source.onerror = () => {
        if (source?.readyState === EventSource.CLOSED) {
          setChannel("polling");
          if (wasLive) record("stream lost · refreshing on a timer");
          wasLive = false;
          source.close();
          window.setTimeout(connect, 15_000);
        }
      };
    };

    connect();
    return () => {
      disposed = true;
      source?.close();
    };
  }, []);

  const mode = !planner
    ? null
    : planner.offline || !planner.model_available
      ? "Sealed engine — no model key, no outbound calls; recorded model traces replay"
      : `Live model available: ${planner.model_id}`;

  return (
    <div className="stack-s">
      <div
        className={`live-strip live-strip--${channel}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className={`live-dot live-dot--${channel}`} aria-hidden="true" />
        <span className="live-strip-state">
          {channel === "live"
            ? "Live"
            : channel === "polling"
              ? "Refreshing on a timer"
              : "Connecting"}
        </span>
        {channel === "live" && agoSeconds !== null && (
          <span className="live-strip-meta">
            updated {agoSeconds <= 1 ? "just now" : `${agoSeconds}s ago`}
          </span>
        )}
        {channel === "live" && pulse && (
          <span className="live-strip-meta" title="A fingerprint of the whole workspace, recomputed on every pulse. If it holds still, this page is still true.">
            fingerprint{" "}
            <span
              className={
                fingerprintFlash > 0 ? "live-strip-hash flash-change" : "live-strip-hash"
              }
              key={fingerprintFlash}
            >
              {pulse.digest.slice(0, 8)}
            </span>
          </span>
        )}
        {mode && <span className="live-strip-meta live-strip-mode">{mode}</span>}
      </div>

      {ledger.length > 0 && (
        <details className="live-ledger">
          <summary>Engine activity ({ledger.length})</summary>
          <ul className="live-ledger-body">
            {ledger.map((event) => (
              <li key={event.id}>
                {event.time} — {event.text}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
