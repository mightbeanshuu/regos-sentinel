import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {RegOSBackground} from '../system/Background';
import {Chrome} from '../system/Chrome';
import {GlassPanel} from '../system/GlassPanel';
import {CitationLink, CheckGate} from '../system/icons';
import {SvgPop} from '../system/SvgPop';
import {
  COLOR_AMBER_400,
  COLOR_EMERALD_500,
  COLOR_NAVY_700,
  COLOR_SLATE_400,
  COLOR_TEAL_400,
  COLOR_WHITE,
  COLOR_WHITE_PURE,
} from '../system/colors';
import {FONT_IBM_SANS, FONT_IBM_SERIF, FONT_SORA} from '../system/fonts';
import {springSmooth} from '../system/springs';

const S06 = {
  TITLE: 'Nothing is taken on faith.',
  SUPPORT:
    'Every obligation points to a verbatim source span — and waits for a human gate (Reg 16C-ready).',
  GLOSS: 'Every line points to the exact clause text.',
  SOURCE_LABEL: 'CSCRF · source clause',
  CLAUSE:
    '"Regulated Entities shall conduct a comprehensive cyber audit at least once in a financial year…"',
  CARD_LABEL: 'Extracted obligation',
  FIELDS: [
    ['Actor', 'Stock Broker / CISO'],
    ['Action', 'Conduct annual cyber audit'],
    ['Evidence', 'Audit report + board noting'],
    ['Confidence', '0.91'],
    ['Review', 'Needs human approval'],
  ],
  TRUST: 'Retrieval-grounded · Confidence-scored · Human-gated · AI action log',
  DISCLAIMER: 'Decision support only — not legal advice.',
};

export const S06_Trust: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleSpring = springSmooth(frame, fps);
  const highlightWidth = interpolate(frame, [60, 150], [0, 100], {extrapolateRight: 'clamp'});
  const connectorProgress = spring({
    frame: Math.max(0, frame - 24),
    fps,
    config: {damping: 200, stiffness: 100},
    durationInFrames: 40,
  });
  const ringProgress = interpolate(frame, [210, 250], [0, 0.91], {extrapolateRight: 'clamp'});
  const cardGlow = connectorProgress > 0.9
    ? interpolate(frame, [210, 222], [0, 1], {extrapolateRight: 'clamp'})
    : 0;

  return (
    <AbsoluteFill>
      <RegOSBackground atmosphere="calm" />
      <AbsoluteFill style={{padding: '124px 80px 84px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8}}>
          <SvgPop>
            <CheckGate size={72} progress={titleSpring} color={COLOR_EMERALD_500} />
          </SvgPop>
          <h1
            style={{
              fontFamily: FONT_SORA,
              fontWeight: 700,
              fontSize: 48,
              color: COLOR_WHITE,
              opacity: titleSpring,
              margin: 0,
            }}
          >
            {S06.TITLE}
          </h1>
        </div>
        <p
          style={{
            fontFamily: FONT_IBM_SANS,
            fontSize: 22,
            color: COLOR_SLATE_400,
            marginTop: 12,
            opacity: interpolate(frame, [10, 25], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S06.SUPPORT}
        </p>
        <p
          style={{
            fontFamily: FONT_IBM_SANS,
            fontSize: 15,
            color: COLOR_TEAL_400,
            marginTop: 8,
            fontStyle: 'italic',
            opacity: interpolate(frame, [25, 40], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S06.GLOSS}
        </p>
        <div style={{display: 'flex', gap: 24, marginTop: 40, flex: 1, alignItems: 'center'}}>
          <div
            style={{
              flex: 1,
              background: COLOR_WHITE_PURE,
              borderRadius: 8,
              border: `1px solid ${COLOR_NAVY_700}`,
              padding: 28,
              opacity: interpolate(frame, [15, 30], [0, 1], {extrapolateRight: 'clamp'}),
            }}
          >
            <div
              style={{
                fontFamily: FONT_IBM_SANS,
                fontSize: 14,
                color: COLOR_SLATE_400,
                marginBottom: 16,
              }}
            >
              {S06.SOURCE_LABEL}
            </div>
            <div style={{position: 'relative'}}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${highlightWidth}%`,
                  height: '100%',
                  background: `${COLOR_AMBER_400}59`,
                  borderRadius: 2,
                }}
              />
              <p
                style={{
                  fontFamily: FONT_IBM_SERIF,
                  fontSize: 16,
                  color: '#1e293b',
                  lineHeight: 1.6,
                  margin: 0,
                  position: 'relative',
                }}
              >
                {S06.CLAUSE}
              </p>
            </div>
          </div>
          <SvgPop delay={20} glow>
            <CitationLink
              width={100}
              height={100}
              progress={connectorProgress}
              strokeWidth={3.5}
              color={COLOR_TEAL_400}
            />
          </SvgPop>
          <GlassPanel
            delay={15}
            style={{
              flex: 1,
              padding: 28,
              boxShadow: `0 0 ${cardGlow * 24}px ${COLOR_TEAL_400}33`,
            }}
          >
            <div
              style={{
                fontFamily: FONT_IBM_SANS,
                fontSize: 14,
                color: COLOR_TEAL_400,
                marginBottom: 16,
              }}
            >
              {S06.CARD_LABEL}
            </div>
            {S06.FIELDS.map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: `1px solid ${COLOR_NAVY_700}`,
                  fontFamily: FONT_IBM_SANS,
                  fontSize: 15,
                }}
              >
                <span style={{color: COLOR_SLATE_400}}>{label}</span>
                <span style={{color: COLOR_WHITE}}>{value}</span>
              </div>
            ))}
            <div style={{marginTop: 20, display: 'flex', alignItems: 'center', gap: 12}}>
              <svg width={48} height={48}>
                <circle cx={24} cy={24} r={20} fill="none" stroke={COLOR_NAVY_700} strokeWidth={4} />
                <circle
                  cx={24}
                  cy={24}
                  r={20}
                  fill="none"
                  stroke={COLOR_EMERALD_500}
                  strokeWidth={4}
                  strokeDasharray={`${ringProgress * 125.6} 125.6`}
                  transform="rotate(-90 24 24)"
                />
              </svg>
              <span style={{fontFamily: FONT_SORA, color: COLOR_EMERALD_500, fontWeight: 700}}>
                {Math.round(ringProgress * 100)}%
              </span>
            </div>
          </GlassPanel>
        </div>
        <div
          style={{
            marginTop: 24,
            fontFamily: FONT_IBM_SANS,
            fontSize: 16,
            color: COLOR_TEAL_400,
            opacity: interpolate(frame, [270, 290], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S06.TRUST}
        </div>
        <div
          style={{
            fontFamily: FONT_IBM_SANS,
            fontSize: 14,
            color: COLOR_SLATE_400,
            opacity: interpolate(frame, [280, 300], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S06.DISCLAIMER}
        </div>
      </AbsoluteFill>
      <Chrome slideIndex={6} totalSlides={10} />
    </AbsoluteFill>
  );
};
