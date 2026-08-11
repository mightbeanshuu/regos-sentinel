import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {MotionBlur, useRise} from './motion';
import {ACCENT, BG, BRAND, INK, INK_2, INK_3, LINE, LINE_2, MONO, OK, REVIEW, SANS} from './tokens';

/**
 * Ask RegOS, drawn.
 *
 * The recorded version of this beat filmed a real question and a real answer,
 * and neither was readable: the answer is a four-line quotation set at 15px
 * inside a panel that occupies a third of a 1920 frame. The single most
 * important claim in the film — that the answer is SEBI's words rather than the
 * model's — was illegible in the shot meant to prove it.
 *
 * Drawn, the quotation can be set at 27px and the viewer can actually read that
 * it is a quotation.
 *
 * EVERY STRING BELOW IS REAL OUTPUT, captured by calling `ask()` against the
 * seeded workspace:
 *
 *   $ ask("What is the reporting timeline for a cyber incident?")
 *     -> kind=QUOTED, 1 citation, locator "FAQ dated 11 June 2025 · PDF pages 8-9 · Q16"
 *   $ ask("How long do we have to report a cyber incident to SEBI?")
 *     -> kind=REFUSED, 0 citations
 *
 * The pairing is the whole point and it is not staged: the second question is
 * the one a compliance officer would actually ask first, and the product will
 * not answer it, because no passage in the corpus scores high enough. A film
 * that showed only the answered question would be advertising. Showing the
 * refusal is the argument.
 *
 * 27 = the real size of the searched corpus (18 workspace spans + 9 advisory).
 */

const Q1 = 'What is the reporting timeline for a cyber incident?';
const A1 =
  'Please refer Section 4.3. ‘VAPT’ under ‘CSCRF Compliance, Audit Report ' +
  'Submission, and Timelines’ in CSCRF. It mentions VAPT related reporting, ' +
  'periodicity, and timelines. Further, the reporting format shall be as per ' +
  'CSCRF: Annexure-A.';
const LOCATOR = 'FAQ dated 11 June 2025 · PDF pages 8–9 · Q16';
const SOURCE = 'sebi.gov.in/sebi_data/faqfiles/jun-2025/1749647139924.pdf';

const Q2 = 'How long do we have to report a cyber incident to SEBI?';
const A2 =
  "I don't have SEBI wording that answers that, so I'm not going to answer it. " +
  'Everything I say has to be a quotation from a document in this workspace — ' +
  "if it isn't there, guessing would be worse than saying nothing.";
const A2_NOTE = 'Nothing in the reviewed passages scored high enough to be a match.';

const CORPUS = 27;

/**
 * Phases pinned to the spoken lines, never to hand-picked frames.
 *
 * Line 2 is one audio file carrying two thoughts — "Word for word." closes the
 * quoted answer, and "And if the corpus doesn't have it…" opens the refusal. It
 * is split proportionally rather than at a fixed offset so a re-recorded voice
 * keeps the turn in the right place.
 */
const phasesFrom = (lines: {startFrame: number; durationFrames: number}[]) => {
  const at = (n: number, fallback: number) => lines[n]?.startFrame ?? fallback;
  const l2 = at(2, 300);
  const l2len = lines[2]?.durationFrames ?? 150;
  // "Word for word." is the short opening clause of line 2; the turn to the
  // second question belongs right after it. Splitting at 16% rather than a
  // fixed offset keeps that true if the voice is re-recorded at another rate.
  const turn = l2 + Math.round(l2len * 0.16);
  return {
    barIn: 0,
    typeQ1: at(0, 0) + 8,
    search1: at(1, 120) - 18,
    answer1: at(1, 120) + 10,
    cite: at(1, 120) + 46,
    typeQ2: turn,
    search2: turn + 40,
    refuse: turn + 62,
  };
};

