# Font & Clarity Audit — RegOS Idea Deck (SEBI / RegTech)

> **Purpose:** Exhaustive typography + judge-legibility audit for the Remotion `RegOSIdeaDeck` (1920×1080 @ 30fps).  
> **Audience:** Build team polishing Phase 3 motion + microcopy.  
> **Date:** 2026-07-10  
> **Inputs:** `fonts.ts`, sample slides S01/S03/S05/S07 (+ full S02–S10 read), `PITCH_DECK_CRAFT_RESEARCH.md`, `VISUAL_DIRECTION_PICK.md`, fintech/SaaS type research (Stripe / Linear / Vercel aesthetic vs institutional trust).

---

## Executive verdict (read this first)

| Question | Answer |
| --- | --- |
| **Fonts: KEEP or SWITCH?** | **KEEP** — Sora + IBM Plex Sans + IBM Plex Serif |
| **Is the deck “bad”?** | **No.** It is not bad. |
| **Is it clear?** | **Mostly clear, with 3 UNCLEAR slides and 1 BAD slide.** Spine and craft are strong; density and delayed motion hurt glance-legibility. |
| **Biggest clarity risk** | S09 packs 5+ ideas; S04 has no real H1; S03 leads with “RAG” jargon; several SVG pops fire *after* the first 0.4s window judges use to “see” the slide. |

**One-line for the team:** Keep the type system; cut jargon walls; force hero SVG pops into frames 0–12 of every slide.

---

## 1. Font recommendation — KEEP current

### 1.1 Locked Remotion packages (exact)

Current `regos-motion/src/remotion/system/fonts.ts`:

| Role | Google Font | Remotion import path | Weights loaded |
| --- | --- | --- | --- |
| Brand / H1 / display | **Sora** | `@remotion/google-fonts/Sora` | 400, 500, 600, 700 |
| Body / UI / support | **IBM Plex Sans** | `@remotion/google-fonts/IBMPlexSans` | 400, 500, 600, 700 |
| Clause / citation authenticity | **IBM Plex Serif** | `@remotion/google-fonts/IBMPlexSerif` | 400, 500, 600 |

```ts
import {loadFont as loadSora} from '@remotion/google-fonts/Sora';
import {loadFont as loadIBMPlexSans} from '@remotion/google-fonts/IBMPlexSans';
import {loadFont as loadIBMPlexSerif} from '@remotion/google-fonts/IBMPlexSerif';
```

**Decision: KEEP all three. Do not switch.**

### 1.2 Why this stack wins for SEBI judges

SEBI / TechSprint juries optimize for **trust × PS fit × inspectability**, not “hottest SaaS landing page.” Typography must signal:

1. **Market infrastructure** (not consumer AI wrapper)  
2. **Document authenticity** (circulars, clauses, citations)  
3. **SaaS-premium craft** (so it doesn’t look like a PowerPoint from 2014)

| Signal | How Sora + Plex delivers |
| --- | --- |
| **Regulator trust** | IBM Plex is IBM’s corporate superfamily — designed for enterprise / institutional voice (human + machine). Reads as “serious systems,” not “YC demo day cosplay.” |
| **Document authenticity** | IBM Plex Serif on clause text (S06) is the single strongest “this came from a PDF” cue available in free Google Fonts. Stripe/Linear never need this; RegTech does. |
| **SaaS premium without purple-AI** | Sora is a geometric display with large x-height and crisp digital terminals — premium product energy without Inter/Geist monoculture or Stripe-purple associations. |
| **Anti-cliché** | Explicitly avoids Inter / Roboto / Arial / system (generic) and Geist (2025–26 “AI fingerprint” / Vercel cosplay). |
| **Coherent family** | Plex Sans + Plex Serif share DNA; Sora provides display contrast without fighting Plex’s technical character. |

**Judge mental model mapping:**

```text
Does this look like ChatGPT-with-a-SEBI-PDF?
  → No: navy/teal + Plex Serif clause cards say “compliance OS”
Does this look like a funded fintech product?
  → Yes: Sora display + tight letter-spacing on metrics
Does this look like purple AI wrapper #482?
  → No: zero Inter/Geist/violet stack
```

