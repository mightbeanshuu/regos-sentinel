# RegOS Sentinel UI/UX de-jargonisation guide

**Status:** design direction for the prototype  
**Audience:** compliance officers, operational control owners, auditors, and first-time jury evaluators  
**Applies to:** every visible label, panel, badge, empty state, form, export, and workflow in the web app

## The outcome to design for

The product should feel like a calm review of an official document, not like a monitoring dashboard or an AI control room.

Within five seconds, a first-time user should be able to answer:

1. What changed or needs attention?
2. What should I do next?
3. What is this based on?
4. What is safely known, and what still needs a person?

The governing sentence is:

> RegOS helps a person check a regulatory source, compare it with the firm’s existing practice, make the decision that only a person can make, and keep a record of why.

This keeps the product’s core safety claim intact: the app separates source facts, calculations, suggestions, and human decisions. It does **not** imply legal advice, autonomous compliance, or SEBI endorsement.

## What is wrong with the current guided-review screen

The supplied desktop screens show three competing navigation systems (top tabs, a left step list, and a horizontal stepper), three mostly empty columns, and several locked panels shown before they are useful. This creates four problems:

- It asks the user to understand the whole system before they can take the next action.
- Empty boxes make the page feel unfinished rather than safely gated.
- Repeated step labels make it difficult to know which control is authoritative.
- Equal-sized panels make the official source, the firm’s situation, and future output look equally important.

The fix is **progressive disclosure**, not more cards: show one clear next action, keep the cited source in view, and reveal the next stage only when it is relevant.

## Research translated into RegOS decisions

