# RegOS Sentinel: Premium SaaS UI Motion Blueprint

Date: 2026-07-12  
Target: `regos-motion` at 1920x1080, 60 fps  
Audience: SEBI TechSprint jury  
Goal: make the product feel operational, supervised, fast, and premium.

## 1. What the Trackly reference is actually doing

The reference is not driven by random jitter. Its energy comes from alternating quiet, highly legible statement beats with short bursts of coordinated motion.

1. A typed or word-revealed problem statement floats over a slowly breathing light field.
2. A product device rises into the center while notifications arrive one at a time.
3. A bright contrast flash resets attention.
4. The app icon assembles first, the wordmark slides from behind it, and the tagline types below.
5. The product returns in progressively tighter crops so the viewer reads one interaction at a time.
6. Filters change, results reorder, and counters animate to prove that the interface is live.
7. Colossal typography with a live caret creates a high-contrast narrative beat.
8. The close is nearly static because the previous kinetic sequence has already earned attention.

The motion feels expensive because every visible change has a cause. A cursor clicks, a control depresses, a state changes, a result appears, and the camera reframes the consequence.

## 2. Transferable premium SaaS patterns

### A. Interaction-causality chain

Never animate a panel with no reason. Use this chain:

`cursor approach -> hover acknowledgement -> press -> control depression -> state mutation -> result cascade -> camera settle`

### B. Peak-velocity match cuts

Move the outgoing scene decisively in one direction and cut when it is moving fastest. The next scene continues that direction. The cut is hidden inside velocity and motion blur.

### C. Layered depth

Foreground cursor and notification layers travel faster than the product panel. Background glow travels slowest. This gives a 2.5D camera effect without needing full 3D.

### D. One proof per push-in

Each camera move should land on exactly one useful product truth: source citation, human approval, owner assignment, evidence upload, change-impact result, or audit export.

### E. Stable reading state

Kinetic entrances can be sharp, but the destination must hold long enough to read. Do not jitter a settled citation, obligation, metric, or compliance statement.

## 3. Motion tokens at 60 fps

| Token | Frames | Behavior |
| --- | ---: | --- |
| `microPress` | 6-8 | Cursor scales to 0.86; target scales to 0.97 and darkens slightly |
| `hoverAck` | 6 | Border/fill changes before click; no glow explosion |
| `uiEnter` | 20-26 | Y 28px to 0, scale 0.96 to 1, opacity 0 to 1 |
| `notificationSpring` | 22-28 | Y 34px to 0, scale 0.88 to 1.025 to 1 |
| `listStagger` | 4-6 | Delay between related result rows |
| `heroRise` | 30-38 | Y 150px to 0, scale 0.82 to 1, rotationX 7deg to 0 |
| `cursorTravel` | 28-42 | Curved path with fast middle and slow arrival |
| `cameraPush` | 30-42 | Scale 1 to 1.7-2.3 with coordinated pan and mild motion blur |
| `matchCut` | 16-22 | Directional exit; cut at maximum velocity |
| `typeChar` | 2-3 | Frames per character; pause 12-20 frames at punctuation |
| `wordReveal` | 5-7 | Delay between words; 12-18px rise plus opacity |
| `contrastFlash` | 6-10 | Full-field light/dark swap, then immediate settle |
| `velocityJitter` | 4-6 | 3-frame directional overshoot, max 6px; only during cuts |
| `readHold` | 90-150 | Stable hold for important UI or judge-facing copy |

Use steep ease-out curves for entrances and camera moves. Keep overshoot under 2.5% on product panels and under 5% on small icons. No elastic wobble on text.

## 4. RegOS signature sequence map

### Sequence 1: Regulatory input

Type into a command/search field:

`Ingest SEBI circular: Cybersecurity and Cyber Resilience Framework`

The caret advances in real time. On Enter, the field compresses upward and becomes a source chip with an ingestion check.

### Sequence 2: The compiler wakes up

The RegOS cockpit rises center-screen. Five small agent-status notifications arrive in sequence:

- Watcher: source detected
- Interpreter: 17 clauses parsed
- Mapper: 12 obligations linked
- Evidence: 8 controls requested
- Auditor: citation coverage verified

These should be real Remotion components, not generated raster cards.

### Sequence 3: Human supervision

The cursor pushes into one obligation. A source clause highlights on the left; a citation connector draws to the obligation card on the right. The cursor clicks `Approve draft`. The button depresses, the status changes to `Human approved`, and an audit event appears.

### Sequence 4: Change-impact climax

Colossal caret typography:

`FROM WEEKS|`

