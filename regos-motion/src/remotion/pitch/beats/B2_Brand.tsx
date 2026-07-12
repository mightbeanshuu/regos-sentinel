import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Shield} from '../../system/icons';
import {FONT_IBM_SANS, FONT_SORA} from '../../system/fonts';
import {CAPTIONS, ROYAL, TAGLINE, TEAL, WHITE} from '../constants';
import {CaptionBar, StillImage, VoidField} from '../shared';

// Section 14 logo intro, scaled to this beat (420f @60fps).
export const B2_Brand: React.FC = () => {
  const frame = useCurrentFrame();

  const tileRise = interpolate(frame, [24, 64], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tileScaleIn = interpolate(frame, [24, 64], [0.82, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const settle = interpolate(frame, [144, 188], [1.035, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tileScale = Math.min(tileScaleIn, settle);
  const tileOpacity = interpolate(frame, [10, 34], [0, 1], {extrapolateRight: 'clamp'});

  const shieldProgress = interpolate(frame, [50, 112], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // teal verification ring travels once around the hex
  const ringDraw = interpolate(frame, [118, 158], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // wordmark unmask + group recenter
  const reveal = interpolate(frame, [172, 230], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const WORD_BOX = 660;
  const GAP = 30;
  const groupShift = ((WORD_BOX + GAP) / 2) * (1 - reveal);

  // tagline typing (3f/char) from ~218
  const tag = TAGLINE.slice(
    0,
    Math.max(0, Math.min(TAGLINE.length, Math.floor((frame - 218) / 3))),
  );
  const tagCaret = frame > 218 && tag.length < TAGLINE.length && Math.floor(frame / 16) % 2 === 0;

  const TILE = 132;

  // crisp app-icon PNG crossfades in at settle for premium fidelity
  const iconCross = interpolate(frame, [176, 214], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // compliance monolith rises as a dimensional hero behind the mark
  const monoRise = interpolate(frame, [0, 90], [90, 0], {extrapolateRight: 'clamp'});
  const monoOpacity = interpolate(frame, [10, 70, 340, 420], [0, 0.42, 0.42, 0.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <VoidField />
      {/* dimensional 3D metaphor — regulation compiling into structure */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <StillImage
          assetKey="monolith"
          style={{
            position: 'absolute',
            height: 760,
            width: 'auto',
            transform: `translateY(${monoRise + 40}px)`,
            opacity: monoOpacity,
            filter: 'drop-shadow(0 30px 80px rgba(27,63,184,0.5))',
          }}
        />
      </AbsoluteFill>
      {/* extra centered bloom during construction */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            position: 'absolute',
            width: 620,
            height: 620,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${ROYAL}44 0%, transparent 62%)`,
            opacity: interpolate(frame % 90, [0, 45, 90], [0.7, 1, 0.7]),
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{transform: `translateX(-${groupShift}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: GAP}}>
            {/* Tile + shield */}
            <div
              style={{
                width: TILE,
                height: TILE,
                borderRadius: 30,
                background: `linear-gradient(160deg, ${ROYAL} 0%, #14307E 100%)`,
                border: `1px solid ${TEAL}33`,
                boxShadow: `0 24px 70px ${ROYAL}55, inset 0 1px 0 rgba(255,255,255,0.15)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                opacity: tileOpacity,
                transform: `translateY(${tileRise}px) scale(${tileScale})`,
              }}
            >
              <svg width={132} height={132} viewBox="0 0 132 132" style={{position: 'absolute'}}>
                <circle
                  cx={66}
                  cy={66}
                  r={54}
                  fill="none"
                  stroke={TEAL}
                  strokeWidth={2.5}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - ringDraw}
                  opacity={0.9}
                  transform="rotate(-90 66 66)"
                />
              </svg>
              <div style={{transform: 'scale(1.7)'}}>
                <Shield size={48} color={WHITE} progress={shieldProgress} popped={1} />
              </div>
              <StillImage
                assetKey="appIcon"
                style={{position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 30, opacity: iconCross}}
              />
            </div>

            {/* Wordmark — clip-revealed from behind the tile */}
            <div
              style={{
                width: WORD_BOX,
                overflow: 'hidden',
                clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`,
              }}
            >
              <div style={{display: 'flex', alignItems: 'baseline', gap: 12, whiteSpace: 'nowrap'}}>
                <span
                  style={{
                    fontFamily: FONT_SORA,
                    fontWeight: 700,
                    fontSize: 76,
                    color: WHITE,
                    letterSpacing: '-0.03em',
                  }}
                >
                  RegOS
                </span>
                <span
                  style={{
                    fontFamily: FONT_SORA,
                    fontWeight: 500,
                    fontSize: 62,
                    color: TEAL,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Sentinel
                </span>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div
            style={{
              marginTop: 34,
              fontFamily: FONT_IBM_SANS,
              fontSize: 28,
              color: '#C7D2E8',
              letterSpacing: '0.01em',
              height: 40,
            }}
          >
            {tag}
            {tagCaret && <span style={{color: TEAL}}>|</span>}
          </div>
        </div>
      </AbsoluteFill>

      <CaptionBar text={CAPTIONS.brand} delay={250} />
    </AbsoluteFill>
  );
};
