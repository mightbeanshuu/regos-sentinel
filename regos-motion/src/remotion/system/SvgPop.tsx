import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLOR_TEAL_400} from './colors';
import {springPop} from './springs';

type SvgPopProps = {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  /** Soft teal halo so pops read on navy */
  glow?: boolean;
};

export const SvgPop: React.FC<SvgPopProps> = ({
  children,
  delay = 0,
  style,
  glow = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);
  const p = springPop(localFrame, fps);
  const scale = interpolate(p, [0, 0.65, 1], [0, 1.18, 1]);
  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(glow
          ? {
              background: `radial-gradient(circle, ${COLOR_TEAL_400}55 0%, ${COLOR_TEAL_400}22 45%, transparent 72%)`,
              boxShadow: `0 0 ${28 * opacity}px ${10 * opacity}px ${COLOR_TEAL_400}44`,
              borderRadius: '50%',
              padding: 12,
            }
          : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
};
