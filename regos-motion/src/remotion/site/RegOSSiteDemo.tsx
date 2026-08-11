import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import timing from '../../../script/timing.json';
import {AskBeat} from './AskBeat';
import {AssistantsBeat} from './AssistantsBeat';
import {Captions} from './Captions';
import {ClipBeat} from './ClipBeat';
import {FixStoryBeat} from './FixStoryBeat';
import {ModelBeat} from './ModelBeat';
import {PipelineBeat} from './PipelineBeat';
import {TitleBeat} from './TitleBeat';
import {BG, BRAND, LINE} from './tokens';

export const SITE_DEMO = {
  id: 'RegOSSiteDemo',
  width: 1920,
  height: 1080,
  fps: timing.fps,
  durationInFrames: timing.totalFrames,
} as const;

/** A hairline progress bar. The only element that runs the whole film. */
const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const pct = interpolate(frame, [0, timing.totalFrames], [0, 1], {
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 3,
        backgroundColor: LINE,
      }}
    >
      <div
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          backgroundColor: BRAND,
        }}
      />
    </div>
  );
};

/**
 * RegOS Sentinel — the product film.
 *
 * Structure is data, not markup: every beat's length comes from `timing.json`,
 * which is generated from the measured duration of the narration audio. Nothing
 * in this file hard-codes a frame count, so re-recording the voice with a
 * different script or rate re-times the entire film with no edits here — and
 * captions cannot drift out of sync with the voice, because both are driven by
 * the same measurement.
 *
 * The build step refuses to emit `timing.json` at all if any beat would outlast
 * the clip it plays, so a beat can never run past its footage into black.
 */
export const RegOSSiteDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      {timing.beats.map((beat) => (
        <Sequence
          key={beat.id}
          from={beat.startFrame}
          durationInFrames={beat.durationFrames}
          name={beat.id}
        >
          {beat.kind === 'clip' && beat.clip ? (
            <ClipBeat
              clip={beat.clip}
              clipStart={beat.clipStart}
              label={beat.label}
              durationInFrames={beat.durationFrames}
            />
          ) : beat.kind === 'pipeline' ? (
            <PipelineBeat durationInFrames={beat.durationFrames} />
          ) : beat.kind === 'fixstory' ? (
            <FixStoryBeat durationInFrames={beat.durationFrames} lines={beat.lines} />
          ) : beat.kind === 'ask' ? (
            <AskBeat durationInFrames={beat.durationFrames} lines={beat.lines} />
          ) : beat.kind === 'model' ? (
            <ModelBeat durationInFrames={beat.durationFrames} lines={beat.lines} />
          ) : beat.kind === 'assistants' ? (
            <AssistantsBeat durationInFrames={beat.durationFrames} lines={beat.lines} />
          ) : (
            <TitleBeat
              variant={beat.id === 'hook' ? 'hook' : 'close'}
              durationInFrames={beat.durationFrames}
              lines={beat.lines}
            />
          )}

          {/* The voice: one file per sentence, each at its measured offset. */}
          {beat.lines.map((line) => (
            <Sequence
              key={line.src}
              from={line.startFrame}
              durationInFrames={line.durationFrames}
              name={line.text.slice(0, 28)}
            >
              <Audio src={staticFile(line.src)} />
            </Sequence>
          ))}

          {/* Captions sit outside the product rig so they stay sharp and level.
              A beat whose own artwork already carries the words opts out. */}
          {beat.captions === false ? null : <Captions lines={beat.lines} />}
        </Sequence>
      ))}

      <Progress />
    </AbsoluteFill>
  );
};