### 1.3 SaaS aesthetic map (Linear / Stripe / Vercel) vs RegOS

| Brand | Type pattern | What it signals | Borrow for RegOS? |
| --- | --- | --- | --- |
| **Stripe** | Söhne (proprietary) + Source Sans–class body; elegant light weights; purple brand | Payments infrastructure, refined | Borrow: large display sizes, restrained weight, tabular numerals. **Do not borrow purple or Söhne clone.** |
| **Linear** | Inter Variable, one family, weight-only hierarchy | Ultra-minimal product UI; purple accent | Borrow: “type recedes so data foregrounds” on tables (S03/S06). **Do not adopt Inter as brand** — too generic + Linear-purple adjacency. |
| **Vercel** | Geist; black/white; skipped type ramp (96px hero → body) | Devtools / deploy / AI-adjacent | Borrow: aggressive size jumps (H1 vs body). **Do not adopt Geist** — now reads as “generated AI startup.” |
| **Government / institutional** | Often Source Sans, Public Sans, IBM Plex, Noto | Neutrality, accessibility, permanence | **Plex already lands here** — keep. |
| **RegOS (locked)** | Sora display + Plex Sans UI + Plex Serif clauses | SaaS-premium × regulator-trust | Correct hybrid. |

**Craft rule derived from Stripe/Linear/Vercel without cargo-cult:**

- Use **skipped ramps** (Vercel): H1 and body should feel like different sizes, not a gentle ladder.  
- Use **data-first type** (Linear): on obligation tables, Plex Sans at 13–15px with tabular nums — not decorative display.  
- Use **display authority** (Stripe): Sora 600–700 for brand and climax numbers only.  
- Use **serif for source text** (RegTech-only): Plex Serif is the differentiator Stripe never needed.

### 1.4 Alternatives considered — and rejected

| Candidate | Remotion package | Why tempting | Why reject for RegOS |
| --- | --- | --- | --- |
| Inter | `@remotion/google-fonts/Inter` | Linear aesthetic; small-size king | Generic SaaS fingerprint; weak brand; already banned in craft research |
| Geist | Not on Google Fonts / Remotion GF (self-host) | Vercel premium | AI-startup fingerprint 2026; wrong trust signal for SEBI |
| Plus Jakarta Sans | `@remotion/google-fonts/PlusJakartaSans` | Soft SaaS premium | Too “startup landing”; softer than Plex for regulator |
| DM Sans | `@remotion/google-fonts/DMSans` | Clean geometric | Overused in fintech templates; less institutional than Plex |
| Manrope | `@remotion/google-fonts/Manrope` | Modern geometric | Competes with Sora; no serif companion story |
| Space Grotesk | `@remotion/google-fonts/SpaceGrotesk` | Techy display | Edgy / crypto-adjacent; weaker trust |
| Source Sans 3 | `@remotion/google-fonts/SourceSans3` | Gov-adjacent | Safer but blander; loses Plex’s enterprise distinctiveness |
| Public Sans | `@remotion/google-fonts/PublicSans` | USWDS / gov trust | Excellent trust, weak SaaS-premium; would flatten brand |
| Outfit / Poppins | various | Friendly geometric | Consumer / playful — wrong for SEBI |

**Optional micro-upgrade (not a switch):** If Sora ever feels too “product marketing” on S01, keep Sora for wordmark only and set H1 in **IBM Plex Sans 700** — still KEEP the package set; just reassign roles. Do **not** add a fourth family.

### 1.5 Weight & OpenType usage (implementation notes)

