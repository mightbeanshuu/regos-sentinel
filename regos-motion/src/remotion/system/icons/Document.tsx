import React from 'react';
import {interpolate} from 'remotion';
import {COLOR_TEAL_400} from '../colors';
import type {IconMotionProps} from './types';

export const Document: React.FC<IconMotionProps> = ({
  size = 48,
  color = COLOR_TEAL_400,
  progress = 1,
  popped = 1,
}) => {
  const scale = interpolate(popped, [0, 0.7, 1], [0, 1.08, 1]);
  const lineProgress = Math.max(0, (progress - 0.5) / 0.5);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      style={{transform: `scale(${scale})`, transformOrigin: 'center'}}
    >
      <path
        d="M10 6 H28 L38 16 V42 H10 Z"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
      <path
        d="M28 6 V16 H38"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        opacity={progress > 0.4 ? 1 : 0}
      />
      {[20, 26, 32].map((y, i) => (
        <line
          key={y}
          x1={16}
          y1={y}
          x2={32}
          y2={y}
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={lineProgress}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - Math.min(1, lineProgress * 3 - i)}
        />
      ))}
    </svg>
  );
};
