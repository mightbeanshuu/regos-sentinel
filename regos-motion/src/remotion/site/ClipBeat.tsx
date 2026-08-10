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
 */
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
      <div
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
            <span style={{display: 'flex', gap: 7}}>
              {['#3a3c40', '#3a3c40', '#3a3c40'].map((dot, index) => (
                <span
                  key={index}
                  style={{width: 11, height: 11, borderRadius: 999, backgroundColor: dot}}
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
      </div>

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
