import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ACCENT, BG, INK, INK_2, INK_3, LINE_2, OK, REVIEW, SANS} from './tokens';

/**
 * The pipeline, drawn.
 *
 * This beat used to play a screen recording of the product's own "How it works"
 * overlay while the narration described four steps. Footage of a page that
 * explains a pipeline is a worse way to show a pipeline than the pipeline: the
 * words name four stages and a stopping rule, and none of the four were legible
 * in the recording at 1920 wide.
 *
 * Everything here is drawn, so it scales, themes with the film, and stays sharp
 * at any render size. The colours are the product's own semantic tokens rather
 * than film decoration — periwinkle for what the machine computes, aqua for what
 * is verified, peach for where a person is required. By the time a viewer
 * reaches the product footage they have already been taught that vocabulary.
 *
 * The motion is one idea: a signal enters at the left and stops dead at the
 * right. The last stage does not resolve into a tick, because the claim the
 * narration makes over this frame is "and stops where the source stops" — an
 * animation that completed would contradict the sentence playing over it.
 */

type Stage = {
  key: string;
  label: string;
  note: string;
  tone: string;
  icon: (color: string) => React.ReactNode;
};

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
  vectorEffect: 'non-scaling-stroke' as const,
});

const STAGES: Stage[] = [
  {
    key: 'fetch',
    label: 'Fetch the source',
    note: 'from sebi.gov.in',
    tone: ACCENT,
    icon: (c) => (
      <g {...stroke(c)}>
        <path d="M7 3.4h7l4 4v9.2a1.6 1.6 0 0 1-1.6 1.6H7a1.6 1.6 0 0 1-1.6-1.6V5a1.6 1.6 0 0 1 1.6-1.6Z" />
        <path d="M14 3.4V7h4" />
        <path d="M12 10.2v4.6" />
        <path d="m9.9 12.7 2.1 2.1 2.1-2.1" />
      </g>
    ),
  },
  {
    key: 'read',
    label: 'Read it',
    note: 'every passage',
    tone: ACCENT,
    icon: (c) => (
      <g {...stroke(c)}>
        <path d="M2.8 12s3.4-5 9.2-5 9.2 5 9.2 5-3.4 5-9.2 5-9.2-5-9.2-5Z" />
        <circle cx="12" cy="12" r="2.5" />
      </g>
    ),
  },
  {
    key: 'compare',
    label: 'Compare',
    note: 'against the control',
    tone: OK,
    icon: (c) => (
      <g {...stroke(c)}>
        <path d="M12 4.2v15.4" />
        <path d="M5.6 7.4h12.8" />
        <path d="M5.6 7.4 3 13a3 3 0 0 0 5.2 0Z" />
        <path d="M18.4 7.4 15.8 13a3 3 0 0 0 5.2 0Z" />
        <path d="M8.4 19.6h7.2" />
      </g>
    ),
  },
  {
    key: 'record',
    label: 'Record a decision',
    note: 'signed by a person',
    tone: REVIEW,
    icon: (c) => (
      <g {...stroke(c)}>
        <path d="M15 4.2 19.4 8.6l-8 8-4.7 1.1 1.1-4.7Z" />
        <path d="M13.3 5.9 17.7 10.3" />
        <path d="M4 20.4h16" />
      </g>
    ),
  },
];

const NODE = 108;
const GAP = 92;

