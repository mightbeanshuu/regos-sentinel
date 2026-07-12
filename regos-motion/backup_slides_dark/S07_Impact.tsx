import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {RegOSBackground} from '../system/Background';
import {Chrome} from '../system/Chrome';
import {ImpactLightning} from '../system/icons';
import {SvgPop} from '../system/SvgPop';
import {
  COLOR_EMERALD_500,
  COLOR_NAVY_700,
  COLOR_ROSE_500,
  COLOR_SLATE_400,
  COLOR_SLATE_500,
  COLOR_TEAL_500,
  COLOR_WHITE,
  STAGGER,
} from '../system/colors';
import {FONT_IBM_SANS, FONT_SORA} from '../system/fonts';
import {springBouncy, springPop, springSnappy, springSmooth} from '../system/springs';

const S07 = {
  TITLE: 'A new circular drops.',
  SUPPORT: 'RegOS simulates operational impact — instantly.',
  GLOSS: 'New circular → impact in minutes, not weeks.',
  CTA: 'Simulate New SEBI Circular',
  DIFFS: [
    '+ 12 obligations',
    '~ 8 controls changed',
    '→ 21 tasks generated',
    'Evidence gaps: 6',
  ],
  BEFORE: 'Weeks',
  AFTER: 'Minutes',
  CAPTION:
    'Circular-to-operational-action time — the one number that proves impact.',
};

const HeatmapCell: React.FC<{delay: number; index: number}> = ({delay, index}) => {
  const frame = useCurrentFrame();
  const colors = [COLOR_ROSE_500, '#FBBF24', COLOR_EMERALD_500];
  const color = colors[index % 3];
  const opacity = interpolate(frame, [delay, delay + 8], [0.2, 1], {extrapolateRight: 'clamp'});

  return (
    <div
      style={{
        width: 24,
        height: 24,
        background: color,
        opacity,
        borderRadius: 2,
      }}
    />
  );
};

