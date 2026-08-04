# RegOS Sentinel design, language, and evidence-story workflow

**Purpose:** turn a strong, production-ready Evidence Desk into a more accessible and easier-to-explain compliance product without loosening any of its regulatory safeguards.

**Scope:** this is a remediation plan with one supporting validation-harness improvement. It preserves the product's non-negotiable separation of source fact, fixed-rule calculation, model suggestion, and human decision.

## Audit result

### Health score

| Dimension | Score | Evidence-based finding |
| --- | ---: | --- |
| Accessibility | 2/4 | One shared normal-text token fails WCAG AA on every light surface. |
| Performance | 3/4 | No live rendering failure was found; legacy visual rules need reachability measurement before any cleanup. |
| Responsive design | 3/4 | The normal UI passed at 1440, 1024, 768, and 390px locally and in warmed production; the distinct production boot shell was captured at all four widths without pre-warming. |
| Theming | 3/4 | A disciplined token system exists; a single muted-text token is incorrectly light. |
| Anti-patterns | 3/4 | The guided review is distinctive and document-forward. Any legacy glass/gradient cleanup must be based on live reachability, not a blanket restyle. |
| **Total** | **14/20** | **Good foundation; address the shared accessibility defect and evidence-story gaps before polishing.** |

### What was verified

- `npm run typecheck` passed.
- `scripts/qa/drive.mjs` returned **0 findings** locally when run at `http://localhost:3000` and against the warmed production deployment at `https://regos-sentinel.vercel.app`.
- A new `--capture-boot` mode opens all four viewports together before the normal run. A no-prewarm production invocation showed the actual `Starting up…` boot shell at 1440, 1024, 768, and 390px, with no horizontal overflow; the `skel-group--dial`, `--row`, `--lines`, and `--stat` stylesheet rules were also present. The live first-visit state is a dedicated `.boot` shell, not a generic `.skel-group` skeleton—this distinction is now explicit in the check.
- Those checks cover four viewport widths, overflow, truncation, a fixed jargon list, raw enum patterns, focus, reduced motion, and JavaScript errors. They do **not** test colour contrast or terminology that is not in their fixed list.
- The existing Guided Review already provides the right visual language: official wording → firm practice → named human decision → operational change → record. Keep that direction.

## The target experience

The dashboard should be a **decision inbox**, not a feature inventory. The visual centre remains the official quotation, while the first screen makes the next accountable action obvious.

```text
WHAT NEEDS A PERSON?        One decision, why it cannot be automated, one action
          ↓
WHAT PROVES IT?             Official wording  →  current firm practice  →  decision
          ↓
WHAT FOLLOWS?               Owner, evidence request, and review record
          ↓
WHAT ELSE EXISTS?           Metrics, assistants, technical trace, and full history on demand
```

This is intentionally not a new map, gauge, or decorative graph. The relationship between evidence and the human decision is the useful visualisation.

## Findings and required remediation

### P1 — Shared muted text fails WCAG AA

- **Location:** [`web/app/globals.css`](../web/app/globals.css:12), token `--ink-3`; 466 current uses.
- **Evidence:** `#80838d` has a contrast ratio of 3.78:1 on white, 3.60:1 on the canvas, and 3.33:1 on `--bg-2`. It is used for normal reading text such as metadata, field hints, timeline details, labels, and placeholders—not only decorative chrome.
- **Impact:** low-vision users and users in poor viewing conditions lose supporting evidence and action context. This contradicts the product's requirement for a reviewable record.
- **Fix:** change the token once, rather than patching hundreds of call sites. Use the measured target `#6a6d75`, which reaches 5.18:1 on white, 4.92:1 on the canvas, and 4.55:1 on `--bg-2`. Then visually review only non-text uses of the token.
- **Acceptance:** automated contrast test passes at every target width; manual check confirms the three-step ink hierarchy remains distinguishable.

