# RegOS Sentinel: Final Canva + Remotion Prompt Pack

Date: 2026-07-12  
Scope: prompts and motion recommendations only; no implementation.

## Start Here: Canonical Direction

Sections **18-24 and 30-37** are the final product, evidence, and winning strategy. They supersede any earlier suggestion that conflicts with the following locks:

1. Product: a supervised regulatory compiler that maintains an applicability-aware Compliance Twin.
2. Story: `INGEST -> COMPILE -> VERIFY -> APPLY -> DIFF -> PROVE`.
3. P0: one real source family, one Small-RE profile, one amendment, one complete audit trail.
4. Differentiation: field-level grounding, applicability, obligation lifecycle, Inspector Mode, model assurance, Reg-Diff, open benchmark, Sandbox Test Pack.
5. Demo: one uninterrupted golden path; no feature montage.
6. Vision features stay out of the main demo.
7. No unsupported `/100` claim: earn every criterion through an explicit evidence artifact.

Use the document in this order:

- Layman explanation: Section 0
- Product/win strategy: Sections 18-37
- Canva asset prompts: Sections 2-5
- Pitch-deck motion: Section 6
- Demo-video motion: Sections 7 and 10-17
- Future Remotion-agent prompts: Sections 8-9

## 0. RegOS Explained for a SEBI Layman

### The official problem in plain English

SEBI regularly publishes circulars, master circulars, notifications, and guidelines. These documents are written for people to read, but a broker or other market intermediary must convert them into operational work:

- Which exact rule applies to us?
- Which team member owns it?
- What must they change or complete?
- What is the deadline?
- What evidence proves it was done?
- What changes when SEBI later amends the rule?

Today, much of that translation depends on people reading documents one by one, discussing their meaning, updating spreadsheets or task systems, requesting evidence, and repeating the process after every amendment. Smaller intermediaries have fewer compliance resources, so delayed, inconsistent, or incomplete translation is a practical risk.

That is the root problem in the official 2026 challenge, **Agentic Compliance: From Regulatory Text to Operational Action**: regulatory rules exist mainly as unstructured human-readable text, while operational compliance needs structured, machine-actionable, auditable logic.

### What RegOS Sentinel does

RegOS Sentinel is a **trusted translator, workflow manager, change tracker, and evidence librarian for SEBI compliance**.

It turns this:

> A long SEBI circular that a compliance team must interpret manually.

Into this:

> A reviewed list of applicable obligations, each connected to the exact source clause, responsible owner, deadline, control, evidence, status, and amendment history.

The simple flow is:

1. **Ingest:** read a named, official SEBI source.
2. **Compile:** propose structured obligations from its clauses.
3. **Verify:** show the exact supporting text, confidence, and ambiguous cases to a human reviewer.
4. **Apply:** check which obligations apply to this type and size of intermediary.
5. **Diff:** when a circular changes, identify the affected obligations, owners, controls, deadlines, and evidence.
6. **Prove:** export a dated audit trail showing the source, decision, reviewer, action, and current evidence.

The resulting live record is the **Compliance Twin**: a digital representation of what the intermediary must do, why it applies, who owns it, and whether the proof is still current.

### One concrete example

Imagine that a SEBI circular requires a particular category of stockbroker to complete a cyber-security assessment, resolve findings, and retain or submit specified evidence within a deadline.

RegOS would:

1. highlight the exact clause;
2. identify the applicable broker category and conditions;
3. draft an obligation for the correct owner, such as the CISO or compliance officer;
4. attach the required deadline, control, and evidence type;
5. block publication if the deadline or applicability is ambiguous;
6. let an authorised human approve or correct the interpretation;
7. retain the approval and evidence history; and
8. if SEBI later changes the deadline, show the difference and mark old evidence or the old task state for review.

### What it is not

- not a generic chatbot that merely summarizes circulars
- not a replacement for a compliance officer or legal interpretation
- not an autonomous filing system
- not an AI with production write access
- not a claim that every circular can be interpreted without uncertainty

The defensible promise is: **RegOS makes regulatory translation faster, structured, traceable, and reviewable while the regulated entity keeps responsibility and final control.**

### Current score and honest winning outlook

| Measure | Current | Strong target | Meaning |
| --- | ---: | ---: | --- |
| Idea quality | **92/100** | **95/100** | Problem fit, differentiation, trust design, scope logic |
| Round-01 submission readiness | **84/100** | **93/100** | Quality of the actual form copy, PDF, video link, sources, and consistency |
| Round-02 product readiness | **35/100** | **88/100** | Working golden path, measured benchmark, reliability, and demo evidence |

The idea is better than the current deliverables. The plan does not earn product-readiness points until it is implemented and measured.

**Subjective probability ranges, not organizer statistics:**

- Round-01 shortlist with the current concept but average execution: **50-65%**
- Round-01 shortlist with the refined PDF and truthful 112-second film: **70-85%**
- Reach the final jury after building the complete P0 golden path: **40-60%**
- Finish in a prize position with strong validation and reliable demo: **20-35%**
- Win first place: **10-20%**, rising toward **20-30%** only with exceptional measured proof, expert validation, and presentation execution

These ranges are intentionally broad because the organizers do not publish criterion weights, applicant quality, shortlist size, or judge calibration.

## 1. Ordered Feature Architecture

### One product, three audience-facing groups

Do not present RegOS as a wall of features. Present three outcomes:

1. **Understand the rule:** find every relevant clause and convert it into cited obligations.
2. **Decide safely:** determine applicability, expose uncertainty, and keep a human accountable.
3. **Stay audit-ready:** propagate amendments, test evidence, and reproduce every approved decision.

These three groups contain the six operational steps:

`UNDERSTAND: INGEST -> COMPILE`

`DECIDE: VERIFY -> APPLY`

`ASSURE: DIFF -> PROVE`

### The six-step feature map

| Step | User question | Core features | Visible artifact | Judge value |
| --- | --- | --- | --- | --- |
| **1. INGEST** | `What exactly did the authority publish?` | Official-source adapter, source registry, document/version identity, source hash, Regulatory Coverage Ledger; additional authority Corpus Packs in P1 | Source page with every normative segment classified | Coverage, traceability, no silent omissions, scalable source onboarding |
| **2. COMPILE** | `What operational duties are inside it?` | Structured obligation schema, clause-to-field citations, owner/deadline/control/evidence candidates, relationship graph | Clause becomes one structured obligation card | Machine-actionable translation rather than summarization |
| **3. VERIFY** | `Can we trust this interpretation?` | Inspector Mode, confidence by field, competing citations, exception queue, human correction, approval gate, model/schema history | One ambiguous field blocks publication and enters review | Safe failure, explainability, accountability |
| **4. APPLY** | `Does this apply to our intermediary?` | Entity profile, deterministic applicability rules, model-assisted condition extraction, Applicability Receipt, obligation lifecycle, owner assignment | Applied/excluded decision with cited reason and reviewer | Small-RE relevance and auditable negative decisions |
| **5. DIFF** | `What changed after an amendment?` | Source-version comparison, Reg-Diff, obligation versioning, downstream impact map, evidence freshness, owner/control impact | Added/changed/superseded obligations and newly stale evidence | Signature product differentiation and ongoing compliance |
| **6. PROVE** | `How do we demonstrate control?` | Simulated read-only Evidence Connector, Obligation Test Harness, Compliance Build Manifest, Audit Pack, Assurance Console, Sandbox Test Pack, open benchmark | Reproducible release manifest with evidence metadata, tests, approvals, metrics, and exceptions | Continuous assurance, feasibility, sandbox readiness |

### Feature dependencies

The order is mandatory because later features depend on earlier proof:

1. Coverage Ledger must exist before claiming complete compilation.
2. A cited obligation must exist before applicability can be decided.
3. Verification and human approval must occur before an obligation becomes active.
4. An active obligation and linked evidence must exist before Reg-Diff can show operational impact.
5. Versioned events must exist before a Build Manifest or audit replay can be credible.

### Scope tiers

**P0: show in the Round-02 golden path**

- all six steps on one source family, one Small-RE profile, and one amendment
- one controlled ambiguity and human correction
- one Applicability Receipt
- one simulated read-only Evidence Connector, stale-evidence event, and constrained obligation test
- one Compliance Build Manifest and Sandbox Test Pack

**P1: show only on the roadmap slide**

- deadline horizon and owner nudges
- read-only Jira, ServiceNow, document-repository, training, and control-metadata Evidence Connectors
- role-specific briefs and micro-training
- private or on-prem deployment package
- versioned Corpus Packs for additional SEBI, NSE, BSE, CDSL, and NSDL sources
- constrained control-as-code templates

**Vision: one sentence in the closing**

- minimum-cohort, anonymized SupTech friction signals
- multi-intermediary corpus packs
- cross-regulator reference graph with mandatory legal review

### Exclude from the core pitch

- generic blockchain or token story
- ZK-SNARK claims
- unrestricted AI-generated GitHub pull requests
- automated regulatory lobbying
- speech/video treated as an authoritative compliance source
- cross-regulator conflict decisions without legal review
- autonomous filing or production write access

The rubric rewards effective technology and observable control, not the number of technologies mentioned.

## 2. Locked Visual System

- Royal blue `#1B3FB8`
- Deep blue `#16349A`
- Off-white `#F4F4F0`
- Teal `#2DD4BF`
- Near-black `#070B1A`
- Pure white `#FFFFFF`

Use royal-blue glass for isolated 3D objects, off-white for inspection/evidence surfaces, near-black only for hook/brand/ask, and teal only for verified states. No purple, magenta, orange, rainbow refraction, or generic cyberpunk styling.

## 3. Canva Settings

Video plates: `Video clip`, `Ultra`, `Cinematic`, `16:9`, `No audio`, `Wide shot`, `Soft light`, locked or extremely slow camera, 6-8 seconds.

## 4. Canva Image Prompts

### App icon, dark splash

```text
A premium enterprise SaaS app icon for RegOS Sentinel: a precise rounded-square tile made from deep royal-blue glass, exact color #1B3FB8, with restrained inner depth and crisp beveled edges; centered white hexagonal shield containing a minimal vertical document slit; a thin teal verification rim, exact color #2DD4BF, around the shield; floating on a pure near-black background, exact color #070B1A, with one compact royal-blue bloom behind the tile; frontal orthographic composition, immaculate studio render, institutional and trustworthy rather than playful, 1:1. No text, no letters, no purple, no magenta, no cyan rainbow, no extra symbols, no mockup frame.
```

### App icon, light deck

```text
The same RegOS Sentinel enterprise app icon: rounded-square royal-blue glass tile #1B3FB8, centered white hexagonal shield with a minimal vertical document slit, thin teal verification rim #2DD4BF; isolated on a perfectly flat off-white background, exact color #F4F4F0; soft compact contact shadow only, frontal orthographic studio render, 1:1. No text, no glow bloom, no gradient background, no purple, no extra symbols.
```

### Compliance monolith, final D1

