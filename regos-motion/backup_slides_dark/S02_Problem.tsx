import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {RegOSBackground} from '../system/Background';
import {Chrome} from '../system/Chrome';
import {Document} from '../system/icons';
import {SvgPop} from '../system/SvgPop';
import {
  COLOR_NAVY_800,
  COLOR_NAVY_900,
  COLOR_ROSE_500,
  COLOR_SLATE_400,
  COLOR_WHITE,
  STAGGER,
} from '../system/colors';
import {FONT_IBM_SANS, FONT_SORA} from '../system/fonts';
import {springSnappy, springSmooth} from '../system/springs';
import {Typewriter} from '../system/Typography';

const S02 = {
  T1: 'SEBI writes circulars.',
  T2: 'Brokers translate them by hand.',
  SUPPORT:
    'Who does what · by when · with what evidence — slow, uneven, un-auditable.',
  STATS: [
    {value: '95%', label: 'intermediaries cite complexity & info gaps'},
    {value: 'Weeks', label: 'typical circular-to-action lag'},
  ],
  FOOTER: 'Source framing: SEBI Investor Survey 2025 · PS2 problem statement',
};

const StatChip: React.FC<{
  value: string;
  label: string;
  delay: number;
}> = ({value, label, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = springSnappy(Math.max(0, frame - delay), fps);
  const countUp = Math.min(
    95,
    Math.floor(
      interpolate(frame, [delay + 10, delay + 40], [0, 95], {extrapolateRight: 'clamp'}),
    ),
  );

  return (
    <div
      style={{
        opacity: enter,
        transform: `translateX(${(1 - enter) * 30}px)`,
        background: `linear-gradient(135deg, ${COLOR_NAVY_800} 0%, ${COLOR_NAVY_900} 100%)`,
        borderLeft: `4px solid ${COLOR_ROSE_500}`,
        border: `1px solid rgba(148,163,184,0.10)`,
        borderLeftWidth: 4,
        borderLeftColor: COLOR_ROSE_500,
        boxShadow: `0 12px 40px rgba(6,16,31,0.5), inset 0 1px 0 rgba(255,255,255,0.03)`,
        padding: '30px 34px',
        borderRadius: 14,
        marginBottom: 22,
      }}
    >
      <div
        style={{
          fontFamily: FONT_SORA,
          fontWeight: 700,
          fontSize: 64,
          color: COLOR_WHITE,
          letterSpacing: '-0.04em',
        }}
      >
        {value.includes('%') ? `${countUp}%` : value}
      </div>
      <div
        style={{
          fontFamily: FONT_IBM_SANS,
          fontSize: 16,
          color: COLOR_SLATE_400,
          marginTop: 8,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const S02_Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleSpring = springSmooth(frame, fps);
  const docY = interpolate(frame, [0, 270], [0, -8]);

  return (
    <AbsoluteFill>
      <RegOSBackground atmosphere="calm" />
      <SvgPop style={{position: 'absolute', right: 140, top: 180}}>
        <div style={{transform: `translateY(${docY}px)`}}>
          <Document size={72} color={COLOR_SLATE_400} />
        </div>
      </SvgPop>
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '128px 64px 112px',
          gap: 72,
        }}
      >
        <div style={{flex: '0 0 52%'}}>
          <div
            style={{
              opacity: titleSpring,
              transform: `translateY(${(1 - titleSpring) * 20}px)`,
            }}
          >
            <h1
              style={{
                fontFamily: FONT_SORA,
                fontWeight: 700,
                fontSize: 56,
                color: COLOR_WHITE,
                letterSpacing: '-0.03em',
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              {S02.T1}
            </h1>
            <h1
              style={{
                fontFamily: FONT_SORA,
                fontWeight: 700,
                fontSize: 56,
                color: COLOR_WHITE,
                letterSpacing: '-0.03em',
                margin: '8px 0 0',
                lineHeight: 1.15,
              }}
            >
              <Typewriter text={S02.T2} startFrame={30} />
            </h1>
          </div>
          <p
            style={{
              fontFamily: FONT_IBM_SANS,
              fontSize: 22,
              color: COLOR_SLATE_400,
              marginTop: 32,
              lineHeight: 1.5,
              opacity: interpolate(frame, [60, 80], [0, 1], {extrapolateRight: 'clamp'}),
            }}
          >
            {S02.SUPPORT}
          </p>
        </div>
        <div style={{flex: '0 0 40%'}}>
          {S02.STATS.map((stat, i) => (
            <StatChip
              key={stat.value}
              value={stat.value}
              label={stat.label}
              delay={40 + i * STAGGER * 4}
            />
          ))}
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          left: 64,
          fontFamily: FONT_IBM_SANS,
          fontSize: 14,
          color: COLOR_SLATE_400,
          opacity: interpolate(frame, [120, 140], [0, 1], {extrapolateRight: 'clamp'}),
        }}
      >
        {S02.FOOTER}
      </div>
      <Chrome slideIndex={2} totalSlides={10} />
    </AbsoluteFill>
  );
};