### P1 — The Cyber Capability Index is presented as a compliance score

- **Location:** [`web/components/Dashboard.tsx`](../web/components/Dashboard.tsx:899), [`web/components/CciDial.tsx`](../web/components/CciDial.tsx:76).
- **Evidence:** the dashboard calls the CCI “your compliance health score” and renders `56 out of 100`, although only 8 of 23 parameters are assessed. The repository explicitly prohibits a single compliance score. The current demo profile is a small-size RE, while the SEBI FAQ's dashboard requirement in Q30 is explicitly scoped to MIIs and Qualified REs.
- **Impact:** the visual weight and wording imply a regulatory conclusion that neither the shown data nor the profile scope establishes. This is a trust and claim-discipline risk, not merely a copy issue.
- **Fix:** make an explicit product decision before changing visuals:
  1. If the screen is an official CCI assessment, gate it behind a source-backed eligibility rule and show its scope and calculation basis.
  2. If it is prototype evidence coverage, rename it accordingly and state that it is **not** an official CCI or compliance conclusion.
  3. For a profile outside the supported scope, show an honest unavailable/not-assessed state instead of a score.
- **Acceptance:** no default screen uses “compliance health score”; every displayed value has a cited scope, input count, and an explanation of what is not assessed.

### P1 — Two earned proof points are not visible to an evaluator

- **Location:** [`web/lib/types.ts`](../web/lib/types.ts:788), [`web/components/Agents.tsx`](../web/components/Agents.tsx:86), [`AGENTS.md`](../AGENTS.md:247).
- **Evidence:** SEBI FAQ Q30 explains why suitable automated compliance dashboards matter for the specifically named in-scope organisations. Separately, the read-only challenger caught a real clock-start citation defect that passed 60 tests; the regression guard remains in the repository. Neither fact is presented as an intelligible product proof in the main experience.
- **Impact:** a jury sees a polished interface but not the strongest evidence that the product is careful, bounded, and technically useful.
- **Fix:** add two modest, source-scoped proof artefacts—never marketing claims:
  - **Why this capability exists:** a disclosure under “How it works” that cites Q30 and says exactly which organisations the source names. Do not imply that it applies to every demo profile.
  - **A challenge that protected the decision:** after the review result, show a one-row evidence thread: “A read-only challenger found that the cited passage stated a period but not its start. The review stayed blocked until the correct source link was recorded.” Link to the cited passages and the record.
- **Acceptance:** a first-time evaluator can explain, without opening technical details, why the product stopped and why a human decision was required.

### P2 — Jargon control is systematic but incomplete

- **Location:** [`web/lib/presentation.ts`](../web/lib/presentation.ts:1), [`web/components/GuidedReview.tsx`](../web/components/GuidedReview.tsx:216), [`scripts/qa/drive.mjs`](../scripts/qa/drive.mjs:38).
- **Evidence:** the central presentation map is a strong safeguard, but direct fields bypass it. The main review currently exposes `SMALL-SIZE RE` and `CTRL-VAPT-07`; the test harness only catches a fixed list of around 40 terms and a narrow raw-enum pattern.
- **Impact:** non-legal, non-technical compliance officers meet internal identifiers and unexplained abbreviations in the task path, while new jargon can evade automated checks.
- **Fix:** maintain one translation policy in `presentation.ts`; do not change backend vocabulary or sealed records. Classify rendered terms as follows:

| Keep verbatim | Translate at first use | Move to record/details |
| --- | --- | --- |
| Quoted SEBI language and locators | “Small-size regulated entity (SEBI category)” | `CTRL-VAPT-07` → “Control reference” |
| Official document names | “Vulnerability assessment and penetration testing (VAPT)” | Hashes, document check codes, and model identifiers |
| Source citations | “When the reporting period begins” instead of only “clock-start” | Raw statuses and stable object IDs |

