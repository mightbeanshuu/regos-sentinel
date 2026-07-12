import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {ROYAL, TEAL, WHITE} from '../constants';

// ————————————————————————————————————————————————————————————————
// SentinelMarkSVG — the RegOS brand mark: a shield whose outline draws,
// fills with a royal→teal gradient, then stamps a teal verification tick
// and one expanding ring. useId'd defs (no duplicate IDs), pathLength
// stroke reveal, non-scaling stroke. Deterministic.
// ————————————————————————————————————————————————————————————————

export const SentinelMarkSVG: React.FC<{
  size?: number;
  /** override the internal timeline start (frames) */
  delay?: number;
  /** freeze fully-built (for static contexts / gallery) */
  built?: boolean;
}> = ({size = 160, delay = 0, built = false}) => {
  const frame = useCurrentFrame();
  const f = built ? 240 : Math.max(0, frame - delay);
  const uid = React.useId().replace(/:/g, '');

  const draw = interpolate(f, [0, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fill = interpolate(f, [22, 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tick = interpolate(f, [44, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ringR = interpolate(f, [50, 78], [30, 74], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ringO = interpolate(f, [50, 78], [0.5, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const shield = 'M50 8 L84 22 V50 C84 72 68 86 50 92 C32 86 16 72 16 50 V22 Z';

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`sm-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={ROYAL} />
          <stop offset="100%" stopColor={TEAL} />
        </linearGradient>
      </defs>
      {/* verification ring */}
      {ringO > 0.01 && (
        <circle cx="50" cy="52" r={ringR} fill="none" stroke={TEAL} strokeWidth="1.5" opacity={ringO} />
      )}
      {/* filled body */}
      <path d={shield} fill={`url(#sm-${uid})`} opacity={fill * 0.9} />
      {/* drawing outline */}
      <path
        d={shield}
        fill="none"
        stroke={TEAL}
        strokeWidth="2.5"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
        vectorEffect="non-scaling-stroke"
      />
      {/* verification tick */}
      <path
        d="M35 51 L46 62 L67 39"
        fill="none"
        stroke={WHITE}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - tick}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
