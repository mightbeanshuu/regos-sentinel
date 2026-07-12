import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {RegOSBackground} from '../system/Background';
import {
  COLOR_NAVY_700,
  COLOR_ROSE_500,
  COLOR_SLATE_400,
  COLOR_WHITE,
} from '../system/colors';
import {FONT_IBM_SANS, FONT_SORA} from '../system/fonts';
import {springSnappy, springUI} from '../system/springs';
const BEAT1 = {
  LINE1: 'Circulars are text.',
  LINE2: 'Compliance needs structure.',
  GAP_LABEL: 'manual translation',
  STAT: 'Weeks per circular.',
};

export const Beat1_ProblemHook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const line1Spring = springUI(Math.max(0, frame - 45), fps);
  const line2Spring = springUI(Math.max(0, frame - 90), fps);
  const splitReveal = interpolate(frame, [150, 210], [0, 1], {extrapolateRight: 'clamp'});
  const statSpring = springSnappy(Math.max(0, frame - 270), fps);

  return (
    <AbsoluteFill>
      <RegOSBackground />
      {Array.from({length: 6}).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 200 + i * 140,
            top: 120 + (i % 3) * 40,
            width: 48,
            height: 60,
            border: '1px solid rgba(248,250,252,0.12)',
            borderRadius: 4,
            opacity: interpolate(frame, [0, 30], [0, 0.6], {extrapolateRight: 'clamp'}),
            transform: `translateY(${interpolate(frame, [0, 360], [0, -20 + i * 4])}px)`,
          }}
        />
      ))}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 80,
        }}
      >
        <div
          style={{
            fontFamily: FONT_SORA,
            fontWeight: 700,
            fontSize: 56,
            color: COLOR_WHITE,
            opacity: line1Spring,
            transform: `translateY(${(1 - line1Spring) * 24}px)`,
          }}
        >
          {BEAT1.LINE1}
        </div>
        <div
          style={{
            fontFamily: FONT_SORA,
            fontWeight: 700,
            fontSize: 56,
            color: COLOR_WHITE,
            marginTop: 16,
            opacity: line2Spring,
            transform: `translateY(${(1 - line2Spring) * 24}px)`,
          }}
        >
          {BEAT1.LINE2}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 32,
            marginTop: 64,
            width: '100%',
            maxWidth: 1000,
            opacity: splitReveal,
          }}
        >
          <div
            style={{
              flex: 1,
              background: 'rgba(19,42,74,0.8)',
              borderRadius: 8,
              padding: 24,
              fontFamily: FONT_IBM_SANS,
              fontSize: 14,
              color: COLOR_SLATE_400,
              lineHeight: 1.8,
            }}
          >
            SEBI circular text… obligations… regulated entities shall…
            <br />
            compliance requirements… reporting timelines…
          </div>
          <div
            style={{
              width: 2,
              alignSelf: 'stretch',
              borderLeft: `2px dashed ${COLOR_ROSE_500}`,
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '50%',
                left: 12,
                transform: 'translateY(-50%)',
                fontFamily: FONT_IBM_SANS,
                fontSize: 12,
                color: COLOR_ROSE_500,
                whiteSpace: 'nowrap',
              }}
            >
              {BEAT1.GAP_LABEL}
            </span>
          </div>
          <div
            style={{
              flex: 1,
              background: 'rgba(6,16,31,0.9)',
              borderRadius: 8,
              border: `1px dashed ${COLOR_NAVY_700}`,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {['Owner?', 'Deadline?', 'Evidence?'].map((q) => (
              <div
                key={q}
                style={{
                  fontFamily: FONT_IBM_SANS,
                  fontSize: 16,
                  color: COLOR_SLATE_400,
                  padding: 12,
                  border: `1px solid ${COLOR_NAVY_700}`,
                  borderRadius: 6,
                }}
              >
                {q}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            marginTop: 48,
            padding: '12px 24px',
            border: `1px solid ${COLOR_ROSE_500}`,
            borderRadius: 8,
            fontFamily: FONT_SORA,
            fontWeight: 600,
            fontSize: 24,
            color: COLOR_WHITE,
            opacity: statSpring,
            transform: `scale(${interpolate(statSpring, [0, 1], [0.9, 1])})`,
          }}
        >
          {BEAT1.STAT}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
