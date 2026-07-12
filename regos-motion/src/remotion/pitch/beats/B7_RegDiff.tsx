import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT_IBM_SANS, FONT_SORA} from '../../system/fonts';
import {springSnappy, springUI} from '../../system/springs';
import {
  AMBIGUOUS,
  CAPTIONS,
  EMERALD,
  INK,
  NAVY_LINE,
  NAVY_PANEL_2,
  ROYAL,
  SLATE,
  TEAL,
  WHITE,
} from '../constants';
import {CaptionBar, SectionKicker, SignalField} from '../shared';

const LIGHT_BORDER = '#DCE2EC';
const SUB = '#64748B';

export const B7_RegDiff: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const toastIn = springUI(Math.max(0, frame - 6), fps);
  const toastImpact = interpolate(frame, [6, 14, 22], [0, -3, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const split = springUI(Math.max(0, frame - 70), fps);
  const changeHi = interpolate(frame, [170, 210], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // dependency line draw + impact chips
  const lineDraw = (delay: number) =>
    interpolate(frame - delay, [0, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const connectorRefresh = interpolate(frame, [300, 360], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stale = frame > 380;
  const testReview = frame > 440;

  return (
    <AbsoluteFill>
      <SignalField intensity={1.2} />
      <SectionKicker index="05" step="Diff" concept="Reg-Diff + Evidence" />

      {/* Amendment toast */}
      <div
        style={{
          position: 'absolute',
          top: 92,
          left: '50%',
          transform: `translateX(-50%) translateY(${(1 - toastIn) * -30 + toastImpact}px)`,
          opacity: toastIn,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px',
          background: NAVY_PANEL_2,
          border: `1px solid ${AMBIGUOUS}`,
          borderRadius: 10,
          zIndex: 20,
        }}
      >
        <span style={{width: 9, height: 9, borderRadius: '50%', background: AMBIGUOUS}} />
        <span style={{fontFamily: FONT_IBM_SANS, fontSize: 15, color: WHITE, fontWeight: 600}}>
          Amendment received — CSCRF Incident-Reporting SLA
        </span>
        <span style={{fontFamily: FONT_IBM_SANS, fontSize: 11, color: AMBIGUOUS, textTransform: 'uppercase', letterSpacing: '0.06em', border: `1px solid ${AMBIGUOUS}66`, borderRadius: 5, padding: '2px 7px'}}>
          Simulated amendment
        </span>
      </div>

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingTop: 70}}>
        <div style={{position: 'relative', width: 1300, height: 500}}>
          {/* Reg-Diff split panels */}
          <div style={{display: 'flex', gap: 0, alignItems: 'stretch', height: 250, opacity: split, transform: `scale(${0.97 + split * 0.03})`}}>
            {/* Old version */}
            <div style={{flex: 1, background: '#FFFFFF', borderRadius: '12px 0 0 12px', border: `1px solid ${LIGHT_BORDER}`, borderRight: 'none', padding: 22, transform: `translateX(${(1 - split) * 30}px)`}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{fontFamily: FONT_IBM_SANS, fontSize: 12, color: SUB, fontWeight: 600}}>CSCRF · Aug 2024 (current)</span>
                <span style={{fontFamily: FONT_IBM_SANS, fontSize: 11, color: SUB}}>v1 · superseded</span>
              </div>
              <div style={{fontFamily: FONT_IBM_SANS, fontSize: 16, color: INK, lineHeight: 1.7, marginTop: 18}}>
                Report cyber incidents to SEBI{' '}
                <span style={{textDecoration: changeHi > 0.5 ? 'line-through' : 'none', color: changeHi > 0.5 ? '#B4453F' : INK, background: `${AMBIGUOUS}22`, padding: '1px 4px'}}>
                  within 6 hours
                </span>{' '}
                of detection.
              </div>
            </div>
            {/* Divider */}
            <div style={{width: 2, background: `linear-gradient(${TEAL}, ${ROYAL})`, position: 'relative'}}>
              <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 30, height: 30, borderRadius: '50%', background: NAVY_PANEL_2, border: `1.5px solid ${TEAL}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEAL, fontSize: 15, fontWeight: 700}}>
                Δ
              </div>
            </div>
            {/* Amended version */}
            <div style={{flex: 1, background: '#F4F8FF', borderRadius: '0 12px 12px 0', border: `1px solid ${ROYAL}55`, borderLeft: 'none', padding: 22, transform: `translateX(${(1 - split) * -30}px)`}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{fontFamily: FONT_IBM_SANS, fontSize: 12, color: ROYAL, fontWeight: 700}}>CSCRF · Amendment (new)</span>
                <span style={{fontFamily: FONT_IBM_SANS, fontSize: 11, color: TEAL, fontWeight: 600}}>v2 · active</span>
              </div>
              <div style={{fontFamily: FONT_IBM_SANS, fontSize: 16, color: INK, lineHeight: 1.7, marginTop: 18}}>
                Report cyber incidents to SEBI{' '}
                <span style={{background: `${TEAL}33`, borderBottom: `2px solid ${TEAL}`, padding: '1px 4px', fontWeight: 700, opacity: changeHi}}>
                  within 4 hours
                </span>{' '}
                of detection.
                <div style={{marginTop: 10, fontSize: 13, color: TEAL, opacity: interpolate(frame, [230, 270], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
                  + Added: quarterly incident-drill attestation
                </div>
              </div>
            </div>
          </div>

          {/* Dependency connectors from divider down to impact chips */}
          <svg style={{position: 'absolute', left: 0, top: 250, width: '100%', height: 120, pointerEvents: 'none', overflow: 'visible'}}>
            {[290, 650, 1010].map((x, i) => {
              const p = lineDraw(260 + i * 30);
              const d = `M 650 0 C 650 60, ${x} 40, ${x} 110`;
              return (
                <path key={i} d={d} fill="none" stroke={TEAL} strokeWidth={2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} opacity={0.8} />
              );
            })}
          </svg>

          {/* Impact chips */}
          <div style={{position: 'absolute', top: 370, left: 0, width: '100%', display: 'flex', justifyContent: 'space-between', gap: 20}}>
            {/* Obligation deadline */}
            <ImpactCard delay={286} frame={frame} fps={fps} title="Obligation OB-0863" accent={TEAL}>
              <span style={{color: SLATE, textDecoration: 'line-through'}}>6h</span>
              <span style={{color: WHITE, margin: '0 8px'}}>→</span>
              <span style={{color: TEAL, fontWeight: 700}}>4h SLA</span>
            </ImpactCard>

            {/* Evidence connector → stale */}
            <ImpactCard delay={316} frame={frame} fps={fps} title="Evidence Connector · read-only" accent={stale ? AMBIGUOUS : SLATE} badge="Simulated">
              {connectorRefresh < 1 && !stale ? (
                <span style={{color: SLATE}}>refreshing metadata…</span>
              ) : (
                <span style={{color: AMBIGUOUS, fontWeight: 700}}>VAPT cert → STALE</span>
              )}
            </ImpactCard>

            {/* Obligation test */}
            <ImpactCard delay={346} frame={frame} fps={fps} title="Obligation test" accent={testReview ? AMBIGUOUS : EMERALD}>
              {testReview ? (
                <>
                  <span style={{color: SLATE, textDecoration: 'line-through'}}>PASS</span>
                  <span style={{color: WHITE, margin: '0 8px'}}>→</span>
                  <span style={{color: AMBIGUOUS, fontWeight: 700}}>REVIEW</span>
                </>
              ) : (
                <span style={{color: EMERALD, fontWeight: 700}}>PASS</span>
              )}
            </ImpactCard>
          </div>
        </div>
      </AbsoluteFill>
      <CaptionBar text={CAPTIONS.regdiff} delay={30} />
    </AbsoluteFill>
  );
};

const ImpactCard: React.FC<{
  delay: number;
  frame: number;
  fps: number;
  title: string;
  accent: string;
  badge?: string;
  children: React.ReactNode;
}> = ({delay, frame, fps, title, accent, badge, children}) => {
  const enter = springSnappy(Math.max(0, frame - delay), fps);
  return (
    <div
      style={{
        flex: 1,
        background: NAVY_PANEL_2,
        border: `1px solid ${accent}66`,
        borderRadius: 10,
        padding: '14px 18px',
        opacity: enter,
        transform: `translateY(${(1 - enter) * 20}px)`,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
        <span style={{fontFamily: FONT_IBM_SANS, fontSize: 12, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.04em'}}>{title}</span>
        {badge && <span style={{fontFamily: FONT_IBM_SANS, fontSize: 9, color: AMBIGUOUS, border: `1px solid ${AMBIGUOUS}66`, borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{badge}</span>}
      </div>
      <div style={{fontFamily: FONT_SORA, fontSize: 20}}>{children}</div>
    </div>
  );
};
