import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

// ————————————————————————————————————————————————————————————————
// Motion tokens (frames @ 60fps) — single source of truth for timing.
// ————————————————————————————————————————————————————————————————
export const T = {
  micro: 10, // micro interaction
  entrance: 16, // UI entrance
  major: 30, // major scene entrance
  push: 40, // camera push-in
  wordSwap: 20, // word replacement
  stagger: 6, // between cards
  overlap: 12, // transition overlap
  overshoot: 0.03, // 2–4%
  inspectScale: 1.12, // camera inspection scale
  inspectMax: 1.22, // Inspector max
  echo: 3, // directional velocity echo
} as const;

type ScaleKey = [number, number]; // [localFrame, scale]

/**
 * Cinematic camera over its children: interpolates scale across keyframes and
 * pushes toward a focus origin. Establish (1.0) → push-in to a clause/field/etc.
 * `origin` is a CSS transform-origin ("62% 44%") pointing at the area of interest.
 */
export const CameraRig: React.FC<{
  children: React.ReactNode;
  scale: ScaleKey[];
  origin?: string;
  /** optional px pan, keyed [frame, px] */
  panX?: ScaleKey[];
  panY?: ScaleKey[];
  style?: React.CSSProperties;
}> = ({children, scale, origin = '50% 50%', panX, panY, style}) => {
  const frame = useCurrentFrame();
  const s = interpolate(
    frame,
    scale.map((k) => k[0]),
    scale.map((k) => k[1]),
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const tx = panX
    ? interpolate(frame, panX.map((k) => k[0]), panX.map((k) => k[1]), {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;
  const ty = panY
    ? interpolate(frame, panY.map((k) => k[0]), panY.map((k) => k[1]), {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${tx}px, ${ty}px) scale(${s})`,
        transformOrigin: origin,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Parallax layer: translate by a fraction of a shared driver value. */
export const Parallax: React.FC<{
  children: React.ReactNode;
  depth: number; // 0 = static bg, 1 = full foreground
  driftPx?: number;
  style?: React.CSSProperties;
}> = ({children, depth, driftPx = 40, style}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * driftPx * depth;
  return (
    <AbsoluteFill style={{transform: `translateX(${drift}px)`, ...style}}>
      {children}
    </AbsoluteFill>
  );
};

/** Focus mask: dims everything except an unmasked rect, to spotlight one field. */
export const FocusMask: React.FC<{
  active: boolean;
  rect: {x: number; y: number; w: number; h: number}; // px in a 1920×1080 frame
  intensity?: number;
  progress: number; // 0→1 dim-in
}> = ({rect, intensity = 0.55, progress}) => {
  return (
    <AbsoluteFill style={{pointerEvents: 'none', zIndex: 40}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <defs>
          <mask id="focusHole">
            <rect x={0} y={0} width={1920} height={1080} fill="white" />
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.w}
              height={rect.h}
              rx={14}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x={0}
          y={0}
          width={1920}
          height={1080}
          fill="rgba(4,8,20,1)"
          opacity={intensity * progress}
          mask="url(#focusHole)"
        />
      </svg>
    </AbsoluteFill>
  );
};
