"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDate } from "../lib/presentation";
import type { WorkspaceState } from "../lib/types";
import { StateLabel, Tag } from "./ui";

type ClockRow = {
  findingId: string;
  title: string;
  durationLabel: string | null;
  triggerLabel: string | null;
  triggerDate: string | null;
  dueDate: string | null;
  computable: boolean;
  blockedReason: string | null;
  triggerProvenance: string | null;
  durationProvenance: string | null;
};

function buildRows(state: WorkspaceState): ClockRow[] {
  const byFinding = new Map(state.deadline_computations.map((item) => [item.finding_id, item]));

  return state.findings.map((finding) => {
    const computation = byFinding.get(finding.id);
    if (!computation) {
      return {
        findingId: finding.id,
        title: finding.title,
        durationLabel: null,
        triggerLabel: null,
        triggerDate: null,
        dueDate: null,
        computable: false,
        blockedReason: "No deadline has been calculated for this finding yet.",
        triggerProvenance: null,
        durationProvenance: null,
      };
    }
    return {
      findingId: finding.id,
      title: finding.title,
      durationLabel: computation.duration_label,
      triggerLabel: computation.trigger_label,
      triggerDate: computation.trigger_date,
      dueDate: computation.due_date,
      computable: computation.computable,
      blockedReason: computation.blocked_reason,
      triggerProvenance: computation.trigger_provenance,
      durationProvenance: computation.duration_provenance,
    };
  });
}

function progressForRow(row: ClockRow, nowMs: number): number | null {
  if (!row.computable || !row.triggerDate || !row.dueDate) return null;
  const start = Date.parse(row.triggerDate);
  const end = Date.parse(row.dueDate);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  return Math.min(1, Math.max(0, (nowMs - start) / (end - start)));
}

function ClockFace({
  row,
  nowMs,
  reducedMotion,
}: {
  row: ClockRow;
  nowMs: number;
  reducedMotion: boolean;
}) {
  const progress = progressForRow(row, nowMs);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const sweep = 0.72;
  const arcLen = circumference * sweep;
  const offset =
    progress === null
      ? circumference
      : circumference - arcLen * progress;

  const tone = !row.computable
    ? "review"
    : progress !== null && progress >= 1
      ? "fail"
      : "ok";

  return (
    <div className="irc-clock" aria-hidden={false}>
      <svg viewBox="0 0 140 140" role="img" aria-label={`Reporting clock for ${row.findingId}`}>
        <circle
          className="irc-track"
          cx="70"
          cy="70"
          r={radius}
          strokeDasharray={`${arcLen} ${circumference}`}
          transform="rotate(126 70 70)"
        />
        <circle
          className={`irc-arc irc-arc--${tone}`}
          cx="70"
          cy="70"
          r={radius}
          strokeDasharray={`${arcLen} ${circumference}`}
          strokeDashoffset={offset}
          transform="rotate(126 70 70)"
          style={reducedMotion ? undefined : { transition: "stroke-dashoffset 0.4s var(--ease)" }}
        />
      </svg>
      <div className="irc-centre">
        {!row.computable ? (
          <>
            <span className="irc-centre-label">Clock not started</span>
            <span className="irc-centre-meta">Trigger not set</span>
          </>
        ) : progress !== null && progress >= 1 ? (
          <>
            <span className="irc-centre-label">Past due</span>
            <span className="irc-centre-meta">{formatDate(row.dueDate)}</span>
          </>
        ) : (
          <>
            <span className="irc-centre-label">{row.durationLabel}</span>
            <span className="irc-centre-meta">
              {row.dueDate ? `Due ${formatDate(row.dueDate)}` : "—"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Visual reporting clocks for each VAPT finding — driven only by deadline rows
 * returned from the workspace. Where SEBI does not state a clock-start, the face
 * stays empty rather than inventing a countdown.
 */
export function IncidentReportingClock({
  state,
  compact = false,
}: {
  state: WorkspaceState;
  compact?: boolean;
}) {
  const rows = useMemo(() => buildRows(state), [state]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const hasRunning = rows.some((row) => {
      const p = progressForRow(row, Date.now());
      return p !== null && p < 1;
    });
    if (!hasRunning) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [rows, reducedMotion]);

  return (
    <div className={`irc-grid${compact ? " irc-grid--compact" : ""}`}>
      {rows.map((row) => (
        <article key={row.findingId} className="irc-card">
          <ClockFace row={row} nowMs={nowMs} reducedMotion={reducedMotion} />
          <div className="irc-copy">
            <p className="irc-id">{row.findingId}</p>
            <p className="irc-title">{row.title}</p>
            <dl className="datalist irc-meta">
              <div className="irc-meta-row">
                <dt>Period stated</dt>
                <dd>
                  {row.durationLabel ?? "Not assessed"}{" "}
                  {row.durationProvenance && <Tag value={row.durationProvenance} />}
                </dd>
              </div>
              <div className="irc-meta-row">
                <dt>Clock starts from</dt>
                <dd>
                  {row.computable && row.triggerLabel ? (
                    <>
                      {row.triggerLabel}
                      {row.triggerDate && (
                        <span className="meta"> · {formatDate(row.triggerDate)}</span>
                      )}{" "}
                      {row.triggerProvenance && <Tag value={row.triggerProvenance} />}
                    </>
                  ) : (
                    <span className="strong-ink">Not stated in the reviewed source</span>
                  )}
                </dd>
              </div>
              <div className="irc-meta-row">
                <dt>Report / close by</dt>
                <dd>
                  {row.computable && row.dueDate ? (
                    <strong className="strong-ink">{formatDate(row.dueDate)}</strong>
                  ) : (
                    <>
                      <StateLabel value="BLOCK" />
                      {row.blockedReason && <p className="meta">{row.blockedReason}</p>}
                    </>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </article>
      ))}
    </div>
  );
}
