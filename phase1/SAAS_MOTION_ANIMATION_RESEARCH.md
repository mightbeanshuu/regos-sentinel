# SaaS Motion Animation Research — RegOS Sentinel

> Exhaustive pattern catalog for Remotion + React · Idea Deck S01–S10 · 1920×1080 @ **30fps**  
> Audience: SEBI / MII judges · Tone: **trust > flash** · Palette: navy `#06101F` + teal `#2DD4BF` + emerald `#10B981`  
> Target project: `/Users/mac/Desktop/sebi hackathon/regos-motion`  
> Locked visual direction: `phase1/VISUAL_DIRECTION_PICK.md` · Storyboard: `phase1/L3_deck_storyboard.md`

---

## 0. How top SaaS / pitch decks actually move

Modern SaaS marketing (Linear, Stripe, Vercel, Notion, Arc, Raycast, Attio, Mercury) and Canva/Pitch/Beautiful.ai motion templates share a **layered motion stack**:

| Layer | Role | Speed | Opacity / intensity |
| --- | --- | --- | --- |
| **L0 Atmosphere** | Fluid blob / smoke / mesh / grain | Very slow (8–20s loops) | 8–25% |
| **L1 Structure** | Grid, hairlines, chrome, progress | Soft fade-in 12–20f | 100% chrome, low grid |
| **L2 Content** | Titles, body, cards, chips | Spring entrances 12–24f | Crisp, no blur on text |
| **L3 Signature** | SVG draw, icon pop, metric slam, morph | One beat per slide | High contrast accent |
| **L4 Transition** | Fade / wipe / blur crossfade | 10–15f | Never longer than content settle |

**Industry rules of thumb (adapted for regulators):**

1. **Background moves; copy does not wobble.** Fluid lives behind type. Never animate letter-spacing or blur body text after settle.
2. **One signature motion per slide.** Stripe-style: one hero moment, everything else supports.
3. **Springs for UI chrome; interpolate for progress / opacity / pathLength.** Matches existing `regos-motion` convention in `system/springs.ts`.
4. **Stagger 4–8f for lists; 12–18f for “hero” nodes** (agents, metrics). Existing S05 uses 18f — keep for agents; use 6f (`STAGGER`) for chips/fields.
5. **Overshoot is for emphasis words and icons only** (`springBouncy`). Cards/panels use `springSnappy` / `springUI` — slight overshoot OK, no rubber-band chaos.
6. **Grain + blur = depth, not decoration spam.** 2–4% noise overlay; blur only on atmosphere or soft crossfades (≤8px).

**Forbidden aesthetics (project lock):** purple / violet / indigo gradients · cream `#F4F1EA` newspaper · terracotta · neon glow stacks · Inter/Roboto/Arial as primary · flat single-color bg with no atmosphere.

---

## 1. Pattern catalog

Timing assumes **30fps**. Frame ranges are *entrance duration* unless noted as *loop*.  
Spring helpers already in project:

```ts
// system/springs.ts
springSnappy  → { damping: 20, stiffness: 200 }  // panels, chips, nodes
springSmooth  → { damping: 200, stiffness: 100 } // titles, trust cards
springBouncy  → { damping: 10, stiffness: 120 }  // “Minutes” / slam emphasis
springUI      → { damping: 22, stiffness: 180 }  // general chrome
```

Suggested **new** helpers (add when implementing):

```ts
springPop     → { damping: 14, stiffness: 260, mass: 0.7 } // icon / SVG pop
springSoft    → { damping: 28, stiffness: 120 }            // glass panels
springElastic → { damping: 8,  stiffness: 160 }            // rare climax only
```

---

### 1.1 Atmosphere / background

#### `blob-drift`
**What:** Soft elliptical / organic gradient orbs slowly translate + scale + rotate behind content.  
**When:** Every slide as L0; stronger on S01 / S10; quieter on dense S03 / S06.  
**Remotion notes:**
- Prefer **CSS radial-gradients on absolutely positioned divs** (cheap, deterministic) over canvas for deck.
- Drive with `interpolate(frame, [0, 600], [0, 1], { extrapolateRight: 'extend' })` then map to `translate`, `scale`, `borderRadius`.
- Optional SVG `<ellipse>` / morphing path with `filter: blur(60–120px)`.
- Keep blobs at `opacity: 0.12–0.28`; mix teal `#2DD4BF` → cyan `#0E7490` → emerald `#10B981` @ 20–35%.
**Timing:** Loop **240–600f** (8–20s). Drift amplitude ±40–120px. Scale pulse `1.0 → 1.08 → 1.0` over 300f.  
**Code sketch:**

