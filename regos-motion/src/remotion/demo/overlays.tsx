import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {
  COLOR_EMERALD_500,
  COLOR_NAVY_800,
  COLOR_NAVY_900,
  COLOR_SLATE_400,
  COLOR_TEAL_400,
} from '../system/colors';
import {FONT_IBM_SANS} from '../system/fonts';
import {METRIC_HUD} from './constants';

const CLIMAX_START = 2760;
const CLIMAX_END = 3900;

export const MetricHUD: React.FC = () => {
  const frame = useCurrentFrame();
  const dimmed = frame >= CLIMAX_START && frame < CLIMAX_END;
  const showFrom = 660;
  const opacity = interpolate(frame, [showFrom, showFrom + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const docsCount = Math.min(
    METRIC_HUD.docs.end,
    Math.floor(
      interpolate(frame, [660, 840, 1080, 1200], [0, 2, 2, 4], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    ),
  );

  const obligations = Math.min(
    METRIC_HUD.obligations.end,
    Math.floor(
      interpolate(frame, [1200, 1380], [0, 127], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    ),
  );

  const citationVisible = frame > 1860;
  const timeVisible = frame > 2700;

  const dimOpacity = dimmed ? 0.4 : 1;

  if (frame < showFrom) return null;

  const chips = [
    {label: 'Docs', value: String(docsCount)},
    {label: 'Obligations', value: String(obligations)},
    ...(citationVisible ? [{label: 'Citation', value: METRIC_HUD.citation}] : []),
    ...(timeVisible ? [{label: 'Time-to-plan', value: METRIC_HUD.timeToPlan}] : []),
  ];

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top: 32,
          right: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          opacity: opacity * dimOpacity,
        }}
      >
        {chips.map((chip) => (
          <div
            key={chip.label}
            style={{
              background: COLOR_NAVY_900,
              border: `1px solid ${COLOR_NAVY_800}`,
              borderRadius: 6,
              padding: '8px 14px',
              fontFamily: FONT_IBM_SANS,
              fontSize: 13,
              color: COLOR_SLATE_400,
              display: 'flex',
              gap: 8,
            }}
          >
            <span>{chip.label}</span>
            <span
              style={{
                color: chip.label === 'Citation' ? COLOR_EMERALD_500 : COLOR_TEAL_400,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {chip.value}
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const TrustDisclaimer: React.FC = () => {
  const frame = useCurrentFrame();
  const showFrom = 360;

  if (frame < showFrom) return null;

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: FONT_IBM_SANS,
          fontSize: 12,
          color: COLOR_SLATE_400,
          letterSpacing: '0.04em',
          opacity: 0.7,
        }}
      >
        Decision support · Not legal advice · Human approval required
      </div>
    </AbsoluteFill>
  );
};