Delete `WEEKS`, type `MINUTES`, and flip from royal blue to off-white during the replacement. Cut immediately into the change-impact simulator where affected controls, owners, and tasks count upward.

### Sequence 5: Logo close

The rounded-square icon scales from 0.3 to 1.04 to 1 while a restrained royal-blue bloom expands behind it. The `RegOS Sentinel` wordmark reveals horizontally from behind the icon. The tagline types below:

`Every obligation. Cited, owned, evidenced.`

## 5. How to use jitter correctly

The desired effect is a velocity accent, not camera shake.

- Apply it only in the 4-6 frames around a cut, click impact, or word replacement.
- Offset the main layer by no more than 6px horizontally and 2px vertically.
- Add one teal ghost edge at 15-20% opacity, delayed by one frame.
- Add directional blur during the fastest two frames.
- Return to exact pixel alignment immediately.
- Never apply it to body copy, tables, citations, or long holds.

## 6. Unified color and material system

- Royal blue: `#1B3FB8`
- Deep blue: `#16349A`
- Off-white: `#F4F4F0`
- Teal accent: `#2DD4BF`
- Near-black: `#070B1A`

Use royal blue for identity and large fields, off-white for contrast resets, teal for state change and evidence, and near-black for the cinematic void. Do not introduce purple, magenta, lime, orange, or generic rainbow chromatic aberration.

## 7. Canva generation rules

Canva should generate atmosphere and isolated product metaphors only. It should not generate:

- interface screens
- notification cards
- readable labels or metrics
- cursors
- logo wordmarks
- obligation tables
- citation text

Those elements need to be code-driven in Remotion so they remain sharp, editable, and causally animated.

Use these settings for every video plate: `Video clip`, `Ultra`, `Cinematic`, `16:9`, `No audio`, `Wide shot`, `Soft light`. Ask for a locked or extremely slow camera so the generated plate does not fight the coded camera move.

## 8. Refined Canva prompt pack

### P1. Sentinel signal void