```text
A monumental vertical 3D compliance monolith built from hundreds of regulatory document sheets. At the base, clean white pages are loose, overlapping, and partially disordered. Through the middle, they progressively align into exact rectangular modules. At the top, the modules become a perfectly ordered crystalline obligation graph made from royal-blue glass #1B3FB8 with thin teal seams #2DD4BF. A small off-white human-approval gate is visibly embedded near the crown, suggesting supervised transformation from regulation to action. Slight low-angle view, full object visible from base to crown, centered, premium enterprise product sculpture, crisp studio lighting, portrait 9:16, perfectly flat off-white background #F4F4F0. No text, no people, no clock tower, no lighthouse, no city, no purple, no black background.
```

Remove the background and export a transparent PNG.

### Regulatory text to obligation graph

```text
Cinematic enterprise 3D illustration on a solid deep royal-blue background, exact color #16349A. On the left, a dense stack of clean white regulatory circulars with visible page structure but no readable text. The documents separate into precise rectangular fragments that travel horizontally. On the right, the fragments reassemble into an ordered compliance graph of teal nodes #2DD4BF, white connectors, royal-blue control blocks, and small owner/deadline/evidence modules. The transformation is controlled and mechanical, not explosive. Strong central action with clear empty space for headline copy, crisp premium RegTech aesthetic, subtle fine grain, 16:9. No text, no logos, no people, no purple, no magenta, no generic AI brain, no blockchain coin.
```

### Agent icon system

Run this six times, replacing `[OBJECT]`:

```text
A minimal premium 3D icon of [OBJECT], sculpted from royal-blue glass #1B3FB8 with deeper blue internal shading and one thin teal verification edge #2DD4BF; isolated front-three-quarter view, centered on a perfectly flat off-white background #F4F4F0; crisp studio lighting, compact contact shadow, consistent enterprise SaaS icon family, 1:1. No text, no letters, no surrounding badge, no purple, no magenta, no gradient background.
```

1. `a precise radar dish detecting one incoming document signal`
2. `a regulatory document with a magnifying lens isolating one clause`
3. `a hexagonal verification gate connecting a source clause to a structured record`
4. `a network map connecting one obligation to an owner, deadline, and control`
5. `an evidence folder receiving a document and sealing it with a check`
6. `an audit manifest with a shield and a replay arrow`

### Inspector Mode citation beam

```text
Premium enterprise 3D concept illustration on an off-white field #F4F4F0: a clean white regulatory page stands on the left, one clause represented by a luminous teal highlight #2DD4BF; a thin precise teal beam travels from that clause into a structured royal-blue obligation block #1B3FB8 on the right; behind the obligation block, subtle aligned layers suggest model version, schema version, approval history, and replay without showing readable text; crisp orthographic composition, generous negative space, technical and inspectable, 16:9. No text, no UI screenshot, no people, no purple, no generic shield wall, no dramatic lens flare.
```

Build the actual Inspector Mode UI in Remotion; use this only as supporting art.

### Reg-Diff transformation

```text
A high-end RegTech 3D illustration on a perfectly flat off-white background #F4F4F0. Two regulatory document planes stand side by side: the older version on the left in white with muted royal-blue structure, the amended version on the right in royal blue #1B3FB8. Between them, precise teal change markers #2DD4BF identify four transformations: one added block, one changed deadline block, one superseded block dissolving cleanly, and one applicability branch moving to a new entity profile. Ordered diagrammatic composition with real depth, crisp studio light, 16:9. No readable text, no red/green diff colors, no purple, no code editor, no people.
```

### SupTech aggregate signal

```text
An elegant enterprise network visualization on a solid royal-blue field #1B3FB8: many small anonymous off-white nodes represent regulated entities, grouped only into broad cohorts, with teal aggregate signal lines #2DD4BF flowing toward one larger supervisory node; no individual node is named or ranked; three subtle friction clusters become visible as brighter teal constellations; premium institutional visualization, clear center and generous negative space, 16:9, subtle fine grain. No map of India, no text, no people, no purple, no surveillance-eye imagery, no personal data symbols.
```

## 5. Canva Motion-Plate Prompts

### Dark Sentinel void

```text
Slow seamless cinematic background plate: a restrained royal-blue light field #1B3FB8 breathes at the center of a near-black void #070B1A; a narrow teal signal core #2DD4BF pulses once every two seconds; faint architectural grid lines appear only near the center; deep clean negative space remains around the edges; subtle fine film grain; locked camera; premium enterprise SaaS launch-film atmosphere; 16:9, 8 seconds. No objects, no interface, no logo, no text, no purple, no magenta, no lens flare, no audio.
```

### Regulatory data sweep

```text
Seamless slow-motion background plate of thin royal-blue #1B3FB8 and teal #2DD4BF luminous data ribbons travelling diagonally through a near-black field #070B1A; the ribbons behave like ordered regulatory signals, not silk fabric; occasional fine off-white particles travel along the paths; center remains readable; locked wide camera; subtle grain; premium RegTech launch-film atmosphere; 16:9, 8 seconds. No UI, no text, no logos, no purple, no rainbow glow, no audio.
```

### Off-white contrast beat

```text
Ultra-minimal off-white motion plate, exact base #F4F4F0. A pale royal-blue illumination #1B3FB8 at low opacity passes quickly through the center from left to right, followed by one narrow teal verification glint #2DD4BF, then the field returns to clean off-white. Extremely subtle fine grain, locked camera, premium enterprise SaaS transition plate, 16:9, 6 seconds. No objects, no text, no logo, no purple, no beige warmth, no audio.
```

### Empty logo bloom

```text
Slow seamless cinematic loop: a compact royal-blue glow #1B3FB8 blooms behind an empty central area on a pure near-black background #070B1A; one thin teal halo #2DD4BF expands and fades; the bloom breathes with restrained intensity; locked camera; high-end enterprise app-launch aesthetic; 16:9, 8 seconds. No icon, no logo, no text, no particles crossing the center, no purple, no magenta, no audio.
```

## 6. Pitch-Deck Motion Direction

Global: 1920x1080, 60fps, one signature motion per slide, no repeated linear fades, stable body copy, 2.5% maximum panel overshoot, 4-6 frame velocity accents only at major cuts, and a clean settled frame for the PDF.

### S01 Brand

Type `REGULATORY TEXT`, replace it with `OPERATIONAL ACTION`, wipe to royal blue, rise the monolith over 34 frames, and reveal colossal `REGOS SENTINEL` behind it. Signature: the monolith crosses the wordmark depth plane.

### S02 Problem

Document stack enters with depth offsets, fragments become graph nodes, headline clip-rises, `95%` counts once and locks with its exact source footer. Signature: documents become operational structure.

### S03 Why now

Draw one regulatory timeline. A teal signal activates Reg 16C, responsible AI/HITL, the 2026 rulebook change, and PS2. Signature: one verification signal travels through time.

### S04 Solution

Cockpit rises center-screen. Cursor drops a real public circular. Notifications arrive: detected, parsed, grounded. Camera pushes into the obligation register. Signature: source input becomes a live register.

### S05 Agents

Draw the pipeline, pop agents at 8-frame intervals, close the Verifier gate between Interpreter and Mapper, move autonomy from Suggest to Draft, and pulse the human gate once. Signature: verification physically interrupts the pipeline.

### S06 Trust

Highlight the source clause, draw a citation connector, slide in Inspector Mode, approve the obligation, and seal the audit event with one teal pulse. Signature: clause-to-obligation-to-human-approval causality.

### S07 Weeks to minutes

Show colossal `WEEKS|`, delete it, flip to off-white at peak velocity, type `MINUTES|`, and match-cut the caret into the Reg-Diff divider. Signature: live word replacement becomes the product diff.

### S08 Proof plan

Lock three real corpus panels into a versioned benchmark set. Show `50 labeled obligations` as a target until measured. Never animate invented accuracy. Signature: public sources become an evaluation artifact.

### S09 Differentiation

Reveal the comparison by rows. A teal focus frame narrows to RegOS: small-RE, inspectable, SEBI corpus, benchmark, sandbox path. Signature: category narrows to the exact wedge.

### S10 Ask

Animate `public corpus -> design partner -> sandbox -> MII/SupTech`, collapse the path into the app icon, slide out the wordmark, and type `Every obligation. Cited, owned, evidenced.` Hold 120 frames. Signature: the pilot path resolves into the brand.

## 7. Demo-Video Motion Direction

Target: 112 seconds, 1920x1080, 60fps. Balance: 70% product proof, 20% kinetic narrative, 10% brand/ask.

| Time | Scene | Signature motion |
| --- | --- | --- |
| 00:00-00:07 | Operational hook | Three typed questions over dark signal void |
| 00:07-00:14 | Brand promise | Icon scale, wordmark slide, contrast flash |
| 00:14-00:27 | Real source input | Cursor drag/drop and metadata lock |
| 00:27-00:43 | Compiler wakes | Cockpit rise and agent notification cascade |
| 00:43-01:03 | Trust proof | Citation push-in, Inspector Mode, approval |
| 01:03-01:17 | Applicability | Small-to-Mid profile switch and obligation recascade |
| 01:17-01:35 | Reg-Diff climax | `WEEKS| -> MINUTES|` match-cut into impact diff |
| 01:35-01:46 | Governance/output | Replay, pause control, audit-pack export |
| 01:46-01:52 | Sandbox ask | Target/verified metrics, logo close, final hold |

Motion tokens: cursor travel 28-42f; hover 6f; press 6-8f; notifications 22-28f with 10-12f stagger; product rise 32-38f; camera push 30-42f; match cut 16-22f; typing 2-3f/character; contrast flash 6-10f; velocity accent 4-6f; reading hold 90-150f.

Cursor causality: approach -> hover acknowledgement -> cursor and target depress together -> state changes at lowest press point -> camera begins two frames later -> result cascades -> stable reading hold.

Jitter recipe: `0px -> -4px -> 6px -> -2px -> 0px`, maximum 6px horizontal, teal ghost edge at 15-20% delayed one frame, directional blur only on two fastest frames. Never jitter citations, tables, metrics, or body copy.

Truth labels: `Prototype visualization`, `Public SEBI source`, `Synthetic entity`, `Synthetic evidence`, `Simulated amendment`, and `Target` for unmeasured metrics. Remove nonexistent URLs.

## 8. Prompt for the Remotion Pitch-Deck Agent

