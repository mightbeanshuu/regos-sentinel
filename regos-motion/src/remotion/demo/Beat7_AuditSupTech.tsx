import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
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
import {springSnappy, springUI} from '../system/springs';
import {BrowserChrome} from './BrowserChrome';
import {ENTITY} from './constants';
import {UICursor} from './UICursor';

const BEAT7 = {
  EXPORT_CTA: 'Export Audit Pack',
  PAGES: [
    'Entity profile',
    'Obligations register',
    'Source citations',
    'Evidence index',
    'Approvals',
    'Gap analysis',
    'Disclaimer',
  ],
  PAGE_DETAIL: {
    obligation: 'Conduct cyber audit after audit period',
    citation: 'CSCRF § 6.2.4',
    approval: 'Human-approved · Priya M. · 2025-07-10',
  },
  SUPTECH_TITLE: 'SupTech / SEBI–MII view',
  CAPTION: 'Anonymized · No PII · Supervision signal.',
} as const;

const BROKERS = ['Broker A', 'Broker B', 'Broker C', 'Broker D', 'Broker E'];
const GAPS = ['Cyber audit', 'Incident SLA', 'DR testing', 'Grievance matrix', 'Control mapping'];

export const Beat7_AuditSupTech: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const exportClick = frame > 60;
  const stackStart = 90;
  const zoomStart = 180;
  const suptechStart = 360;
  const captionStart = 690;

  const stackSpring = (i: number) => springSnappy(Math.max(0, frame - stackStart - i * STAGGER), fps);
  const zoomScale = interpolate(frame, [zoomStart, zoomStart + 60], [1, 1.15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const suptechFade = interpolate(frame, [suptechStart, suptechStart + 30], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const captionSpring = springUI(Math.max(0, frame - captionStart), fps);

  const showSuptech = frame >= suptechStart;
  const cursorX = interpolate(frame, [30, 60], [720, 720], {extrapolateRight: 'clamp'});
  const cursorY = 140;
  const clicking = frame > 55 && frame < 85;

  return (
    <AbsoluteFill>
      <RegOSBackground />
      <AbsoluteFill style={{paddingTop: 48, position: 'relative'}}>
        {!showSuptech ? (
          <BrowserChrome url={`${ENTITY.url}/audit-export`} slideUp={false}>
            <div style={{padding: 24, position: 'relative', minHeight: 520}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
                <div style={{fontFamily: FONT_SORA, fontSize: 20, color: COLOR_WHITE}}>
                  Audit pack exporter
                </div>
                <button
                  style={{
                    padding: '10px 20px',
                    background: exportClick ? COLOR_NAVY_700 : COLOR_TEAL_500,
                    color: COLOR_WHITE,
                    border: 'none',
                    borderRadius: 6,
                    fontFamily: FONT_IBM_SANS,
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {BEAT7.EXPORT_CTA}
                </button>
              </div>

              <div style={{display: 'flex', gap: 32, alignItems: 'flex-start'}}>
                <div style={{position: 'relative', width: 200, height: 280}}>
                  {BEAT7.PAGES.map((page, i) => {
                    const s = stackSpring(i);
                    return (
                      <div
                        key={page}
                        style={{
                          position: 'absolute',
                          left: i * 4,
                          top: i * 6,
                          width: 180,
                          height: 240,
                          background: COLOR_WHITE,
                          borderRadius: 4,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                          opacity: s,
                          transform: `translateY(${(1 - s) * 30}px) rotate(${-2 + i}deg)`,
                          padding: 12,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: FONT_IBM_SANS,
                            fontSize: 10,
                            color: COLOR_SLATE_400,
                            borderBottom: '1px solid #E2E8F0',
                            paddingBottom: 6,
                            marginBottom: 8,
                          }}
                        >
                          {page}
                        </div>
                        <div
                          style={{
                            height: 4,
                            background: '#E2E8F0',
                            borderRadius: 2,
                            marginBottom: 6,
                            width: '80%',
                          }}
                        />
                        <div
                          style={{
                            height: 4,
                            background: '#E2E8F0',
                            borderRadius: 2,
                            marginBottom: 6,
                            width: '60%',
                          }}
                        />
                        <div
                          style={{
                            height: 4,
                            background: '#E2E8F0',
                            borderRadius: 2,
                            width: '70%',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    flex: 1,
                    transform: `scale(${frame >= zoomStart ? zoomScale : 1})`,
                    transformOrigin: 'top left',
                    background: COLOR_WHITE,
                    borderRadius: 8,
                    padding: 24,
                    opacity: frame >= zoomStart ? 1 : 0.3,
                  }}
                >
                  <div style={{fontFamily: FONT_IBM_SANS, fontSize: 11, color: COLOR_SLATE_400}}>
                    Obligations · Source citations
                  </div>
                  <table style={{width: '100%', marginTop: 12, borderCollapse: 'collapse', fontFamily: FONT_IBM_SANS, fontSize: 12, color: '#1E293B'}}>
                    <thead>
                      <tr style={{borderBottom: '2px solid #E2E8F0', textAlign: 'left'}}>
                        <th style={{padding: '8px 4px'}}>Obligation</th>
                        <th style={{padding: '8px 4px'}}>Citation</th>
                        <th style={{padding: '8px 4px'}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{background: 'rgba(251,191,36,0.15)'}}>
                        <td style={{padding: '10px 4px'}}>{BEAT7.PAGE_DETAIL.obligation}</td>
                        <td style={{padding: '10px 4px', color: COLOR_TEAL_500}}>{BEAT7.PAGE_DETAIL.citation}</td>
                        <td style={{padding: '10px 4px'}}>
                          <span
                            style={{
                              padding: '2px 8px',
                              background: `${COLOR_EMERALD_500}22`,
                              color: COLOR_EMERALD_500,
                              borderRadius: 4,
                              fontSize: 11,
                            }}
                          >
                            ✓ Approved
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div
                    style={{
                      marginTop: 16,
                      padding: '8px 12px',
                      border: `1px solid ${COLOR_EMERALD_500}`,
                      borderRadius: 4,
                      fontFamily: FONT_IBM_SANS,
                      fontSize: 11,
                      color: COLOR_EMERALD_500,
                    }}
                  >
                    {BEAT7.PAGE_DETAIL.approval}
                  </div>
                  <div style={{marginTop: 20, fontFamily: FONT_IBM_SANS, fontSize: 9, color: COLOR_SLATE_400}}>
                    Decision support · Not legal advice · Human approval required
                  </div>
                </div>
              </div>
            </div>
          </BrowserChrome>
        ) : (
          <BrowserChrome url="suptech.regos.sentinel/aggregate" slideUp={false}>
            <div style={{padding: 24, opacity: suptechFade}}>
              <div style={{fontFamily: FONT_SORA, fontSize: 22, color: COLOR_WHITE, marginBottom: 20}}>
                {BEAT7.SUPTECH_TITLE}
              </div>
              <div style={{display: 'flex', gap: 24}}>
                <div style={{flex: 2}}>
                  <div
                    style={{
                      fontFamily: FONT_IBM_SANS,
                      fontSize: 12,
                      color: COLOR_SLATE_400,
                      marginBottom: 8,
                    }}
                  >
                    Readiness heatmap (anonymized)
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: `80px repeat(${GAPS.length}, 1fr)`, gap: 4}}>
                    <div />
                    {GAPS.map((g) => (
                      <div
                        key={g}
                        style={{
                          fontFamily: FONT_IBM_SANS,
                          fontSize: 9,
                          color: COLOR_SLATE_400,
                          textAlign: 'center',
                          padding: 4,
                        }}
                      >
                        {g}
                      </div>
                    ))}
                    {BROKERS.map((broker, bi) => (
                      <React.Fragment key={broker}>
                        <div
                          style={{
                            fontFamily: FONT_IBM_SANS,
                            fontSize: 11,
                            color: COLOR_TEAL_400,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {broker}
                        </div>
                        {GAPS.map((_, gi) => {
                          const cellEnter = springSnappy(
                            Math.max(0, frame - suptechStart - 30 - bi * STAGGER - gi * 2),
                            fps,
                          );
                          const readiness = ((bi + gi) % 5) / 4;
                          const bg =
                            readiness > 0.6
                              ? COLOR_EMERALD_500
                              : readiness > 0.3
                                ? COLOR_TEAL_500
                                : COLOR_NAVY_700;
                          return (
                            <div
                              key={`${broker}-${gi}`}
                              style={{
                                height: 36,
                                borderRadius: 4,
                                background: bg,
                                opacity: cellEnter * (0.4 + readiness * 0.6),
                                transform: `scale(${cellEnter})`,
                              }}
                            />
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div style={{flex: 1}}>
                  <div style={{fontFamily: FONT_IBM_SANS, fontSize: 12, color: COLOR_SLATE_400, marginBottom: 12}}>
                    Common gaps
                  </div>
                  {['Incident SLA reporting', 'Cyber audit evidence', 'DR failover testing'].map((gap, i) => {
                    const enter = springSnappy(Math.max(0, frame - suptechStart - 60 - i * STAGGER * 2), fps);
                    return (
                      <div
                        key={gap}
                        style={{
                          padding: '10px 12px',
                          background: COLOR_NAVY_800,
                          borderRadius: 6,
                          marginBottom: 8,
                          fontFamily: FONT_IBM_SANS,
                          fontSize: 13,
                          color: COLOR_WHITE,
                          opacity: enter,
                          borderLeft: `3px solid ${COLOR_TEAL_400}`,
                        }}
                      >
                        {gap}
                      </div>
                    );
                  })}
                  <div
                    style={{
                      marginTop: 16,
                      padding: 12,
                      background: COLOR_NAVY_800,
                      borderRadius: 6,
                      fontFamily: FONT_IBM_SANS,
                      fontSize: 12,
                      color: COLOR_SLATE_400,
                    }}
                  >
                    Slow circulars: CSCRF amendments · Broker MC updates
                  </div>
                </div>
              </div>
            </div>
          </BrowserChrome>
        )}

        {captionSpring > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 48,
              left: '50%',
              transform: `translateX(-50%)`,
              fontFamily: FONT_IBM_SANS,
              fontSize: 14,
              color: COLOR_TEAL_400,
              letterSpacing: '0.06em',
              opacity: captionSpring,
            }}
          >
            {BEAT7.CAPTION}
          </div>
        )}

        {frame > 25 && frame < 90 && !showSuptech && (
          <UICursor x={cursorX} y={cursorY + 48} clicking={clicking} />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