- **Acceptance:** a generated rendered-prose inventory is reviewed on every major change; each non-quoted specialist term is translated, defined at first use, or deliberately confined to the full record.

### P2 — The validation harness cannot prevent recurrence of the two main defect classes

- **Location:** [`scripts/qa/drive.mjs`](../scripts/qa/drive.mjs:26).
- **Evidence:** it correctly checks layout and a finite jargon blocklist but has no contrast calculation and no review path for newly introduced rendered terms. Its default URL is `127.0.0.1`, which Next development mode may reject for resources; use `localhost` or explicitly configure the allowed development origin.
- **Impact:** a clean QA report can coexist with unreadable text or newly invented jargon, and a local run can falsely exercise only the loading view.
- **Fix:** add three checks:
  1. `axe-core` or equivalent contrast checks plus targeted token/surface assertions for the shared palette.
  2. A rendered-text export per tab and viewport, filtered to remove quoted source text and mono IDs; fail only on unreviewed terms, not on an arbitrary permanent blocklist.
  3. A production contract run that warms the API and checks the normal UI, plus a separate, no-prewarm run that captures the actual boot shell at all four target widths.
- **Acceptance:** CI reports contrast, newly introduced vocabulary, warm production, and boot-state results as separate evidence. A warm run is never evidence that the first-visit state passed.

### P3 — Legacy visual CSS must be measured before it is redesigned

- **Location:** [`web/app/globals.css`](../web/app/globals.css:1); current component workstream styles contain no gradients or `backdrop-filter` rules.
- **Evidence:** global CSS contains 65 gradient/backdrop-filter occurrences, while the current Evidence Desk parts contain none. Some global selectors may be legacy rules for surfaces no longer rendered.
- **Impact:** deleting or restyling by inspection risks spending time on dead CSS or reintroducing the decorative visual language the current design successfully avoided.
- **Fix:** add a stylesheet-to-live-DOM reachability report that visits every tab and records selectors with gradients, backdrops, and expensive filters. Remove only unreachable rules; review reachable rules against the document-forward design system.
- **Acceptance:** every remaining visual effect has a live owner, a stated purpose, and a reduced-motion/fallback path where relevant.

## Implementation workflow

### 0. Freeze evidence and success criteria

1. Save the current production QA report and screenshots after warming the API.
2. Add a short decision record for CCI scope: official assessment, prototype coverage, or unavailable for the demo profile. Do not choose without a cited source and product-owner approval.
3. Define the release gates below before visual changes begin.

**Exit condition:** baseline screenshots, current audit result, and CCI scope decision are recorded.

### 1. Repair the shared accessibility defect first

1. Change only `--ink-3` to the measured target `#6a6d75`.
2. Verify it on white panels, the page canvas, wells, semantic washes, input placeholders, and disabled/help text.
3. Add contrast automation to the QA harness before touching individual call sites.
4. Manually inspect dense record, source, upload, and assistant screens at 390px and 200% zoom.

**Exit condition:** no normal-size user-visible text is below 4.5:1; colour is not the only state signal.

### 2. Make terminology reviewable rather than ad hoc

1. Export visible leaf text from every tab after a normal walkthrough and after the blocked/human-decision state appears.
2. Mark each term: source quote, necessary domain term, product term needing a gloss, or internal-only identifier.
3. Add accepted public labels to `presentation.ts`, keyed by stable backend values.
4. Replace direct enum/identifier display in the task path; retain copyable exact IDs in Full record.
5. Add a human review of any newly rendered uncommon term to pull requests.

**Exit condition:** a compliance officer can follow the default case without knowing internal IDs or expanding a technical disclosure.

### 3. Re-scope the CCI before redesigning its visual

1. Read Q30–Q33 with the product owner and record which claim the view is allowed to make for each entity category.
2. If in scope, render: eligibility, date, source version, assessed count, unassessed count, and calculation basis.
3. If not in scope or not fully assessed, replace the dial with an evidence-coverage row and a truthful unavailable state. Never fill gaps with zeroes.
4. Move per-parameter detail to a dedicated assessment/record view; keep only the consequence for the next action in the decision inbox.

