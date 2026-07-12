import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT_IBM_SANS, FONT_SORA} from '../../system/fonts';
import {springSnappy, springUI} from '../../system/springs';
import {
  CAPTIONS,
  EMERALD,
  ENTITY,
  NAVY_LINE,
  NAVY_PANEL,
  NAVY_PANEL_2,
  SLATE,
  TEAL,
  WHITE,
} from '../constants';
import {CaptionBar, SectionKicker, SignalField} from '../shared';

const EVENTS = [
  'Source ingested · CSCRF Aug 2024',
  'Obligations compiled · cited',
  'OB-0863 human-approved · Priya M.',
  'Applicability sealed · Small-RE',
  'Reg-Diff v1→v2 applied',
  'Evidence re-evaluated · 1 stale',
];

const MANIFEST = [
  {k: 'Source hash', v: 'sha256:9f3c…a71b'},
  {k: 'Obligation versions', v: '127 · obligation.v1'},
  {k: 'Model / schema', v: 'sonnet-4.6 · prompt.v4'},
  {k: 'Reviewer approvals', v: '3 signed'},
  {k: 'Open exceptions', v: '1 (evidence stale)'},
  {k: 'Benchmark', v: 'P 0.85 / R 0.80 (Target)'},
];

const GATES = ['Coverage', 'Citations', 'Applicability', 'Reg-Diff', 'Sandbox pack'];

export const B8_Prove: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const manifestIn = springUI(Math.max(0, frame - 210), fps);

  return (
    <AbsoluteFill>
      <SignalField />
      <SectionKicker index="06" step="Prove" concept="Compliance Build Manifest" />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingTop: 44}}>
        <div style={{display: 'flex', gap: 28, width: 1320, alignItems: 'flex-start'}}>
          {/* Audit event stream */}
          <div style={{width: 440}}>
            <div style={{fontFamily: FONT_IBM_SANS, fontSize: 12, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12}}>
              Audit events
            </div>
            {EVENTS.map((e, i) => {
              const enter = springSnappy(Math.max(0, frame - 10 - i * 26), fps);
              // gentle compress toward the manifest after they've stacked
              const compress = interpolate(frame, [200, 260], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <div
                  key={e}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 15px',
                    marginBottom: 8 - compress * 4,
                    background: NAVY_PANEL_2,
                    border: `1px solid ${NAVY_LINE}`,
                    borderRadius: 8,
                    opacity: enter * (1 - compress * 0.55),
                    transform: `translateX(${(1 - enter) * -24 + compress * 40}px) scale(${1 - compress * 0.06})`,
                  }}
                >
                  <span style={{color: TEAL, fontSize: 14}}>✓</span>
                  <span style={{flex: 1, fontFamily: FONT_IBM_SANS, fontSize: 14, color: WHITE}}>{e}</span>
                  <span style={{fontFamily: FONT_IBM_SANS, fontSize: 11, color: SLATE, fontVariantNumeric: 'tabular-nums'}}>
                    {`10:${(10 + i).toString().padStart(2, '0')}`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Build Manifest */}
          <div
            style={{
              flex: 1,
              background: NAVY_PANEL,
              border: `1px solid ${TEAL}55`,
              borderRadius: 16,
              padding: 26,
              opacity: manifestIn,
              transform: `translateY(${(1 - manifestIn) * 26}px) scale(${0.97 + manifestIn * 0.03})`,
              boxShadow: `0 24px 70px rgba(4,8,20,0.55)`,
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
              <div style={{fontFamily: FONT_SORA, fontSize: 20, color: WHITE, fontWeight: 700}}>
                Compliance Build Manifest
              </div>
              <div style={{fontFamily: FONT_IBM_SANS, fontSize: 11, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700}}>
                signed · reproducible
              </div>
            </div>
            <div style={{fontFamily: FONT_IBM_SANS, fontSize: 13, color: SLATE, marginBottom: 18}}>
              Release RB-2026-07 · {ENTITY.short}
            </div>

            {MANIFEST.map((m, i) => {
              const at = 260 + i * 34;
              const verified = frame > at;
              const rowIn = springSnappy(Math.max(0, frame - (240 + i * 20)), fps);
              return (
                <div
                  key={m.k}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 0',
                    borderTop: `1px solid ${NAVY_LINE}`,
                    opacity: rowIn,
                  }}
                >
                  <span style={{fontFamily: FONT_IBM_SANS, fontSize: 14, color: SLATE}}>{m.k}</span>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                    <span style={{fontFamily: FONT_IBM_SANS, fontSize: 14, color: WHITE, fontVariantNumeric: 'tabular-nums'}}>{m.v}</span>
                    <span style={{width: 20, textAlign: 'center', color: verified ? TEAL : SLATE, fontSize: 15, opacity: verified ? 1 : 0.3}}>
                      {verified ? '✓' : '·'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Gates */}
            <div style={{display: 'flex', gap: 8, marginTop: 20}}>
              {GATES.map((g, i) => {
                const at = 500 + i * 24;
                const passed = frame > at;
                return (
                  <div
                    key={g}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '9px 4px',
                      borderRadius: 8,
                      background: passed ? `${EMERALD}18` : NAVY_PANEL_2,
                      border: `1px solid ${passed ? EMERALD : NAVY_LINE}`,
                      fontFamily: FONT_IBM_SANS,
                      fontSize: 12,
                      fontWeight: 600,
                      color: passed ? EMERALD : SLATE,
                    }}
                  >
                    {passed ? '✓ ' : ''}
                    {g}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <CaptionBar text={CAPTIONS.prove} delay={30} />
    </AbsoluteFill>
  );
};
