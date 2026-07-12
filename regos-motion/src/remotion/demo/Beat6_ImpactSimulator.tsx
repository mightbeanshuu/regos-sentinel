import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  COLOR_AMBER_400,
  COLOR_EMERALD_500,
  COLOR_NAVY_700,
  COLOR_NAVY_800,
  COLOR_NAVY_900,
  COLOR_ROSE_500,
  COLOR_SLATE_400,
  COLOR_TEAL_400,
  COLOR_TEAL_500,
  COLOR_WHITE,
  STAGGER,
} from '../system/colors';
import {FONT_IBM_SANS, FONT_SORA} from '../system/fonts';
import {springBouncy, springSnappy, springUI} from '../system/springs';
import {CLIMAX_CIRCULAR, IMPACT_DIFFS} from './constants';
import {RegOSBackground} from '../system/Background';

const BEAT6 = {
  TITLE: 'Change-Impact Simulator',
  CTA: 'Simulate New SEBI Circular',
  BEFORE: 'Weeks',
  AFTER: 'Minutes',
  RISK_BEFORE: 'Medium',
  RISK_AFTER: 'Elevated',
};

export const Beat6_ImpactSimulator: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleSpring = springUI(frame, fps);
  const zoom = interpolate(frame, [60, 90, 120], [1, 1.04, 1], {extrapolateRight: 'clamp'});
  const cardEnter = springSnappy(Math.max(0, frame - 120), fps);
  const morphStart = 480;
  const weeksOpacity = interpolate(frame, [morphStart, morphStart + 40], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const minutesSpring = springBouncy(Math.max(0, frame - morphStart - 30), fps);

  return (
    <AbsoluteFill>
      <RegOSBackground showHairline={false} />
      <AbsoluteFill
        style={{
          transform: `scale(${zoom})`,
          padding: '48px 64px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(6,16,31,0.75)',
          }}
        />
        <h1
          style={{
            position: 'relative',
            fontFamily: FONT_SORA,
            fontWeight: 700,
            fontSize: 48,
            color: COLOR_WHITE,
            textAlign: 'center',
            opacity: titleSpring,
            marginBottom: 32,
          }}
        >
          {BEAT6.TITLE}
        </h1>
        <div style={{display: 'flex', justifyContent: 'center', marginBottom: 24, position: 'relative'}}>
          <button
            style={{
              padding: '14px 28px',
              background: COLOR_TEAL_500,
              color: COLOR_WHITE,
              border: 'none',
              borderRadius: 8,
              fontFamily: FONT_IBM_SANS,
              fontWeight: 600,
              fontSize: 16,
              opacity: titleSpring,
            }}
          >
            {BEAT6.CTA}
          </button>
          {frame > 90 && frame < 150 && (
            <div
              style={{
                position: 'absolute',
                right: '25%',
                top: -8,
                background: COLOR_ROSE_500,
                color: COLOR_WHITE,
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: 4,
                fontFamily: FONT_IBM_SANS,
              }}
            >
              NEW
            </div>
          )}
        </div>
        <div
          style={{
            position: 'relative',
            maxWidth: 700,
            margin: '0 auto 32px',
            background: COLOR_NAVY_800,
            border: `1px solid ${COLOR_NAVY_700}`,
            borderRadius: 8,
            padding: 20,
            opacity: cardEnter,
            transform: `translateY(${(1 - cardEnter) * -30}px)`,
          }}
        >
          <div style={{fontFamily: FONT_IBM_SANS, fontSize: 14, color: COLOR_TEAL_400}}>
            Incoming circular
          </div>
          <div style={{fontFamily: FONT_SORA, fontSize: 20, color: COLOR_WHITE, marginTop: 8}}>
            {CLIMAX_CIRCULAR}
          </div>
        </div>
        <div style={{display: 'flex', gap: 48, position: 'relative'}}>
          <div style={{flex: 1}}>
            {IMPACT_DIFFS.map((diff, i) => {
              const enter = springSnappy(Math.max(0, frame - 180 - i * STAGGER * 2), fps);
              const isRisk = diff.includes('Risk');
              return (
                <div
                  key={diff}
                  style={{
                    opacity: enter,
                    transform: `translateX(${(1 - enter) * -24}px)`,
                    padding: '12px 16px',
                    marginBottom: 8,
                    borderLeft: `3px solid ${isRisk ? COLOR_AMBER_400 : COLOR_EMERALD_500}`,
                    background: COLOR_NAVY_900,
                    fontFamily: FONT_IBM_SANS,
                    fontSize: 16,
                    color: COLOR_WHITE,
                  }}
                >
                  {diff}
                </div>
              );
            })}
            <div
              style={{
                marginTop: 16,
                fontFamily: FONT_IBM_SANS,
                fontSize: 14,
                color: COLOR_AMBER_400,
                opacity: interpolate(frame, [360, 400], [0, 1], {extrapolateRight: 'clamp'}),
              }}
            >
              Risk: {BEAT6.RISK_BEFORE} → {BEAT6.RISK_AFTER}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              gap: 16,
              opacity: interpolate(frame, [400, 440], [0, 1], {extrapolateRight: 'clamp'}),
            }}
          >
            <div
              style={{
                flex: 1,
                background: COLOR_NAVY_900,
                borderRadius: 8,
                padding: 16,
                border: `1px solid ${COLOR_NAVY_700}`,
              }}
            >
              <div style={{fontFamily: FONT_IBM_SANS, fontSize: 12, color: COLOR_SLATE_400}}>Before</div>
              <div style={{marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8}}>
                {['CISO', 'Ops', 'Compliance'].map((n) => (
                  <div
                    key={n}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 4,
                      background: COLOR_NAVY_800,
                      fontFamily: FONT_IBM_SANS,
                      fontSize: 12,
                      color: COLOR_SLATE_400,
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                background: COLOR_NAVY_900,
                borderRadius: 8,
                padding: 16,
                border: `1px solid ${COLOR_TEAL_500}`,
              }}
            >
              <div style={{fontFamily: FONT_IBM_SANS, fontSize: 12, color: COLOR_TEAL_400}}>After</div>
              <div style={{marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8}}>
                {['CISO', 'Ops', 'Compliance', 'Grievance'].map((n, i) => (
                  <div
                    key={n}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 4,
                      background: i > 2 ? `${COLOR_TEAL_500}33` : COLOR_NAVY_800,
                      border: i > 2 ? `1px solid ${COLOR_TEAL_500}` : 'none',
                      fontFamily: FONT_IBM_SANS,
                      fontSize: 12,
                      color: i > 2 ? COLOR_TEAL_400 : COLOR_SLATE_400,
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: 0,
            right: 0,
            textAlign: 'center',
            height: 100,
          }}
        >
          <div
            style={{
              fontFamily: FONT_SORA,
              fontWeight: 700,
              fontSize: 80,
              color: COLOR_ROSE_500,
              opacity: weeksOpacity,
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {BEAT6.BEFORE}
          </div>
          {frame > morphStart && (
            <div
              style={{
                fontFamily: FONT_SORA,
                fontWeight: 700,
                fontSize: 80,
                color: COLOR_EMERALD_500,
                opacity: minutesSpring,
                transform: `scale(${interpolate(minutesSpring, [0, 1], [0.85, 1])}) translateX(-50%)`,
                position: 'absolute',
                left: '50%',
              }}
            >
              {BEAT6.BEFORE} → {BEAT6.AFTER}
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
