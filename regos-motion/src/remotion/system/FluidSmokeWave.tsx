import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLOR_CYAN_600, COLOR_NAVY_950, COLOR_TEAL_400} from './colors';

type FluidSmokeWaveProps = {
  intensity?: number;
  phaseOffset?: number;
  verticalBias?: number;
  waveIndex?: number;
  amplitudeScale?: number;
};

export const FluidSmokeWave: React.FC<FluidSmokeWaveProps> = ({
  intensity = 1,
  phaseOffset = 0,
  verticalBias = 0.55,
  waveIndex = 0,
  amplitudeScale = 1,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const phase = ((t * 0.4 + phaseOffset) % 1 + 1) % 1;
  const fadeIn = interpolate(frame, [0, 24], [0, 1], {extrapolateRight: 'clamp'});
  const amp = 58 * intensity * amplitudeScale;
  const gradientId = `smokeGrad-${waveIndex}`;
  const isSecondary = waveIndex % 2 === 1;

  const waveY = (x: number) => {
    const nx = x / width;
    const primaryFreq = isSecondary ? 2.6 : 3;
    const secondaryFreq = isSecondary ? 4.2 : 5;
    return (
      height * verticalBias +
      Math.sin(nx * Math.PI * primaryFreq + phase * Math.PI * 2) * amp +
      Math.sin(nx * Math.PI * secondaryFreq + phase * Math.PI * 3) * (amp * 0.42)
    );
  };

  const d = [
    `M 0 ${height}`,
    `L 0 ${waveY(0)}`,
    ...Array.from({length: 8}, (_, i) => {
      const x = (width / 8) * (i + 1);
      return `L ${x} ${waveY(x)}`;
    }),
    `L ${width} ${height}`,
    'Z',
  ].join(' ');

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: 'absolute',
        inset: 0,
        opacity: fadeIn * 0.38 * intensity,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1={isSecondary ? '100%' : '0%'}
          y1="0%"
          x2={isSecondary ? '0%' : '100%'}
          y2={isSecondary ? '30%' : '0%'}
        >
          {isSecondary ? (
            <>
              <stop offset="0%" stopColor={COLOR_TEAL_400} stopOpacity={0.42} />
              <stop offset="45%" stopColor={COLOR_CYAN_600} stopOpacity={0.28} />
              <stop offset="100%" stopColor={COLOR_NAVY_950} stopOpacity={0} />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor={COLOR_CYAN_600} stopOpacity={0.55} />
              <stop offset="50%" stopColor={COLOR_TEAL_400} stopOpacity={0.38} />
              <stop offset="100%" stopColor={COLOR_NAVY_950} stopOpacity={0} />
            </>
          )}
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${gradientId})`} />
    </svg>
  );
};
