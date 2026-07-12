import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {RegOSBackground} from '../system/Background';
import {Chrome} from '../system/Chrome';
import {Shield} from '../system/icons';
import {SvgPop} from '../system/SvgPop';
import {
  COLOR_NAVY_700,
  COLOR_SLATE_400,
  COLOR_TEAL_400,
  COLOR_TEAL_500,
  COLOR_WHITE,
  STAGGER,
} from '../system/colors';
import {FONT_IBM_SANS, FONT_SORA} from '../system/fonts';
import {springSnappy, springSmooth} from '../system/springs';
import {Typewriter} from '../system/Typography';

const S09 = {
  TITLE: 'RegTech for brokers. SupTech visibility for SEBI.',
  SUPPORT: 'Anonymized readiness across intermediaries — no raw PII.',
  GLOSS: 'RegTech for brokers; readiness visibility for SEBI.',
  LEFT_H: 'Intermediary',
  LEFT: ['Cited obligation register', 'Evidence workflow', 'Audit pack export'],
  RIGHT_H: 'SEBI / MII',
  RIGHT: [
    'Aggregate readiness view',
    'Common gap patterns',
    'Slow-implementation circulars',
  ],
  WEDGE: 'Not "first." Sandbox-ready for Small/Mid REs that enterprise tools don\'t demo.',
  CONTINUITY: '2025 Member Compliance Monitoring → 2026 Agentic Compliance',
  WHY_NOW_CHIP: 'SEBI Reg 16C — REs accountable for AI outputs',
  POSTURE:
    'Packaged for Innovation Sandbox mentorship — not just a demo day.',
};

const BulletList: React.FC<{
  header: string;
  items: string[];
  baseDelay: number;
}> = ({header, items, baseDelay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const headerSpring = springSmooth(Math.max(0, frame - baseDelay), fps);

  return (
    <div style={{flex: 1}}>
      <h3
        style={{
          fontFamily: FONT_SORA,
          fontWeight: 600,
          fontSize: 24,
          color: COLOR_TEAL_400,
          opacity: headerSpring,
          marginBottom: 20,
        }}
      >
        {header}
      </h3>
      {items.map((item, i) => {
        const enter = springSnappy(Math.max(0, frame - baseDelay - 15 - i * STAGGER), fps);
        return (
          <div
            key={item}
            style={{
              opacity: enter,
              transform: `translateX(${(1 - enter) * 12}px)`,
              fontFamily: FONT_IBM_SANS,
              fontSize: 18,
              color: COLOR_WHITE,
              padding: '10px 0',
              borderBottom: `1px solid ${COLOR_NAVY_700}`,
            }}
          >
            {item}
          </div>
        );
      })}
    </div>
  );
};

export const S09_SebiValue: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleSpring = springSmooth(frame, fps);

  return (
    <AbsoluteFill>
      <RegOSBackground atmosphere="calm" />
      <AbsoluteFill style={{padding: '126px 80px 84px', justifyContent: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 24, marginBottom: 8}}>
          <SvgPop>
            <Shield size={72} color={COLOR_TEAL_400} />
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
            {S09.TITLE}
          </h1>
        </div>
        <p
          style={{
            fontFamily: FONT_IBM_SANS,
            fontSize: 22,
            color: COLOR_SLATE_400,
            marginTop: 12,
          }}
        >
          {S09.SUPPORT}
        </p>
        <p
          style={{
            fontFamily: FONT_IBM_SANS,
            fontSize: 15,
            color: COLOR_TEAL_400,
            marginTop: 8,
            fontStyle: 'italic',
            opacity: interpolate(frame, [20, 35], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S09.GLOSS}
        </p>
        <div style={{display: 'flex', gap: 48, marginTop: 40}}>
          <BulletList header={S09.LEFT_H} items={S09.LEFT} baseDelay={20} />
          <div style={{width: 2, background: COLOR_TEAL_500, opacity: 0.5}} />
          <BulletList header={S09.RIGHT_H} items={S09.RIGHT} baseDelay={35} />
        </div>
        <div
          style={{
            marginTop: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontFamily: FONT_IBM_SANS,
            fontSize: 18,
            color: COLOR_WHITE,
          }}
        >
          <span
            style={{
              padding: '8px 16px',
              border: `1px solid ${COLOR_NAVY_700}`,
              borderRadius: 6,
              opacity: interpolate(frame, [80, 100], [0, 1], {extrapolateRight: 'clamp'}),
            }}
          >
            2025
          </span>
          <span style={{color: COLOR_TEAL_400}}>→</span>
          <span
            style={{
              padding: '8px 16px',
              border: `1px solid ${COLOR_TEAL_500}`,
              borderRadius: 6,
              opacity: interpolate(frame, [100, 120], [0, 1], {extrapolateRight: 'clamp'}),
            }}
          >
            2026
          </span>
          <Typewriter text="Agentic Compliance" startFrame={120} />
        </div>
        <div
          style={{
            marginTop: 24,
            display: 'inline-block',
            padding: '12px 24px',
            border: `2px solid ${COLOR_TEAL_500}`,
            borderRadius: 20,
            fontFamily: FONT_IBM_SANS,
            fontSize: 15,
            fontWeight: 600,
            color: COLOR_TEAL_400,
            background: `${COLOR_TEAL_500}15`,
            opacity: interpolate(frame, [140, 160], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S09.WHY_NOW_CHIP}
        </div>
        <p
          style={{
            marginTop: 20,
            fontFamily: FONT_IBM_SANS,
            fontSize: 16,
            color: COLOR_SLATE_400,
            maxWidth: 800,
            opacity: interpolate(frame, [165, 185], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S09.WEDGE}
        </p>
        <p
          style={{
            marginTop: 16,
            fontFamily: FONT_IBM_SANS,
            fontSize: 18,
            color: COLOR_SLATE_400,
            opacity: interpolate(frame, [190, 210], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S09.POSTURE}
        </p>
      </AbsoluteFill>
      <Chrome slideIndex={9} totalSlides={10} />
    </AbsoluteFill>
  );
};