| Context | Font | Weight | Notes |
| --- | --- | --- | --- |
| Brand wordmark | Sora | 700 | Letter-spacing −0.02 to −0.04em |
| H1 titles | Sora | 700 | Max ~2 lines |
| H2 / panel headers | Sora | 600 | Teal allowed for RegOS-side labels |
| Body / support | Plex Sans | 400–500 | Line-height 1.45–1.55 |
| Captions / chrome | Plex Sans | 400 | Slate-400; never compete with H1 |
| Gloss (italic OK) | Plex Sans | 400 italic | Teal; **one gloss max per slide** |
| Clause / PDF quote | Plex Serif | 400–500 | Dark text on white card only |
| Metrics / % | Sora | 700 | `font-variant-numeric: tabular-nums` on Plex for table cells |
| Table cells | Plex Sans | 400–500 | 13–15px; Linear-style data-first |

---

## 2. Type scale — 1920×1080 Remotion

Target: back-row / paused-frame legibility (YC Hale: legible, simple, obvious). DocSend forcing function: ~30pt+ for primary claims.

### 2.1 Canonical scale (px @ 1920×1080)

| Token | Role | Font | Size (px) | Weight | Line-height | Tracking | Color role |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Brand** | Wordmark / S01 hero name | Sora | **72–96** | 700 | 1.0 | −0.04em | White |
| **H1** | Slide title (one idea) | Sora | **48–56** | 700 | 1.1–1.15 | −0.03em | White |
| **H1-climax** | S07 Weeks/Minutes | Sora | **88–96** | 700 | 1.0 | −0.04em | Rose → Emerald |
| **H2** | Panel / column header | Sora | **22–28** | 600 | 1.2 | −0.01em | Teal or White |
| **Lead** | One supporting sentence | Plex Sans | **22–24** | 400–500 | 1.5 | 0 | Slate-400 |
| **Body** | Secondary prose / honesty band | Plex Sans | **16–18** | 400 | 1.5 | 0 | Slate-400 / Teal |
| **UI / table** | Obligation grid cells | Plex Sans | **13–15** | 400–500 | 1.4 | 0 | White / Slate |
| **Caption** | Corpus, footer, chrome | Plex Sans | **14–16** | 400 | 1.4 | 0 | Slate-400 |
| **Gloss** | One-line jargon decode | Plex Sans italic | **15–16** | 400 | 1.4 | 0 | Teal-400 |
| **Eyebrow** | PS tag / continuity | Plex Sans | **16–18** | 500 | 1.2 | 0.06em | Slate-400 |
| **Stamp** | Failure / success strip | Plex Sans | **13–14** | 500 | 1.35 | 0 | Rose / Teal |
| **Metric** | Big proof numbers | Sora | **64–72** | 700 | 1.0 | −0.04em | White / Emerald |
| **Ask H1** | S10 “Ask” | Sora | **64–72** | 700 | 1.0 | −0.03em | White |

### 2.2 Current vs recommended (drift audit)

| Slide | Current primary size | Verdict |
| --- | --- | --- |
| S01 one-liner | **36px** Sora | **Too small for hero claim** — bump to **44–48** or make Logo the only hero and treat line as Lead 24–28 |
| S02 H1 | 56px | ✅ On scale |
| S03 title | 40px | Slightly light for 1920 — prefer **44–48** |
| S04 | No H1; carousel 40px | **Structural miss** — add H1 48–52 |
| S05 H1 | 48px | ✅ |
| S06 H1 | 48px | ✅ |
| S07 H1 / morph | 52 / 96 | ✅ |
| S08 H1 / metrics | 44 / 72 | ✅ (H1 could be 48) |
| S09 H1 | 44px | ✅ if content cut; else still crowded |
| S10 Ask | 72px | ✅ |

### 2.3 Word budgets (paired with type)

| Element | Max words | Max lines |
| --- | --- | --- |
| H1 | **8** (hard target) | 2 |
| Lead / support | 18 | 2 |
| Gloss | 12 | 1 |
| Honesty / wedge | 22 | 2 |
| On-slide total prose (excl. tables) | ~40–50 | — |

---

## 3. Clarity audit — is the deck bad or unclear?

### 3.1 Overall judgment

**Not bad.** The narrative spine (Problem → Contrast → Solution → Agents → Trust → Impact → Proof → SEBI value → Ask) is correct for a regulator hackathon. Visual system (navy/teal, anti-purple) is locked and appropriate. Several slides already pass the stranger test (S02, S05, S07).

