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
import {ENTITY, METRIC_HUD} from './constants';
import {UICursor} from './UICursor';

const BEAT5 = {
  CTA: 'Generate Compliance Plan',
  POSTURE_START: 62,
  POSTURE_END: 71,
  EVIDENCE_FILE: 'VAPT_report.pdf',
  SYNTHETIC: 'SYNTHETIC',
  TIME_CHIP: `Time-to-plan ${METRIC_HUD.timeToPlan}`,
  LINKED_OBLIGATION: 'Conduct cyber audit after audit period',
} as const;

const KANBAN = [
  {
    owner: 'CISO',
    cards: [
      {title: 'Cyber audit scheduling', deadline: 'T+60d'},
      {title: 'Incident response drill', deadline: 'T+30d'},
    ],
  },
  {
    owner: 'Compliance',
    cards: [
      {title: 'Quarterly certificate filing', deadline: 'Q3'},
      {title: 'CSCRF control mapping', deadline: 'T+30d'},
    ],
  },
  {
    owner: 'Ops',
    cards: [{title: 'DR site failover test', deadline: 'T+45d'}],
  },
  {
    owner: 'Grievance',
    cards: [{title: 'Investor matrix update', deadline: 'Annual'}],
  },
];

export const Beat5_WorkflowEvidence: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const btnSpring = springUI(frame, fps);
  const kanbanStart = 180;
  const evidenceStart = 420;
  const postureStart = 600;
  const timeChipStart = 720;

  const posture = Math.round(
    interpolate(
      frame,
      [postureStart, postureStart + 90],
      [BEAT5.POSTURE_START, BEAT5.POSTURE_END],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
    ),
  );

  const dropProgress = interpolate(frame, [evidenceStart + 60, evidenceStart + 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const linkPulse = springSnappy(Math.max(0, frame - evidenceStart - 130), fps);
  const timeChip = springSnappy(Math.max(0, frame - timeChipStart), fps);

  const cursorX = interpolate(frame, [40, 70, 480, 520], [520, 520, 380, 380], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cursorY = interpolate(frame, [40, 70, 480, 520], [180, 180, 340, 340], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const clicking = (frame > 60 && frame < 90) || (frame > 500 && frame < 530);

  return (
    <AbsoluteFill>
      <RegOSBackground />
      <AbsoluteFill style={{paddingTop: 48, position: 'relative'}}>
        <BrowserChrome url={`${ENTITY.url}/plan`} slideUp={false}>
          <div style={{padding: 24, position: 'relative', minHeight: 520}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
              <div style={{fontFamily: FONT_SORA, fontSize: 20, color: COLOR_WHITE}}>
                Compliance plan
              </div>
              <button
                style={{
                  padding: '10px 20px',
                  background: frame > 60 ? COLOR_NAVY_700 : COLOR_TEAL_500,
                  color: COLOR_WHITE,
                  border: 'none',
                  borderRadius: 6,
                  fontFamily: FONT_IBM_SANS,
                  fontWeight: 600,
                  fontSize: 14,
                  opacity: btnSpring,
                }}
              >
                {BEAT5.CTA}
              </button>
            </div>

            <div style={{display: 'flex', gap: 12, marginBottom: 24}}>
              <div style={{position: 'relative', width: 72, height: 72}}>
                <svg width={72} height={72}>
                  <circle cx={36} cy={36} r={30} fill="none" stroke={COLOR_NAVY_700} strokeWidth={6} />
                  <circle
                    cx={36}
                    cy={36}
                    r={30}
                    fill="none"
                    stroke={COLOR_EMERALD_500}
                    strokeWidth={6}
                    strokeDasharray={`${posture * 1.88} 188`}
                    transform="rotate(-90 36 36)"
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
                    fontSize: 16,
                    color: COLOR_WHITE,
                  }}
                >
                  {posture}%
                </div>
              </div>
              <div style={{fontFamily: FONT_IBM_SANS, fontSize: 14, color: COLOR_SLATE_400, paddingTop: 8}}>
                Readiness posture
              </div>
            </div>

            <div style={{display: 'flex', gap: 12, marginBottom: 24}}>
              {KANBAN.map((col, ci) => {
                const colEnter = springSnappy(Math.max(0, frame - kanbanStart - ci * STAGGER * 2), fps);
                return (
                  <div
                    key={col.owner}
                    style={{
                      flex: 1,
                      background: COLOR_NAVY_800,
                      borderRadius: 8,
                      padding: 12,
                      opacity: colEnter,
                      transform: `translateY(${(1 - colEnter) * 24}px)`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONT_IBM_SANS,
                        fontSize: 12,
                        color: COLOR_TEAL_400,
                        fontWeight: 600,
                        marginBottom: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {col.owner}
                    </div>
                    {col.cards.map((card, i) => {
                      const cardEnter = springSnappy(
                        Math.max(0, frame - kanbanStart - ci * STAGGER * 2 - 20 - i * STAGGER * 3),
                        fps,
                      );
                      return (
                        <div
                          key={card.title}
                          style={{
                            background: COLOR_NAVY_900,
                            border: `1px solid ${COLOR_NAVY_700}`,
                            borderRadius: 6,
                            padding: '8px 10px',
                            marginBottom: 8,
                            fontFamily: FONT_IBM_SANS,
                            fontSize: 12,
                            color: COLOR_WHITE,
                            opacity: cardEnter,
                            transform: `translateX(${(1 - cardEnter) * 20}px)`,
                          }}
                        >
                          <div>{card.title}</div>
                          <div style={{color: COLOR_SLATE_400, fontSize: 11, marginTop: 4}}>
                            {card.deadline}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 24,
                opacity: interpolate(frame, [evidenceStart - 30, evidenceStart], [0, 1], {
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              <div
                style={{
                  flex: 1,
                  border: `2px dashed ${dropProgress > 0.5 ? COLOR_EMERALD_500 : COLOR_NAVY_700}`,
                  borderRadius: 8,
                  padding: 20,
                  minHeight: 100,
                  position: 'relative',
                }}
              >
                <div style={{fontFamily: FONT_IBM_SANS, fontSize: 13, color: COLOR_SLATE_400}}>
                  Evidence Locker
                </div>
                {dropProgress > 0 && (
                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      opacity: dropProgress,
                    }}
                  >
                    <div
                      style={{
                        padding: '8px 12px',
                        background: COLOR_NAVY_800,
                        borderRadius: 6,
                        fontFamily: FONT_IBM_SANS,
                        fontSize: 13,
                        color: COLOR_WHITE,
                      }}
                    >
                      {BEAT5.EVIDENCE_FILE}
                    </div>
                    <div
                      style={{
                        padding: '2px 8px',
                        background: COLOR_AMBER_400,
                        color: COLOR_NAVY_900,
                        borderRadius: 4,
                        fontFamily: FONT_IBM_SANS,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {BEAT5.SYNTHETIC}
                    </div>
                  </div>
                )}
              </div>
              <div style={{flex: 1}}>
                <div style={{fontFamily: FONT_IBM_SANS, fontSize: 13, color: COLOR_SLATE_400, marginBottom: 12}}>
                  Evidence graph
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: linkPulse > 0.3 ? `${COLOR_EMERALD_500}33` : COLOR_NAVY_800,
                      border: `2px solid ${linkPulse > 0.3 ? COLOR_EMERALD_500 : COLOR_NAVY_700}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: FONT_IBM_SANS,
                      fontSize: 10,
                      color: linkPulse > 0.3 ? COLOR_EMERALD_500 : COLOR_SLATE_400,
                      transform: `scale(${1 + linkPulse * 0.08})`,
                    }}
                  >
                    VAPT
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: linkPulse > 0.3 ? COLOR_EMERALD_500 : COLOR_NAVY_700,
                      opacity: linkPulse,
                    }}
                  />
                  <div
                    style={{
                      padding: '6px 10px',
                      background: COLOR_NAVY_800,
                      borderRadius: 6,
                      fontFamily: FONT_IBM_SANS,
                      fontSize: 11,
                      color: COLOR_WHITE,
                      maxWidth: 160,
                      border: linkPulse > 0.3 ? `1px solid ${COLOR_EMERALD_500}` : `1px solid ${COLOR_NAVY_700}`,
                    }}
                  >
                    {BEAT5.LINKED_OBLIGATION}
                  </div>
                </div>
              </div>
            </div>

            {timeChip > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 24,
                  right: 32,
                  padding: '10px 20px',
                  background: COLOR_NAVY_800,
                  border: `1px solid ${COLOR_EMERALD_500}`,
                  borderRadius: 8,
                  fontFamily: FONT_IBM_SANS,
                  fontSize: 15,
                  color: COLOR_EMERALD_500,
                  fontWeight: 600,
                  opacity: timeChip,
                  transform: `scale(${timeChip})`,
                }}
              >
                {BEAT5.TIME_CHIP}
              </div>
            )}
          </div>
        </BrowserChrome>
        {(frame > 30 && frame < 100) || (frame > 470 && frame < 540) ? (
          <UICursor x={cursorX} y={cursorY + 48} clicking={clicking} />
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