export const PipelineBeat: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  /* Each stage rises from below, staggered. Bottom-up because the film reads
     downward everywhere else, and because a stage that arrives from beneath the
     line it joins reads as being ADDED to a process rather than revealed on a
     slide. */
  const stageIn = (index: number) =>
    spring({
      frame: frame - 14 - index * 11,
      fps,
      config: {damping: 200, mass: 0.75, stiffness: 92},
    });

  /* The signal. It reaches stage n at `arrive(n)` and never returns. */
  const travel = interpolate(frame, [56, 56 + 118], [0, STAGES.length - 1 + 0.55], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.25, 1),
  });

  /* A very slow push-in. Large enough to keep the frame alive under 13 seconds
     of narration, small enough that nobody notices it as a camera move. */
  const push = interpolate(frame, [0, durationInFrames], [1, 1.035], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  const headingIn = spring({frame: frame - 4, fps, config: {damping: 200, mass: 0.7, stiffness: 96}});

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 96,
        fontFamily: SANS,
        transform: `scale(${push})`,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 15,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: INK_3,
          opacity: headingIn,
          transform: `translateY(${interpolate(headingIn, [0, 1], [14, 0])}px)`,
        }}
      >
        How it works
      </p>
      <h2
        style={{
          margin: '18px 0 74px',
          fontSize: 52,
          lineHeight: 1.1,
          fontWeight: 660,
          color: INK,
          letterSpacing: '-0.02em',
          opacity: headingIn,
          transform: `translateY(${interpolate(headingIn, [0, 1], [22, 0])}px)`,
        }}
      >
        Four steps, and a place it stops
      </h2>

      <div style={{display: 'flex', alignItems: 'flex-start'}}>
        {STAGES.map((stage, index) => {
          const rise = stageIn(index);
          const lit = interpolate(travel, [index - 0.35, index], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const color = lit > 0.5 ? stage.tone : INK_3;
          return (
            <div key={stage.key} style={{display: 'flex', alignItems: 'flex-start'}}>
              <div
                style={{
                  width: 208,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  opacity: rise,
                  transform: `translateY(${interpolate(rise, [0, 1], [34, 0])}px)`,
                }}
              >
                <div
                  style={{
                    width: NODE,
                    height: NODE,
                    borderRadius: 999,
                    border: `1px solid ${lit > 0.5 ? stage.tone : LINE_2}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow:
                      lit > 0.02
                        ? `0 0 ${26 * lit}px ${-6 * lit}px ${stage.tone}66`
                        : 'none',
                    transition: 'none',
                  }}
                >
                  <svg width={44} height={44} viewBox="0 0 24 24">
                    {stage.icon(color)}
                  </svg>
                </div>
                <p
                  style={{
                    margin: '22px 0 0',
                    fontSize: 21,
                    fontWeight: 620,
                    color: lit > 0.5 ? INK : INK_2,
                    textAlign: 'center',
                  }}
                >
                  {stage.label}
                </p>
                <p style={{margin: '7px 0 0', fontSize: 15, color: INK_3, textAlign: 'center'}}>
                  {stage.note}
                </p>
              </div>

              {index < STAGES.length - 1 && (
                <svg
                  width={GAP}
                  height={NODE}
                  viewBox={`0 0 ${GAP} ${NODE}`}
                  style={{marginLeft: -58, marginRight: -58, overflow: 'visible'}}
                >
                  <path
                    d={`M2 ${NODE / 2}H${GAP - 2}`}
                    {...stroke(LINE_2)}
                    strokeWidth={1.4}
                  />
                  <path
                    d={`M2 ${NODE / 2}H${GAP - 2}`}
                    {...stroke(STAGES[index + 1].tone)}
                    strokeWidth={2}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={
                      1 -
                      interpolate(travel, [index, index + 1], [0, 1], {
                        extrapolateLeft: 'clamp',
                        extrapolateRight: 'clamp',
                      })
                    }
                  />
                </svg>
              )}
            </div>
          );
        })}

        {/* Where it stops. A blunt terminator, not a tick — the line arrives and
            ends, which is the sentence playing over this frame. */}
        <svg width={132} height={NODE} viewBox={`0 0 132 ${NODE}`} style={{marginLeft: -58, overflow: 'visible'}}>
          <path d={`M2 ${NODE / 2}H86`} {...stroke(LINE_2)} strokeWidth={1.4} />
          <path
            d={`M2 ${NODE / 2}H86`}
            {...stroke(REVIEW)}
            strokeWidth={2}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={
              1 -
              interpolate(travel, [STAGES.length - 1, STAGES.length - 1 + 0.5], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            }
          />
          <path
            d={`M88 ${NODE / 2 - 22}V${NODE / 2 + 22}`}
            {...stroke(REVIEW)}
            strokeWidth={3}
            opacity={interpolate(travel, [STAGES.length - 1 + 0.34, STAGES.length - 1 + 0.5], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}
          />
        </svg>
      </div>

      <p
        style={{
          margin: '58px 0 0',
          fontSize: 25,
          color: INK_2,
          opacity: interpolate(frame, [180, 205], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          transform: `translateY(${interpolate(frame, [180, 205], [16, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })}px)`,
        }}
      >
        and it stops wherever the source stops
      </p>
    </div>
  );
};