```text
Refine the existing RegOS Sentinel Remotion idea deck at /Users/mac/Desktop/sebi hackathon/regos-motion.

Preserve the 10-slide contract and exact palette: #1B3FB8, #16349A, #F4F4F0, #2DD4BF, #070B1A. Target 1920x1080 at 60fps. Every slide must freeze into a strong PDF page.

Follow the slide-by-slide direction in /Users/mac/Desktop/sebi hackathon/phase1/FINAL_CANVA_AND_REMOTION_PROMPT_PACK.md.

Core story only: cited obligation compiler, entity applicability, Inspector Mode, controlled autonomy, Reg-Diff, human approval/audit events, open benchmark, change-impact simulator.

Do not add ZK proofs, generic blockchain, autonomous filing, unrestricted code generation, speech-derived obligations, or automated lobbying.

Use one signature action per slide; steep ease-out curves; no elastic text; no repeated linear fades; body copy stable after entrance; no preview offset. Code all UI, text, metrics, cursors, notifications, and diagrams. Generated assets are limited to the monolith, icons, and atmospheric plates. Preserve truth labels and never present targets as results.

Before delivery: typecheck, render representative stills for every slide, inspect overlap/readability, assemble S01-S10 into the PDF, and report output paths plus any unverified claim.
```

## 9. Prompt for the Remotion Demo-Video Agent

```text
Build a new RegOS Sentinel Round-01 pitch/prototype-visualization composition in /Users/mac/Desktop/sebi hackathon/regos-motion.

Composition id: RegOSFinalPitch112. Output: 1920x1080, 60fps, exactly 112 seconds / 6720 frames. Use palette #1B3FB8, #16349A, #F4F4F0, #2DD4BF, #070B1A. No audio unless approved voiceover/music assets exist.

Follow the exact timeline, motion tokens, cursor causality, jitter recipe, and truth labels in /Users/mac/Desktop/sebi hackathon/phase1/FINAL_CANVA_AND_REMOTION_PROMPT_PACK.md.

Alternate three worlds: near-black signal void for hook/logo/ask; royal-blue product stage for cockpit/agents; off-white inspection field for citations/Reg-Diff.

Required timeline: 00:00 hook; 00:07 logo promise; 00:14 public SEBI source input; 00:27 cockpit and agent notifications; 00:43 Inspector Mode and approval; 01:03 applicability switch; 01:17 WEEKS-to-MINUTES into Reg-Diff; 01:35 replay/pause and audit export; 01:46 sandbox ask and logo close.

All meaningful UI must be coded React/Remotion components. Generated assets are atmosphere or isolated 3D metaphors only. Maintain interaction causality: cursor approach -> hover -> press -> target depression -> state mutation -> result cascade -> camera settle.

Claims: persistent discreet `Prototype visualization`; label public sources, synthetic entity/evidence, simulated amendment, and target metrics; no invented GitHub URL; no autonomous legal advice or production write access.

Before delivery: typecheck, render settled stills for every scene, inspect nonblank output and overlap, render H.264 MP4, and report duration, resolution, fps, file size, path, and missing assets.
```

## 10. What the Trackly Reference Does, and the RegOS Upgrade

The 06:10 recording uses a strong structure that RegOS should adopt, not copy visually.

| Trackly behavior | Why it works | RegOS replacement |
| --- | --- | --- |
| Filter words type over a glowing void | Creates curiosity before showing product | Type operational questions: `What changed?`, `Who owns it?`, `What proves compliance?` |
| Phone rises into center | Turns the product into the main character | RegOS cockpit/browser rises full-height without a phone shell |
| Job notifications stack | Shows product activity without explanation | Agent events stack: source detected, clauses parsed, citations grounded, obligations mapped |
| White flash introduces brand | Resets attention and increases perceived pace | Off-white inspection flash transitions from brand promise to real SEBI source |
| App icon assembles, wordmark slides out | Builds a memorable identity moment | Hex shield strokes on, document slit fills, teal verification ring completes, wordmark unmasks |
| Repeated UI push-ins | Lets the viewer read one feature at a time | Push into source citation, Inspector Mode, applicability, and Reg-Diff |
| Filters change and result list updates | Proves the UI is live | Entity profile changes and the obligation set re-evaluates visibly |
| Progress ring counts | Creates a concrete proof beat | Count grounded clauses or benchmark coverage only when measured or labeled as target |
| `job seekers|` colossal caret type | Creates a memorable narrative climax | `WEEKS|` deletes into `MINUTES|`, then the caret becomes the Reg-Diff divider |
| Quiet CTA close | Lets the viewer remember the brand | Logo close plus sandbox/design-partner ask and a long stable hold |

### How RegOS becomes better than the reference

1. **More causal:** every camera move follows a cursor action and lands on its consequence.
2. **More semantic:** every notification corresponds to a real compliance pipeline state.
3. **More dimensional:** SVG connectors and document planes create depth without a generic phone mockup.
4. **More credible:** exact source spans, versions, applicability, and human approval are visible.
5. **More unified:** royal blue, off-white, teal, and near-black replace Trackly's shifting purple/pink world.
6. **More restrained:** jitter is reserved for transitions; evidence remains stable.
7. **More memorable:** the live caret transforms into the actual Reg-Diff interface instead of ending as typography.

## 11. Required SVG and Coded Visual System

All of these should be React/Remotion SVG components so their paths, masks, and states remain editable.

### `SentinelMarkSVG`

- Rounded-square outer tile can remain a styled div or SVG rounded rect.
- Hex shield uses a normalized `pathLength={1}`.
- Stroke draws from 0 to 1.
- Document slit appears through a vertical clip mask.
- Teal verification ring travels around the hex after the shield fill settles.
- Final state must exactly match the static deck logo.

### `SignalGridSVG`

- 96px grid aligned to the existing deck.
- Only 15-25% of intersections contain faint nodes.
- Teal signal travels along one path at a time.
- Grid opacity remains under 10% behind text and under 16% behind isolated product UI.
- Avoid random twinkling across the entire screen.

### `DocumentStackSVG`

- Five document planes with consistent perspective.
- Page lines are simple paths, never fake readable text.
- Each document has anchor points that can detach into rectangular fragments.
- Fragments follow Bezier paths into graph nodes.
- Use a mask so fragments disappear cleanly when they reach the graph.

### `ClauseCitationSVG`

- One translucent teal highlight rect follows the exact clause lines.
- A small source anchor dot grows from 0 to 1.
- Connector path draws with `strokeDashoffset`.
- A brighter dot travels along the completed path once.
- Target obligation border acknowledges arrival with one 10-frame pulse.

### `AgentPipelineSVG`

- Watcher, Interpreter, Verifier, Mapper, Evidence, and Auditor nodes.
- Main connector draws left to right.
- Verifier is a physical gate, not a sixth identical card.
- Low-confidence branch visibly routes downward into a Human Review node.
- Approved branch returns to the main pipeline.
- Autonomy state is shown as a separate segmented control, not embedded in every node.

### `InspectorReplaySVG`

- Horizontal mini-timeline of source ingestion, extraction, verification, human edit, and approval.
- Each event uses a small circle and label.
- Replay cursor moves across events, activating the corresponding UI field.
- Pause/kill control remains static until explicitly hovered.

### `ApplicabilityTreeSVG`

- Root is the selected obligation.
- Branches are Small, Mid-size, and Qualified entity profiles.
- Inapplicable branch collapses to a muted hairline.
- Applicable branch turns royal blue with one teal terminal node.
- Changing entity profile animates the branch geometry and result rows together.

### `RegDiffSVG`

- Two aligned document versions with a central divider.
- Use blue/off-white/teal states, not red/green code-diff conventions.
- Added: block grows from the divider.
- Changed: old block compresses while new block expands.
- Superseded: old block clips away and leaves a version marker.
- Applicability changed: connector moves from one entity branch to another.
- Divider inherits the position of the live typography caret.

### `ProgressRingSVG`

- Ring uses normalized path length.
- Counter text uses tabular numerals.
- Count and arc must complete on the same frame.
- Only animate real or explicitly labeled target metrics.

### `AuditSealSVG`

- Outer ring draws first.
- Inner check or shield appears second.
- Hash-chain nodes link behind the seal.
- The seal lands once; no looping bounce.

### `VelocityGhostSVG`

- One-frame-delayed duplicate outline in teal at 15-20% opacity.
- Only exists for 4-6 frames around a match cut.
- Never duplicate body copy or table text.

## 12. Visual Layer Stack

Use the same order in every scene so depth feels consistent.

| Layer | Content | Motion |
| --- | --- | --- |
| L0 | Canva atmosphere plate or solid brand field | 8-20 second drift; almost static |
| L1 | Grain, grid, radial bloom | Low-opacity continuous motion |
| L2 | Generated monolith, document art, or isolated 3D icon | Slow parallax and scale |
| L3 | Main product UI plane | Camera push, pan, or rise |
| L4 | SVG connectors, highlights, counters, and masks | Precise causal motion |
| L5 | Cursor, notifications, tooltip, Inspector drawer | Fastest parallax and interaction motion |
| L6 | Truth label, short headline, final CTA | Stable after entrance |

Do not blur L3-L6 globally. Motion blur belongs on moving transforms during transitions, not on settled product proof.

## 13. Image and Visual Usage by Demo Scene

### 00:00-00:07: Hook

- Background: dark Sentinel void video plate.
- SVG: faint signal grid and one traveling teal pulse.
- Text: coded character/word animation with clipping mask.
- No generated hero object yet.

### 00:07-00:14: Logo intro

- Background: empty logo bloom plate.
- SVG: `SentinelMarkSVG` plus teal ring.
- Text: wordmark clipped behind the icon; tagline typed below.
- Optional generated app icon may be used as the final settled texture, but the reveal itself should be coded.

### 00:14-00:27: Source input

- Image: real public SEBI document cover or first-page thumbnail.
- SVG: document scan line and metadata brackets.
- UI: coded drag target, upload state, source chip.
- Cursor: foreground with curved travel.

### 00:27-00:43: Compiler wakes

- Product: full coded cockpit UI.
- Images: small generated agent icons only.
- SVG: pipeline connector, verifier gate, progress ring.
- UI: status notifications and obligation result cascade.

### 00:43-01:03: Trust proof

- Product: split source/obligation UI.
- SVG: clause highlight, citation beam, Inspector replay timeline, audit seal.
- No generated illustration over the evidence; clarity is the visual effect.

### 01:03-01:17: Applicability

- Product: entity-profile control plus result register.
- SVG: applicability tree behind or beside the register.
- UI: rows collapse and re-enter; explanation chip states why.

### 01:17-01:35: Reg-Diff climax

- Background: royal blue, then off-white contrast plate.
- Text: coded live caret deletion and typing.
- SVG: caret becomes Reg-Diff divider; changed blocks animate around it.
- Generated Reg-Diff art can appear briefly as a transition texture, not the final readable UI.

### 01:35-01:46: Governance/output

- Product: Inspector replay and export panel.
- SVG: replay timeline, pause control, audit seal, page-stack edges.
- UI: audit pack pages built in HTML/CSS for readable output.

### 01:46-01:52: Ask

- Background: dark logo bloom.
- SVG: pilot-path line collapses into logo mark.
- Text: sandbox ask and final tagline.
- No feature grid or extra metrics after the logo lands.

## 14. Exact Logo Intro at 60fps

Total duration: 7 seconds / 420 frames.