**Exit condition:** no score looks like a compliance verdict; the component explains its scope before its number.

### 4. Surface the product's real proof in the decision journey

1. Keep the existing source-versus-practice comparison as the central visual primitive.
2. Add the Q30 rationale in “How it works,” with its limited scope stated in the same component.
3. Add the challenger evidence thread only where the real test/review data is available; link it to Q15/Q17(b), the blocked state, and the regression record.
4. Test the copy with a jury-style prompt: “Why did RegOS not create a due date?” and “What did the challenger prevent?”

**Exit condition:** a user can answer both prompts from the visible product, with no unsupported claim.

### 5. Simplify the dashboard by task, not by aesthetics

1. Keep the amber decision card and its single primary action as the opening view.
2. Under it, show a compact evidence bridge: **official wording → firm practice → decision still needed**.
3. Demote source inventory, capability coverage, question input, and assistants to named destinations or disclosures. Do not repeat a second navigation system in the dashboard.
4. On mobile, preserve the decision card and evidence bridge before any broad metrics; allow the remaining content to follow naturally rather than compressing it into tiny cards.

**Exit condition:** the first screen answers: what needs me, why, what source supports it, and what to do next.

### 6. Remove only measured visual debt

1. Run the CSS reachability report across all tabs and states.
2. Delete unreachable global visual rules first.
3. For each reachable gradient, blur, or backdrop, document the component, purpose, accessibility fallback, and performance cost.
4. Keep only effects that strengthen source/evidence hierarchy or action focus.

**Exit condition:** the light, document-forward register remains intact without speculative restyling.

### 7. Validate with users and the release gate

1. Run a five-minute moderated test with a compliance officer or a proxy unfamiliar with internal vocabulary.
2. Ask them to find the open decision, explain why it is not an error, identify the source, and say whether a due date exists.
3. Run typecheck, API tests, local QA using `localhost`, warmed-production QA, and no-prewarm boot-state QA across all four target widths.
4. Re-run the contrast and rendered-prose checks, then compare before/after screenshots at 1440 and 390px.

**Exit condition:** all automated gates pass and test participants can explain the core workflow without help.

## Cited evidence from working regulatory systems

The sources below are live regulator, exchange, or regulated-firm systems and their first-party manuals—not visual-design galleries. They are evidence for interaction and claim boundaries, not visual templates. A public manual cannot prove every internal workflow; each conclusion is therefore limited to what its operator documents.

