import React from 'react';
import {interpolate} from 'remotion';
import {COLOR_NAVY_950, COLOR_TEAL_500} from '../colors';
import type {IconMotionProps} from './types';

export const Shield: React.FC<IconMotionProps> = ({
  size = 48,
  color = COLOR_TEAL_500,
  progress = 1,
  popped = 1,
}) => {
  const scale = interpolate(popped, [0, 0.7, 1], [0, 1.08, 1]);
  const fillOpacity = Math.max(0, (progress - 0.6) / 0.4);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      style={{transform: `scale(${scale})`, transformOrigin: 'center'}}
    >
      <path
        d="M24 4 L42 14 L42 34 L24 44 L6 34 L6 14 Z"
        fill={color}
        fillOpacity={fillOpacity}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
      <rect
        x={22}
        y={14}
        width={4}
        height={20}
        rx={2}
        fill={COLOR_NAVY_950}
        opacity={fillOpacity}
      />
    </svg>
  );
};
