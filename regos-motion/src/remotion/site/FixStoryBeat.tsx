import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ACCENT, BG, INK, INK_2, INK_3, LINE_2, OK, REVIEW, SANS, MONO} from './tokens';

/**
 * The whole argument in one drawn shot: a clause with a gap, caught, fixed, cleared.
 *
 * The screen recording proves this happens. It does not EXPLAIN it, because at
 * 1920 wide the sentence that matters is nine words inside a paragraph inside a
 * panel, and the eye has nowhere to go. So the page is drawn at a size a viewer
 * can actually read, and the two things that matter — the period, and the
 * missing thing next to it — are marked while the narration names them.
 *
 * Every number on screen is measured, not styled: 0.9986 and 0.7056 are the
 * model's real confidences on these two clauses, and 50% / 100% are the real
 * deadline-clarity figures. A film that rounds a confidence up is doing the one
 * thing the product refuses to do.
 *
 * The correction is labelled ON THE PAGE, not just in the voice-over. Adding
 * words to a regulator's clause and showing the result is only honest if the
 * frame says who added them, because a still from this film will outlive its
 * narration.
 */

const PAGE_W = 660;
const PAGE_H = 470;

/**
 * Every phase is pinned to a spoken line, not to a frame count I picked.
 *
 * The first cut hard-coded the timings, and the page flipped to the corrected
 * version a full three seconds before the narration said "now the same clause"
 * — the frame contradicted the voice, which is the one thing this film cannot
 * do. These offsets come from `timing.json`, which is measured from the audio,
 * so re-recording the voice at a different rate re-times the animation with it.
 */
const phasesFrom = (lines: {startFrame: number}[]) => {
  const at = (n: number, fallback: number) => lines[n]?.startFrame ?? fallback;
  return {
    pageIn: 0,
    clauseRead: at(0, 0) + 10,
    markGap: at(1, 102) + 28,   // "six months from when?"
    scan: at(2, 244) - 34,      // the read begins just before it is described
    verdictA: at(2, 244) + 22,
    fixIn: at(3, 463),          // "now the same clause…"
    markFix: at(3, 463) + 34,
    verdictB: at(4, 657),       // "a hundred percent"
  };
};

const CLAUSE_HEAD = 'Processing entities shall provide monthly reports to SEBI';
const CLAUSE_MID = 'regarding processing of transmission requests';
const PERIOD = 'for a period of 6 months';
const ADDED = 'from the date of issuance of this circular';

/** A sheet of paper, because that is what a PDF is. */
const Sheet: React.FC<{
  children: React.ReactNode;
  lift: number;
  tilt: number;
  opacity: number;
  banner: string;
  bannerTone: string;
}> = ({children, lift, tilt, opacity, banner, bannerTone}) => (
  <div
    style={{
      position: 'absolute',
      width: PAGE_W,
      height: PAGE_H,
      borderRadius: 6,
      background: '#f7f6f3',
      boxShadow: `0 ${28 + lift * 0.6}px ${70 + lift}px -28px rgba(0,0,0,0.85)`,
      transform: `translateY(${lift}px) perspective(1400px) rotateX(${tilt}deg)`,
      opacity,
      padding: '26px 34px',
      boxSizing: 'border-box',
      fontFamily: SANS,
      color: '#17181a',
      overflow: 'hidden',
    }}
  >
    <p
      style={{
        margin: 0,
        fontSize: 10.5,
        letterSpacing: '0.09em',
        fontWeight: 700,
        color: bannerTone,
        textTransform: 'uppercase',
      }}
    >
      {banner}
    </p>
    <div style={{height: 1, background: '#d9d7d2', margin: '13px 0 20px'}} />
    {children}
  </div>
);

const Line: React.FC<{w: string}> = ({w}) => (
  <div style={{height: 7, width: w, borderRadius: 3, background: '#d9d7d2', marginBottom: 11}} />
);

