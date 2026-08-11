import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {MotionBlur, useRise} from './motion';
import {ACCENT, BG, INK, INK_2, INK_3, LINE, LINE_2, MONO, OK, REVIEW, SANS} from './tokens';

/**
 * The timing classifier, drawn.
 *
 * This beat did not exist until 2026-08-11. Twenty-one beats covered the
 * product and not one of them said that the reading is done by a model we
 * trained — which, in a problem statement called Agentic Compliance and a
 * rubric that scores the tech stack, was the largest omission in the film.
 *
 * It is drawn rather than filmed because there is nothing to film: the model is
 * a `POST /api/v1/model/explain` response. The screen that shows its verdict is
 * already the `upload_case` beat; what is missing there is WHY the verdict is
 * what it is, and that lives in the weights.
 *
 * EVERY FIGURE IS REAL, from `services/api/app/model/weights.json` as
 * regenerated on 2026-08-11:
 *
 *   document-held-out accuracy   0.8423   (36 SEBI sources, 317 real sentences)
 *   PERIOD_ONLY recall           0.9459
 *   trained on                   388 hand-labelled sentences
 *   duration_without_clock_start +2.07 toward PERIOD_ONLY
 *   periodicity_word             +2.45 toward PERIOD_ONLY
 *   has_absolute_date            +3.82 toward PERIOD_AND_TRIGGER
 *   urgency_strong               +2.05 toward URGENCY_ONLY
 *
 * The sentence being read is the one from the 23 July 2026 transmission
 * circular that the product scores PERIOD_ONLY at 0.9799 — the same sentence
 * the `upload_case` beat shows on screen, so the two beats are provably about
 * the same passage.
 *
 * COLOUR follows the film's vocabulary and not the model's structure:
 * periwinkle while the model is computing, aqua once the fixed rule has agreed
 * independently, peach for the part a person still owns. The bars are NOT
 * coloured per feature — that would spend meaning on decoration.
 */

type Weight = {name: string; value: number; gloss: string};

/* The four largest named weights, in the order the model ranks them. Token
   features are excluded: they are real but unquotable, and a bar labelled
   `tok:necessary` teaches a viewer nothing. */
const WEIGHTS: Weight[] = [
  {name: 'has_absolute_date', value: 3.82, gloss: 'a date is written down'},
  {name: 'periodicity_word', value: 2.45, gloss: '“quarterly”, “annual”'},
  {name: 'duration_without_clock_start', value: 2.07, gloss: 'how long, but not from when'},
  {name: 'urgency_strong', value: 2.05, gloss: '“immediately”, “promptly”'},
];

const MAX_WEIGHT = 3.82;

/* The passage under the lens — verbatim, and the same one the upload beat shows. */
const PASSAGE =
  'Processing entities shall provide monthly reports … for a period of 6 months.';

const phasesFrom = (lines: {startFrame: number; durationFrames: number}[]) => {
  const at = (n: number, fallback: number) => lines[n]?.startFrame ?? fallback;
  return {
    passageIn: at(0, 0) + 4,
    weighing: at(1, 140) - 12,
    verdict: at(1, 140) + 44,
    rule: at(2, 280) + 8,
  };
};

/** One learned weight. The bar grows because the model is weighing, not to decorate. */
const Bar: React.FC<{w: Weight; index: number; progress: number; hero: boolean}> = ({
  w,
  index,
  progress,
  hero,
}) => {
  /* Bars fill in sequence so the eye reads them in rank order rather than
     seeing four things move at once. */
  const local = interpolate(progress, [index * 0.13, index * 0.13 + 0.55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 0, 0.15, 1),
  });
  const tone = hero ? ACCENT : INK_3;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 20, height: 46}}>
      <div style={{width: 470, textAlign: 'right'}}>
        <p
          style={{
            margin: 0,
            fontSize: 17,
            fontFamily: MONO,
            color: hero ? INK : INK_2,
            letterSpacing: '-0.01em',
          }}
        >
          {w.name}
        </p>
        <p style={{margin: '2px 0 0', fontSize: 13.5, color: INK_3}}>{w.gloss}</p>
      </div>

      <div style={{width: 420, height: 9, borderRadius: 5, background: LINE_2, overflow: 'hidden'}}>
        <div
          style={{
            width: `${(w.value / MAX_WEIGHT) * local * 100}%`,
            height: '100%',
            background: tone,
            boxShadow: hero ? `0 0 16px ${tone}aa` : 'none',
          }}
        />
      </div>

      <span
        style={{
          fontSize: 16.5,
          fontFamily: MONO,
          color: hero ? ACCENT : INK_3,
          width: 62,
          opacity: local,
        }}
      >
        +{w.value.toFixed(2)}
      </span>
    </div>
  );
};

