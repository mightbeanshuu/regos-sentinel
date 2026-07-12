import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {RegOSBackground} from '../system/Background';
import {Chrome} from '../system/Chrome';
import {
  COLOR_NAVY_700,
  COLOR_SLATE_400,
  COLOR_TEAL_400,
  COLOR_WHITE,
  STAGGER,
} from '../system/colors';
import {FONT_IBM_SANS, FONT_SORA} from '../system/fonts';
import {springSnappy, springSmooth} from '../system/springs';
import {WordCarousel} from '../system/Typography';

const S04 = {
  SUB: 'Supervised agentic compliance for stock brokers — then every SEBI intermediary.',
  HONESTY:
    'Enterprise agentic compliance exists for large BFSI. RegOS is the inspectable layer for lean SEBI stock brokers.',
  PREFIX: 'Every output is',
  WORDS: ['clause-cited', 'confidence-scored', 'human-approved', 'audit-ready'],
  PILLS: [
    'Real SEBI circulars',
    'Synthetic broker evidence (labeled)',
    'Not legal advice — decision support',
  ],
  GLOSS: 'Rules become a graph you can assign, track, and audit.',
};

export const S04_Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleSpring = springSmooth(frame, fps);

  return (
    <AbsoluteFill>
      <RegOSBackground atmosphere="calm" />
      <AbsoluteFill
        style={{
          padding: '96px 96px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: titleSpring,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: COLOR_TEAL_400,
              boxShadow: `0 0 14px ${COLOR_TEAL_400}`,
            }}
          />
          <span
            style={{
              fontFamily: FONT_IBM_SANS,
              fontSize: 15,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: COLOR_TEAL_400,
              fontWeight: 600,
            }}
          >
            The Solution · Supervised Agentic Compliance
          </span>
        </div>
        <p
          style={{
            fontFamily: FONT_IBM_SANS,
            fontSize: 24,
            color: COLOR_SLATE_400,
            maxWidth: 900,
            lineHeight: 1.5,
            marginBottom: 24,
            opacity: interpolate(frame, [20, 40], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S04.SUB}
        </p>
        <div
          style={{
            fontFamily: FONT_IBM_SANS,
            fontSize: 17,
            color: COLOR_TEAL_400,
            maxWidth: 880,
            lineHeight: 1.5,
            padding: '12px 20px',
            borderLeft: `3px solid ${COLOR_TEAL_400}`,
            marginBottom: 40,
            opacity: interpolate(frame, [35, 55], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S04.HONESTY}
        </div>
        <WordCarousel
          words={S04.WORDS}
          prefix={S04.PREFIX}
          startFrame={50}
          prefixStyle={{
            fontFamily: FONT_SORA,
            fontWeight: 600,
            fontSize: 54,
            color: COLOR_WHITE,
            letterSpacing: '-0.02em',
          }}
          wordStyle={{
            fontFamily: FONT_SORA,
            fontWeight: 700,
            fontSize: 54,
            letterSpacing: '-0.02em',
          }}
          color={COLOR_TEAL_400}
        />
        <div style={{display: 'flex', gap: 16, marginTop: 44, flexWrap: 'wrap'}}>
          {S04.PILLS.map((pill, i) => {
            const enter = springSnappy(Math.max(0, frame - 80 - i * STAGGER), fps);
            return (
              <div
                key={pill}
                style={{
                  opacity: enter,
                  transform: `translateY(${(1 - enter) * 16}px)`,
                  border: `1px solid ${COLOR_NAVY_700}`,
                  borderRadius: 24,
                  padding: '12px 24px',
                  fontFamily: FONT_IBM_SANS,
                  fontSize: 16,
                  color: COLOR_WHITE,
                }}
              >
                {pill}
              </div>
            );
          })}
        </div>
        <p
          style={{
            marginTop: 24,
            fontFamily: FONT_IBM_SANS,
            fontSize: 15,
            color: COLOR_SLATE_400,
            fontStyle: 'italic',
            opacity: interpolate(frame, [120, 140], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S04.GLOSS}
        </p>
      </AbsoluteFill>
      <Chrome slideIndex={4} totalSlides={10} />
    </AbsoluteFill>
  );
};
