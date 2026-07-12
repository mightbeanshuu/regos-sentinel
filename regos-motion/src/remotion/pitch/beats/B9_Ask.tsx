import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Shield} from '../../system/icons';
import {FONT_IBM_SANS, FONT_SORA} from '../../system/fonts';
import {springUI} from '../../system/springs';
import {CAPTIONS, ROYAL, TAGLINE, TEAL, WHITE} from '../constants';
import {CaptionBar, StillImage, VoidField} from '../shared';

const WORDS = ['CORPUS', 'PROFILE', 'PILOT'];
const CYCLE = 62; // frames per word
const SWAP_END = WORDS.length * CYCLE; // 186

// returns the visible last-word substring for the current frame
const wordAt = (f: number) => {
  if (f >= (WORDS.length - 1) * CYCLE) {
    // last word — type and hold
    const local = f - (WORDS.length - 1) * CYCLE;
    const n = Math.min(WORDS[2].length, Math.floor(local / 4));
    return WORDS[2].slice(0, n);
  }
  const idx = Math.floor(f / CYCLE);
  const local = f % CYCLE;
  const w = WORDS[idx];
  if (local < 24) return w.slice(0, Math.min(w.length, Math.floor(local / 4)));
  if (local < 46) return w;
  // delete
  const del = Math.floor((local - 46) / 3);
  return w.slice(0, Math.max(0, w.length - del));
};

export const B9_Ask: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const swapping = frame < SWAP_END + 20;
  const word = wordAt(Math.max(0, frame));
  const caretOn = Math.floor(frame / 15) % 2 === 0;

  const bigFade = interpolate(frame, [SWAP_END, SWAP_END + 20], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const logoIn = springUI(Math.max(0, frame - SWAP_END - 10), fps);
  const askIn = springUI(Math.max(0, frame - SWAP_END - 40), fps);

  return (
    <AbsoluteFill>
      <VoidField />

      {/* Word-swap climax */}
      {swapping && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: bigFade}}>
          <div
            style={{
              fontFamily: FONT_SORA,
              fontWeight: 700,
              fontSize: 132,
              letterSpacing: '-0.03em',
              color: WHITE,
              display: 'flex',
              alignItems: 'baseline',
              gap: 26,
            }}
          >
            <span>ONE</span>
            <span style={{color: TEAL, minWidth: 40}}>{word}</span>
            <span style={{color: TEAL, opacity: caretOn ? 1 : 0.15, fontWeight: 400}}>|</span>
          </div>
        </AbsoluteFill>
      )}

      {/* Brand collapse + ask */}
      {frame > SWAP_END + 4 && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{position: 'absolute', width: 560, height: 560, borderRadius: '50%', background: `radial-gradient(circle, ${ROYAL}3a 0%, transparent 62%)`, opacity: logoIn}} />
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: logoIn, transform: `translateY(${(1 - logoIn) * 20}px)`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
              <div
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: 22,
                  background: `linear-gradient(160deg, ${ROYAL} 0%, #14307E 100%)`,
                  border: `1px solid ${TEAL}33`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 18px 50px ${ROYAL}55`,
                  position: 'relative',
                }}
              >
                <div style={{transform: 'scale(1.2)'}}>
                  <Shield size={48} color={WHITE} progress={1} popped={1} />
                </div>
                <StillImage assetKey="appIcon" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 22}} />
              </div>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 10}}>
                <span style={{fontFamily: FONT_SORA, fontWeight: 700, fontSize: 58, color: WHITE, letterSpacing: '-0.03em'}}>RegOS</span>
                <span style={{fontFamily: FONT_SORA, fontWeight: 500, fontSize: 46, color: TEAL, letterSpacing: '-0.02em'}}>Sentinel</span>
              </div>
            </div>

            <div style={{marginTop: 26, fontFamily: FONT_IBM_SANS, fontSize: 26, color: '#C7D2E8', opacity: askIn}}>
              {TAGLINE}
            </div>
            <div
              style={{
                marginTop: 22,
                display: 'flex',
                gap: 12,
                opacity: askIn,
                transform: `translateY(${(1 - askIn) * 14}px)`,
              }}
            >
              {['One public corpus', 'One synthetic profile', 'One 90-day pilot'].map((t) => (
                <div
                  key={t}
                  style={{
                    fontFamily: FONT_IBM_SANS,
                    fontSize: 16,
                    fontWeight: 600,
                    color: WHITE,
                    padding: '9px 18px',
                    borderRadius: 999,
                    background: `${TEAL}12`,
                    border: `1px solid ${TEAL}66`,
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {frame < SWAP_END && <CaptionBar text={CAPTIONS.ask} delay={20} />}
    </AbsoluteFill>
  );
};
