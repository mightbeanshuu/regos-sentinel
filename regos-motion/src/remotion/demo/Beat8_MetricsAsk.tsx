import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {RegOSBackground} from '../system/Background';
import {
  COLOR_EMERALD_500,
  COLOR_NAVY_700,
  COLOR_NAVY_800,
  COLOR_NAVY_900,
  COLOR_SLATE_400,
  COLOR_TEAL_400,
  COLOR_TEAL_500,
  COLOR_WHITE,
  STAGGER,
} from '../system/colors';
import {FONT_IBM_SANS, FONT_SORA} from '../system/fonts';
import {springBouncy, springSnappy, springUI} from '../system/springs';
import {Logo} from '../system/Logo';
import {METRIC_HUD} from './constants';

const BEAT8 = {
  SANDBOX_TITLE: 'Built for SEBI Innovation Sandbox.',
  SANDBOX_SUB:
    'Public circulars → synthetic evidence → MII/intermediary pilot.',
  PILOT: 'Pilot path: one broker → industry body → MII.',
  URL: 'github.com/regos-sentinel',
} as const;

const METRICS = [
  {label: 'Docs', value: String(METRIC_HUD.docs.end)},
  {label: 'Obligations', value: String(METRIC_HUD.obligations.end)},
  {label: 'Citation', value: METRIC_HUD.citation},
  {label: 'Time-to-plan', value: `<3 min`},
] as const;

export const Beat8_MetricsSandboxAsk: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const sandboxStart = 210;
  const outroStart = 390;

  const sandboxSpring = springUI(Math.max(0, frame - sandboxStart), fps);
  const outroSpring = springSnappy(Math.max(0, frame - outroStart), fps);
  const logoSpring = springBouncy(Math.max(0, frame - outroStart - 20), fps);

  return (
    <AbsoluteFill>
      <RegOSBackground showHairline={false} />
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 80,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            maxWidth: 800,
            width: '100%',
            marginBottom: 48,
          }}
        >
          {METRICS.map((metric, i) => {
            const enter = springBouncy(Math.max(0, frame - i * STAGGER * 4), fps);
            const isCitation = metric.label === 'Citation';
            const isTime = metric.label === 'Time-to-plan';
            return (
              <div
                key={metric.label}
                style={{
                  background: COLOR_NAVY_900,
                  border: `1px solid ${COLOR_NAVY_700}`,
                  borderRadius: 12,
                  padding: '28px 32px',
                  opacity: enter,
                  transform: `scale(${enter}) translateY(${(1 - enter) * 24}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_IBM_SANS,
                    fontSize: 14,
                    color: COLOR_SLATE_400,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                  }}
                >
                  {metric.label}
                </div>
                <div
                  style={{
                    fontFamily: FONT_SORA,
                    fontWeight: 700,
                    fontSize: 48,
                    color: isCitation || isTime ? COLOR_EMERALD_500 : COLOR_TEAL_400,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {metric.value}
                </div>
                {isTime && (
                  <div
                    style={{
                      fontFamily: FONT_IBM_SANS,
                      fontSize: 14,
                      color: COLOR_SLATE_400,
                      marginTop: 4,
                    }}
                  >
                    ({METRIC_HUD.timeToPlan} demo)
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {frame >= sandboxStart && (
          <div
            style={{
              textAlign: 'center',
              opacity: sandboxSpring,
              transform: `translateY(${(1 - sandboxSpring) * 20}px)`,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                fontFamily: FONT_SORA,
                fontWeight: 700,
                fontSize: 36,
                color: COLOR_WHITE,
                marginBottom: 12,
              }}
            >
              {BEAT8.SANDBOX_TITLE}
            </div>
            <div
              style={{
                fontFamily: FONT_IBM_SANS,
                fontSize: 18,
                color: COLOR_SLATE_400,
                fontStyle: 'italic',
              }}
            >
              {BEAT8.SANDBOX_SUB}
            </div>
          </div>
        )}

        {frame >= outroStart && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              opacity: outroSpring,
            }}
          >
            <div style={{opacity: logoSpring, transform: `scale(${logoSpring})`}}>
              <Logo size="md" />
            </div>
            <div
              style={{
                fontFamily: FONT_IBM_SANS,
                fontSize: 16,
                color: COLOR_TEAL_400,
              }}
            >
              {BEAT8.URL}
            </div>
            <div
              style={{
                fontFamily: FONT_IBM_SANS,
                fontSize: 15,
                color: COLOR_WHITE,
                padding: '10px 20px',
                background: COLOR_NAVY_800,
                border: `1px solid ${COLOR_TEAL_500}`,
                borderRadius: 8,
              }}
            >
              {BEAT8.PILOT}
            </div>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