export const S07_Impact: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleSpring = springSmooth(frame, fps);
  const buttonSpring = springSnappy(Math.max(0, frame - 30), fps);
  const buttonPress =
    frame > 60 && frame < 75 ? interpolate(frame, [60, 67, 75], [1, 0.96, 1]) : 1;
  const morphStart = 210;
  const weeksOpacity = interpolate(frame, [morphStart, morphStart + 30], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const weeksBlur = interpolate(frame, [morphStart, morphStart + 25], [0, 6], {
    extrapolateRight: 'clamp',
  });
  const minutesSpring = springBouncy(Math.max(0, frame - morphStart - 20), fps);
  const lightningDraw = springPop(Math.max(0, frame - morphStart - 10), fps);
  const progressFill = interpolate(frame, [morphStart, morphStart + 60], [0, 100], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <RegOSBackground atmosphere="climax" showHairline={false} />
      <AbsoluteFill style={{padding: '80px 96px', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8}}>
          <SvgPop>
            <ImpactLightning size={72} color={COLOR_TEAL_500} />
          </SvgPop>
          <h1
            style={{
              fontFamily: FONT_SORA,
              fontWeight: 700,
              fontSize: 52,
              color: COLOR_WHITE,
              opacity: titleSpring,
              margin: 0,
              textAlign: 'center',
            }}
          >
            {S07.TITLE}
          </h1>
        </div>
        <p
          style={{
            fontFamily: FONT_IBM_SANS,
            fontSize: 24,
            color: COLOR_SLATE_400,
            marginTop: 12,
            opacity: interpolate(frame, [15, 30], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S07.SUPPORT}
        </p>
        <button
          style={{
            marginTop: 32,
            padding: '16px 32px',
            background: COLOR_TEAL_500,
            color: COLOR_WHITE,
            border: 'none',
            borderRadius: 8,
            fontFamily: FONT_IBM_SANS,
            fontWeight: 600,
            fontSize: 18,
            opacity: buttonSpring,
            transform: `scale(${buttonPress * buttonSpring})`,
            cursor: 'default',
          }}
        >
          {S07.CTA}
        </button>
        <div style={{display: 'flex', gap: 48, marginTop: 48, width: '100%', maxWidth: 900}}>
          <div style={{flex: 1}}>
            {S07.DIFFS.map((diff, i) => {
              const enter = springSnappy(Math.max(0, frame - 90 - i * STAGGER), fps);
              const num = parseInt(diff.match(/\d+/)?.[0] ?? '0', 10);
              const count = Math.floor(
                interpolate(frame, [90 + i * STAGGER, 120 + i * STAGGER], [0, num], {
                  extrapolateRight: 'clamp',
                }),
              );
              const display = diff.replace(/\d+/, String(count));
              const barWidth = interpolate(frame, [90 + i * STAGGER, 100 + i * STAGGER], [0, 3], {
                extrapolateRight: 'clamp',
              });

              return (
                <div
                  key={diff}
                  style={{
                    opacity: enter,
                    transform: `translateX(${(1 - enter) * -20}px)`,
                    borderLeft: `${barWidth}px solid ${COLOR_EMERALD_500}`,
                    padding: '12px 20px',
                    marginBottom: 12,
                    fontFamily: FONT_IBM_SANS,
                    fontSize: 18,
                    color: COLOR_WHITE,
                    background: 'rgba(19,42,74,0.6)',
                  }}
                >
                  {display}
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 4,
              alignContent: 'start',
            }}
          >
            {Array.from({length: 12}).map((_, i) => (
              <HeatmapCell key={i} delay={100 + i * 3} index={i} />
            ))}
          </div>
        </div>
        <div
          style={{
            marginTop: 56,
            position: 'relative',
            height: 150,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* BEFORE: "Weeks" — fades out */}
          <div
            style={{
              position: 'absolute',
              fontFamily: FONT_SORA,
              fontWeight: 700,
              fontSize: 96,
              color: COLOR_ROSE_500,
              letterSpacing: '-0.04em',
              opacity: weeksOpacity,
              filter: `blur(${weeksBlur}px)`,
              lineHeight: 1,
            }}
          >
            {S07.BEFORE}
          </div>
          {/* AFTER: "→ ⚡ Minutes" — one centered flex group, no overlap */}
          {frame > morphStart && (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                opacity: minutesSpring,
              }}
            >
              <span
                style={{
                  fontSize: 56,
                  color: COLOR_SLATE_500,
                  transform: `translateX(${(1 - minutesSpring) * -24}px)`,
                }}
              >
                →
              </span>
              <ImpactLightning
                size={96}
                progress={lightningDraw}
                color={COLOR_EMERALD_500}
              />
              <div
                style={{
                  fontFamily: FONT_SORA,
                  fontWeight: 700,
                  fontSize: 96,
                  color: COLOR_EMERALD_500,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  transform: `scale(${interpolate(minutesSpring, [0, 1], [0.85, 1.04])})`,
                  transformOrigin: 'left center',
                }}
              >
                {S07.AFTER}
              </div>
            </div>
          )}
          {/* timing bar */}
          <div
            style={{
              position: 'absolute',
              bottom: -26,
              left: '24%',
              right: '24%',
              height: 4,
              background: COLOR_NAVY_700,
              borderRadius: 2,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressFill}%`,
                background: COLOR_TEAL_500,
                borderRadius: 2,
                boxShadow: `0 0 12px ${COLOR_TEAL_500}`,
              }}
            />
          </div>
        </div>
        <p
          style={{
            position: 'absolute',
            bottom: 100,
            fontFamily: FONT_IBM_SANS,
            fontSize: 18,
            color: COLOR_SLATE_400,
            textAlign: 'center',
            maxWidth: 700,
            opacity: interpolate(frame, [360, 390], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S07.CAPTION}
        </p>
        <p
          style={{
            position: 'absolute',
            bottom: 72,
            fontFamily: FONT_IBM_SANS,
            fontSize: 15,
            color: COLOR_TEAL_500,
            fontStyle: 'italic',
            opacity: interpolate(frame, [370, 400], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          {S07.GLOSS}
        </p>
      </AbsoluteFill>
      <Chrome slideIndex={7} totalSlides={10} />
    </AbsoluteFill>
  );
};
