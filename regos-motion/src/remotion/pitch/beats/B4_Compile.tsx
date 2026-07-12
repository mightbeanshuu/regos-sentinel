import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrowserChrome} from '../demo_bridge';
import {FONT_IBM_SANS, FONT_SORA} from '../../system/fonts';
import {springSnappy} from '../../system/springs';
import {
  CAPTIONS,
  ENTITY,
  EMERALD,
  NAVY_LINE,
  NAVY_PANEL_2,
  SLATE,
  TEAL,
  WHITE,
} from '../constants';
import {CaptionBar, CitationBeam, ScoreBadge, SectionKicker, SignalField} from '../shared';
import {CameraRig} from '../camera';

const OBLIGATIONS = [
  {actor: 'CISO', action: 'Conduct cyber audit after audit period', deadline: 'T+60d', cite: 'CSCRF §6.2', conf: '0.91', clauseY: 150},
  {actor: 'Compliance', action: 'File quarterly compliance certificate', deadline: 'Quarterly', cite: 'CSCRF §4.2', conf: '0.88', clauseY: 210},
  {actor: 'Ops', action: 'Maintain incident-response playbook', deadline: 'Ongoing', cite: 'CSCRF §6.4', conf: '0.86', clauseY: 270},
  {actor: 'Grievance', action: 'Publish investor grievance matrix', deadline: 'Annual', cite: 'CSCRF §3.1', conf: '0.84', clauseY: 330},
  {actor: 'CISO', action: 'Report cyber incidents within SLA', deadline: '6 hours', cite: 'CSCRF §6.4', conf: '0.89', clauseY: 390},
];

const CARD_X = 372;
const CARD_TOP = 96;
const CARD_H = 70;
const CARD_STEP = 82;
const SRC_ANCHOR_X = 300;

export const B4_Compile: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const count = Math.min(
    127,
    Math.round(interpolate(frame, [60, 360], [0, 127], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})),
  );
  const coverageIn = springSnappy(Math.max(0, frame - 420), fps);

  return (
    <AbsoluteFill>
      <SignalField />
      <SectionKicker index="02" step="Compile" concept="Clause-cited obligations" />
      <CameraRig
        scale={[[0, 1.0], [60, 1.0], [200, 1.06], [520, 1.06], [640, 1.12], [960, 1.12]]}
        origin="54% 48%"
        style={{alignItems: 'center', justifyContent: 'center', paddingTop: 24, display: 'flex'}}
      >
        <BrowserChrome url={`${ENTITY.url}/obligations`} widthPct={93} maxWidth={1720}>
          <div style={{position: 'relative', padding: 24, minHeight: 520}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14}}>
              <div style={{fontFamily: FONT_SORA, fontSize: 19, color: WHITE, fontWeight: 600}}>
                Obligation register — {ENTITY.short}
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                <div style={{fontFamily: FONT_IBM_SANS, fontSize: 14, color: TEAL, fontVariantNumeric: 'tabular-nums'}}>
                  {count} obligations compiled
                </div>
                {coverageIn > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 14px',
                      background: `${TEAL}14`,
                      border: `1px solid ${TEAL}`,
                      borderRadius: 999,
                      transform: `scale(${coverageIn})`,
                    }}
                  >
                    <span style={{width: 8, height: 8, borderRadius: '50%', background: TEAL}} />
                    <span style={{fontFamily: FONT_IBM_SANS, fontSize: 13, color: TEAL, fontWeight: 700}}>
                      Citation coverage 100%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={{position: 'relative', height: 460}}>
              {/* Source strip (left) */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 8,
                  width: 280,
                  background: '#FBFBF8',
                  borderRadius: 10,
                  padding: 16,
                  boxShadow: '0 12px 40px rgba(4,8,20,0.4)',
                }}
              >
                <div style={{fontFamily: FONT_SORA, fontWeight: 700, fontSize: 13, color: '#0B1220', marginBottom: 12}}>
                  SEBI CSCRF · source
                </div>
                {OBLIGATIONS.map((o, i) => {
                  const lit = frame > 60 + i * 40;
                  return (
                    <div key={i} style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14}}>
                      <span style={{fontFamily: FONT_IBM_SANS, fontSize: 10, fontWeight: 700, color: lit ? TEAL : '#AEB8CC', width: 46}}>
                        {o.cite.replace('CSCRF ', '')}
                      </span>
                      <div style={{flex: 1, height: 5, borderRadius: 3, background: lit ? `${TEAL}44` : '#E4E8F0'}} />
                      <span style={{width: 8, height: 8, borderRadius: '50%', background: lit ? TEAL : '#D4DAE6'}} />
                    </div>
                  );
                })}
              </div>

              {/* Citation beams overlay */}
              <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible'}}>
                {OBLIGATIONS.map((o, i) => (
                  <CitationBeam
                    key={i}
                    x1={SRC_ANCHOR_X}
                    y1={o.clauseY - 120}
                    x2={CARD_X}
                    y2={CARD_TOP + i * CARD_STEP + CARD_H / 2}
                    delay={64 + i * 40}
                  />
                ))}
              </svg>

              {/* Obligation cards cascade */}
              {OBLIGATIONS.map((o, i) => {
                const enter = springSnappy(Math.max(0, frame - 60 - i * 40), fps);
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: CARD_X,
                      top: CARD_TOP + i * CARD_STEP,
                      width: 820,
                      height: CARD_H,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '0 18px',
                      background: NAVY_PANEL_2,
                      border: `1px solid ${NAVY_LINE}`,
                      borderRadius: 10,
                      opacity: enter,
                      transform: `translateX(${(1 - enter) * 48}px) scale(${0.98 + enter * 0.02})`,
                      boxShadow: '0 10px 30px rgba(4,8,20,0.35)',
                    }}
                  >
                    <ScoreBadge value={o.conf} color={EMERALD} />
                    <div style={{width: 110}}>
                      <div style={{fontFamily: FONT_IBM_SANS, fontSize: 11, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Owner</div>
                      <div style={{fontFamily: FONT_IBM_SANS, fontSize: 16, color: TEAL, fontWeight: 600}}>{o.actor}</div>
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{fontFamily: FONT_IBM_SANS, fontSize: 11, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Obligation</div>
                      <div style={{fontFamily: FONT_IBM_SANS, fontSize: 16, color: WHITE, fontWeight: 500}}>{o.action}</div>
                    </div>
                    <div style={{width: 110}}>
                      <div style={{fontFamily: FONT_IBM_SANS, fontSize: 11, color: SLATE, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Deadline</div>
                      <div style={{fontFamily: FONT_IBM_SANS, fontSize: 15, color: WHITE}}>{o.deadline}</div>
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_IBM_SANS,
                        fontSize: 12,
                        fontWeight: 600,
                        color: TEAL,
                        border: `1px solid ${TEAL}66`,
                        background: `${TEAL}14`,
                        borderRadius: 6,
                        padding: '5px 10px',
                      }}
                    >
                      {o.cite}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </BrowserChrome>
      </CameraRig>
      <CaptionBar text={CAPTIONS.compile} delay={30} />
    </AbsoluteFill>
  );
};
