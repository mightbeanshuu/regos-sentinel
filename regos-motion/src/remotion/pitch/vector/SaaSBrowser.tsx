import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT_IBM_SANS} from '../../system/fonts';
import {NAVY_LINE, NAVY_PANEL, SLATE, TEAL, WHITE} from '../constants';

// ————————————————————————————————————————————————————————————————
// SaaSBrowser — physically-believable browser+dashboard entrance.
//
// Drop-in superset of the demo BrowserChrome (same url/children/widthPct/
// maxWidth API) with the director-brief physics:
//   • spring rise {mass:0.9, stiffness:92, damping:15} — ONE restrained overshoot
//   • 240px-below → settle, scale 0.90→1, rotateX 7°→0, opacity 0→1, blur 8→0
//   • layered entrance: shadow → body → URL-bar(+6f) → content(+4f)
//   • glass URL bar (58–72% deep-blue, blur 22px, 1px white 15%, inner highlight)
//   • optional cursor-typed URL (select → clear → type → Enter sweep)
// Deterministic at 60fps.
// ————————————————————————————————————————————————————————————————

const CH = 8.1; // ~char advance for IBM Plex Sans at 15px

export type TypeUrl = {from: string; to: string};

export const SaaSBrowser: React.FC<{
  url: string;
  children: React.ReactNode;
  widthPct?: number;
  maxWidth?: number;
  /** delay before the browser begins its rise (frames) */
  startDelay?: number;
  /** if set, the URL bar animates: shows `from`, selects, clears, types `to` */
  typeUrl?: TypeUrl;
  /** show the flowing teal verification sweep after the URL commits */
  verifyOnCommit?: boolean;
}> = ({
  url,
  children,
  widthPct = 90,
  maxWidth = 1400,
  startDelay = 0,
  typeUrl,
  verifyOnCommit = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = Math.max(0, frame - startDelay);

  // ——— spring rise (mass 0.9 / stiffness 92 / damping 15 → one overshoot) ———
  const rise = spring({frame: f, fps, config: {mass: 0.9, stiffness: 92, damping: 15}});
  const translateY = interpolate(rise, [0, 1], [240, 0]);
  const scale = interpolate(rise, [0, 1], [0.9, 1]);
  const rotateX = interpolate(rise, [0, 1], [7, 0]);
  const opacity = interpolate(f, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
  const blur = interpolate(rise, [0, 0.7], [8, 0], {extrapolateRight: 'clamp'});

  // shadow tightens as the surface approaches the camera
  const shadowSpread = interpolate(rise, [0, 1], [80, 34]);
  const shadowY = interpolate(rise, [0, 1], [60, 22]);
  const shadowAlpha = interpolate(rise, [0, 1], [0.18, 0.5]);

  // layered reveals
  const urlEnter = interpolate(f, [6, 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const contentEnter = interpolate(f, [12, 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const contentY = (1 - contentEnter) * 6;

  // ——— URL typing choreography (only when typeUrl provided) ———
  const typing = (() => {
    if (!typeUrl) return {text: url, caret: false, cursorX: 0, selecting: 0, committed: true, sweep: 0};
    const t0 = 20; // start after the bar has settled
    const from = typeUrl.from;
    const to = typeUrl.to;
    const selDur = 12; // selection sweep
    const clearAt = t0 + selDur + 4;
    const typeStart = clearAt + 4;
    const perChar = 2;
    const typeDur = to.length * perChar;
    const commitAt = typeStart + typeDur + 8;

    const lf = f;
    if (lf < t0) return {text: from, caret: false, cursorX: from.length * CH, selecting: 0, committed: false, sweep: 0};
    if (lf < t0 + selDur) {
      const p = (lf - t0) / selDur;
      return {text: from, caret: false, cursorX: from.length * CH, selecting: p, committed: false, sweep: 0};
    }
    if (lf < typeStart) return {text: '', caret: true, cursorX: 0, selecting: 0, committed: false, sweep: 0};
    const typed = Math.min(to.length, Math.floor((lf - typeStart) / perChar));
    const text = to.slice(0, typed);
    const blink = Math.floor((lf / 18)) % 2 === 0;
    const committed = lf >= commitAt;
    const sweep = committed
      ? interpolate(lf, [commitAt, commitAt + 26], [0, 1], {extrapolateRight: 'clamp'})
      : 0;
    return {text: committed ? to : text, caret: committed ? false : blink, cursorX: text.length * CH, selecting: 0, committed, sweep};
  })();

  const glassSweep = verifyOnCommit ? typing.sweep : 0;

  return (
    <div style={{perspective: 1600, width: '100%', display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          width: `${widthPct}%`,
          maxWidth,
          opacity,
          transform: `translateY(${translateY}px) scale(${scale}) rotateX(${rotateX}deg)`,
          transformOrigin: 'center bottom',
          transformStyle: 'preserve-3d',
          filter: blur > 0.15 ? `blur(${blur}px)` : 'none',
          borderRadius: 14,
          overflow: 'hidden',
          border: `1px solid ${NAVY_LINE}`,
          boxShadow: `0 ${shadowY}px ${shadowSpread}px rgba(4,8,20,${shadowAlpha})`,
        }}
      >
        {/* ——— chrome bar ——— */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(18,32,66,0.78) 0%, rgba(10,20,44,0.72) 100%)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            borderBottom: `1px solid ${NAVY_LINE}`,
            padding: '13px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div style={{display: 'flex', gap: 7}}>
            {['#F43F5E', '#FBBF24', '#10B981'].map((c) => (
              <div key={c} style={{width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.9}} />
            ))}
          </div>
          {/* glass URL field */}
          <div
            style={{
              position: 'relative',
              flex: 1,
              opacity: urlEnter,
              background: 'rgba(9,17,38,0.66)',
              backdropFilter: 'blur(22px)',
              WebkitBackdropFilter: 'blur(22px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.20), 0 2px 10px rgba(4,8,20,0.35)',
              borderRadius: 8,
              padding: '7px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflow: 'hidden',
              minHeight: 20,
            }}
          >
            {/* small lock */}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{flexShrink: 0, opacity: 0.6}}>
              <rect x="5" y="11" width="14" height="9" rx="2" stroke={SLATE} strokeWidth="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={SLATE} strokeWidth="2" />
            </svg>
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              {typing.selecting > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: -2,
                    bottom: -2,
                    width: typing.selecting * (typing.text.length * CH),
                    background: `${TEAL}44`,
                    borderRadius: 3,
                  }}
                />
              )}
              <span
                style={{
                  fontFamily: FONT_IBM_SANS,
                  fontSize: 15,
                  color: typing.committed || !typeUrl ? WHITE : SLATE,
                  whiteSpace: 'pre',
                  letterSpacing: '0.005em',
                  position: 'relative',
                }}
              >
                {typing.text}
              </span>
              {typing.caret && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 1.5,
                    height: 17,
                    background: TEAL,
                    marginLeft: 1,
                  }}
                />
              )}
            </div>
            {/* teal verification sweep after commit */}
            {glassSweep > 0 && glassSweep < 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${glassSweep * 100 - 12}%`,
                  width: '12%',
                  background: `linear-gradient(90deg, transparent, ${TEAL}55, transparent)`,
                }}
              />
            )}
          </div>
        </div>

        {/* commit progress line under the bar */}
        {glassSweep > 0 && (
          <div style={{height: 2, background: 'rgba(255,255,255,0.05)'}}>
            <div style={{height: '100%', width: `${glassSweep * 100}%`, background: TEAL}} />
          </div>
        )}

        {/* ——— app surface (solid, per brief) ——— */}
        <div
          style={{
            background: NAVY_PANEL,
            minHeight: 500,
            opacity: contentEnter,
            transform: `translateY(${contentY}px)`,
          }}
        >
          {children}
        </div>
      </div>

      {/* cursor arrow travelling to the caret during typing */}
      {typeUrl && !typing.committed && f > 14 && (
        <Cursor />
      )}
    </div>
  );
};

const Cursor: React.FC = () => {
  const frame = useCurrentFrame();
  // subtle idle drift so the cursor feels hand-held, not pinned
  const dx = Math.sin(frame / 12) * 1.4;
  const dy = Math.cos(frame / 15) * 1.2;
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      style={{position: 'absolute', left: `calc(52% + ${dx}px)`, top: `calc(20% + ${dy}px)`, zIndex: 80, filter: 'drop-shadow(0 2px 4px rgba(4,8,20,0.6))'}}
    >
      <path d="M5 3l14 8-6 1.5L10 20 5 3z" fill={WHITE} stroke="#0B1220" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
};