```tsx
const t = frame / fps;
const x = Math.sin(t * 0.35) * 80;
const y = Math.cos(t * 0.28) * 50;
const s = 1 + Math.sin(t * 0.2) * 0.06;
// style: transform: `translate(${x}px, ${y}px) scale(${s})`, filter: 'blur(80px)'
```

#### `fluid-smoke-wave`
**What:** Horizontal ribbon / smoke band that undulates (Canva dark “startup” template).  
**When:** S01 hero, S07 climax wipe-in, S10 close — signature brand atmosphere.  
**Remotion notes:**
- SVG path with 3–5 cubic bezier humps; animate control points via `interpolate` OR use a stacked set of blurred `linear-gradient` strips with different `translateX` phases.
- Color stop: `#0E7490 → #2DD4BF → transparent` on `#06101F`.
- `mix-blend-mode: screen` or `plus-lighter` at low opacity (test render — some codecs crush blend modes; prefer opacity if unsure).
**Timing:** Wave phase loop **180–360f**. Entrance fade-in **20–30f**. Amplitude 30–80px vertical.  
**Do not** put smoke over body copy; mask with a bottom/top fade.

#### `gradient-mesh`
**What:** Multi-stop mesh (Stripe/Linear hero vibe) — 3–4 soft color nodes.  
**When:** Title / ask slides; avoid on data-heavy slides.  
**Remotion notes:**
- CSS: multiple overlapping radials, OR SVG `<feTurbulence>` + `<feDisplacementMap>` for subtle warble (expensive — use sparingly, bake if needed).
- Safer Remotion path: 3 blurred orbs + grain (see `soft-grain-overlay`).
**Timing:** Node positions drift over **300–480f**. Color stops static (no hue-shift into purple).

#### `soft-grain-overlay`
**What:** Film/SaaS grain at 2–4% for depth.  
**When:** Global, all slides.  
**Remotion notes:**
- SVG noise filter or tiled PNG/`feTurbulence` at `opacity: 0.03–0.05`, `mix-blend-mode: overlay`.
- Animate `baseFrequency` or tile offset slowly (1px / 4f) to avoid static “dirty screen.”
- Keep **below** text layer (`z-index` / AbsoluteFill order).
**Timing:** Continuous; optional micro-shift every **4–8f**.

#### `radial-bloom`
**What:** Soft teal/emerald glow in a corner (replaces flat navy).  
**When:** Accent behind logo (S01), behind metric slam (S08), behind sandbox box (S10).  
**Remotion notes:** Existing `RegOSBackground` already has navy radial — extend with a second teal bloom at 10–18% opacity.  
**Timing:** Fade in **15–25f**; optional breathe scale 1→1.05 over **120f**.

#### `grid-breathe`
**What:** Subtle grid opacity pulse or hairline draw.  
**When:** Technical slides (S05 agents, S06 trust, S09 SupTech).  
**Remotion notes:** Already have 24px grid in `Background.tsx`. Animate grid opacity `0.04 → 0.08` or draw hairline (already partially implemented).  
**Timing:** Hairline draw **0–30f**; breathe loop **90–150f** (very subtle).

---

### 1.2 SVG / vector motion

#### `svg-stroke-draw`
**What:** Path appears as if drawn with a pen (`stroke-dashoffset` / `pathLength`).  
**When:** Citation connectors (S06), agent pipeline line (S05), checkmark (S10), shield outline (S01 logo entrance).  
**Remotion notes:**

```tsx
const progress = spring({
  frame: Math.max(0, frame - delay),
  fps,
  config: { damping: 200, stiffness: 80 }, // smooth draw, not bouncy
});
<path
  d="..."
  pathLength={1}
  strokeDasharray={1}
  strokeDashoffset={1 - progress}
  fill="none"
  stroke={COLOR_TEAL_400}
  strokeWidth={2}
  strokeLinecap="round"
/>
```

- Prefer `pathLength={1}` (normalized) over measuring getTotalLength (SSR/Remotion-friendly).
- Multi-segment icons: stagger each path by **3–5f**.
**Timing:** Short icons **12–20f**; long connectors **30–60f**; pipeline full width **60–120f**.

