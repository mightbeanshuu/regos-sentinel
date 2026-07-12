import React from 'react';
import {AbsoluteFill} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {wipe} from '@remotion/transitions/wipe';
import {
  COLOR_NAVY_950,
  FADE_TRANSITION_FRAMES,
  WIPE_TRANSITION_FRAMES,
} from './system/colors';
import {S00_Sting} from './slides/S00_Sting';
import {S01_Title} from './slides/S01_Title';
import {S02_Problem} from './slides/S02_Problem';
import {S03_Contrast} from './slides/S03_Contrast';
import {S04_Solution} from './slides/S04_Solution';
import {S05_Agents} from './slides/S05_Agents';
import {S06_Trust} from './slides/S06_Trust';
import {S07_Impact} from './slides/S07_Impact';
import {S08_Proof} from './slides/S08_Proof';
import {S09_SebiValue} from './slides/S09_SebiValue';
import {S10_Ask} from './slides/S10_Ask';

export const IDEA_DECK = {
  id: 'RegOSIdeaDeck',
  width: 1920,
  height: 1080,
  fps: 60,
} as const;

const SLIDE_DURATIONS = {
  S00: 200,
  S01: 420,
  S02: 540,
  S03: 720,
  S04: 480,
  S05: 720,
  S06: 600,
  S07: 840,
  S08: 540,
  S09: 540,
  S10: 540,
} as const;

const FADE = (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({durationInFrames: FADE_TRANSITION_FRAMES})}
  />
);

const WIPE_IN_CLIMAX = (
  <TransitionSeries.Transition
    presentation={wipe({direction: 'from-left'})}
    timing={linearTiming({durationInFrames: WIPE_TRANSITION_FRAMES})}
  />
);

export const calculateIdeaDeckDuration = (): number => {
  const slides = Object.values(SLIDE_DURATIONS).reduce((a, b) => a + b, 0);
  const transitions =
    FADE_TRANSITION_FRAMES * 9 + WIPE_TRANSITION_FRAMES;
  return slides - transitions;
};

export const RegOSIdeaDeck: React.FC = () => {
  return (
    <AbsoluteFill style={{background: COLOR_NAVY_950}}>
      <TransitionSeries from={-606}>
        <TransitionSeries.Sequence durationInFrames={SLIDE_DURATIONS.S00}>
          <S00_Sting />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={SLIDE_DURATIONS.S01}>
          <S01_Title />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={SLIDE_DURATIONS.S02}>
          <S02_Problem />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={SLIDE_DURATIONS.S03}>
          <S03_Contrast />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={SLIDE_DURATIONS.S04}>
          <S04_Solution />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={SLIDE_DURATIONS.S05}>
          <S05_Agents />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={SLIDE_DURATIONS.S06}>
          <S06_Trust />
        </TransitionSeries.Sequence>
        {WIPE_IN_CLIMAX}
        <TransitionSeries.Sequence durationInFrames={SLIDE_DURATIONS.S07}>
          <S07_Impact />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={SLIDE_DURATIONS.S08}>
          <S08_Proof />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={SLIDE_DURATIONS.S09}>
          <S09_SebiValue />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={SLIDE_DURATIONS.S10}>
          <S10_Ask />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
