/**
 * The landing page's artwork.
 *
 * Every drawing here depicts something the product actually does, using the
 * colour contract from `romer.css` — aqua verified, peach a person is required,
 * periwinkle computed, lime brand and action only. None of it is ornament: the
 * clause sheet shows the real defect the product exists to catch, the pipeline
 * shows the four stages it runs, and the chain shows what makes its trace
 * evidence rather than a log.
 *
 * Drawn rather than sourced from an icon set, for two reasons. A regulatory
 * product illustrated with the same rounded glyphs as every other landing page
 * reads as a template. And the geometry has to carry specific meaning — a
 * period without a trigger, a line that stops dead — which no general icon
 * does.
 *
 * `vectorEffect="non-scaling-stroke"` is deliberately NOT used. It pins strokes
 * to device pixels regardless of the drawing's rendered size, which turns a
 * large mark into a hairline; that bug made the film's shield logo look like a
 * scratch. These scale with their viewBox.
 */

const stroke = {
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* ---------------------------------------------------------------------------
   The clause. The whole product in one drawing: a duty with a stated period
   and no stated start, so no date can be derived from it.
   ------------------------------------------------------------------------ */
export function ClauseSheet() {
  const line = (y: number, width: number, key: string) => (
    <rect key={key} x={26} y={y} width={width} height={5} rx={2.5} fill="var(--line-2)" />
  );

  return (
    <svg viewBox="0 0 420 300" className="lp-art" role="img" aria-label="A regulation clause stating a six month period but never what starts it">
      <defs>
        <linearGradient id="lp-sheet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e0f12" />
          <stop offset="100%" stopColor="#0a0b0d" />
        </linearGradient>
        <linearGradient id="lp-mark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--review)" stopOpacity="0.42" />
          <stop offset="100%" stopColor="var(--review)" stopOpacity="0.14" />
        </linearGradient>
      </defs>

      <rect x={10} y={10} width={400} height={280} rx={12} fill="url(#lp-sheet)" stroke="var(--line)" />

      {/* Locator — the product never shows a passage without one. */}
      <rect x={26} y={28} width={152} height={20} rx={5} fill="var(--accent-wash)" stroke="var(--accent-line)" />
      <text x={36} y={42} className="lp-art-mono" fill="var(--accent)">page 3 · passage 5</text>

      {line(66, 342, "a")}
      {line(80, 300, "b")}

      {/* The clause itself, set as real type so it is legible at any size. */}
      <text x={26} y={116} className="lp-art-clause" fill="var(--ink)">
        …shall provide monthly reports
      </text>
      <text x={26} y={144} className="lp-art-clause" fill="var(--ink)">
        for a
        <tspan fill="var(--review)" fontWeight={650}> period of 6 months</tspan>
        <tspan fill="var(--ink)">.</tspan>
      </text>

      {/* The mark under the period, and the question the product asks of it. */}
      <rect x={78} y={149} width={196} height={9} rx={4} fill="url(#lp-mark)" />
      <path d="M176 168v16" stroke="var(--review)" strokeWidth={1.4} {...stroke} />
      <text x={176} y={200} textAnchor="middle" className="lp-art-note" fill="var(--review)">
        six months from when?
      </text>

      {line(224, 268, "c")}
      {line(238, 196, "d")}

      {/* What the machine concluded, stated plainly, with its real figure. */}
      <line x1={26} y1={258} x2={394} y2={258} stroke="var(--line)" />
      <text x={26} y={278} className="lp-art-mono" fill="var(--ink-3)">
        no clock-start stated
      </text>
      <text x={394} y={278} textAnchor="end" className="lp-art-mono" fill="var(--review)">
        no due date computed
      </text>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   The pipeline, and the place it stops.
   ------------------------------------------------------------------------ */
const STAGE_ICONS = [
  // fetch the source
  <g key="fetch">
    <path d="M8 3.6h7.4l4.2 4.2v11.4a1.7 1.7 0 0 1-1.7 1.7H8a1.7 1.7 0 0 1-1.7-1.7V5.3A1.7 1.7 0 0 1 8 3.6Z" />
    <path d="M15.4 3.6v4.2h4.2" />
    <path d="M13 11.4v5" />
    <path d="m10.7 14.1 2.3 2.3 2.3-2.3" />
  </g>,
  // read every passage
  <g key="read">
    <path d="M2.6 12s3.6-5.4 9.6-5.4S21.8 12 21.8 12s-3.6 5.4-9.6 5.4S2.6 12 2.6 12Z" />
    <circle cx="12.2" cy="12" r="2.6" />
  </g>,
  // compare against the firm's control
  <g key="compare">
    <path d="M12 4v16" />
    <path d="M5.4 7.6h13.2" />
    <path d="M5.4 7.6 2.7 13.4a3 3 0 0 0 5.4 0Z" />
    <path d="M18.6 7.6 15.9 13.4a3 3 0 0 0 5.4 0Z" />
    <path d="M8.4 20h7.2" />
  </g>,
  // record a decision, signed
  <g key="record">
    <path d="M15.2 4 19.6 8.4l-8.2 8.2-4.8 1.1 1.1-4.8Z" />
    <path d="m13.4 5.8 4.4 4.4" />
    <path d="M4 20.6h16" />
  </g>,
];

const STAGES = [
  { label: "Fetch the source", note: "from sebi.gov.in", tone: "var(--accent)" },
  { label: "Read it", note: "every passage", tone: "var(--accent)" },
  { label: "Compare", note: "against the control", tone: "var(--ok)" },
  { label: "Record a decision", note: "signed by a person", tone: "var(--review)" },
];

export function PipelineDiagram() {
  const step = 236;
  const cx = (i: number) => 92 + i * step;

  return (
    <svg viewBox="0 0 1000 190" className="lp-art lp-art--wide" role="img" aria-label="Fetch the source, read it, compare it to the control, record a decision — then stop">
      {STAGES.map((stage, i) => (
        <g key={stage.label}>
          {i < STAGES.length - 1 && (
            <line
              x1={cx(i) + 44}
              y1={62}
              x2={cx(i + 1) - 44}
              y2={62}
              stroke={STAGES[i + 1].tone}
              strokeWidth={1.4}
              opacity={0.45}
            />
          )}
          <circle cx={cx(i)} cy={62} r={38} fill="var(--bg-2)" stroke={stage.tone} strokeOpacity={0.42} />
          <g
            transform={`translate(${cx(i) - 15} 47) scale(1.25)`}
            stroke={stage.tone}
            strokeWidth={1.5}
            {...stroke}
          >
            {STAGE_ICONS[i]}
          </g>
          <text x={cx(i)} y={128} textAnchor="middle" className="lp-art-label" fill="var(--ink)">
            {stage.label}
          </text>
          <text x={cx(i)} y={150} textAnchor="middle" className="lp-art-note" fill="var(--ink-3)">
            {stage.note}
          </text>
        </g>
      ))}

      {/* The terminator. The line arrives and ends — it does not resolve into a
          tick, because the claim is that the product stops, not that it passed. */}
      <line x1={cx(3) + 44} y1={62} x2={946} y2={62} stroke="var(--review)" strokeWidth={1.4} opacity={0.45} />
      <line x1={952} y1={42} x2={952} y2={82} stroke="var(--review)" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   The trace. Each step carries the digest of the one before it, which is what
   makes an edited step detectable rather than merely logged.
   ------------------------------------------------------------------------ */
export function EvidenceChain() {
  const blocks = [
    { tool: "list_unresolved_references", digest: "31631bd5" },
    { tool: "search_corpus", digest: "7c56d310" },
    { tool: "verify_quote", digest: "a91acd95" },
    { tool: "analyse_span_timing", digest: "3b454e02" },
  ];

  return (
    <svg viewBox="0 0 1000 150" className="lp-art lp-art--wide" role="img" aria-label="Each recorded step carries the digest of the step before it">
      {blocks.map((block, i) => {
        const x = 20 + i * 246;
        return (
          <g key={block.tool}>
            {i > 0 && (
              <g stroke="var(--ok)" strokeWidth={1.4} opacity={0.55} {...stroke}>
                <path d={`M${x - 26} 62h20`} />
                <path d={`m${x - 12} 56 6 6-6 6`} />
              </g>
            )}
            <rect x={x} y={26} width={220} height={72} rx={10} fill="var(--bg-2)" stroke="var(--line-2)" />
            <text x={x + 16} y={54} className="lp-art-mono" fill="var(--ink-2)">
              {block.tool.length > 22 ? `${block.tool.slice(0, 21)}…` : block.tool}
            </text>
            <text x={x + 16} y={78} className="lp-art-mono" fill="var(--ok)">
              sha256 {block.digest}…
            </text>
            <circle cx={x + 204} cy={44} r={4} fill="var(--ok)" />
          </g>
        );
      })}
      <text x={20} y={132} className="lp-art-note" fill="var(--ink-3)">
        26 steps recomputed · chain intact · edit any one of them and it stops verifying
      </text>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   The mark.
   ------------------------------------------------------------------------ */
export function ShieldMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="lp-mark">
      <path
        d="M12 2.6 4.6 5.4v5.9c0 4.6 3.1 8.4 7.4 9.6 4.3-1.2 7.4-5 7.4-9.6V5.4Z"
        stroke="var(--brand)"
        strokeWidth={1.5}
        {...stroke}
      />
    </svg>
  );
}

/** The four assistants' glyphs, matching the ones inside the product. */
export const ASSISTANT_GLYPHS: Record<string, string> = {
  resolver: "M10 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm8 14-3.8-3.8",
  scout: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Zm10 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  adversary: "M12 3 5 5.7v5.1c0 4 2.8 7.6 7 8.7 4.2-1.1 7-4.7 7-8.7V5.7L12 3Zm0 4v4m0 0-2 3m2-3 2 3",
  extractor: "M7 4v3M17 4v3M4 9h16M6 6h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z",
};

export function Glyph({ path, tone }: { path: string; tone: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden>
      <path d={path} stroke={tone} strokeWidth={1.6} {...stroke} />
    </svg>
  );
}
