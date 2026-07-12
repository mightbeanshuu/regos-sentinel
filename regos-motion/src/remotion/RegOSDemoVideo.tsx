import React from 'react';
import {AbsoluteFill} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {Beat1_ProblemHook} from './demo/Beat1_ProblemHook';
import {Beat2_BrandAgents} from './demo/Beat2_BrandAgents';
import {Beat3_EntitySetup} from './demo/Beat3_EntitySetup';
import {Beat4_SourceCitation} from './demo/Beat4_SourceCitation';
import {Beat5_WorkflowEvidence} from './demo/Beat5_WorkflowEvidence';
import {Beat7_AuditSupTech} from './demo/Beat7_AuditSupTech';
import {Beat8_MetricsSandboxAsk} from './demo/Beat8_MetricsAsk';
import {Beat6_ImpactSimulator} from './demo/Beat6_ImpactSimulator';
import {BEAT_DURATIONS, DEMO_VIDEO} from './demo/constants';
import {MetricHUD, TrustDisclaimer} from './demo/overlays';
import {COLOR_NAVY_950} from './system/colors';

export {DEMO_VIDEO};

const TRANSITION_FRAMES = 15;

const FADE = (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({durationInFrames: TRANSITION_FRAMES})}
  />
);

export const RegOSDemoVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{background: COLOR_NAVY_950}}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={BEAT_DURATIONS.Beat1_ProblemHook}>
          <Beat1_ProblemHook />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={BEAT_DURATIONS.Beat2_BrandAgents}>
          <Beat2_BrandAgents />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={BEAT_DURATIONS.Beat3_EntitySetup}>
          <Beat3_EntitySetup />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={BEAT_DURATIONS.Beat4_SourceCitation}>
          <Beat4_SourceCitation />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={BEAT_DURATIONS.Beat5_WorkflowEvidence}>
          <Beat5_WorkflowEvidence />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={BEAT_DURATIONS.Beat6_ImpactSimulator}>
          <Beat6_ImpactSimulator />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={BEAT_DURATIONS.Beat7_AuditSupTech}>
          <Beat7_AuditSupTech />
        </TransitionSeries.Sequence>
        {FADE}
        <TransitionSeries.Sequence durationInFrames={BEAT_DURATIONS.Beat8_MetricsSandboxAsk}>
          <Beat8_MetricsSandboxAsk />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <MetricHUD />
      <TrustDisclaimer />
    </AbsoluteFill>
  );
};
