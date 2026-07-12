import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrowserChrome} from '../demo_bridge';
import {FONT_IBM_SANS, FONT_SORA} from '../../system/fonts';
import {springSnappy, springUI} from '../../system/springs';
import {
  AMBIGUOUS,
  CAPTIONS,
  DEEP,
  EMERALD,
  ENTITY,
  NAVY_LINE,
  NAVY_PANEL_2,
  ROYAL,
  SLATE,
  SLATE_DIM,
  TEAL,
  WHITE,
} from '../constants';
import {CaptionBar, SectionKicker, SignalField} from '../shared';
import {CameraRig} from '../camera';

const TIERS = ['Small-size', 'Mid-size', 'Qualified'];

const ROWS = [
  {tag: 'RULE', color: TEAL, at: 110, label: 'Rule matched', detail: 'Applies to all registered stock brokers (CSCRF §2.1)'},
  {tag: 'MODEL', color: ROYAL, at: 190, label: 'Model suggested', detail: 'Small-RE reporting-threshold condition extracted · 0.83'},
  {tag: 'HUMAN', color: EMERALD, at: 290, label: 'Human confirmed', detail: 'Officer Priya M. — Applies to Aarohan Securities'},
];

export const B6_Apply: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const profileIn = springUI(Math.max(0, frame - 10), fps);
  const receiptIn = springUI(Math.max(0, frame - 440), fps);
  const sealDraw = interpolate(frame, [500, 548], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // excluded obligation collapse
  const collapse = interpolate(frame, [560, 610], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <SignalField />
      <SectionKicker index="04" step="Apply" concept="Applicability Receipt" />
      <CameraRig
        scale={[[0, 1.0], [60, 1.0], [300, 1.06], [430, 1.06], [520, 1.13], [840, 1.13]]}
        origin="60% 62%"
        style={{alignItems: 'center', justifyContent: 'center', paddingTop: 24, display: 'flex'}}
      >
        <BrowserChrome url={`${ENTITY.url}/applicability`} widthPct={93} maxWidth={1720}>
          <div style={{display: 'flex', gap: 20, padding: 24, minHeight: 520}}>
            {/* Entity profile */}
            <div
              style={{
                width: 320,
                opacity: profileIn,
                transform: `translateX(${(1 - profileIn) * -30}px)`,
              }}
            >
              <div style={{fontFamily: FONT_IBM_SANS, fontSize: 12, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10}}>
                Entity profile
              </div>
              <div style={{background: NAVY_PANEL_2, border: `1px solid ${NAVY_LINE}`, borderRadius: 12, padding: 18}}>
                <div style={{fontFamily: FONT_SORA, fontSize: 18, color: WHITE, fontWeight: 600}}>{ENTITY.short}</div>
                <div style={{display: 'flex', gap: 6, marginTop: 12, marginBottom: 16}}>
                  {TIERS.map((t) => {
                    const active = t === 'Small-size';
                    return (
                      <div
                        key={t}
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          padding: '7px 0',
                          borderRadius: 7,
                          fontFamily: FONT_IBM_SANS,
                          fontSize: 12,
                          fontWeight: 600,
                          color: active ? '#04121F' : SLATE,
                          background: active ? TEAL : 'transparent',
                          border: `1px solid ${active ? TEAL : NAVY_LINE}`,
                        }}
                      >
                        {t}
                      </div>
                    );
                  })}
                </div>
                {[
                  {k: 'Registration', v: 'Stock Broker'},
                  {k: 'Clients', v: '≤ 5,000'},
                  {k: 'Algo / colocation', v: 'None'},
                  {k: 'CSCRF class', v: 'Small-size RE'},
                ].map((f) => (
                  <div key={f.k} style={{display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: `1px solid ${NAVY_LINE}`}}>
                    <span style={{fontFamily: FONT_IBM_SANS, fontSize: 13, color: SLATE}}>{f.k}</span>
                    <span style={{fontFamily: FONT_IBM_SANS, fontSize: 13, color: WHITE, fontWeight: 500}}>{f.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Applicability decision */}
            <div style={{flex: 1}}>
              <div style={{fontFamily: FONT_SORA, fontSize: 18, color: WHITE, fontWeight: 600, marginBottom: 4}}>
                OB-0863 · Report cyber incidents within SLA
              </div>
              <div style={{fontFamily: FONT_IBM_SANS, fontSize: 13, color: SLATE, marginBottom: 16}}>
                Does this obligation apply to {ENTITY.short}?
              </div>

              {ROWS.map((r) => {
                const enter = springSnappy(Math.max(0, frame - r.at), fps);
                return (
                  <div
                    key={r.tag}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '13px 16px',
                      marginBottom: 9,
                      background: NAVY_PANEL_2,
                      border: `1px solid ${NAVY_LINE}`,
                      borderRadius: 8,
                      opacity: enter,
                      transform: `translateY(${(1 - enter) * 18}px)`,
                    }}
                  >
                    <span
                      style={{
                        width: 74,
                        textAlign: 'center',
                        fontFamily: FONT_IBM_SANS,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: r.color,
                        border: `1px solid ${r.color}66`,
                        borderRadius: 5,
                        padding: '4px 0',
                      }}
                    >
                      {r.tag}
                    </span>
                    <div style={{flex: 1}}>
                      <div style={{fontFamily: FONT_IBM_SANS, fontSize: 15, color: WHITE, fontWeight: 600}}>{r.label}</div>
                      <div style={{fontFamily: FONT_IBM_SANS, fontSize: 13, color: SLATE}}>{r.detail}</div>
                    </div>
                    <span style={{color: TEAL, fontSize: 18}}>✓</span>
                  </div>
                );
              })}

              {/* Applicability Receipt seal */}
              {receiptIn > 0 && (
                <div
                  style={{
                    marginTop: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 18px',
                    borderRadius: 10,
                    background: `${TEAL}12`,
                    border: `1px solid ${TEAL}`,
                    opacity: receiptIn,
                    transform: `scale(${0.96 + receiptIn * 0.04})`,
                  }}
                >
                  <svg width={46} height={46} viewBox="0 0 46 46">
                    <circle cx={23} cy={23} r={19} fill="none" stroke={TEAL} strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sealDraw} transform="rotate(-90 23 23)" />
                    <path d="M15 23 L21 29 L32 17" fill="none" stroke={TEAL} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, (sealDraw - 0.5) * 2)} />
                  </svg>
                  <div style={{flex: 1}}>
                    <div style={{fontFamily: FONT_SORA, fontSize: 16, color: TEAL, fontWeight: 700}}>Applicability Receipt · sealed</div>
                    <div style={{fontFamily: FONT_IBM_SANS, fontSize: 13, color: '#BFEFE7'}}>
                      Applies · rule + model + human · obligation.v1 · CSCRF Aug 2024
                    </div>
                  </div>
                </div>
              )}

              {/* Excluded obligation collapses to an audited hairline */}
              <div
                style={{
                  marginTop: 10,
                  overflow: 'hidden',
                  height: interpolate(collapse, [0, 1], [58, 34]),
                  opacity: interpolate(collapse, [0, 1], [1, 0.6]),
                  background: collapse > 0.5 ? 'transparent' : NAVY_PANEL_2,
                  border: `1px ${collapse > 0.5 ? 'dashed' : 'solid'} ${collapse > 0.5 ? SLATE_DIM : NAVY_LINE}`,
                  borderRadius: 8,
                  padding: collapse > 0.5 ? '7px 16px' : '13px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{fontFamily: FONT_IBM_SANS, fontSize: 12, fontWeight: 700, color: AMBIGUOUS}}>OB-0871</span>
                <span style={{flex: 1, fontFamily: FONT_IBM_SANS, fontSize: collapse > 0.5 ? 12 : 14, color: collapse > 0.5 ? SLATE_DIM : WHITE}}>
                  Algo / colocation risk controls
                </span>
                <span style={{fontFamily: FONT_IBM_SANS, fontSize: 12, color: SLATE_DIM}}>
                  {collapse > 0.5 ? 'Excluded — not applicable to Small-RE · reason cited' : 'Evaluating…'}
                </span>
              </div>
            </div>
          </div>
        </BrowserChrome>
      </CameraRig>
      <CaptionBar text={CAPTIONS.apply} delay={30} />
    </AbsoluteFill>
  );
};
