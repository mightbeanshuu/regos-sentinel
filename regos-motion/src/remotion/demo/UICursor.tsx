import React from 'react';
import {COLOR_TEAL_400, COLOR_WHITE} from '../system/colors';

export const UICursor: React.FC<{x: number; y: number; clicking?: boolean}> = ({
  x,
  y,
  clicking = false,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: 20,
      height: 20,
      pointerEvents: 'none',
      zIndex: 100,
    }}
  >
    <svg width={20} height={20} viewBox="0 0 20 20">
      <path
        d="M4 4 L4 16 L8 12 L11 17 L13 16 L10 11 L16 11 Z"
        fill={COLOR_WHITE}
        stroke="#000"
        strokeWidth={0.5}
      />
    </svg>
    {clicking && (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: `2px solid ${COLOR_TEAL_400}`,
        }}
      />
    )}
  </div>
);
