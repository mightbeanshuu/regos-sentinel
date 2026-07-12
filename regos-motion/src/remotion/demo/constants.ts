export const DEMO_VIDEO = {
  id: 'RegOSDemoVideo',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 5160,
  safeCap: 5400,
} as const;

export const BEAT_DURATIONS = {
  Beat1_ProblemHook: 360,
  Beat2_BrandAgents: 300,
  Beat3_EntitySetup: 420,
  Beat4_SourceCitation: 900,
  Beat5_WorkflowEvidence: 780,
  Beat6_ImpactSimulator: 1140,
  Beat7_AuditSupTech: 750,
  Beat8_MetricsSandboxAsk: 510,
} as const;

export const METRIC_HUD = {
  docs: {start: 0, end: 4},
  obligations: {start: 0, end: 127},
  citation: '100%',
  timeToPlan: '2:14',
} as const;

export const ENTITY = {
  name: 'Aarohan Securities',
  type: 'Small-size RE',
  url: 'app.regos.sentinel/cockpit',
} as const;

export const CORPUS = ['CSCRF', 'Stock Broker MC'] as const;

export const CLIMAX_CIRCULAR =
  'CSCRF Amendment — Incident Reporting SLA (simulated)';

export const IMPACT_DIFFS = [
  '+12 obligations added',
  '7 changed',
  '4 controls impacted',
  'CISO + Ops owners',
  '9 new tasks',
  'Evidence reqs updated',
] as const;
