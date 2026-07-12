import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {
  COLOR_GRID,
  COLOR_NAVY_800,
  COLOR_NAVY_950,
  COLOR_TEAL_400,
} from './colors';
import {FluidBlob} from './FluidBlob';
import {FluidSmokeWave} from './FluidSmokeWave';
import {GrainOverlay} from './GrainOverlay';

export type AtmosphereLevel = 'hero' | 'calm' | 'climax' | 'none';

const ATMOSPHERE_INTENSITY: Record<AtmosphereLevel, number> = {
  hero: 1,
  calm: 0.55,
  climax: 0.85,
  none: 0,
};

const BLOB_MAX_OPACITY: Record<AtmosphereLevel, number> = {
  hero: 0.5,
  calm: 0.35,
  climax: 0.5,
  none: 0,
};

export const RegOSBackground: React.FC<{
  showGrid?: boolean;
  showHairline?: boolean;
  atmosphere?: AtmosphereLevel;
}> = ({showGrid = true, showHairline = true, atmosphere = 'none'}) => {
  const frame = useCurrentFrame();
  const intensity = ATMOSPHERE_INTENSITY[atmosphere];
  const blobMaxOpacity = BLOB_MAX_OPACITY[atmosphere];
  const gridOpacity = interpolate(
    frame % 120,
    [0, 60, 120],
    [0.04, atmosphere === 'none' ? 0.08 : 0.07, 0.04],
  );

  return (
    <AbsoluteFill
      style={{
        background: COLOR_NAVY_950,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 85% 15%, ${COLOR_NAVY_800}55 0%, transparent 70%)`,
        }}
      />
      {intensity > 0 && (
        <>
          {(atmosphere === 'hero' || atmosphere === 'climax') && (
            <>
              <FluidSmokeWave
                intensity={intensity}
                waveIndex={0}
                verticalBias={0.52}
                phaseOffset={0}
              />
              <FluidSmokeWave
                intensity={intensity * 0.9}
                waveIndex={1}
                verticalBias={0.36}
                phaseOffset={1.65}
                amplitudeScale={0.88}
              />
            </>
          )}
          <FluidBlob
            variant="orb"
            intensity={intensity}
            maxOpacity={blobMaxOpacity}
            index={0}
          />
          <FluidBlob
            variant="smoke"
            intensity={intensity * 0.8}
            maxOpacity={blobMaxOpacity}
            index={1}
          />
          {(atmosphere === 'hero' || atmosphere === 'climax') && (
            <FluidBlob
              variant="bloom"
              intensity={intensity * 0.6}
              maxOpacity={blobMaxOpacity}
              index={2}
            />
          )}
          <GrainOverlay />
        </>
      )}
      {showGrid && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: gridOpacity / 0.08,
            backgroundImage: `
              linear-gradient(${COLOR_GRID} 1px, transparent 1px),
              linear-gradient(90deg, ${COLOR_GRID} 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        />
      )}
      {showHairline && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            height: 1,
            width: interpolate(frame, [0, 30], [0, 1920], {
              extrapolateRight: 'clamp',
            }),
            background: `linear-gradient(90deg, transparent, ${COLOR_TEAL_400}14, transparent)`,
            transform: 'translateY(-50%)',
          }}
        />
      )}
    </AbsoluteFill>
  );
};