#### `svg-morph`
**What:** One shape interpolates into another (circle→shield, weeks→minutes container).  
**When:** S07 climax metaphor; logo mark reveal; chatbot→OS contrast (S03) if kept abstract.  
**Remotion notes:**
- Remotion has no built-in FLUBBER; options: (a) crossfade two SVGs with blur, (b) animate `d` if same point count, (c) scale/opacity morph (safest for judges).
- Recommended for RegOS: **crossfade + scale** (`soft-blur-crossfade`) rather than true path morph — more reliable renders.
**Timing:** Morph window **20–36f**. Hold after settle **≥45f**.

#### `icon-pop-spring`
**What:** Icon scales `0 → 1.08 → 1` with opacity; optional slight rotate.  
**When:** Agent nodes, trust badges, sandbox checklist, metric glyphs.  
**Remotion notes:**

```tsx
const p = spring({
  frame: Math.max(0, frame - delay),
  fps,
  config: { damping: 14, stiffness: 260, mass: 0.7 },
});
const scale = interpolate(p, [0, 1], [0.4, 1]); // spring already overshoots if soft damping
// Or explicit: interpolate(p, [0, 0.7, 1], [0, 1.08, 1]) with snappy spring
```

**Timing:** **10–16f** to settle. Stagger **5–8f** between icons.

#### `checkmark-draw-gate`
**What:** Circle ring draws, then check stroke draws — “human gate approved.”  
**When:** S05 human gates, S06 approval, S10 checklist, demo Beat4 approve.  
**Remotion notes:** Two paths; ring `pathLength` 0→1 over 12f; check starts at ring ≥0.85. Fill emerald only after both complete.  
**Timing:** Ring **10–14f** + check **8–12f** + settle **6f** ≈ **24–32f** total.

#### `citation-link-draw`
**What:** Bezier or elbow connector from source span → obligation card; optional dashed “telemetry.”  
**When:** S06 (signature trust moment).  
**Remotion notes:** Draw stroke, then pulse a small dot along path with `interpolate` on `offset` / CSS `offset-path` if supported — or animate a circle’s `cx/cy` along sampled points. End with soft glow on target card border (`boxShadow` teal 20%).  
**Timing:** Draw **40–60f**; dot travel **20–30f**; card border pulse **12f**.

#### `shield-outline-reveal`
**What:** Logo shield path strokes on, then fills.  
**When:** S01 brand entrance (upgrade current scale-only logo).  
**Remotion notes:** Existing logo is filled polygon — split into stroke-first then fill opacity. Slit rect fades in last.  
**Timing:** Stroke **18–24f** → fill **10–15f** → wordmark spring **12–18f**.

#### `lightning-slash`
**What:** Angular bolt path draws + brief flash for “impact.”  
**When:** S07 only (change-impact). Keep short — regulator deck, not esports.  
**Remotion notes:** 4–6 segment polyline; draw 12f; opacity flash 1→0.3 over 8f; no screen shake.  
**Timing:** **12–20f** total; then hold static.

#### `sandbox-box-unfold`
**What:** Rectangle strokes corners → sides → fill; checklist cascades inside.  
**When:** S10 ask.  
**Remotion notes:** Four line segments or one rect with `stroke-dashoffset`; then children stagger.  
**Timing:** Box draw **20–28f**; items stagger **6f** each.

---

### 1.3 UI chrome / layout motion

#### `card-spring-in`
**What:** Card enters with `opacity 0→1`, `y +24→0`, slight `scale 0.96→1`.  
**When:** Citation cards, metric tiles, contrast panels, sandbox box.  
**Remotion notes:** `springSnappy` or `springUI`. Max shadow `0 8px 32px rgba(6,16,31,0.45)` — no multi-layer neon.  
**Timing:** **14–22f**. Stagger cards **6–10f**.

#### `chip-cascade`
**What:** Small pills/chips drop in left→right or top→bottom.  
**When:** Corpus chips (demo Beat3), trust attribute row (S06), tags.  
**Remotion notes:** `springSnappy` + `translateY(12→0)`; width can clip-reveal for “typing chip” feel.  
**Timing:** Per chip **10–14f**; stagger **4–6f**.

#### `card-stack-peel`
**What:** Stacked cards offset; top card peels/slides to reveal next (audit pack metaphor).  
**When:** S08 proof / demo Beat7 PDF stack.  
**Remotion notes:** Absolute stack; animate `y`, `rotate` (−2°→0), `opacity`. Peel = top card `translateY(-20)` + fade while next rises.  
**Timing:** Peel cycle **18–24f**; between peels hold **20–30f**.

#### `panel-split-wipe`
**What:** Two panels (chatbot vs RegOS) enter from opposite sides or wipe reveal.  
**When:** S03 contrast (signature A).  
**Remotion notes:** Prefer spring translate over hard clip for trust tone; rose only on chatbot “fail” side.  
**Timing:** Panels **18–28f**; divider line draw **12–16f**.