| Frames | Action |
| --- | --- |
| 0-30 | Near-black field and bloom fade in |
| 24-64 | Rounded-square tile rises from 30px below, scale 0.82 to 1 |
| 50-92 | Hex shield stroke draws |
| 78-112 | Shield fill fades in while stroke remains crisp |
| 98-128 | Document slit reveals vertically through a mask |
| 118-158 | Teal verification ring travels once around the hex |
| 144-188 | Tile settles from 1.035 to 1 |
| 172-230 | Wordmark unmasks horizontally from behind the tile |
| 218-330 | Tagline types at 3 frames per character |
| 330-420 | Stable hold with one 2% bloom breath; logo itself does not pulse |

Do not animate the wordmark letter-by-letter. The icon is constructed; the name is revealed as one confident object.

## 15. Jitter Technique Translation into Remotion

Jitter's current production model maps cleanly to code:

### Text units

Jitter can animate by letter, word, line, or entire layer with delay, smoothing, movement, opacity, blur, and clipping masks. In Remotion:

- Character typing: slice the string by frame.
- Word reveal: wrap words in spans and stagger them.
- Line reveal: place each line in `overflow: hidden` and translate its child.
- Use blur only for fast entry/exit and remove it completely at settle.

### Masks

Jitter masks reveal or hide selected layers. In Remotion:

- Use CSS `clipPath`, `overflow: hidden`, or SVG `<clipPath>`.
- Use masks for wordmark slides, field wipes, document fragmentation, and Reg-Diff replacement.
- Never use opacity-only fades where a physical reveal can explain the transition.

### Counters

Jitter counters support prefixes, suffixes, decimals, and percentages. In Remotion:

- Interpolate numeric values and format them with fixed precision.
- Use tabular numerals to prevent layout shifting.
- Counter motion should coincide with a product event, not run decoratively.

### Glass and background blur

Jitter's glass combines transparency, blur, and a subtle edge. In RegOS:

- Reserve glass for notification overlays and Inspector drawers over moving backgrounds.
- Use one subtle edge and controlled blur.
- Keep tables, source text, and primary product surfaces opaque.

### AI effects and shaders

Jitter recommends standard transforms for straightforward motion and AI effects for complex pixel treatments. For RegOS:

- Code position, scale, opacity, masks, counters, cursor, and SVG paths directly.
- Use custom effects only for the 4-6 frame teal velocity ghost or a restrained field distortion during the `WEEKS -> MINUTES` cut.
- Never apply a shader to evidence text or product UI during a reading hold.

## 16. Optional Jitter AI-Effect Prompts

These are effect prompts, not Canva generation prompts.

### Teal velocity echo

```text
Create a short directional echo-trail effect for this layer. Expose controls for horizontal distance, trail opacity, and duration. Use one teal duplicate edge at #2DD4BF, maximum opacity 18%, delayed by one frame. The full effect lasts no more than six frames, moves left-to-right, and returns to a perfectly sharp original layer. No RGB separation, no purple, no continuous glitch.
```

### Verification ripple

```text
Create a single precise verification ripple from the center of this hexagonal shield. Expose controls for radius, stroke width, opacity, and duration. Use #2DD4BF, expand once, fade completely, and do not move or distort the shield. Institutional and restrained, not a neon pulse loop.
```

### Field-wipe distortion

```text
Create a very brief horizontal field-wipe distortion for a full-screen transition. Expose direction, intensity, edge softness, and duration. The wipe should compress the outgoing royal-blue field #1B3FB8 into a narrow vertical line, then reveal an off-white field #F4F4F0. Add one thin teal edge #2DD4BF. No liquid wobble, no chromatic aberration, no purple.
```

### Document-fragment trail

```text
Create a controlled rectangular fragment trail for this document layer. Expose fragment count, horizontal travel, spread, and fade. Fragments should remain axis-aligned, travel toward one destination, and disappear cleanly into a mask. The effect must feel like structured compilation, not explosion or disintegration.
```

## 17. Better-Than-Reference Quality Checklist

- The first product proof appears before 14 seconds.
- Every cursor click changes the target and the application state.
- Every push-in lands on one readable proof.
- Generated images never contain the UI or readable text.
- At least four scenes use meaningful SVG path animation.
- The logo intro has construction, wordmark reveal, and stable hold.
- The `WEEKS -> MINUTES` typography transition becomes the Reg-Diff UI.
- Colors never drift outside the locked palette.
- No purple light leaks from generated assets remain after color correction.
- Notifications contain pipeline facts, not generic success messages.
- Counters are real or labeled as targets.
- Synthetic/simulated content is labeled.
- Evidence and citations remain stable for at least 90 frames.
- No scene uses a plain fade when a match cut, mask, or causal transition is available.
- The final frame is quiet, readable, and held for at least two seconds.

## 18. The Refined Idea: One Product, One Golden Path

### Final one-sentence definition

> **RegOS Sentinel is a supervised regulatory compiler that converts official SEBI text into an applicability-aware Compliance Twin: every obligation is clause-cited, versioned, human-approved, connected to an owner and evidence, and continuously re-evaluated when the rulebook changes.**

### The six-word product story

`INGEST -> COMPILE -> VERIFY -> APPLY -> DIFF -> PROVE`

Every deck slide, demo scene, feature, and answer must map to one of these six verbs. Anything that does not map cleanly is removed from the main story.

### What the Compliance Twin means

The Compliance Twin is not a 3D object and not another dashboard. It is the living structured state of one regulated entity:

- which official sources apply
- which obligations are active
- why each obligation applies
- which control and owner satisfy it
- which evidence proves it
- who approved the interpretation
- which model/schema version produced it
- what changed when a source was amended
- which obligations are stale, disputed, or superseded

This single concept unifies the obligation graph, entity profile, evidence workflow, Inspector Mode, and Reg-Diff without presenting five disconnected products.

## 19. Competitive Feature-Gap Audit

OnFinance publicly describes rapid regulatory updates, circular processing, actionables, task assignment, evidence collection, a regulation library, horizon scanning, dynamic compliance graphs, role dashboards, and audit-ready reporting. These capabilities validate the category, but they are category baseline rather than RegOS differentiation.

### Do not lead with these as unique

- monitors circulars
- summarizes regulatory updates
- assigns compliance tasks
- collects evidence
- generates audit reports
- provides a searchable regulation library
- has multiple agents
- uses a compliance graph

### Defensible RegOS differentiators

| Differentiator | Judge-visible proof | Official criterion strengthened |
| --- | --- | --- |
| Applicability-aware compiler | Switch entity tier; obligation set and rationale change | Technology, Feasibility |
| Clause-to-field grounding | Select any field and reveal exact supporting span | Alignment, Technology |
| Obligation lifecycle | Draft, disputed, approved, active, superseded, retired states | Feasibility, Scalability |
| Inspector Mode | Model/schema version, confidence, reviewer, replay, override | Alignment, Technology |
| Reg-Diff | Added, changed, superseded, applicability-changed items | Market Impact, Technology |
| Open benchmark | Versioned labeled set, method, errors, measured metrics | Technology, Feasibility |
| Assurance Console | Provider registry, evaluation result, drift, pause/kill control | Alignment, Feasibility |
| Sandbox Test Pack | Objectives, parameters, safeguards, success/failure criteria | Feasibility, Alignment |
| Small-RE operating mode | Minimal corpus, guided review queue, transparent pricing assumptions | Market Impact, Scalability |

## 20. Newly Validated Feature Gaps

These gaps were identified by comparing the current RegOS concept with SEBI's responsible-AI principles, sandbox criteria, accessibility obligations, and the commercial category baseline.

### G9. No explicit obligation lifecycle

**Problem:** Extraction currently appears to produce a final obligation immediately. Real compliance interpretation moves through disagreement, approval, amendment, supersession, and retirement.

**Add:** A deterministic lifecycle:

`Extracted -> Needs review -> Approved -> Active -> Changed/Superseded -> Retired`

Every transition stores actor, timestamp, reason, source version, and previous value. Reg-Diff must create lifecycle events rather than silently overwriting rows.

**Demo proof:** An amended deadline moves the old obligation to `Superseded` and creates a linked active version.

### G10. No model/vendor assurance console

**Problem:** Reg 16C makes the regulated entity responsible even when a third-party AI provider is used. A provider abstraction in architecture is insufficient if judges cannot see governance.

**Add:** A compact Assurance Console showing:

- provider and model version
- schema/prompt version
- last benchmark run
- citation and field accuracy
- low-confidence routing rate
- last review date
- change log
- pause/kill control
- rollback to last approved configuration

**Demo proof:** Open one obligation, replay it under the recorded model/schema version, then show that publish remains blocked until human approval.

### G11. No disagreement and exception queue

**Problem:** Low confidence is mentioned, but difficult cases have no visible operating workflow.

**Add:** A review queue containing:

- conflicting source spans
- ambiguous actor or deadline
- cross-document contradiction
- missing applicability data
- model disagreement
- stale evidence

Reviewer edits become labeled benchmark examples after approval. This creates a controlled learning loop without autonomous self-modification.

**Demo proof:** One ambiguous obligation routes to review while high-confidence items continue.

### G12. Evidence has no freshness or validity model

**Problem:** Collecting a file is not the same as proving current compliance.

**Add:** Evidence states:

`Requested -> Submitted -> Verified -> Expiring -> Stale -> Rejected`

Store evidence period, owner, verification method, expiry, source obligation version, and reviewer. When Reg-Diff changes an obligation, linked evidence is automatically re-evaluated for freshness.

**Demo proof:** A deadline change makes an old certificate stale and creates a new evidence request.

### G13. Sandbox readiness is copy, not an artifact

**Problem:** The pitch says sandbox-ready but does not produce a sandbox testing plan.

**Add:** A generated Sandbox Test Pack containing:

- problem and genuine need to test
- selected public/synthetic dataset
- test objectives
- success metrics
- failure thresholds
- risk register and safeguards
- rollback/kill procedure
- testing timeline
- expected market/user benefit
- exit and pilot criteria

This maps directly to SEBI sandbox language around identifiable benefits, test readiness, clear parameters, success criteria, and risk safeguards.

**Demo proof:** Export one page of the test pack after the audit pack.

### G14. Accessibility is absent from the product quality bar

**Problem:** SEBI has mandatory digital-accessibility guidance for regulated entities. A compliance product should not ignore the same standard.

**Add as a product requirement, not a headline feature:**

- WCAG 2.2 AA target
- keyboard-operable review and approval
- non-color-only statuses
- screen-reader labels for citations and evidence
- reduced-motion mode
- accessible exported reports

**Deck treatment:** One line in feasibility/quality, not a new feature slide.

### G15. No measurable corpus-onboarding method

**Problem:** Scalability is claimed through a generic schema, but adding a new circular family has no visible process or cost.

**Add:** A documented corpus adapter workflow:

1. ingest and structure documents
2. label 25-50 representative obligations
3. configure applicability vocabulary
4. run benchmark
5. human sign-off
6. publish versioned corpus pack