/** Text that writes itself in, left to right, with a caret at the head. */
const Typed: React.FC<{
  text: string;
  start: number;
  cps?: number;
  style?: React.CSSProperties;
  caret?: boolean;
}> = ({text, start, cps = 40, style, caret = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const shown = Math.max(0, Math.min(text.length, Math.floor(((frame - start) / fps) * cps)));
  const done = shown >= text.length;
  return (
    <span style={style}>
      {text.slice(0, shown)}
      {caret && !done ? (
        <span
          style={{
            display: 'inline-block',
            width: 2,
            height: '1em',
            marginLeft: 2,
            verticalAlign: '-0.12em',
            background: BRAND,
          }}
        />
      ) : null}
    </span>
  );
};

/** Words that arrive one after another — how an answer actually streams back. */
const Streamed: React.FC<{text: string; start: number; wps?: number; style?: React.CSSProperties}> = ({
  text,
  start,
  wps = 15,
  style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = React.useMemo(() => text.split(' '), [text]);
  const shown = ((frame - start) / fps) * wps;
  return (
    <span style={style}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          style={{
            opacity: interpolate(shown - index, [0, 1], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {word}{' '}
        </span>
      ))}
    </span>
  );
};

/**
 * The bar. Its glow is the state of the machine, not decoration:
 * idle is a hairline, typing lifts it to brand, and searching runs a travelling
 * highlight left to right across the full width — so the one moving thing on
 * screen is the thing actually doing work.
 */
const AskBar: React.FC<{question: string; typeAt: number; searching: number; lift: number}> = ({
  question,
  typeAt,
  searching,
  lift,
}) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(searching, [0, 1], [-32, 132]);
  return (
    <div
      style={{
        position: 'relative',
        width: 1180,
        borderRadius: 999,
        border: `1px solid ${searching > 0 && searching < 1 ? ACCENT + '66' : LINE_2}`,
        background: '#0c0d10',
        padding: '26px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        boxShadow:
          searching > 0 && searching < 1
            ? `0 0 ${64 * lift}px -12px ${ACCENT}55, inset 0 1px 0 ${LINE}`
            : `0 0 ${44 * lift}px -18px ${BRAND}44, inset 0 1px 0 ${LINE}`,
        overflow: 'hidden',
      }}
    >
      {/* The travelling highlight: the corpus being read, left to right. */}
      {searching > 0 && searching < 1 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(100deg, transparent ${sweep - 26}%, ${ACCENT}2b ${sweep}%, transparent ${sweep + 26}%)`,
          }}
        />
      ) : null}

      <svg width={26} height={26} viewBox="0 0 24 24" style={{flexShrink: 0}}>
        <g
          stroke={searching > 0 && searching < 1 ? ACCENT : BRAND}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <circle cx="11" cy="11" r="6.6" />
          <path d="m16 16 4.6 4.6" />
        </g>
      </svg>

      <Typed
        text={question}
        start={typeAt}
        caret
        style={{
          fontFamily: SANS,
          fontSize: 27,
          fontWeight: 500,
          color: INK,
          letterSpacing: '-0.01em',
          position: 'relative',
        }}
      />
    </div>
  );
};

export const AskBeat: React.FC<{
  durationInFrames: number;
  lines: {startFrame: number; durationFrames: number}[];
}> = ({durationInFrames, lines}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = phasesFrom(lines);

  const phase2 = frame >= T.typeQ2;
  const bar = useRise(T.barIn, 40, 30);

  const progress = (start: number, len: number) =>
    interpolate(frame, [start, start + len], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  const searching = phase2 ? progress(T.search2, 22) : progress(T.search1, 30);

  /* The first answer does not vanish when the second question is typed — it
     sinks and fades over 14 frames, so the frame is never simply empty while
     the bar is being retyped. */
  const cardAt = (f: number) => {
    const rise = spring({
      frame: f - (f >= T.typeQ2 ? T.refuse : T.answer1),
      fps,
      config: {damping: 200, mass: 0.8, stiffness: 88},
    });
    const exit = interpolate(f, [T.typeQ2 - 14, T.typeQ2], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const leaving = f < T.typeQ2 ? exit : 0;
    return {y: interpolate(rise, [0, 1], [46, 0]) + leaving * 34, opacity: rise * (1 - leaving)};
  };
  const card = cardAt(frame);
  const answerIn = card.opacity;
  const answerY = card.y;
  const answerVel = Math.abs(cardAt(frame - 1).y - answerY);

  const push = interpolate(frame, [0, durationInFrames], [1, 1.028], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  const tone = phase2 ? REVIEW : OK;

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
        gap: 34,
        paddingBottom: 96,
        fontFamily: SANS,
        transform: `scale(${push})`,
      }}
    >
      {/* A soft floor glow so the stack sits in a space rather than on a void. */}
      <div
        style={{
          position: 'absolute',
          width: 1500,
          height: 620,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${phase2 ? REVIEW : ACCENT}0e, transparent 68%)`,
          filter: 'blur(52px)',
        }}
      />

      <MotionBlur velocity={bar.velocity} style={{opacity: bar.opacity, transform: `translateY(${bar.y}px)`, zIndex: 1}}>
        <AskBar
          question={phase2 ? Q2 : Q1}
          typeAt={phase2 ? T.typeQ2 : T.typeQ1}
          searching={searching}
          lift={bar.opacity}
        />
      </MotionBlur>

      {/* What it is doing while the bar glows — a real count, not a spinner. */}
      <div
        style={{
          height: 20,
          opacity: searching > 0 && searching < 1 ? 1 : 0,
          fontSize: 16,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: ACCENT,
          fontFamily: MONO,
          zIndex: 1,
        }}
      >
        reading {Math.round(searching * CORPUS)} of {CORPUS} SEBI passages
      </div>

      {/* ---- The answer ---------------------------------------------------- */}
      <MotionBlur
        velocity={answerVel}
        style={{
          width: 1180,
          opacity: answerIn,
          transform: `translateY(${answerY}px)`,
          zIndex: 1,
        }}
      >
        <div
          style={{
            borderRadius: 18,
            border: `1px solid ${LINE_2}`,
            background: '#0b0c0f',
            padding: '30px 34px 26px',
            boxShadow: `0 40px 90px -50px ${tone}55`,
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18}}>
            <span
              style={{
                fontSize: 12.5,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: tone,
                fontWeight: 700,
              }}
            >
              {phase2 ? 'No answer given' : "SEBI's words, quoted"}
            </span>
            <span style={{flex: 1, height: 1, background: LINE_2}} />
            <span style={{fontSize: 13, color: INK_3, fontFamily: MONO}}>
              {phase2 ? '0 citations' : '1 citation'}
            </span>
          </div>

          <div style={{display: 'flex', gap: 22}}>
            <div style={{width: 3, borderRadius: 2, background: tone, flexShrink: 0}} />
            <div>
              <Streamed
                text={phase2 ? A2 : A1}
                start={phase2 ? T.refuse + 6 : T.answer1 + 6}
                wps={phase2 ? 21 : 15}
                style={{
                  fontSize: 27,
                  lineHeight: 1.5,
                  color: phase2 ? INK_2 : INK,
                  fontWeight: phase2 ? 440 : 500,
                }}
              />

              {phase2 ? (
                <p
                  style={{
                    margin: '18px 0 0',
                    fontSize: 17,
                    color: INK_3,
                    opacity: progress(T.refuse + 40, 16),
                  }}
                >
                  {A2_NOTE}
                </p>
              ) : (
                /* The locator is the claim. It arrives last and on its own. */
                <div
                  style={{
                    marginTop: 22,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    flexWrap: 'wrap',
                    opacity: progress(T.cite, 18),
                    transform: `translateY(${interpolate(progress(T.cite, 18), [0, 1], [10, 0])}px)`,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '9px 15px',
                      borderRadius: 999,
                      border: `1px solid ${OK}4d`,
                      background: `${OK}12`,
                      color: OK,
                      fontSize: 16,
                      fontWeight: 620,
                    }}
                  >
                    <svg width={15} height={15} viewBox="0 0 24 24">
                      <path
                        d="m4.5 12.5 5 5 10-11"
                        stroke={OK}
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                    {LOCATOR}
                  </span>
                  <span style={{fontSize: 15, color: INK_3, fontFamily: MONO}}>{SOURCE}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </MotionBlur>
    </div>
  );
};
