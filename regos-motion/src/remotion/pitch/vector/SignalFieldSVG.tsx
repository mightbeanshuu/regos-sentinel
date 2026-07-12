import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BLACK, DEEP, OFFWHITE, ROYAL, SLATE, TEAL, WHITE} from '../constants';

// ————————————————————————————————————————————————————————————————
// SignalFieldSVG — code-native institutional background.
//
// Replaces the three cheap Canva video plates (bloom / signal / light).
// Design discipline (director brief):
//   • dark (or off-white) edges, readable center
//   • thin FLOWING signal paths — gentle beziers, low opacity
//   • sparse particles that travel ALONG the paths (never free-floating)
//   • an architectural grid that appears ONLY near the focal point
//   • ONE restrained teal pulse that runs along a single path
// Explicitly NOT: concentric sonar rings, gradient blobs, laser streaks,
// particle confetti, neon glow. Deterministic at 60fps.
// ————————————————————————————————————————————————————————————————

export type FieldVariant = 'void' | 'stage' | 'inspect';

const W = 1920;
const H = 1080;

// deterministic hash-noise in [0,1)
const rng = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// cubic-bezier scalar
const cbez = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

type PathDef = {
  x0: number; y0: number; x1: number; y1: number;
  x2: number; y2: number; x3: number; y3: number;
  o: number; teal: boolean;
};

const buildPaths = (variant: FieldVariant, seedBase: number): PathDef[] => {
  // Fewer, calmer lines for the void; a touch denser for the product stage.
  const n = variant === 'stage' ? 8 : variant === 'inspect' ? 6 : 7;
  const amp = variant === 'inspect' ? 90 : 150; // gentler curvature on light field
  return Array.from({length: n}, (_, i) => {
    const s = seedBase + i * 4;
    const baseY = ((i + 0.5) / n) * H;
    // slight overall diagonal drift so lines feel like signal flow, not rules
    const tilt = (rng(s + 99) - 0.5) * 70;
    return {
      x0: -160,
      y0: baseY + (rng(s + 1) - 0.5) * amp - tilt,
      x1: W * 0.34,
      y1: baseY + (rng(s + 2) - 0.5) * amp * 1.6,
      x2: W * 0.66,
      y2: baseY + (rng(s + 3) - 0.5) * amp * 1.6,
      x3: W + 160,
      y3: baseY + (rng(s + 4) - 0.5) * amp + tilt,
      o: 0.18 + rng(s + 5) * 0.22,
      teal: i % 3 === 1, // ~1 in 3 lines carries the teal accent
    };
  });
};

const pathD = (p: PathDef) =>
  `M ${p.x0} ${p.y0} C ${p.x1} ${p.y1}, ${p.x2} ${p.y2}, ${p.x3} ${p.y3}`;