**Not fully clear.** Failures are craft density, jargon without immediate gloss, missing H1, and multi-idea slides — not broken strategy.

| Grade | Meaning |
| --- | --- |
| **CLEAR** | Glance → one sentence idea; hierarchy works; jargon glossed or absent |
| **UNCLEAR** | Idea exists but buried, jargon-first, weak hierarchy, or delayed reveal |
| **BAD** | Multiple competing ideas, text wall, or stranger cannot recover the point |

### 3.2 Slide-by-slide verdict

| Slide | Verdict | What’s working | What’s unclear / weak |
| --- | --- | --- | --- |
| **S01 Title** | **UNCLEAR** | Strong one-liner operational chain; good gloss; brand-first intent | Logo + typewriter compete; H1-equivalent is only **36px**; “agentic compliance OS” still jargon-adjacent; shield draw + typewriter delay means first 0.4s is mostly empty navy |
| **S02 Problem** | **CLEAR** | Concrete pain; “by hand” highlight; Weeks as emotional number; source footer present | 95% chip still invites “prove it” — footer helps but label is long; underline on “by hand” is slightly detached from Typewriter layout |
| **S03 Contrast** | **UNCLEAR** | Best strategic slide in the deck; verdict line is excellent; table vs chat is obvious once seen | Title leads with **“RAG”** — many SEBI judges won’t map that acronym in 1s; left gloss + stamp + bubbles = text density; 6-column table at 13–14px is hard from back row; verdict arrives at frame ~300 (late) |
| **S04 Solution** | **UNCLEAR** | Honesty band is gold; carousel trust verbs are right; pills are integrity signals | **No H1** — slide opens on subcopy; “Supervised agentic…” is a paragraph not a title; gloss + honesty + carousel = three messages; pills look like marketing chips |
| **S05 Agents** | **CLEAR** | Title is the model H1 (≤8 words, one idea); human gate is the point; pipeline encodes agentic | Agent subcopy is dense at 12px; “applicability filter” may need a 3-word gloss; first agent pop at delay 20 (~0.67s) misses first 0.4s |
| **S06 Trust** | **CLEAR** | Title is memorable; citation→card mechanism is the proof; disclaimer present; Plex Serif clause is perfect | Support + gloss **say the same thing twice**; “Reg 16C-ready” assumes knowledge (chip helps if high-contrast); trust strip is jargon salad (Retrieval-grounded · …) |
| **S07 Impact** | **CLEAR** | Climax works; Weeks→Minutes is the one memorable number; diffs look operational | Early slide is busy (button + diffs + heatmap) before morph; gloss + caption near-duplicate at end; lightning SvgPop is late (correct for climax, wrong if judges scrub early) |
| **S08 Proof** | **CLEAR** | Method-scoped metrics; honest posture title; corpus named | “≥0.85 extraction precision” is opaque without “labeled set” emphasis; decorative bar charts at 15% opacity add noise; “Live overlay” line is VO-ish, not glanceable |
| **S09 SEBI value** | **BAD** | Dual value title is right; Reg 16C chip matters; wedge honesty is needed | **Five ideas on one slide:** dual lists + continuity + Reg 16C + wedge + posture + gloss that repeats title. Gloss duplicates TITLE. Continuity typewriter is a second story. Stranger cannot state *one* idea. |
| **S10 Ask** | **CLEAR** | Ask = path not money; checklist is sandbox-real; close line is strong | Title “Ask” alone is VC-shaped (fine if body carries); BODY2 packs SupTech + Reg 16C + HITL; checklist items are long |

### 3.3 Cross-cutting clarity defects

