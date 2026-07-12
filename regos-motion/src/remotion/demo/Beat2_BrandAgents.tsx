import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {RegOSBackground} from '../system/Background';
import {Logo} from '../system/Logo';
import {
  COLOR_NAVY_700,
  COLOR_SLATE_400,
  COLOR_TEAL_400,
  COLOR_TEAL_500,
  COLOR_WHITE,
} from '../system/colors';
import {FONT_IBM_SANS, FONT_SORA} from '../system/fonts';
import {springSnappy, springUI} from '../system/springs';

const BEAT2 = {
  TAGLINE: 'Agentic compliance OS',
  SUBLINE: 'Cited. Scored. Human-approved.',
  AGENTS: ['Watcher', 'Interpreter', 'Mapper', 'Evidence', 'Auditor'],
};

export const AgentPipelineStrip: React.FC<{
  startFrame?: number;
  compact?: boolean;
}> = ({startFrame = 0, compact = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 8 : 16,
        justifyContent: 'center',
      }}
    >
      {BEAT2.AGENTS.map((agent, i) => {
        const enter = springSnappy(Math.max(0, frame - startFrame - i * 6), fps);
        const lit = frame > startFrame + i * 6 + 10;

        return (
          <React.Fragment key={agent}>
            {i > 0 && (
              <div
                style={{
                  width: compact ? 20 : 40,
                  height: 2,
                  background: lit ? COLOR_TEAL_500 : COLOR_NAVY_700,
                }}
              />
            )}
            <div
              style={{
                opacity: enter,
                transform: `scale(${interpolate(enter, [0, 1], [0.8, 1])})`,
                padding: compact ? '6px 12px' : '10px 18px',
                borderRadius: 20,
                border: `1px solid ${lit ? COLOR_TEAL_500 : COLOR_NAVY_700}`,
                background: lit ? `${COLOR_TEAL_500}22` : 'transparent',
                fontFamily: FONT_IBM_SANS,
                fontSize: compact ? 12 : 14,
                fontWeight: 500,
                color: lit ? COLOR_TEAL_400 : COLOR_WHITE,
              }}
            >
              {agent}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Beat2_BrandAgents: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const logoSpring = springUI(frame, fps);
  const subOpacity = interpolate(frame, [210, 270], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <RegOSBackground />
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        <div
          style={{
            transform: `scale(${interpolate(logoSpring, [0, 1], [0.92, 1])})`,
            opacity: logoSpring,
          }}
        >
          <Logo size="lg" centered />
        </div>
        <div
          style={{
            fontFamily: FONT_IBM_SANS,
            fontSize: 22,
            color: COLOR_SLATE_400,
            fontStyle: 'italic',
            opacity: logoSpring,
          }}
        >
          {BEAT2.TAGLINE}
        </div>
        <AgentPipelineStrip startFrame={60} />
        <div
          style={{
            fontFamily: FONT_SORA,
            fontWeight: 600,
            fontSize: 28,
            color: COLOR_WHITE,
            opacity: subOpacity,
          }}
        >
          {BEAT2.SUBLINE}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
