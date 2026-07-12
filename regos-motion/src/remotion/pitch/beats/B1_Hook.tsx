import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FONT_SORA} from '../../system/fonts';
import {CAPTIONS, OFFWHITE, TEAL, WHITE} from '../constants';
import {CaptionBar, VoidField} from '../shared';

const LINE1 = 'Rules arrive as text.';
const LINE2A = 'Compliance runs as ';
const LINE2B = 'work.';

// caret helper
const Caret: React.FC<{color?: string}> = ({color = TEAL}) => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 16) % 2 === 0 ? 1 : 0.15;
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        marginLeft: 6,
        color,
        opacity: blink,
        transform: 'translateY(2px)',
      }}
    >
      |
    </span>
  );
};

const FLIP_AT = 168;

export const B1_Hook: React.FC = () => {
  const frame = useCurrentFrame();

  // Phase 1 typing: frames 22 → 150
  const p1 = Math.max(0, Math.min(LINE1.length, Math.floor((frame - 22) / 4)));
  const line1 = LINE1.slice(0, p1);

  // Contrast flip wash around FLIP_AT
  const wash = interpolate(
    frame,
    [FLIP_AT - 8, FLIP_AT, FLIP_AT + 12],
    [0, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // Phase 2 typing after flip
  const full2 = LINE2A + LINE2B;
  const p2 = Math.max(0, Math.min(full2.length, Math.floor((frame - FLIP_AT - 6) / 3.2)));
  const typed2 = full2.slice(0, p2);
  const showLine2 = frame >= FLIP_AT - 2;
  const shownA = typed2.slice(0, Math.min(typed2.length, LINE2A.length));
  const shownB = typed2.length > LINE2A.length ? typed2.slice(LINE2A.length) : '';

  const bigStyle: React.CSSProperties = {
    fontFamily: FONT_SORA,
    fontWeight: 700,
    fontSize: 118,
    letterSpacing: '-0.03em',
    lineHeight: 1.02,
    color: WHITE,
    textAlign: 'center',
  };

  return (
    <AbsoluteFill>
      <VoidField />
      <AbsoluteFill
        style={{alignItems: 'center', justifyContent: 'center', padding: '0 120px'}}
      >
        {!showLine2 ? (
          <div style={bigStyle}>
            {line1}
            {frame > 18 && <Caret />}
          </div>
        ) : (
          <div style={bigStyle}>
            {shownA}
            <span style={{color: TEAL}}>{shownB}</span>
            {p2 < full2.length && <Caret />}
          </div>
        )}
      </AbsoluteFill>

      {/* one light-background contrast flip at the swap */}
      <AbsoluteFill
        style={{background: OFFWHITE, opacity: wash, pointerEvents: 'none', mixBlendMode: 'screen'}}
      />

      <CaptionBar text={CAPTIONS.hook} delay={40} />
    </AbsoluteFill>
  );
};
