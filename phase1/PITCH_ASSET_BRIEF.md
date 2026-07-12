# RegOS Sentinel — 112s Pitch Film · Asset Brief (Canva + Jitter)

Date: 2026-07-12
Target film: `RegOSFinalPitch112` — 1920×1080, 60fps, 6720 frames (112s), silent.
Palette lock (use exact hex in every prompt): royal `#1B3FB8`, deep `#16349A`, off-white `#F4F4F0`, teal `#2DD4BF`, near-black `#070B1A`, white `#FFFFFF`. **No purple, magenta, orange, rainbow, cyberpunk.**

**Drop everything into:** `/Users/mac/Desktop/sebi hackathon/regos-motion/public/assets/pitch/`

### ✅ CANONICAL FILENAMES (these are wired into the code — use exactly)
The film already renders fully WITHOUT these (coded backgrounds). Each file you drop in
auto-upgrades a world when you flip its flag to `true` in `src/remotion/pitch/assets.ts`.

| Your Canva/Jitter asset | Save as (in `public/assets/pitch/`) | Powers |
| --- | --- | --- |
| A · Dark logo bloom | `plate_bloom.mp4` | Hook + Brand + Ask (void) |
| B · Regulatory signal field (near-black) | `plate_signal.mp4` | Ingest / Compile / Apply / Reg-Diff / Prove stage |
| E · Light contrast plate | `plate_light.mp4` | Verify + Reg-Diff inspection world |
| C · Compliance monolith (transparent PNG) | `art_monolith.png` | optional brand hero |
| D · Documents→obligation graph (transparent PNG) | `art_docgraph.png` | optional transition texture |
| Isolated 3D app icon (transparent PNG) | `icon_app.png` | brand + ask settle |
| Jitter logo splash (Lottie JSON) | `jitter_logo_splash.json` | brand reveal |

After dropping the MUST files, tell me "go" and I flip the flags + re-render.

Prompt library below (tailored versions of the same assets):

Division of labour:
- **I code (no asset needed):** all UI, browser chrome, cursors, tables, obligation cards, counters, notifications, citation beams, Inspector drawer, Reg-Diff panels, Build Manifest, all text/captions, cursor causality, spring/stagger SaaS motion.
- **You supply via Canva:** 4 background motion plates + isolated 3D metaphor stills (transparent PNG).
- **You supply via Jitter:** the logo splash + 4 short transition/effect overlays (Lottie or transparent WebM).

---

## PART A — Canva background motion plates (MUST)

Canva settings for all plates: `Video clip · Ultra · Cinematic · 16:9 · No audio · Wide shot · Soft light`, locked/extremely-slow camera, 8s, seamless loop.

### A1 · `plate_void.mp4` — Hook (00:00) + Ask (01:46)
```
Slow seamless cinematic background plate: a restrained royal-blue light field #1B3FB8 breathes at the center of a near-black void #070B1A; a narrow teal signal core #2DD4BF pulses once every two seconds; faint architectural grid lines appear only near the center; deep clean negative space remains around the edges; subtle fine film grain; locked camera; premium enterprise SaaS launch-film atmosphere; 16:9, 8 seconds. No objects, no interface, no logo, no text, no purple, no magenta, no lens flare, no audio.
```

### A2 · `plate_logo_bloom.mp4` — Brand (00:07)
```
Slow seamless cinematic loop: a compact royal-blue glow #1B3FB8 blooms behind an empty central area on a pure near-black background #070B1A; one thin teal halo #2DD4BF expands and fades; the bloom breathes with restrained intensity; locked camera; high-end enterprise app-launch aesthetic; 16:9, 8 seconds. No icon, no logo, no text, no particles crossing the center, no purple, no magenta, no audio.
```

### A3 · `plate_stage_sweep.mp4` — Ingest / Compile / Apply / Prove
```
Seamless slow-motion background plate of thin royal-blue #1B3FB8 and teal #2DD4BF luminous data ribbons travelling diagonally through a deep royal-blue field #16349A; the ribbons behave like ordered regulatory signals, not silk fabric; occasional fine off-white particles travel along the paths; the center stays calm and readable for UI on top; locked wide camera; subtle grain; premium RegTech launch-film atmosphere; 16:9, 8 seconds. No UI, no text, no logos, no purple, no rainbow glow, no audio.
```

### A4 · `plate_offwhite.mp4` — Verify / Reg-Diff inspection world
```
Ultra-minimal off-white motion plate, exact base #F4F4F0. A pale royal-blue illumination #1B3FB8 at low opacity passes slowly through the center from left to right, followed by one narrow teal verification glint #2DD4BF, then the field returns to clean off-white. Extremely subtle fine grain, locked camera, premium enterprise SaaS transition plate, 16:9, 8 seconds seamless. No objects, no text, no logo, no purple, no beige warmth, no audio.
```

---

## PART B — Canva isolated 3D metaphor stills (transparent PNG)

For each: generate on the stated background, then **Canva → remove background → export transparent PNG**.

### B1 · `icon_app.png` (MUST) — 1:1 — brand settle + ask collapse
```
A premium enterprise SaaS app icon for RegOS Sentinel: a precise rounded-square tile made from deep royal-blue glass, exact color #1B3FB8, with restrained inner depth and crisp beveled edges; centered white hexagonal shield containing a minimal vertical document slit; a thin teal verification rim, exact color #2DD4BF, around the shield; frontal orthographic composition, immaculate studio render, institutional and trustworthy rather than playful, 1:1. No text, no letters, no purple, no magenta, no cyan rainbow, no extra symbols, no mockup frame.
```

