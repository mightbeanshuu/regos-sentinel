import React from 'react';
import {interpolate} from 'remotion';
import {COLOR_TEAL_400, COLOR_TEAL_500} from '../colors';
import type {IconMotionProps} from './types';

export const SandboxBox: React.FC<IconMotionProps> = ({
  size = 48,
  color = COLOR_TEAL_500,
  progress = 1,
  popped = 1,
}) => {
  const scale = interpolate(popped, [0, 0.7, 1], [0, 1.08, 1]);
  const fillOpacity = Math.max(0, (progress - 0.7) / 0.3);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      style={{transform: `scale(${scale})`, transformOrigin: 'center'}}
    >
      <rect
        x={8}
        y={14}
        width={32}
        height={28}
        rx={4}
        fill={color}
        fillOpacity={fillOpacity * 0.15}
        stroke={color}
        strokeWidth={2}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
      <path
        d="M8 14 L24 6 L40 14"
        fill="none"
        stroke={COLOR_TEAL_400}
        strokeWidth={1.5}
        strokeLinejoin="round"
        opacity={progress > 0.5 ? interpolate(progress, [0.5, 0.8], [0, 1]) : 0}
      />
    </svg>
  );
};
