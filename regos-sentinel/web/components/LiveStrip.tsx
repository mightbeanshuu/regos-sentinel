"use client";

import { useEffect, useRef, useState } from "react";

import { apiOrigin } from "../lib/api";
import type { PlannerStatus } from "../lib/types";

/**
 * The dashboard's connection to the engine, shown rather than implied.
 *
 * The API emits a bounded server-sent stream of pulses; each pulse carries a
 * fingerprint recomputed from the whole workspace. When the fingerprint moves this
 * component asks the page to refetch, so a change made anywhere — another tab, an
 * agent finishing, a scenario run — appears here within seconds without anyone
 * pressing refresh. When the stream is unreachable the page's ordinary polling still
 * runs; this strip then says so instead of pretending to be live.
 */

type Channel = "connecting" | "live" | "polling";

interface Pulse {
  digest: string;
  at: string;
  decisions_waiting: number;
  cci_score: number | null;
  cci_band: string | null;
}

export function LiveStrip({ onChange }: { onChange: () => void }) {
  const [channel, setChannel] = useState<Channel>("connecting");
  const [planner, setPlanner] = useState<PlannerStatus | null>(null);
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [agoSeconds, setAgoSeconds] = useState<number | null>(null);
  const digestRef = useRef<string | null>(null);
  const lastAtRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

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

    const connect = () => {
      if (disposed) return;
      source = new EventSource(`${apiOrigin}/api/v1/live`, { withCredentials: true });

      source.addEventListener("open", (event) => {
        setChannel("live");
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
    <div className={`live-strip live-strip--${channel}`}>
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
          fingerprint {pulse.digest.slice(0, 8)}
        </span>
      )}
      {mode && <span className="live-strip-meta live-strip-mode">{mode}</span>}
    </div>
  );
}
