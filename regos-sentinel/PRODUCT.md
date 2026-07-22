# Product

## Register

product

## Users

**Primary — a compliance officer at a small or mid-sized SEBI-regulated intermediary.**
They are at a desk in office light, with a SEBI circular open in one window and their firm's
control register in another. They are not a lawyer and not an engineer. They need to know
whether a control they already own still holds after a regulatory source changed, and they
need whatever they decide to survive an auditor reading it a year later.

**Secondary — SEBI TechSprint jury members and first-time evaluators.** They will watch this
for roughly three minutes, without documentation, without a walkthrough, and without knowing
any internal vocabulary. If they cannot follow the story unaided, nothing else about the
product matters.

**Also — operational control owners and auditors.** They arrive after the decision and read
backwards: what was decided, by whom, on what evidence, and can it be reproduced.

### The job

Determine what a regulatory source requires, why it applies to this firm, what human decision
remains open, what operational work changes as a result, and what evidence proves the decision.

## Product Purpose

RegOS Sentinel turns regulatory text into reviewable compliance work.

It reads an official source version, compares it against a firm's existing control, runs
deterministic checks, and produces a Compliance Build: cited requirements, applicability
decisions, test results, evidence states, a named human approval, and a replayable record.

Its entire defensibility rests on one sentence, which every change must make more true:

> It separates what the source states, from what a rule calculated, from what a model
> suggested, from what a human decided — and it refuses to produce a value the source does
> not support.

Success is not "the build passed." Success is that an evaluator can say what the product read,
what it decided, what it refused to decide, who resolved the gap, and what changed afterwards.

## Brand Personality

**Institutional. Calm. Traceable.**

Voice is plain, factual, and unhurried. It states what happened and what is needed next. It
never congratulates the user, never celebrates a passing check, and never uses urgency as a
persuasion device. It quotes the source rather than paraphrasing it.

The emotional outcome for an evaluator is: *this is careful, accountable, usable, and
technically real.* Trust here is earned by visible restraint — by the product declining to
answer — not by confidence signalling.

## Anti-references

Explicitly not:

- Generic AI SaaS landing pages; hero-metric templates; animated counters.
- Neon or cyberpunk dashboards; glowing surfaces; decorative gradients behind operational data.
- Excessive glassmorphism.
- Large all-caps status chips; every item rendered as a pill; repeated badges.
- Decorative compliance scores or a single headline "compliance score".
- Terminal-style jargon or raw backend enum names in the primary workflow.
- Dense nested cards where everything carries equal visual weight.
- A fake government portal. **Never** the SEBI emblem, a government emblem, or any design that
  implies SEBI ownership or endorsement. Regulator-*grade*, never regulator-*owned*.
- Decorative 3D graphs or WebGL ornament.
- A feature inventory pretending to be a workflow.

## Design Principles

1. **One story per screen.** The default view answers exactly one question: *a SEBI rule
   changed — does this broker's existing control still work?* Everything that does not serve
   that question moves to Audit trail.

2. **A refusal is a feature, and must look like one.** "Needs review" is the product working
   correctly. It is amber, expected, and explained. Red is reserved for an actual failed test
   or system error. The two must never be confusable.

3. **Speak to the officer, store for the auditor.** The presentation layer is plain language;
   the API keeps its precise vocabulary unchanged. Terminology is translated in exactly one
   place, never with scattered string replacement.

4. **Never fill a gap with a plausible value.** Where a source does not state something, show
   the gap and route it to a named human. This applies to seeded and uploaded documents alike.

5. **Show only what actually happened.** Every count, date, hash, and status is read from live
   build state. No hardcoded totals, no filler sections, no sample data dressed as results.

## Accessibility & Inclusion

- **WCAG 2.2 AA.** Body text ≥4.5:1; large text ≥3:1. Placeholder text held to body contrast.
- Fully keyboard operable, with logical focus order and visible focus states throughout.
- **Status is never communicated by colour alone** — every state carries a text label, and an
  icon or shape where the label alone is ambiguous.
- Minimum 44×44px touch targets wherever practical.
- `prefers-reduced-motion` respected on every animation; the reduced path is a crossfade or an
  instant change, never a suppressed reveal that leaves content invisible.
- Mobile support down to 390px width, including legible report downloads. No horizontal page
  overflow at any breakpoint; wide content scrolls inside its own container.
- Form errors are linked to their fields and say what is missing and how to fix it.
- Follows India's official digital-interface accessibility guidance (GIGW,
  https://guidelines.india.gov.in/) alongside WCAG 2.2 AA.