Track onboarding hours, review rate, processing cost, and benchmark delta. This turns scalability from architecture prose into an operating model.

## 21. The /100 Evidence Plan

A perfect score cannot be guaranteed. The correct goal is a package with explicit evidence for every published criterion and no unsupported claim.

### 1. Market Impact: target 20/20

Required evidence:

- exact PS2 problem mapping
- SEBI Investor Survey statistic framed correctly as intermediary perspective
- one compliance-officer workflow interview or documented expert review
- measured baseline and target for circular-to-plan time
- one before/after example showing owner, deadline, control, and evidence completeness

Failure condition: only general claims about manual work or investor protection.

### 2. Technology Stack: target 20/20

Required evidence:

- structured `obligation.v1` schema
- source-to-field grounding
- deterministic validation and lifecycle state machine
- applicability engine
- Inspector Mode and replay
- open benchmark with error analysis
- model/provider registry and kill control

Failure condition: architecture names without a visible state transition or test.

### 3. Feasibility: target 20/20

Required evidence:

- narrow corpus and entity scope
- public data plus synthetic evidence; no PII
- no production write access
- review queue for ambiguous cases
- measured latency and estimated cost per source
- offline seeded fallback using the same schema
- Sandbox Test Pack with success/failure thresholds and safeguards

Failure condition: broad multi-regulator promise, autonomous execution, or unmeasured claims.

### 4. Scalability: target 20/20

Required evidence:

- versioned corpus-adapter process
- entity-profile configuration rather than code forks
- reusable obligation/control/evidence schema
- review-volume and onboarding-cost assumptions
- expansion sequence: small stock broker -> other broker tiers -> adjacent intermediary class -> MII aggregate view
- minimum-cohort privacy rule for aggregate SupTech signals

Failure condition: saying `add more documents` without an onboarding method.

### 5. Alignment with SEBI's Mandate: target 20/20

Required evidence:

- clause-level provenance and human accountability
- Reg 16C responsibility reflected in product controls
- model monitoring, replay, pause/kill, and audit trail
- investor-protection and market-efficiency outcome
- accessibility and data-minimization requirements
- sandbox-ready test design
- no safeguard bypass, live trading, legal advice, or automated filing

Failure condition: presenting speed as more important than accountability.

## 22. Final Product Scope: P0, P1, Vision

### P0: the only Round-02 build that matters

1. One real SEBI source family
2. One Small-RE entity profile
3. Regulatory Coverage Ledger across the scoped source
4. Structured obligation compilation
5. Exact source-to-field citations
6. Applicability Receipt for applied and excluded decisions
7. Human review/approval and exception queue
8. Obligation lifecycle/versioning
9. Reg-Diff on one simulated amendment
10. One simulated read-only Evidence Connector, evidence freshness event, and constrained obligation test
11. Inspector Mode and Assurance Console
12. Compliance Build Manifest, Audit Pack, and Sandbox Test Pack
13. Versioned open benchmark

### P1: after the golden path works

- deadline horizon and nudges
- read-only Jira, ServiceNow, document-repository, training, and control-metadata Evidence Connectors
- staff briefs and micro-training
- private/on-prem deployment package
- versioned Corpus Packs for additional SEBI, NSE, BSE, CDSL, and NSDL sources
- constrained control-as-code templates

### Vision: one slide and one closing sentence only

- minimum-cohort anonymized SupTech friction signals
- multi-intermediary corpus packs
- cross-regulator reference graph with mandatory legal review

Do not show Vision features inside the main product demo.

## 23. The Final Judge Narrative

### Opening

> SEBI publishes rules as human-readable text. A small broker must turn every clause into an applicable obligation, owner, deadline, control, and current evidence trail. That translation is still manual, slow, and difficult to inspect.

### Product

> RegOS Sentinel is a supervised regulatory compiler. It builds a living Compliance Twin for the intermediary: every obligation is grounded to an exact clause, filtered by applicability, approved by a human, and versioned through every amendment.

### Differentiation

> The category already has compliance automation. RegOS is not claiming to invent it. Our wedge is regulator-inspectable compilation for lean SEBI intermediaries: field-level grounding, applicability, obligation lifecycle, model replay, an open benchmark, and a sandbox test pack.

### Signature proof

> When a new circular lands, Reg-Diff does not merely summarize it. It shows which active obligations changed, which evidence became stale, which owners and controls are affected, and which interpretation requires human review.

### Trust

> The AI cannot publish silently. The regulated entity can inspect the source, model and schema version, confidence, reviewer, previous value, and audit event; it can pause, replay, or roll back the pipeline.

### Ask

> We are asking for a focused sandbox path: one public SEBI corpus, one synthetic small-broker profile, a versioned benchmark, and a design-partner review leading to a controlled 90-day pilot.

## 24. Deck and Demo Simplification

Section 36 is the final feature-to-slide and feature-to-timeline assembly order. This section preserves the narrative constraint: one golden path and no feature montage.

### Ten-slide deck

1. **Purpose:** regulatory text to operational action
2. **Problem:** the manual translation gap
3. **Why now:** Reg 16C, rulebook change, PS2
4. **Product:** the Compliance Twin golden path
5. **How it works:** compile, verify, apply
6. **Trust:** Inspector Mode, lifecycle, assurance
7. **Climax:** Reg-Diff plus evidence freshness
8. **Proof plan:** real corpus, open benchmark, sandbox test metrics
9. **Wedge and scale:** category baseline vs inspectable small-RE focus
10. **Ask:** design partner, sandbox, 90-day pilot

### Demo sequence

`Real source -> coverage ledger -> compiled obligations -> exception review -> applicability receipt -> approval -> amendment diff -> stale evidence/test -> build manifest and sandbox pack`

Do not interrupt this sequence with business model, competitor tables, DPI features, blockchain, training, or SupTech dashboards. Those belong in the deck or Q&A.

## 25. Source-Backed Decision Notes

- The official TechSprint criteria are Market Impact, Technology Stack, Feasibility, Scalability, and Alignment with SEBI's Mandate.
- SEBI's responsible-AI consultation emphasizes testing, monitoring, explainability, auditability, human oversight, third-party-provider responsibility, and kill-switch/circuit-breaker thinking.
- Regulation 16C places responsibility on the regulated entity even when third-party AI tools are used.
- SEBI's sandbox materials emphasize identifiable benefits, test readiness, clear objectives/parameters/success criteria, and safeguards against failure.
- SEBI's Innovation Sandbox is designed for isolated offline testing with test data before live introduction.
- SEBI has mandatory digital-accessibility guidance for regulated entities; accessibility should be part of RegOS's product quality bar.
- OnFinance publicly establishes that circular processing, actionables, task assignment, evidence collection, dynamic compliance graphs, horizon scanning, and reporting are already category features.

Primary references:

- https://hackculture.io/hackathons/sebi-securities-market-techsprint
- https://www.sebi.gov.in/sebi_data/attachdocs/jun-2025/1750415065695.pdf
- https://www.sebi.gov.in/sebi_data/attachdocs/feb-2025/1740630655676.pdf
- https://www.sebi.gov.in/legal/circulars/feb-2021/revised-framework-for-innovation-sandbox_48983.html
- https://www.sebi.gov.in/sebi_data/attachdocs/jun-2025/1750678372996.pdf
- https://www.sebi.gov.in/legal/circulars/sep-2025/compliance-guidelines-for-digital-accessibility-circular-rights-of-persons-with-disabilities-act-2016-and-rules-made-thereunder-mandatory-compliance-by-all-regulated-entities-dated-july-31-2025-_96862.html
- https://www.sebi.gov.in/sebi_data/commondocs/jan-2026/Investor%20Survey%202025%20Main%20Report.pdf
- https://onfinance.ai/

## 26. The Last Points: Maximum-Score Refinement

The next improvements are ordered by expected scoring value, not visual excitement.

### 1. Obtain one domain validation artifact

The biggest idea-stage weakness is not technology. It is the absence of direct workflow validation.

Minimum acceptable artifact:

- 30-minute review with a broker compliance officer, CISO, auditor, exchange member-compliance professional, or securities lawyer
- five documented questions about current circular translation, applicability, review, evidence, and amendment handling
- a short signed or attributable note if permitted
- no invented customer, pilot, endorsement, or affiliation

Deck proof: `Workflow reviewed with [role], [date]`; name only with permission.

### 2. Replace headline metrics with a measurement contract

Before results exist, show the protocol rather than an impressive number:

| Metric | Definition | Initial target |
| --- | --- | --- |
| Obligation precision | Valid extracted obligations / all extracted obligations | >= 0.85 |
| Obligation recall | Extracted reference obligations / labeled reference obligations | >= 0.80 |
| Citation correctness | Displayed fields supported by the cited span | >= 0.95 |
| Applicability accuracy | Correct entity-profile decision / labeled cases | >= 0.90 |
| Human-edit rate | Approved obligations requiring a material edit | Track, then reduce |
| Low-confidence capture | Ambiguous cases routed to review | >= 0.90 |
| Circular-to-draft-plan | Ingestion to review-ready obligations | < 10 minutes for scoped corpus |

Do not promise `100% accuracy`. `100% citation coverage` may describe a UI invariant only if the product refuses to display an uncited obligation.

### 3. Demonstrate one failure, not only success

A regulator-facing AI demo becomes more credible when it shows controlled failure.

Required failure beat:

1. Interpreter encounters an ambiguous deadline.
2. Confidence falls below threshold.
3. Verifier exposes two competing source spans.
4. Publish is blocked.
5. Human reviewer selects the supported interpretation and records a reason.
6. The approved correction becomes a labeled benchmark case.

This single sequence proves governance, exception handling, and learning discipline better than another feature montage.

### 4. Make applicability rule-plus-model, not LLM opinion

Applicability should combine:

- structured entity profile
- deterministic thresholds and definitions from the source
- model-assisted extraction of candidate conditions
- human approval for ambiguous conditions

The UI should distinguish `Rule matched`, `Model suggested`, and `Human confirmed`.

### 5. Make evidence freshness part of Reg-Diff

The most defensible signature sequence is:

`Circular amended -> obligation version changes -> linked control remains -> evidence becomes stale -> owner receives a new evidence request.`

This is operational action, not regulatory summarization.

### 6. Publish the open benchmark correctly

The benchmark repository or artifact should contain:

- source-document versions and permitted excerpts/locators
- annotation schema and guidelines
- train/dev/test split or evaluation-only set
- annotator disagreement process
- scoring script
- baseline results
- known failure categories
- version history
- clear licensing and source-use notes

An unlabeled spreadsheet called a benchmark does not earn the same credibility.

### 7. Prove the small-RE wedge economically

Show a transparent operating model instead of a generic SaaS price:

- documents processed per month
- expected obligations per source
- percentage routed to review
- reviewer minutes per exception
- estimated model cost per source
- corpus-onboarding hours
- deployment/support assumptions

The wedge wins when it is visibly simpler and cheaper to operate for a lean team, not merely when the UI says `Small Broker`.

