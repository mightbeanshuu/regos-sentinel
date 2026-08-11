import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {MotionBlur, useRise} from './motion';
import {ACCENT, BG, INK, INK_2, INK_3, LINE, LINE_2, MONO, OK, REVIEW, SANS} from './tokens';

/**
 * The four assistants, drawn.
 *
 * Recorded, this beat is four cards in a two-by-two grid with their step traces
 * collapsed behind disclosures — so the frame that is supposed to prove "every
 * step is recorded as it runs" shows no steps at all. The one thing the
 * narration promises is the one thing the footage hides.
 *
 * Drawn, every step of all four runs is on screen at once as a row of pips, and
 * the tamper check can visibly travel across all 26 of them.
 *
 * EVERY FIGURE IS REAL. Produced by running the crew against the seeded
 * workspace with the deterministic planner:
 *
 *   REFERENCE_RESOLVER   5 steps   4 findings   chain True
 *   SOURCE_SCOUT        11 steps   5 findings   chain True
 *   ADVERSARY            2 steps   1 finding    chain True
 *   EXTRACTOR            8 steps   4 findings   chain True
 *                       26 steps  14 findings
 *
 * The tamper proof at the end is also real, not a mime: editing one step's tool
 * name and re-running `verify_chain` returns False. That is the claim the
 * narration makes, and it is checkable by anyone who clones the repo.
 *
 * The Adversary finding — "No active obligation to challenge" — is left exactly
 * as the product returned it. It is the least impressive line on screen and the
 * most important one: an assistant that reports nothing when there is nothing
 * is the reason to believe the other three.
 *
 * COLOUR. The assistants are deliberately NOT colour-coded by identity. Every
 * colour in this film already means something (periwinkle = computed, aqua =
 * verified, peach = a person is required), and spending those tokens on "which
 * assistant is this" would break the vocabulary the viewer has been taught for
 * three minutes. So a card is grey while idle, periwinkle while it runs, and
 * aqua once its chain verifies — colour tracks state, never identity.
 */

type Assistant = {
  id: string;
  name: string;
  job: string;
  steps: number;
  findings: number;
  finding: string;
  glyph: string;
};

/* Glyph paths are the product's own, copied from `web/components/Agents.tsx`. */
const CREW: Assistant[] = [
  {
    id: 'REFERENCE_RESOLVER',
    name: 'Reference resolver',
    job: 'Checks that every ‘see Table 19’ really points at Table 19.',
    steps: 5,
    findings: 4,
    finding: 'CSCRF Part I · page 49 · Table 19 → CSCRF-TABLE-19',
    glyph: 'M10 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm8 14-3.8-3.8',
  },
  {
    id: 'SOURCE_SCOUT',
    name: 'Source scout',
    job: 'Spots when SEBI’s wording quietly moves.',
    steps: 11,
    findings: 5,
    finding: 'READ_IN_CONJUNCTION_WITH · 5 added · 2 changed',
    glyph: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Zm10 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  },
  {
    id: 'ADVERSARY',
    name: 'Adversary',
    job: 'Tries to break our own conclusions before a regulator can.',
    steps: 2,
    findings: 1,
    finding: 'No active obligation to challenge',
    glyph: 'M12 3 5 5.7v5.1c0 4 2.8 7.6 7 8.7 4.2-1.1 7-4.7 7-8.7V5.7L12 3Zm0 4v4m0 0-2 3m2-3 2 3',
  },
  {
    id: 'EXTRACTOR',
    name: 'Extractor',
    job: 'Asks of every sentence: can this make a calendar date?',
    steps: 8,
    findings: 4,
    finding: 'FAQ-Q15 · PERIOD_AND_TRIGGER_STATED',
    glyph: 'M7 4v3M17 4v3M4 9h16M6 6h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z',
  },
];

const TOTAL_STEPS = CREW.reduce((sum, a) => sum + a.steps, 0); // 26
const TOTAL_FINDINGS = CREW.reduce((sum, a) => sum + a.findings, 0); // 14

