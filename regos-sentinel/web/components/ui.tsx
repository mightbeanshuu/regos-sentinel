"use client";

import { useCallback, useId, useState, type ReactNode } from "react";

import { useChangeKey, useTween } from "../lib/liveness";
import { shortHash, stateOf, type Tone } from "../lib/presentation";

/* ---------------------------------------------------------------------------
 * State label — icon + sentence-case text. Colour is never the only signal.
 * ------------------------------------------------------------------------- */

export function StateLabel({
  value,
  showHint = false,
  className = "",
}: {
  value: string | null | undefined;
  showHint?: boolean;
  className?: string;
}) {
  const meta = stateOf(value);
  return (
    <span className={`state state--${meta.tone} ${className}`.trim()} title={meta.hint}>
      <span className="state-glyph" aria-hidden="true">{meta.glyph}</span>
      <span>
        {meta.label}
        {showHint && meta.hint && <span className="state-hint">{meta.hint}</span>}
      </span>
    </span>
  );
}

/** Compact categorical tag. Only for dense rows where a label alone reads as noise. */
export function Tag({ value, tone }: { value: string | null | undefined; tone?: Tone }) {
  const meta = stateOf(value);
  const resolved = tone ?? meta.tone;
  return (
    <span className={`tag tag--${resolved}`} title={meta.hint}>
      <span aria-hidden="true">{meta.glyph}</span>
      {meta.label}
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * Layout primitives
 * ------------------------------------------------------------------------- */

export function Panel({
  title,
  description,
  aside,
  children,
  id,
  tight = false,
}: {
  title?: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  id?: string;
  tight?: boolean;
}) {
  return (
    <section className="panel" id={id}>
      {(title || aside) && (
        <div className="panel-head">
          <div className="stack-s" style={{ minWidth: 0 }}>
            {title && <h2 className="section-title">{title}</h2>}
            {description && <p className="lede">{description}</p>}
          </div>
          {aside}
        </div>
      )}
      {children && <div className={tight ? "panel-body-tight" : "panel-body"}>{children}</div>}
    </section>
  );
}

export function DataRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="datalist-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function Callout({
  tone = "neutral",
  title,
  children,
}: {
  tone?: "review" | "fail" | "ok" | "accent" | "neutral";
  title?: ReactNode;
  children?: ReactNode;
}) {
  const glyph = tone === "fail" ? "✕" : tone === "review" ? "!" : tone === "ok" ? "✓" : "·";
  const spokenTone =
    tone === "fail" ? "Error:" : tone === "review" ? "Needs attention:" : tone === "ok" ? "Done:" : null;
  return (
    <div className={`callout${tone === "neutral" ? "" : ` callout--${tone}`}`}>
      {title && (
        <p className="callout-title">
          <span aria-hidden="true">{glyph}</span>
          {spokenTone && <span className="visually-hidden">{spokenTone} </span>}
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Hash — visually truncated, full value always recoverable via copy.
 * ------------------------------------------------------------------------- */

export function Hash({ value, label }: { value: string; label?: string }) {
  const spokenLabel = label
    ? label.endsWith("fingerprint")
      ? label
      : `${label} fingerprint`
    : "fingerprint";
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    void navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      },
      () => setCopied(false),
    );
  }, [value]);

  return (
    <span className="hash">
      <span className="hash-value" title={value}>{shortHash(value)}</span>
      <button type="button" className="hash-copy" onClick={copy}>
        {copied ? "Copied" : "Copy"}
        <span className="visually-hidden"> full {spokenLabel}</span>
      </button>
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * Quotation — the source speaking, always in serif, always with its locator.
 * ------------------------------------------------------------------------- */

export function Quote({
  locator,
  text,
  sourceUrl,
  sourceLabel = "Open official source",
}: {
  locator: string;
  text: string;
  sourceUrl?: string;
  sourceLabel?: string;
}) {
  return (
    <figure className="quote">
      <figcaption className="quote-locator">{locator}</figcaption>
      <blockquote className="quote-text">{text}</blockquote>
      {sourceUrl && (
        <p className="quote-source">
          <a className="proof-link" href={sourceUrl} target="_blank" rel="noreferrer">
            {sourceLabel} ↗
          </a>
        </p>
      )}
    </figure>
  );
}

/* ---------------------------------------------------------------------------
 * Field — label, hint, control, and an error linked to the input via aria.
 * ------------------------------------------------------------------------- */

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: (props: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": boolean | undefined;
  }) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`field${error ? " field--invalid" : ""}`}>
      <label className="field-label" htmlFor={id}>{label}</label>
      {hint && <p className="field-hint" id={hintId}>{hint}</p>}
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {error && (
        <p className="field-error" id={errorId}>
          <span aria-hidden="true">✕</span>
          <span className="visually-hidden">Error: </span>
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Figures — one stat grammar. Values read from live state, never hardcoded.
 * ------------------------------------------------------------------------- */

/**
 * One live figure. A number tweens from its previous value; any primitive value
 * flashes briefly when it changes. Values that did not change stay perfectly still —
 * motion here is evidence of a data delta, nothing else. Element values (labels,
 * badges) render as-is: their change is already visible in their own terms.
 */
function LiveValue({ value, className }: { value: ReactNode; className: string }) {
  const isNumber = typeof value === "number";
  const isPrimitive = isNumber || typeof value === "string";
  const tweened = useTween(isNumber ? value : 0);
  const changeKey = useChangeKey(isPrimitive ? value : null);

  if (!isPrimitive) return <span className={className}>{value}</span>;
  return (
    <span className={className}>
      <span className={changeKey > 0 ? "flash-change" : undefined} key={changeKey}>
        {isNumber ? tweened : value}
      </span>
    </span>
  );
}

export function Stat({
  value,
  label,
  context,
  tone,
  size = "m",
  attention = false,
}: {
  value: ReactNode;
  label: string;
  context?: ReactNode;
  /** Colours the figure only. The label stays quiet at every tone. */
  tone?: Tone;
  size?: "s" | "m" | "l";
  attention?: boolean;
}) {
  const className = [
    "stat",
    `stat--${size}`,
    tone ? `stat--${tone}` : "",
    attention ? "stat--attention" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={className}>
      <LiveValue value={value} className="stat-value" />
      <span className="stat-label">{label}</span>
      {context && <span className="stat-context">{context}</span>}
    </div>
  );
}

export function StatRow({
  children,
  glass = false,
}: {
  children: ReactNode;
  /** Lifts the figures onto a light glass slab. For the dashboard, not for dense tables. */
  glass?: boolean;
}) {
  return <div className={glass ? "stat-row stat-row--glass" : "stat-row"}>{children}</div>;
}

/** The original count row, kept for existing call sites: a StatRow of plain Stats. */
export function Counts({
  items,
  glass = false,
}: {
  items: Array<{ value: ReactNode; label: string }>;
  glass?: boolean;
}) {
  return (
    <StatRow glass={glass}>
      {items.map((item) => (
        <Stat key={item.label} value={item.value} label={item.label} />
      ))}
    </StatRow>
  );
}

/* ---------------------------------------------------------------------------
 * Meter — a figure with a bar beside it. The figure is the datum; the bar is
 * redundancy. A percentage never appears in prose without one.
 * ------------------------------------------------------------------------- */

export function Meter({
  label,
  value,
  max = 100,
  tone = "accent",
  valueLabel,
  hint,
}: {
  label: string;
  value: number;
  max?: number;
  tone?: Tone;
  valueLabel?: string;
  hint?: string;
}) {
  const safeMax = max > 0 ? max : 1;
  const ratio = Math.min(1, Math.max(0, value / safeMax));
  const figure = valueLabel ?? String(value);
  return (
    <div className="meter">
      <span className="meter-title">{label}</span>
      <span
        className="meter-track"
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={valueLabel}
      >
        <span
          className={`meter-fill meter-fill--${tone}`}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </span>
      <span className="meter-figure">{figure}</span>
      {hint && <span className="meter-hint">{hint}</span>}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * SegBar — a distribution as one thin bar plus legend chips. Zero-count
 * segments keep their legend chip: an absence is information too.
 * ------------------------------------------------------------------------- */

export function SegBar({
  segments,
  ariaLabel,
}: {
  segments: Array<{ label: string; count: number; tone: Tone }>;
  ariaLabel: string;
}) {
  const drawn = segments.filter((segment) => segment.count > 0);
  return (
    <div className="segbar-wrap">
      <div className="segbar" role="img" aria-label={ariaLabel}>
        {drawn.map((segment) => (
          <span
            key={segment.label}
            className={`segbar-seg segbar-seg--${segment.tone}`}
            style={{ flexGrow: segment.count }}
          />
        ))}
      </div>
      <ul className="segbar-legend">
        {segments.map((segment) => (
          <li className="legend-chip" key={segment.label}>
            <span className={`legend-dot legend-dot--${segment.tone}`} aria-hidden="true" />
            <span className="legend-label">{segment.label}</span>
            <span className="legend-count">{segment.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Donut — a ratio of one whole. Legend is not built in: callers pair it with
 * SegBar's legend chips so every distribution reads the same way.
 * ------------------------------------------------------------------------- */

const TONE_WORD: Record<Tone, string> = {
  ok: "complete",
  review: "waiting on a person",
  fail: "not passed",
  accent: "in progress",
  neutral: "other",
};

const DONUT_RING =
  "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";

export function Donut({
  segments,
  centreValue,
  centreLabel,
  size = 168,
}: {
  segments: Array<{ count: number; tone: Tone; label?: string }>;
  centreValue?: ReactNode;
  centreLabel?: string;
  size?: number;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  if (total === 0) return null;

  let offset = 0;
  const arcs = segments.map((segment) => {
    const length = (segment.count / total) * 100;
    const arc = { tone: segment.tone, length, offset };
    offset += length;
    return arc;
  });
  const spoken = segments
    .map((segment) => `${segment.count} ${segment.label ?? TONE_WORD[segment.tone]}`)
    .join(", ");

  return (
    <div className="exec-donut" style={{ width: size }}>
      <svg viewBox="0 0 36 36" role="img" aria-label={`${spoken} of ${total}`}>
        <path d={DONUT_RING} fill="none" stroke="var(--line-2)" strokeWidth="3" />
        {arcs
          .filter((arc) => arc.length > 0)
          .map((arc) => (
            <path
              key={`${arc.tone}-${arc.offset}`}
              d={DONUT_RING}
              fill="none"
              stroke={`var(--${arc.tone === "neutral" ? "line-2" : arc.tone})`}
              strokeWidth={arc.tone === "ok" ? 3.6 : 3}
              strokeLinecap="round"
              strokeDasharray={`${arc.length} ${100 - arc.length}`}
              strokeDashoffset={-arc.offset}
            />
          ))}
      </svg>
      {(centreValue !== undefined || centreLabel) && (
        <div className="exec-donut-centre">
          {centreValue !== undefined && <span className="exec-donut-figure">{centreValue}</span>}
          {centreLabel && <span className="exec-donut-word">{centreLabel}</span>}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Timeline — recorded events, newest first. The sanctioned display for things
 * that happened; numbered `.outcome` lists stay the display for process steps.
 * ------------------------------------------------------------------------- */

export function Timeline({
  items,
}: {
  items: Array<{ id: string; title: ReactNode; meta?: ReactNode; tone?: "ok" | "review" | "neutral" }>;
}) {
  return (
    <ol className="timeline">
      {items.map((item) => (
        <li className="timeline-row" key={item.id}>
          <span
            className={item.tone ? `timeline-node timeline-node--${item.tone}` : "timeline-node"}
            aria-hidden="true"
          />
          <div className="timeline-body">
            <p className="timeline-event">{item.title}</p>
            {item.meta && <p className="timeline-meta">{item.meta}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---------------------------------------------------------------------------
 * Loading and absence — two different things, told apart.
 * A fetch in flight gets a Skeleton shaped like its result; a fetch that
 * returned nothing gets an Empty with exactly one way forward. "Unavailable"
 * is never shown while a request is still running.
 * ------------------------------------------------------------------------- */

const SKELETON_LINE_WIDTHS = ["100%", "92%", "78%", "86%", "70%"];

export function Skeleton({ kind, lines = 3 }: { kind: "lines" | "stat" | "dial" | "row"; lines?: number }) {
  return (
    <div className={`skel-group skel-group--${kind}`} role="status" aria-label="Loading">
      {kind === "lines" &&
        Array.from({ length: Math.max(1, lines) }, (_, index) => (
          <span
            key={index}
            className="skel skel-line"
            style={{ width: SKELETON_LINE_WIDTHS[index % SKELETON_LINE_WIDTHS.length] }}
          />
        ))}
      {kind === "stat" && (
        <>
          <span className="skel skel-line" style={{ width: "40%" }} />
          <span className="skel skel-value" />
        </>
      )}
      {kind === "dial" && (
        <>
          <span className="skel skel-circle" />
          <span className="skel skel-line" style={{ width: "60%" }} />
          <span className="skel skel-line" style={{ width: "44%" }} />
        </>
      )}
      {kind === "row" && <span className="skel skel-row" />}
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      {hint && <p className="meta">{hint}</p>}
      {action}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * TodoList — work that is waiting on a person. Every row carries exactly one
 * action; nothing here is dismissible, so the leading mark is a state dot and
 * never a checkbox a reader could mistake for "done".
 * ------------------------------------------------------------------------- */

export function TodoList({
  items,
  emptyText,
}: {
  items: Array<{
    id: string;
    title: string;
    note?: string;
    tone?: "review" | "fail";
    actionLabel: string;
    onAction: () => void;
    disabled?: boolean;
  }>;
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <p className="todo-clear">
        <span className="state state--ok">
          <span className="state-glyph" aria-hidden="true">✓</span>
          <span>{emptyText}</span>
        </span>
      </p>
    );
  }
  return (
    <ul className="todo-list">
      {items.map((item) => (
        <li className={item.tone ? `todo-row todo-row--${item.tone}` : "todo-row"} key={item.id}>
          <span className="todo-glyph" aria-hidden="true">{item.tone === "fail" ? "✕" : "!"}</span>
          <div className="todo-body">
            <span className="todo-title">{item.title}</span>
            {item.note && <span className="todo-note">{item.note}</span>}
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--small"
            onClick={item.onAction}
            disabled={item.disabled}
          >
            {item.actionLabel}
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------------------
 * CompareCols — before and after, side by side. The `after` column is the
 * authoritative side and takes the white surface.
 * ------------------------------------------------------------------------- */

export function CompareCols({
  before,
  after,
  relation = "→",
}: {
  before: { label: ReactNode; body: ReactNode };
  after: { label: ReactNode; body: ReactNode };
  relation?: ReactNode;
}) {
  return (
    <div className="compare">
      <div className="compare-col">
        <p className="micro">{before.label}</p>
        {before.body}
      </div>
      <span className="compare-rel" aria-hidden="true">{relation}</span>
      <div className="compare-col compare-col--source">
        <p className="micro">{after.label}</p>
        {after.body}
      </div>
    </div>
  );
}

export function Disclosure({
  summary,
  children,
  open = false,
}: {
  summary: ReactNode;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className="disclosure" open={open}>
      <summary>{summary}</summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}
