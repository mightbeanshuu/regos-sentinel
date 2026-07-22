"use client";

import { useCallback, useId, useState, type ReactNode } from "react";

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
    <span className={`state state--${meta.tone} ${className}`.trim()}>
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
    <span className={`tag tag--${resolved}`}>
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
  return (
    <div className={`callout${tone === "neutral" ? "" : ` callout--${tone}`}`}>
      {title && (
        <p className="callout-title">
          <span aria-hidden="true">{glyph}</span>
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

export function Hash({ value, label = "fingerprint" }: { value: string; label?: string }) {
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
      <span title={value}>{shortHash(value)}</span>
      <button type="button" className="hash-copy" onClick={copy}>
        {copied ? "Copied" : "Copy"}
        <span className="visually-hidden"> full {label}</span>
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
          <a href={sourceUrl} target="_blank" rel="noreferrer">
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
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Counts — figures read from live state. Never a hardcoded total.
 * ------------------------------------------------------------------------- */

export function Counts({ items }: { items: Array<{ value: ReactNode; label: string }> }) {
  return (
    <div className="counts">
      {items.map((item) => (
        <div className="count" key={item.label}>
          <span className="count-value">{item.value}</span>
          <span className="count-label">{item.label}</span>
        </div>
      ))}
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
