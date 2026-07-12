// === RegOS Sentinel — Final Pitch Film (112s @ 60fps) ===
// Locked visual system (FINAL_CANVA_AND_REMOTION_PROMPT_PACK.md §2)

export const PITCH = {
  id: 'RegOSFinalPitch112',
  width: 1920,
  height: 1080,
  fps: 60,
  durationInFrames: 6720, // exactly 112s
} as const;

// Locked palette — exact hex only
export const ROYAL = '#1B3FB8';
export const DEEP = '#16349A';
export const OFFWHITE = '#F4F4F0';
export const TEAL = '#2DD4BF';
export const BLACK = '#070B1A';
export const WHITE = '#FFFFFF';

// Supporting neutrals derived from the palette (for readable dark UI panels
// on the royal-blue stage — kept inside the blue family, no foreign hues).
export const NAVY_PANEL = '#0C1A3A';
export const NAVY_PANEL_2 = '#12234A';
export const NAVY_LINE = '#25407A';
export const SLATE = '#93A4C8';
export const SLATE_DIM = '#5E719C';

// Semantic states (per §2 discipline: teal = verified, amber = ambiguity/stale)
export const VERIFIED = TEAL;
export const EMERALD = '#34D399'; // confidence / pass (green-teal, stays in family)
export const AMBIGUOUS = '#FBBF24'; // amber
export const STALE = '#FBBF24';
export const INK = '#0B1220'; // dark text on off-white inspection field

// Beat durations @ 60fps — sum MUST equal PITCH.durationInFrames (6720)
export const BEATS = {
  hook: 420, // 00:00–00:07  Problem
  brand: 420, // 00:07–00:14  Compliance Twin
  ingest: 780, // 00:14–00:27  Coverage Ledger
  compile: 960, // 00:27–00:43  Clause-cited obligations
  verify: 1200, // 00:43–01:03  Inspector Mode (controlled failure)
  apply: 840, // 01:03–01:17  Applicability Receipt
  regdiff: 1080, // 01:17–01:35  Reg-Diff + Evidence Connector
  prove: 660, // 01:35–01:46  Build Manifest
  ask: 360, // 01:46–01:52  Controlled pilot ask
} as const;

// Absolute start frames, derived from BEATS (kept explicit for Sequence `from`).
export const START = {
  hook: 0,
  brand: 420,
  ingest: 840,
  compile: 1620,
  verify: 2580,
  apply: 3780,
  regdiff: 4620,
  prove: 5700,
  ask: 6360,
} as const;

// Narrative entity / corpus (real public SEBI source families; labelled in-frame).
export const ENTITY = {
  name: 'Aarohan Securities Pvt. Ltd.',
  short: 'Aarohan Securities',
  tier: 'Small-size Stock Broker',
  url: 'app.regos.sentinel',
} as const;

export const SOURCE = {
  title: 'Cyber Security & Cyber Resilience Framework',
  short: 'SEBI CSCRF',
  version: 'Aug 2024',
  label: 'Public SEBI source',
} as const;

// Plain-language captions (lower-third) — one per beat so any viewer instantly
// understands what RegOS does. Mirrors the §36 presenter script.
export const CAPTIONS = {
  hook: 'SEBI publishes rules as text. Brokers must run them as work.',
  brand: 'RegOS Sentinel turns regulatory text into operational action.',
  ingest: 'It reads an official SEBI circular and accounts for every clause — nothing silently skipped.',
  compile: 'Each clause becomes a structured obligation, grounded to its exact source text.',
  verify: 'When the AI is unsure, it stops. A human inspects the source and approves.',
  apply: 'RegOS checks which duties apply to THIS broker — and proves why, even for the ones excluded.',
  regdiff: 'When SEBI amends the rule, RegOS shows what changed and which evidence just went stale.',
  prove: 'Every approved release is reproducible — ready for a SEBI sandbox test.',
  ask: 'Our ask: one public corpus, one profile, one controlled 90-day pilot.',
} as const;

export const TAGLINE = 'Every obligation. Cited, owned, evidenced.';
export const TRUTH_LABEL = 'Prototype visualization';