/** One row of the verdict panel — a label, a value, and the tone it carries. */
const Row: React.FC<{label: string; value: string; tone?: string; show: number}> = ({
  label,
  value,
  tone,
  show,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 22,
      padding: '11px 0',
      borderBottom: `1px solid ${LINE_2}`,
      opacity: show,
      transform: `translateY(${interpolate(show, [0, 1], [10, 0])}px)`,
    }}
  >
    <span style={{fontSize: 16, color: INK_3}}>{label}</span>
    <span style={{fontSize: 17, fontWeight: 640, color: tone ?? INK, fontFamily: tone ? MONO : SANS}}>
      {value}
    </span>
  </div>
);

export const FixStoryBeat: React.FC<{
  durationInFrames: number;
  lines: {startFrame: number}[];
}> = ({durationInFrames, lines}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = phasesFrom(lines);

  const at = (start: number, damping = 200) =>
    spring({frame: frame - start, fps, config: {damping, mass: 0.8, stiffness: 92}});
  const after = (start: number, len: number) =>
    interpolate(frame, [start, start + len], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  const fixed = frame >= T.fixIn;

  /* The page arrives from below — the same bottom-up entrance the product's own
     panels use, so the film and the app move the same way. */
  const pageRise = at(T.pageIn);
  const pageLift = interpolate(pageRise, [0, 1], [190, 0]);
  const pageTilt = interpolate(pageRise, [0, 1], [9, 0]);

  /* The corrected sheet rises through the first one rather than cutting, so the
     viewer sees it is the SAME page with one thing changed. */
  const fixRise = at(T.fixIn);
  const fixLift = interpolate(fixRise, [0, 1], [200, 0]);

  /* The scan: a rule crossing the page, which is the upload. */
  const scan = after(T.scan, 40);
  const scanning = frame >= T.scan && frame < T.scan + 46;

  const gapMark = after(T.markGap, 22);
  const fixMark = after(T.markFix, 22);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 96,
        paddingBottom: 92,
        fontFamily: SANS,
        transform: `scale(${interpolate(frame, [0, durationInFrames], [1, 1.03], {
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.33, 0, 0.2, 1),
        })})`,
      }}
    >
      {/* ---- The document ------------------------------------------------- */}
      <div style={{position: 'relative', width: PAGE_W, height: PAGE_H}}>
        <Sheet
          lift={pageLift}
          tilt={pageTilt}
          opacity={interpolate(pageRise, [0, 1], [0, fixed ? 0.28 : 1])}
          banner="SEBI circular · 23 July 2026 · paragraph 6"
          bannerTone="#8a8781"
        >
          <Line w="88%" />
          <Line w="72%" />
          <div style={{marginTop: 20, fontSize: 19, lineHeight: 1.62, position: 'relative'}}>
            <span style={{opacity: after(T.clauseRead, 20)}}>{CLAUSE_HEAD} </span>
            <span style={{opacity: after(T.clauseRead + 8, 20)}}>{CLAUSE_MID} </span>
            <span
              style={{
                opacity: after(T.clauseRead + 14, 20),
                fontWeight: 660,
                boxShadow: `inset 0 -${11 * gapMark}px 0 ${REVIEW}59`,
              }}
            >
              {PERIOD}
            </span>
            <span style={{opacity: after(T.clauseRead + 14, 20)}}>.</span>
          </div>
          <div style={{marginTop: 26}}>
            <Line w="64%" />
          </div>
        </Sheet>

        {/* The corrected sheet, same geometry, one clause longer. */}
        {fixed && (
          <Sheet
            lift={fixLift}
            tilt={interpolate(fixRise, [0, 1], [9, 0])}
            opacity={fixRise}
            banner="Edited for this demonstration — the added words are ours, not SEBI's"
            bannerTone="#9a6a2c"
          >
            <Line w="88%" />
            <Line w="72%" />
            <div style={{marginTop: 20, fontSize: 19, lineHeight: 1.62}}>
              <span>{CLAUSE_HEAD} </span>
              <span>{CLAUSE_MID} </span>
              <span style={{fontWeight: 660}}>{PERIOD} </span>
              <span
                style={{
                  fontWeight: 660,
                  boxShadow: `inset 0 -${11 * fixMark}px 0 ${OK}59`,
                  opacity: after(T.fixIn + 12, 18),
                }}
              >
                {ADDED}
              </span>
              <span style={{opacity: after(T.fixIn + 12, 18)}}>.</span>
            </div>
            <div style={{marginTop: 26}}>
              <Line w="64%" />
            </div>
          </Sheet>
        )}

        {/* The scan line: the upload, drawn. */}
        {scanning && (
          <div
            style={{
              position: 'absolute',
              left: -14,
              right: -14,
              top: interpolate(scan, [0, 1], [0, PAGE_H]),
              height: 2,
              background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
              boxShadow: `0 0 22px ${ACCENT}`,
            }}
          />
        )}

        {/* What is missing, said next to the thing that is missing it. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -66,
            textAlign: 'center',
            fontSize: 19,
            fontWeight: 620,
            color: fixed ? OK : REVIEW,
            opacity: fixed ? fixMark : gapMark,
            transform: `translateY(${interpolate(fixed ? fixMark : gapMark, [0, 1], [12, 0])}px)`,
          }}
        >
          {fixed ? '↑ and now it says from when' : '↑ six months from when?'}
        </div>
      </div>

      {/* ---- What RegOS makes of it --------------------------------------- */}
      <div
        style={{
          width: 470,
          padding: '26px 30px',
          borderRadius: 16,
          border: `1px solid ${LINE_2}`,
          background: '#0d0e11',
          opacity: after(T.verdictA - 14, 16),
          transform: `translateY(${interpolate(after(T.verdictA - 14, 16), [0, 1], [26, 0])}px)`,
        }}
      >
        <p
          style={{
            margin: '0 0 6px',
            fontSize: 12,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: INK_3,
          }}
        >
          RegOS reads it
        </p>
        <p style={{margin: '0 0 16px', fontSize: 26, fontWeight: 660, color: INK}}>
          {fixed ? 'Nothing to raise' : 'One gap, and it stops'}
        </p>

        <Row
          label="The model"
          value={fixed ? 'period and trigger' : 'period only'}
          tone={fixed ? OK : REVIEW}
          show={fixed ? after(T.verdictB, 16) : after(T.verdictA, 16)}
        />
        <Row
          label="confidence"
          value={fixed ? '0.7056' : '0.9986'}
          tone={INK_2}
          show={fixed ? after(T.verdictB + 8, 16) : after(T.verdictA + 8, 16)}
        />
        <Row
          label="The fixed rule"
          value={fixed ? 'agrees' : 'agrees'}
          tone={fixed ? OK : REVIEW}
          show={fixed ? after(T.verdictB + 16, 16) : after(T.verdictA + 16, 16)}
        />
        <Row
          label="Deadline clarity"
          value={fixed ? '100%' : '50%'}
          tone={fixed ? OK : REVIEW}
          show={fixed ? after(T.verdictB + 24, 16) : after(T.verdictA + 24, 16)}
        />

        <div
          style={{
            marginTop: 20,
            padding: '13px 16px',
            borderRadius: 10,
            border: `1px solid ${(fixed ? OK : REVIEW) + '44'}`,
            background: (fixed ? OK : REVIEW) + '12',
            color: fixed ? OK : REVIEW,
            fontSize: 17,
            fontWeight: 620,
            opacity: fixed ? after(T.verdictB + 32, 18) : after(T.verdictA + 32, 18),
          }}
        >
          {fixed ? '✓  No case. No due date invented.' : '!  Case raised — a person decides'}
        </div>
      </div>
    </div>
  );
};
