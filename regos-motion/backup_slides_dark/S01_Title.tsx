import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {RegOSBackground} from '../system/Background';
import {NetworkField} from '../system/NetworkField';
import {Chrome} from '../system/Chrome';
import {
  COLOR_SLATE_400,
  COLOR_TEAL_400,
  COLOR_WHITE,
} from '../system/colors';
import {FONT_IBM_SANS, FONT_SORA} from '../system/fonts';
import {Logo} from '../system/Logo';
import {SvgPop} from '../system/SvgPop';
import {springSmooth} from '../system/springs';
import {Typewriter} from '../system/Typography';

const S01 = {
  EYEBROW: 'SEBI TECHSPRINT 2026 · PS2',
  LINE: 'Circulars → cited obligations → audit-ready action.',
  HIGHLIGHT: 'cited obligations',
  SUB: 'An agentic compliance OS for SEBI intermediaries.',
  GLOSS: 'Agents that produce owners, deadlines, and evidence — not essays.',
};

export const S01_Title: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const shieldDraw = spring({
    frame,
    fps,
    config: {damping: 200, stiffness: 120},
    durationInFrames: 14,
  });
  const eyebrowSpring = springSmooth(Math.max(0, frame - 12), fps);
  const underlineWidth = interpolate(frame, [90, 110], [0, 100], {extrapolateRight: 'clamp'});
  const subOpacity = interpolate(frame, [70, 90], [0, 1], {extrapolateRight: 'clamp'});
  const chromeOpacity = interpolate(frame, [8, 20], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <RegOSBackground showHairline atmosphere="hero" />
      <NetworkField opacity={0.55} startFrame={6} />
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 96,
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            opacity: eyebrowSpring,
            transform: `translateY(${(1 - eyebrowSpring) * 12}px)`,
            fontFamily: FONT_IBM_SANS,
            fontSize: 18,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: COLOR_SLATE_400,
            marginBottom: 24,
          }}
        >
          {S01.EYEBROW}
        </div>
        <div style={{marginBottom: 40}}>
          <SvgPop delay={8}>
            <Logo size="lg" centered drawProgress={shieldDraw} showWordmark />
          </SvgPop>
        </div>
        <div
          style={{
            fontFamily: FONT_SORA,
            fontWeight: 600,
            fontSize: 36,
            color: COLOR_WHITE,
            textAlign: 'center',
            lineHeight: 1.4,
            marginBottom: 24,
            position: 'relative',
          }}
        >
          <Typewriter text={S01.LINE} startFrame={36} />
          {frame > 70 && (
            <div
              style={{
                position: 'absolute',
                bottom: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: `${underlineWidth * 0.42}%`,
                height: 2,
                background: COLOR_TEAL_400,
                borderRadius: 1,
              }}
            />
          )}
        </div>
        <div
          style={{
            opacity: subOpacity,
            fontFamily: FONT_IBM_SANS,
            fontSize: 22,
            color: COLOR_SLATE_400,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          {S01.SUB}
        </div>
        <div
          style={{
            opacity: interpolate(frame, [100, 120], [0, 1], {extrapolateRight: 'clamp'}),
            fontFamily: FONT_IBM_SANS,
            fontSize: 16,
            color: COLOR_TEAL_400,
            textAlign: 'center',
            marginTop: 16,
            fontStyle: 'italic',
          }}
        >
          {S01.GLOSS}
        </div>
      </AbsoluteFill>
      <div style={{opacity: chromeOpacity}}>
        <Chrome slideIndex={1} totalSlides={10} showLogo={false} />
      </div>
    </AbsoluteFill>
  );
};
