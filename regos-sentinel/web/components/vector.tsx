"use client";

import { useId, type ReactNode } from "react";

/* ---------------------------------------------------------------------------
 * RegOS vector set — every icon hand-drawn on a 20×20 grid, 1.6px stroke,
 * round caps, currentColor. One weight everywhere so the set reads as one
 * instrument, not a sticker sheet. Decorative pieces encode nothing.
 * ------------------------------------------------------------------------- */

function Icon({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </svg>
  );
}

/** Requirements — a clause sheet with a confirmed line. */
export function IconClauses() {
  return (
    <Icon>
      <path d="M5 2.8h7.2L15 5.6v11.6H5z" />
      <path d="M12 2.8v3h3" />
      <path d="M7.4 9h5.2M7.4 11.8h3" />
      <path d="m11.6 14.4 1.2 1.2 2-2.2" />
    </Icon>
  );
}

/** A decision that belongs to a person. */
export function IconDecision() {
  return (
    <Icon>
      <circle cx="10" cy="6.4" r="2.9" />
      <path d="M4.2 17.2c.6-3 3-4.6 5.8-4.6s5.2 1.6 5.8 4.6" />
      <path d="M14.6 4.2 16 5.6l2.4-2.6" />
    </Icon>
  );
}

/** A date that can honestly be produced. */
export function IconCalendar() {
  return (
    <Icon>
      <rect x="3" y="4.4" width="14" height="12.6" rx="1.8" />
      <path d="M3 8.2h14M7 2.6v3M13 2.6v3" />
      <path d="M10 11v2.4l1.8 1" />
    </Icon>
  );
}

/** Evidence held current. */
export function IconEvidence() {
  return (
    <Icon>
      <path d="M10 2.6 4 4.8v4.6c0 3.6 2.5 6.9 6 7.8 3.5-.9 6-4.2 6-7.8V4.8z" />
      <path d="m7.5 9.7 1.8 1.8 3.2-3.4" />
    </Icon>
  );
}

/** The institution's own text — a landmark. */
export function IconInstitution() {
  return (
    <Icon>
      <path d="M3 7.4 10 3l7 4.4" />
      <path d="M4.6 8.4v6M9.99 8.4v6M15.4 8.4v6" />
      <path d="M3.4 17h13.2" />
    </Icon>
  );
}

/** Score / gauge. */
export function IconGauge() {
  return (
    <Icon>
      <path d="M3.4 13.6a6.6 6.6 0 1 1 13.2 0" />
      <path d="m10 13.6 3-4.4" />
      <circle cx="10" cy="13.6" r="1.1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/** Reporting clock. */
export function IconClock() {
  return (
    <Icon>
      <circle cx="10" cy="10.6" r="6.4" />
      <path d="M10 7.2v3.4l2.4 1.4" />
      <path d="M7.4 2.6h5.2" />
    </Icon>
  );
}

/** Deadline ledger. */
export function IconLedger() {
  return (
    <Icon>
      <rect x="3.4" y="3.4" width="13.2" height="13.2" rx="1.8" />
      <path d="M3.4 7.6h13.2M8 7.6v9" />
    </Icon>
  );
}

/** Ask — a plain speech mark. */
export function IconAsk() {
  return (
    <Icon>
      <path d="M3.4 4.6h13.2v8.2H9.4L6 16v-3.2H3.4z" />
      <path d="M6.8 8.7h6.4" />
    </Icon>
  );
}

/** Agents — a terminal prompt. */
export function IconAgents() {
  return (
    <Icon>
      <rect x="2.6" y="3.8" width="14.8" height="12.4" rx="1.8" />
      <path d="m5.6 8 2.4 2.2-2.4 2.2M9.6 12.6h4.4" />
    </Icon>
  );
}

/* ---------------------------------------------------------------------------
 * Decorative field — a quiet blueprint grid for the hero band. Encodes
 * nothing; fades out before it reaches any text.
 * ------------------------------------------------------------------------- */

export function GridField() {
  const id = useId();
  return (
    <svg className="gridfield" viewBox="0 0 640 240" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs>
        <pattern id={`${id}-g`} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0v32" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.9" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width="640" height="240" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <rect width="640" height="240" fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
    </svg>
  );
}
