import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {RegOSBackground} from '../system/Background';
import {
  COLOR_EMERALD_500,
  COLOR_NAVY_700,
  COLOR_NAVY_800,
  COLOR_SLATE_400,
  COLOR_WHITE,
} from '../system/colors';
import {FONT_IBM_SANS} from '../system/fonts';
import {springSnappy} from '../system/springs';
import {AgentPipelineStrip} from './Beat2_BrandAgents';
import {BrowserChrome} from './BrowserChrome';
import {CORPUS, ENTITY} from './constants';
import {UICursor} from './UICursor';

const BEAT3 = {
  POSTURE: 62,
  TASKS: 18,
  SYNC: 'just now',
};

export const Beat3_EntitySetup: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const contentOpacity = interpolate(frame, [180, 220], [0, 1], {extrapolateRight: 'clamp'});
  const cursorX = interpolate(frame, [60, 90, 120], [400, 520, 520], {extrapolateRight: 'clamp'});
  const cursorY = interpolate(frame, [60, 90, 120], [200, 240, 240], {extrapolateRight: 'clamp'});
  const clicking = frame > 85 && frame < 100;
  const chipPop = (i: number) => springSnappy(Math.max(0, frame - 140 - i * 15), fps);

  return (
    <AbsoluteFill>
      <RegOSBackground />
      <AbsoluteFill style={{paddingTop: 60, position: 'relative'}}>
        <BrowserChrome url={ENTITY.url}>
          <div style={{padding: 32, position: 'relative'}}>
            <div
              style={{
                fontFamily: FONT_IBM_SANS,
                fontSize: 14,
                color: COLOR_SLATE_400,
                marginBottom: 16,
              }}
            >
              Entity picker
            </div>
            <div
              style={{
                padding: '12px 16px',
                border: `1px solid ${COLOR_NAVY_700}`,
                borderRadius: 8,
                fontFamily: FONT_IBM_SANS,
                fontSize: 16,
                color: COLOR_WHITE,
                marginBottom: 12,
                background: frame > 100 ? COLOR_NAVY_800 : 'transparent',
              }}
            >
              Stock Broker → Small-size RE → {frame > 100 ? ENTITY.name : 'Select entity…'}
            </div>
            <div style={{display: 'flex', gap: 12, marginTop: 24}}>
              {CORPUS.map((c, i) => (
                <div
                  key={c}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: `1px solid ${chipPop(i) > 0.5 ? COLOR_EMERALD_500 : COLOR_NAVY_700}`,
                    fontFamily: FONT_IBM_SANS,
                    fontSize: 14,
                    color: chipPop(i) > 0.5 ? COLOR_EMERALD_500 : COLOR_SLATE_400,
                    opacity: chipPop(i),
                  }}
                >
                  {chipPop(i) > 0.5 ? '✓ ' : ''}
                  {c}
                </div>
              ))}
            </div>
            <div style={{opacity: contentOpacity, marginTop: 48}}>
              <div style={{display: 'flex', gap: 48, alignItems: 'center'}}>
                <div style={{position: 'relative', width: 120, height: 120}}>
                  <svg width={120} height={120}>
                    <circle cx={60} cy={60} r={50} fill="none" stroke={COLOR_NAVY_700} strokeWidth={8} />
                    <circle
                      cx={60}
                      cy={60}
                      r={50}
                      fill="none"
                      stroke={COLOR_EMERALD_500}
                      strokeWidth={8}
                      strokeDasharray={`${BEAT3.POSTURE * 3.14} 314`}
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: FONT_IBM_SANS,
                      fontWeight: 700,
                      fontSize: 28,
                      color: COLOR_WHITE,
                    }}
                  >
                    {BEAT3.POSTURE}%
                  </div>
                </div>
                <div>
                  <div style={{fontFamily: FONT_IBM_SANS, fontSize: 16, color: COLOR_WHITE}}>
                    Open tasks: <strong>{BEAT3.TASKS}</strong>
                  </div>
                  <div style={{fontFamily: FONT_IBM_SANS, fontSize: 14, color: COLOR_SLATE_400, marginTop: 8}}>
                    Last sync: {BEAT3.SYNC}
                  </div>
                </div>
              </div>
              <div style={{marginTop: 32}}>
                <AgentPipelineStrip startFrame={200} compact />
              </div>
            </div>
          </div>
        </BrowserChrome>
        {frame > 50 && frame < 200 && (
          <UICursor x={cursorX} y={cursorY + 60} clicking={clicking} />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
