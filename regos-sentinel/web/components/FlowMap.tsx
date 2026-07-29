"use client";

import { useId, type ReactNode } from "react";

/* ---------------------------------------------------------------------------
 * FlowMap — "How it works" as one quiet instrument panel.
 *
 * Four stages left to right: the SEBI text comes in, fixed rules read it,
 * a named person decides, and the build is sealed. Between rules and person
 * an amber branch drops out of the line: when the text is silent, the system
 * stops and asks — that refusal is drawn, not footnoted.
 *
 * Pure inline SVG + CSS. Icons hand-drawn on the same 20×20 grid as
 * components/vector.tsx (1.6 stroke, round caps, currentColor), scaled up
 * with non-scaling strokes so the weight matches the rest of the set.
 * ------------------------------------------------------------------------- */

const CARD_W = 188;
const CARD_H = 116;
const CARD_Y = 50;
const MID_Y = CARD_Y + CARD_H / 2 + 8; // connector line height

type Stage = {
  x: number;
  title: string;
  subtitle: string;
  icon: ReactNode;
};

const STAGES: Stage[] = [
  {
    x: 16,
    title: "SEBI source",
    subtitle: "fetched & fingerprinted",
    icon: (
      <>
        <path d="M5 2.8h7.2L15 5.6v11.6H5z" />
        <path d="M12 2.8v3h3" />
        <path d="M7.4 8.8h5.2M7.4 11.4h5.2M7.4 14h3" />
      </>
    ),
  },
  {
    x: 262,
    title: "Fixed rules",
    subtitle: "12 deterministic checks",
    icon: (
      <>
        <rect x="4" y="2.8" width="12" height="14.4" rx="1.8" />
        <path d="m6.6 7.4 1.2 1.2 2-2.2M11.6 7.4h2" />
        <path d="m6.6 12.6 1.2 1.2 2-2.2M11.6 12.6h2" />
      </>
    ),
  },
  {
    x: 508,
    title: "A person decides",
    subtitle: "named, recorded",
    icon: (
      <>
        <circle cx="10" cy="6.4" r="2.9" />
        <path d="M4.2 17.2c.6-3 3-4.6 5.8-4.6s5.2 1.6 5.8 4.6" />
      </>
    ),
  },
  {
    x: 754,
    title: "Sealed proof",
    subtitle: "replayable build",
    icon: (
      <>
        <path d="M10 2.6 4 4.8v4.6c0 3.6 2.5 6.9 6 7.8 3.5-.9 6-4.2 6-7.8V4.8z" />
        <path d="m7.5 9.7 1.8 1.8 3.2-3.4" />
      </>
    ),
  },
];

function StageCard({ stage }: { stage: Stage }) {
  const cx = stage.x + CARD_W / 2;
  return (
    <g>
      <rect
        className="flowmap-card"
        x={stage.x}
        y={CARD_Y}
        width={CARD_W}
        height={CARD_H}
        rx={16}
      />
      <g
        className="flowmap-icon"
        transform={`translate(${cx - 19}, ${CARD_Y + 14}) scale(1.9)`}
      >
        {stage.icon}
      </g>
      <text className="flowmap-title" x={cx} y={CARD_Y + 76} textAnchor="middle">
        {stage.title}
      </text>
      <text className="flowmap-sub" x={cx} y={CARD_Y + 96} textAnchor="middle">
        {stage.subtitle}
      </text>
    </g>
  );
}

