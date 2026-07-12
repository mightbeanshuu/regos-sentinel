# RegOS Sentinel — Motion Deck Progress (regos-motion)

_Last updated: 2026-07-10. Remotion idea deck `RegOSIdeaDeck` (10 slides, 1920×1080, 30fps)._

## What this is
Code-driven Remotion (React → video) pitch deck. Not static slides — every "slide"
is a React component under `src/remotion/slides/`. View live in Remotion Studio
(`npm run dev` → localhost:3000), which hot-reloads on save. Render only when final.

## Design direction applied
Fused the deck's premium dark navy/teal SaaS look with the **editorial "Black & White
Minimalist" pitch style** the user provided (oversized type, generous whitespace,
signature **pill chrome**). Kept color (teal/navy) — that's the "add color" part.
Canva AI (canva.com/ai) was used as a **visual reference** for a teal/navy network
constellation; recreated as animated Remotion SVG (crisper than embedding raster).

## Changes made & VERIFIED in studio ✅
- **Global `system/Chrome.tsx`** — rewrote as glass **pill chrome**: logo pill (top-left),
  "PS2 · SEBI TechSprint" label pill (top-right), **"Page 0X / 10" pill** (bottom-right),
  teal progress bar. Animated entrance. Applies to all slides using `<Chrome/>`.
- **S01 Title** — added `system/NetworkField.tsx`: animated teal constellation
  (nodes pop + twinkle, lines draw in) behind the hero. Canva-inspired, coded. ✅ looks great.
- **S02 Problem** — removed stray red `"by hand"` debug span; converted the accidental
  vertically-stacked layout (AbsoluteFill defaults to `flex-direction: column`) into a
  balanced 2-column row; upgraded stat cards (gradient, radius, shadow). ✅
- **S04 Solution** — removed duplicate in-body logo lockup; added teal eyebrow
  ("THE SOLUTION · SUPERVISED AGENTIC COMPLIANCE"); vertically centered; bumped hero
  carousel type to 54px. ✅
- **S05 Agents** — cleared pill nav collision (top pad 132) + wrapped the 5-agent
  pipeline in a flex-centered container so it fills instead of leaving an empty bottom. ✅
- **S06 Trust** — cleared pill nav collision (top pad 124). ✅
- **S07 Impact** — fixed the **"Minutes"/lightning collision**: the Weeks→Minutes morph
  now renders "→ ⚡ Minutes" as one centered flex row (no overlap). ✅
- **S08 Proof** — vertically centered (fixes empty bottom + clears pill). ✅
- **S09 SebiValue** — top pad 126 + centered (clears pill). ✅

## Remaining / next (NOT yet done — stopped on request)
- **S10 Ask**: still missing the pill chrome (no page pill / progress bar — inconsistent
  with the other 9). Planned: add `<Chrome slideIndex={10} totalSlides={10} showLogo={false}/>`
  and a faint `<NetworkField opacity={0.4}/>` to bookend with S01 and fill the empty right half.
- **S03 Contrast**: not yet re-verified against the new pill chrome (title is centered,
  low collision risk, but confirm).
- Optional: subtle constellation accent on S07 climax; tighten S06 upper gap.

## Key gotcha (important for future edits)
Remotion's `<AbsoluteFill>` defaults to `display:flex; flex-direction:column`. Several
"two-column" layouts were actually stacking vertically → dead gaps. Use explicit
`flexDirection:'row'` for columns, and `justifyContent:'center'` to vertically balance
top-anchored content.

## Assets
- Canva AI reference thread (network-graph hero backgrounds): generated 4 options,
  used #1 as the look reference for `NetworkField`. Raster not embedded.
- Reference pitch template (user-provided): "Black and White Minimalist Pitch Deck" (10 SVGs).