### 8. Align the Sandbox Test Pack with explicit gates

Use three phases:

1. **Offline:** public corpus, synthetic entity, labeled benchmark
2. **Controlled design-partner test:** no production write access, sampled human review, agreed success/failure thresholds
3. **Pilot:** limited corpus and users, monitored exceptions, rollback plan, periodic review

Every phase needs an entry gate, exit gate, owner, risk, and evidence artifact.

### 9. Build a reliable demo fallback

The live pipeline and seeded fallback must render the same schema and UI states. The fallback is not a prerecorded fake; it is deterministic fixture data labeled `Seeded demo`.

Demo recovery should take one click and preserve the narrative sequence.

### 10. Prepare the jury answer pack

The deck earns attention. Q&A protects the score. Prepare one-slide appendix answers for:

- OnFinance comparison
- hallucination and legal-liability risk
- applicability accuracy
- benchmark method
- model/provider dependence
- data privacy and deployment
- sandbox path
- scalability and cost
- why five agents rather than one workflow
- what is working versus visualized

## 27. Judge Red-Team: Questions That Can Cost the Win

### `Isn't this OnFinance ComplianceOS?`

**Answer:**

> OnFinance validates that BFSI pays for regulatory workflow automation. RegOS is deliberately narrower and more inspectable: a SEBI small-intermediary corpus, field-level source grounding, applicability reasoning, obligation lifecycle, model replay, open evaluation, and a sandbox test pack. We are not claiming to invent the category.

### `Why do you need five agents?`

**Answer:**

> Agent names are not the innovation. We use explicit bounded stages because detection, extraction, verification, applicability, evidence, and audit have different permissions, tests, and human gates. The state machine is replayable; it can also run with fewer model calls when deterministic rules are sufficient.

### `What prevents hallucinated obligations?`

**Answer:**

> Schema constraints prevent malformed output; source-to-field grounding prevents unsupported display; deterministic validation catches missing fields; confidence thresholds and disagreement rules route ambiguous cases to review; no obligation becomes active without approval.

### `How do you know an obligation applies?`

**Answer:**

> Applicability is not free-form model judgment. It combines a structured entity profile, deterministic source thresholds, model-extracted candidate conditions, and human confirmation for ambiguity. The Inspector shows which mechanism produced the decision.

### `Does the AI take compliance actions?`

**Answer:**

> It can suggest and draft. Any publish, filing, production change, or external action remains behind an authenticated human approval and the product has no default production write access.

### `What happens when the model or provider changes?`

**Answer:**

> Provider, model, prompt, and schema versions are registered. A change triggers benchmark regression before deployment. The regulated entity can pause, roll back, and replay prior decisions under the recorded configuration.

### `Why would a small broker afford this?`

**Answer:**

> The first product is intentionally narrow: a broker corpus pack, guided exception queue, small reviewer footprint, and transparent per-source operating cost. We will validate the cost model with a design partner before claiming savings.

### `Where is the real market evidence?`

**Answer:**

> The SEBI survey supports the broader information-complexity problem and commercial products validate category demand. Direct RegOS demand still requires workflow interviews and a design partner; we state that gap explicitly rather than presenting survey data as customer validation.

### `What exactly will you test in the sandbox?`

**Answer:**

> One corpus, one synthetic Small-RE profile, extraction and citation metrics, applicability accuracy, exception-routing quality, human-edit rate, latency, and safe failure behavior. No live trading, no investor PII, and no production write access.

## 28. Submission Deal-Breakers

Any one of these can erase the benefit of the refined strategy:

- claiming `first`, `only`, or guaranteed winner
- presenting targets as measured results
- implying the animated Remotion UI is already a working prototype
- using the 95% survey statistic as direct product demand
- saying blockchain, ZK, DPI, or multi-agent only to collect rubric points
- showing tiny unreadable product UI in the PDF
- giving every slide a different visual style
- spending more demo time on architecture than the golden path
- hiding ambiguity and failure cases
- describing OnFinance inaccurately or dismissively
- promising autonomous filing or production changes
- missing source footers for legal/regulatory claims
- a demo without synthetic/simulated labels
- a nonexistent GitHub or product URL
- no concrete ask at the end

## 29. Final Score Gate Before Submission

Score the actual artifacts, not the plan. Each row is pass/fail.

| Gate | Points |
| --- | ---: |
| One-sentence product definition is identical across form, deck, and video | 5 |
| Every deck slide has one job and remains readable as PDF | 5 |
| Real SEBI corpus is named, sourced, and covered by the Coverage Ledger | 5 |
| Competitive baseline is accurate and wedge is explicit | 5 |
| Golden-path demo is uninterrupted | 5 |
| Applicability is visibly rule/model/human separated and exports a receipt | 5 |
| One controlled failure routes to human review | 5 |
| Inspector shows source, versions, reviewer, history, and Build Manifest | 5 |
| Obligation lifecycle and Reg-Diff preserve history | 5 |
| Evidence freshness changes after amendment and one obligation test runs | 5 |
| Metrics are measured or labeled as targets | 5 |
| Open benchmark method is credible | 5 |
| Assurance Console includes regression, pause, and rollback | 5 |
| Sandbox Test Pack has objectives, thresholds, safeguards, and exit gates | 5 |
| Data minimization and no-write posture are explicit | 5 |
| Accessibility/reduced-motion quality bar is stated | 5 |
| Small-RE economics and onboarding assumptions are transparent | 5 |
| P0/P1/Vision scope is disciplined | 5 |
| Q&A answers cover the eight highest-risk objections | 5 |
| Final ask names the next controlled step | 5 |
| **Total** | **100** |

Interpretation:

- **90-100:** finalist-quality package if execution is polished
- **80-89:** strong shortlist package with visible gaps
- **70-79:** good idea but insufficient proof or clarity
- **Below 70:** feature-heavy, unvalidated, or difficult to trust

## 30. What the 2025 Finalists Actually Teach Us

### Research boundary

The public record does not provide a complete official table of ranks, jury scores, criterion weights, or detailed descriptions for every 2025 finalist. Do not invent those details. The strongest available evidence is the official SEBI launch notice, the organizer's Top-6 announcement, institutional posts, and participant reports. Treat participant-reported team counts, ranks, jury names, and implementation details as supporting evidence rather than official SEBI statistics.

### Verified or attributable evidence

| 2025 evidence | What is publicly supported | Lesson for RegOS | Confidence |
| --- | --- | --- | --- |
| SEBI's official launch | The challenge sought digital-first solutions improving investor empowerment, transparency, efficiency, compliance, and accessibility; selected solutions could receive Innovation Sandbox mentorship. | Frame an operational market outcome, not an AI feature list. | High: official SEBI source |
| Organizer Top 6 | Hack2skill named Ayush Arya Kashyap, Bulls, Getclarity.finance, OnFinance AI, The Bad Batch, and Wecode as the six advancing teams. | The final field included students, individuals, and existing product companies; polish alone does not determine selection. | High for finalist names: organizer source |
| Bulls: India Investors Dashboard | IIIT-Delhi says the team placed fourth, received Jury Recommendation, built interactive investor education and data-driven insights, and entered a 3-6 month Innovation Sandbox onboarding path. A team member linked a live demo and source code. | Make the beneficiary visible, make the product demonstrable, and present the next sandbox test as a continuation rather than a vague ambition. | Medium-high: institution and participant sources |
| Ayush Arya Kashyap: InvestShield | IIIT-Bangalore and the participant describe a solo-built AI fraud-detection product receiving Jury Recommendation. | One understandable risk and one visible product can beat a sprawling platform story. | Medium-high: institution and participant sources |
| Amritha S: InfoCrux | The participant describes a Top-6, Jury-Recommendation credibility engine using agentic AI, LLMs, and regulatory data pipelines to verify disclosures and detect misinformation. | AI was tied to a regulator-relevant trust outcome: credibility and transparency. | Medium: participant source |
| OnFinance AI | The organizer confirms a Top-6 place. OnFinance's own post reports first prize for ComplianceOS and describes NeoGPT-based regulatory interpretation, reporting, and audit readiness. Its current public product establishes circular intelligence, actionables, tasks, evidence, horizon scanning, and compliance graphs as existing category capabilities. | RegOS must not pitch a finance-tuned model, agents, circular summarization, task assignment, or evidence collection alone as its innovation. | High for finalist status and public product capabilities; medium for rank because the rank source is the company itself |

Publicly accessible research did not yield sufficiently reliable project detail for Getclarity.finance, The Bad Batch, or Wecode. Their names may be listed, but their products must not be used to infer selection patterns without a source.

### The strongest recurring patterns

1. **Literal problem fit:** the project can be mapped to the challenge in one sentence.
2. **Visible beneficiary:** the judge can identify who is protected or helped and how.
3. **Product, not concept art:** later rounds reward something that can be demonstrated, inspected, and tested.
4. **Trust outcome:** fraud prevention, disclosure credibility, investor education, compliance, or transparency is the headline; AI is the mechanism.
5. **Continuation path:** sandbox onboarding and a bounded next experiment make the idea institutionally usable.
6. **Focused novelty:** finalists did not need every emerging technology in one product.
7. **Communication quality:** the problem, action, and outcome remain understandable to a regulatory jury without a long technical preface.

## 31. How the 2026 Selection Is Likely to Work

The official 2026 page publishes five criteria but no weights: Market Impact, Technology Stack, Feasibility, Scalability, and Alignment with SEBI's Mandate. The competition has three different evidence thresholds:

### Round 01: application shortlisting

Judges can only score the clarity and credibility of the submitted idea, PDF, and optional video. The winning behavior is:

- identify the exact official problem in the first few seconds;
- show one user and one painful current workflow;
- show the proposed golden path visually;
- make the differentiation legible against existing compliance automation;
- state a bounded prototype and validation plan;
- avoid presenting roadmap features as implemented.

Round-01 rejection risks are vagueness, generic AI language, excessive scope, an unreadable deck, and no reason to believe the team can deliver the prototype.

### Round 02: working prototype and demo video

The official process explicitly asks for a working prototype and demo video. The evidence threshold therefore changes from `promising idea` to `observable behavior`.

The strongest RegOS proof is one uninterrupted case:

`Official source -> cited obligation -> applicability decision -> low-confidence exception -> human approval -> amendment Reg-Diff -> stale evidence -> audit and Sandbox Test Pack`

This case should contain one controlled failure. A polished success-only animation is less credible than a system that identifies ambiguity, blocks publication, records correction, and preserves accountability.

### Round 03: final evaluation

The final jury is likely to test objections rather than admire feature breadth:

- Does the source actually support the generated obligation?
- What happens when the AI is uncertain or wrong?
- How is applicability determined?
- Who remains accountable?
- Why is this different from an existing ComplianceOS?
- Can a smaller intermediary deploy and afford it?
- What measurable result will the sandbox test?
- Can the same architecture onboard a second corpus without rebuilding everything?

