# Motion System

## Goal

The motion language should explain causality rather than decorate the pitch:

```text
source event -> interpreted field -> human decision -> operational impact -> proof
```

## Composition

`RegOSFinalPitch112` is 1920x1080, 60fps, and exactly 6720 frames. Beat boundaries live in `regos-motion/src/remotion/pitch/constants.ts`.

## Timing tokens

| Motion | Typical duration at 60fps |
| --- | ---: |
| Micro interaction | 8-12 frames |
| UI entrance | 14-20 frames |
| Major entrance | 24-36 frames |
| Camera inspection | 30-48 frames |
| Word replacement | 16-24 frames |
| Card stagger | 4-7 frames |
| Transition overlap | 8-16 frames |

## Physics

- Entrances use one restrained 2-4% overshoot.
- Resting UI is stable; jitter is limited to 2-4 transition frames.
- Cursor movement starts before a camera push-in, normally by 4-6 frames.
- Camera translation and scale target the selected control rather than the viewport center.
- Readable content is not left blurred, tilted, or in motion.

## Scene grammar

| Product action | Motion expression |
| --- | --- |
| Coverage | Sequential clause illumination and resolving counter |
| Compilation | Source fragments snap into a stable obligation schema |
| Verification | Cursor-led push-in, focus mask, blocked state, human settle |
| Applicability | Branching decision tree followed by receipt seal |
| Amendment | Split comparison and dependency-line propagation |
| Proof | Audit events align and compress into a build manifest |

## SVG rules

- Use native React SVG for diagrams and important state changes.
- Animate meaningful subparts with path length, masks, clipping, opacity, and transforms.
- Use unique IDs for SVG filters and clip paths.
- Keep stroke widths stable during camera scaling.
- Use familiar icon-library symbols for standard actions and custom geometry for RegOS-specific diagrams.

## Visual tokens

- `#1B3FB8`: royal blue, active structure
- `#16349A`: deep blue, secondary structure
- `#F4F4F0`: off-white, inspection surfaces
- `#2DD4BF`: verified state
- `#070B1A`: cinematic stage
- `#FBBF24`: ambiguity, review, stale evidence

Do not use purple, rainbow gradients, persistent neon, decorative blobs, or continuous shaking.

## Verification

For every affected beat:

1. inspect the first active frame;
2. inspect the transition midpoint;
3. inspect the resting frame;
4. verify text at 1920x1080;
5. verify no element changes surrounding layout dimensions;
6. verify the state change remains understandable without narration.