#### `kanban-tile-drop`
**What:** Task cards fall into columns with soft bounce.  
**When:** Demo Beat5; optional S04 solution workflow peek.  
**Remotion notes:** `springSnappy`; overshoot y slightly. Owners labels fade after tiles.  
**Timing:** Tile **12–16f**; column stagger **8f**.

#### `browser-chrome-settle`
**What:** Fake browser frame scales/fades into place before UI demo.  
**When:** Demo beats; optional S04 product shot.  
**Remotion notes:** Already have `BrowserChrome.tsx` — wrap with `springSmooth` scale 0.98→1.  
**Timing:** **16–24f**.

#### `cursor-click-press`
**What:** Cursor moves, button scale 1→0.96→1.  
**When:** S07 CTA press; demo interactions.  
**Remotion notes:** Existing S07 `buttonPress` pattern — keep. Cursor: interpolate x/y, then click squash **6–8f**.  
**Timing:** Move **20–40f**; click **8–12f**.

---

### 1.4 Typography / kinetic type

#### `title-rise-fade`
**What:** Title opacity + translateY with `springSmooth`.  
**When:** Default H1 all slides (already used).  
**Timing:** **16–24f**.

#### `typewriter-caret`
**What:** Character reveal + blinking caret.  
**When:** S01 line, S10 close (already have `Typewriter`).  
**Remotion notes:** `CHAR_FRAMES = 2` (project constant). Caret blink period **16f**.  
**Timing:** Length-dependent; budget copy so type finishes **≥45f** before next beat.

#### `highlight-underline-draw`
**What:** Teal underline or background highlight sweeps under key phrase.  
**When:** S01 “cited obligations”; kinetic words.  
**Remotion notes:** Width interpolate 0→100%; or SVG line draw. Prefer underline over yellow marker (too consumer).  
**Timing:** **12–20f** after phrase visible.

#### `kinetic-word-swap`
**What:** Word A blurs/fades out; word B springs in (weeks → minutes).  
**When:** S07 climax (signature C) — already partially implemented.  
**Remotion notes:** Combine `soft-blur-crossfade` (blur 0→6→0) with `springBouncy` on “Minutes” emerald.  
**Timing:** Out **20–30f**; in spring **18–28f**; hold **≥60f**.

#### `metric-count-up-slam`
**What:** Number counts up, then scale pop when target hit.  
**When:** S08 metrics; demo MetricHUD.  
**Remotion notes:** `interpolate` for count; at end frame trigger `springBouncy` scale 1→1.06→1 and color → emerald if success metric. Existing S08 100% count is good — add slam on settle.  
**Timing:** Count **24–36f**; slam **10–14f**.

#### `staggered-line-cascade`
**What:** Multi-line support / bullets cascade.  
**When:** Lists, diffs, sandbox items.  
**Remotion notes:** Per-line `springSnappy` + delay `i * STAGGER` (6f).  
**Timing:** Line **12–16f**; stagger **5–8f**.

---

### 1.5 Transitions & camera

#### `soft-blur-crossfade`
**What:** Fade with brief blur (SaaS “premium” scene change).  
**When:** Optional upgrade to default `fade()` between calm slides — **not** into S07 (keep wipe).  
**Remotion notes:** Custom transition or per-slide exit: `filter: blur(interpolate(...))` + opacity. Cap blur **6–8px**. Remotion `@remotion/transitions` fade is fine; add blur only if render cost OK.  
**Timing:** **12f** (match `FADE_TRANSITION_FRAMES`).

#### `wipe-climax`
**What:** Hard directional wipe into emotional peak.  
**When:** Into S07 only (already wired).  
**Timing:** **15f** (`WIPE_TRANSITION_FRAMES`).

#### `progress-bar-fill`
**What:** Bottom teal progress = slideIndex/10.  
**When:** Global chrome (exists).  
**Remotion notes:** On slide enter, animate width from previous to current over **12–18f** for polish.  
**Timing:** **12–18f**.

#### `parallax-layer-shift`
**What:** Bg blob moves slower than mid UI during long slides.  
**When:** S05 / S07 long holds.  
**Remotion notes:** `translateX(frame * 0.02)` on L0 only.  
**Timing:** Continuous micro-motion.

---

### 1.6 Emphasis / micro-interactions

