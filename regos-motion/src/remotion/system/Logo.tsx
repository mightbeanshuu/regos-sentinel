import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  COLOR_NAVY_700,
  COLOR_NAVY_950,
  COLOR_TEAL_400,
  COLOR_TEAL_500,
  COLOR_WHITE,
  LOGO_MARK_SIZE,
  LOGO_WORD_SIZE,
} from './colors';
import {FONT_SORA} from './fonts';
import {Shield} from './icons';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  centered?: boolean;
  /** 0–1 shield stroke→fill reveal */
  drawProgress?: number;
  showWordmark?: boolean;
};

const SIZES = {
  sm: {mark: LOGO_MARK_SIZE, word: LOGO_WORD_SIZE},
  md: {mark: 48, word: 36},
  lg: {mark: 64, word: 56},
};

export const Logo: React.FC<LogoProps> = ({
  size = 'sm',
  centered = false,
  drawProgress,
  showWordmark = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {mark, word} = SIZES[size];
  const progress = drawProgress ?? 1;
  const wordSpring =
    drawProgress !== undefined
      ? spring({frame: Math.max(0, frame - 18), fps, config: {damping: 200, stiffness: 100}})
      : 1;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        justifyContent: centered ? 'center' : 'flex-start',
      }}
    >
      {drawProgress !== undefined ? (
        <Shield size={mark} progress={progress} popped={1} />
      ) : (
        <svg width={mark} height={mark} viewBox="0 0 48 48" fill="none">
          <path
            d="M24 4 L42 14 L42 34 L24 44 L6 34 L6 14 Z"
            fill={COLOR_TEAL_500}
            stroke={COLOR_TEAL_500}
            strokeWidth={1}
            strokeLinejoin="round"
          />
          <rect x={22} y={14} width={4} height={20} rx={2} fill={COLOR_NAVY_950} />
        </svg>
      )}
      {showWordmark && !centered && (
        <div
          style={{
            width: 1,
            height: 20,
            background: COLOR_NAVY_700,
          }}
        />
      )}
      {showWordmark && (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            opacity: wordSpring,
            transform: `translateY(${(1 - wordSpring) * 8}px)`,
          }}
        >
          <span
            style={{
              fontFamily: FONT_SORA,
              fontWeight: 700,
              fontSize: word,
              color: COLOR_WHITE,
              letterSpacing: '-0.02em',
            }}
          >
            RegOS
          </span>
          <span
            style={{
              fontFamily: FONT_SORA,
              fontWeight: 500,
              fontSize: word * 0.85,
              color: COLOR_TEAL_400,
              letterSpacing: '-0.02em',
            }}
          >
            Sentinel
          </span>
        </div>
      )}
    </div>
  );
};
