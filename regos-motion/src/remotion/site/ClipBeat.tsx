import React from 'react';
import {
  Easing,
  interpolate,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {MotionBlur} from './motion';
import {BG, BRAND, INK_2, INK_3, LINE, LINE_2, MONO, SANS} from './tokens';

/**
 * One beat of real product footage.
 *
 * The recording is the hero — it occupies ~88% of the frame inside a browser
 * shell, because a small dashboard floating in negative space is the fastest way
 * to read as a placeholder rather than a product.
 *
 * The push-in is deliberately tiny (1 → 1.022) and eased. There is no cursor to
 * motivate a real camera move here, and a large unmotivated zoom over a screen
 * recording is the clearest template tell in this whole format. It exists only
 * to keep the frame from feeling frozen under a long narration line.
 *
 * THE CAPTION SAFE AREA is the important thing in this file.
 *
 * Three independent passes over the rendered frames found the same defect in
 * eight different places, and it was always the same defect: the caption plate
 * is pinned near the bottom of the canvas, the footage runs all the way down
 * behind it, and so a live sentence in the product gets sliced in half by the
 * plate's edge — "WAITING ON YOU" rendering as "NG ON YOU", a legal disclaimer
 * cut mid-word, a table row guillotined. Fixing those one at a time would mean
 * re-framing every clip against a plate whose height depends on how long that
 * beat's narration happens to be.
 *
 * So the frame itself is fixed instead: everything below FADE_TOP dissolves
 * into the stage colour. Text no longer terminates at a hard edge because there
 * is no hard edge — it recedes. One gradient closes the whole class, survives
 * re-capture, and costs nothing to maintain.
 */

/** Where the footage starts dissolving into the stage. Above the caption plate. */
const FADE_TOP = 828;
export const ClipBeat: React.FC<{
  clip: string;
  clipStart: number;
  label: string | null;
  durationInFrames: number;
}> = ({clip, clipStart, label, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const rise = spring({frame, fps, config: {damping: 200, mass: 0.7, stiffness: 90}});
  const enter = interpolate(rise, [0, 1], [26, 0]);
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const push = interpolate(frame, [0, durationInFrames], [1, 1.022], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  /* The rig's entrance blurs on the axis it travels. Velocity is differentiated
     from the same spring that drives the offset, so the smear peaks exactly at
     the fastest frame and is gone the moment the rig settles. */
  const enterAt = (f: number) =>
    interpolate(spring({frame: f, fps, config: {damping: 200, mass: 0.7, stiffness: 90}}), [0, 1], [26, 0]);
  const enterVelocity = Math.abs(enterAt(frame) - enterAt(frame - 1));

  /* The label is an annotation, not part of the screenshot, so it arrives after
     the rig has landed rather than baked into the same move. */
  const labelIn = interpolate(frame, [14, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BG,
      }}
    >
      {/* Ambient light under the rig, so it sits in a room rather than on a void. */}
      <div
        style={{
          position: 'absolute',
          width: 1760,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${BRAND}09, transparent 68%)`,
          filter: 'blur(70px)',
          opacity,
        }}
      />

      <MotionBlur
        velocity={enterVelocity}
        style={{
          width: '88%',
          maxWidth: 1720,
          transform: `translateY(${enter}px) scale(${push})`,
          opacity,
        }}
      >
        {/* Browser shell. Real chrome, no fake tab strip clutter. */}
        <div
          style={{
            borderRadius: 16,
            border: `1px solid ${LINE_2}`,
            backgroundColor: '#0d0e10',
            overflow: 'hidden',
            boxShadow: '0 40px 90px -34px rgba(0,0,0,0.95)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 18px',
              borderBottom: `1px solid ${LINE}`,
              backgroundColor: '#101114',
            }}
          >
            {/* Flat #3a3c40 on a #101114 bar read as a smudge rather than window
                controls. A rim and a highlight give them a shape at 1920. */}
            <span style={{display: 'flex', gap: 7}}>
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 999,
                    backgroundColor: '#4a4d52',
                    border: '1px solid #5b5f66',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
                  }}
                />
              ))}
            </span>
            <span
              style={{
                flex: 1,
                padding: '6px 14px',
                borderRadius: 8,
                border: `1px solid ${LINE}`,
                backgroundColor: '#08090b',
                fontFamily: MONO,
                fontSize: 15,
                color: INK_3,
              }}
            >
              regos-sentinel.vercel.app
            </span>
            {label ? (
              <span
                style={{
                  padding: '5px 12px',
                  borderRadius: 999,
                  border: `1px solid ${LINE_2}`,
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: INK_2,
                  opacity: labelIn,
                  transform: `translateY(${interpolate(labelIn, [0, 1], [-8, 0])}px)`,
                  display: 'inline-block',
                }}
              >
                {label}
              </span>
            ) : null}
          </div>

          <OffthreadVideo
            src={staticFile(`capture/${clip}.mp4`)}
            startFrom={Math.round(clipStart * fps)}
            muted
            style={{display: 'block', width: '100%', height: 'auto'}}
          />
        </div>
      </MotionBlur>

      {/* The caption safe area. Everything below FADE_TOP recedes into the stage,
          so no live sentence is ever cut off at the plate's edge. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: FADE_TOP,
          bottom: 0,
          background: `linear-gradient(to bottom, transparent, ${BG} 62%)`,
          pointerEvents: 'none',
        }}
      />

      {/* A hairline that says the film is real footage, not a mock. */}
      <div
        style={{
          position: 'absolute',
          top: 34,
          left: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          opacity: 0.9,
        }}
      >
        <span
          style={{width: 8, height: 8, borderRadius: 999, backgroundColor: BRAND}}
        />
        <span
          style={{
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: INK_3,
          }}
        >
          Recorded on the live product
        </span>
      </div>
    </div>
  );
};
