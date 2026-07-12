import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {RegOSBackground} from '../system/Background';
import {Chrome} from '../system/Chrome';
import {AgentNode, CheckGate} from '../system/icons';
import {StrokeDraw} from '../system/StrokeDraw';
import {SvgPop} from '../system/SvgPop';
import {
  COLOR_EMERALD_500,
  COLOR_NAVY_700,
  COLOR_SLATE_400,
  COLOR_TEAL_500,
  COLOR_WHITE,
} from '../system/colors';
import {FONT_IBM_SANS, FONT_SORA} from '../system/fonts';
import {springPop, springSmooth} from '../system/springs';

const S05 = {
  TITLE: 'Five supervised agents. One human gate each.',
  SUPPORT: 'Narrow roles. Logged actions. No black-box autopilot.',
  GLOSS: 'No obligation goes live without a human gate.',
  AGENTS: [
    {name: 'Watcher', sub: 'Detect new / amended circulars'},
    {
      name: 'Interpreter',
      sub: 'Extract actor · action · deadline · evidence · citation',
    },
    {name: 'Mapper', sub: 'Owners · controls · applicability filter'},
    {name: 'Evidence', sub: 'Tasks · uploads · validation'},
    {name: 'Auditor', sub: 'Audit pack · risk heatmap'},
  ],
  CAPTION: 'SEBI PDF → Obligation graph → Workflow → Audit pack',
};

const BASE_DELAY = 0;
const STAGGER = 6;
const PIPELINE_D = 'M 80 36 L 400 36 L 720 36 L 1040 36 L 1360 36 L 1680 36';

export const S05_Agents: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleSpring = springSmooth(frame, fps);
  const pipelineDraw = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: {damping: 200, stiffness: 100},
    durationInFrames: 60,
  });

  return (
    <AbsoluteFill>
      <RegOSBackground atmosphere="calm" />
      <AbsoluteFill style={{padding: '132px 80px 104px'}}>
        <h1
          style={{
            fontFamily: FONT_SORA,
            fontWeight: 700,
            fontSize: 48,
            color: COLOR_WHITE,
            margin: 0,
            letterSpacing: '-0.02em',
            opacity: titleSpring,
          }}
        >
          {S05.TITLE}
        </h1>
        <p
          style={{
            fontFamily: FONT_IBM_SANS,
            fontSize: 22,
            color: COLOR_SLATE_400,
            marginTop: 16,
            opacity: interpolate(frame, [15, 30], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S05.SUPPORT}
        </p>
        <p
          style={{
            fontFamily: FONT_IBM_SANS,
            fontSize: 16,
            color: COLOR_TEAL_500,
            marginTop: 8,
            fontStyle: 'italic',
            opacity: interpolate(frame, [30, 45], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S05.GLOSS}
        </p>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '0 40px',
          }}
        >
          <svg
            width="100%"
            height={80}
            viewBox="0 0 1760 80"
            style={{position: 'absolute', top: 0, left: 0, right: 0}}
            preserveAspectRatio="none"
          >
            <StrokeDraw d={PIPELINE_D} delay={12} color={COLOR_NAVY_700} width={2.5} durationHint={60} />
            <StrokeDraw d={PIPELINE_D} delay={12} color={COLOR_TEAL_500} width={3} durationHint={60} />
          </svg>
          {S05.AGENTS.map((agent, i) => {
            const delay = BASE_DELAY + i * STAGGER;
            const pop = springPop(Math.max(0, frame - delay), fps);
            const gateProgress = spring({
              frame: Math.max(0, frame - delay - 8),
              fps,
              config: {damping: 200, stiffness: 100},
              durationInFrames: 24,
            });
            const activated = pipelineDraw > (i / (S05.AGENTS.length - 1)) * 0.85;

            return (
              <div
                key={agent.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 160,
                  marginTop: 8,
                }}
              >
                <SvgPop delay={delay} style={{marginBottom: 4}}>
                  <CheckGate size={28} progress={gateProgress} color={COLOR_EMERALD_500} />
                </SvgPop>
                <SvgPop delay={delay}>
                  <div
                    style={{
                      border: `3px solid ${activated ? COLOR_TEAL_500 : COLOR_NAVY_700}`,
                      borderRadius: '50%',
                      background: activated ? `${COLOR_EMERALD_500}33` : 'transparent',
                      padding: 8,
                    }}
                  >
                    <AgentNode size={64} color={COLOR_TEAL_500} popped={1} progress={pop} />
                  </div>
                </SvgPop>
                <div
                  style={{
                    fontFamily: FONT_SORA,
                    fontWeight: 600,
                    fontSize: 14,
                    color: COLOR_WHITE,
                    marginTop: 8,
                    opacity: pop,
                  }}
                >
                  {agent.name}
                </div>
                <div
                  style={{
                    fontFamily: FONT_IBM_SANS,
                    fontSize: 12,
                    color: COLOR_SLATE_400,
                    textAlign: 'center',
                    marginTop: 8,
                    lineHeight: 1.35,
                    opacity: pop,
                  }}
                >
                  {agent.sub}
                </div>
              </div>
            );
          })}
        </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 88,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: FONT_IBM_SANS,
            fontSize: 18,
            color: COLOR_SLATE_400,
            opacity: interpolate(frame, [280, 310], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S05.CAPTION}
        </div>
      </AbsoluteFill>
      <Chrome slideIndex={5} totalSlides={10} />
    </AbsoluteFill>
  );
};