Slow seamless cinematic background plate, a restrained royal-blue light field (#1B3FB8) breathing at the center of a near-black void (#070B1A), a narrow teal signal core (#2DD4BF) pulsing once every two seconds, faint architectural grid lines appearing only near the center, subtle fine film grain, deep clean negative space around the edges, locked camera, extremely slow motion, premium enterprise SaaS launch-film atmosphere, 16:9, no objects, no interface, no logo, no text, no purple, no magenta, no lens flare, no audio.

### P2. Regulatory signal sweep

Seamless slow-motion plate of thin royal-blue (#1B3FB8) and teal (#2DD4BF) luminous ribbons travelling diagonally through a near-black field (#070B1A), the ribbons behaving like ordered data signals rather than fabric, occasional fine white particles travelling along the paths, high-end RegTech visual language, crisp center with soft falloff at the edges, locked wide camera, subtle grain, 16:9, no objects, no UI, no text, no purple, no cyan rainbow, no audio.

### P3. Document-to-obligation transformation

Cinematic wide composition on a solid deep royal-blue field (#16349A): on the left, clean white regulatory document sheets break into precise rectangular fragments; the fragments travel horizontally and reorganize into a structured graph of teal nodes (#2DD4BF), thin white connections, and aligned royal-blue blocks on the right; controlled mechanical transformation, no explosion, no chaos after the first moment, premium enterprise software aesthetic, locked camera, soft studio light, subtle grain, 16:9, no text, no logos, no people, no purple, no magenta, no audio.

### P4. Human-approval pulse

Minimal cinematic loop on near-black (#070B1A): a single thin hexagonal outline in royal blue (#1B3FB8) forms at the center, a teal verification pulse (#2DD4BF) travels around its perimeter, then the center fills briefly with off-white light (#F4F4F0) and settles, restrained luminous bloom, precise and institutional rather than futuristic or cyberpunk, locked camera, 16:9, no text, no checkmark, no logo, no interface, no purple, no neon overload, no audio.

### P5. Light contrast beat

Ultra-minimal off-white background plate, exact base color #F4F4F0, a pale royal-blue illumination (#1B3FB8 at low opacity) passes quickly through the center and leaves a clean airy field, one faint teal glint (#2DD4BF), extremely subtle fine grain, locked camera, premium SaaS launch-film transition plate, 16:9, no objects, no text, no logo, no purple, no warm beige, no audio.

### P6. Compliance monolith, upgraded still

A monumental vertical 3D structure built from hundreds of regulatory document sheets: the lower third is loose white pages and partially aligned circulars, the middle third transforms into precise interlocking royal-blue glass blocks (#1B3FB8), and the upper third becomes a perfectly ordered crystalline obligation graph with thin teal light seams (#2DD4BF); a small off-white human-approval gate is visibly embedded near the top, viewed slightly from below, full structure from base to crown, isolated on a perfectly flat off-white background (#F4F4F0), crisp studio lighting, premium enterprise product sculpture, portrait 9:16, no text, no people, no purple, no black background, no surrounding scenery.

### P7. Dark logo bloom

Slow seamless cinematic loop, a compact royal-blue glow (#1B3FB8) blooms behind an empty central area on a pure near-black background (#070B1A), a thin teal halo (#2DD4BF) expands once and fades, the bloom breathes with restrained intensity, locked camera, high-end SaaS app launch aesthetic, 16:9, no icon, no logo, no text, no objects, no particles crossing the center, no purple, no magenta, no audio.

## 9. Current deck gap

The current stills have a coherent royal-blue/off-white editorial system, but the deck is still mostly composed as pages. The strongest upgrade is not more generated imagery. It is to turn the existing cockpit into a recurring live product actor and use generated imagery only as atmosphere between proof moments.

The title monolith can remain as one brand image. After that, product behavior should dominate.

## 10. Reference research

- Jitter UI animation templates: https://jitter.video/templates/ui-elements/
- Jitter cursor template: https://jitter.video/template/cursor/
- Jitter click animation technique: https://help.jitter.video/en/articles/9909561-create-a-click-animation
- Jitter logo animation templates: https://jitter.video/templates/logos/
- Jitter text animation templates: https://jitter.video/templates/text/
- Current SaaS motion workflow example: https://www.youtube.com/watch?v=Jccbzpicst8

## 11. Hackathon win audit

### Official evaluation frame

The public TechSprint page names five criteria: Market Impact, Technology Stack, Feasibility, Scalability, and Alignment with SEBI's Mandate. No official weights are published, so this audit uses an even 20 points per criterion.

Source: https://hackculture.io/hackathons/sebi-securities-market-techsprint

### Honest score today

| Criterion | Round-01 idea score | Final-winning readiness today | Reason |
| --- | ---: | ---: | --- |
| Market impact | 18/20 | 17/20 | Strong, current pain and a focused small-broker wedge; still lacks direct user validation from a compliance officer |
| Technology stack | 18/20 | 13/20 | Excellent architecture and trust design on paper; no implemented application or measured model pipeline yet |
| Feasibility | 17/20 | 8/20 | Organizers explicitly state that no prototype is required in Idea Submission; the public corpus and narrow workflow are feasible, but `regos-sentinel/` is currently empty for later rounds |
| Scalability | 17/20 | 15/20 | Reusable obligation schema and corpus packs are credible; cost, latency, onboarding effort, and review capacity remain unmeasured |
| SEBI mandate alignment | 19/20 | 19/20 | Literal PS2 fit, investor-protection posture, citations, human gates, and sandbox path |
| **Total** | **89/100** | **72/100** | Strong shortlist candidate; not yet a credible final winner without a working golden path |

### Target after the minimum winning build

| Criterion | Target |
| --- | ---: |
| Market impact | 19/20 |
| Technology stack | 19/20 |
| Feasibility | 18/20 |
| Scalability | 18/20 |
| SEBI mandate alignment | 19/20 |
| **Total** | **93/100** |

The previous internal 93-point ceiling describes the quality of the idea. It must not be presented as current product readiness.

## 12. What must be added to become winner-grade

### P0: one real golden path

Build one end-to-end flow before expanding features:

1. Load one real public SEBI circular or master-circular section.
2. Extract 8-15 structured obligations with exact source spans.
3. Route low-confidence items to human review.
4. Approve one obligation and create one owned task.
5. Apply one simulated amendment and show added, changed, and superseded obligations.
6. Export a small audit pack containing the source, extracted fields, model/schema version, approval, and action log.

This is more valuable than showing five broad but disconnected dashboard modules.

### P0: Inspector Mode

Add a right-side inspector drawer for the selected obligation:

- verbatim source clause
- document and clause identifier
- extraction confidence
- model/provider version
- prompt/schema version
- applicability rule
- human reviewer and timestamp
- previous and current values
- replay decision
- pause/kill agent control
- hash-chain event identifier

This directly turns SEBI's AI-governance expectations into visible product behavior. It is the strongest differentiation against a generic compliance copilot.

### P0: actual evaluation harness

Create a labeled set of at least 50 obligations and report:

- obligation precision and recall
- citation correctness
- field-level accuracy for actor, action, deadline, evidence, and applicability
- human-edit rate
- low-confidence routing rate
- processing time and estimated cost per document

Do not display `100% citation coverage`, `127 obligations`, or `<3 min` as product results until the numbers are reproducible. Before then, label them `seeded demo`, `illustrative`, or `target`.

### P1: applicability switcher

Let the same circular run against `Small`, `Mid-size`, and `Qualified` regulated-entity profiles. The resulting obligation set should visibly change. This proves that RegOS understands applicability rather than merely summarizing documents.

### P1: Reg-Diff

Make supersession and contradiction detection a named interface, not a hidden verification detail. Show:

- unchanged
- wording changed
- deadline changed
- obligation added
- obligation superseded
- applicability changed

### P2: keep secondary ideas secondary

SupTech heatmaps, DigiLocker, Bhashini, public-chain anchoring, broad connector catalogs, and enforcement-risk overlays are credible expansion paths. They should not consume the main demo until the golden path works.

## 13. The 112-second submission film

Target length: **1:52**.  
Frame rate: **60 fps**.  
Composition: **70% product proof, 20% kinetic narrative, 10% brand and ask**.  
Truth status before implementation: **prototype visualization using public sources and synthetic entity/evidence data**.

### Shot-by-shot plan

| Time | Job | Visual and motion | Voiceover intent |
| --- | --- | --- | --- |
| 00:00-00:07 | Hook | Dark signal void. Type: `A new SEBI circular lands.` Then three caret prompts: `What changed?` `Who owns it?` `What proves compliance?` | State the operational gap, not a broad market introduction |
| 00:07-00:14 | Promise | App icon assembles; wordmark slides from behind; tagline types. One sharp blue-to-off-white contrast beat | RegOS turns regulatory text into cited, supervised action |
| 00:14-00:27 | Real input | Real SEBI document thumbnail rises. Cursor drags it into the cockpit. Source metadata locks into place | Name CSCRF or Stock Broker Master Circular and say it is a real public source |
| 00:27-00:43 | Compiler wakes | Cockpit rises center-screen. Watcher, Interpreter, Verifier, Mapper, Evidence, and Auditor status cards arrive sequentially. Obligation counter grows only to the seeded or actual count | Explain the pipeline in one sentence, not six feature descriptions |
| 00:43-01:03 | Trust proof | Cursor opens an obligation. Camera pushes into split view: highlighted source clause left, structured obligation right. Inspector Mode slides in. Cursor approves; audit event appears | Every output is traceable, versioned, reviewable, and human-approved |
| 01:03-01:17 | Applicability | Cursor changes entity profile from Small to Mid-size. Non-applicable rows collapse; new rows cascade; explanation chip appears | Prove this is a compliance compiler, not document summarization |
| 01:17-01:35 | Climax | Colossal `WEEKS|` on royal blue. Delete and type `MINUTES|` as background flips off-white. Match-cut into Reg-Diff; added/changed/superseded obligations count in | A new circular's operational impact becomes visible in minutes |
| 01:35-01:46 | Governance and output | Cursor opens model replay, briefly shows pause/kill control, then exports a compact audit pack. Pages stack with source, obligation, approval, and log | Emphasize accountability and sandbox inspectability |
| 01:46-01:52 | Ask | Dark logo bloom. Three verified or explicitly labeled target metrics. Final line: `Built for SEBI Innovation Sandbox.` | Ask for mentorship and one broker/industry-body pilot |

### Suggested voiceover

```text
A new SEBI circular lands. For a small broker, the hard part starts now: what changed, who owns it, and what proves compliance?

RegOS Sentinel compiles regulatory text into clause-cited operational action, with every AI step supervised.

Load a real public SEBI source, such as the Cybersecurity and Cyber Resilience Framework. Watcher detects the document. Interpreter extracts structured obligations. Verification grounds each field to a verbatim clause. Mapper assigns owners, deadlines, and evidence.

Open any obligation and RegOS shows the exact source span, confidence, applicability rule, model and schema version, and review history. Approve the draft and the human decision becomes an auditable event.

Change the entity profile and the obligation graph changes with it. Small, mid-size, and qualified entities see only what applies to them.

When an amendment lands, Reg-Diff identifies what was added, changed, or superseded, then regenerates the affected controls and tasks. Work that takes weeks becomes visible in minutes.

Inspector Mode can replay a decision, pause the agent, and export a source-linked audit pack. Public documents, synthetic entity and evidence data, no PII.

RegOS Sentinel is built for SEBI Innovation Sandbox: measurable, human-gated, and ready for a focused broker pilot.
```

## 14. Motion grammar for the 112-second film

### Three visual worlds

1. **Near-black signal void** for the hook, logo, and final ask.
2. **Royal-blue product stage** for cockpit and agent activity.
3. **Off-white inspection field** for citations, Reg-Diff, and contrast beats.

The film should switch worlds only when the narrative changes. Do not place every scene on a continuously moving aurora.

### Adaptation from the 05:28 reference

The useful pattern is colossal typography sharing depth with one vertical artifact, followed by a full-field color wipe into a contrasting editorial/product scene. For RegOS:

- replace the generic architecture with the compliance monolith only on the title beat
- let `REGOS SENTINEL` pass behind the monolith
- dissolve the monolith into document fragments
- match-cut those fragments into the real source-ingestion screen
- use the reference's large type only for the hook and `WEEKS -> MINUTES`, not every section

### Adaptation from the 06:29 Jitter references

- coordinated color reveal: royal blue -> teal accent -> off-white, never rainbow rotation
- logo square rises and expands before the field changes color
- background color reveals happen through a moving shape or mask, not a plain dissolve
- ripple is appropriate for approval or verification, not for every click
- jitter remains a 4-6 frame transition accent

### Product push-in recipe

1. Cursor travels on a curved path for 32-38 frames.
2. Target acknowledges hover for 6 frames.
3. Cursor and target depress together for 6-8 frames.
4. Target state mutates on the lowest point of the press.
5. Camera begins pushing 2 frames after the state mutation.
6. Foreground cursor moves 1.3x faster than the interface plane.
7. Camera settles for at least 90 frames on the proof.

### Transition rules

- Use match cuts or masked field wipes between major states.
- Cut at peak velocity, not after the outgoing layer has stopped.
- Direction must persist across the cut.
- Avoid global fades except for the final close.
- Remove the current repeated 15-frame linear fade between every demo beat.

## 15. Deck changes that support the film

The PDF deck and video should share evidence but not duplicate each other frame-for-frame.

1. S01: brand, literal PS2 promise, one product/monolith image.
2. S02: one problem statement, the 95% intermediary-perspective statistic with exact source footer, and the manual translation gap.
3. S03: why now: Reg 16C, responsible AI/HITL, and 2026 rulebook change.
4. S04: one large readable cockpit, not a tiny screenshot beside a paragraph.
5. S05: agent pipeline plus verification and human gate, with fewer words.
6. S06: Inspector Mode as the main visual proof of trust.
7. S07: Reg-Diff/change-impact simulator as the visual and narrative climax.
8. S08: actual benchmark methodology and measured results, or clearly labeled targets.
9. S09: honest OnFinance/Corlytics contrast and the small-RE sandbox wedge.
10. S10: a concrete ask: sandbox mentorship, one design partner, and a 90-day pilot.

## 16. Claims and truth-labeling lock

- `Aarohan Securities` must be labeled as a synthetic entity.
- Evidence must be labeled synthetic.
- A simulated amendment must be labeled simulated.
- Do not show a GitHub URL until the repository exists and is accessible.
- Do not imply that an animated Remotion UI is a working product.
- Use `prototype visualization` in Round 01 and replace it with `working prototype` only after the golden path runs.
- Replace seeded metrics with measured values before Round 02.
- Keep the exact SEBI Investor Survey framing: the intermediary survey reports complexity and lack of information as a key barrier at 95%; it is not a measurement of RegOS's customer demand.

## 17. Primary sources added in the win audit

- TechSprint overview, process, and five evaluation criteria: https://hackculture.io/hackathons/sebi-securities-market-techsprint
- Official SEBI TechSprint launch: https://www.sebi.gov.in/media-and-notifications/press-releases/jun-2026/launch-of-securities-market-techsprint-at-global-fintech-fest-2026-gff-26-_102286.html
- Official SEBI Intermediaries Amendment Regulations 2025: https://www.sebi.gov.in/legal/regulations/feb-2025/securities-and-exchange-board-of-india-intermediaries-amendment-regulations-2025_91809.html
- SEBI responsible AI/ML consultation paper: https://www.sebi.gov.in/reports-and-statistics/reports/jun-2025/consultation-paper-on-guidelines-for-responsible-usage-of-ai-ml-in-indian-securities-markets_94687.html
- SEBI Investor Survey 2025 report: https://www.sebi.gov.in/sebi_data/commondocs/jan-2026/Investor%20Survey%202025%20Main%20Report.pdf
- Devpost demo-video guidance: https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video
- JetBrains judging-table guidance: https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/
