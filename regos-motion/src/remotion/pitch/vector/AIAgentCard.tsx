import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT_IBM_SANS, FONT_SORA} from '../../system/fonts';
import {ROYAL, SLATE, TEAL, WHITE} from '../constants';

// ————————————————————————————————————————————————————————————————
// AIAgentCard — the "AI Agent" chat moment (NeuraFlow-style), RegOS content.
// User question bubble → glowing orb avatar + "AI Agent" → frosted glass card
// with RegOS capability bullets revealing one by one. Deterministic.
// ————————————————————————————————————————————————————————————————

const BULLETS = [
  'Reads any SEBI circular and lists every duty inside it — nothing skipped.',
  'Flags anything ambiguous and waits for a human to approve.',
  'Backs every obligation with cited, reproducible evidence.',
];

const QUESTION = 'How can RegOS Sentinel help?';

export const AIAgentCard: React.FC<{startFrame?: number}> = ({startFrame = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = Math.max(0, frame - startFrame);

  // user question bubble types in, then agent responds
  const qChars = Math.min(QUESTION.length, Math.floor(f / 1.3));
  const qText = QUESTION.slice(0, qChars);
  const qEnter = interpolate(f, [0, 10], [0, 1], {extrapolateRight: 'clamp'});

  const agentIn = spring({frame: f - 34, fps, config: {mass: 0.8, stiffness: 90, damping: 14}});
  const orbPulse = 0.9 + 0.1 * Math.sin(f / 12);

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 1180,
        display: 'flex',
        flexDirection: 'column',
        gap: 26,
        zIndex: 20,
      }}
    >
      {/* user question — right-aligned glass bubble */}
      <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, opacity: qEnter}}>
        <div
          style={{
            background: 'rgba(20,32,64,0.66)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
            borderRadius: '16px 16px 4px 16px',
            padding: '16px 24px',
            fontFamily: FONT_IBM_SANS,
            fontSize: 26,
            color: WHITE,
            maxWidth: 720,
          }}
        >
          {qText}
          {qChars < QUESTION.length && <span style={{color: TEAL}}>|</span>}
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(147,164,200,0.2)',
            border: '1px solid rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke={SLATE} strokeWidth="2" />
            <path d="M5 20a7 7 0 0 1 14 0" stroke={SLATE} strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* agent header + answer card */}
      <div style={{display: 'flex', gap: 20, alignItems: 'flex-start', opacity: agentIn, transform: `translateY(${(1 - agentIn) * 24}px)`}}>
        {/* glowing orb avatar */}
        <div style={{position: 'relative', width: 64, height: 64, flexShrink: 0}}>
          <div
            style={{
              position: 'absolute',
              inset: -14,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${TEAL}66 0%, ${ROYAL}33 45%, transparent 72%)`,
              opacity: orbPulse,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `linear-gradient(150deg, ${ROYAL} 0%, ${TEAL} 100%)`,
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" fill={WHITE} />
            </svg>
          </div>
        </div>

        {/* frosted glass answer */}
        <div
          style={{
            flex: 1,
            background: 'rgba(12,22,46,0.62)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(150,180,240,0.22)',
            boxShadow: '0 24px 70px rgba(3,6,18,0.5), inset 0 1px 0 rgba(255,255,255,0.14)',
            borderRadius: '4px 18px 18px 18px',
            padding: '26px 30px',
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20}}>
            <span style={{fontFamily: FONT_SORA, fontWeight: 700, fontSize: 20, color: WHITE}}>AI Agent</span>
            <span style={{fontFamily: FONT_IBM_SANS, fontSize: 15, color: TEAL, letterSpacing: '0.04em'}}>· RegOS Sentinel</span>
          </div>
          {BULLETS.map((b, i) => {
            const bf = f - 60 - i * 22;
            const e = interpolate(bf, [0, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  marginBottom: i < BULLETS.length - 1 ? 16 : 0,
                  opacity: e,
                  transform: `translateY(${(1 - e) * 10}px)`,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    background: `${TEAL}22`,
                    border: `1px solid ${TEAL}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 3,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l4 5 10-11" stroke={TEAL} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{fontFamily: FONT_IBM_SANS, fontSize: 25, lineHeight: 1.35, color: '#DCE5F5'}}>{b}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
