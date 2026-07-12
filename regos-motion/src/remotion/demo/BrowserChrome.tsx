import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {
  COLOR_NAVY_700,
  COLOR_NAVY_800,
  COLOR_NAVY_900,
  COLOR_SLATE_400,
} from '../system/colors';
import {FONT_IBM_SANS} from '../system/fonts';
import {springUI} from '../system/springs';

export const BrowserChrome: React.FC<{
  url: string;
  children: React.ReactNode;
  slideUp?: boolean;
  widthPct?: number;
  maxWidth?: number;
}> = ({url, children, slideUp = true, widthPct = 90, maxWidth = 1400}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = slideUp ? springUI(frame, fps) : 1;

  return (
    <div
      style={{
        width: `${widthPct}%`,
        maxWidth,
        margin: '0 auto',
        opacity: enter,
        transform: `translateY(${(1 - enter) * 40}px)`,
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${COLOR_NAVY_700}`,
        boxShadow: '0 8px 32px rgba(6,16,31,0.45)',
      }}
    >
      <div
        style={{
          background: COLOR_NAVY_900,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{display: 'flex', gap: 6}}>
          {['#F43F5E', '#FBBF24', '#10B981'].map((c) => (
            <div key={c} style={{width: 10, height: 10, borderRadius: '50%', background: c}} />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            background: COLOR_NAVY_800,
            borderRadius: 6,
            padding: '6px 12px',
            fontFamily: FONT_IBM_SANS,
            fontSize: 13,
            color: COLOR_SLATE_400,
          }}
        >
          {url}
        </div>
      </div>
      <div style={{background: COLOR_NAVY_900, minHeight: 500}}>{children}</div>
    </div>
  );
};