This is an inference from the published criteria and finalist evidence, not a disclosed SEBI scoring formula.

## 32. Final Refined Strategy for RegOS

### The one-line submission

> RegOS Sentinel converts SEBI regulatory text into clause-cited, applicability-aware compliance obligations, then keeps each obligation, owner, control, evidence item, and amendment decision auditable through a human-supervised Compliance Twin.

### Why this is the right scope

It covers both halves of the official problem:

1. **Dynamic regulatory translation:** new and amended rules become structured obligations and operational impact.
2. **Ongoing compliance management:** obligations remain connected to owners, controls, current evidence, gaps, and audit history.

It also creates a specific wedge against the category baseline:

> Other products can summarize circulars and create tasks. RegOS wins only if it visibly proves field-level source grounding, applicability logic, lifecycle versioning, safe exception handling, Reg-Diff impact, and regulator-inspectable replay.

### The four proof pillars

1. **Grounded:** every displayed field links to an exact source span or is explicitly labeled as a human decision.
2. **Applicable:** rules, model suggestions, and human confirmation are visually distinct.
3. **Controlled:** uncertainty blocks silent publication; humans approve material decisions; pause, replay, and rollback are available.
4. **Measurable:** a versioned benchmark and Sandbox Test Pack report precision, recall, citation correctness, applicability accuracy, exception capture, edit rate, and latency.

### Product scope that maximizes the chance of winning

**Build for the prototype:**

- one official SEBI corpus family
- one synthetic Small-RE profile
- one real or simulated amendment
- Regulatory Coverage Ledger
- clause-to-field provenance
- applicability tree and Applicability Receipt
- exception queue and human approval
- obligation lifecycle and evidence freshness
- Reg-Diff
- one simulated read-only Evidence Connector and constrained obligation test
- Inspector Mode and Assurance Console
- Compliance Build Manifest, Audit Pack, and Sandbox Test Pack

**Show in the deck, not the main demo:**

- Corpus Pack expansion path across additional SEBI, NSE, BSE, CDSL, and NSDL sources
- read-only enterprise Evidence Connectors for tasks, documents, training, and control metadata
- private or on-prem deployment path
- integrations and deadline horizon
- minimum-cohort supervisory friction signals

**Remove from the win story unless genuinely implemented and necessary:**

- blockchain added only for optics
- ZK-SNARKs
- unrestricted code generation
- automatic lobbying
- autonomous filing
- speech treated as authoritative regulation
- a broad cross-regulator graph without legal validation

### The winning pitch sequence

1. **Problem:** rules are text; compliance work requires structured, auditable action.
2. **User:** a lean intermediary compliance team must interpret, assign, evidence, and update every obligation.
3. **Product:** RegOS creates and maintains the Compliance Twin.
4. **Proof:** show one exact source becoming a reviewed obligation.
5. **Trust:** show uncertainty, human control, provenance, and replay.
6. **Climax:** amend the source and show downstream Reg-Diff plus stale evidence.
7. **Measurement:** show the benchmark and sandbox gates, not unsupported performance claims.
8. **Ask:** request one corpus, one synthetic profile, one design-partner review, and a controlled 90-day pilot path.

## 33. Honest Score and Winning Chances After This Refinement

### Concept score today

| Dimension | Score | Reason |
| --- | ---: | --- |
| Official problem fit | 19/20 | Directly covers translation and ongoing compliance management |
| Market impact | 17/20 | Strong small-intermediary and supervisory value; requires user validation and measured baseline |
| Technology | 18/20 | Grounding, graph/lifecycle, applicability, assurance, and diff are substantive; architecture must be demonstrated |
| Feasibility | 18/20 | P0 is bounded and avoids unsafe autonomy; corpus onboarding and deployment assumptions need proof |
| Scalability | 17/20 | Schema and corpus-pack strategy are credible; a second corpus is needed to prove reuse |
| SEBI alignment and trust | 19/20 | Strong auditability, human accountability, safe failure, and sandbox posture |
| **Idea total** | **92/100** | Finalist-calibre concept, not yet a winning product |

This is an internal quality assessment, not the organizer's undisclosed weighting.

### Probability ranges

- **Round-01 shortlist now, with average execution:** 50-65%
- **Round-01 shortlist with the refined deck and clear 112-second video:** 70-85%
- **Reach final evaluation after a reliable P0 prototype:** 40-60%
- **Any prize or Jury Recognition with measured proof and strong presentation:** 20-35%
- **First place:** 10-20% today; potentially 20-30% only after expert validation, strong benchmark results, a reliable live demo, and excellent jury answers

No honest analysis can make the project `/100 proof` or guarantee a win. The controllable route to the highest score is not another feature. It is converting the four proof pillars into visible artifacts and ensuring that the pitch, animation, prototype, benchmark, and Q&A all tell the same narrow story.

### Sources for Sections 30-33

- 2026 official GFF TechSprint page, problem statement, process, criteria, and awards: https://www.globalfintechfest.com/gff-hackathons/sebi-techsprint
- 2026 SEBI launch notice: https://www.sebi.gov.in/media-and-notifications/press-releases/jun-2026/launch-of-securities-market-techsprint-at-global-fintech-fest-2026-gff-26-_102286.html
- 2025 SEBI launch notice: https://www.sebi.gov.in/media-and-notifications/press-releases/jul-2025/launch-of-securities-market-hackathon-at-global-fintech-fest-2025-gff-25-_95410.html
- 2025 organizer Top-6 announcement: https://www.linkedin.com/posts/hack2skill_securitiesmarkethackathon-sebi-fintech-activity-7381554010085822464-9i-d
- IIIT-Delhi account of Bulls and India Investors Dashboard: https://www.linkedin.com/posts/iiit-delhi_iiitd-studentsachievements-hackathon-activity-7389880590428385280-gZFv
- Bulls team member account with demo/source references: https://www.linkedin.com/posts/vikranth-udandarao_fintech-hackathon-sebi-activity-7383834558556921856-JsUM
- Ayush Arya Kashyap account of InvestShield: https://www.linkedin.com/posts/ayush-arya-kashyap_globalfintechfest-sebi-fintech-activity-7381958046941573120-dH5v
- Amritha S account of InfoCrux: https://www.linkedin.com/posts/amritha-s-oo_globalfintechfest-sebi-fintech-activity-7382679565133025280-LRmL
- OnFinance public product baseline: https://onfinance.ai/
- OnFinance account of its 2025 first prize: https://onfinanceainewsletter.beehiiv.com/p/onfinance-ai-s-big-moment-at-global-fintech-fest-2025

## 34. Fact-Check of the Supplied 2025 Winner List

Use the supplied list only after applying these corrections:

| Supplied claim | Verdict | Safe wording |
| --- | --- | --- |
| `OnFinance AI was Winner 1` | Partly supported | OnFinance was in the organizer's Top 6 and later reported winning first prize for ComplianceOS. The official SEBI page located in this research does not publish a final rank table. |
| `NeoGPT and agent-based ComplianceOS` | Supported at a general level | OnFinance publicly describes NeoGPT and AI agents for interpreting circulars, actionables, tasks, evidence, and reports. |
| `Exactly three named agents completely automate the workflow` | Not sufficiently supported | Do not repeat the exact three-agent taxonomy or `completely automate` unless a primary product or competition source confirms it. |
| `Getclarity.finance built the described broker-backend anomaly suite and placed second` | Unverified | The organizer confirms only that Getclarity.finance was Top 6. No reliable public source found here supports the rank or detailed architecture. |
| `Wecode built the described open-API surveillance module and placed third` | Unverified | The organizer confirms only that Wecode was Top 6. Do not use the detailed product story or rank. |
| `Sudarshan was a 2025 hackathon winner` | Contradicted by the finalist list | Sudarshan does not appear in the organizer's Top 6. Public 2026 reporting describes SudarshanAI as a SEBI-deployed or in-house enforcement tool, not evidence of a 2025 contestant winner. |
| `Bulls had multilingual risk simulations` | Partly supported | The sourced description is an interactive, data-driven India Investors Dashboard for investor education; the team reports fourth place, Jury Recommendation, and sandbox onboarding. The added implementation details were not verified. |
| `InvestShield was an in-app UX guardrail preventing over-leverage` | Partly supported | The participant confirms an AI-powered multi-feature fraud-detection system and Jury Recommendation. The UX-layer and trade-blocking description was not verified. |
| `A finalist bond-tokenization prototype used smart contracts` | Unsupported | The 2025 challenge included bond liquidity, but no reliable source found here ties this prototype to the named Top 6. |
| `Innovation Rating 85-98/100` | Editorial, not evidence | Remove all invented ratings. They were not jury scores. |

The useful lesson is not that `more agents` won. The useful lesson is that a mature category product with a finance-specific model, operational workflow, and enterprise credibility could win. RegOS must therefore outperform on **inspectability, safe failure, applicability, change propagation, and measurable assurance**, not imitate ComplianceOS's public feature list.

## 35. Scalable Innovations That Do Not Duplicate the Public Baseline

These ideas were selected against the public OnFinance feature baseline. They are designed to deepen the same focused product rather than create unrelated modules.

### Innovation A: Regulatory Coverage Ledger

**Problem:** An extraction system can show many correct obligations while silently missing one important clause. A polished task list does not prove coverage.

**Product:** Every normative source segment receives one explicit state:

- `Compiled obligation`
- `Informational only`
- `Duplicate or superseded`
- `Out of profile scope`
- `Ambiguous: human review required`

The UI reports source coverage, unresolved segments, reviewer decisions, and clause-level lineage. It never implies that a document is fully processed while normative text remains unclassified.

**Why it scores:** It converts model recall from a hidden technical metric into a regulator-inspectable control. No equivalent clause-coverage artifact was found in the public competitor material reviewed.

**Scope:** Add to P0 because it reuses the source segmentation, exception queue, and audit model already required.

### Innovation B: Applicability Receipt

**Problem:** `This rule does not apply to us` is itself a material compliance decision, but ordinary task systems often leave no durable proof of why an obligation was excluded.

**Product:** For every applied or excluded obligation, generate a compact receipt containing:

- cited applicability condition;
- relevant entity-profile facts;
- deterministic rule result;
- model suggestion, if used;
- human confirmation and reason;
- source, schema, and decision versions.

**Why it scores:** It audits negative decisions as rigorously as positive tasks. This is directly useful to a small intermediary and to an inspector reviewing why work was not assigned.

**Scope:** P0 artifact inside the existing applicability and Inspector Mode flow.

### Innovation C: Obligation Test Harness

**Problem:** Assigning a task and collecting a file does not establish that the evidence actually satisfies the obligation.

**Product:** Compile each approved obligation into a constrained acceptance-test specification, for example:

```text
Required evidence type: signed assessment report
Required period: current reporting cycle
Required owner: approved CISO role
Required fields: scope, findings, closure status, approval date
Freshness rule: expires when source version or reporting cycle changes
Execution mode: read-only metadata and document checks
```

