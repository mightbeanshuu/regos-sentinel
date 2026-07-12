# RegOS Sentinel

**RegOS Sentinel** is a human-supervised agentic compliance concept for the SEBI Securities Market TechSprint 2026, Problem Statement 2: **Agentic Compliance - From Regulatory Text to Operational Action**.

The project explores how a regulated intermediary could transform regulatory text into clause-cited, applicability-aware operational obligations and maintain the resulting owners, controls, evidence, amendments, and approvals in a living **Compliance Twin**.

> [!IMPORTANT]
> This repository currently contains the product specification, research package, pitch deck, and code-native Remotion films. It is a prototype visualization and design system, not a deployed compliance engine, legal opinion, autonomous filing system, or production integration.

## Product in one minute

When a regulator publishes or amends a circular, an intermediary must determine what applies, assign ownership, establish deadlines and controls, collect evidence, and preserve an audit trail. RegOS organizes that work into six stages:

```text
INGEST -> COMPILE -> VERIFY -> APPLY -> DIFF -> PROVE
```

| Stage | Purpose | Primary artifact |
| --- | --- | --- |
| Ingest | Register and classify the official source | Regulatory Coverage Ledger |
| Compile | Convert clauses into structured obligations | Clause-cited obligation |
| Verify | Expose uncertainty and require review | Inspector Mode decision |
| Apply | Determine entity-specific applicability | Applicability Receipt |
| Diff | Propagate an amendment through active work | Reg-Diff impact map |
| Prove | Reproduce the approved compliance release | Compliance Build Manifest |

## Repository contents

```text
.
├── regos-motion/       # Remotion 4 application: final pitch, idea deck, demo film
├── phase1/             # Prompt pack, storyboards, research, and submission planning
├── docs/               # Curated architecture, motion system, roadmap, and asset guidance
├── .github/            # CI, Dependabot, templates, and ownership rules
├── PRODUCT.md          # Canonical product definition
├── SUBMISSION_PACKAGE.md
└── README.md
```

The root contains working and historical research notes. Start with the curated documents below rather than reading files alphabetically.

## Start here

1. [Product scope](docs/PRODUCT_SCOPE.md)
2. [System architecture](docs/ARCHITECTURE.md)
3. [Motion system](docs/MOTION_SYSTEM.md)
4. [Assets and provenance](docs/ASSETS.md)
5. [Validation and claim discipline](docs/VALIDATION.md)
6. [Roadmap](docs/ROADMAP.md)
7. [Final prompt and strategy pack](phase1/FINAL_CANVA_AND_REMOTION_PROMPT_PACK.md)

## Remotion quick start

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A Chromium-compatible environment for preview and rendering

### Install and preview

```bash
cd regos-motion
npm ci
npm run dev
```

Remotion Studio opens at `http://localhost:3000`. Select `RegOSFinalPitch112` for the current 112-second film.

### Validate

```bash
cd regos-motion
npm run typecheck
npm run build
```

### Render

```bash
cd regos-motion
npm run render:pitch
```

The H.264 output is written to `regos-motion/out/RegOS_Sentinel_FinalPitch_112s.mp4`. Generated renders are intentionally excluded from Git.

## Compositions

| Composition | Format | Status | Purpose |
| --- | --- | --- | --- |
| `RegOSFinalPitch112` | 1920x1080, 60fps, 6720 frames | Current | 112-second final pitch film |
| `RegOSIdeaDeck` | 1920x1080, 60fps, 6017 frames | Supporting | Animated ten-slide idea deck |
| `RegOSDemoVideo` | 1920x1080, 30fps | Historical | 172-second product-demo storyboard |

## Final-pitch beats

| Time | Beat | Product proof |
| --- | --- | --- |
| 00:00-00:07 | Hook | Rules as text versus compliance as work |
| 00:07-00:14 | Brand | Compliance Twin positioning |
| 00:14-00:27 | Ingest | Regulatory Coverage Ledger |
| 00:27-00:43 | Compile | Clause-cited structured obligations |
| 00:43-01:03 | Verify | Controlled failure and human approval |
| 01:03-01:17 | Apply | Rule/model/human Applicability Receipt |
| 01:17-01:35 | Reg-Diff | Amendment impact and stale evidence |
| 01:35-01:46 | Prove | Compliance Build Manifest and test gates |
| 01:46-01:52 | Ask | One corpus, one profile, one controlled pilot |

## Visual system

| Token | Value | Use |
| --- | --- | --- |
| Royal blue | `#1B3FB8` | Primary brand and active structure |
| Deep blue | `#16349A` | Secondary surfaces |
| Off-white | `#F4F4F0` | Inspection and evidence surfaces |
| Teal | `#2DD4BF` | Verified state only |
| Near-black | `#070B1A` | Cinematic stage |
| Amber | `#FBBF24` | Ambiguity, review, or stale evidence |

Important UI, text, cursors, diagrams, and audit states are implemented natively in React and SVG. Optional media assets enrich the cinematic layer but are not required for the composition to render.

## Safety and claim boundaries

- Material interpretations remain human-approved.
- The prototype has no production write access.
- Evidence metadata does not independently prove legal sufficiency.
- Simulated entities, connectors, metrics, and evidence are labeled.
- Targets are not presented as measured results.
- External sources retain their original ownership and terms.

See [Validation](docs/VALIDATION.md) before changing product claims or on-screen metrics.

## Development workflow

1. Create a topic branch.
2. Keep composition timing deterministic and frame-based.
3. Run `npm run typecheck` and `npm run build` in `regos-motion/`.
4. Render representative stills for every affected beat.
5. Verify that no claim, metric, or integration is presented as implemented unless it is demonstrable.
6. Open a pull request using the repository template.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete workflow.

## Repository status

- Round-01 product and pitch strategy: documented
- 112-second Remotion pitch: implemented
- Compliance backend and connectors: not implemented in this repository
- Benchmark results and domain validation: planned, not claimed
- Remote GitHub repository: intended to remain private during competition development

## License

Copyright 2026 RegOS Sentinel contributors. All rights reserved. This repository is not currently offered under an open-source license. See [LICENSE.md](LICENSE.md) and [Assets](docs/ASSETS.md).

## Sources

- [SEBI Securities Market TechSprint 2026](https://www.sebi.gov.in/media-and-notifications/press-releases/jun-2026/launch-of-securities-market-techsprint-at-global-fintech-fest-2026-gff-26-_102286.html)
- [Official GFF TechSprint page](https://www.globalfintechfest.com/gff-hackathons/sebi-techsprint)
- [Remotion documentation](https://www.remotion.dev/docs/)