#### `elastic-overshoot`
**What:** Scale exceeds 1 then settles (playful).  
**When:** Only “Minutes”, icon pops, approved gate — never body paragraphs.  
**Remotion notes:** `springBouncy` / `springPop`.  
**Timing:** Settle by **16–22f**.

#### `gate-pulse`
**What:** Soft ring pulse around human-approval control.  
**When:** S05 gates, S06 review field.  
**Remotion notes:** Scale 1→1.15 opacity 0.4→0, loop once or twice — not infinite neon.  
**Timing:** Pulse **20–30f**; max 2 pulses.

#### `heatmap-cell-cascade`
**What:** Grid cells light up in wave (risk heatmap).  
**When:** S07 / demo Beat7.  
**Remotion notes:** Existing `HeatmapCell` — tighten stagger to **2–3f** for denser “alive” feel; keep rose/amber/emerald (semantic, not purple).  
**Timing:** Full grid fill **40–80f**.

#### `diff-row-slam`
**What:** Impact diff lines (`+12 obligations`) slide in with monospace snap.  
**When:** S07.  
**Remotion notes:** Already staggered; add left accent bar width draw **8f**.  
**Timing:** Row **12–16f**; stagger **6f**.

---

## 2. Reference aesthetics → RegOS adaptation

From Canva-style templates in `VISUAL_DIRECTION_PICK.md`:

### (A) Black bg + blue fluid smoke wave → **Navy void + teal smoke**

| Template | RegOS adaptation |
| --- | --- |
| Pure black `#000` | `#06101F` (`COLOR_NAVY_950`) |
| Bright blue / white smoke | Gradient `#0E7490 → #2DD4BF`, opacity 15–25% |
| High-contrast white type | `#F8FAFC` + slate `#94A3B8` secondary |
| Aggressive glow | Soft bloom only; no bloom on text |

**Implement as:** `FluidSmokeWave` AbsoluteFill behind `RegOSBackground` grid; strongest on S01/S07/S10.

### (B) Soft grainy fluid gradient blob → **Teal→emerald grain orb**

| Template | RegOS adaptation |
| --- | --- |
| Pink/red/white orb | Teal `#2DD4BF` → emerald `#10B981` @ 20–35% |
| Heavy grain | 2–4% overlay only |
| Centered hero blob | Corner or behind logo — never obscuring H1 |

**Implement as:** `FluidBlob` ×2–3 with `blob-drift` + `soft-grain-overlay`.

### (C) 3D glass morph → **Flat glass panels (2.5D), not Three.js**

| Template | RegOS adaptation |
| --- | --- |
| True 3D glass morph | CSS glass: `background: rgba(19,42,74,0.55)`, `backdropFilter: blur(12px)`, 1px `#1B3A5F` border |
| Iridescent purple refraction | **Banned** — use teal edge highlight `linear-gradient` 1px |
| Heavy perspective skew | Max `rotateX(4deg)` optional; prefer 2D spring cards for trust |

**Implement as:** `GlassPanel` wrapper for S06 citation card / S10 sandbox box — spring in with `springSoft`. Skip WebGL for deck reliability.

---

## 3. Remotion implementation cookbook

### 3.1 Core imports

```tsx
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
```

### 3.2 Entrance helper (reuse everywhere)

