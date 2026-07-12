import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  COLOR_NAVY_800,
  COLOR_SLATE_400,
  COLOR_TEAL_400,
  COLOR_TEAL_500,
  LOGO_PAD,
} from './colors';
import {FONT_IBM_SANS} from './fonts';
import {Logo} from './Logo';
import {SPRING_UI} from './springs';

type ChromeProps = {
  slideIndex: number;
  totalSlides: number;
  showLogo?: boolean;
  showProgress?: boolean;
};

// Editorial "glass pill" chrome — persistent nav + page marker across every slide.
const PILL_BG = 'rgba(19,42,74,0.55)';
const PILL_BORDER = '1px solid rgba(148,163,184,0.16)';
const PILL_SHADOW =
  '0 8px 28px rgba(6,16,31,0.45), inset 0 1px 0 rgba(255,255,255,0.04)';

export const Chrome: React.FC<ChromeProps> = ({
  slideIndex,
  totalSlides,
  showLogo = true,
  showProgress = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: SPRING_UI, durationInFrames: 18});
  const dropY = (1 - enter) * -14;
  const riseY = (1 - enter) * 14;
  const progressOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const targetWidth = (slideIndex / totalSlides) * 100;
  const prevWidth = ((slideIndex - 1) / totalSlides) * 100;
  const widthTween = spring({
    frame,
    fps,
    config: SPRING_UI,
    durationInFrames: 15,
  });
  const barWidth = interpolate(widthTween, [0, 1], [prevWidth, targetWidth]);

  return (
    <>
      {showLogo && (
        <div
          style={{
            position: 'absolute',
            top: LOGO_PAD.top,
            left: LOGO_PAD.left,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            padding: '12px 22px 12px 16px',
            borderRadius: 999,
            background: PILL_BG,
            backdropFilter: 'blur(14px)',
            border: PILL_BORDER,
            boxShadow: PILL_SHADOW,
            opacity: enter,
            transform: `translateY(${dropY}px)`,
          }}
        >
          <Logo size="sm" />
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          top: LOGO_PAD.top,
          right: LOGO_PAD.left,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '13px 22px',
          borderRadius: 999,
          background: PILL_BG,
          backdropFilter: 'blur(14px)',
          border: PILL_BORDER,
          boxShadow: PILL_SHADOW,
          fontFamily: FONT_IBM_SANS,
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLOR_SLATE_400,
          opacity: enter,
          transform: `translateY(${dropY}px)`,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: COLOR_TEAL_400,
            boxShadow: `0 0 10px ${COLOR_TEAL_400}`,
          }}
        />
        PS2 · SEBI TechSprint
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: LOGO_PAD.top - 6,
          right: LOGO_PAD.left,
          zIndex: 10,
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          padding: '11px 24px',
          borderRadius: 999,
          background: COLOR_NAVY_800,
          border: PILL_BORDER,
          boxShadow: PILL_SHADOW,
          fontFamily: FONT_IBM_SANS,
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          opacity: enter,
          transform: `translateY(${riseY}px)`,
        }}
      >
        <span style={{color: COLOR_SLATE_400, fontSize: 12}}>Page</span>
        <span style={{color: COLOR_TEAL_400, fontWeight: 700}}>
          {String(slideIndex).padStart(2, '0')}
        </span>
        <span style={{color: COLOR_SLATE_400}}>
          / {String(totalSlides).padStart(2, '0')}
        </span>
      </div>
      {showProgress && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'rgba(148,163,184,0.15)',
            opacity: progressOpacity,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${barWidth}%`,
              background: COLOR_TEAL_500,
              boxShadow: `0 0 12px ${COLOR_TEAL_500}`,
            }}
          />
        </div>
      )}
    </>
  );
};
