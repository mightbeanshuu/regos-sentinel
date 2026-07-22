# Design

## Visual Theme

**A working document, not a dashboard.**

The scene this is designed for: a compliance officer at a 40-person Mumbai brokerage, at their
desk at 10am under office light, with a SEBI circular open in one window and their control
register in another, deciding whether a control still holds — knowing an auditor will read the
answer a year from now.

That scene forces **light**. Daylight, paper adjacency, printed-record permanence. A dark
"cyber" theme would be a category reflex and would fight the product's actual material, which
is legal text.

The identity move is that **the source quotation is the most considered object on screen.**
This is a reading-and-deciding tool over regulatory prose, so the design is document-forward:
ink on a near-white substrate, thin rules instead of boxes-inside-boxes, and typography doing
the hierarchy work that colour and cards do in a generic SaaS UI.

**Colour strategy: restrained.** Tinted neutrals plus one institutional accent, with three
semantic states used sparingly and only where they carry meaning. Colour is never the sole
signal for anything.

## Color Palette

Authored in OKLCH. The royal blue is preserved brand identity — it is the same accent used
across the RegOS pitch film and deck — deepened slightly so it passes AA as text on white.

| Token | OKLCH | Approx hex | Role |
|---|---|---|---|
| `--ink` | `oklch(0.22 0.030 258)` | `#101a2c` | Primary text, headings |
| `--ink-2` | `oklch(0.38 0.028 258)` | `#3a4658` | Secondary text, body prose |
| `--ink-3` | `oklch(0.52 0.022 258)` | `#5c6878` | Muted labels, metadata (4.5:1 on surface) |
| `--surface` | `oklch(1 0 0)` | `#ffffff` | Panels, content surfaces |
| `--bg` | `oklch(0.976 0.004 258)` | `#f7f8fa` | Page substrate |
| `--bg-2` | `oklch(0.988 0.003 258)` | `#fbfcfd` | Inset rows, quiet fills |
| `--line` | `oklch(0.905 0.008 258)` | `#e2e5ea` | Hairline borders |
| `--line-2` | `oklch(0.845 0.012 258)` | `#cdd2da` | Emphasised borders, inputs |
| `--accent` | `oklch(0.425 0.180 267)` | `#1b3fb8` | Primary actions, links, active tab |
| `--accent-deep` | `oklch(0.360 0.165 267)` | `#152f8e` | Hover / pressed |
| `--accent-wash` | `oklch(0.965 0.022 267)` | `#eef1fd` | Active-step fill |
| `--ok` | `oklch(0.495 0.085 179)` | `#0b6e62` | Approved / verified / complete |
| `--ok-wash` | `oklch(0.968 0.020 179)` | `#eef7f5` | |
| `--review` | `oklch(0.515 0.110 68)` | `#8a5300` | Needs review — an expected human decision |
| `--review-wash` | `oklch(0.972 0.030 78)` | `#fdf5e6` | |
| `--fail` | `oklch(0.500 0.170 27)` | `#b3261e` | Actual failed test or system error |
| `--fail-wash` | `oklch(0.966 0.022 27)` | `#fdf0ee` | |

**Semantic discipline.** `--fail` red appears only for a failed deterministic test or an error.
`--review` amber means a human decision is expected and the product is behaving correctly.
`--ok` teal appears only for completed or approved states. Everything else — not started,
reference, background, not applicable — is neutral ink. Every state also carries a text label
and a glyph, so colour is never load-bearing on its own.

## Typography

**Three roles on a real contrast axis, and the axis carries meaning:**

- **Sans (UI)** — `ui-sans-serif, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial,
  sans-serif`. This is the software speaking. A deliberate system stack, not a webfont: it
  costs no network request, so the guided demo stays fully functional offline and has no CLS.
- **Serif (source)** — `Georgia, "Times New Roman", "Noto Serif", serif`. This is SEBI
  speaking. Every quoted regulatory span is set in serif. The reader can tell at a glance
  whether they are looking at the source or at our interpretation of it.
- **Mono (identity)** — `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`. Machine
  identity only: hashes, document fingerprints, record IDs, calculated dates in traces.