| Defect | Where | Fix class |
| --- | --- | --- |
| **Jargon overload** | S03 “RAG”, S04/S05 “agentic”, S06/S09 “Reg 16C”, S08 “≥0.85”, S09 “SupTech/RegTech” | Lead with plain English; put acronym in gloss or chip — never in H1 unless already defined |
| **Text walls** | S03 left panel, S09 bottom stack, S04 honesty+sub+gloss | One support + one gloss max; move rest to VO |
| **Weak hierarchy** | S04 (no H1), S01 (36px claim), S09 (everything same weight) | Enforce type scale; one dominant text block |
| **Duplicate messaging** | S06 support≈gloss; S09 title≈gloss; S07 caption≈gloss | Delete the weaker line |
| **Late kinetic claim** | S03 verdict @300f; S07 morph @210f; S01 typewriter @105f | Ensure *paused at 0.4s* still shows title + one icon |
| **Table illegibility** | S03 6 cols | Prefer 4 cols on-slide (Actor / Action / Deadline / Clause) + VO the rest |

### 3.4 “Bad or not clear?” — plain answer

> The RegOS deck is **not bad**. It is a **strong regulator-spine deck with clarity debt**.  
> Treat **S09 as BAD** (split or cut), **S01/S03/S04 as UNCLEAR** (hierarchy + jargon), and protect **S02/S05/S06/S07/S08/S10 as CLEAR** with microcopy trims only.

---

## 4. Concrete rewrite microcopy (UNCLEAR / BAD only)

Rules: H1 ≤8 words where possible; one idea; plain English first.

### S01 — UNCLEAR → CLEAR

| Slot | Current | Rewrite |
| --- | --- | --- |
| H1 (replace 36px line as true title) | `Circulars → cited obligations → audit-ready action.` | **Circulars become cited action.** (5) |
| Lead | `An agentic compliance OS for SEBI intermediaries.` | **Compliance OS for SEBI intermediaries.** (5) |
| Gloss | Keep | Keep — already excellent |

Optional alternate H1 (more operational): **From circular text to owners.** (6)

### S03 — UNCLEAR → CLEAR

| Slot | Current | Rewrite |
| --- | --- | --- |
| H1 | `Judges ask: "Isn't this just RAG?"` | **Not another chatbot.** (3) |
| Alt H1 (keeps objection) | — | **Chat answers. Work needs owners.** (5) |
| Left stamp | Keep (strong) | Keep |
| Left gloss | Long RAG explanation | **Retrieval without structure is still chat.** (6) |
| Verdict | Keep | Keep — do not soften |
| Table cols (on-slide) | 6 columns | Show **Actor · Action · Deadline · Clause** (4); Evidence/Conf in VO |

### S04 — UNCLEAR → CLEAR

| Slot | Current | Rewrite |
| --- | --- | --- |
| **Add H1** | *(missing)* | **Supervised compliance, not autopilot.** (4) |
| Lead | `Supervised agentic compliance for stock brokers — then every SEBI intermediary.` | **Built for stock brokers first.** (5) |
| Honesty | Two sentences (keep meaning) | **Enterprise tools exist. We serve lean brokers.** (7) |
| Gloss | Keep | Keep |
| Carousel prefix | `Every output is` | Keep |

### S09 — BAD → CLEAR (must cut to one job)

**Pick one job for the slide:** *Why SEBI cares* = RegTech + SupTech dual value. Move wedge to S04 (already there) or S10; move continuity to VO; keep Reg 16C as one chip.

| Slot | Current | Rewrite |
| --- | --- | --- |
| H1 | `RegTech for brokers. SupTech visibility for SEBI.` | **Brokers comply. SEBI sees readiness.** (6) |
| Lead | `Anonymized readiness across intermediaries — no raw PII.` | **Anonymized readiness — no raw PII.** (5) |
| Gloss | Deletes (duplicates title) | **Cut entirely.** |
| Wedge | On this slide | **Move to S04 or S10** — don’t re-argue honesty here |
| Continuity line | On-slide typewriter | **VO only** or single chip: `2025 → 2026 Agentic` |
| Posture | `Packaged for Innovation Sandbox…` | **Sandbox-ready packaging, not demo theater.** (5) |
| Reg 16C chip | Keep | Keep high-contrast — this is the why-now |

### Optional trims on CLEAR slides (not required, high ROI)

