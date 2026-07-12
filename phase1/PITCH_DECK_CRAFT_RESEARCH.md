# Pitch Deck Craft Research — Winning Decks for Regulator / RegTech / SEBI TechSprint Judges

> **Purpose:** Exhaustive craft memo for refining the **RegOS Sentinel** 10-slide idea deck (PS2 Agentic Compliance).  
> **Audience:** Internal build team (Remotion `RegOSIdeaDeck` + Round-01 narrative).  
> **Date:** 2026-07-10  
> **Companion artifacts:** `L3_deck_storyboard.md`, `L1_competitive_delta.md`, `L6_business_sandbox.md`, `VISUAL_DIRECTION_PICK.md`, `PHASE1_GATE.md`

---

## Executive verdict (read this first)

**VC decks optimize for return × risk.** Regulator / TechSprint decks optimize for **trust × PS fit × sandbox inspectability × operational action**.

| Signal VC decks maximize | Signal SEBI / RegTech hackathon decks maximize |
| --- | --- |
| TAM / upside | Problem–statement literal fit |
| Traction / growth curves | Citation integrity + HITL accountability |
| Founder-market fit as “why us” | Sandbox path + risk controls (DPDP, KYC/AML preserved) |
| 10× product story | Weeks→minutes operational impact (demoable) |
| “First / only / category king” | Honest wedge vs funded peers (OnFinance-class) |

**RegOS already has the right spine** (L3: Problem → Contrast → Solution → Agents → Trust → Impact → Proof → SEBI value → Ask). Refinement is craft + honesty + judge-legibility — not a Sequoia clone.

---

## 1. Structure of winning decks

### 1.1 Canonical VC patterns (cite the primaries)

#### Sequoia — “Writing a Business Plan”

