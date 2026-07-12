# RegOS Sentinel Remotion Project

This directory contains the code-native films for the RegOS Sentinel SEBI TechSprint concept. The repository-level overview is in [`../README.md`](../README.md).

## Quick start

```bash
npm ci
npm run dev
```

Open `http://localhost:3000` and select a composition.

## Compositions

| ID | Format | Purpose |
| --- | --- | --- |
| `RegOSFinalPitch112` | 1920x1080, 60fps, 112s | Current final pitch film |
| `RegOSIdeaDeck` | 1920x1080, 60fps, 6017 frames | Animated idea deck |
| `RegOSDemoVideo` | 1920x1080, 30fps, 172s | Historical long-form demo storyboard |
| `RegOSVectorGallery` | 1920x1080, 60fps, 5s | Development gallery for native SVG components |

## Commands

```bash
npm run dev            # Remotion Studio
npm run typecheck      # TypeScript validation
npm run build          # Bundle every registered composition
npm run check          # Typecheck and bundle
npm run render:pitch   # Current 112-second H.264 pitch
npm run render:deck    # Idea-deck MP4
npm run render:video   # Historical 172-second demo MP4
```

Generated files are written to `out/` and ignored by Git.

## Structure

```text
src/
  index.ts
  remotion/
    Root.tsx
    pitch/              # Current 112-second composition
      beats/            # One component per narrative beat
      constants.ts      # Timing, palette, copy, and truth labels
      assets.ts         # Optional asset registry and feature flags
    slides/             # Idea-deck slides
    demo/               # Historical long-form demo beats
    system/             # Shared typography, backgrounds, icons, and springs
public/
  assets/
    pitch/              # Optional current-pitch media
```

## Current pitch

`RegOSFinalPitch112` is exactly 6720 frames:

```text
Hook -> Brand -> Ingest -> Compile -> Verify -> Apply -> Reg-Diff -> Prove -> Ask
```

The implementation is code-first. Important UI, diagrams, citations, cursors, and states render without external media. Optional assets are controlled by `src/remotion/pitch/assets.ts`.

## Product-truth rules

- Keep `Prototype visualization` visible.
- Label simulated entities, connectors, metrics, and evidence.
- Do not imply that this repository contains a production compliance engine.
- Do not present targets as measured results.
- Keep human approval visible for material interpretation and applicability decisions.

## Visual system

- Royal blue `#1B3FB8`
- Deep blue `#16349A`
- Off-white `#F4F4F0`
- Teal verification `#2DD4BF`
- Near-black `#070B1A`
- Amber review `#FBBF24`

Use teal only for verified states and amber only for ambiguity, review, or stale evidence.

## Supporting documents

- [`../docs/MOTION_SYSTEM.md`](../docs/MOTION_SYSTEM.md)
- [`../docs/ASSETS.md`](../docs/ASSETS.md)
- [`../docs/VALIDATION.md`](../docs/VALIDATION.md)
- [`../phase1/FINAL_CANVA_AND_REMOTION_PROMPT_PACK.md`](../phase1/FINAL_CANVA_AND_REMOTION_PROMPT_PACK.md)