Scale (fluid where it matters):

| Role | Size | Weight | Tracking | Notes |
|---|---|---|---|---|
| Page title | `clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem)` | 640 | `-0.022em` | `text-wrap: balance` |
| Section heading | `1.125rem` | 640 | `-0.012em` | |
| Sub-heading | `0.9375rem` | 640 | `0` | |
| Body | `0.9375rem` / 1.6 | 400 | `0` | max 68ch, `text-wrap: pretty` |
| Small / meta | `0.8125rem` / 1.5 | 450 | `0` | `--ink-3` |
| Micro label | `0.75rem` | 600 | `0.01em` | sentence case, **never** all-caps |
| Quotation | `1rem` / 1.65 serif | 400 | `0` | max 66ch |

No display type above 2.5rem. No all-caps runs. Sentence case everywhere, including buttons
and status labels.

## Components

**Panel** — `1px solid var(--line)`, `--radius-lg` (10px), white surface, single soft shadow
(`0 1px 2px rgba(16,26,44,.05)`). Never nested inside another panel. Sections are separated by
hairlines and spacing before they are separated by boxes.

**Status label** — icon glyph + sentence-case text + optional one-line explanation, rendered
inline. Not a pill by default. A compact pill form exists only where a genuinely categorical
tag helps in a dense table cell. Never all-caps, never large, never a raw enum.

**Stepper** — horizontal at ≥900px, vertical below. Five steps: numbered marker, label, and a
state (done / current / upcoming). Current step is filled with `--accent`; done is `--ok`
outline with a check; upcoming is a neutral outline. Tab-navigable, `aria-current="step"`.

**Tabs** — top-level in-app navigation (Guided review / Review your document / Audit trail).
Semantic `role="tablist"` with roving focus, arrow-key navigation, and a 2px `--accent`
underline on the selected tab.

**Quote block** — serif, `--bg-2` fill, hairline border, locator line above in mono, official
source link below. The visual centre of gravity of the whole product.

**Comparison** — two columns at ≥760px, stacked below, separated by a hairline with a small
centred relation glyph. Used for existing control vs source, and before vs after.

**Data list** — label/value rows on hairlines. Replaces card grids for metadata. Long hashes
truncate visually via mono + ellipsis with a copy action exposing the full value.

**Buttons** — 44px min height, 6px radius. One primary per stage. Primary is solid `--accent`;
secondary is `--accent` text on `--accent-wash` with a hairline; quiet is text-only.

## Layout

- Content max width **1280px**, page shell padding 24px (16px below 760px).
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Rhythm is varied deliberately — dense
  inside a data list, generous between stages.
- Flexbox for one-dimensional rows; Grid only where two axes genuinely exist.
- Responsive grids use `repeat(auto-fit, minmax(240px, 1fr))` rather than breakpoint ladders.
- Every wide element (tables, benchmark rows, hash rows) scrolls inside its own
  `overflow-x: auto` container. The page body never scrolls horizontally.
- Breakpoints exercised: 1440 / 1024 / 768 / 390.

**z-index scale** — `--z-base: 0`, `--z-sticky: 100`, `--z-dropdown: 200`, `--z-overlay: 300`,
`--z-modal: 400`, `--z-toast: 500`. No arbitrary values.

## Motion

Purposeful only, and only on state transitions that carry cause and effect:

- step completed · needs-review state revealed · policy approved · impact rows appearing ·
  report action becoming available.

Durations 150–260ms. Easing `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart). No bounce, no
elastic, no page-load orchestration, no scroll-triggered reveals, no animated counters.

`motion/react` drives state transitions. `anime.js` is used for exactly one thing: the
post-approval outcome timeline, where a staggered cascade makes the causal chain legible
(control changed → dates recalculated → work assigned → advisory recorded → evidence flagged →
record sealed).

`prefers-reduced-motion: reduce` collapses every animation to an instant state change.
Content is visible by default and never gated behind a transition.

**WebGL is not used.** The previous decorative `three.js` field was removed: it was ornament on
operational data, and the product must be fully usable and identical without it.