export function FlowMap() {
  const uid = useId();
  const arrowId = `${uid}-arrow`;
  const branchArrowId = `${uid}-branch-arrow`;

  // Connector spans (between card edges, with a little air on each side).
  const connectors = STAGES.slice(0, -1).map((s, i) => ({
    x1: s.x + CARD_W + 5,
    x2: STAGES[i + 1].x - 11,
  }));

  // Refusal branch drops from the middle of the rules → person connector.
  const branchX = (STAGES[1].x + CARD_W + STAGES[2].x) / 2;
  const needsW = 124;
  const needsH = 44;
  const needsY = 216;

  return (
    <>
      <style>{`
        .flowmap-root { display: block; width: 100%; height: auto; }
        .flowmap-root text { font-family: var(--sans); }
        .flowmap-card {
          fill: var(--surface);
          stroke: var(--line-2);
          stroke-width: 1;
        }
        .flowmap-icon {
          color: var(--ink);
          fill: none;
          stroke: currentColor;
          stroke-width: 1.6;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .flowmap-icon path,
        .flowmap-icon rect,
        .flowmap-icon circle { vector-effect: non-scaling-stroke; }
        .flowmap-title { fill: var(--ink); font-size: 15px; font-weight: 620; }
        .flowmap-sub { fill: var(--ink-3); font-size: 12px; }
        .flowmap-line {
          fill: none;
          stroke: var(--accent);
          stroke-width: 2;
          stroke-linecap: round;
          stroke-dasharray: 6 8;
          animation: flowmap-dash 1.6s linear infinite;
        }
        .flowmap-branch-line {
          fill: none;
          stroke: var(--review);
          stroke-width: 1.6;
          stroke-linecap: round;
          stroke-dasharray: 3 6;
          animation: flowmap-branch-dash 1.8s linear infinite;
        }
        .flowmap-branch-node { fill: var(--review); }
        .flowmap-branch-label {
          fill: var(--review);
          font-size: 11.5px;
          font-style: italic;
        }
        .flowmap-needs-card {
          fill: var(--surface);
          stroke: var(--review);
          stroke-width: 1.2;
          stroke-dasharray: 4 4;
        }
        .flowmap-needs-text {
          fill: var(--review);
          font-size: 13px;
          font-weight: 620;
        }
        .flowmap-arrow-accent { fill: var(--accent); }
        .flowmap-arrow-review { fill: var(--review); }
        @keyframes flowmap-dash {
          to { stroke-dashoffset: -28; }
        }
        @keyframes flowmap-branch-dash {
          to { stroke-dashoffset: -18; }
        }
        @media (prefers-reduced-motion: reduce) {
          .flowmap-line, .flowmap-branch-line { animation: none; }
        }
        .flowmap-sr {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>

      <svg
        className="flowmap-root"
        viewBox="0 0 960 300"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <marker
            id={arrowId}
            viewBox="0 0 8 8"
            refX="6"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path className="flowmap-arrow-accent" d="M1 1l5.6 3L1 7z" />
          </marker>
          <marker
            id={branchArrowId}
            viewBox="0 0 8 8"
            refX="6"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path className="flowmap-arrow-review" d="M1 1l5.6 3L1 7z" />
          </marker>
        </defs>

        {connectors.map((c, i) => (
          <path
            key={i}
            className="flowmap-line"
            d={`M${c.x1} ${MID_Y}H${c.x2}`}
            markerEnd={`url(#${arrowId})`}
          />
        ))}

        {STAGES.map((s) => (
          <StageCard key={s.title} stage={s} />
        ))}

        {/* Refusal branch: when the text is silent, the line stops and asks. */}
        <circle className="flowmap-branch-node" cx={branchX} cy={MID_Y} r={3.2} />
        <path
          className="flowmap-branch-line"
          d={`M${branchX} ${MID_Y + 8}V${needsY - 8}`}
          markerEnd={`url(#${branchArrowId})`}
        />
        <text
          className="flowmap-branch-label"
          x={branchX + 12}
          y={(MID_Y + needsY) / 2 + 4}
        >
          stops when the text is silent
        </text>
        <rect
          className="flowmap-needs-card"
          x={branchX - needsW / 2}
          y={needsY}
          width={needsW}
          height={needsH}
          rx={12}
        />
        <text
          className="flowmap-needs-text"
          x={branchX}
          y={needsY + needsH / 2 + 4.5}
          textAnchor="middle"
        >
          Needs you
        </text>
      </svg>

      <p className="flowmap-sr">
        How it works: first, the SEBI source document is fetched and
        fingerprinted. Second, twelve fixed deterministic rules check it.
        Third, a named person decides, and that decision is recorded. Fourth,
        the result is sealed into a replayable proof. Whenever the regulatory
        text is silent, the system stops instead of guessing and routes the
        item to a person — the &ldquo;Needs you&rdquo; branch.
      </p>
    </>
  );
}
