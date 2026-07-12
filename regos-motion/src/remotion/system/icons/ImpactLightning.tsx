import React from 'react';
import {interpolate} from 'remotion';
import {COLOR_EMERALD_500} from '../colors';
import type {IconMotionProps} from './types';

export const ImpactLightning: React.FC<IconMotionProps> = ({
  size = 48,
  color = COLOR_EMERALD_500,
  progress = 1,
  popped = 1,
}) => {
  const scale = interpolate(popped, [0, 0.7, 1], [0, 1.08, 1]);
  const flash = progress > 0.8 ? 1 : progress * 1.2;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      style={{transform: `scale(${scale})`, transformOrigin: 'center'}}
    >
      <path
        d="M26 4 L14 26 H22 L18 44 L34 20 H26 Z"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
        opacity={flash}
      />
    </svg>
  );
};
