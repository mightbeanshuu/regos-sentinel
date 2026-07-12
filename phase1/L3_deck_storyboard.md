# L3 — IDEA DECK Storyboard: RegOS Sentinel (PS2)

> Phase 1 Loop L3 · Remotion SaaS-level motion graphics · Composer 2.5 implementation spec  
> Product: **RegOS Sentinel** · Problem Statement: **PS2 — Agentic Compliance**  
> Sources: `judge_pitch.md`, `flagship_project.md`, `winning_product_build_spec.md`, `approach-refinement.md`  
> Template study: [remotion-dev/template-prompt-to-motion-graphics-saas](https://github.com/remotion-dev/template-prompt-to-motion-graphics-saas), [remotion-dev/remotion](https://github.com/remotion-dev/remotion)

---

## 0. Deck brief (read before coding)

| Spec | Value |
| --- | --- |
| Purpose | Hackathon **idea deck** for SEBI TechSprint judges — not a YC startup pitch |
| Audience | SEBI / MII / jury: care about PS alignment, trust, sandbox readiness, operational action |
| Format | Remotion composition · **1920×1080** · **30 fps** · **~95–110 s** total |
| Slide count | **10 slides** (within 8–12) |
| Tone | Regulator-trust SaaS · crisp · evidence-first · zero purple-AI cliché |
| Output file | Single composition `IdeaDeck` in `Root.tsx`; each slide = named `Sequence` / `TransitionSeries.Sequence` |
| Constants-first | All copy, colors, timings as top-of-file `const` (template SaaS pattern) |

### Narrative spine (judge ladder)

```text
Problem (manual circular→action)
  → Contrast (chatbot ≠ compliance OS)
  → Solution (RegOS Sentinel)
  → Mechanism (5 supervised agents)
  → Trust (citations + human gates)
  → Climax (change-impact: weeks→minutes)
  → Proof (metrics + corpus)
  → SEBI value (SupTech + sandbox)
  → Ask (pilot path)
```

### Signature moments (must land visually)

| ID | Moment | Slide |
| --- | --- | --- |
| A | Chatbot vs RegOS contrast | S03 |
| B | 5-agent pipeline | S05 |
| C | Change-impact simulator “weeks → minutes” | S07 |
| D | Citation / trust | S06 |
| E | Sandbox ask | S10 |

---

## 1. SaaS visual system

### 1.1 Color tokens (exact hex — use as Remotion constants)

```ts
// === VISUAL SYSTEM — RegOS Sentinel Idea Deck ===
const COLOR_NAVY_950 = "#06101F";      // deepest bg
const COLOR_NAVY_900 = "#0B1F3A";      // primary bg / panels
const COLOR_NAVY_800 = "#132A4A";      // elevated surface
const COLOR_NAVY_700 = "#1B3A5F";      // borders / dividers
const COLOR_WHITE = "#F8FAFC";          // primary text on navy
const COLOR_WHITE_PURE = "#FFFFFF";     // cards / light panels
const COLOR_SLATE_400 = "#94A3B8";      // secondary / muted copy
const COLOR_SLATE_500 = "#64748B";      // tertiary labels
const COLOR_TEAL_400 = "#2DD4BF";       // accent highlight / glow line
const COLOR_TEAL_500 = "#14B8A6";       // primary accent CTA / active
const COLOR_EMERALD_500 = "#10B981";    // success / approved / “minutes”
const COLOR_EMERALD_600 = "#059669";    // success dark
const COLOR_AMBER_400 = "#FBBF24";      // confidence / caution (sparingly)
const COLOR_ROSE_500 = "#F43F5E";       // risk / chatbot “fail” side only
const COLOR_CHAT_BG = "#0F172A";        // left panel chatbot mock
const COLOR_GRID = "rgba(148,163,184,0.08)"; // subtle grid overlay

// FORBIDDEN: purple, violet, indigo gradients, neon glow stacks, cream/#F4F1EA
```

**Background rule:** Never flat single fill. Use `COLOR_NAVY_950` base + soft radial gradient at 30% opacity (`COLOR_NAVY_800` at top-right) + 1px `COLOR_GRID` pattern (24px grid) OR a faint diagonal teal hairline (1px, 8% opacity) from top-left to bottom-right.

**Light panels** (chatbot contrast, citation card, metric chips): `COLOR_WHITE_PURE` on navy with 1px `COLOR_NAVY_700` border — not heavy card shadows. Max shadow: `0 8px 32px rgba(6,16,31,0.45)`.

### 1.2 Typography

| Role | Font | Weight | Size (1080p) | Tracking | Notes |
| --- | --- | --- | --- | --- | --- |
| Brand / logo wordmark | **Sora** | 700 | 42–56px | −0.02em | Always visible in corner OR hero |
| Slide title (H1) | **Sora** | 600–700 | 48–64px | −0.03em | Max 2 lines |
| Supporting sentence | **IBM Plex Sans** | 400 | 22–28px | 0 | Max 2 lines; `COLOR_SLATE_400` |
| Kinetic highlight word | **Sora** | 700 | same as H1 | −0.03em | Teal underline or emerald fill |
| UI / table / agent labels | **IBM Plex Sans** | 500 | 14–18px | 0.01em | Monospace-adjacent feel |
| Metric numerals | **Sora** | 700 | 56–96px | −0.04em | Emerald or white |
| Citation / clause text | **IBM Plex Serif** | 400 | 15–17px | 0 | Source-span authenticity |
| Footer / PS tag | **IBM Plex Sans** | 500 | 14px | 0.06em uppercase | `PS2 · AGENTIC COMPLIANCE` |

Load via `@remotion/google-fonts` or `loadFont`:

```ts
import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { loadFont as loadIBMPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadIBMPlexSerif } from "@remotion/google-fonts/IBMPlexSerif";
```

**Do not use** Inter, Roboto, Arial, system-ui as primary.

### 1.3 Logo treatment — RegOS Sentinel

**Mark (32–48px):** Geometric shield silhouette (rounded pentagon) in `COLOR_TEAL_500`, with a single vertical “sentinel slit” (eye/aperture) cut in `COLOR_NAVY_950`. No gradients inside the mark. No glow.

**Wordmark:** `RegOS` in Sora 700 white + `Sentinel` in Sora 500 `COLOR_TEAL_400` (same line, 8px gap). Optional thin vertical rule `|` between mark and wordmark (1×20px, `COLOR_NAVY_700`).

**Safe placement:** Top-left, 64px from left, 48px from top on every slide except S01 (hero-centered) and S10 (centered ask).

**Lockup constant:**

```ts
const LOGO_MARK_SIZE = 40;
const LOGO_WORD_SIZE = 28;
const LOGO_PAD = { top: 48, left: 64 };
```

### 1.4 Motion language (global)

| Pattern | Config | Use |
| --- | --- | --- |
| Snappy UI | `spring({ damping: 20, stiffness: 200 })` | Panels, chips, agent nodes |
| Smooth reveal | `spring({ damping: 200, stiffness: 100 })` | Titles, trust cards |
| Bouncy emphasis | `spring({ damping: 10, stiffness: 120 })` | “minutes” numeral only |
| Stagger | `STAGGER = 5–8 frames` | Lists, agents, bars |
| Scene transition | `fade()` + `linearTiming({ durationInFrames: 12 })` | Default between slides |
| Hard beat | `wipe({ direction: "from-left" })` + 15f | Into S07 climax only |
| Typewriter | string slice, `CHAR_FRAMES = 2`, smooth caret blink 16f | Problem / ask lines |

**Easing rule:** Prefer `spring()` for entrances; `interpolate` only for opacity crossfades and progress fills.

### 1.5 Composition shell

```ts
export const IDEA_DECK = {
  id: "IdeaDeck",
  width: 1920,
  height: 1080,
  fps: 30,
  // Sum of slide durations + transitions (~12f each × 9 ≈ 108f)
  // Exact: implement with TransitionSeries; total ≈ 3000–3300 frames (~100–110s)
};
```

Persistent chrome (all slides except S01 cold-open first 1.5s):

- Top-left: logo lockup  
- Top-right: `PS2 · SEBI TECHSPRINT` in uppercase IBM Plex Sans 14px `COLOR_SLATE_500`  
- Bottom-right: slide index `01 / 10` … `10 / 10`  
- Thin teal progress bar (2px) at very bottom: width = `slideIndex / 10`

---

## 2. Remotion template pattern map

Reuse patterns from `template-prompt-to-motion-graphics-saas` — do **not** invent new animation primitives when a skill covers it.

| Template skill / example | Path in template | Reuse on slides |
| --- | --- | --- |
| **transitions** | `src/skills/transitions.md` | All scene changes via `TransitionSeries` + `fade` / one `wipe` |
| **sequencing** | `src/skills/sequencing.md` | Intra-slide `Sequence` / staggered delays |
| **spring-physics** | `src/skills/spring-physics.md` | All panel/agent entrances |
| **typography** typewriter | `src/skills/typography.md` + `examples/code/typewriter-highlight.ts` | S02 problem line; S10 ask |
| **typography** word carousel | `examples/code/word-carousel.ts` | S04 rotating value words: `cited` / `approved` / `audit-ready` |
| **typography** text highlight | typewriter-highlight two-layer crossfade | S07 “weeks” → highlight → “minutes” |
| **messaging** chat bubbles | `src/skills/messaging.md` | S03 left panel (chatbot) |
| **charts** staggered bars | `src/skills/charts.md` + `gold-price-chart.ts` / `histogram.ts` | S08 metrics (adapt colors to teal/emerald; **strip purple**) |
| **progress-bar** | `examples/code/progress-bar.ts` | S07 time collapse bar; S05 agent pipeline fill |
| **text-rotation** | `examples/code/text-rotation.ts` | Optional S01 tagline rotate (prefer word-carousel) |
| Constants-first design | README architecture | Every slide file exports editable consts at top |
| Crossfade patterns | README + transitions skill | S03 split wipe; S06 citation reveal |

### Implementation file layout (suggested)

```text
src/remotion/
  Root.tsx                 # register IdeaDeck
  IdeaDeck.tsx             # TransitionSeries of 10 slides
  system/
    colors.ts
    fonts.ts
    Logo.tsx
    Chrome.tsx             # logo + PS tag + progress + index
  slides/
    S01_Title.tsx
    S02_Problem.tsx
    S03_Contrast.tsx       # SIGNATURE A
    S04_Solution.tsx
    S05_Agents.tsx         # SIGNATURE B
    S06_Trust.tsx          # SIGNATURE D
    S07_Impact.tsx         # SIGNATURE C
    S08_Proof.tsx
    S09_SebiValue.tsx
    S10_Ask.tsx            # SIGNATURE E
```

---

## 3. Master timeline

| # | Slide ID | Title (internal) | Duration | Frames @30fps | Transition OUT |
| --- | --- | --- | --- | --- | --- |
| 01 | S01 | Title / brand | 7s | 210 | fade 12f |
| 02 | S02 | The problem | 9s | 270 | fade 12f |
| 03 | S03 | Chatbot vs RegOS | 12s | 360 | fade 12f |
| 04 | S04 | Solution | 8s | 240 | fade 12f |
| 05 | S05 | 5-agent pipeline | 12s | 360 | fade 12f |
| 06 | S06 | Citation & trust | 10s | 300 | fade 12f |
| 07 | S07 | Weeks → minutes | 14s | 420 | wipe-from-left 15f **into** this slide; fade out |
| 08 | S08 | Proof metrics | 9s | 270 | fade 12f |
| 09 | S09 | SEBI / sandbox value | 9s | 270 | fade 12f |
| 10 | S10 | The ask | 8s | 240 | end hold 30f black |

**Total content:** ~98s · **With transitions (~3.6s):** ~102s · Target render: **≤110s**

`TransitionSeries` note: transition frames overlap adjacent sequences — do not double-count duration when budgeting narration.

---

## 4. Slide-by-slide storyboard

---

### S01 — Title / Brand

**Internal title:** Cold open → brand lockup  
**Duration:** 7s (210f)  
**Signature:** Brand-first hero (not a dashboard)

#### On-screen copy (exact)

| Element | Exact text |
| --- | --- |
| Eyebrow (fades in first) | `SEBI TECHSPRINT 2026 · PS2` |
| Brand (hero) | `RegOS Sentinel` |
| One-liner | `Circulars → cited obligations → audit-ready action.` |
| Sub | `An agentic compliance OS for SEBI intermediaries.` |

#### Visual / motion

1. **0.0–1.0s:** Full navy void (`COLOR_NAVY_950`). Single 1px teal hairline draws left→right across vertical center (interpolate width 0→1920).  
2. **1.0–2.2s:** Logo mark springs in center (`snappy`), then wordmark fades in to the right of mark (crossfade, 12f). Brand is the dominant signal — larger than any other text.  
3. **2.2–3.5s:** Eyebrow appears above brand (opacity spring, translateY 12→0).  
4. **3.5–5.5s:** One-liner types in below brand (typewriter, `CHAR_FRAMES=2`), caret blinks, then highlight crossfade on `cited obligations` with teal underline (2px).  
5. **5.5–7.0s:** Sub line fades; chrome (progress bar) appears; hold.

#### Remotion composition notes

- Skills: **typography** (typewriter-highlight), **spring-physics** (logo), **sequencing**  
- Components: `AbsoluteFill` + centered column `maxWidth: 1100`  
- Logo scale: mark 64px → settles 56px; wordmark 56px Sora 700  
- No cards, no stats, no agent icons on this slide  
- Transition out: `fade()` 12f

```ts
const S01 = {
  EYEBROW: "SEBI TECHSPRINT 2026 · PS2",
  BRAND: "RegOS Sentinel",
  LINE: "Circulars → cited obligations → audit-ready action.",
  HIGHLIGHT: "cited obligations",
  SUB: "An agentic compliance OS for SEBI intermediaries.",
  CHAR_FRAMES: 2,
};
```

---

### S02 — The problem

**Internal title:** Manual bridge is broken  
**Duration:** 9s (270f)

#### On-screen copy (exact)

| Element | Exact text |
| --- | --- |
| Title | `SEBI writes circulars.` |
| Title line 2 | `Brokers translate them by hand.` |
| Supporting | `Who does what · by when · with what evidence — slow, uneven, un-auditable.` |
| Stat chip 1 | `95%` |
| Stat chip 1 label | `intermediaries cite complexity & info gaps` |
| Stat chip 2 | `Weeks` |
| Stat chip 2 label | `typical circular-to-action lag` |
| Footer source | `Source framing: SEBI Investor Survey 2025 · PS2 problem statement` |

#### Visual / motion

- Left 55%: kinetic title — line 1 holds; line 2 typewriters in; then `by hand` gets rose underline (not purple).  
- Right 40%: two metric chips stack vertically, stagger spring (delay 8f). Numerals count-up from 0→95 and empty→`Weeks` (word fade, not count).  
- Background: faint document silhouette (PDF page outline, 8% white stroke) drifting slowly (−8px Y over slide) — atmosphere, not a card collage.

#### Remotion composition notes

- Skills: **typography**, **sequencing**, **spring-physics**  
- Layout: CSS flex row, padding 96/64  
- Stat chips: white text on `COLOR_NAVY_800`, left border 3px `COLOR_ROSE_500` (problem signal)  
- Do **not** show a chatbot yet (save for S03)

```ts
const S02 = {
  T1: "SEBI writes circulars.",
  T2: "Brokers translate them by hand.",
  SUPPORT:
    "Who does what · by when · with what evidence — slow, uneven, un-auditable.",
  STATS: [
    { value: "95%", label: "intermediaries cite complexity & info gaps" },
    { value: "Weeks", label: "typical circular-to-action lag" },
  ],
  FOOTER: "Source framing: SEBI Investor Survey 2025 · PS2 problem statement",
};
```

---

### S03 — Chatbot vs RegOS  ★ SIGNATURE A

**Internal title:** Not a chatbot — a compliance OS  
**Duration:** 12s (360f)

#### On-screen copy (exact)

| Element | Exact text |
| --- | --- |
| Slide title (top center) | `Judges ask: “Isn’t this just RAG?”` |
| Left header | `Generic chatbot` |
| Left bubble 1 (user) | `What does CSCRF require for small REs?` |
| Left bubble 2 (bot) | `Small REs should maintain cyber controls, conduct audits, and follow SEBI guidelines…` |
| Left stamp | `Prose. No owner. No deadline. No evidence. No citation.` |
| Right header | `RegOS Sentinel` |
| Right table headers | `Actor · Action · Deadline · Evidence · Clause · Conf.` |
| Right row 1 | `CISO · Annual cyber audit · Annual · VAPT + board note · §4.2 · 0.93` |
| Right row 2 | `Compliance · Incident reporting SLA · 6 hours · IR log · §7.1 · 0.91` |
| Right stamp | `Structured · cited · human-gated · audit-ready` |
| Bottom verdict | `Chat answers. RegOS operationalizes.` |

#### Visual / motion

1. **0–1.5s:** Title springs in. Vertical split line draws down center.  
2. **1.5–5.5s LEFT:** Messaging skill — user bubble then bot bubble stagger (`STAGGER_DELAY=38`). Bot bubble uses muted slate, not teal. After bubbles settle, rose stamp fades under.  
3. **5.5–10s RIGHT:** Obligation register rows slide in from right (`slide` feel via translateX 40→0 + spring), teal left rail on table. Confidence pills emerald.  
4. **10–12s:** Bottom verdict bar rises from bottom (translateY), white on navy, teal accent word `operationalizes`.

#### Remotion composition notes

- Skills: **messaging** (left), **sequencing** + **spring-physics** (right rows), **transitions** (optional inner crossfade)  
- Left bg: `COLOR_CHAT_BG`; right bg: `COLOR_NAVY_900`  
- Chat colors adapted from messaging skill but **recolor**: sent `#334155`, received `#1E293B`, text `COLOR_WHITE` — do not use WhatsApp green on the “bad” side; reserve teal/emerald for RegOS only  
- Table: not a heavy card — hairline grid, IBM Plex Sans 15px  
- This slide is the anti-RAG proof; keep copy exact

```ts
const S03 = {
  TITLE: "Judges ask: “Isn’t this just RAG?”",
  LEFT_H: "Generic chatbot",
  BUBBLES: [
    { sent: true, text: "What does CSCRF require for small REs?" },
    {
      sent: false,
      text: "Small REs should maintain cyber controls, conduct audits, and follow SEBI guidelines…",
    },
  ],
  LEFT_STAMP: "Prose. No owner. No deadline. No evidence. No citation.",
  RIGHT_H: "RegOS Sentinel",
  COLS: ["Actor", "Action", "Deadline", "Evidence", "Clause", "Conf."],
  ROWS: [
    ["CISO", "Annual cyber audit", "Annual", "VAPT + board note", "§4.2", "0.93"],
    ["Compliance", "Incident reporting SLA", "6 hours", "IR log", "§7.1", "0.91"],
  ],
  RIGHT_STAMP: "Structured · cited · human-gated · audit-ready",
  VERDICT: "Chat answers. RegOS operationalizes.",
};
```

---

### S04 — Solution

**Internal title:** What RegOS is  
**Duration:** 8s (240f)

#### On-screen copy (exact)

| Element | Exact text |
| --- | --- |
| Title | `RegOS Sentinel` |
| Subtitle | `Supervised agentic compliance for stock brokers — then every SEBI intermediary.` |
| Word carousel prefix | `Every output is` |
| Carousel words | `clause-cited` · `confidence-scored` · `human-approved` · `audit-ready` |
| Pill 1 | `Real SEBI circulars` |
| Pill 2 | `Synthetic broker evidence (labeled)` |
| Pill 3 | `Not legal advice — decision support` |

#### Visual / motion

- Brand lockup left-aligned large (not nav-sized).  
- Word carousel (template `word-carousel.ts`): stable width from longest word `human-approved`; blur crossfade `HOLD=32`, `FLIP=18`. Highlight word color `COLOR_TEAL_400`.  
- Three pills stagger in bottom row (spring, delay 6f) — outline only, no filled purple pills; border `COLOR_NAVY_700`, text white.

#### Remotion composition notes

- Skills: **typography** word-carousel, **spring-physics**, **sequencing**  
- One composition job only: define the product posture  
- No architecture diagram yet (S05)

```ts
const S04 = {
  TITLE: "RegOS Sentinel",
  SUB: "Supervised agentic compliance for stock brokers — then every SEBI intermediary.",
  PREFIX: "Every output is",
  WORDS: ["clause-cited", "confidence-scored", "human-approved", "audit-ready"],
  PILLS: [
    "Real SEBI circulars",
    "Synthetic broker evidence (labeled)",
    "Not legal advice — decision support",
  ],
};
```

---

### S05 — 5-agent pipeline  ★ SIGNATURE B

**Internal title:** Explicitly agentic (PS2)  
**Duration:** 12s (360f)

#### On-screen copy (exact)

| Element | Exact text |
| --- | --- |
| Title | `Five supervised agents. One human gate each.` |
| Supporting | `Narrow roles. Logged actions. No black-box autopilot.` |
| Agent 1 | `Watcher` |
| Agent 1 sub | `Detect new / amended circulars` |
| Agent 2 | `Interpreter` |
| Agent 2 sub | `Extract actor · action · deadline · evidence · citation` |
| Agent 3 | `Mapper` |
| Agent 3 sub | `Owners · controls · applicability` |
| Agent 4 | `Evidence` |
| Agent 4 sub | `Tasks · uploads · validation` |
| Agent 5 | `Auditor` |
| Agent 5 sub | `Audit pack · risk heatmap` |
| Pipeline caption | `SEBI PDF → Obligation graph → Workflow → Audit pack` |

#### Visual / motion

1. Title + supporting fade.  
2. Five nodes appear left→right along a horizontal rail; each node = circle 72px with teal ring, label below.  
3. **Activation pulse:** progress-bar skill style — teal fill travels along connector line node→node (`interpolate` 0→100% over 8s), each node “lights” (ring `COLOR_TEAL_500`, inner fill `COLOR_EMERALD_500` at 20% opacity) when pulse arrives.  
4. Human-gate icon (small check shield) pops above each node 4f after activation (`snappy` spring).  
5. Bottom caption fades last.

#### Remotion composition notes

- Skills: **sequencing**, **spring-physics**, **progress-bar** (connector), **transitions** N/A intra  
- Node stagger: `BASE_DELAY=20`, `STAGGER=18`  
- Connectors: 2px line `COLOR_NAVY_700`, active overlay `COLOR_TEAL_500`  
- Do not animate as a chatbot thread; this is a **pipeline**, horizontal, institutional  
- Optional: tiny document icon enters left of Watcher at start

```ts
const S05 = {
  TITLE: "Five supervised agents. One human gate each.",
  SUPPORT: "Narrow roles. Logged actions. No black-box autopilot.",
  AGENTS: [
    { name: "Watcher", sub: "Detect new / amended circulars" },
    {
      name: "Interpreter",
      sub: "Extract actor · action · deadline · evidence · citation",
    },
    { name: "Mapper", sub: "Owners · controls · applicability" },
    { name: "Evidence", sub: "Tasks · uploads · validation" },
    { name: "Auditor", sub: "Audit pack · risk heatmap" },
  ],
  CAPTION: "SEBI PDF → Obligation graph → Workflow → Audit pack",
};
```

---

### S06 — Citation & trust  ★ SIGNATURE D

**Internal title:** Hallucination killer  
**Duration:** 10s (300f)

#### On-screen copy (exact)

| Element | Exact text |
| --- | --- |
| Title | `Nothing is taken on faith.` |
| Supporting | `Every obligation points to a verbatim source span.` |
| Source pane label | `CSCRF · source clause` |
| Source clause (serif) | `“Regulated Entities shall conduct a comprehensive cyber audit at least once in a financial year…”` |
| Obligation card label | `Extracted obligation` |
| Obligation fields | `Actor: Stock Broker / CISO` / `Action: Conduct annual cyber audit` / `Evidence: Audit report + board noting` / `Confidence: 0.91` / `Review: Needs human approval` |
| Trust row | `Retrieval-grounded · Confidence-scored · Human-gated · Benchmarked` |
| Disclaimer | `Decision support only — not legal advice.` |

#### Visual / motion

- Split view: left = PDF-like source pane (white panel); right = obligation card (navy elevated).  
- **0–2s:** Both panels spring in.  
- **2–5s:** Yellow/amber highlight bar animates over the clause span (width grow), matching typewriter-highlight pattern but amber `#FBBF24` at 35% opacity on white.  
- **5–7s:** Dashed teal connector draws from highlight → obligation card (SVG path length interpolate).  
- **7–9s:** Confidence ring draws (stroke-dashoffset pie-style from charts skill) to 91%; status chip pulses once.  
- **9–10s:** Trust row + disclaimer fade.

#### Remotion composition notes

- Skills: **typography** highlight, **charts** (ring), **spring-physics**, **sequencing**  
- Source text: IBM Plex Serif — critical for “document authenticity”  
- Confidence ring: reuse pie segment technique from `charts.md`  
- This answers judge Q: “How do I know it didn’t hallucinate?”

```ts
const S06 = {
  TITLE: "Nothing is taken on faith.",
  SUPPORT: "Every obligation points to a verbatim source span.",
  SOURCE_LABEL: "CSCRF · source clause",
  CLAUSE:
    "“Regulated Entities shall conduct a comprehensive cyber audit at least once in a financial year…”",
  CARD_LABEL: "Extracted obligation",
  FIELDS: [
    ["Actor", "Stock Broker / CISO"],
    ["Action", "Conduct annual cyber audit"],
    ["Evidence", "Audit report + board noting"],
    ["Confidence", "0.91"],
    ["Review", "Needs human approval"],
  ],
  TRUST: "Retrieval-grounded · Confidence-scored · Human-gated · Benchmarked",
  DISCLAIMER: "Decision support only — not legal advice.",
};
```

---

### S07 — Change-impact simulator  ★ SIGNATURE C (CLIMAX)

**Internal title:** Weeks → minutes  
**Duration:** 14s (420f)  
**Transition IN:** `wipe({ direction: "from-left" })` + `linearTiming({ durationInFrames: 15 })` — only hard wipe in the deck

#### On-screen copy (exact)

| Element | Exact text |
| --- | --- |
| Title | `A new circular drops.` |
| Supporting | `RegOS simulates operational impact — instantly.` |
| Button mock | `Simulate New SEBI Circular` |
| Diff labels | `+ 12 obligations` · `~ 8 controls changed` · `→ 21 tasks generated` · `Evidence gaps: 6` |
| Big kinetic line | `Weeks` |
| Arrow / morph | `→` |
| Big kinetic line end | `Minutes` |
| Caption | `Circular-to-operational-action time — the one number that proves impact.` |

#### Visual / motion

1. **0–2s:** Title + supporting. Center CTA button (teal fill, white text) springs in.  
2. **2–3s:** Button press animation (scale 1→0.96→1), teal ripple.  
3. **3–7s:** Impact diff list staggers in (4 rows); each row left border emerald; numerals count-up. Mini heatmap cells flicker (3×4 grid, rose→amber→emerald).  
4. **7–11s CLIMAX:** Full-width kinetic type — `Weeks` in rose/slate large (96px) holds 1s; then typewriter-highlight two-layer crossfade: `Weeks` fades/blurs out; `Minutes` springs in emerald with overshoot (`damping: 10`). Optional progress bar under morph fills 0→100% in teal (progress-bar example).  
5. **11–14s:** Caption fades; hold on `Minutes`.

#### Remotion composition notes

- Skills: **typography** highlight + **text-rotation**/blur, **progress-bar**, **spring-physics** bouncy for Minutes, **charts** optional mini bars for “tasks generated”  
- Highest energy slide — still no purple, no emoji, no confetti  
- Audio cue optional later: soft whoosh on wipe + click on button (out of scope unless SFX added)

```ts
const S07 = {
  TITLE: "A new circular drops.",
  SUPPORT: "RegOS simulates operational impact — instantly.",
  CTA: "Simulate New SEBI Circular",
  DIFFS: [
    "+ 12 obligations",
    "~ 8 controls changed",
    "→ 21 tasks generated",
    "Evidence gaps: 6",
  ],
  BEFORE: "Weeks",
  AFTER: "Minutes",
  CAPTION:
    "Circular-to-operational-action time — the one number that proves impact.",
};
```

---

### S08 — Proof metrics

**Internal title:** Demoable proof  
**Duration:** 9s (270f)

#### On-screen copy (exact)

| Element | Exact text |
| --- | --- |
| Title | `Built to be measured — not merely demoed.` |
| Metric 1 value | `100%` |
| Metric 1 label | `citation coverage on displayed obligations` |
| Metric 2 value | `<3 min` |
| Metric 2 label | `circular → compliance plan (demo gate)` |
| Metric 3 value | `≥0.85` |
| Metric 3 label | `extraction precision target (labeled set)` |
| Corpus line | `Corpus: Stock Broker Master Circular · CSCRF + FAQ · SCORES↔ODR` |
| Overlay line | `Live overlay: docs · obligations · citation % · time-to-plan` |

#### Visual / motion

- Three large metric columns; numerals spring + count-up (charts/histogram stagger pattern, `STAGGER_DELAY=8`).  
- Under metrics: horizontal corpus chips slide in.  
- Optional thin bar chart behind (opacity 15%) showing mock precision bars — colors teal/emerald only (fork `histogram.ts`, replace indigo/violet).

#### Remotion composition notes

- Skills: **charts**, **spring-physics**, **sequencing**  
- Y-axis labels if chart used (charts skill rule)  
- Keep institutional, not “growth startup metrics”

```ts
const S08 = {
  TITLE: "Built to be measured — not merely demoed.",
  METRICS: [
    {
      value: "100%",
      label: "citation coverage on displayed obligations",
    },
    {
      value: "<3 min",
      label: "circular → compliance plan (demo gate)",
    },
    {
      value: "≥0.85",
      label: "extraction precision target (labeled set)",
    },
  ],
  CORPUS:
    "Corpus: Stock Broker Master Circular · CSCRF + FAQ · SCORES↔ODR",
  OVERLAY: "Live overlay: docs · obligations · citation % · time-to-plan",
};
```

---

### S09 — SEBI / sandbox value

**Internal title:** Why SEBI cares + adoptability  
**Duration:** 9s (270f)

#### On-screen copy (exact)

| Element | Exact text |
| --- | --- |
| Title | `RegTech for brokers. SupTech visibility for SEBI.` |
| Supporting | `Anonymized readiness across intermediaries — no raw PII.` |
| Column 1 header | `Intermediary` |
| Column 1 bullets | `Cited obligation register` / `Evidence workflow` / `Audit pack export` |
| Column 2 header | `SEBI / MII` |
| Column 2 bullets | `Aggregate readiness view` / `Common gap patterns` / `Slow-implementation circulars` |
| Continuity line | `2025 Member Compliance Monitoring → 2026 Agentic Compliance` |
| Why-now chip | `SEBI Reg 16C — REs accountable for AI outputs` |
| Posture line | `Packaged for Innovation Sandbox mentorship — not just a demo day.` |

#### Visual / motion

- Two columns with a teal vertical rule between; headers spring; bullets stagger (`STAGGER=6`).  
- Continuity line types in as a timeline: `2025` chip → arrow → `2026` chip.  
- Posture line fades with small shield mark.

#### Remotion composition notes

- Skills: **sequencing**, **typography** typewriter for continuity, **spring-physics**  
- No fake world-map; keep abstract and regulator-clean  
- Answers judge Q: “What’s the SEBI benefit?”

```ts
const S09 = {
  TITLE: "RegTech for brokers. SupTech visibility for SEBI.",
  SUPPORT: "Anonymized readiness across intermediaries — no raw PII.",
  LEFT_H: "Intermediary",
  LEFT: [
    "Cited obligation register",
    "Evidence workflow",
    "Audit pack export",
  ],
  RIGHT_H: "SEBI / MII",
  RIGHT: [
    "Aggregate readiness view",
    "Common gap patterns",
    "Slow-implementation circulars",
  ],
  CONTINUITY: "2025 Member Compliance Monitoring → 2026 Agentic Compliance",
  WHY_NOW_CHIP: "SEBI Reg 16C — REs accountable for AI outputs",
  POSTURE:
    "Packaged for Innovation Sandbox mentorship — not just a demo day.",
};
```

---

### S10 — The ask  ★ SIGNATURE E

**Internal title:** Sandbox ask  
**Duration:** 8s (240f) + 1s end hold

#### On-screen copy (exact)

| Element | Exact text |
| --- | --- |
| Title | `Ask` |
| Ask body | `A pilot path: one broker → industry body → MII.` |
| Ask body 2 | `Plus a SupTech aggregate view for SEBI readiness visibility.` |
| Box header | `Sandbox-ready packaging` |
| Box items | `90-day pilot plan` / `KPI sheet` / `Model card · risk register · DPDP statement` / `Human-in-the-loop policy (Reg 16C-ready)` / `Preserve KYC/AML/investor safeguards` |
| Close line | `From rule text to sandbox-ready operational action.` |
| End brand | `RegOS Sentinel` |

#### Visual / motion

1. **0–1.5s:** Title `Ask` in Sora 700, large, left.  
2. **1.5–4s:** Ask body typewriters; line 2 fades.  
3. **4–6.5s:** Sandbox pack box springs from bottom — checklist items tick in sequence (emerald checkmarks, stagger 8f).  
4. **6.5–8s:** Close line highlight on `sandbox-ready`; brand lockup centers; fade to navy hold.

#### Remotion composition notes

- Skills: **typography** typewriter-highlight, **spring-physics**, **sequencing**  
- Checklist: use simple SVG check paths, not emoji  
- Final frame: logo + close line only (clean end card for video cut)

```ts
const S10 = {
  TITLE: "Ask",
  BODY: "A pilot path: one broker → industry body → MII.",
  BODY2: "Plus a SupTech aggregate view for SEBI readiness visibility.",
  BOX_H: "Sandbox-ready packaging",
  BOX: [
    "90-day pilot plan",
    "KPI sheet",
    "Model card · risk register · DPDP statement",
    "Human-in-the-loop policy",
    "Preserve KYC/AML/investor safeguards",
  ],
  CLOSE: "From rule text to sandbox-ready operational action.",
  BRAND: "RegOS Sentinel",
};
```

---

## 5. TransitionSeries wiring (exact)

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";

const FADE = (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 12 })}
  />
);

