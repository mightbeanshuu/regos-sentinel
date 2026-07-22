# Cursor handoff — UI polish and de-jargoning only

You are working on **RegOS Sentinel**, a SEBI compliance prototype for a hackathon jury
that includes regulators. The backend is finished and correct. Your job is the
**interface and the words on it**, and nothing else.

Read this whole file before your first edit.

---

## The one-sentence brief

A head of compliance at a SEBI-regulated broker should be able to open this and know,
within ten seconds, **where the firm stands and what needs them** — without meeting a
single piece of engineering vocabulary.

---

## Hard guardrails — do not cross these

**1. Do not touch `services/api/`.** Not one file. The backend has 100 tests pinning
behaviour that a regulator would ask about. If a screen needs data the API does not
expose, say so in your summary and leave it; do not add an endpoint.

**2. Never invent a number, a date, or a status.** Every figure on screen must come from
live API state. If a value is absent, render the absence — "not assessed", "no date can
be produced" — never a placeholder, a zero, or a plausible-looking sample. This is the
product's entire thesis: it refuses to guess, and a hardcoded demo number in the UI
destroys that claim more effectively than any bug.

**3. Do not soften a refusal.** When the API says it cannot produce a date, or the
assistant declines to answer, that is the feature working. Present it plainly and
without apology. Do not restyle refusals as errors or warnings.

**4. Do not relabel provenance.** `MODEL_PLANNED`, `RECORDED_MODEL_TRACE` and
`DETERMINISTIC_PLAN` mean different things and the distinction is legally load-bearing.
A deterministic step must never be described as AI. The mapping already exists in
`lib/presentation.ts` — use it, do not bypass it.

**5. All state vocabulary goes through `lib/presentation.ts`.** No component may call
`.replaceAll("_", " ")` on a status, or hardcode a label for one. If a state needs a
plain-English name, add it to `STATES` in that file. This is enforced by convention and
it is the only reason the product reads consistently.

**6. Accessibility is not optional.** Colour is never the only signal — every state
carries a glyph and a word. Keep `aria-*` attributes, keep the roving tab navigation,
keep focus outlines. Respect `prefers-reduced-motion` on anything you animate.

**7. Do not add a dependency without saying why in your summary.** `motion` and
`animejs` are already installed and are enough for everything here.

---

## What actually needs doing

### A. De-jargon the remaining screens

The Dashboard and AI agents tabs are done. These are not:

- **`components/Scenarios.tsx`** — the worst offender. Rows currently read
  `tests/test_scenarios.py::test_case_b_keeps_advice_out_of_mandatory_work` and
  "Seeded data" and "Reset". A compliance officer does not need the test path. Move
  anything engineering-facing behind a `<Disclosure>` labelled "Technical detail", and
  lead with what the case demonstrates in plain words.
- **`components/AuditTrail.tsx`** ("Full record" tab) — dense by design and that is
  correct for an auditor, but the section intros should say who each table is for.
- **`components/GuidedReview.tsx`** ("Review a requirement") — long. Check every heading
  and helper sentence reads plainly.

**The rewrite rule.** Keep the precise term, add the plain meaning; never delete the
precision. "Deontic force" becomes "Requirement strength — whether SEBI requires this or
only recommends it". The jury contains people who want the precise word.

Jargon to hunt: *corpus, span, pinned, deterministic, provenance, gate, obligation
compiler, manifest, deontic, normative, locator, hash-chained, OSCAL, schema.*
Some of these are fine in "Full record". None are fine on the Dashboard.

### B. Visual polish

Glassmorphism is already established in `app/globals.css` — the live console
(`.console`), the headline figures (`.counts--glass`) and the three explainer steps
(`.how-step`). Extend that language; do not invent a second one.

Two rules learned the hard way:
- **Glass needs something behind it to refract.** Over flat white it renders as a plain
  box. `.counts--glass` carries its own tinted wash for exactly this reason.
- **Keep glass off dense text.** Contrast on the passages a regulator reads is not
  somewhere to spend legibility on an effect.

Motion: short, purposeful, once. The CCI dial counting up on load is the model to
follow. Nothing loops, nothing bounces, nothing animates on scroll.

### C. Responsive

Everything must work at 380px. Tables scroll inside `.table-scroll`; the page body must
never scroll horizontally.

---

## How to run it

```bash
# API — terminal 1
cd services/api
REGOS_WEB_ORIGIN=http://localhost:3000 .venv/bin/python -m uvicorn app.main:create_app --factory --port 8000

# Web — terminal 2
cd web
NEXT_PUBLIC_REGOS_API_ORIGIN=http://localhost:8000 npm run dev
```

Before you hand back:

```bash
cd web && npx tsc --noEmit && npx next build
```

Both must pass. Then click through all five tabs and confirm no console errors.

---

## Things that will bite you

- **`credentials: "include"` is required on every fetch.** The live agent console uses
  `EventSource`, which cannot send a header, so the session cookie is its only way to
  reach the same workspace. Remove it and streamed runs silently write to a throwaway
  session. This cost real debugging time.
- **Never read a ref or counter inside a `setState` updater.** React may re-run it. The
  console handed out duplicate keys this way.
- **`.passage-head` pushes its children apart** (`justify-content: space-between`). Right
  for a heading-and-status pair, wrong for a control beside its label — use `.choice`.
- The dashboard polls every 20s and refetches after every action. Do not add a second
  polling loop.

---

## Where the numbers come from

| On screen | API | Note |
|---|---|---|
| Cyber capability score | `GET /api/v1/cci` | Live, never stored. 8 of 23 parameters; the rest **must** stay "not assessed" |
| Everything on the dashboard | `GET /api/v1/workspace` | Single source of truth |
| Assistant answers | `POST /api/v1/ask` | `QUOTED` / `COMPUTED` / `REFUSED` — all three need distinct treatment |
| Live console | `GET /api/v1/agents/{id}/stream` | Server-sent events |
| Checks | `workspace.builds.at(-1).tests` | Plain names via `checkLabel()` |

---

## Out of scope

Backend, tests, the agent architecture, the CCI parameter set and its weights, the
provenance vocabulary, deployment. If you believe one of these is wrong, write it in
your summary rather than changing it.