export const SignalFieldSVG: React.FC<{
  tone?: 'dark' | 'light';
  variant?: FieldVariant;
  intensity?: number;
  /** focal point for the near-field grid, in 0–1 frame coords */
  focal?: [number, number];
  seed?: number;
}> = ({tone = 'dark', variant = 'void', intensity = 1, focal = [0.5, 0.5], seed = 7}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const paths = useMemo(() => buildPaths(variant, seed), [variant, seed]);

  const dark = tone === 'dark';
  const bg = dark ? BLACK : OFFWHITE;
  const lineBase = dark ? ROYAL : ROYAL;
  const gridColor = dark ? WHITE : ROYAL;
  const gridOpacity = dark ? 0.05 : 0.06;
  const particleColor = TEAL;

  const fx = focal[0] * 100;
  const fy = focal[1] * 100;

  // gentle vertical breathing so the field feels alive but never busy (≤6px)
  const breath = Math.sin(frame / 130) * 6 * intensity;

  // the single teal pulse rides along path index `pulseIdx`, looping slowly
  const pulseIdx = 1;
  const pulsePeriod = fps * 6;
  const pulseT = (frame % pulsePeriod) / pulsePeriod;
  const pulsePath = paths[pulseIdx];

  // particles: 1 dot per accent path, staggered, constrained to the curve
  const accentPaths = paths.map((p, i) => ({p, i})).filter(({p}) => p.teal);

  const uid = React.useId().replace(/:/g, '');

  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        style={{transform: `translateY(${breath}px)`}}
      >
        <defs>
          {/* near-field grid confined to the focal region only */}
          <radialGradient id={`grid-${uid}`} cx={`${fx}%`} cy={`${fy}%`} r="42%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="60%" stopColor="white" stopOpacity="0.35" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id={`gridmask-${uid}`}>
            <rect x="0" y="0" width={W} height={H} fill={`url(#grid-${uid})`} />
          </mask>
          {/* soft edge vignette so the frame reads darker at the margins */}
          <radialGradient id={`vig-${uid}`} cx="50%" cy="48%" r="72%">
            <stop offset="55%" stopColor={bg} stopOpacity="0" />
            <stop offset="100%" stopColor={bg} stopOpacity={dark ? 0.85 : 0.5} />
          </radialGradient>
          {/* fade each signal line out at the horizontal edges */}
          <linearGradient id={`fade-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="12%" stopColor="white" stopOpacity="1" />
            <stop offset="88%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id={`edgefade-${uid}`}>
            <rect x="0" y="0" width={W} height={H} fill={`url(#fade-${uid})`} />
          </mask>
        </defs>

        {/* architectural grid — visible only in the focal region */}
        <g mask={`url(#gridmask-${uid})`} opacity={gridOpacity * intensity}>
          {Array.from({length: 21}, (_, i) => (
            <line
              key={`v${i}`}
              x1={i * 96}
              y1={0}
              x2={i * 96}
              y2={H}
              stroke={gridColor}
              strokeWidth={1}
            />
          ))}
          {Array.from({length: 12}, (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * 96}
              x2={W}
              y2={i * 96}
              stroke={gridColor}
              strokeWidth={1}
            />
          ))}
        </g>

        {/* flowing signal lines */}
        <g mask={`url(#edgefade-${uid})`}>
          {paths.map((p, i) => (
            <path
              key={i}
              d={pathD(p)}
              fill="none"
              stroke={p.teal ? TEAL : lineBase}
              strokeWidth={p.teal ? 1.4 : 1}
              opacity={(dark ? p.o : p.o * 0.6) * intensity}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* one restrained teal pulse travelling along a single path */}
          {pulsePath && (() => {
            const head = pulseT;
            const tailLen = 0.14;
            const segs = 10;
            return (
              <g>
                {Array.from({length: segs}, (_, k) => {
                  const t = head - (k / segs) * tailLen;
                  if (t < 0 || t > 1) return null;
                  const x = cbez(pulsePath.x0, pulsePath.x1, pulsePath.x2, pulsePath.x3, t);
                  const y = cbez(pulsePath.y0, pulsePath.y1, pulsePath.y2, pulsePath.y3, t);
                  const fade = (1 - k / segs) * 0.9 * intensity;
                  return <circle key={k} cx={x} cy={y} r={k === 0 ? 3 : 2} fill={TEAL} opacity={fade} />;
                })}
              </g>
            );
          })()}

          {/* sparse particles constrained to accent paths */}
          {accentPaths.map(({p, i}, k) => {
            const period = fps * (7 + k * 2);
            const t = ((frame + k * 130) % period) / period;
            const x = cbez(p.x0, p.x1, p.x2, p.x3, t);
            const y = cbez(p.y0, p.y1, p.y2, p.y3, t);
            const twinkle = 0.4 + 0.5 * Math.abs(Math.sin((frame + i * 20) / 18));
            return (
              <circle
                key={`pt${i}`}
                cx={x}
                cy={y}
                r={1.8}
                fill={particleColor}
                opacity={twinkle * 0.75 * intensity}
              />
            );
          })}
        </g>

        {/* edge vignette */}
        <rect x="0" y="0" width={W} height={H} fill={`url(#vig-${uid})`} />
      </svg>
    </AbsoluteFill>
  );
};