The harness runs only pre-approved checks against synthetic or locally supplied evidence. It reports `pass`, `fail`, or `human judgment required`; it does not modify production systems or make a legal determination.

**Why it scores:** It moves from task management to continuous, testable assurance while remaining feasible and safe.

**Scope:** Show one vertical-slice test in Round 02; keep broad control-as-code coverage in P1.

### Innovation D: Compliance Build Manifest

**Problem:** After the model, schema, source, or human interpretation changes, a firm must be able to reproduce what the system knew and published at that time.

**Product:** Every approved compliance release creates a signed, hash-linked manifest containing:

- source document identifiers and hashes;
- obligation and applicability versions;
- model, prompt, retrieval, and schema versions;
- benchmark result and assurance status;
- reviewer approvals;
- unresolved exceptions;
- generated tasks, controls, and evidence requests.

Think of it as a reproducible software build record for compliance logic, not a blockchain pitch.

**Why it scores:** It makes Inspector replay concrete and creates a strong audit artifact without claiming immutability or decentralization.

**Scope:** P0 as a downloadable artifact built from existing audit events.

### Innovation E: Corpus Pack and Active-Learning Loop

**Problem:** `We can add more regulations` is not a scalability method.

**Product:** A versioned corpus pack contains source adapters, taxonomy mappings, applicability definitions, labeled examples, test cases, and known failure types. Human corrections from ambiguous cases become proposed benchmark examples only after review, preventing silent self-training.

**Why it scores:** It gives a measurable answer to how RegOS expands from one SEBI source family to another without rebuilding the system.

**Scope:** Define the format in Round 01, prove it on one corpus in Round 02, and use a second small corpus as the scalability test before the final jury.

### Priority order

1. **Coverage Ledger:** strongest new P0 visual and trust differentiator.
2. **Applicability Receipt:** inexpensive, highly aligned, and useful in jury Q&A.
3. **Compliance Build Manifest:** turns existing provenance into a memorable artifact.
4. **One Obligation Test:** strongest Round-02 technical climax after Reg-Diff.
5. **Second Corpus Pack:** required before claiming scalable regulatory coverage.

Do not add all five as five equal product modules in the pitch. Present them as one assurance chain:

`No clause silently disappears -> every applicability decision has a receipt -> every obligation has a test -> every approved release is reproducible -> every new corpus must pass the same pack.`

This is the refined innovation claim:

> RegOS does not merely automate compliance work. It makes the translation from regulation to action coverage-aware, applicability-provable, testable, and reproducible.

## 36. Pitch-Ready Feature Presentation

This section is the assembly order for the PDF pitch deck and the 112-second Remotion film. Earlier feature lists provide detail; this section controls presentation.

### Naming hierarchy

Use only these labels as major on-screen concepts:

1. **Compliance Twin**: the whole product
2. **Coverage Ledger**: proves the source was fully classified
3. **Inspector Mode**: proves the AI can be examined and corrected
4. **Applicability Receipt**: proves why a duty applies or does not
5. **Reg-Diff**: proves amendments propagate into operational work
6. **Compliance Build Manifest**: proves the approved release can be reproduced

Treat exception queues, hashes, schema versions, evidence freshness, test harnesses, benchmarks, and assurance metrics as supporting controls inside those six concepts. Do not give each one a separate headline slide.

### Ten-slide deck order

| Slide | Purpose | Headline | Features shown | Visual proof |
| --- | --- | --- | --- | --- |
| **1. Purpose** | Establish the transformation | **From regulatory text to operational action** | Compliance Twin only | One source document transforms into an active obligation graph |
| **2. Problem** | Explain the manual gap | **Rules arrive as text. Compliance runs as work.** | None | Circular, spreadsheet, email, task, and evidence fragments remain disconnected |
| **3. User and urgency** | Make impact concrete | **Lean compliance teams must interpret every change without missing one duty** | Small-RE profile | One compliance officer facing multiple circular versions and evidence requests |
| **4. Product overview** | Reveal the complete system | **Understand. Decide. Stay audit-ready.** | Six-step pipeline inside three groups | `INGEST -> COMPILE -> VERIFY -> APPLY -> DIFF -> PROVE` |
| **5. Understand** | Show translation quality | **Every clause accounted for. Every obligation cited.** | Coverage Ledger, clause-cited compiler | Source clause connects directly to structured fields; unresolved segment remains visible |
| **6. Decide safely** | Demonstrate responsible AI | **Uncertainty stops the machine, not the audit trail** | Inspector Mode, exception queue, human approval, Applicability Receipt | Ambiguous deadline blocks publish; reviewer chooses the supported interpretation |
| **7. Operate** | Show real workflow value | **One living Compliance Twin for owners, controls, deadlines, and evidence** | Obligation lifecycle, assignment, evidence state | Approved obligation activates with owner, control, due date, and evidence requirement |
| **8. Change climax** | Deliver the memorable differentiator | **When regulation changes, RegOS shows what breaks** | Reg-Diff, impact map, evidence freshness, one obligation test | Amendment changes a deadline; linked evidence becomes stale; test changes from pass to review |
| **9. Prove and scale** | Answer feasibility and scalability | **Every release is reproducible. Every source and evidence connector must pass the same gates.** | Build Manifest, Sandbox Test Pack, benchmark, Corpus Packs, Evidence Connectors | Manifest expands into source/model/schema/reviewer/test records; SEBI/NSE/BSE/CDSL/NSDL packs and read-only connectors appear as a restrained roadmap band |
| **10. Ask** | Define the next institutional step | **One corpus. One synthetic profile. One controlled pilot.** | No new feature | Sandbox path: benchmark, design-partner review, 90-day pilot |

### Slide-density rules

- One headline, one proof visual, and at most three short support labels per slide.
- Never show the complete feature inventory on one slide.
- Slides 5, 6, and 8 are the three product-proof slides; give them the largest UI surfaces.
- Slide 8 is the visual climax, not the architecture slide.
- P1 features appear only as a small roadmap band on Slide 9.
- Vision appears as one closing sentence or Q&A answer, never as a demo sequence.

### 112-second Remotion order

| Time | Story beat | Feature group | Required motion |
| --- | --- | --- | --- |
| `00:00-00:07` | Hook | Problem | Typewriter words: `Rules arrive as text.` then `Compliance runs as work.` |
| `00:07-00:14` | Brand | Compliance Twin | Sentinel icon rises through glow; wordmark slides out; tagline types below |
| `00:14-00:27` | Ingest | Coverage Ledger | Circular enters center; normative clauses illuminate sequentially; coverage counter resolves with one amber ambiguity |
| `00:27-00:43` | Compile | Clause-cited obligations | Document fragments snap into obligation cards; citation beams remain visibly connected |
| `00:43-01:03` | Verify | Inspector Mode | Cursor opens one field; competing spans appear; publish locks; reviewer corrects and approves |
| `01:03-01:17` | Apply | Applicability Receipt | Small-RE profile slides in; rule, model, and human decisions resolve in three distinct rows; receipt seals |
| `01:17-01:35` | Diff | Reg-Diff | Amendment drops; old/new fields split; obligation changes; a simulated read-only connector refreshes evidence metadata; evidence turns stale; one test moves to review |
| `01:35-01:46` | Prove | Build Manifest | Audit events stack into a manifest; benchmark and sandbox gates verify one by one |
| `01:46-01:52` | Ask | Controlled pilot | Colossal word swap: `ONE CORPUS -> ONE PROFILE -> ONE PILOT` with live caret |

### Feature-to-motion grammar

- **Coverage:** sequential line illumination and a resolving counter, never random particles.
- **Compilation:** fragments snapping into a stable schema with a short overshoot.
- **Verification:** deliberate cursor push-in, focus mask, blocked-state shake, and human-confirmation settle.
- **Applicability:** branching tree motion followed by a receipt seal.
- **Change:** split-screen field swap, dependency-line propagation, then stale-evidence state change.
- **Proof:** layered audit events compressing into one clean signed manifest.

Use jitter and velocity echoes only during state transitions. The resting UI must remain stable and readable. Motion should communicate causality: the judge should always see which source event caused which operational result.

### Presenter script in eight sentences

1. `SEBI publishes rules as human-readable text, but intermediaries must execute them as structured work.`
2. `RegOS Sentinel builds a living Compliance Twin from that gap.`
3. `Its Coverage Ledger accounts for every normative clause before the system claims completion.`
4. `Each proposed obligation remains connected to the exact source text that supports every field.`
5. `Inspector Mode blocks uncertain interpretations and keeps the compliance officer in control.`
6. `The Applicability Receipt records why a duty applies, or why it was excluded, for this intermediary.`
7. `When the source changes, Reg-Diff propagates the impact into obligations, owners, controls, and evidence.`
8. `The Compliance Build Manifest makes every approved release testable, reproducible, and ready for a controlled SEBI sandbox evaluation.`

### Final presentation rule

Do not pitch `thirty features`. Pitch one controlled transformation:

> **RegOS understands the rule, helps the intermediary decide safely, and keeps the resulting compliance state audit-ready through every amendment.**

## 37. Problem Statement 2 Alignment

RegOS Sentinel is an entry for **Problem Statement 2, RegTech: Agentic Compliance - From Regulatory Text to Operational Action**.

It addresses both parts of the official problem:

1. **Dynamic regulatory translation:** ingest a new or amended source, classify its clauses, compile cited obligations, determine applicability, and identify operational impact.
2. **Ongoing compliance management:** maintain owners, controls, deadlines, evidence, gaps, amendment history, tests, and an auditable release record.

### How the two extensions fit PS2

**Multi-authority Corpus Packs** extend regulatory translation beyond one initial SEBI source family. The scale path is:

`Validated SEBI corpus -> additional SEBI pack -> NSE/BSE packs -> CDSL/NSDL packs`

Every pack must include source adapters, version identity, taxonomy mappings, applicability definitions, labeled test cases, and known failure types. Cross-source overlap is flagged for review; RegOS does not autonomously resolve legal conflicts.

**Read-only Evidence Connectors** strengthen ongoing compliance management. They can retrieve approved metadata from task systems, document repositories, training systems, and control records, then link it to an obligation and evaluate completeness and freshness.

They do not prove legal sufficiency by themselves. The Obligation Test Harness returns `pass`, `fail`, or `human judgment required`, and material conclusions remain human-approved.

### Pitch boundary

- **Round 01:** describe the Corpus Pack architecture and one simulated Evidence Connector.
- **Round 02:** demonstrate one SEBI source family and one simulated read-only evidence flow.
- **Final jury:** show a second small Corpus Pack as scalability evidence if it has actually passed the same evaluation gates.
- Never claim live NSE, BSE, CDSL, NSDL, Jira, or ServiceNow integration until it exists and is tested.

The PS2 submission sentence remains:

> RegOS Sentinel converts regulatory text into clause-cited, applicability-aware operational obligations and maintains their owners, controls, evidence, amendments, and approvals in a human-supervised Compliance Twin.
