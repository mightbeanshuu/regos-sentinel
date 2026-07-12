import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {COLOR_NAVY_700, COLOR_NAVY_800} from './colors';
import {springSoft} from './springs';

type GlassPanelProps = {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
};

export const GlassPanel: React.FC<GlassPanelProps> = ({children, delay = 0, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = springSoft(Math.max(0, frame - delay), fps);

  return (
    <div
      style={{
        background: `${COLOR_NAVY_800}8c`,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${COLOR_NAVY_700}`,
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(6,16,31,0.45)',
        opacity: enter,
        transform: `translateY(${(1 - enter) * 16}px) scale(${0.96 + enter * 0.04})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