**Source:** [Sequoia Capital — Writing a Business Plan](https://sequoiacap.com/article/writing-a-business-plan/)

Sequoia’s own framing: the Airbnb founders used this guide; Sequoia emphasizes that **ideas and clarity of thinking** mattered more than slide polish. Recommended sections (thinking framework, not a rigid application form):

| # | Section | Job of the section |
| --- | --- | --- |
| 1 | **Company purpose** | One declarative sentence — mission, not feature list |
| 2 | **Problem** | Customer pain + how it’s addressed today + shortcomings |
| 3 | **Solution** | Eureka / unique value / why it endures / where it goes |
| 4 | **Why now?** | Why this wasn’t built before; timing vacuum |
| 5 | **Market potential** | Who is the customer; market (sometimes invented) |
| 6 | **Competition / alternatives** | Direct + indirect; plan to win |
| 7 | **Business model** | “How do you intend to thrive?” |
| 8 | **Team** | Founders + key people story |
| 9 | **Financials** | If any |
| 10 | **Vision** | Five-year “what will you have built?” |

**Practical Sequoia-derived decks** (community templates from the same post) often expand to ~10–13 slides by adding cover, product, traction, and ask/use-of-funds. Community reproductions (e.g. PitchDeckCoach / SlideShare “Sequoia Capital Pitch Deck Template”) add explicit TAM/SAM/SOM and product roadmap — useful for fundraising, **dangerous as cargo-cult for regulator juries**.

#### YC — Seed deck + Demo Day design + verbal pitch

**Sources:**

- [YC Startup Library — How to build your seed round pitch deck (Aaron Harris)](https://www.ycombinator.com/library/2u-how-to-build-your-seed-round-pitch-deck) (also historically: “The YC Seed Deck Template”)
- [YC Startup Library — How to design a better pitch deck (Kevin Hale)](https://www.ycombinator.com/library/4T-how-to-design-a-better-pitch-deck)
- [YC Blog — How to Pitch Your Company (Michael Seibel)](https://www.ycombinator.com/blog/how-to-pitch-your-company)

**Harris seed-deck spine (typical):**

| Slide / set | Job |
| --- | --- |
| Title | Company + one-line what you do (only place forced to n=1) |
| Problem | Specific real-world pain |
| Solution | Concrete benefits, few words |
| Traction | Clear, meaningful numbers (revenue > vanity users) |
| Insight / “secret sauce” | What you know that others don’t |
| Business model | How money works |
| Market | Size + how you make it big |
| Team | Founder fitness for *this* problem |
| Ask | Amount + what it buys / 12-month milestone |

Harris rule of thumb: treat most topics as a *set* of slides if needed, but **prefer n=1; never n>3** for a seed deck. Concision over treatise.

**Hale Demo Day design law (non-negotiable craft):**

1. **Legible** — large type, bold, high contrast, readable from the back row  
2. **Simple** — **one idea per slide** (“simple” = one fold; don’t braid ideas)  
3. **Obvious** — stranger test: glance → they can state your idea  

Hale explicitly warns against: too much text, diagrams-as-mazes, illegible screenshots, **animations/transitions as distraction**, memes, subtle humor, excessive branding per slide. Exception: overwhelm *on purpose* when the point *is* complexity (Magic’s logo-grid problem slide).

**Seibel verbal pitch = seven questions** (deck should answer the same):

1. What do you do?  
2. How big is the market?  
3. What’s your progress?  
4. What’s your unique insight?  
5. What’s your business model?  
6. Who’s on your team?  
7. What do you want?  

Editing rule: eliminate jargon, acronyms, marketing speak, and vague words like “platform.” “Make it sound dumber than you think it should.” Email test: smart friend explains it back without clarifying questions.

#### a16z — no official template; pattern from partner behavior + secondary guides

**Sources (secondary synthesis; a16z does not publish a Sequoia-style official template):**

- Partner/practice summaries such as [Ink Narrates — a16z pitch deck guidelines](https://www.inknarrates.com/post/andreessen-horowitz-pitch-deck-guidelines)
- Narrative principles commonly attributed in a16z-adjacent coaching: lossy compression, earned secrets, founder–market fit, 10× improvement, technical defensibility over “wrappers”

**Typical a16z-shaped flow:**

| Slide | Job |
| --- | --- |
| Opening | Who + what you’re building |
| Problem | Urgent, concrete pain |
| Solution | Core innovation; why 10× |
| Market | Bottom-up, not vanity TAM |
| Business model | Human explanation of money |
| Traction | Non-gameable metrics |
| GTM | How you acquire (no buzzwords) |
| Team | Why *you* |
| Roadmap / vision | Platform potential |
| Ask | Direct |

**a16z red flags for AI/RegTech wrappers:** thin LLM chat UIs, no technical moat, incremental “better search,” jargon overload instead of lossy compression.

#### DocSend behavioral data (how decks are *consumed*)

**Sources:**

- [DocSend — Deck design guidelines](https://www.docsend.com/blog/deck-design-guidelines-how-to-strengthen-your-pitch-with-design/)
- [DocSend — 4 mistakes to avoid](https://www.docsend.com/blog/4-mistakes-to-avoid-in-your-startup-fundraising-pitch-deck/)
- Aggregated reporting of DocSend annual studies (e.g. ~**3 min 44 sec** average first read)

Implications:

- Deck must stand alone in ~4 minutes without narration.  
- First 3 slides are a filter (cover / problem / solution).  
- **One point per slide**; movie-trailer, not feature film.  
- ~30pt font as a forcing function against text walls.  
- Long dwell time on a page often signals *confusion*, not interest.

---

### 1.2 Slide-count norms

| Context | Typical count | Why |
| --- | --- | --- |
| YC Demo Day (spoken) | **5–7** content ideas / slides | Memory limit; Hale |
| YC / Sequoia seed send-ahead | **10–15** | Diligence depth without essay |
| Classic Sequoia framework | **~10** content sections | Thinking checklist |
| SEBI TechSprint **idea deck** (RegOS locked) | **10** (band 8–12) | Enough for PS + trust + sandbox; not a fundraise |

**Rule:** If you need >12 for a hackathon idea deck, you are writing a product manual. Put depth in the **demo video** and Q&A, not the idea deck.

---

### 1.3 Regulator / fintech / RegTech hackathon decks — different job

#### What SEBI TechSprint actually rewards

**Sources:**

- SEBI TechSprint launch coverage (GFF 2026): [Rediff / PTI](https://money.rediff.com/news/market/sebi-launches-securities-market-techsprint-at-gff-2026/49281020260622), [CorpLawUpdates](https://www.corplawupdates.in/updates/sebi-securities-market-techsprint-gff-2026)
- Theme: *Innovation in Action: Shaping Securities Market for Tomorrow* — transparency, efficiency, **compliance**, accessibility  
- PS2 literal ask: **agentic compliance** that translates regulatory text → **operational action**  
- Real prize beyond cash: **consideration for mentorship under SEBI Innovation Sandbox**  
- Innovation Sandbox / Regulatory Sandbox evaluation culture (SOP summaries): genuine need to test, clear test scenarios, risk controls, user protection, identifiable market benefits, post-test deploy intent — see e.g. [TaxGuru SOP summary](https://taxguru.in/sebi/sebi-issues-sop-revised-framework-regulatory-sandbox.html), [innovation-sandbox.in](https://innovation-sandbox.in/)

**Judge mental model (reconstructed from PS + sandbox culture + Reg 16C):**

```text
Does this solve the stated PS?
  → Can I trust the AI outputs? (citations, HITL, logs)
    → Is impact operational (owners, deadlines, evidence) not chat prose?
      → Can this be sandboxed / mentored without blowing up investor protection?
        → Is the team honest about category peers and risks?
```

#### Side-by-side: VC spine vs regulator-hackathon spine

| Sequoia / YC / a16z slide | Keep for SEBI? | Replace / reframe as |
| --- | --- | --- |
| Company purpose | **Yes** — brand + one sentence | PS-tagged one-liner (circulars → cited obligations → action) |
| Problem | **Yes** — mandatory | Intermediary operational pain + PS language |
| Solution | **Yes** | Compliance OS, not “AI platform” |
| Why now | **Yes, but cite law** | Reg 16C, CSCRF pressure, master-circular rewrite — not “AI hype” |
| Market / TAM | **Cut or demote** | Wedge ICP (small/mid broker) + category proof (OnFinance WTP) |
| Competition | **Yes, but honest** | Differentiation matrix, never “first” |
| Product / architecture | **Yes** | Agents + obligation graph + change-sim |
| Traction | **Reframe** | Demo metrics: citation %, time-to-plan, precision target — not ARR |
| Business model | **Light** | SaaS seats + sandbox→pilot path (L6); not unit-econ deep dive |
| Team | **Optional / appendix** | Only if founder–domain fit is a differentiator; else skip |
| Financials / raise | **Cut** | Ask = sandbox mentorship + pilot path |
| Vision / 5-year | **Cut or one line** | SupTech aggregate readiness — regulator benefit |

#### Recommended **regulator-hackathon** 10-slide order (RegOS-aligned)

| # | Slide | Must do (one job) | Pass/fail test |
| --- | --- | --- | --- |
| 01 | **Brand / purpose** | Name + PS tag + one declarative sentence | Could this belong to another brand if logo removed? If yes, fail |
| 02 | **Problem** | Circular → hand translation → un-auditable lag | Judge nods “that’s our intermediaries” |
| 03 | **Anti-pattern contrast** | Chatbot/RAG ≠ compliance OS | “Isn’t this just RAG?” pre-answered |
| 04 | **Solution posture** | Supervised agentic OS; decision support not legal advice | Clear ICP + trust adjectives |
| 05 | **Mechanism** | Named agents + human gate each | Explicitly agentic (PS2) without black-box vibes |
| 06 | **Trust / citation** | Verbatim span → obligation fields | Hallucination objection dies |
| 07 | **Impact climax** | Change-impact simulator; weeks→minutes | One memorable number |
| 08 | **Proof** | Measurable demo gates + named corpus | Not fake ARR; labeled metrics |
| 09 | **Regulator value** | RegTech for RE + SupTech for SEBI + Reg 16C | “Why should SEBI care?” answered |
| 10 | **Ask / sandbox path** | Pilot ladder + packaging checklist | Feels mentor-ready, not demo-day cosplay |

**Narrative “therefore” chain (YC golden-thread adapted):**

```text
Circulars are human-readable but not machine-operational
  → Therefore chatbots fail (prose, no owner/deadline/evidence)
    → Therefore RegOS builds a supervised obligation OS
      → Therefore every line is cited and human-gated (Reg 16C)
        → Therefore a new circular’s impact is minutes, not weeks
          → Therefore SEBI gets anonymized readiness visibility
            → Therefore ask for sandbox mentorship + pilot path
```

If any slide can be swapped without breaking “therefore,” the story is still a grocery list.

---

### 1.4 What each slide type must *do* (craft checklist)

| Slide type | Must include | Must exclude |
| --- | --- | --- |
| Problem | Who hurts, how today fails, time/risk cost | Feature wishlist, AI buzzwords |
| Contrast | Side-by-side failure mode of naive AI | Insulting competitors by name without respect |
| Solution | Concrete outputs (actor/action/deadline/evidence) | Architecture spaghetti |
| Trust | Source span + confidence + human gate + disclaimer | “Our model is accurate” without mechanism |
| Impact | Before/after operational metric | Vanity TAM |
| Proof | Method-labeled metrics (demo gate / labeled set) | Unsourced “95% accuracy” |
| SEBI value | Dual benefit (RE + supervisor) | “Disrupt SEBI” energy |
| Ask | Path + artifacts (model card, HITL policy, DPDP) | Equity raise cosplay |

---

## 2. Visual craft

### 2.1 Hierarchy (what the eye must find in <2 seconds)

**Order of visual priority on every slide:**

1. **Brand or slide title** (one dominant text block)  
2. **Single kinetic idea** (the “CliffsNotes” Hale wants on the slide)  
3. **One supporting sentence** (max ~2 lines)  
4. **Proof object** (table, citation card, pipeline, metric)  
5. **Chrome** (PS tag, slide index, progress) — never competing with (1)–(3)

**Typography hierarchy for RegOS (already locked in L3 / VISUAL_DIRECTION_PICK):**

| Role | Font | Job |
| --- | --- | --- |
| Brand / H1 | Sora 600–700 | Authority + product name |
| Body / UI | IBM Plex Sans | Institutional clarity |
| Clause / citation | IBM Plex Serif | “This came from a document” authenticity |

Avoid Inter / Roboto / Arial / system as primary (reads as generic AI SaaS).

**Color hierarchy (navy/teal trust):**

| Token | Role |
| --- | --- |
| Navy void `#06101F` | Trust field / regulator seriousness |
| Teal `#14B8A6` / `#2DD4BF` | Active, cited, “RegOS side” |
| Emerald | Approved / minutes / success |
| Rose | Problem / chatbot failure only |
| Amber | Confidence / caution — sparingly |
| **Forbidden** | Purple/violet/indigo gradients, neon glow stacks, cream `#F4F1EA` newspaper look |

### 2.2 One idea per slide (operationalize Hale + DocSend)

**Tests before shipping a slide:**

| Test | Pass criteria |
| --- | --- |
| **Stranger glance** | Can state the idea in one sentence without reading body |
| **Delete half** | If removing a block doesn’t change the idea, it was noise |
| **Screenshot illegibility** | If UI chrome is required to “get it,” redraw as simplified schema |
| **Word budget** | Title ≤12 words; support ≤25; total on-slide prose usually <40–50 words excluding structured tables |
| **Dual-idea detect** | If you need “and” in the title, split slides |

**Allowed multi-element slides** (still one *idea*):

- S03 contrast: one idea = “chat ≠ OS” (two panels serve one contrast)  
- S05 pipeline: one idea = “five gated agents”  
- S08 metrics: one idea = “measured, not merely demoed” (three metrics = evidence bundle)

### 2.3 Motion that sells vs motion that distracts

Hale’s Demo Day guidance is harsh on animations. **Hackathon Remotion decks are different media** (asynchronous video / motion graphics), so motion is allowed — but only when it **encodes meaning**.

| Motion type | Sells when… | Distracts when… |
| --- | --- | --- |
| **Typewriter / highlight** | Reveals the claim word (`cited obligations`, `Minutes`) | Types entire paragraphs |
| **Stagger spring** | Builds a list/pipeline the brain can chunk | Every ornament bounces |
| **Progress fill along agents** | Shows sequential supervised flow | Infinite loader aesthetics |
| **Citation connector draw** | Proves span→obligation link | Decorative SVG flourishes |
| **Weeks→Minutes morph** | Encodes the impact metric | Confetti / emoji / particle spam |
| **Wipe into climax only** | Marks the emotional peak (S07) | Wipe/cube/glitch every slide |
| **Fluid blob background** | Atmosphere behind crisp type | Competes with foreground contrast |
| **Count-up numerals** | Anchors proof metrics | Fake precision (counting to “95%” of unsourced survey without footer) |

**RegOS motion policy (locked):**

- Default transition: short **fade** (~12f)  
- One hard **wipe** into S07 climax only  
- Springs for UI entrances; no meme transitions  
- Background fluid/teal smoke = ambient; foreground always judge-readable when paused  
- Signature moments must read as **still frames** (A–E in L3)

**Paused-frame QA:** If a judge screenshots mid-slide and cannot recover the idea, motion failed.

### 2.4 Layout anti-clichés for RegTech

| Cliché | Why it loses trust | RegOS alternative |
| --- | --- | --- |
| Purple neural-net hero | “Generic AI startup #482” | Navy void + teal hairline + document authenticity |
| Dashboard collage in slide 1 | Looks like a product tour, not a thesis | Brand-first cold open |
| Floating badge stickers (“AI-powered!”) | Promo energy | Clause citation card |
| 3D robot / brain mascot | Toy | Obligation register table |
| World map + glowing nodes | Fake global scale | Named SEBI corpus chips |
| Heavy card grids | Dilutes hierarchy | Hairline panels, one proof object |

---

## 3. Jargon glossary for RegOS Sentinel judges

> Format required: **Term | What it does in RegOS | Why a SEBI judge cares | One-line on-slide gloss**  
> These are *functional* glosses — what the thing *does* — not dictionary definitions.

| Term | What it does in RegOS | Why a SEBI judge cares | One-line on-slide gloss |
| --- | --- | --- | --- |
| **Agentic** | Runs a multi-step pipeline (watch → interpret → map → evidence → audit) that produces *work items*, not a single chat reply | PS2 literally asks for agentic compliance that turns text into operational action | *Agents that produce owners, deadlines, and evidence — not essays.* |
| **HITL (Human-in-the-Loop)** | Blocks high-stakes outputs until a named human approves; logs who approved what, when | Reg 16C makes REs solely liable for AI/ML outputs; chair messaging emphasizes human oversight | *No obligation goes live without a human gate.* |
| **Clause citation** | Attaches each extracted obligation to a verbatim source span in the circular/CSCRF PDF | Kills hallucination risk; makes outputs inspectable in supervision | *Every line points to the exact clause text.* |
| **Obligation graph** | Stores structured nodes/edges: actor ↔ action ↔ deadline ↔ evidence ↔ clause ↔ controls | Turns PDFs into a machine-operable compliance system of record | *Rules become a graph you can assign, track, and audit.* |
| **SupTech** | Optional anonymized aggregate readiness view for SEBI/MII (gap patterns, slow circulars) — no raw PII | Shows regulator-side value beyond vendor sales pitch | *RegTech for brokers; readiness visibility for SEBI.* |
| **RegTech** | Software intermediaries use to interpret, operationalize, and evidence compliance continuously | Core TechSprint theme: efficiency + compliance for market participants | *Compliance OS for regulated entities.* |
| **CSCRF** | Primary cyber corpus pack: maps RE-tier obligations (audits, controls, reporting) into tasks + evidence | Acute 2024–26 implementation pressure for brokers; concrete demo corpus | *Cyber framework → cited tasks for your RE tier.* |
| **Master circular** | Ingests Stock Broker (and related) master-circular text as living obligation source; change-sim when it rewrites | SEBI is actively simplifying/rewriting master circulars — text churn is the pain | *When the master circular moves, your task graph updates.* |
| **Reg 16C** | Product constraints: citations, HITL, AI action logs, model card, “decision support / not legal advice” | Law: intermediaries accountable for AI outputs (in-house or third-party), including compliance tools | *Built for AI-output accountability — not a black box.* |
| **Change-impact simulator** | Diffs a new/amended circular against the current graph → +/- obligations, control changes, tasks, evidence gaps | Signature proof of “operational action” vs summarization tools | *New circular → impact in minutes, not weeks.* |
| **Innovation Sandbox** | Packaging + test plan path: KPIs, risk register, no live-trading/PII abuse, mentor-ready artifacts | Shortlisted TechSprint work is considered for sandbox mentorship — the real prize | *Demo today; sandbox-ready packaging tomorrow.* |
| **Applicability filter** | Restricts obligations to the entity’s type/tier (e.g., Small RE vs Qualified) so noise drops | Wrong-applicability advice is worse than no advice for lean teams | *Only the rules that apply to this intermediary.* |
| **Audit pack** | Exports evidence-linked obligation status, approvals, and citations into an inspection-ready bundle | What compliance officers and inspectors actually need at exam time | *Export the proof, not a chat transcript.* |
| **DPDP** | Constrains prototype/pilot data: synthetic/anonymized evidence; privacy statement in sandbox pack | Judges/mentors check that innovation doesn’t trample personal-data law | *Privacy-safe by design — no raw PII in the demo path.* |

### 3.1 Optional related terms (Q&A only — keep off crowded slides)

| Term | On-slide? | One-line if asked |
| --- | --- | --- |
| Human-on-the-Loop (HOTL) | No (unless advanced Q) | Future: agents run inside guardrails; humans exception-handle — RegOS starts HITL-first for Reg 16C |
| RAG | Only on contrast slide | Retrieval helps answers; without structure + gates it’s still a chatbot |
| Model card | Ask slide / pack | Documents model limits, evals, intended use for inspectors |
| AI action log | Trust / ask | Immutable-ish record of what the agent proposed and what humans did |
| Small / Mid / Qualified RE | Solution / wedge | CSCRF tiering — RegOS wedges lean Small/Mid desks first |
| SCORES ↔ ODR | Proof corpus chip | Investor-grievance / ODR circular pair in the named corpus trio |

---

## 4. Anti-patterns that lose hackathons

### 4.1 The “generic RAG chatbot” look

| Symptom | Why judges bounce | Fix |
| --- | --- | --- |
| Chat UI as the hero | PS2 asks for operational action | Obligation register + workflow |
| Paragraph answers to “what does CSCRF require?” | No owner, deadline, evidence | Structured row with clause + conf. |
| “Ask anything about SEBI regs” positioning | Unscoped legal-advice risk | Applicability-filtered decision support |
| Embedding demo = ChatGPT skin | Commodity; OnFinance-class already exists | Change-sim + audit pack + HITL |

**RegOS already counters this on S03** — protect that slide; never dilute it.

### 4.2 Purple AI cliché & visual cosplay

| Symptom | Why it loses | Fix |
| --- | --- | --- |
| Violet/indigo gradients, glow orbs | Reads as consumer AI wrapper | Navy/teal institutional system |
| Soft cream + terracotta “premium” template | Another AI-design cluster | Stay on locked palette |
| Robot / brain / neural illustrations | Toy, not market infrastructure | Document + graph metaphors |
| Neon “AI” stickers | Promo, not trust | Reg 16C / citation language |

### 4.3 Too much text

| Symptom | Why it loses | Fix |
| --- | --- | --- |
| Paragraph slides | DocSend/Hale: unread, unremembered | One idea; move detail to demo VO |
| Architecture diagrams with 20 boxes | “Maze for ideas” (Hale) | Five-agent rail only |
| Footnote essays on-slide | Competes with kinetic claim | One source footer line max |
| Reading the slide aloud 1:1 | Audience reads ahead and tunes out | Sparse slides; speak the connective tissue |

### 4.4 Fake metrics & unsourced precision

| Symptom | Why it loses | Fix |
| --- | --- | --- |
| “99.9% accurate AI” | Unbelievable; invites hostile Q | Method-labeled: *citation coverage on displayed obligations* |
| Huge TAM (“$50B RegTech”) | Vanity; irrelevant to sandbox | ICP wedge + category WTP proof |
| Fake customer logos | Integrity kill if challenged | Synthetic evidence **labeled**; real docs only |
| Smooth hockey-stick with no axis | Hale’s non-obvious graph sin | Big number + plain-language caption |
| Survey stat without source line | Looks invented | Keep footer: e.g. SEBI Investor Survey framing / PS text |

**RegOS metric hygiene (keep):**

- `100%` citation coverage **on displayed obligations** (scope-honest)  
- `<3 min` circular → plan **(demo gate)**  
- `≥0.85` extraction precision **(labeled set / target)**  

### 4.5 “First ever” / category-invention claims

| Symptom | Why it loses | Fix |
| --- | --- | --- |
| “India’s first agentic compliance” | OnFinance ComplianceOS (and global Corlytics-class) falsify it | “Enterprise exists; we wedge small-RE / sandbox-inspectable” |
| “No one does circular → obligations” | False; crowded field (Praeco/Mereth/etc. adjacent) | Differentiate on citation+HITL+change-sim+open inspectability |
| “Premiered by SEBI” energy (if copying peers’ claims) | Unverifiable brag contagion | Let SEBI judges decide; show inspectable demo |
| Competitor trash-talk | Looks insecure | Respectful matrix; earn secret = small-broker operating layer |

**Locked honesty line (from L1/L6):**

> Enterprise agentic compliance already exists. RegOS is the sandbox-ready, Reg 16C-aligned operating layer for lean stock brokers — cited, human-gated, CSCRF-first — not the invention of the category.

### 4.6 Other hackathon-specific failure modes

| Anti-pattern | Failure mode |
| --- | --- |
| Ignoring the PS letter | Brilliant product for the wrong statement |
| No sandbox path | Looks like a weekend demo, not mentor-able |
| Skipping investor-protection posture | “We’ll automate KYC away” = instant reject |
| Team slide of logos/advisors | YC: nobody cares about advisors at seed; same here unless domain-critical |
| Dual ask (raise + sandbox) | Confuses prize function |
| Demo ≠ deck claims | Trust collapse in finals |
| English jargon wall for mixed jury | Seibel: predigest; gloss on-slide |

---

## 5. Exact recommendations for RegOS 10-slide deck refinement

> Baseline: `L3_deck_storyboard.md` + Remotion `RegOSIdeaDeck` (S01–S10).  
> Constraints: **PS2**, navy/teal, Reg 16C HITL, **OnFinance-honest wedge**, never “first.”

### 5.1 Keep (do not “YC-ify” away)

| Keep | Why |
| --- | --- |
| 10-slide regulator spine (no TAM/team/financials as core) | Correct audience model |
| S03 chatbot vs RegOS contrast | Pre-empts #1 judge objection |
| S05 five supervised agents | Literal PS2 “agentic” proof |
| S06 citation + human gate | Reg 16C trust core |
| S07 change-impact climax | Signature memorable metric |
| S09 RegTech + SupTech split | Answers “why SEBI cares” |
| S10 sandbox packaging ask | Aligns to real prize |
| Navy/teal + Sora/IBM Plex | Trust palette; anti-purple |
| Decision-support disclaimer | Liability posture |

### 5.2 Add (high priority)

| Addition | Where | Exact craft |
| --- | --- | --- |
| **OnFinance-honest wedge line** | S04 *or* thin band on S09 | One sentence: *Enterprise ComplianceOS exists for large BFSI — RegOS wedges lean Small/Mid brokers with inspectable HITL.* Do **not** add a full competitor logo slide unless Q&A appendix. |
| **Reg 16C as why-now chip** | Strengthen on S09 (already present) + optional micro-chip on S06 | Make “accountable for AI outputs” impossible to miss |
| **Labeled synthetic evidence** | S04 pills / S08 | Keep “Synthetic broker evidence (labeled)” visible — integrity signal |
| **Applicability filter callout** | S05 Mapper subcopy or S04 | One gloss: *filters to this RE tier* |
| **AI action log** | S06 trust row or S10 pack | Word that inspectors can replay agent→human decisions |
| **Model card** | S10 checklist (already adjacent) | Keep explicit; pairs with Reg 16C |
| **Corpus trio always named** | S08 | Stock Broker MC · CSCRF (+FAQ) · SCORES↔ODR |
| **Paused-frame QA pass** | All signature slides | Export stills of A–E; stranger test |

### 5.3 Cut (or demote to VO / appendix)

| Cut candidate | Why |
| --- | --- |
| Any TAM / “$XB market” slide if it creeps in | Wrong prize function |
| Team credentials collage | Unless a judge round requires it |
| Pricing SKUs on idea deck | Belongs in L6 / mentor appendix, not S01–S10 |
| Second architecture diagram beyond 5-agent rail | Cognitive maze |
| Extra transitions / particle effects | Hale distraction; trust > flash |
| Duplicate “we’re agentic” claims across S04+S05+S01 | One hard proof (S05) is enough; others should advance story |
| Unsourced 95% chip if it can’t be footnoted cleanly | Prefer PS-language pain over fragile stats — or keep footer mandatory |

### 5.4 Rewrite (slide-by-slide)

| Slide | Rewrite guidance |
| --- | --- |
| **S01** | Keep brand-first. Ensure one-liner stays operational (`Circulars → cited obligations → audit-ready action`). Avoid “first/only.” Sub: intermediaries, not “AI platform.” |
| **S02** | Keep pain concrete. If retaining `95%` chip, **never** orphan the source footer. Prefer “weeks of lag” as the emotional number if survey framing is contested. |
| **S03** | Lock copy. Verdict must stay: *Chat answers. RegOS operationalizes.* Do not soften into “we also do chat.” |
| **S04** | Insert honest category sentence (enterprise exists / our wedge). Carousel words stay trust verbs: clause-cited · confidence-scored · human-approved · audit-ready. |
| **S05** | Title already excellent. Ensure “One human gate each” remains the headline idea — not model names or vendor LLM brands. |
| **S06** | Title *Nothing is taken on faith* is strong. Add Reg 16C micro-context in support line if space: accountability for outputs. Keep legal-advice disclaimer. |
| **S07** | Protect weeks→minutes as the only climax. Diffs should look operational (+obligations, ~controls, →tasks, gaps) — not “AI confidence 99%.” |
| **S08** | Rewrite any absolute accuracy claims to **method-scoped** metrics. Title *Built to be measured — not merely demoed* is correct posture vs fake traction. |
| **S09** | Lead with dual value. Continuity `2025 Member Compliance Monitoring → 2026 Agentic Compliance` is good institutional memory. Make Reg 16C chip high-contrast. Add one honest-wedge clause if not on S04. |
| **S10** | Ask = path, not money. Checklist must include HITL policy (Reg 16C-ready), model card, DPDP statement, preserve KYC/AML/investor safeguards. Close on sandbox-ready operational action. |

### 5.5 Suggested microcopy patches (drop-in)

**S04 honesty band (add):**

```text
Enterprise agentic compliance exists for large BFSI.
RegOS is the inspectable layer for lean SEBI stock brokers.
```

**S06 support (optional tighten):**

```text
Every obligation points to a verbatim source span —
and waits for a human gate (Reg 16C-ready).
```

**S09 wedge (if S04 stays pure product):**

```text
Not “first.” Sandbox-ready for Small/Mid REs that enterprise tools don’t demo.
```

**S10 ask body (keep spirit, sharpen):**

```text
Pilot path: one broker → industry body → MII.
Plus anonymized SupTech readiness for SEBI — with a Reg 16C HITL pack.
```

### 5.6 Motion refinement (from VISUAL_DIRECTION_PICK + Hale)

| Do | Don’t |
| --- | --- |
| Fluid teal/emerald blob **behind** type | Purple grain, neon bloom |
| SVG stroke-draw for citation links / agent connectors | Random decorative loops |
| Spring pop on icons/nodes | Continuous bouncing chrome |
| Single wipe into S07 | Transition showcase |
| Still-readable mid-animation titles | Rely on motion to carry the claim |

### 5.7 Mapping VC lessons → RegOS without cargo-cult

| Borrow from VC craft | Leave behind |
| --- | --- |
| Sequoia: one declarative purpose sentence | Sequoia: TAM theater |
| YC Hale: legible / simple / obvious | YC: traction ARR as centerpiece |
| YC Seibel: unique insight + clear ask | YC: market-size debate as core |
| a16z: lossy compression; anti-wrapper | a16z: “10× disrupt” swagger at regulator |
| DocSend: one point per slide; trailer not film | DocSend: fundraise appendix culture |

**RegOS unique insight (earned secret to land verbally even if not a full slide):**

> Lean broker compliance fails at the *hand-translation* step under circular churn — and Reg 16C makes un-cited AI a liability. The winning system is not a smarter chatbot; it is an **inspectable obligation graph with human gates and a change-impact simulator**.

### 5.8 Final refinement checklist (ship gate)

- [ ] No “first / only / never been done” language anywhere (deck, VO, form fields)  
- [ ] OnFinance-honest wedge appears once, clearly  
- [ ] Reg 16C visible without requiring Q&A  
- [ ] S03 / S06 / S07 still frames pass stranger test  
- [ ] All metrics method-scoped  
- [ ] Synthetic data labeled  
- [ ] Sandbox pack named on S10  
- [ ] Zero purple / zero robot mascot / zero TAM vanity  
- [ ] Demo video claims ⊆ deck claims (no supersets)  
- [ ] PS2 tag visible in chrome every slide  

---

## 6. Source bibliography

### Primary / near-primary

| Source | URL | Used for |
| --- | --- | --- |
| Sequoia — Writing a Business Plan | https://sequoiacap.com/article/writing-a-business-plan/ | Canonical VC section spine |
| YC — How to design a better pitch deck (Kevin Hale) | https://www.ycombinator.com/library/4T-how-to-design-a-better-pitch-deck | Legible/simple/obvious; anti-animation; one idea |
| YC — How to build your seed round pitch deck (Aaron Harris) | https://www.ycombinator.com/library/2u-how-to-build-your-seed-round-pitch-deck | Seed slide sets; concision |
| YC — How to Pitch Your Company (Michael Seibel) | https://www.ycombinator.com/blog/how-to-pitch-your-company | Seven questions; anti-jargon |
| DocSend — Deck design guidelines | https://www.docsend.com/blog/deck-design-guidelines-how-to-strengthen-your-pitch-with-design/ | Trailer metaphor; one point/slide |
| DocSend — 4 mistakes to avoid | https://www.docsend.com/blog/4-mistakes-to-avoid-in-your-startup-fundraising-pitch-deck/ | Over/under-information |
| SEBI TechSprint GFF 2026 coverage | https://money.rediff.com/news/market/sebi-launches-securities-market-techsprint-at-gff-2026/49281020260622 | PS themes; sandbox mentorship prize |
| CorpLawUpdates — TechSprint summary | https://www.corplawupdates.in/updates/sebi-securities-market-techsprint-gff-2026 | Problem statements; sandbox path |
| SEBI Innovation Sandbox portal | https://innovation-sandbox.in/ | Sandbox framing |
| Regulatory Sandbox SOP summaries | https://taxguru.in/sebi/sebi-issues-sop-revised-framework-regulatory-sandbox.html | Evaluation culture: need-to-test, risk, benefits |

### Secondary / interpretive

| Source | URL | Used for |
| --- | --- | --- |
| VentureMage — Sequoia template what works | https://venturemage.com/sequoia-pitch-deck-template | How Sequoia post became “the template” |
| Ink Narrates — a16z guidelines | https://www.inknarrates.com/post/andreessen-horowitz-pitch-deck-guidelines | a16z-shaped slide jobs (non-official) |
| MDPI — RegTech & SupTech governance review | https://www.mdpi.com/2227-7072/13/4/217 | Academic RegTech/SupTech framing |
| HITL in regulated workflows | https://www.codebridge.tech/articles/human-in-the-loop-ai-where-to-place-approval-override-and-audit-controls-in-regulated-workflows | Approval/audit control design |

### Internal RegOS corpus (this repo)

| File | Role |
| --- | --- |
| `phase1/L3_deck_storyboard.md` | Locked 10-slide storyboard + visual system |
| `phase1/L1_competitive_delta.md` | OnFinance-honest wedge; no-first rule |
| `phase1/L6_business_sandbox.md` | Commercial + sandbox packaging |
| `phase1/PHASE1_GATE.md` | Non-negotiables |
| `phase1/VISUAL_DIRECTION_PICK.md` | Navy/teal fluid direction |
| `regos-motion/src/remotion/IdeaDeck.tsx` | Implemented composition wiring |

---

## 7. One-page craft creed (pin above the Remotion preview)

1. **Trust > theater.**  
2. **One idea per slide; one climax in the deck (weeks→minutes).**  
3. **Cite or don’t claim.**  
4. **HITL is product, not apology.**  
5. **Enterprise peers prove the market; they do not own the small-RE sandbox lane.**  
6. **Ask for a path SEBI can mentor — not a valuation.**  
7. **If it looks like ChatGPT with a SEBI PDF, you already lost.**

---

*End of memo — use as the refinement brief for `RegOSIdeaDeck` Phase 3 polish.*
