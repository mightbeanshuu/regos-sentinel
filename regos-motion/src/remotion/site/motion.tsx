import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';

/**
 * Motion blur, done the way a renderer would rather than the way a filter would.
 *
 * `@remotion/motion-blur` is installed and used for the one element that needs a
 * true multi-sample trail (the scan sweep). Everything else uses this, which is
 * cheaper and — for the motion in this film — more correct.
 *
 * The distinction matters. A CSS `blur()` is isotropic: it smears a rising card
 * sideways as much as vertically, which reads as "out of focus", not "moving".
 * Real motion blur is anisotropic and aligned to the direction of travel. An SVG
 * `feGaussianBlur` takes stdDeviation as a PAIR, so `0 6` blurs only on Y — a
 * card that rises fast leaves a vertical smear and none at all horizontally,
 * which is what a camera actually records.
 *
 * The amount is derived from velocity, never authored by hand. `useVelocity`
 * samples the same animation one frame back and differentiates it, so the blur
 * is a consequence of the movement: it peaks exactly when the element is
 * fastest and reaches zero the moment it settles. Hand-keyed blur always lags
 * the motion it is meant to belong to, and the eye catches it.
 */

/** Differentiate any frame-driven value: px moved between this frame and the last. */
export const useVelocity = (valueAt: (frame: number) => number): number => {
  const frame = useCurrentFrame();
  return Math.abs(valueAt(frame) - valueAt(frame - 1));
};

let filterSeq = 0;
const nextId = () => `mb${(filterSeq += 1)}`;

export const MotionBlur: React.FC<{
  /** px/frame of travel; 0 renders no filter at all. */
  velocity: number;
  axis?: 'y' | 'x';
  /** Blur px per px/frame of velocity. */
  scale?: number;
  /** Beyond this the smear stops reading as motion and starts reading as fog. */
  max?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({velocity, axis = 'y', scale = 0.34, max = 9, children, style}) => {
  const id = React.useMemo(nextId, []);
  const sigma = Math.min(velocity * scale, max);

  // Below a third of a pixel the filter costs a full offscreen pass to change
  // nothing a viewer can see, so the element renders unwrapped instead.
  if (sigma < 0.3) {
    return <div style={style}>{children}</div>;
  }

  const dev = axis === 'y' ? `0 ${sigma.toFixed(2)}` : `${sigma.toFixed(2)} 0`;
  return (
    <div style={{...style, filter: `url(#${id})`}}>
      <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
        <defs>
          <filter id={id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={dev} />
          </filter>
        </defs>
      </svg>
      {children}
    </div>
  );
};

/**
 * The film's one entrance: rise from below, decelerate hard, blur while fast.
 *
 * Every panel in the product itself enters this way, so the film and the app
 * move alike. Returning the velocity alongside the offset is what lets the
 * caller blur without duplicating the easing curve — two copies of an easing
 * curve drift the moment one is edited.
 */
export const useRise = (start: number, distance = 34, length = 26) => {
  const frame = useCurrentFrame();
  const at = (f: number) =>
    interpolate(f, [start, start + length], [distance, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => 1 - Math.pow(1 - t, 3.2),
    });
  const opacity = interpolate(frame, [start, start + Math.round(length * 0.6)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return {y: at(frame), velocity: Math.abs(at(frame) - at(frame - 1)), opacity};
};
