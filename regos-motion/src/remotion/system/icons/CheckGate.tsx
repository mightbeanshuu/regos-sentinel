import React from 'react';
import {interpolate} from 'remotion';
import {COLOR_EMERALD_500, COLOR_TEAL_500} from '../colors';
import type {IconMotionProps} from './types';

export const CheckGate: React.FC<IconMotionProps> = ({
  size = 48,
  color = COLOR_TEAL_500,
  progress = 1,
  popped = 1,
}) => {
  const scale = interpolate(popped, [0, 0.7, 1], [0, 1.08, 1]);
  const ringProgress = Math.min(1, progress / 0.6);
  const checkProgress = Math.max(0, (progress - 0.6) / 0.4);
  const fillOpacity = checkProgress > 0.8 ? 0.15 : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      style={{transform: `scale(${scale})`, transformOrigin: 'center'}}
    >
      <circle
        cx={24}
        cy={24}
        r={18}
        fill={COLOR_EMERALD_500}
        fillOpacity={fillOpacity}
        stroke={color}
        strokeWidth={2}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - ringProgress}
      />
      <path
        d="M14 24 L20 30 L34 16"
        fill="none"
        stroke={COLOR_EMERALD_500}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - checkProgress}
      />
    </svg>
  );
};