| Research finding | Decision for RegOS |
| --- | --- |
| GOV.UK’s question-page pattern asks only for information that is needed, explains why it is needed, and supports an honest “I do not know” response when valid. [GOV.UK](https://design-system.service.gov.uk/patterns/question-pages/) | A human-decision step asks one decision at a time, explains why RegOS cannot decide it, and provides **“I cannot confirm this yet”** as a valid route. |
| GOV.UK’s progress guidance says a stepper should be reserved for genuinely sequential work, with action-focused, non-technical labels. [Government Project Delivery](https://projectdelivery.gov.uk/get-involved/connect-and-contribute/publishing-content-on-the-government-project-delivery-website/design-system/components/progress-indicator/) | Use one compact five-step progress line only in the guided review. Do not repeat it in a side rail or in panels. |
| USWDS presents important processes as an ordered list with an explanatory sentence for each stage. [USWDS process list](https://designsystem.digital.gov/components/process-list/) | The workflow reads as a simple sequence: **Read source → Check our practice → Decide the gap → Create follow-up → Download record**. |
| Carbon advises avoiding status indicators when no action is needed and says too many indicators overwhelm users. It also requires clear labels alongside visual cues. [Carbon status indicators](https://carbondesignsystem.com/patterns/status-indicator-pattern/) | Give each screen a maximum of three prominent statuses. Use an icon + text label; colour never carries the meaning alone. Do not turn every fact into a pill. |

## Voice and vocabulary

### Rules for all user-facing writing

- Lead with the user’s task or the consequence, never the implementation.
- Use short verbs: **Read, check, decide, update, download**.
- Prefer a concrete noun: **source, requirement, firm practice, decision, follow-up, record**.
- Say what RegOS cannot know plainly: **“The source gives the period but not when the clock starts.”**
- Keep the formal or machine term in the export and technical detail, not in the primary interface.
- Never make a claim that is stronger than the evidence. Do not say “compliant,” “verified,” “accurate,” or “complete” unless the data model and product policy permit it.

### Replace technical labels in the primary UI

| Avoid in the working UI | Prefer | Where the precise term may remain |
| --- | --- | --- |
| Compliance Build | **Review record** | Export metadata: “Compliance Build ID” |
| Obligation | **What the source requires** | Audit tables / API export |
| Applicability | **Does this apply to our firm?** | Technical details drawer |
| Provenance | **Where this came from** | Audit export / developer detail |
| `SOURCE_EXPLICIT` | **Quoted from the source** | Raw detail drawer |
| `DETERMINISTIC` | **Calculated from the information shown** | Raw detail drawer |
| `AI_SUGGESTED` | **Suggested for your review** | Raw detail drawer |
| `HUMAN_POLICY` | **Set by a named reviewer** | Raw detail drawer |
| Deadline computation | **Due-date check** | Audit export |
| Trigger | **What starts the clock** | Technical detail |
| Blocked | **Needs your decision** | Event / API code |
| Failed | **Check failed** | Event / API code |
| Corpus pack | **Reviewed document set** | Audit export |
| Fingerprint / SHA-256 | **Document check code** | Expandable technical detail |
| Manifest | **Downloadable review record** | Download filename / schema field |
| Replay | **Run the same check again** | Audit export |
| Deontic force | **How strongly the source says it** | Never in the primary UI |
| Agent trace | **What the assistant checked** | Detailed activity view |
| AI assurance | **How automated suggestions were handled** | Audit / methodology view |

### Action labels

Use a verb plus an object. Avoid generic labels such as “Submit,” “Run,” “Execute,” “Proceed,” or “Open panel.”

| Avoid | Prefer |
| --- | --- |
| Start the review | **Read the source** (first stage) / **Check our practice** (after source is read) |
| Verify official source | **Check the source link** |
| Run comparison | **Check our practice against this** |
| Resolve block | **Record the clock-start decision** |
| Approve | **Approve this decision** |
| Generate manifest | **Prepare the review record** |
| Download proof | **Download the review record** |
| Restart demo | **Reset this example** |

## One visual language, not a page of pills

### Pill budget

A pill is a compact category marker, not a default container for text. It should be used only in dense tables or filters where users scan repeated values. Do not use a pill for section names, long statements, helper text, actions, or ordinary metadata.

| Use a pill for | Use inline text, a row, or a panel for |
| --- | --- |
| A short filter: `Current` / `Needs review` | “The source does not state what starts the clock.” |
| A short evidence type in a table | Dates, document names, people, explanatory copy |
| A compact categorical tag in a repeated list | A primary action or step name |

**Maximum visible pills:** three in a page header, two in a panel heading, and one per dense table row. If a status needs a sentence of explanation, use a callout or an inline status line instead.

### Status grammar

There are only four user-meaningful states. Every instance has a familiar icon, sentence-case label, and short explanation where needed.

| State | Visual treatment | User-facing label | Meaning |
| --- | --- | --- | --- |
| Neutral | Grey text / thin outline | **Not started** | No action has happened yet. |
| In progress | Blue dot + text | **In progress** | RegOS is checking or preparing something. |
| Needs a person | Amber `!` + text | **Needs your decision** | An expected human judgment is missing; this is not an error. |
| Complete | Teal check + text | **Recorded** / **Up to date** | The current action has a named or dated record. |
| Actual error | Red `×` + text | **Check failed** | A rule failed or the service could not complete an operation. |

Red is never used for an unanswered regulatory question. Amber means the product has correctly refused to invent an answer.

### Panel rules

Use a panel only when it groups a single decision, source, or collection of repeatable records. Do not nest panels.

1. Every panel answers one question and has one clear title.
2. A panel holds at most one primary action.
3. Prefer a hairline divider and spacing over a new rounded rectangle.
4. An empty future stage is **hidden**, not shown as a dashed placeholder.
5. Use a callout for an exception that changes the next action; do not use a callout just to decorate a fact.
6. The official quotation is the most considered object on the page: serif text, citation, source link, and a quiet document-check code.
7. Use data rows for details such as reviewer, date, source version, and document check code. Do not make each detail its own card.

### Visual hierarchy

Keep the existing restrained document-forward direction:

- Near-white page, dark ink, one institutional blue for actions and active progress.
- Teal only for a completed or approved record; amber only for a required human decision; red only for a real failure.
- Sans-serif for the application’s voice; serif for quoted regulatory text; monospace only for IDs and check codes.
- One solid primary button per stage. Secondary actions are quiet outlines or text links.
- Use 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px spacing. A visual group gets spacing before it gets a box.

## Make the product more visual, without making it noisy

### The design direction: a living case file

RegOS should be **more visual than a document viewer**, but it should not become an AI-themed dashboard. The right reference is a living case file: source paper, a clear comparison, a visible decision, and an evidence trail that connects them.

Use this three-layer composition on important screens:

```text
DECISION LAYER        What needs attention and the one action to take
──────────────────────────────────────────────────────────────────────
EVIDENCE LAYER        Source wording  →  Firm practice  →  Recorded decision
──────────────────────────────────────────────────────────────────────
DETAIL LAYER          Dates, reviewer, document check code, raw technical detail
```

Only the decision layer gets strong colour and the primary button. The evidence layer gets the most care in typography and layout. The detail layer is quiet and opened on demand.

### Visual primitives to add

| Primitive | What it looks like | What it communicates | Where it belongs |
| --- | --- | --- | --- |
| **Source sheet** | A warm-white, serif quotation with a 3px blue locator rule, citation above, source link below | “This is the official wording, not RegOS’s interpretation.” | Guided review, document review, Full record |
| **Comparison bridge** | Two aligned text columns joined by a thin animated line and a labelled middle state | “Here is the relationship between the source and our practice.” | Guided review, change review |
| **Decision marker** | A named-person row: avatar initials, decision, date, and short reason | “A person, not automation, chose this.” | Decision stage, dashboard, Full record |
| **Evidence thread** | A quiet vertical line connecting source → decision → follow-up → record | “This outcome can be read backwards.” | Approval outcome, audit summary |
| **Case pulse** | A small live dot and plain “Updated just now” text—not a chart or spinning status | “The workspace changed.” | Dashboard header only |
| **Document-change strip** | A small before/after excerpt with added and removed text marked by wording and colour | “This source version changed in a specific place.” | Change watcher / source comparison |

The line and connector motifs must be informative. They are not decorative network graphs: every end of a line is a source, decision, follow-up, or recorded item the user can open.

### A richer guided-review composition

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Review a requirement                                      Step 2 of 5       │
│ Does our current practice still match the cited source?                     │
│  ✓ Read source ─── ● Check our practice ─── 3 Decide ─── 4 Follow-up        │
├────────────────────────────────────────────────────────────────────────────┤
│ SOURCE                                                        OUR PRACTICE  │
│ ┃ “A regulated entity must …”                              Close findings │
│ ┃ FAQ 17(a) · published date · [Open official source]        in 3 months   │
│                                  ↘  NEEDS YOUR DECISION  ↙                  │
│ The source gives a reporting period, but not what starts it.                │
│                                         [Record the clock-start decision]  │
└────────────────────────────────────────────────────────────────────────────┘
```

This is visually rich because it makes the **reasoning relationship** visible, not because it adds unrelated gradients, gauges, or animations. On a small screen, source appears first, then the relation statement, then the firm practice and action.

### Human-friendly visual details

- Give every major heading a one-sentence “why this matters” line. It reduces the need for tooltips and jargon.
- Use small line icons only where they improve scanning: document, comparison, person, follow-up, download. Pair each with text.
- Use actual source excerpts and highlighted relevant phrases instead of generic document icons whenever a source is available.
- Add a small, labelled **“What RegOS knows / What you need to decide”** split to ambiguous cases. It makes the abstention feel intelligent rather than incomplete.
- In activity history, use time and actor first: `10:24 · Alex Shah checked the source`, not `SOURCE_VERIFIED event`.
- Show the reviewer’s name beside a human decision. Do not make the reviewer a hidden data field.
- For numbers, pair the count with the consequence: `1 decision needed`, not just `1`; `3 evidence items up to date`, not a naked `3`.

## Motion and interaction choreography

### Motion research translated into RegOS rules

| Research finding | RegOS implementation decision |
| --- | --- |
| Material 3 distinguishes a standard, functional motion scheme from a more expressive one and applies consistent tokens by speed and property. [Material 3 motion](https://m3.material.io/styles/motion/overview/how-it-works) | RegOS uses a standard, no-bounce motion scheme: small controls move quickly; only a meaningful approval outcome may take slightly longer. |
| Carbon separates subtle **productive** motion for task completion from expressive motion reserved for occasional meaningful moments, and warns against bounce or distracting curves. [Carbon motion](https://carbondesignsystem.com/elements/motion/overview/) | Most RegOS motion is short, calm, and causal. The only expressive sequence is a completed human decision becoming a follow-up and a record. |
| Atlassian describes motion as a clarity layer, recommends 50–150ms for interactions and 150–400ms for transitions, and requires reduced-motion support. [Atlassian motion](https://atlassian.design/foundations/motion) | Define a small token set; never add per-component improvised animation. Honour `prefers-reduced-motion` everywhere. |
| Progressive disclosure makes complex applications easier to learn and less error-prone by showing the important next option first. [Nielsen Norman Group](https://www.nngroup.com/articles/progressive-disclosure/) | Motion reveals the *next meaningful stage* after an action. It never animates a page full of locked future panels into view. |

### The RegOS motion contract

Every animation must answer one of these questions:

1. **What changed?**
2. **Why did it change?**
3. **Where should I look or act next?**

If it answers none, remove it.

| Moment | Motion | Timing | Why it helps |
| --- | --- | --- | --- |
| Button press, tab underline, field focus | Colour/opacity change only | 80–120ms | Immediate confirmation without delay. |
| Open source details | Source row grows into a detail sheet; the clicked title stays visually connected | 180–220ms | Preserves where the details came from. |
| Run comparison | The middle relation line draws from source toward firm practice; the outcome label fades in | 200–260ms | Shows that the result comes from the comparison. |
| A decision is needed | Amber decision marker enters from the relationship line; the primary action gains focus | 180–240ms | Directs attention to the single unresolved judgment. |
| Approve decision | Decision marker settles into the evidence thread; the next stage expands beneath it | 220–300ms | Makes the causal chain legible: decision → follow-up → record. |
| A check failed | Compact error callout appears with no shake, bounce, or attention loop | 150–180ms | Communicates an exception without creating panic. |
| Download record | Button confirms with a short check and filename, then returns to rest | 150–200ms | Confirms an outcome without a celebratory toast storm. |

### One signature moment: the decision becomes a record

This is the only sequence that may be slightly more expressive because it represents the product’s central value.

```text
User approves a named decision
          │
          ├─ 1. Amber “Needs your decision” settles into teal “Decision recorded”
          ├─ 2. A thin evidence thread extends to the follow-up row
          ├─ 3. The follow-up row appears: owner + requested evidence
          └─ 4. “Download the review record” becomes available
```

Use a 40–60ms stagger between these four events, with a total duration under 360ms. Nothing auto-scrolls; the user remains in control. With reduced motion enabled, render the final state instantly and move keyboard focus to the newly available heading.

### Motion tokens

Use semantic tokens so all surfaces feel designed by the same system:

```css
--motion-press: 100ms;
--motion-reveal: 180ms;
--motion-connect: 240ms;
--motion-outcome: 300ms;
--ease-standard: cubic-bezier(0.22, 1, 0.36, 1);
--ease-exit: cubic-bezier(0.2, 0, 1, 0.9);
```

- Animate only `opacity`, `transform`, limited `clip-path`, and colour/border colour where practical.
- Never animate layout measurements through long height transitions on dense document content.
- Do not use bounce, elastic overshoot, looping attention effects, scroll-triggered reveals, or animated counters.
- Provide a static final state before the animation starts; motion must never be required to understand a result.

### Make controls feel polished

- Buttons: a 1–2px downward press, not a growing pill or glowing halo.
- Source links: underline grows from left to right on hover; retain a visible static underline for keyboard focus.
- Rows: background wash appears on hover; clicking a row expands the actual row rather than opening a disconnected floating card.
- Status change: colour, icon, and label change together; avoid flashing.
- Tabs: the active underline slides between adjacent tabs; direct jumps fade content through instead of sliding the whole page sideways.
- Tooltip: use only to explain an unfamiliar icon or compact technical term. Tooltips never carry required information.

### What must stay still

- Official quotation text while someone is reading it.
- Error messages, due dates, and human-decision forms.
- Long tables, document check codes, and audit values.
- More than one component in the user’s immediate visual focus.
- Any state that could be mistaken for a deadline counting down.

## The guided-review workflow

### Compact progress line

Show this once, below the page title, and make it the only workflow navigation:

```text
1 Read source ─── 2 Check our practice ─── 3 Make a decision ─── 4 Create follow-up ─── 5 Download record
```

- Completed: teal check and a text link back to the completed stage.
- Current: blue numbered marker.
- Upcoming: neutral number and label; no large locked content.
- Needs a person: amber `!` on step 3 with “Your decision is needed.”
- Mobile: turn this into a two-column wrapped list or a short “Step 2 of 5: Check our practice” label. Never shrink it into unreadable dots.

### The page at first open

```text
Review a requirement                                      Step 1 of 5
Read the cited source, then check whether our current practice still holds.

[ Case: Cyber-security FAQ ]                 [ Existing practice: Close findings within 3 months ]

THE SOURCE SAYS
“...exact cited regulatory language in serif...”
FAQ on CSCRF for SEBI RIs …  ·  Published 11 June 2025  ·  [Open official source]

OUR CURRENT PRACTICE
Close every security finding within three months.

                                                    [Check our practice]
```

Do **not** show “What changes,” “Download proof,” or a decision box yet. They become visible only after the comparison reaches them.

### Each stage has one job

| Stage | Primary question | What is visible | Primary action | When it appears |
| --- | --- | --- | --- | --- |
| 1. Read source | What does the cited text say? | Quotation, citation, source link, document check code, current firm practice | **Check our practice** | Immediately |
| 2. Check our practice | Does our current practice match what is stated? | Two-column comparison; “matches,” “needs a decision,” or “check failed” | **Record a decision** only if needed | After comparison |
| 3. Make a decision | What must a named person decide? | One plain-language question, why RegOS cannot decide, choices, name/role/reason | **Approve this decision** | Only if a human judgment is required |
| 4. Create follow-up | What operational work changes? | A short change list, owner and evidence request | **Create follow-up** | After a decision or meaningful mismatch |
| 5. Download record | What can be kept for an auditor? | Named decision, source version, change list, check codes, export format | **Download the review record** | After approval |

### Human-decision stage

This is the trust moment. Do not say “blocked” without explanation. The screen should say:

> **RegOS needs your decision**  
> The source says the issue must be reported within one week, but it does not say what starts that week. RegOS cannot calculate a due date until your firm records its policy.

Then ask one question:

> **What event starts this reporting period for your firm?**

Give clear choices, a free-text option only if genuinely necessary, and a valid deferral:

- `Discovery by the information-security team`
- `Confirmation by the compliance officer`
- `I cannot confirm this yet`

The deferral should preserve the amber state and explain that no due date will be created. Do not force a fabricated answer merely to complete a demo.

## Screen blueprints

### Dashboard — “What needs my attention?”

```text
Dashboard
One decision needs your attention                         [Open the decision]
The source does not state what starts one reporting clock.

Where the review stands                 Next actions
  1 needs your decision                  1. Record the clock-start decision
  2 sources checked                      2. Review the uploaded document
  3 evidence items up to date

Incident reporting                         Evidence and source
  Needs your decision                      3 of 3 items up to date
  [View the decision]                      [View evidence]

Recent record
  10:24 — Source checked · Alex Shah
  10:21 — A decision is needed
```

- The hero is one consequence and one action, not a score wall.
- Use counts only when the user can act on them.
- Fold charts and long audit data below the work queue.

### Review a requirement — “Can our practice still hold?”

Use the sequential blueprint above. Keep the source and comparison at the visual centre; move technical input data into `Details` disclosure.

### Your own document — “What in this document needs a reading?”

1. Upload or choose the document.
2. Say what RegOS can and cannot read from it (for example, no OCR if that is a product limit).
3. Show a short list of passages that need a person, not a wall of classifications.
4. Let the reviewer approve or reject one passage at a time.
5. Provide a draft review packet only after a named review.

### AI assistants — “What did the assistant check?”

Avoid an agent-control-room metaphor. Present each assistant as a read-only check with a clear scope and result:

```text
Deadline reader
Checked: 14 timing passages in the selected source
Result: 1 needs your decision; 13 have no timing instruction
[See what it checked]
```

Put event hashes, model details, and chain data in **Technical details**, not the default card. The user should never need to decode an “agent run” to understand the outcome.

### Full record — “Can I trace this decision later?”

Lead with a summary:

- source reviewed
- named decision
- follow-up created
- record availability

Organise the rest as four plain sections: **Sources**, **Decisions**, **Follow-up and evidence**, **Technical details**. This replaces a jargon-heavy audit navigation rail. Keep OSCAL and raw fingerprints in the export/technical section, where auditors who need them can find them.

## Content patterns

### Callouts

Use only when the message changes the next action.

| Situation | Title | Body | Action |
| --- | --- | --- | --- |
| Missing clock-start | **A decision is needed** | The source gives the period but not what starts it. RegOS has not calculated a due date. | Record the decision |
| Source changed | **The source link has changed** | The current page no longer matches the copy reviewed here. | Check the source again |
| Check failed | **The comparison could not finish** | Nothing has been changed. Try again or review the source manually. | Try again |
| No evidence | **No evidence has been added** | Add the item that supports this follow-up when it is available. | Add evidence |

### Empty states

An empty state must say what is absent, why it is absent, and what happens next. Never show a large dashed rectangle by itself.

| Avoid | Prefer |
| --- | --- |
| “Changes appear after the check runs.” | **Follow-up will appear after you check the firm’s current practice.** |
| “Proof unlocks when a named person approves the decision.” | **The review record becomes available after a named reviewer approves the decision.** |
| “No data” | **No review record yet. Start by reading the cited source.** |

### Tables and technical details

- Use plain column names: `Source`, `What it says`, `Our practice`, `Decision`, `Reviewed by`, `Date`.
- Keep long values in a disclosure, copy control, or downloadable record—never force a 64-character hash into a standard table cell.
- Format a check code as `SHA-256 · 9b2a…cd81` with a copy action and an explanation: “This code changes if the document changes.”
- Give every timestamp a human-readable date first, with ISO time in technical details.

## Responsive and accessible behaviour

- Test the workflow at 1440, 1024, 768, and 390px widths.
- At 768px and below, stack comparisons; source remains first and actions remain directly after the relevant explanation.
- At 390px, remove side rails, keep the primary action full-width, and show a compact “Step _n_ of 5” progress label.
- Do not make the page body scroll sideways. Tables and check-code rows may scroll within their own container.
- Keep buttons at least 44px high; use visible keyboard focus; label icon-only controls.
- Status must have text and an icon in addition to colour. Error text should say what happened and whether anything changed.
- Respect `prefers-reduced-motion`; no bouncing, auto-counting, or decorative loading sequences.

## Implementation order

1. **Remove duplicate navigation and hidden-stage placeholders** from Guided Review. Keep one progress line.
2. **Create a shared `StatusLine` component** with the five states above; restrict `Tag`/pill use to filters and dense tables.
3. **Apply the vocabulary map** to headings, buttons, callouts, and empty states. Keep raw terms only in technical disclosure/export.
4. **Flatten nested cards** into source quote, comparison, decision, and data-row patterns.
5. **Build the visual primitives and motion tokens**, then add the source sheet, comparison bridge, decision marker, and one approval-outcome sequence.
6. **Reorder the dashboard** around one next action, then context, then the record.
7. **Simplify assistants and Full record** around outcomes first, technical evidence second.
8. **Run mobile, keyboard, reduced-motion, and no-data checks** before release.

## Acceptance checklist

- [ ] A new evaluator can identify the next action without reading a legend.
- [ ] No screen has more than one workflow navigator.
- [ ] Every current screen has one clear primary action (or explicitly has none).
- [ ] Future stages are hidden until meaningful; no dashed “locked” content wells.
- [ ] Status wording distinguishes “needs a person” from “check failed.”
- [ ] A non-technical user never sees raw enum names in the normal path.
- [ ] The exact source wording, citation, source link, and document check code remain available.
- [ ] Human decisions remain named, dated, and exportable.
- [ ] The app never invents a due date where the source does not state the clock-start.
- [ ] Desktop and 390px mobile layouts have no overlapping controls or horizontal page scroll.
