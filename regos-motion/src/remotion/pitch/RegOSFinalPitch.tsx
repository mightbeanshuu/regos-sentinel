import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {BEATS, BLACK, START, TEAL} from './constants';
import {PersistentLogo, TruthLabel} from './shared';
import {B1_Hook} from './beats/B1_Hook';
import {B2_Brand} from './beats/B2_Brand';
import {B3_Ingest} from './beats/B3_Ingest';
import {B4_Compile} from './beats/B4_Compile';
import {B5_Verify} from './beats/B5_Verify';
import {B6_Apply} from './beats/B6_Apply';
import {B7_RegDiff} from './beats/B7_RegDiff';
import {B8_Prove} from './beats/B8_Prove';
import {B9_Ask} from './beats/B9_Ask';

// Thin teal velocity sweep at each world-change boundary (per motion brief:
// transitions carry velocity, resting frames are stable — never a plain crossfade).
const BoundarySweep: React.FC = () => {
  const frame = useCurrentFrame();
  const boundaries = [START.brand, START.ingest, START.compile, START.verify, START.apply, START.regdiff, START.prove, START.ask];
  return (
    <>
      {boundaries.map((b) => {
        const local = frame - b;
        if (local < 0 || local > 12) return null;
        const x = interpolate(local, [0, 12], [-15, 115]);
        const op = interpolate(local, [0, 3, 9, 12], [0, 0.5, 0.5, 0]);
        return (
          <div
            key={b}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${x}%`,
              width: '8%',
              background: `linear-gradient(90deg, transparent, ${TEAL}, transparent)`,
              opacity: op,
              zIndex: 80,
              pointerEvents: 'none',
              filter: 'blur(2px)',
            }}
          />
        );
      })}
    </>
  );
};

export const RegOSFinalPitch: React.FC = () => {
  const frame = useCurrentFrame();

  // off-white world only during Verify
  const darkTone = frame >= START.verify && frame < START.apply;
  const tone = darkTone ? 'dark' : 'light';

  // brand mark shown once product beats begin, hidden on hook/brand/ask
  const showLogo = frame >= START.ingest && frame < START.ask;

  return (
    <AbsoluteFill style={{background: BLACK}}>
      <Sequence from={START.hook} durationInFrames={BEATS.hook}>
        <B1_Hook />
      </Sequence>
      <Sequence from={START.brand} durationInFrames={BEATS.brand}>
        <B2_Brand />
      </Sequence>
      <Sequence from={START.ingest} durationInFrames={BEATS.ingest}>
        <B3_Ingest />
      </Sequence>
      <Sequence from={START.compile} durationInFrames={BEATS.compile}>
        <B4_Compile />
      </Sequence>
      <Sequence from={START.verify} durationInFrames={BEATS.verify}>
        <B5_Verify />
      </Sequence>
      <Sequence from={START.apply} durationInFrames={BEATS.apply}>
        <B6_Apply />
      </Sequence>
      <Sequence from={START.regdiff} durationInFrames={BEATS.regdiff}>
        <B7_RegDiff />
      </Sequence>
      <Sequence from={START.prove} durationInFrames={BEATS.prove}>
        <B8_Prove />
      </Sequence>
      <Sequence from={START.ask} durationInFrames={BEATS.ask}>
        <B9_Ask />
      </Sequence>

      {/* Persistent overlays on the absolute timeline */}
      {showLogo && <PersistentLogo tone={tone} />}
      <TruthLabel tone={tone} />
      <BoundarySweep />
    </AbsoluteFill>
  );
};
