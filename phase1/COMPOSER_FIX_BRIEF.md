# Composer Brief — Fix clarity + Canva fluid + VISIBLE SVG pops

Date: 2026-07-10  
Status: **Blank canvas ROOT CAUSE FIXED** — `IdeaDeck.tsx` had `<TransitionSeries from={-1384}>` (Studio scrub artifact). Removed. Do NOT reintroduce `from={negative}`.

## Verdict so far (is it bad / unclear?)
- **Broken preview:** was BAD (checkerboard) — fixed.
- **Motion:** pops exist (`SvgPop`, icons) but often too subtle / late / small — judges may miss them → treat as **UNCLEAR until amplified**.
- **Canva:** inspired by Technology Startup fluid waves — NOT a Canva file. Fluid blobs exist but opacity ~0.22 — may look “flat navy” not “Canva fluid.”
- **Fonts:** Sora + IBM Plex — acceptable; web consensus for fintech trust leans **Inter or IBM Plex Sans** for body, geometric display for H1. Await `FONT_AND_CLARITY_AUDIT.md` from Grok before switching.

## Deep web findings to apply

### Remotion
- TransitionSeries sequences need **opaque AbsoluteFill backgrounds** or fade/wipe shows checkerboard/white lines (remotion#3178).
- Never leave composition root without navy fill.
- Checkerboard button (T) in Studio shows transparency — if user sees checkerboard mid-slide, either transparency toggle ON or background missing during transition overlap.

### Typography (fintech / SaaS)
- Prefer single family with wide weights: Inter / IBM Plex Sans / DM Sans.
- Heavy weights for numbers; avoid ultra-thin.
- High contrast off-white on charcoal/navy.
- Headlines short; one idea per slide.

### Canva Technology Startup → Remotion
- Dark field + overlapping organic fluid waves (cyan/teal).
- Huge white sans headline.
- Motion: slow fluid drift in BG + sharp spring pops in FG icons/cards.

## Required implementation (Composer agents)

### Agent A — Canvas safety + transition opacity
1. Wrap `RegOSIdeaDeck` in outer `<AbsoluteFill style={{background: COLOR_NAVY_950}}>` so transitions never show checkerboard.
2. Same for `RegOSDemoVideo` if needed.
3. Grep for `from={-` and delete any Studio artifacts.
4. Ensure every slide root AbsoluteFill has RegOSBackground (already mostly true).

### Agent B — VISIBLE SVG popping (this is what user asked for)
1. Amplify `SvgPop`: overshoot to 1.18, settle 1.0; delay default 0; opacity 0→1 in ≤8 frames.
2. On EVERY slide enter (frame 0–12): at least one icon pops (Shield/Document/AgentNode/etc.) at ≥64px.
3. S05: AgentNode cascade pop every 6f + StrokeDraw connectors.
4. S06: CitationLink draw clearly visible (stroke width ≥3).
5. S07: ImpactLightning pop at weeks→minutes beat — BIG.
6. S01: Shield stroke-draw then pop fill in first 20f.
7. Add subtle teal glow behind popped icons so they read on navy.

### Agent C — Canva-level fluid atmosphere
1. Raise FluidBlob opacity (calm 0.35, hero/climax 0.5) — still tasteful.
2. Add 2–3 overlapping wave ribbons (FluidSmokeWave) on hero/climax like Canva Technology Startup.
3. Keep grain ≤4%.
4. No purple.

### DO NOT render MP4 yet (user request).

## Success criteria
- Jump to frame 0: navy + fluid + logo pop visible (not checkerboard).
- Each slide first 0.4s: obvious SVG pop.
- `npx tsc --noEmit` passes.
- No `from={negative}` in source.