```tsx
export function useEnter(delay: number, preset: 'snappy' | 'smooth' | 'pop' = 'snappy') {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const configs = {
    snappy: { damping: 20, stiffness: 200 },
    smooth: { damping: 200, stiffness: 100 },
    pop: { damping: 14, stiffness: 260, mass: 0.7 },
  } as const;
  const p = spring({ frame: Math.max(0, frame - delay), fps, config: configs[preset] });
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * 20}px) scale(${interpolate(p, [0, 1], [0.96, 1])})`,
    p,
  };
}
```

### 3.3 SVG draw helper

```tsx
export function StrokeDraw({
  d, delay = 0, color, width = 2, durationHint = 20,
}: { d: string; delay?: number; color: string; width?: number; durationHint?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 200, stiffness: 100 },
    durationInFrames: durationHint, // optional Remotion spring duration clamp
  });
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - p}
    />
  );
}
```

### 3.4 Blur crossfade (exit/enter)

```tsx
const blur = interpolate(frame, [0, 8, 16], [6, 3, 0], { extrapolateRight: 'clamp' });
const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
// style: { filter: `blur(${blur}px)`, opacity }
```

### 3.5 Filter performance rules (Remotion render)

| Effect | OK? | Notes |
| --- | --- | --- |
| `blur(40–120px)` on 2–3 large blobs | Yes | Limit count; avoid animating blur px every frame if possible (animate transform instead) |
| `backdrop-filter` glass | Caution | Works in Chrome headless; test render |
| SVG `feTurbulence` grain | Yes if static-ish | Prefer pre-baked noise PNG for speed |
| Many drop-shadows | No | One shadow max per card |
| `mix-blend-mode: screen` | Test | Fallback to opacity gradients |

### 3.6 Timing cheat sheet (@30fps)

| Pattern | Frames | Seconds |
| --- | --- | --- |
| Icon pop | 10–16 | 0.33–0.53 |
| Card spring | 14–22 | 0.47–0.73 |
| Title smooth | 16–24 | 0.53–0.80 |
| Stroke draw (icon) | 12–20 | 0.40–0.67 |
| Stroke draw (connector) | 30–60 | 1.0–2.0 |
| Chip stagger step | 4–6 | 0.13–0.20 |
| Agent stagger step | 12–18 | 0.40–0.60 |
| Metric count-up | 24–36 | 0.80–1.20 |
| Fade transition | 12 | 0.40 |
| Wipe climax | 15 | 0.50 |
| Blob drift loop | 240–600 | 8–20 |
| Weeks→Minutes morph | 40–60 | 1.3–2.0 |
| Soft blur crossfade | 12 | 0.40 |

---

## 4. SVG icon set recommendations (RegOS)

Design for **animation**: few anchors, open strokes, no tiny inner detail, 24×24 viewBox (scale up in UI).

| Icon | Metaphor | Path simplicity | Animation recipe | Primary slides |
| --- | --- | --- | --- | --- |
| **Shield** | RegOS / Sentinel | 1 hexagon/rounded pentagon + 1 vertical slit rect | `shield-outline-reveal` then fill | S01, chrome logo |
| **Document** | Circular / PDF | Rect + top-right dog-ear (2–3 paths) + 3 horizontal lines | Lines draw after rect; dog-ear fold optional | S04, S06, S08 |
| **Agent node** | Supervised agent | Circle + small inner dot OR hexagon | `icon-pop-spring`; ring `gate-pulse` | S05 |
| **Citation link** | Source → obligation | Elbow or cubic bezier + endpoint caps | `citation-link-draw` + traveling dot | S06 |
| **Checkmark gate** | Human approval | Circle + check polyline (2 paths) | `checkmark-draw-gate` | S05, S06, S10 |
| **Impact lightning** | Change-impact | 4–6 point bolt polyline | `lightning-slash` once | S07 |
| **Sandbox box** | Innovation Sandbox | Rounded rect + optional lid line | `sandbox-box-unfold` | S10 |

### Path authoring rules

1. **Stroke-first icons** for draw animations; convert fills after draw completes.
2. Keep strokeWidth **1.5–2.5** at 24px viewBox so scale to 40–64px stays crisp.
3. `strokeLinecap="round"` / `strokeLinejoin="round"` for SaaS softness.
4. No gradients inside icons (logo rule); solid teal / emerald / white only.
5. Export as React components in `src/remotion/system/icons/` — one file per icon, accept `progress: number` (0–1) for draw amount.
6. Avoid Lucide/Heroicons wholesale if paths are too complex for clean `pathLength` draws — simplify to 1–3 paths.

### Suggested component API

```tsx
// system/icons/types.ts
export type IconMotionProps = {
  size?: number;
  color?: string;
  progress?: number; // 0–1 stroke draw
  popped?: number;   // 0–1 spring scale driver
};
```

---

## 5. Do / Don’t — regulator-facing motion

### Do

- Keep **foreground type razor-sharp** after entrance; atmosphere can blur.
- Use motion to explain **mechanism** (agents, citations, gates, impact) — not to decorate.
- Prefer **one climax wipe** (S07) and quiet fades elsewhere.
- Show **human gates** visually (checkmark, pause, approve) — builds SEBI trust.
- Use emerald for **success / minutes / approved**; teal for **system / active / brand**.
- Hold signature moments on screen long enough to read (**≥1.5–2s** after settle).
- Match existing tokens in `system/colors.ts` — no new accent hues.
- Test full `npm run render:deck` — filters/blend modes can surprise in headless Chrome.

### Don’t

- Don’t use purple, pink, indigo “AI” gradients or glow stacks.
- Don’t shake camera, flash full-screen, or spam particle systems.
- Don’t bounce body copy or apply perpetual spring jitter to paragraphs.
- Don’t autoplay infinite neon pulses on approval UI (looks like ads, not audit).
- Don’t morph text with illegible blur >8px on legal/citation serif.
- Don’t claim “first agentic” or over-animate unverifiable hype.
- Don’t put fluid smoke through the middle of H1 / metrics.
- Don’t add soundtrack-synced beat cuts every 8f — this is a judge deck, not a product launch teaser.
- Don’t use cream newspaper layouts, terracotta, or dense broadsheet columns.
- Don’t introduce Inter/Roboto; stay on Sora + IBM Plex.

**Trust test:** Mute the video and watch once. If a slide still communicates “cited, gated, measurable,” motion succeeded. If it only looks “cool,” cut intensity 40%.

---

## 6. Concrete integration checklist — Composer → `regos-motion`

Apply to composition **`RegOSIdeaDeck`** (`src/remotion/IdeaDeck.tsx`), slides **S01–S10**.  
Demo video can reuse shared system components afterward; **deck first**.

### Phase A — System primitives (do first)

- [ ] **A1.** Extend `system/springs.ts` with `springPop`, `springSoft` (configs above).
- [ ] **A2.** Create `system/FluidBlob.tsx` — 2–3 blurred orbs, `blob-drift`, props: `intensity`, `variant: 'smoke' | 'orb' | 'bloom'`.
- [ ] **A3.** Create `system/FluidSmokeWave.tsx` — SVG or gradient ribbon for aesthetic (A).
- [ ] **A4.** Create `system/GrainOverlay.tsx` — 2–4% noise AbsoluteFill, pointer-events none.
- [ ] **A5.** Upgrade `system/Background.tsx`:
  - Keep navy base + grid + hairline.
  - Compose `FluidBlob` + optional `FluidSmokeWave` + `GrainOverlay`.
  - Props: `atmosphere: 'hero' | 'calm' | 'climax' | 'none'` mapped per slide.
- [ ] **A6.** Create `system/GlassPanel.tsx` — navy glass, 1px border, light shadow (aesthetic C lite).
- [ ] **A7.** Create `system/SvgPop.tsx` — wrapper: children + springPop scale/opacity from `delay`.
- [ ] **A8.** Create `system/StrokeDraw.tsx` — pathLength helper.
- [ ] **A9.** Add `system/icons/*` — Shield, Document, AgentNode, CitationLink, CheckGate, Lightning, SandboxBox with `progress` prop.
- [ ] **A10.** Optional `system/useEnter.ts` hook to dedupe slide boilerplate.

### Phase B — Per-slide motion upgrades

| Slide | File | Atmosphere | Signature patterns | Notes vs current code |
| --- | --- | --- | --- | --- |
| **S01** | `slides/S01_Title.tsx` | `hero` — smoke wave + orbs | `shield-outline-reveal`, `icon-pop-spring` on logo, `typewriter-caret`, `highlight-underline-draw` | Replace scale-only logo with stroke→fill; keep typewriter timing |
| **S02** | `S02_Problem.tsx` | `calm` | `staggered-line-cascade`, soft `card-spring-in` for problem chips | Low atmosphere — problem seriousness |
| **S03** | `S03_Contrast.tsx` | `calm` | `panel-split-wipe`, chatbot side static/fail, RegOS side `chip-cascade` | Rose only on chat fail; no purple |
| **S04** | `S04_Solution.tsx` | `calm` + light bloom | `document` icon pop, `card-spring-in` product frame | Optional browser chrome settle |
| **S05** | `S05_Agents.tsx` | `calm` + `grid-breathe` | `icon-pop-spring` nodes, `svg-stroke-draw` pipeline, `checkmark-draw-gate` | Replace width-% line with pathLength connector; keep 18f stagger |
| **S06** | `S06_Trust.tsx` | `calm` | `citation-link-draw`, `GlassPanel` card, field `chip-cascade`, confidence ring | Signature D — highest trust motion budget |
| **S07** | `S07_Impact.tsx` | `climax` — stronger smoke | `wipe` (exists), `cursor-click-press`, `diff-row-slam`, `lightning-slash`, `kinetic-word-swap`, `heatmap-cell-cascade` | Keep wipe-in; add bolt sparingly; bouncy only on Minutes |
| **S08** | `S08_Proof.tsx` | `calm` | `metric-count-up-slam`, `card-stack-peel` optional | Add slam when 100% hits; emerald settle |
| **S09** | `S09_SebiValue.tsx` | `calm` | Soft cascades, SupTech diagram stroke draw | Restrained — institutional |
| **S10** | `S10_Ask.tsx` | `hero` lite | `sandbox-box-unfold`, `checkmark-draw-gate` list, brand fade | Draw checks instead of static SVG paths |

### Phase C — Transitions & chrome

- [ ] **C1.** Keep `fade` 12f / `wipe` 15f into S07 — do not add flashy transitions.
- [ ] **C2.** Optional: soft blur on fade exits for S01→S02, S08→S09 only (test render).
- [ ] **C3.** `Chrome.tsx` — animate progress bar width between slides (**12–18f**).
- [ ] **C4.** Ensure logo mark uses shared Shield icon component.

### Phase D — QA gate (before calling motion “done”)

- [ ] **D1.** No purple / cream / terracotta anywhere (grep hex + gradients).
- [ ] **D2.** Text remains readable at 1× playback; no blur on IBM Plex Serif citations after settle.
- [ ] **D3.** Each slide has **≤1** signature motion + shared atmosphere.
- [ ] **D4.** S06 citation path and S07 minutes moment still land as storyboard signatures A–E.
- [ ] **D5.** `npm run render:deck` completes; spot-check frames at S01 logo, S05 gates, S06 connector, S07 minutes, S10 box.
- [ ] **D6.** Total duration still ~94–110s; don’t inflate holds just for blobs.
- [ ] **D7.** Mute test: trust story still clear.

### Phase E — File touch list (expected)

```text
regos-motion/src/remotion/system/
  springs.ts          (extend)
  Background.tsx      (compose atmosphere)
  FluidBlob.tsx       (new)
  FluidSmokeWave.tsx  (new)
  GrainOverlay.tsx    (new)
  GlassPanel.tsx      (new)
  SvgPop.tsx          (new)
  StrokeDraw.tsx      (new)
  icons/*.tsx         (new)
  Logo.tsx            (shield draw)
  Chrome.tsx          (progress tween)
slides/S01_Title.tsx … S10_Ask.tsx  (wire patterns)
```

### Phase F — Copy-paste priority order for Composer

1. Atmosphere system (A2–A5) — biggest “Canva template” lift.  
2. Icon set + StrokeDraw + SvgPop (A7–A9).  
3. S01 logo draw + S06 citation draw + S07 minutes polish (signatures).  
4. S05 pipeline pathLength + gates.  
5. S08 metric slam + S10 sandbox unfold.  
6. Remaining slides cascade consistency.  
7. Render QA (Phase D).

---

## 7. Mapping: pattern → existing code hooks

| Existing artifact | Upgrade with |
| --- | --- |
| `RegOSBackground` radial + grid + hairline | + FluidBlob, FluidSmokeWave, Grain |
| `springSnappy/Smooth/Bouncy/UI` | + Pop/Soft; keep semantics |
| `Logo` filled shield | StrokeDraw → fill |
| S05 pipeline `width %` div | SVG line `pathLength` |
| S06 `connectorProgress` | Real bezier StrokeDraw + dot |
| S07 `weeksOpacity` / `minutesSpring` | + blur crossfade + optional lightning |
| S08 count-up | + scale slam at 100% |
| S10 static check SVG | CheckGate `progress` spring |
| `TransitionSeries` fade/wipe | Keep; optional blur fade |
| `Typography` blur (exists) | Reuse for kinetic-word-swap only |

---

## 8. Reference motion language (one paragraph for the team)

RegOS motion should feel like **Linear/Stripe product marketing restrained for a regulator**: a living teal–emerald fluid field on deep navy, crisp Sora titles that rise once, UI chrome that springs into place with light overshoot, SVG strokes that *draw* trust (citations, gates, agents), and a single wipe into the weeks→minutes climax. Grain and glass add depth; nothing purple, nothing frantic, nothing that makes a SEBI judge doubt seriousness.

---

## 9. Sources & priors (for implementers)

- Project locks: `VISUAL_DIRECTION_PICK.md`, `L3_deck_storyboard.md` §1.4 Motion language  
- Remotion: `spring`, `interpolate`, `pathLength` / `strokeDashoffset`, `@remotion/transitions` fade & wipe  
- Remotion SaaS template study cited in L3: `remotion-dev/template-prompt-to-motion-graphics-saas`  
- Industry pattern analogues: Stripe/Linear mesh heroes; Canva dark fluid pitch templates; SaaS icon pop + stagger cascades (Framer/Motion marketing sites) — **reimplemented deterministically in Remotion**, not copied as runtime Framer trees  
- Current codebase baselines: `regos-motion/src/remotion/system/*`, `slides/S01–S10`, `IdeaDeck.tsx`

---

*End of research · Ready for Composer implementation against `RegOSIdeaDeck`.*
