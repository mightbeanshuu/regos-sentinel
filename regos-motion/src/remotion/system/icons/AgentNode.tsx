import React from 'react';
import {interpolate} from 'remotion';
import {COLOR_EMERALD_500, COLOR_TEAL_500} from '../colors';
import type {IconMotionProps} from './types';

export const AgentNode: React.FC<IconMotionProps> = ({
  size = 48,
  color = COLOR_TEAL_500,
  progress = 1,
  popped = 1,
}) => {
  const scale = interpolate(popped, [0, 0.7, 1], [0, 1.08, 1]);
  const innerOpacity = Math.max(0, (progress - 0.5) / 0.5);

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
        fill="none"
        stroke={color}
        strokeWidth={2}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
      <circle cx={24} cy={24} r={6} fill={COLOR_EMERALD_500} opacity={innerOpacity} />
    </svg>
  );
};