const phasesFrom = (lines: {startFrame: number; durationFrames: number}[]) => {
  const at = (n: number, fallback: number) => lines[n]?.startFrame ?? fallback;
  return {
    cardsIn: at(0, 0) + 6,
    run: at(1, 150) - 10,
    verify: at(2, 300) + 6,
    proof: at(2, 300) + (lines[2]?.durationFrames ?? 130) - 52,
  };
};

/** One recorded step. Grey unverified, aqua once the chain has recomputed it. */
const Pip: React.FC<{ran: number; verified: number}> = ({ran, verified}) => (
  <div
    style={{
      width: 13,
      height: 5,
      borderRadius: 3,
      background:
        verified > 0.5 ? OK : ran > 0.5 ? ACCENT : LINE_2,
      boxShadow: verified > 0.5 ? `0 0 9px ${OK}88` : ran > 0.5 ? `0 0 9px ${ACCENT}77` : 'none',
      opacity: ran > 0.5 ? 1 : 0.55,
    }}
  />
);

const Card: React.FC<{
  a: Assistant;
  index: number;
  T: ReturnType<typeof phasesFrom>;
  stepOffset: number;
  verifyHead: number;
}> = ({a, index, T, stepOffset, verifyHead}) => {
  const frame = useCurrentFrame();
  const rise = useRise(T.cardsIn + index * 7, 38, 28);

  /* Each assistant starts a beat after the one to its left, so the eye reads the
     row in order instead of seeing four things twitch at once. */
  const runStart = T.run + index * 9;
  const ranSteps = interpolate(frame, [runStart, runStart + 34], [0, a.steps], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.3, 0, 0.2, 1),
  });
  const findingIn = interpolate(frame, [runStart + 30, runStart + 46], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const running = ranSteps > 0.1 && ranSteps < a.steps - 0.05;
  const verifiedHere = Math.max(0, Math.min(a.steps, verifyHead - stepOffset));
  const settled = verifiedHere >= a.steps;
  const state = settled ? OK : running ? ACCENT : ranSteps >= a.steps ? INK_3 : LINE_2;

  return (
    <MotionBlur
      velocity={rise.velocity}
      style={{opacity: rise.opacity, transform: `translateY(${rise.y}px)`, width: 396}}
    >
      <div
        style={{
          borderRadius: 16,
          border: `1px solid ${running || settled ? state + '4d' : LINE_2}`,
          background: '#0b0c0f',
          padding: '24px 24px 20px',
          height: 312,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: running
            ? `0 0 52px -22px ${ACCENT}77`
            : settled
              ? `0 0 46px -24px ${OK}66`
              : 'none',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 13, marginBottom: 15}}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 11,
              border: `1px solid ${running || settled ? state + '55' : LINE_2}`,
              background: running || settled ? state + '10' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24">
              <path
                d={a.glyph}
                stroke={running || settled ? state : INK_3}
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <p style={{margin: 0, fontSize: 20, fontWeight: 640, color: INK, letterSpacing: '-0.01em'}}>
            {a.name}
          </p>
        </div>

        <p style={{margin: 0, height: 70, fontSize: 16, lineHeight: 1.45, color: INK_2}}>{a.job}</p>

        {/* The trace. One pip per recorded step — all of them, always visible. */}
        <div style={{display: 'flex', gap: 5, flexWrap: 'wrap', margin: '0 0 12px', minHeight: 16}}>
          {Array.from({length: a.steps}, (_, i) => (
            <Pip key={i} ran={ranSteps - i} verified={verifiedHere - i} />
          ))}
        </div>

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <span style={{fontSize: 14.5, color: INK_3, fontFamily: MONO}}>
            {Math.round(Math.min(ranSteps, a.steps))}/{a.steps} steps
          </span>
          <span style={{fontSize: 14.5, color: settled ? OK : INK_3, fontFamily: MONO}}>
            {settled ? 'chain ok' : `${a.findings} found`}
          </span>
        </div>

        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${LINE}`,
            fontSize: 13.5,
            lineHeight: 1.42,
            color: a.id === 'ADVERSARY' ? INK_3 : INK_2,
            fontFamily: MONO,
            opacity: findingIn,
            height: 50,
            overflow: 'hidden',
          }}
        >
          {a.finding}
        </div>
      </div>
    </MotionBlur>
  );
};

export const AssistantsBeat: React.FC<{
  durationInFrames: number;
  lines: {startFrame: number; durationFrames: number}[];
}> = ({durationInFrames, lines}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = phasesFrom(lines);

  /* The tamper check travels across all 26 steps as one continuous head, left to
     right, ignoring card boundaries — because that is what it does: it does not
     verify four traces, it recomputes one chain. */
  const verifyHead = interpolate(frame, [T.verify, T.verify + 46], [0, TOTAL_STEPS], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 0, 0.15, 1),
  });
  const verified = verifyHead >= TOTAL_STEPS;

  const proofIn = spring({
    frame: frame - T.proof,
    fps,
    config: {damping: 200, mass: 0.8, stiffness: 90},
  });

  const heading = useRise(0, 22, 24);
  const push = interpolate(frame, [0, durationInFrames], [1, 1.026], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  let offset = 0;
  const offsets = CREW.map((a) => {
    const start = offset;
    offset += a.steps;
    return start;
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
          width: 1720,
          height: 560,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${verified ? OK : ACCENT}0c, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      <MotionBlur
        velocity={heading.velocity}
        style={{opacity: heading.opacity, transform: `translateY(${heading.y}px)`, textAlign: 'center', zIndex: 1}}
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
          AI assistants
        </p>
        <h2
          style={{
            margin: '14px 0 42px',
            fontSize: 46,
            fontWeight: 660,
            color: INK,
            letterSpacing: '-0.022em',
          }}
        >
          Four readers, one job each, every step on the record
        </h2>
      </MotionBlur>

      <div style={{display: 'flex', gap: 28, zIndex: 1}}>
        {CREW.map((a, index) => (
          <Card key={a.id} a={a} index={index} T={T} stepOffset={offsets[index]} verifyHead={verifyHead} />
        ))}
      </div>

      {/* ---- The tamper check --------------------------------------------- */}
      <div
        style={{
          marginTop: 38,
          width: 1684,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '17px 24px',
          borderRadius: 13,
          border: `1px solid ${verified ? OK + '40' : LINE_2}`,
          background: verified ? `${OK}0b` : '#0b0c0f',
          opacity: interpolate(frame, [T.verify - 12, T.verify + 6], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: 13,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: verified ? OK : ACCENT,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          Tamper check
        </span>

        <div style={{flex: 1, height: 3, borderRadius: 2, background: LINE_2, overflow: 'hidden'}}>
          <div
            style={{
              width: `${(verifyHead / TOTAL_STEPS) * 100}%`,
              height: '100%',
              background: verified ? OK : ACCENT,
              boxShadow: `0 0 14px ${verified ? OK : ACCENT}`,
            }}
          />
        </div>

        <span style={{fontSize: 16, color: verified ? OK : INK_2, fontFamily: MONO, flexShrink: 0}}>
          {Math.round(verifyHead)} of {TOTAL_STEPS} steps recomputed
        </span>

        {/* The proof that the check is not decorative: break one step, it fails. */}
        <span
          style={{
            fontSize: 15,
            color: REVIEW,
            fontFamily: MONO,
            flexShrink: 0,
            opacity: proofIn,
            transform: `translateX(${interpolate(proofIn, [0, 1], [14, 0])}px)`,
            borderLeft: `1px solid ${LINE_2}`,
            paddingLeft: 20,
          }}
        >
          edit one step → chain breaks
        </span>
      </div>

      <p
        style={{
          margin: '20px 0 0',
          fontSize: 16,
          color: INK_3,
          fontFamily: MONO,
          opacity: interpolate(frame, [T.run + 40, T.run + 60], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          zIndex: 1,
        }}
      >
        {TOTAL_STEPS} steps · {TOTAL_FINDINGS} findings · nothing applied without a person
      </p>
    </div>
  );
};
