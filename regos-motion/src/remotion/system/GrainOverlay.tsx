import React from 'react';
import {useCurrentFrame} from 'remotion';

export const GrainOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const offset = (frame % 8) * 0.5;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.035,
        pointerEvents: 'none',
        mixBlendMode: 'overlay',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '256px 256px',
        backgroundPosition: `${offset}px ${offset}px`,
      }}
    />
  );
};
