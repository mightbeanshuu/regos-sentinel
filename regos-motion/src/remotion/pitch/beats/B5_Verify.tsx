import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {UICursor} from '../demo_bridge';
import {FONT_IBM_SANS, FONT_SORA} from '../../system/fonts';
import {springSnappy, springUI} from '../../system/springs';
import {AMBIGUOUS, CAPTIONS, EMERALD, INK, TEAL} from '../constants';
import {CaptionBar, OffWhiteField, SectionKicker} from '../shared';

const LIGHT_BORDER = '#DCE2EC';
const SUB = '#64748B';

// event timeline
const T_CLICK_FIELD = 130;
const T_PUSH = 136;
const T_CHOOSE = 600;
const T_APPROVE = 820;

const STAGES = ['Ingested', 'Extracted', 'Verified', 'Human edit', 'Approved'];

export const B5_Verify: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const chosen = frame >= T_CHOOSE;
  const approved = frame >= T_APPROVE;

  // camera push-in caused by the field click
  const pushIn = interpolate(frame, [T_PUSH, T_PUSH + 44, 900, 960], [1, 1.08, 1.08, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // cursor path (canvas-local coordinates)
  const cx = interpolate(
    frame,
    [40, T_CLICK_FIELD, 520, T_CHOOSE, 740, T_APPROVE],
    [1150, 860, 860, 700, 700, 1180],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const cy = interpolate(
    frame,
    [40, T_CLICK_FIELD, 520, T_CHOOSE, 740, T_APPROVE],
    [40, 210, 210, 360, 360, 500],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const clicking =
    (frame > T_CLICK_FIELD - 6 && frame < T_CLICK_FIELD + 8) ||
    (frame > T_CHOOSE - 6 && frame < T_CHOOSE + 8) ||
    (frame > T_APPROVE - 6 && frame < T_APPROVE + 8);

  // blocked banner micro-shake on impact
  const shake =
    frame > T_CLICK_FIELD && frame < T_CLICK_FIELD + 20 && !chosen
      ? Math.sin((frame - T_CLICK_FIELD) * 1.6) * 2
      : 0;

  const inspectorIn = springUI(Math.max(0, frame - T_CLICK_FIELD), fps);
  const sealDraw = interpolate(frame, [T_APPROVE + 4, T_APPROVE + 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const stageActive = approved ? 4 : chosen ? 3 : frame > T_CLICK_FIELD ? 2 : 1;

  return (
    <AbsoluteFill>
      <OffWhiteField />
      <SectionKicker index="03" step="Verify" concept="Inspector Mode" tone="dark" />

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingTop: 30}}>
        <div
          style={{
            position: 'relative',
            width: 1340,
            height: 560,
            transform: `scale(${pushIn})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Source document — competing spans */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 20,
              width: 560,
              height: 520,
              background: '#FFFFFF',
              border: `1px solid ${LIGHT_BORDER}`,
              borderRadius: 12,
              padding: 26,
              boxShadow: '0 18px 50px rgba(20,30,60,0.12)',
            }}
          >
            <div style={{fontFamily: FONT_IBM_SANS, fontSize: 12, color: SUB, marginBottom: 14}}>
              SEBI CSCRF (Aug 2024) · § 6.4 · Public SEBI source
            </div>
            <div style={{fontFamily: FONT_IBM_SANS, fontSize: 17, lineHeight: 1.85, color: INK}}>
              A Stock Broker shall report cyber incidents to SEBI{' '}
              <span
                style={{
                  background: chosen ? '#E9EEF6' : `${AMBIGUOUS}44`,
                  borderBottom: chosen ? 'none' : `2px solid ${AMBIGUOUS}`,
                  padding: '1px 3px',
                }}
              >
                within 6 hours of detection
              </span>{' '}
              and, for incidents identified during audit,{' '}
              <span
                style={{
                  background: chosen ? `${TEAL}33` : `${AMBIGUOUS}44`,
                  borderBottom: `2px solid ${chosen ? TEAL : AMBIGUOUS}`,
                  padding: '1px 3px',
                }}
              >
                within 60 days of the audit period
              </span>
              .
            </div>
            {frame > T_CLICK_FIELD && (
              <div
                style={{
                  marginTop: 24,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: '#FBF7EC',
                  border: `1px solid ${AMBIGUOUS}`,
                  fontFamily: FONT_IBM_SANS,
                  fontSize: 13,
                  color: '#8A6D1F',
                  opacity: inspectorIn,
                }}
              >
                Two competing deadlines detected in one clause — obligation is ambiguous.
              </div>
            )}
          </div>

          {/* Inspector panel */}
          <div
            style={{
              position: 'absolute',
              left: 640,
              top: 20,
              width: 700,
              height: 520,
              background: '#FFFFFF',
              border: `1px solid ${LIGHT_BORDER}`,
              borderRadius: 12,
              padding: 26,
              boxShadow: '0 18px 50px rgba(20,30,60,0.12)',
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontFamily: FONT_SORA, fontSize: 18, fontWeight: 600, color: INK}}>
                OB-0863 · Report cyber incidents
              </div>
              <div style={{fontFamily: FONT_IBM_SANS, fontSize: 11, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700}}>
                Inspector Mode
              </div>
            </div>

            {/* Deadline field (the clicked one) */}
            <div
              style={{
                marginTop: 18,
                padding: '12px 14px',
                borderRadius: 8,
                border: `2px solid ${chosen ? TEAL : frame > T_CLICK_FIELD ? AMBIGUOUS : LIGHT_BORDER}`,
                background: chosen ? `${TEAL}10` : frame > T_CLICK_FIELD ? '#FBF7EC' : '#F7F9FC',
                transform: `translateX(${shake}px)`,
              }}
            >
              <div style={{fontFamily: FONT_IBM_SANS, fontSize: 11, color: SUB, textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                Deadline
              </div>
              <div style={{fontFamily: FONT_IBM_SANS, fontSize: 17, color: INK, fontWeight: 600, marginTop: 2}}>
                {chosen ? 'Within 60 days of the audit period' : 'Ambiguous — needs review'}
              </div>
            </div>

            {/* Assurance strip */}
            <div style={{display: 'flex', gap: 10, marginTop: 16}}>
              {[
                {k: 'Model', v: 'sonnet-4.6'},
                {k: 'Schema', v: 'obligation.v1'},
                {
                  k: 'Confidence',
                  v: chosen ? '— human' : '0.52',
                  c: chosen ? TEAL : AMBIGUOUS,
                },
              ].map((f) => (
                <div key={f.k} style={{flex: 1, padding: '8px 10px', borderRadius: 8, background: '#F4F6FA', border: `1px solid ${LIGHT_BORDER}`}}>
                  <div style={{fontFamily: FONT_IBM_SANS, fontSize: 10, color: SUB, textTransform: 'uppercase', letterSpacing: '0.05em'}}>{f.k}</div>
                  <div style={{fontFamily: FONT_IBM_SANS, fontSize: 14, fontWeight: 700, color: (f as {c?: string}).c ?? INK, fontVariantNumeric: 'tabular-nums'}}>{f.v}</div>
                </div>
              ))}
            </div>

            {/* Competing-span chooser */}
            <div style={{marginTop: 16}}>
              <div style={{fontFamily: FONT_IBM_SANS, fontSize: 12, color: SUB, marginBottom: 8}}>
                Reviewer — select the supported interpretation
              </div>
              {[
                {id: 'A', txt: 'Within 6 hours of detection'},
                {id: 'B', txt: 'Within 60 days of the audit period'},
              ].map((opt) => {
                const isB = opt.id === 'B';
                const selected = chosen && isB;
                return (
                  <div
                    key={opt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 14px',
                      marginBottom: 8,
                      borderRadius: 8,
                      border: `1.5px solid ${selected ? TEAL : LIGHT_BORDER}`,
                      background: selected ? `${TEAL}10` : '#FFFFFF',
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: `2px solid ${selected ? TEAL : '#C3CBDA'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selected && <div style={{width: 8, height: 8, borderRadius: '50%', background: TEAL}} />}
                    </div>
                    <span style={{fontFamily: FONT_IBM_SANS, fontSize: 15, color: INK}}>{opt.txt}</span>
                  </div>
                );
              })}
            </div>

            {/* Publish state + approve */}
            <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 18}}>
              <div
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  fontFamily: FONT_IBM_SANS,
                  fontSize: 13,
                  fontWeight: 600,
                  transform: `translateX(${shake}px)`,
                  background: approved ? `${EMERALD}18` : chosen ? '#F4F6FA' : '#FBEAEA',
                  border: `1px solid ${approved ? EMERALD : chosen ? LIGHT_BORDER : '#E5A3A3'}`,
                  color: approved ? '#128A5B' : chosen ? SUB : '#B4453F',
                }}
              >
                {approved ? '✓ Human-approved · published' : chosen ? 'Ready to approve' : '⛔ Publish blocked — ambiguous'}
              </div>
              <button
                style={{
                  padding: '9px 22px',
                  borderRadius: 8,
                  border: 'none',
                  fontFamily: FONT_IBM_SANS,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  background: chosen && !approved ? TEAL : '#C3CBDA',
                  cursor: 'default',
                }}
              >
                Approve
              </button>
              {/* audit seal */}
              {approved && (
                <svg width={44} height={44} viewBox="0 0 44 44">
                  <circle cx={22} cy={22} r={18} fill="none" stroke={EMERALD} strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sealDraw} />
                  <path d="M14 22 L20 28 L31 16" fill="none" stroke={EMERALD} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, (sealDraw - 0.5) * 2)} />
                </svg>
              )}
            </div>

            {/* Inspector replay mini-timeline */}
            <div style={{display: 'flex', alignItems: 'center', gap: 0, marginTop: 22}}>
              {STAGES.map((s, i) => (
                <React.Fragment key={s}>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5}}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: i <= stageActive ? TEAL : '#D3DAE6',
                        boxShadow: i === stageActive ? `0 0 0 4px ${TEAL}22` : 'none',
                      }}
                    />
                    <span style={{fontFamily: FONT_IBM_SANS, fontSize: 10, color: i <= stageActive ? INK : SUB}}>{s}</span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div style={{flex: 1, height: 2, background: i < stageActive ? TEAL : '#D3DAE6', margin: '0 2px', marginBottom: 16}} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {frame > 30 && <UICursor x={cx} y={cy} clicking={clicking} />}
        </div>
      </AbsoluteFill>

      {frame < T_CHOOSE && <CaptionBar tone="dark" text="When the AI is unsure, it stops — nothing publishes without a human." delay={30} />}
      {frame >= T_CHOOSE - 6 && <CaptionBar tone="dark" text={CAPTIONS.verify} delay={T_CHOOSE} />}
    </AbsoluteFill>
  );
};
