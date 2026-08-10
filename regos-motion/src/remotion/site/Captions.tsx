import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {BG, INK, LINE_2, SANS} from './tokens';

export type CaptionLine = {
  text: string;
  src: string;
  startFrame: number;
  durationFrames: number;
};

/**
 * Captions live OUTSIDE the camera rig, deliberately.
 *
 * The rig scales and can blur during a push-in; anything the viewer has to read
 * must stay sharp, level and still, so the caption plate is a sibling of the
 * product, never a child of it.
 *
 * Each line is shown for exactly as long as its own audio file lasts. That is
 * only possible because the voice track is rendered one sentence per file — a
 * single blob of narration would force an estimate, and an estimated caption
 * drifts visibly by the third line of a four-minute film.
 */
export const Captions: React.FC<{lines: CaptionLine[]}> = ({lines}) => {
  const frame = useCurrentFrame();
  const active = lines.find(
    (line) => frame >= line.startFrame && frame < line.startFrame + line.durationFrames,
  );
  // Hold the last line through the beat's trailing pad so the plate does not
  // blink out a beat early; only a beat with no line yet renders nothing.
  const shown = active ?? (frame >= (lines[0]?.startFrame ?? 0) ? lines[lines.length - 1] : null);
  if (!shown) return null;

  const local = frame - shown.startFrame;
  const opacity = interpolate(local, [0, 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(local, [0, 8], [8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 54,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: '0 24px',
          padding: '18px 30px',
          borderRadius: 14,
          border: `1px solid ${LINE_2}`,
          // Opaque, not translucent: a see-through plate over a dark dashboard
          // puts two layers of text on top of each other.
          backgroundColor: BG,
          boxShadow: '0 18px 44px -18px rgba(0,0,0,0.95)',
          opacity,
          transform: `translateY(${rise}px)`,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: SANS,
            fontSize: 30,
            lineHeight: 1.42,
            fontWeight: 500,
            letterSpacing: '-0.005em',
            color: INK,
            textAlign: 'center',
            textWrap: 'balance',
          }}
        >
          {shown.text}
        </p>
      </div>
    </div>
  );
};