| Slide | Trim |
| --- | --- |
| S06 gloss | Cut — support already says it |
| S07 gloss | Cut — caption already says it |
| S08 overlay | Cut or → VO |
| S10 BODY2 | Split: lead = pilot path; chip = `Reg 16C HITL pack` |

---

## 5. Popping animation visibility checklist

### 5.1 Physics of “first 0.4s”

| Constant | Value |
| --- | --- |
| Composition FPS | **30** |
| First 0.4s window | **Frames 0–12** |
| SvgPop behavior | `springPop` → scale `0 → 1.08 → 1`, opacity follows spring |
| Human perception | If the hero icon is still at scale≈0 when frame 12 hits, **judges never “see the pop”** — they only see a settled icon later (or miss it on scrub) |

**Policy:** Every slide’s **primary SVG / logo mark / gate icon** must begin its pop at **`delay ≤ 4`** (ideally `0–3`) so the overshoot is visible inside frames 0–12. Secondary pops may stagger at +6–12f. Never put the *only* meaningful icon at delay ≥ 20 on a short attention slide.

### 5.2 Current delay audit (from code)

| Slide | Hero visual | Current delay | In first 0.4s? | Action |
| --- | --- | --- | --- | --- |
| S01 | Shield / Logo draw | frame −24 start | Partial (draw starts ~0.8s) | Start shield at **frame 0–3**; keep typewriter later |
| S02 | Document SvgPop | **20** | ❌ No | Set Document `delay={0}` or `2` |
| S03 | Document / AgentNode | **35 / 45** | ❌ No | Pop both icons at **0–4**; panels can still slide at 20 |
| S04 | Document SvgPop | **12** | Borderline | Move to **0–3** |
| S05 | Agent nodes | **20 + i×18** | ❌ First agent at 0.67s | Agent 0 at **delay 0**; stagger **8–10f** (not 18) |
| S06 | Citation connector | **150** (draw) | N/A (story beat) | OK late — but title must be visible at 0; add tiny link icon pop at **0** as foreshadow |
| S07 | Lightning | **morphStart+5 ≈ 215** | Intentional climax | OK late; ensure title + CTA visible in 0–12 |
| S08 | *(no SvgPop)* | — | — | Add optional checkmark pop at **0** on first metric |
| S09 | *(no SvgPop)* | — | — | Optional dual icons at **0 / 6** for Intermediary vs SEBI |
| S10 | SandboxBox | **110** | ❌ Far too late | Pop sandbox icon at **0–4**; checklist can stagger later |

### 5.3 Per-slide “judges SEE it” checklist

Use this as a Remotion preview QA gate (scrub to frame **12** on every slide):

- [ ] **S01 @ f12:** Logo or shield visible and mid-pop / mid-draw; eyebrow optional; typewriter may still be empty  
- [ ] **S02 @ f12:** Document icon popped; H1 line 1 readable  
- [ ] **S03 @ f12:** Both panel icons popped (even if panels still sliding); title readable — **not** waiting for RAG explanation  
- [ ] **S04 @ f12:** H1 readable; document icon popped  
- [ ] **S05 @ f12:** First agent node + gate visibly popping; title readable  
- [ ] **S06 @ f12:** Title readable; source card opacity >0; connector may wait  
- [ ] **S07 @ f12:** Title readable; climax morph must **not** be required yet  
- [ ] **S08 @ f12:** Title + first metric column entering  
- [ ] **S09 @ f12:** Title only + maybe one chip — not the full bottom stack  
- [ ] **S10 @ f12:** “Ask” + sandbox icon popped; checklist may be empty still  

### 5.4 Motion rules (aligned with Hale + VISUAL_DIRECTION_PICK)

| Do | Don’t |
| --- | --- |
| Hero SvgPop in frames **0–12** | Hero pop after frame 20 |
| Stagger secondaries by **6–10f** | Stagger by 18–45f so pops feel random |
| Title opacity spring from frame **0** | Title delayed until after icons |
| Climax-only late pops (S07 lightning, S03 verdict) | Late pops for the *only* meaning-bearing icon |
| Paused-frame still readable | Rely on motion to carry the claim |
| Fluid blobs behind type | Anything that reduces title contrast in first 0.4s |

