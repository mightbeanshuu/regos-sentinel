import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';

// SaaS-grade camera easing — fast start, long deceleration to rest (easeOutExpo-ish).
// This is what makes a zoom feel physical instead of a flat linear ramp.
const ZOOM_EASE = Easing.bezier(0.22, 1, 0.36, 1);

/**
 * Per-segment eased keyframe sampler. Each [frame, value] transition eases
 * independently, so a push-in decelerates into its hold and the hold stays
 * perfectly flat (unlike interpolate() applying one easing across all points).
 */
const easedKeyframes = (frame: number, keys: [number, number][], easing = ZOOM_EASE) => {
  if (keys.length === 0) return 0;
  if (frame <= keys[0][0]) return keys[0][1];
  const last = keys[keys.length - 1];
  if (frame >= last[0]) return last[1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i];
    const [f1, v1] = keys[i + 1];
    if (frame >= f0 && frame <= f1) {
      if (v0 === v1 || f1 === f0) return v0; // flat hold — no easing needed
      const t = (frame - f0) / (f1 - f0);
      return v0 + (v1 - v0) * easing(t);
    }
  }
  return last[1];
};

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
  const s = easedKeyframes(frame, scale);
  const tx = panX ? easedKeyframes(frame, panX) : 0;
  const ty = panY ? easedKeyframes(frame, panY) : 0;

  // motion blur — blur the frame proportional to camera velocity, sharp at rest.
  const sPrev = easedKeyframes(frame - 1, scale);
  const txPrev = panX ? easedKeyframes(frame - 1, panX) : 0;
  const tyPrev = panY ? easedKeyframes(frame - 1, panY) : 0;
  const vel = Math.abs(s - sPrev) * 1600 + Math.hypot(tx - txPrev, ty - tyPrev);
  const blur = Math.min(9, vel * 0.6);
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${tx}px, ${ty}px) scale(${s})`,
        transformOrigin: origin,
        filter: blur > 0.25 ? `blur(${blur}px)` : undefined,
        willChange: 'transform, filter',
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