export const ModelBeat: React.FC<{
  durationInFrames: number;
  lines: {startFrame: number; durationFrames: number}[];
}> = ({durationInFrames, lines}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = phasesFrom(lines);

  const heading = useRise(0, 22, 24);
  const passage = useRise(T.passageIn, 34, 26);

  const weighing = interpolate(frame, [T.weighing, T.weighing + 68], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const verdictIn = spring({
    frame: frame - T.verdict,
    fps,
    config: {damping: 200, mass: 0.8, stiffness: 88},
  });
  const ruleIn = spring({
    frame: frame - T.rule,
    fps,
    config: {damping: 200, mass: 0.8, stiffness: 88},
  });
  const agreed = ruleIn > 0.5;

  /* The confidence counts up as the model computes it — a number that is being
     worked out, not a number being displayed. */
  const confidence = interpolate(frame, [T.verdict, T.verdict + 30], [0, 0.9799], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0, 0.1, 1),
  });

  const push = interpolate(frame, [0, durationInFrames], [1, 1.024], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

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
        paddingBottom: 92,
        fontFamily: SANS,
        transform: `scale(${push})`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 1680,
          height: 540,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${agreed ? OK : ACCENT}0c, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      <MotionBlur
        velocity={heading.velocity}
        style={{
          opacity: heading.opacity,
          transform: `translateY(${heading.y}px)`,
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14.5,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: INK_3,
          }}
        >
          The model
        </p>
        <h2
          style={{
            margin: '14px 0 34px',
            fontSize: 46,
            fontWeight: 660,
            color: INK,
            letterSpacing: '-0.022em',
          }}
        >
          We did not call an API. We trained it.
        </h2>
      </MotionBlur>

      {/* ---- The passage under the lens ------------------------------------ */}
      <MotionBlur
        velocity={passage.velocity}
        style={{
          opacity: passage.opacity,
          transform: `translateY(${passage.y}px)`,
          zIndex: 1,
          width: 1180,
        }}
      >
        <div
          style={{
            borderRadius: 14,
            border: `1px solid ${LINE_2}`,
            background: '#0b0c0f',
            padding: '20px 26px',
            marginBottom: 30,
          }}
        >
          <p style={{margin: 0, fontSize: 21, lineHeight: 1.5, color: INK}}>{PASSAGE}</p>
          <p style={{margin: '10px 0 0', fontSize: 14, color: INK_3, fontFamily: MONO}}>
            SEBI · 23 July 2026 · page 3
          </p>
        </div>
      </MotionBlur>

      {/* ---- What it weighs -------------------------------------------------- */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 6, zIndex: 1}}>
        {WEIGHTS.map((w, i) => (
          <Bar
            key={w.name}
            w={w}
            index={i}
            progress={weighing}
            hero={w.name === 'duration_without_clock_start'}
          />
        ))}
      </div>

      {/* ---- The verdict, then a second reader that agrees ------------------- */}
      <div style={{display: 'flex', gap: 18, marginTop: 34, zIndex: 1, alignItems: 'stretch'}}>
        <div
          style={{
            opacity: verdictIn,
            transform: `translateY(${interpolate(verdictIn, [0, 1], [16, 0])}px)`,
            borderRadius: 13,
            border: `1px solid ${ACCENT}44`,
            background: `${ACCENT}0b`,
            padding: '15px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <span style={{fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: INK_3}}>
            The model
          </span>
          <span style={{fontSize: 19, fontFamily: MONO, color: ACCENT, fontWeight: 600}}>
            PERIOD_ONLY
          </span>
          <span style={{fontSize: 19, fontFamily: MONO, color: INK}}>
            {(confidence * 100).toFixed(2)}%
          </span>
        </div>

        <div
          style={{
            opacity: ruleIn,
            transform: `translateY(${interpolate(ruleIn, [0, 1], [16, 0])}px)`,
            borderRadius: 13,
            border: `1px solid ${agreed ? OK + '4d' : LINE_2}`,
            background: agreed ? `${OK}0b` : '#0b0c0f',
            padding: '15px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <span style={{fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: INK_3}}>
            The fixed rule
          </span>
          <span style={{fontSize: 19, fontFamily: MONO, color: agreed ? OK : INK_2, fontWeight: 600}}>
            agrees, separately
          </span>
        </div>
      </div>

      {/* The honest number, and the one thing neither reader may do. */}
      <p
        style={{
          margin: '26px 0 0',
          fontSize: 16,
          color: INK_3,
          fontFamily: MONO,
          zIndex: 1,
          opacity: interpolate(frame, [T.rule + 20, T.rule + 40], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        388 sentences · 36 SEBI sources · 0.842 on documents it has never seen
      </p>
      <p
        style={{
          margin: '10px 0 0',
          fontSize: 16,
          color: REVIEW,
          zIndex: 1,
          opacity: interpolate(frame, [T.rule + 30, T.rule + 50], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        Neither of them may write a date. That is still a person’s to give.
      </p>
    </div>
  );
};