### 5.5 Suggested default timing tokens

```text
POP_HERO_DELAY     = 0–3 frames   // ≤0.1s
POP_SECONDARY      = 6–12 frames  // still inside/near 0.4s
POP_STAGGER_STEP   = 8 frames     // ~0.27s between siblings
STORY_BEAT_DELAY   = 60f+         // connectors, morphs, verdicts — OK late
TYPEWRITER_START   = ≥45f         // after hero pop is seen
```

---

## 6. Implementation priority (ship order)

| Priority | Change | Effort | Impact |
| --- | --- | --- | --- |
| P0 | Rewrite S09 to one idea; cut duplicate gloss | Copy | Unblocks BAD slide |
| P0 | Add S04 H1; demote current sub to Lead | Copy + layout | Fixes missing hierarchy |
| P0 | Retitle S03 away from “RAG” | Copy | Judge glance fix |
| P0 | Move hero SvgPop delays to ≤4f (S02/S03/S05/S10) | Motion | Pop visibility |
| P1 | Bump S01 claim size or elevate Logo as sole hero | Type | Brand-first rule |
| P1 | Dedupe S06/S07 glosses | Copy | Less text wall |
| P1 | S03 table → 4 visible columns | Layout | Back-row legibility |
| P2 | Tabular nums on metrics/tables | CSS | Fintech polish |
| P2 | Optional: Sora only on brand; Plex Sans 700 for some H1s | Type role | More institutional |

**Fonts:** no package change. Keep:

- `@remotion/google-fonts/Sora`
- `@remotion/google-fonts/IBMPlexSans`
- `@remotion/google-fonts/IBMPlexSerif`

---

## 7. Sources & references

| Source | Used for |
| --- | --- |
| Internal `fonts.ts`, S01–S10 slide copy | Current system + clarity evidence |
| `PITCH_DECK_CRAFT_RESEARCH.md` | Hale/DocSend/SEBI spine; jargon glossary; anti-patterns |
| `VISUAL_DIRECTION_PICK.md` | Navy/teal; SvgPop springs; Canva Technology Startup adaptation |
| [IBM Plex Sans vs Inter — FontFYI](https://fontfyi.com/blog/ibm-plex-vs-inter/) | Why Plex beats Inter for enterprise distinctiveness |
| [Geist is the new Inter — Sailop](https://sailop.com/blog/geist-the-new-inter-ai-font-fingerprint-2026) | Avoid Geist/AI fingerprint; Plex as anti-default |
| [IBM Plex — Google Fonts / Wikipedia](https://fonts.google.com/specimen/IBM+Plex+Sans) | Institutional provenance |
| [Sora — Google Fonts](https://fonts.google.com/specimen/Sora) | Display character; digital clarity |
| Stripe / Linear / Vercel DESIGN.md recreations ([Open Design](https://opendesigner.io/blog/recreating-stripe-linear-vercel-design-systems-with-design-md), [awesome-design-md](https://github.com/VoltAgent/awesome-design-md/)) | SaaS type patterns to borrow selectively |
| Remotion `@remotion/google-fonts` docs | Exact package import paths |
| YC Hale Demo Day design laws (via craft research) | Legible / simple / obvious; anti-distraction motion |

---

## 8. One-page creed (pin next to Remotion preview)

1. **KEEP Sora + IBM Plex Sans + IBM Plex Serif** — SaaS-premium × regulator-trust; never Inter/Geist/purple.  
2. **H1 ≤8 words; one idea; one gloss.**  
3. **Plex Serif = clause authenticity; Sora = brand + climax numbers.**  
4. **Hero SVG pop in the first 0.4s (frames 0–12) or it didn’t happen.**  
5. **S09 is the clarity emergency; S03 must not lead with “RAG.”**  
6. **If a paused frame at 0.4s can’t state the idea, the slide is UNCLEAR.**

---

*End of audit — companion to `PITCH_DECK_CRAFT_RESEARCH.md` and `VISUAL_DIRECTION_PICK.md`.*