| Working system | Default screen and one step deeper | Explicit boundary: what it does not pretend to show or decide | RegOS consequence |
| --- | --- | --- | --- |
| [Bank of England BEEDS portal user guide](https://www.bankofengland.co.uk/-/media/boe/files/statistics/data-collection/beeds/beeds-user-guide) | The **Returns** page lists returns available for completion with a status. Selecting a return takes the firm to upload and error/warning detail; **Submission history** then exposes versions and resubmission requests. | It distinguishes **No data**, **No data with errors**, **Completed with warnings**, **Pending approval**, and **Accepted** rather than synthesising a pass score. A submitted file is a legal submission, not a test; the regulator also removes submission data from the portal after a stated retention window while retaining it internally for supervision. | Use explicit evidence/state labels for unknown, incomplete, blocked, warned, and human-approved conditions. Do not turn 8/23 assessed CCI parameters into a health verdict. Preserve a separate full record rather than assuming the working dashboard is the permanent record. |
| [FINRA Gateway](https://www.finra.org/filing-reporting/finra-gateway) and [FINRA Compliance Calendar](https://www.finra.org/compliance-tools/compliance-calendar) | Gateway puts registration, financial/operational filings, reports, compliance resources, and information requests behind a single authenticated entry point. In the documented Form U4 flow, users can track a person's progress and form status through the product's navigation; the firm submits the finished form. The calendar opens on upcoming dated events and lets firms filter event categories. | FINRA's calendar says it may not be an exhaustive list of a firm's obligations and creates no safe harbour. Gateway separates editing/tracking from the firm's final submission. | Keep RegOS's source → suggestion/rule → named human decision separation. Put a clear scope/limitation next to any reminder or CCI-related number; never make a coverage display look exhaustive or legally decisive. |
| [ASIC Regulatory Portal](https://www.asic.gov.au/online-services/asic-portals/asic-regulatory-portal-access/) and its [transaction-access guide](https://download.asic.gov.au/media/nc4ipcpg/regulatory-portal-qrg-how-to-restrict-a-transaction-october-2021.pdf) | A user selects the entity they represent, reaches that entity's dashboard, and starts or opens a transaction. One step down is a transaction setting/confirmation flow; users can open **View all transactions** or an individual transaction. | Users may restrict a transaction to selected connected users; senior administrators retain access. The portal therefore scopes case visibility to the entity and authorised role instead of treating every item as universally visible. | Keep the default view focused on the current firm and decision. Never expose another role's evidence or turn a role-restricted decision into a broadly visible dashboard metric. Treat the named reviewer as an authority boundary, not decorative attribution. |
| [FCA Regulatory Initiatives Grid dashboard](https://www.fca.org.uk/publications/corporate-documents/regulatory-initiatives-grid/dashboard) | The public default is an overview of planned initiatives with filters for sector, authority, expected firm impact, and consumer interest. A separate **Initiative details** dashboard provides deeper information; underlying data is downloadable. | Filters deliberately do **not** carry from overview to detail automatically. The FCA documents that scope instead of implying the two views are one globally filtered truth. | A summary and record/detail view may have different purposes, but their filter and scope state must be visible. RegOS must not let a dashboard total silently inherit a narrower evidence set from another view. |

### What the evidence says about “nothing to do” and abstention

BEEDS is the strongest directly comparable precedent: it represents no entered data, invalid data, a warning, pending approval, and accepted data as different named states. This supports RegOS's existing model rule—abstention is not zero—and its amber blocked state.

Evidence for one universal, public-sector **empty dashboard** treatment is thin in the reviewed first-party material. Do not claim that a particular `nothing to do` phrase is industry-standard. Instead, use the narrower, supported pattern:

```text
No decision needs a person now
└─ What was checked: <source/version and build state>
└─ What this does not say: <unassessed evidence or no conclusion>
└─ Next available action: Review the record
```

The sentence must only render when deterministic data confirms there is no open decision. It is not a replacement for a failure, a blocked interpretation, or unavailable data.

### Government-design-system guardrails

- The [GOV.UK task-list component](https://design-system.service.gov.uk/components/task-list/) gives every task a named status and allows a concise hint. It also says to use the pattern only when users need to choose the order of work across sessions; do **not** use it merely to display answers. RegOS should keep its ordered guided-review stepper, while its decision inbox may use the task-list grammar of title + status + short reason.
- The [US Web Design System alert guidance](https://designsystem.digital.gov/components/alert/) says an important status message should state the next step in concise, human-readable language, and it distinguishes informative, warning, success, and error messages. This supports a single action on the amber blocked-decision card; it does not justify a wall of alerts.
- The [Guidelines for Indian Government Websites and Apps](https://guidelines.india.gov.in/) publish accessibility, semantic-markup, usable-form, mobile, and screen-reader resources. They support treating the contrast and boot-state checks as release gates rather than decorative refinements.

### Direct contradictions and decisions

1. **The CCI dial's presentation conflicts with the operating-system evidence.** [`Dashboard.tsx`](../web/components/Dashboard.tsx:899) calls a partial CCI “your compliance health score,” while [`CciDial.tsx`](../web/components/CciDial.tsx:76) shows a band and `out of 100` with only 8 of 23 parameters assessed. BEEDS documents named incomplete/approval states rather than a fabricated all-clear number; FINRA also explicitly disclaims exhaustiveness and safe harbour. **Decision needed:** choose official in-scope assessment, prototype coverage, or unavailable. Until then, do not change the wording merely to make the score sound safer—the default should not render a score-shaped compliance conclusion.
2. **The cold state was previously tested under the wrong name.** The shipped first-visit state is the dedicated `.boot` shell in [`web/app/page.tsx`](../web/app/page.tsx:181), not the later component-level `skel-group` loader. The updated [`drive.mjs`](../scripts/qa/drive.mjs) captures that actual state at all four widths before its normal warm-state checks. Keep its results distinct; a successful normal page after warming cannot certify a first visit.
3. **Do not replace the guided review with a generic task list.** GOV.UK explicitly limits task lists to work a user may complete in a chosen order across sessions. RegOS's Source → Compare → Human decision flow is ordered, so the existing stepper is the better pattern. Borrow only its explicit status and hint language.

## Research translated into RegOS decisions

| Source | Verified observation | RegOS decision |
| --- | --- | --- |
| [SEBI CSCRF FAQ, Q30](https://www.sebi.gov.in/sebi_data/faqfiles/jun-2025/1749647139924.pdf) | Q30 says MIIs and Qualified REs shall build an automated tool and suitable dashboard, and links it to CCI. | Use it as a cited rationale only with its stated scope; do not claim it mandates the current small-size demo profile. |
| [FCA Regulatory Initiatives Grid](https://www.fca.org.uk/publications/corporate-documents/regulatory-initiatives-grid/dashboard) | A live regulator dashboard separates a graphical overview from initiative details and provides underlying data separately. | Preserve the decision-inbox overview and reserve source/evidence detail for Full record or a deliberate drill-down. |
| [GOV.UK Task list](https://design-system.service.gov.uk/components/task-list/) | A task list makes completed and incomplete work scannable; each task can carry a status and concise hint. | Keep the guided review's explicit step/status grammar and give a blocked decision a brief reason, not a vague error. |
| [Dashboard Design Patterns](https://arxiv.org/abs/2205.00757) | A systematic review of 144 dashboards frames dashboard design as a context-specific trade-off among screenspace, abstraction, pages, and interaction—not a fixed KPI recipe. | Do not import a generic “five KPI cards” template. Choose only the information needed for a compliance officer's next decision. |
| [USWDS design principles](https://designsystem.digital.gov/design-principles/) | Government services should start with real user needs, earn trust through clarity and reliability, and include accessibility in design decisions. | Test the explanation task with actual users; make claim scope and accessibility release gates explicit. |
| [Guidelines for Indian Government Websites and Apps](https://guidelines.india.gov.in/) | India's guidance explicitly provides accessibility, colour-contrast, mobile-friendliness, semantic-markup, and usable-form resources. | Treat WCAG AA contrast and device testing as release criteria, not visual polish. |

The local ParkPulse dashboard research report was reviewed only for its transferable information-architecture conclusions: progressive disclosure, plain-language measures, and action-first content. Its map, heatmap, and traffic-patrol recommendations do not apply to RegOS and are deliberately excluded.

## Final release checklist

- [ ] `--ink-3` passes AA on all actual light surfaces.
- [ ] CCI is scope-correct, not called a compliance score, and does not hide unassessed inputs.
- [ ] Every user-visible specialist term is quoted, defined, translated, or placed in Full record.
- [ ] The decision path shows source → firm practice → human decision → evidence record.
- [ ] Q30 and the challenger proof are cited and truthfully scoped.
- [ ] Local (`localhost`), warm production, and no-prewarm boot-state QA are distinct passing checks at 1440, 1024, 768, and 390px.
- [ ] Any remaining visual effect is live, purposeful, accessible, and measured.
