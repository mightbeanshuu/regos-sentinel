# RegOS Sentinel: live UI audit and redesign direction

**Status:** evidence-led direction; no production UI changes proposed by this document  
**Live product audited:** [regos-sentinel.vercel.app](https://regos-sentinel.vercel.app)  
**Audit date:** 3 August 2026  
**Method:** non-mutating browser walkthrough of Dashboard, Review a requirement, Your own document, AI assistants, and Full record; no review action, upload, download, reset, or assistant run was triggered.

## Decision before design

Do **not** begin by adding more motion, new cards, or a new colour theme.

The live product has a strong, distinctive core already:

```text
Official source  →  Firm’s current practice  →  Named human decision  →  Follow-up  →  Review record
```

The redesign should make this causal chain the centre of the product. Its theme is:

> **The Evidence Desk** — a calm, paper-forward workspace where a compliance officer follows a source, resolves a gap, and leaves a record another person can read backwards.

This is not a government portal, generic compliance dashboard, “AI command centre,” or animated score product. It is visually confident because the source, the decision, and their connection are unmistakable.

## What the live product currently does well

| Surface | Observed strength | Keep it |
| --- | --- | --- |
| Global shell | Five top-level destinations are named in terms a user can understand: Dashboard, Review a requirement, Your own document, AI assistants, Full record. | Yes; they are a reasonable product-level map. |
| Guided review | The current deployed version has one compact progress line, shows only the source stage before a review begins, and hides later working stages. | Yes; this already solves the large empty-column problem in the supplied earlier screenshots. |
| Decision safety | The product clearly says the source can state a period without stating what starts it, and does not calculate a date. | Absolutely; make this the visual hero. |
| Source handling | A live source link, publication date, and document check code are visible. | Yes; make this one well-composed source sheet. |
| Upload lane | The user is told the document is session-scoped and is not automatically turned into mandatory work. | Yes; retain the safety boundary, but shorten the first screen. |
| Assistant card copy | Each assistant has a short, human-readable job: reference finder, change watcher, challenger, deadline reader. | Yes; results should be more prominent than technical run controls. |
| Full record | Sources, decisions, evidence, checks, and limits are preserved instead of being hidden behind a superficial “pass” score. | Yes; reorganise it around a review summary and technical detail levels. |

## Evidence from the live walkthrough

### 1. Dashboard: the action is visible, but the page still tells too many stories

**What a new user sees first**

- Header with “How it works,” reset, and firm selector.
- Primary navigation.
- “Compliance command centre,” a live/model status, and connection activity.
- A second left navigation rail: Overview, Work queue, Evidence vault, Ask RegOS, AI assistants.
- A document filter, an item waiting for the user, incident clocks, quick actions, audit trail, and evidence/source.

**Observed friction**

1. “AI assistants” appears in both the primary navigation and the dashboard’s secondary rail.
2. “Check the SEBI source is unchanged” appears in both Quick actions and Evidence and source.
3. Model/connection information (`gemini-2.5-pro`, fingerprint, connection activity) appears before the case that needs attention.
4. The task title starts with implementation language: “remediate high-severity vulnerability caused by non-implementation of a patch.” The next action is clearer than the task itself.
5. Incident clocks, quick actions, and evidence repeat the same unresolved clock-start problem in three locations.

**Design conclusion**

The dashboard should become a **decision inbox**, not a command centre. One decision must lead, then one short evidence trail must explain it. Model connectivity and raw check codes belong in technical details.

### 2. Guided review: the structural fix is already present; the entry needs focus

**What is currently visible before the review begins**

- Four demonstration-case tabs, each with a question and status.
- A “Written before the run / What actually happened / Same?” table.
- A raw test path and “re-run automatically” line.
- The guided-review heading and compact progress line.
- “0. The case,” “1. Get the official text,” source link, document check code, source verification, and “Start the review.”

**Observed friction**

1. The judge/demo case catalogue competes with the working review before the user reaches the source.
2. The prediction table and raw test path are strong proof, but they are methodology, not the first task a compliance officer needs to perform.
3. “Start the review,” “Open official source,” “Copy,” and “Verify official source” appear together; only one is the stage’s primary action.
4. “Get the official text” is an implementation label. The user has the text; the real job is to read the cited source and compare it with practice.

**Design conclusion**

Keep the compact progress line and progressively revealed stages. Reframe the entry as a single **Review this source** stage. Put other demo cases and the predicted-outcome proof in a compact `About this example` disclosure or a `Choose another example` sheet. Show the test path only in Full record or technical details.

### 3. Your own document: a good promise, too much explanation before the first action

**What is currently visible before upload**

- A secondary rail: Add a document, Documents, Deadline clarity, Limitations.
- Three explanatory paragraphs.
- A PDF drop zone, browser “Choose File,” custom “Choose PDF,” guided example, and optional authority field.

**Observed friction**

1. The secondary rail points to empty or unavailable sections before there is a document.
2. Two file-picker actions can look like two different upload paths.
3. Fingerprint, fixed rules, OCR, persistence, authority, and legal limits are all explained before the user has selected a file.

**Design conclusion**

The first screen should be a calm single-step upload. Keep one sentence of trust context and one upload control. Move OCR, check-code, and authority details beneath the selected filename or into “How this document is handled.” Reveal the section navigation after a document exists.

### 4. AI assistants: useful capability, presented as a control room

**What is currently visible before any run**

- Four counters all at zero.
- A secondary rail, run-all and reset actions.
- Four assistant cards.
- A live log panel with four watch buttons.
- “Who plans the steps” execution-mode radio controls and a model identifier.

**Observed friction**

1. The user is asked to reason about assistant mode, live logs, and model identity before knowing the finding.
2. “Watch” controls duplicate the assistant cards’ focus.
3. The reset action duplicates the global reset and carries a high-impact message (“Deletes uploaded documents, checks and approvals”).
4. Zero-heavy metrics occupy prime space without helping a first-time user choose an action.

**Design conclusion**

Reframe this as **Checks that help you review**. Lead with the latest result or the four available checks, then a single `Run this example` action. Put planner modes, run trace, model identity, and replay information behind `Technical details`. Keep every underlying trace available; change only the order in which it is shown.

### 5. Full record: complete evidence, overloaded default view

**What is currently visible**

- Eight-item navigation rail.
- Summary counts.
- At least ten major sections: documents, checkpoints, source coverage, requirement strength, decisions, checks, evidence, reproduction, AI boundaries, prototype metrics, event log.
- Exact document check codes, OSCAL/NIST export, model details, and prototype metrics in the same surface as the active review record.

**Observed friction**

1. The navigation rail duplicates the main headings and is too dense for a first reading.
2. Counts appear both in the summary and again in each detailed section.
3. Technical assurance, prototype metrics, and generic system events dilute the review-specific record.
4. The page says “No sealed record yet” while exposing record downloads. The interface needs an explicit availability state before offering export.

**Design conclusion**

Keep all evidence, but establish three levels:

```text
Level 1 — Review summary       source · decision · follow-up · record status
Level 2 — Review evidence      quotations · people · dates · supporting items
Level 3 — Technical appendix   check codes · schemas · model details · metrics · raw events
```

The export action is active only when an approved record exists. Before then, show a clear callout that names the remaining step and links to it.

### Mobile risk

The live accessibility tree confirms a mobile viewport meta tag, but the browser walkthrough did not return a validated 390px inspection. Treat mobile layout as a **P0 validation risk**, not as an assumed success. It must be checked manually at 390px after the shell is simplified.

## Design references: what to borrow, what to avoid

| Reference | Relevant lesson | Use in RegOS | Do not copy |
| --- | --- | --- | --- |
| [GOV.UK task list](https://design-system.service.gov.uk/components/task-list/) | A task row pairs a clear task title, short hint, and status so users identify what remains. | Dashboard “Next decision” and staged review progress. | Government branding, visual identity, or an administrative service look. |
| [Carbon disclosures](https://carbondesignsystem.com/patterns/disclosures-pattern/) | Details should open from their related trigger, one at a time; critical workflow information must remain visible. | Source metadata, raw check codes, assistant traces, technical appendix. | Hiding a required human decision in a disclosure. |
| [Relativity document review](https://help.relativity.com/RelativityOne/Content/System_Guides/User_quick_reference/Review_Interface_QRG/Review_interface.htm) | In a document-review tool, the document is central; supporting panes are collapsible and subordinate. | Source sheet as the visual centre; optional context as a side sheet/disclosure. | Its dense multi-tool eDiscovery toolbar and legal-review complexity. |
| [Vanta’s compliance roadmap](https://www.vanta.com/products/automated-compliance) | A visible sequence of tasks can turn a broad compliance goal into concrete work. | The five-stage causal flow and one next action. | Scores, “continuous compliance” framing, generic security-SaaS cards, or claims that RegOS automates decisions. |
| [Atlassian motion](https://atlassian.design/foundations/motion) | Motion is a clarity layer: fast for interaction, deliberate for transitions, always reduced-motion aware. | One causal approval sequence and quiet source-to-detail transitions. | Decoration that delays reading or makes regulated work feel playful. |

## The target experience

### One default story

```text
Dashboard
  A source leaves one reporting clock undefined.
  → Open the review

Review this source
  Read the exact source wording and see the firm’s current practice.
  → Make a named decision only for the missing clock-start.

Decision recorded
  See the new follow-up and requested evidence.
  → Download the review record.
```

Everything else supports this story. An evaluator who wants to inspect methodology can always reach it; a compliance officer does not have to pass through it to take the correct next action.

### Visual theme: Evidence Desk

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ONE NEXT DECISION                                      Status: needs you │
│  Decide what starts this reporting clock.                            │
│  The source sets a one-week period but not the starting event.       │
│                                      [Record the decision]           │
├─────────────────────────────────────────────────────────────────────┤
│  SOURCE SHEET                         FIRM PRACTICE                  │
│  ┃ “...quoted source text...”         Close findings in three months │
│  ┃ FAQ 17(a) · source link            ◀ relation: decision needed ▶  │
├─────────────────────────────────────────────────────────────────────┤
│  EVIDENCE THREAD                                                   │
│  Source read ────── Decision recorded ────── Follow-up ────── Record │
└─────────────────────────────────────────────────────────────────────┘
```

- **Paper/ink:** warm-white source sheet, serif quotation, blue locator rule.
- **Operational clarity:** dark ink, hairline rules, a single blue primary action.
- **Human accountability:** amber for “needs a person,” teal only for a named, recorded decision, red only for a true failure.
- **Proof without noise:** check codes in collapsed technical detail; source title, passage, date, and named reviewer visible in the normal path.
- **No decorative dashboard visualisations:** use relationship lines, document diffs, and a readable evidence thread only when they map to a real source or event.

## Staged plan

### Phase 0 — Confirm the information architecture (before visual rebuild)

**Goal:** remove structural duplication without changing the product’s safety model.

- Retain the five global tabs.
- Remove secondary rails from Dashboard, document upload pre-upload state, and AI assistants. Keep section navigation only in Full record, and convert it to a compact `On this page` menu on wide screens.
- Give every first viewport one primary action and no more than three prominent statuses.
- Move technical model connectivity and raw fingerprints out of dashboard headers.
- Deduplicate “Check source” and reset actions; each operation has one home.

**Acceptance:** no primary screen contains two navigation systems that point to the same destinations.

### Phase 1 — Rebuild the dashboard as a decision inbox

**Goal:** a user recognises the next task in under five seconds.

1. Replace “Compliance command centre” with **“Your compliance review”** or **“Next decision”**.
2. Put the one unresolved decision at the top: concise title, one-sentence reason, one action.
3. Make incident clocks supporting context, not a competing dashboard module.
4. Combine evidence/source state into one quiet “Source and evidence” row.
5. Put recent activity behind a single `Recent record` disclosure.

**Signature motion:** after an action returns, the changed status line fades once and the corresponding task row receives focus. No counters animate.

### Phase 2 — Polish the guided review around the source-to-decision bridge

**Goal:** preserve the current sequential improvement and remove remaining demo/methodology noise.

1. Rename the first stage **Read the source**; retain `Compare`, `Make a decision`, `Create follow-up`, `Download record`.
2. Put a chosen demo case in a compact bar with `Choose another example`; move the pre-run prediction table into `About this example`.
3. Render source and firm practice as a focused two-column comparison at desktop, stacked at mobile.
4. Use one primary action per stage; source link and document check code stay supporting actions.
5. Reveal the next stage immediately below the outcome—never in a distant side panel or a new blank column.

**Signature motion:** a 220–260ms relationship line travels from source to firm practice, then resolves as `Matches`, `Needs your decision`, or `Check failed`.

### Phase 3 — Make document upload one calm action

**Goal:** select a file before seeing implementation detail.

1. Header: **“Review a document”**.
2. One sentence: “Choose a PDF you are allowed to share. RegOS will show the passages that need a person’s reading.”
3. One control: **Choose a PDF**, supported by drag-and-drop.
4. Secondary text link: `Use the guided example`.
5. Reveal document handling, authority, OCR state, and the review navigation only after file selection.

**Signature motion:** the selected filename transforms into a source sheet with a short “Preparing passages for review” state; the static final state is available immediately for reduced-motion users.

### Phase 4 — Reframe assistants as read-only checks

**Goal:** explain their value without asking a compliance officer to operate an AI control room.

1. Rename surface **Checks and assistants** or retain “AI assistants” with the subhead “Read-only checks that support your review.”
2. Lead with four concise check cards and a single `Run this example` action.
3. Make each card’s result, sources checked, and human follow-up its default detail.
4. Move live log, planner controls, model ID, and replay mechanics into one `Technical details` area.
5. Remove duplicate reset/action controls from the page.

**Signature motion:** a completed check draws one thin line from its card to the finding it produced. It must be user-triggered and not loop.

### Phase 5 — Turn Full record into a readable record with an appendix

**Goal:** first-time readers can reconstruct one review; auditors can still inspect everything.

1. **Review summary:** source, firm practice, decision status, reviewer, follow-up, export availability.
2. **Evidence:** exact source passages, source versions, decision reason, evidence rows, checks that apply to this review.
3. **Technical appendix:** check codes, export schema, model and run details, measurement limits, raw audit events.
4. Make section data accordions single-open and preserve copy/export operations in context.
5. Show the record download only when it exists; otherwise link to the remaining decision.

**Signature motion:** none by default; a source row may expand from its trigger. Reading and audit data remain still.

### Phase 6 — Validate before adding more visual effects

- Test 1440, 1024, 768, and 390px widths.
- Test keyboard tab order, visible focus, disclosure state, and reduced motion.
- Test initial states: no source check yet, ambiguous source, failed check, approved decision, uploaded document, no assistant runs, and record unavailable.
- Confirm every status has icon + words + colour; amber means expected human input, red means actual failure.
- Record a 90-second jury walkthrough from Dashboard → decision → record. If it requires explaining UI elements aloud, simplify again.

## Build sequence and measurement

| Priority | Work | Why it comes now | Done when |
| --- | --- | --- | --- |
| P0 | Shell, duplicate navigation/actions, dashboard hierarchy | These are global clutter multipliers. | One nav system per screen; one primary action in first viewport. |
| P0 | Guided-review entry and terminology | This is the demo’s most important proof. | A new user reaches the source and knows the next action without a guide. |
| P1 | Document-upload first state | It has clear, low-risk simplifications. | One upload action; document-only navigation appears after selection. |
| P1 | Assistant information hierarchy | Prevents the most technical surface from feeling like the product’s main claim. | Results appear before planner/run mechanics. |
| P1 | Full-record three-level structure | Keeps audit depth without making every reader traverse it. | Summary, evidence, and technical appendix are clearly distinct. |
| P2 | Motion primitives and signature sequences | Motion should reinforce a settled information architecture. | Motion passes reduced-motion and does not gate understanding. |

## Guardrails

- Do not imply that RegOS is SEBI, makes final determinations, or files automatically.
- Keep source citation and the explicit absence of a source fact visible where a decision depends on it.
- Never turn the amber human-decision state into an error or invent a date to make a flow look complete.
- Do not replace proof with decorative scores, “compliance health,” flashy charts, or AI confidence theatre.
- Do not show a model ID, trace, raw enum, or SHA-256 value before the user has a reason to inspect it.
- Do not add animation until it has a source, decision, change, or newly available action to explain.

## Rerun inputs

```text
workflow: firecrawl-demo-walkthrough + firecrawl-qa
url: https://regos-sentinel.vercel.app
focus: dashboard, guided review, document upload, assistants, full record
constraints: no uploads, resets, downloads, review decisions, or assistant runs
```
