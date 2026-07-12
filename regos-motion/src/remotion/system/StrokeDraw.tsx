import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {spring} from 'remotion';
import {SPRING_DRAW} from './springs';

type StrokeDrawProps = {
  d: string;
  delay?: number;
  color: string;
  width?: number;
  durationHint?: number;
  opacity?: number;
};

export const StrokeDraw: React.FC<StrokeDrawProps> = ({
  d,
  delay = 0,
  color,
  width = 2,
  durationHint = 20,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: SPRING_DRAW,
    durationInFrames: durationHint,
  });

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - p}
      opacity={opacity}
    />
  );
};
