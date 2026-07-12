import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {RegOSBackground} from '../system/Background';
import {
  COLOR_AMBER_400,
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
import {springSnappy, springUI} from '../system/springs';
import {BrowserChrome} from './BrowserChrome';
import {ENTITY} from './constants';
import {UICursor} from './UICursor';

const BEAT4 = {
  TOAST: '2 documents ingested.',
  INTERPRETER: 'Interpreter',
  OBLIGATION_COUNT: 127,
  SELECTED_ROW: 'Conduct cyber audit after audit period',
  ACTOR: 'CISO',
  DEADLINE: 'Within 60 days of audit period end',
  EVIDENCE: 'VAPT report + audit certificate',
  CONFIDENCE: 0.91,
  CSCRF_CLAUSE:
    'The Stock Broker shall conduct a cyber audit after completion of the audit period and submit the report to SEBI within the prescribed timeline.',
  CITATION: 'CSCRF § 6.2.4 — Cyber audit obligation',
  STATUS_PENDING: 'Pending review',
  STATUS_APPROVED: 'Human-approved',
  AUDIT_LOG: '2025-07-10 · Officer Priya M. · Approved obligation OB-0847',
  CITATION_CHIP: 'Citation coverage 100%',
} as const;

const OBLIGATION_ROWS = [
  {actor: 'CISO', action: 'Conduct cyber audit after audit period', deadline: 'T+60d', conf: 0.91},
  {actor: 'Compliance', action: 'File quarterly compliance certificate', deadline: 'Quarterly', conf: 0.88},
  {actor: 'Ops', action: 'Maintain incident response playbook', deadline: 'Ongoing', conf: 0.86},
  {actor: 'Grievance', action: 'Publish investor grievance matrix', deadline: 'Annual', conf: 0.84},
  {actor: 'CISO', action: 'Report cyber incidents within SLA', deadline: '4 hours', conf: 0.89},
  {actor: 'Compliance', action: 'Map controls to CSCRF framework', deadline: 'T+30d', conf: 0.87},
];

export const Beat4_SourceCitation: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const toastEnter = springUI(Math.max(0, frame - 0), fps);
  const barFill = interpolate(frame, [30, 120], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const obligationCount = Math.min(
    BEAT4.OBLIGATION_COUNT,
    Math.floor(
      interpolate(frame, [120, 300], [0, BEAT4.OBLIGATION_COUNT], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    ),
  );
  const splitOpen = springUI(Math.max(0, frame - 300), fps);
  const highlightDraw = interpolate(frame, [360, 420], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const approved = frame > 600;
  const approveSpring = springSnappy(Math.max(0, frame - 620), fps);
  const citationChip = springSnappy(Math.max(0, frame - 780), fps);

  const cursorX = interpolate(frame, [280, 310, 580, 610], [680, 420, 920, 920], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cursorY = interpolate(frame, [280, 310, 580, 610], [280, 320, 420, 420], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const clicking = (frame > 300 && frame < 330) || (frame > 600 && frame < 630);

  const showSplit = frame >= 300;

  return (
    <AbsoluteFill>
      <RegOSBackground />
      <AbsoluteFill style={{paddingTop: 48, position: 'relative'}}>
        <BrowserChrome url={`${ENTITY.url}/obligations`} slideUp={false}>
          <div style={{padding: 24, position: 'relative', minHeight: 520}}>
            {frame < 300 && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 24,
                    background: COLOR_NAVY_800,
                    border: `1px solid ${COLOR_TEAL_500}`,
                    borderRadius: 8,
                    padding: '10px 16px',
                    fontFamily: FONT_IBM_SANS,
                    fontSize: 14,
                    color: COLOR_WHITE,
                    opacity: toastEnter,
                    transform: `translateX(${(1 - toastEnter) * 40}px)`,
                    zIndex: 10,
                  }}
                >
                  <span style={{color: COLOR_TEAL_400, fontWeight: 600}}>Watcher · </span>
                  {BEAT4.TOAST}
                </div>
                <div style={{marginBottom: 20}}>
                  <div
                    style={{
                      fontFamily: FONT_IBM_SANS,
                      fontSize: 13,
                      color: COLOR_SLATE_400,
                      marginBottom: 8,
                    }}
                  >
                    {BEAT4.INTERPRETER} — compiling register
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: COLOR_NAVY_800,
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${barFill}%`,
                        background: COLOR_TEAL_500,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div style={{fontFamily: FONT_SORA, fontSize: 18, color: COLOR_WHITE}}>
                    Obligation register
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_IBM_SANS,
                      fontSize: 14,
                      color: COLOR_TEAL_400,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {obligationCount} obligations
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 80px 80px 70px',
                    gap: 8,
                    padding: '8px 12px',
                    background: COLOR_NAVY_800,
                    borderRadius: 6,
                    fontFamily: FONT_IBM_SANS,
                    fontSize: 11,
                    color: COLOR_SLATE_400,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span>Actor</span>
                  <span>Action</span>
                  <span>Deadline</span>
                  <span>Evidence</span>
                  <span>Conf.</span>
                </div>
                {OBLIGATION_ROWS.map((row, i) => {
                  const enter = springSnappy(Math.max(0, frame - 150 - i * STAGGER * 3), fps);
                  const isSelected = i === 0 && frame > 280;
                  return (
                    <div
                      key={row.action}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '100px 1fr 80px 80px 70px',
                        gap: 8,
                        padding: '10px 12px',
                        marginTop: 4,
                        background: isSelected ? `${COLOR_TEAL_500}22` : COLOR_NAVY_900,
                        border: `1px solid ${isSelected ? COLOR_TEAL_500 : COLOR_NAVY_700}`,
                        borderRadius: 6,
                        fontFamily: FONT_IBM_SANS,
                        fontSize: 13,
                        color: COLOR_WHITE,
                        opacity: enter,
                        transform: `translateX(${(1 - enter) * -16}px)`,
                      }}
                    >
                      <span style={{color: COLOR_TEAL_400}}>{row.actor}</span>
                      <span>{row.action}</span>
                      <span style={{color: COLOR_SLATE_400}}>{row.deadline}</span>
                      <span style={{color: COLOR_SLATE_400}}>Required</span>
                      <span style={{color: COLOR_EMERALD_500}}>{row.conf.toFixed(2)}</span>
                    </div>
                  );
                })}
              </>
            )}

            {showSplit && (
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  opacity: splitOpen,
                  transform: `translateY(${(1 - splitOpen) * 20}px)`,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    background: COLOR_WHITE,
                    borderRadius: 8,
                    padding: 20,
                    color: '#1E293B',
                    fontFamily: FONT_IBM_SANS,
                    fontSize: 13,
                    lineHeight: 1.7,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: COLOR_SLATE_400,
                      marginBottom: 12,
                      fontFamily: FONT_IBM_SANS,
                    }}
                  >
                    CSCRF (Aug 2024) · Page 42
                  </div>
                  <p style={{margin: 0}}>
                    All Stock Brokers shall implement cybersecurity controls as prescribed.{' '}
                    <span
                      style={{
                        background: `rgba(251, 191, 36, ${highlightDraw * 0.45})`,
                        boxDecorationBreak: 'clone',
                        padding: '2px 0',
                      }}
                    >
                      {BEAT4.CSCRF_CLAUSE}
                    </span>{' '}
                    Non-compliance shall attract penalties as per SEBI regulations.
                  </p>
                </div>
                <div
                  style={{
                    flex: 1,
                    background: COLOR_NAVY_800,
                    border: `1px solid ${COLOR_NAVY_700}`,
                    borderRadius: 8,
                    padding: 20,
                  }}
                >
                  <div style={{fontFamily: FONT_IBM_SANS, fontSize: 12, color: COLOR_TEAL_400}}>
                    Obligation card · OB-0847
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_SORA,
                      fontSize: 18,
                      color: COLOR_WHITE,
                      marginTop: 8,
                      marginBottom: 16,
                    }}
                  >
                    {BEAT4.SELECTED_ROW}
                  </div>
                  {[
                    {label: 'Actor', value: BEAT4.ACTOR},
                    {label: 'Deadline', value: BEAT4.DEADLINE},
                    {label: 'Evidence', value: BEAT4.EVIDENCE},
                    {label: 'Citation', value: BEAT4.CITATION},
                  ].map((field) => (
                    <div key={field.label} style={{marginBottom: 10}}>
                      <div style={{fontFamily: FONT_IBM_SANS, fontSize: 11, color: COLOR_SLATE_400}}>
                        {field.label}
                      </div>
                      <div style={{fontFamily: FONT_IBM_SANS, fontSize: 14, color: COLOR_WHITE}}>
                        {field.value}
                      </div>
                    </div>
                  ))}
                  <div style={{display: 'flex', gap: 12, alignItems: 'center', marginTop: 16}}>
                    <div
                      style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        background: `${COLOR_EMERALD_500}22`,
                        border: `1px solid ${COLOR_EMERALD_500}`,
                        fontFamily: FONT_IBM_SANS,
                        fontSize: 13,
                        color: COLOR_EMERALD_500,
                      }}
                    >
                      Confidence {BEAT4.CONFIDENCE}
                    </div>
                    <div
                      style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        background: approved ? `${COLOR_EMERALD_500}22` : `${COLOR_AMBER_400}22`,
                        border: `1px solid ${approved ? COLOR_EMERALD_500 : COLOR_AMBER_400}`,
                        fontFamily: FONT_IBM_SANS,
                        fontSize: 13,
                        color: approved ? COLOR_EMERALD_500 : COLOR_AMBER_400,
                      }}
                    >
                      {approved ? BEAT4.STATUS_APPROVED : BEAT4.STATUS_PENDING}
                    </div>
                  </div>
                  <button
                    style={{
                      marginTop: 20,
                      padding: '10px 20px',
                      background: approved ? COLOR_NAVY_700 : COLOR_TEAL_500,
                      color: COLOR_WHITE,
                      border: 'none',
                      borderRadius: 6,
                      fontFamily: FONT_IBM_SANS,
                      fontWeight: 600,
                      fontSize: 14,
                      opacity: approved ? 0.6 : 1,
                      transform: approved ? `scale(${approveSpring})` : undefined,
                    }}
                  >
                    {approved ? '✓ Approved' : 'Approve'}
                  </button>
                  {approved && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: '8px 12px',
                        background: COLOR_NAVY_900,
                        borderRadius: 6,
                        fontFamily: FONT_IBM_SANS,
                        fontSize: 12,
                        color: COLOR_SLATE_400,
                        opacity: approveSpring,
                      }}
                    >
                      Audit log: {BEAT4.AUDIT_LOG}
                    </div>
                  )}
                </div>
              </div>
            )}

            {citationChip > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 24,
                  left: '50%',
                  transform: `translateX(-50%) scale(${citationChip})`,
                  padding: '10px 24px',
                  background: COLOR_NAVY_800,
                  border: `1px solid ${COLOR_EMERALD_500}`,
                  borderRadius: 8,
                  fontFamily: FONT_IBM_SANS,
                  fontSize: 16,
                  color: COLOR_EMERALD_500,
                  fontWeight: 600,
                }}
              >
                {BEAT4.CITATION_CHIP}
              </div>
            )}
          </div>
        </BrowserChrome>
        {(frame > 270 && frame < 340) || (frame > 570 && frame < 640) ? (
          <UICursor x={cursorX} y={cursorY + 48} clicking={clicking} />
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
