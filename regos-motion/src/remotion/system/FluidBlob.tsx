import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  COLOR_CYAN_600,
  COLOR_EMERALD_500,
  COLOR_TEAL_400,
} from './colors';

type FluidBlobProps = {
  intensity?: number;
  maxOpacity?: number;
  variant?: 'smoke' | 'orb' | 'bloom';
  index?: number;
};

const VARIANTS = {
  smoke: {colors: [COLOR_CYAN_600, COLOR_TEAL_400], size: 520, blur: 100},
  orb: {colors: [COLOR_TEAL_400, COLOR_EMERALD_500], size: 400, blur: 80},
  bloom: {colors: [COLOR_EMERALD_500, COLOR_TEAL_400], size: 360, blur: 90},
} as const;

const POSITIONS = [
  {x: '72%', y: '18%', phase: 0},
  {x: '12%', y: '68%', phase: 1.2},
  {x: '88%', y: '78%', phase: 2.4},
] as const;

export const FluidBlob: React.FC<FluidBlobProps> = ({
  intensity = 1,
  maxOpacity = 0.35,
  variant = 'orb',
  index = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const pos = POSITIONS[index % POSITIONS.length];
  const cfg = VARIANTS[variant];

  const driftX = Math.sin(t * 0.35 + pos.phase) * 80;
  const driftY = Math.cos(t * 0.28 + pos.phase) * 50;
  const scale = 1 + Math.sin(t * 0.2 + pos.phase) * 0.06;
  const opacity =
    interpolate(intensity, [0, 1], [0, maxOpacity]) * (variant === 'bloom' ? 0.85 : 1);

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: cfg.size,
        height: cfg.size,
        transform: `translate(-50%, -50%) translate(${driftX}px, ${driftY}px) scale(${scale})`,
        background: `radial-gradient(circle, ${cfg.colors[0]}88 0%, ${cfg.colors[1]}44 45%, transparent 70%)`,
        filter: `blur(${cfg.blur}px)`,
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};