const WIPE_IN_CLIMAX = (
  <TransitionSeries.Transition
    presentation={wipe({ direction: "from-left" })}
    timing={linearTiming({ durationInFrames: 15 })}
  />
);

// Order: S01 -fade- S02 -fade- S03 -fade- S04 -fade- S05 -fade- S06
//        -WIPE- S07 -fade- S08 -fade- S09 -fade- S10
```

Durations per `TransitionSeries.Sequence`: use frame counts from §3.

---

## 6. Narration sync (optional VO bed)

If VO is added later, align to these beats (not required for silent idea-deck cut):

| Slide | VO cue (≤1 sentence) |
| --- | --- |
| S01 | “RegOS Sentinel — agentic compliance for SEBI intermediaries.” |
| S02 | “Circulars are human-readable; compliance systems need structured, auditable rules.” |
| S03 | “A chatbot gives prose. RegOS gives owners, deadlines, evidence, and a clause citation per line.” |
| S04 | “Supervised agents. Human approval. Audit-ready proof.” |
| S05 | “Watcher, Interpreter, Mapper, Evidence, Auditor — each gated by a human.” |
| S06 | “Every line traces to a verbatim source span.” |
| S07 | “A new circular drops — impact in minutes, not weeks.” |
| S08 | “One hundred percent citation coverage on everything we show.” |
| S09 | “Brokers get RegTech. SEBI gets anonymized SupTech readiness.” |
| S10 | “We’re asking for a sandbox pilot path — broker to industry body to MII.” |

---

## 7. Composer 2.5 implementation checklist

- [ ] Scaffold Remotion project (or reuse SaaS template `src/remotion/`) at 1920×1080 / 30fps  
- [ ] Implement `system/colors.ts`, `fonts.ts`, `Logo.tsx`, `Chrome.tsx` exactly per §1  
- [ ] Build 10 slide components with **constants-first** copy from §4 — no paraphrasing on-screen text  
- [ ] Wire `IdeaDeck.tsx` with `TransitionSeries` per §5 (wipe only into S07)  
- [ ] Port patterns: messaging (S03), word-carousel (S04), pipeline+progress (S05), citation highlight (S06), weeks→minutes kinetic (S07), staggered metrics (S08)  
- [ ] Strip all purple/indigo from any forked example code  
- [ ] Signature QA: A(S03), B(S05), C(S07), D(S06), E(S10) each readable in a paused frame  
- [ ] Render preview: `npx remotion preview` → spot-check chrome, fonts, contrast  
- [ ] Final render: `npx remotion render IdeaDeck out/RegOS_Sentinel_IdeaDeck.mp4`

### Explicit non-goals

- Do not build a full product UI demo inside the deck (that’s the separate ≤3 min demo video)  
- Do not add pricing, TAM, or “team slide” fluff — judges want PS fit + trust + sandbox path  
- Do not use stock “AI neural net” visuals, robot mascots, or purple gradients

---

## 8. Traceability

| Deck claim | Source |
| --- | --- |
| Weeks → minutes | `judge_pitch.md` 30s + Q&A “one number” |
| 5 agents named | `judge_pitch.md` 2-min; `flagship_project.md` §8 |
| Chatbot contrast | `judge_pitch.md` Q1; `winning_product_build_spec.md` §2 |
| Citation + confidence + human gate | `flagship_project.md` §5, §10; build spec Surface 2–3 |
| Change-impact simulator | build spec Surface 7; flagship §5 signature beat |
| Corpus trio | flagship §4; build spec Surface 1 |
| Metrics 100% / &lt;3 min / ≥0.85 | flagship §11; build spec §10 |
| SupTech aggregate | judge ask; build spec Surface 9 |
| Sandbox packaging / 2025→2026 | `approach-refinement.md` upgrades 1–3, net-new elements |
| Preserve safeguards | `approach-refinement.md` upgrade 5 / posture |

---

*End of L3 IDEA DECK storyboard — ready for Composer 2.5 Remotion implementation.*
