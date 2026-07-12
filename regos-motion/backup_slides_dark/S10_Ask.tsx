import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {RegOSBackground} from '../system/Background';
import {GlassPanel} from '../system/GlassPanel';
import {CheckGate, SandboxBox} from '../system/icons';
import {Logo} from '../system/Logo';
import {SvgPop} from '../system/SvgPop';
import {
  COLOR_SLATE_400,
  COLOR_TEAL_400,
  COLOR_WHITE,
  STAGGER,
} from '../system/colors';
import {FONT_IBM_SANS, FONT_SORA} from '../system/fonts';
import {springSmooth} from '../system/springs';
import {HighlightText, Typewriter} from '../system/Typography';

const S10 = {
  TITLE: 'Ask',
  BODY: 'Pilot path: one broker → industry body → MII.',
  BODY2: 'Plus anonymized SupTech readiness for SEBI — with a Reg 16C HITL pack.',
  BOX_H: 'Sandbox-ready packaging',
  BOX: [
    '90-day pilot plan',
    'KPI sheet',
    'Model card · risk register · DPDP statement',
    'Human-in-the-loop policy (Reg 16C-ready)',
    'Preserve KYC/AML/investor safeguards',
  ],
  CLOSE: 'From rule text to sandbox-ready operational action.',
};

const CheckItem: React.FC<{text: string; delay: number}> = ({text, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gateProgress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {damping: 200, stiffness: 100},
    durationInFrames: 24,
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        fontFamily: FONT_IBM_SANS,
        fontSize: 16,
        color: COLOR_WHITE,
      }}
    >
      <CheckGate size={24} progress={gateProgress} />
      <span style={{opacity: gateProgress}}>{text}</span>
    </div>
  );
};

export const S10_Ask: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleSpring = springSmooth(frame, fps);
  const boxDraw = spring({
    frame: Math.max(0, frame - 110),
    fps,
    config: {damping: 200, stiffness: 80},
    durationInFrames: 28,
  });
  const brandOpacity = interpolate(frame, [180, 210], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <RegOSBackground atmosphere="hero" showHairline={false} />
      <AbsoluteFill style={{padding: '100px 96px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <SvgPop>
            <SandboxBox size={72} progress={1} color={COLOR_TEAL_400} />
          </SvgPop>
          <h1
            style={{
              fontFamily: FONT_SORA,
              fontWeight: 700,
              fontSize: 72,
              color: COLOR_WHITE,
              opacity: titleSpring,
              margin: 0,
            }}
          >
            {S10.TITLE}
          </h1>
        </div>
        <div
          style={{
            marginTop: 32,
            fontFamily: FONT_IBM_SANS,
            fontSize: 28,
            color: COLOR_WHITE,
            maxWidth: 800,
          }}
        >
          <Typewriter text={S10.BODY} startFrame={45} />
        </div>
        <p
          style={{
            marginTop: 16,
            fontFamily: FONT_IBM_SANS,
            fontSize: 22,
            color: COLOR_SLATE_400,
            opacity: interpolate(frame, [90, 110], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S10.BODY2}
        </p>
        <GlassPanel
          delay={110}
          style={{
            marginTop: 40,
            padding: 28,
            maxWidth: 640,
            display: 'flex',
            gap: 20,
            alignItems: 'flex-start',
          }}
        >
          <SvgPop delay={110}>
            <SandboxBox size={56} progress={boxDraw} color={COLOR_TEAL_400} />
          </SvgPop>
          <div style={{flex: 1}}>
            <div
              style={{
                fontFamily: FONT_SORA,
                fontWeight: 600,
                fontSize: 20,
                color: COLOR_TEAL_400,
                marginBottom: 12,
              }}
            >
              {S10.BOX_H}
            </div>
            {S10.BOX.map((item, i) => (
              <CheckItem key={item} text={item} delay={130 + i * STAGGER * 2} />
            ))}
          </div>
        </GlassPanel>
        <div
          style={{
            marginTop: 48,
            fontFamily: FONT_SORA,
            fontSize: 28,
            color: COLOR_WHITE,
            opacity: interpolate(frame, [195, 215], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          <HighlightText
            text={S10.CLOSE}
            highlight="sandbox-ready"
            highlightColor={COLOR_TEAL_400}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            opacity: brandOpacity,
          }}
        >
          <Logo size="md" centered />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
