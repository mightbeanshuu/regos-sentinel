import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {RegOSBackground} from '../system/Background';
import {Chrome} from '../system/Chrome';
import {Document} from '../system/icons';
import {SvgPop} from '../system/SvgPop';
import {
  COLOR_EMERALD_500,
  COLOR_NAVY_700,
  COLOR_SLATE_400,
  COLOR_TEAL_500,
  COLOR_WHITE,
  STAGGER,
} from '../system/colors';
import {FONT_IBM_SANS, FONT_SORA} from '../system/fonts';
import {springBouncy, springSnappy, springSmooth} from '../system/springs';

const S08 = {
  TITLE: 'Built to be measured — not merely demoed.',
  METRICS: [
    {value: '100%', label: 'citation coverage on displayed obligations'},
    {value: '<3 min', label: 'circular → compliance plan (demo gate)'},
    {value: '≥0.85', label: 'extraction precision target (labeled set)'},
  ],
  CORPUS:
    'Corpus: Stock Broker Master Circular · CSCRF + FAQ · SCORES↔ODR',
  OVERLAY: 'Live overlay: docs · obligations · citation % · time-to-plan',
};

const MetricColumn: React.FC<{
  value: string;
  label: string;
  delay: number;
}> = ({value, label, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = springSnappy(Math.max(0, frame - delay), fps);
  const count =
    value === '100%'
      ? Math.min(
          100,
          Math.floor(
            interpolate(frame, [delay, delay + 30], [0, 100], {extrapolateRight: 'clamp'}),
          ),
        )
      : null;
  const atTarget = count === 100;
  const slam = atTarget ? springBouncy(Math.max(0, frame - delay - 30), fps) : 0;
  const scale = atTarget ? interpolate(slam, [0, 1], [1, 1.06]) : 1;

  return (
    <div
      style={{
        flex: 1,
        textAlign: 'center',
        opacity: enter,
        transform: `translateY(${(1 - enter) * 30}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT_SORA,
          fontWeight: 700,
          fontSize: 72,
          color: atTarget ? COLOR_EMERALD_500 : COLOR_WHITE,
          letterSpacing: '-0.04em',
          transform: `scale(${scale})`,
        }}
      >
        {count !== null ? `${count}%` : value}
      </div>
      <div
        style={{
          fontFamily: FONT_IBM_SANS,
          fontSize: 16,
          color: COLOR_SLATE_400,
          marginTop: 12,
          lineHeight: 1.4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 24,
          display: 'flex',
          gap: 4,
          justifyContent: 'center',
          opacity: 0.15,
        }}
      >
        {[0.7, 0.85, 0.92, 0.88, 0.95].map((h, i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: `${h * 60}px`,
              background: i % 2 === 0 ? COLOR_TEAL_500 : COLOR_EMERALD_500,
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const S08_Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleSpring = springSmooth(frame, fps);

  return (
    <AbsoluteFill>
      <RegOSBackground atmosphere="calm" />
      <AbsoluteFill style={{padding: '100px 80px', justifyContent: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 24, marginBottom: 8}}>
          <SvgPop>
            <Document size={72} color={COLOR_TEAL_500} />
          </SvgPop>
          <h1
            style={{
              fontFamily: FONT_SORA,
              fontWeight: 700,
              fontSize: 44,
              color: COLOR_WHITE,
              opacity: titleSpring,
              margin: 0,
            }}
          >
            {S08.TITLE}
          </h1>
        </div>
        <div style={{display: 'flex', gap: 48, marginTop: 64}}>
          {S08.METRICS.map((m, i) => (
            <MetricColumn key={m.value} value={m.value} label={m.label} delay={30 + i * STAGGER * 3} />
          ))}
        </div>
        <div
          style={{
            marginTop: 64,
            padding: '16px 24px',
            border: `1px solid ${COLOR_NAVY_700}`,
            borderRadius: 8,
            fontFamily: FONT_IBM_SANS,
            fontSize: 16,
            color: COLOR_SLATE_400,
            opacity: interpolate(frame, [120, 150], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S08.CORPUS}
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: FONT_IBM_SANS,
            fontSize: 14,
            color: COLOR_TEAL_500,
            opacity: interpolate(frame, [150, 180], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S08.OVERLAY}
        </div>
      </AbsoluteFill>
      <Chrome slideIndex={8} totalSlides={10} />
    </AbsoluteFill>
  );
};
