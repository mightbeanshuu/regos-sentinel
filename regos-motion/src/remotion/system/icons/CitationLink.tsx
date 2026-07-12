import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLOR_TEAL_400, COLOR_TEAL_500} from '../colors';
import type {IconMotionProps} from './types';

type CitationLinkProps = IconMotionProps & {
  width?: number;
  height?: number;
  showDot?: boolean;
  strokeWidth?: number;
};

export const CitationLink: React.FC<CitationLinkProps> = ({
  width = 80,
  height = 120,
  color = COLOR_TEAL_500,
  progress = 1,
  popped = 1,
  showDot = true,
  strokeWidth = 3,
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(popped, [0, 0.65, 1], [0, 1.18, 1]);
  const d = 'M 4 60 L 40 60 L 40 20 L 76 20';
  const dotT = Math.min(1, Math.max(0, (progress - 0.3) / 0.7));
  const dotX = interpolate(dotT, [0, 1], [4, 76]);
  const dotY = interpolate(dotT, [0, 0.5, 1], [60, 60, 20]);
  const dotOpacity = progress > 0.85 ? interpolate(frame % 20, [0, 10, 20], [1, 0.5, 1]) : 0;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 80 80"
      fill="none"
      style={{transform: `scale(${scale})`, transformOrigin: 'center'}}
    >
      <path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
      <circle cx={4} cy={60} r={4} fill={COLOR_TEAL_400} opacity={progress > 0 ? 1 : 0} />
      <circle cx={76} cy={20} r={4} fill={COLOR_TEAL_400} opacity={progress > 0.9 ? 1 : 0} />
      {showDot && progress > 0.3 && (
        <circle cx={dotX} cy={dotY} r={3} fill={COLOR_TEAL_400} opacity={dotOpacity} />
      )}
    </svg>
  );
};
