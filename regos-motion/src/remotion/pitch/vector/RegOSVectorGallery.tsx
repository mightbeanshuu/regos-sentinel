import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {BLACK, OFFWHITE, SLATE, TEAL, WHITE} from '../constants';
import {FONT_IBM_SANS, FONT_SORA} from '../../system/fonts';
import {SignalFieldSVG} from './SignalFieldSVG';
import {SentinelMarkSVG} from './SentinelMarkSVG';

// ————————————————————————————————————————————————————————————————
// RegOSVectorGallery — development composition. Shows every code-native
// vector component + its animated states on one plane, so components can be
// reviewed in isolation. Does NOT affect the final film's duration.
// ————————————————————————————————————————————————————————————————

export const GALLERY = {
  id: 'RegOSVectorGallery',
  width: 1920,
  height: 1080,
  fps: 60,
  durationInFrames: 300,
} as const;

const Cell: React.FC<{label: string; tone?: 'dark' | 'light'; children: React.ReactNode}> = ({
  label,
  tone = 'dark',
  children,
}) => (
  <div
    style={{
      position: 'relative',
      borderRadius: 14,
      overflow: 'hidden',
      border: `1px solid ${tone === 'dark' ? '#25407A' : '#D8D8CE'}`,
      background: tone === 'dark' ? BLACK : OFFWHITE,
    }}
  >
    {children}
    <div
      style={{
        position: 'absolute',
        left: 14,
        bottom: 12,
        fontFamily: FONT_IBM_SANS,
        fontSize: 13,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: tone === 'dark' ? SLATE : '#5E719C',
      }}
    >
      {label}
    </div>
  </div>
);

export const RegOSVectorGallery: React.FC = () => {
  return (
    <AbsoluteFill style={{background: '#04060F', padding: 56}}>
      <div
        style={{
          fontFamily: FONT_SORA,
          fontWeight: 700,
          fontSize: 30,
          color: WHITE,
          marginBottom: 6,
        }}
      >
        RegOS · Vector Component Gallery
      </div>
      <div style={{fontFamily: FONT_IBM_SANS, fontSize: 15, color: SLATE, marginBottom: 24}}>
        Code-native components — <span style={{color: TEAL}}>deterministic @ 60fps</span>
      </div>
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: 20,
        }}
      >
        <Cell label="SignalFieldSVG · void">
          <SignalFieldSVG tone="dark" variant="void" />
        </Cell>
        <Cell label="SignalFieldSVG · stage">
          <SignalFieldSVG tone="dark" variant="stage" focal={[0.5, 0.2]} />
        </Cell>
        <Cell label="SignalFieldSVG · inspect (light)" tone="light">
          <SignalFieldSVG tone="light" variant="inspect" />
        </Cell>
        <Cell label="SentinelMarkSVG · build">
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
            <Sequence>
              <SentinelMarkSVG size={200} />
            </Sequence>
          </AbsoluteFill>
        </Cell>
        <Cell label="SentinelMarkSVG · built">
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
            <SentinelMarkSVG size={200} built />
          </AbsoluteFill>
        </Cell>
        <Cell label="SentinelMarkSVG · small (persistent-logo scale)">
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
            <SentinelMarkSVG size={72} built />
          </AbsoluteFill>
        </Cell>
      </div>
    </AbsoluteFill>
  );
};
