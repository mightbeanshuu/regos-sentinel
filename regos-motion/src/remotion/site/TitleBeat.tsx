import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {BG, BRAND, INK, INK_3, LINE, SANS} from './tokens';

/** The shield, drawn rather than imported, so it scales and themes with the film. */
const Shield: React.FC<{size: number; progress: number}> = ({size, progress}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2.6 4.6 5.4v5.9c0 4.6 3.1 8.4 7.4 9.6 4.3-1.2 7.4-5 7.4-9.6V5.4Z"
      stroke={BRAND}
      strokeWidth={1.6}
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - progress}
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

/**
 * The two beats with no product on screen: the problem, and the sign-off.
 *
 * Both are pure type on the stage colour. The words are the content, so nothing
 * moves once they land — the headline settles and then holds absolutely still
 * while the narration finishes the thought.
 */
export const TitleBeat: React.FC<{
  variant: 'hook' | 'close';
  durationInFrames: number;
}> = ({variant, durationInFrames}) => {
  const frame = useCurrentFrame();

  const draw = interpolate(frame, [6, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  const fade = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [0, 20], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isHook = variant === 'hook';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
        backgroundColor: BG,
        opacity: out,
      }}
    >
      <div style={{opacity: fade, transform: `translateY(${rise}px)`}}>
        <Shield size={variant === 'close' ? 92 : 62} progress={draw} />
      </div>

      <div
        style={{
          maxWidth: 1380,
          padding: '0 60px',
          textAlign: 'center',
          opacity: fade,
          transform: `translateY(${rise}px)`,
        }}
      >
        {isHook ? (
          <>
            <p
              style={{
                margin: '0 0 20px',
                fontFamily: SANS,
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: INK_3,
              }}
            >
              SEBI CSCRF · the question underneath
            </p>
            <h1
              style={{
                margin: 0,
                fontFamily: SANS,
                fontSize: 82,
                lineHeight: 1.08,
                fontWeight: 680,
                letterSpacing: '-0.032em',
                color: INK,
                textWrap: 'balance',
              }}
            >
              One week.
              <br />
              <span style={{color: BRAND}}>From when?</span>
            </h1>
          </>
        ) : (
          <>
            <h1
              style={{
                margin: '0 0 22px',
                fontFamily: SANS,
                fontSize: 88,
                lineHeight: 1.04,
                fontWeight: 680,
                letterSpacing: '-0.034em',
                color: INK,
              }}
            >
              RegOS Sentinel
            </h1>
            <p
              style={{
                margin: 0,
                fontFamily: SANS,
                fontSize: 31,
                lineHeight: 1.45,
                fontWeight: 450,
                color: INK_3,
                textWrap: 'balance',
              }}
            >
              Decision support that shows its work — and stops where the source stops.
            </p>
          </>
        )}
      </div>

      {variant === 'close' ? (
        <div
          style={{
            marginTop: 14,
            paddingTop: 22,
            borderTop: `1px solid ${LINE}`,
            width: 620,
            textAlign: 'center',
            opacity: fade,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: SANS,
              fontSize: 16,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: INK_3,
            }}
          >
            regos-sentinel.vercel.app
          </p>
        </div>
      ) : null}
    </div>
  );
};
