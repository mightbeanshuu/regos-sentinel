import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrowserChrome} from '../demo_bridge';
import {FONT_IBM_SANS, FONT_SORA} from '../../system/fonts';
import {springSnappy, springUI} from '../../system/springs';
import {
  AMBIGUOUS,
  CAPTIONS,
  ENTITY,
  INK,
  NAVY_LINE,
  NAVY_PANEL_2,
  SLATE,
  SLATE_DIM,
  SOURCE,
  TEAL,
  WHITE,
} from '../constants';
import {CaptionBar, SectionKicker, SignalField} from '../shared';
import {CameraRig} from '../camera';

type State = 'compiled' | 'info' | 'ambiguous';

const SEGMENTS: {clause: string; title: string; state: State}[] = [
  {clause: '§ 3.1', title: 'Governance & board oversight', state: 'compiled'},
  {clause: '§ 4.2', title: 'Access control policy', state: 'compiled'},
  {clause: '§ 5.1', title: 'Scope & applicability', state: 'info'},
  {clause: '§ 6.2', title: 'Cyber audit after audit period', state: 'compiled'},
  {clause: '§ 6.4', title: 'Incident reporting SLA', state: 'compiled'},
  {clause: '§ 7.3', title: 'VAPT cadence', state: 'compiled'},
  {clause: '§ 8.1', title: 'Definitions', state: 'info'},
  {clause: '§ 9.5', title: 'Evidence retention window', state: 'ambiguous'},
];

const STATE_META: Record<State, {label: string; color: string}> = {
  compiled: {label: 'Compiled obligation', color: TEAL},
  info: {label: 'Informational only', color: SLATE_DIM},
  ambiguous: {label: 'Ambiguous — review', color: AMBIGUOUS},
};

export const B3_Ingest: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const docEnter = springUI(Math.max(0, frame - 10), fps);
  const scanY = interpolate(frame, [70, 320], [0, 360], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const classified = SEGMENTS.filter(
    (_, i) => frame > 90 + i * 26 + 20,
  ).length;
  const counter = Math.min(19, Math.round(interpolate(frame, [90, 360], [0, 19], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })));

  return (
    <AbsoluteFill>
      <SignalField />
      <SectionKicker index="01" step="Ingest" concept="Coverage Ledger" />
      <CameraRig
        scale={[[0, 1.0], [70, 1.0], [190, 1.07], [560, 1.07], [640, 1.11], [780, 1.11]]}
        origin="66% 54%"
        style={{alignItems: 'center', justifyContent: 'center', paddingTop: 24, display: 'flex'}}
      >
        <BrowserChrome
          url={`${ENTITY.url}/sources/cscrf`}
          typeUrl={{from: ENTITY.url, to: `${ENTITY.url}/sources/cscrf`}}
          widthPct={93}
          maxWidth={1720}
        >
          <div style={{display: 'flex', gap: 20, padding: 24, minHeight: 520}}>
            {/* Public SEBI source document (coded, no fake readable text) */}
            <div
              style={{
                width: 420,
                background: '#FBFBF8',
                borderRadius: 10,
                padding: 22,
                position: 'relative',
                overflow: 'hidden',
                opacity: docEnter,
                transform: `translateY(${(1 - docEnter) * 24}px)`,
                boxShadow: '0 12px 40px rgba(4,8,20,0.4)',
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
                <div style={{fontFamily: FONT_SORA, fontWeight: 700, fontSize: 15, color: INK}}>
                  {SOURCE.short} · {SOURCE.version}
                </div>
                <div
                  style={{
                    fontFamily: FONT_IBM_SANS,
                    fontSize: 10,
                    color: '#7A8AA8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    border: '1px solid #C9D2E3',
                    borderRadius: 4,
                    padding: '2px 6px',
                  }}
                >
                  {SOURCE.label}
                </div>
              </div>
              <div style={{fontFamily: FONT_IBM_SANS, fontSize: 11, color: '#8A97B0', marginTop: 4, marginBottom: 16}}>
                {SOURCE.title}
              </div>
              {/* clause blocks: § label + page-line bars */}
              {SEGMENTS.map((seg, i) => {
                const y = 92 + i * 40;
                const passed = scanY > (i + 0.5) * 40;
                const isAmber = seg.state === 'ambiguous';
                return (
                  <div key={seg.clause} style={{marginBottom: 12}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <span style={{fontFamily: FONT_IBM_SANS, fontSize: 10, fontWeight: 700, color: passed ? (isAmber ? AMBIGUOUS : TEAL) : '#AEB8CC'}}>
                        {seg.clause}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          background: passed
                            ? isAmber
                              ? `${AMBIGUOUS}55`
                              : `${TEAL}44`
                            : '#E4E8F0',
                        }}
                      />
                      <div style={{width: 40, height: 6, borderRadius: 3, background: passed ? '#D4DAE6' : '#E4E8F0'}} />
                    </div>
                  </div>
                );
              })}
              {/* scan line */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 78 + scanY,
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${TEAL}, transparent)`,
                  boxShadow: `0 0 14px ${TEAL}`,
                  opacity: frame > 70 && frame < 330 ? 0.9 : 0,
                }}
              />
            </div>

            {/* Coverage Ledger */}
            <div style={{flex: 1}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14}}>
                <div style={{fontFamily: FONT_SORA, fontSize: 19, color: WHITE, fontWeight: 600}}>
                  Regulatory Coverage Ledger
                </div>
                <div style={{display: 'flex', gap: 8}}>
                  <span style={{fontFamily: FONT_IBM_SANS, fontSize: 13, color: SLATE}}>
                    <span style={{color: WHITE, fontWeight: 700, fontVariantNumeric: 'tabular-nums'}}>{counter}</span> / 19 segments
                  </span>
                </div>
              </div>
              {SEGMENTS.map((seg, i) => {
                const enter = springSnappy(Math.max(0, frame - 90 - i * 26), fps);
                const meta = STATE_META[seg.state];
                return (
                  <div
                    key={seg.clause}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 16px',
                      marginBottom: 7,
                      background: NAVY_PANEL_2,
                      border: `1px solid ${seg.state === 'ambiguous' ? AMBIGUOUS : NAVY_LINE}`,
                      borderRadius: 8,
                      opacity: enter,
                      transform: `translateX(${(1 - enter) * 26}px)`,
                    }}
                  >
                    <span style={{fontFamily: FONT_IBM_SANS, fontSize: 12, fontWeight: 700, color: SLATE, width: 44}}>
                      {seg.clause}
                    </span>
                    <span style={{flex: 1, fontFamily: FONT_IBM_SANS, fontSize: 15, color: WHITE}}>
                      {seg.title}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontFamily: FONT_IBM_SANS,
                        fontSize: 12,
                        fontWeight: 600,
                        color: meta.color,
                      }}
                    >
                      <span style={{width: 7, height: 7, borderRadius: '50%', background: meta.color}} />
                      {meta.label}
                    </span>
                  </div>
                );
              })}
              <div
                style={{
                  marginTop: 12,
                  fontFamily: FONT_IBM_SANS,
                  fontSize: 13,
                  color: SLATE,
                  opacity: classified >= SEGMENTS.length ? 1 : 0,
                }}
              >
                <span style={{color: TEAL, fontWeight: 700}}>18 classified</span> ·{' '}
                <span style={{color: AMBIGUOUS, fontWeight: 700}}>1 ambiguous → review</span> · nothing silently skipped
              </div>
            </div>
          </div>
        </BrowserChrome>
      </CameraRig>
      <CaptionBar text={CAPTIONS.ingest} delay={30} />
    </AbsoluteFill>
  );
};