### B2 · `art_monolith.png` (NICE) — 9:16 — optional hero behind brand
```
A monumental vertical 3D compliance monolith built from hundreds of regulatory document sheets. At the base, clean white pages are loose and partially disordered. Through the middle they progressively align into exact rectangular modules. At the top the modules become a perfectly ordered crystalline obligation graph made from royal-blue glass #1B3FB8 with thin teal seams #2DD4BF. A small off-white human-approval gate is embedded near the crown, suggesting supervised transformation from regulation to action. Slight low-angle view, full object visible base to crown, centered, premium enterprise product sculpture, crisp studio lighting, portrait 9:16, perfectly flat off-white background #F4F4F0. No text, no people, no clock tower, no lighthouse, no city, no purple, no black background.
```

### B3 · Agent icon set (NICE) — 1:1 each, transparent
Run six times, one per filename, replacing `[OBJECT]`. Base prompt:
```
A minimal premium 3D icon of [OBJECT], sculpted from royal-blue glass #1B3FB8 with deeper blue internal shading and one thin teal verification edge #2DD4BF; isolated front-three-quarter view, centered on a perfectly flat off-white background #F4F4F0; crisp studio lighting, compact contact shadow, consistent enterprise SaaS icon family, 1:1. No text, no letters, no surrounding badge, no purple, no magenta, no gradient background.
```
- `agent_watcher.png` → `a precise radar dish detecting one incoming document signal`
- `agent_interpreter.png` → `a regulatory document with a magnifying lens isolating one clause`
- `agent_verifier.png` → `a hexagonal verification gate connecting a source clause to a structured record`
- `agent_mapper.png` → `a network map connecting one obligation to an owner, deadline, and control`
- `agent_evidence.png` → `an evidence folder receiving a document and sealing it with a check`
- `agent_auditor.png` → `an audit manifest with a shield and a replay arrow`

### B4 · `art_regdiff.png` (NICE) — 16:9 — brief Reg-Diff transition texture
```
A high-end RegTech 3D illustration on a perfectly flat off-white background #F4F4F0. Two regulatory document planes stand side by side: the older version on the left in white with muted royal-blue structure, the amended version on the right in royal blue #1B3FB8. Between them, precise teal change markers #2DD4BF identify four transformations: one added block, one changed deadline block, one superseded block dissolving cleanly, and one applicability branch moving to a new entity profile. Ordered diagrammatic composition with real depth, crisp studio light, 16:9. No readable text, no red/green diff colors, no purple, no code editor, no people.
```

---

## PART C — Jitter animations (MUST logo, rest NICE)

Preferred export: **Lottie JSON** (vector, native alpha) — filename `*.json`. Fallback: transparent WebM (VP9 alpha) — filename `*.webm`.

### C1 · `jitter_logo_splash` (MUST) — ~3.5s, 800×800, transparent
Build in Jitter (the "Logo Tap: Color Reveal" + "Sliding Name" templates you liked):
- Emblem (hex shield) stays static/centered; a restrained blue color-pulse breathes behind it (yellow→NOT; keep it royal `#1B3FB8` → teal `#2DD4BF` only).
- One teal verification ring expands once around the shield.
- Wordmark "RegOS Sentinel" slides in from behind the mark (mask reveal), settles.
- No looping bounce; ends on a clean settled frame.

### C2 · `jitter_wipe_offwhite` (NICE) — ~0.5s, 1920×1080
```
Create a very brief horizontal field-wipe distortion for a full-screen transition. The wipe compresses the outgoing royal-blue field #1B3FB8 into a narrow vertical line, then reveals an off-white field #F4F4F0. Add one thin teal edge #2DD4BF. No liquid wobble, no chromatic aberration, no purple.
```

### C3 · `jitter_velocity_echo` (NICE) — ~0.3s, transparent, 1920×1080
```
A short directional echo-trail: one teal duplicate edge #2DD4BF, max opacity 18%, delayed one frame, moving left-to-right, lasting no more than six frames, returning to a perfectly sharp original. No RGB separation, no purple, no continuous glitch.
```

### C4 · `jitter_verify_ripple` (NICE) — ~0.7s, transparent, 600×600
```
A single precise verification ripple from the center of a hexagonal shield: teal #2DD4BF, expand once and fade completely, do not distort the shield. Institutional and restrained, not a neon pulse loop.
```

### C5 · `jitter_fragment_trail` (NICE) — ~1s, transparent, 1920×1080
```
A controlled rectangular fragment trail for a document layer: axis-aligned fragments travel toward one destination and disappear cleanly into a mask. Feels like structured compilation, not explosion or disintegration. Royal-blue #1B3FB8 fragments with teal #2DD4BF edges.
```

---

## PART D — SaaS animation patterns (I code these; listed so you know the motion language)

Notification/toast cascade (22–28f, 10–12f stagger) · number-ticker counters (tabular nums) · row cascade with spring overshoot · skeleton→content loaders · cursor causality (approach→hover→press→state→camera) · focus mask push-in · gate pass/fail checkmarks · tab/profile switch with content re-cascade · progressive disclosure of the Inspector drawer · WEEKS→MINUTES / ONE CORPUS→ONE PROFILE→ONE PILOT live caret swaps.

---

## Priority order to unblock me
1. **MUST first (I start immediately):** `plate_void.mp4`, `plate_logo_bloom.mp4`, `plate_stage_sweep.mp4`, `plate_offwhite.mp4`, `icon_app.png`, `jitter_logo_splash`.
2. **NICE (drop in as you make them):** monolith, 6 agent icons, `art_regdiff.png`, the 4 Jitter effect overlays.

When the MUST set is in the folder, say **"go"** and I finish all 9 beats.
