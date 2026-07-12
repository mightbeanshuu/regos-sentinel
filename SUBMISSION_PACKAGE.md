# RegOS Sentinel — Round-01 Submission Package

> **Event:** SEBI Securities Market TechSprint @ GFF 2026 (HackCulture)  
> **Problem Statement:** Agentic Compliance From Regulatory Text to Operational Action  
> **Due:** **Saturday, Jul 12, 2026** (Round-01 idea submission)  
> **Phase 1 Gate:** PASSED · paste blocks locked from L2 / L5 / L6 / PHASE1_GATE  
> **Generated:** 2026-07-10

---

## Jul 12 submit checklist

| # | Action | Status |
| --- | --- | --- |
| 1 | Replace `[TEAM_NAME]` and all member/org placeholders (§4) | ☐ |
| 2 | Paste **Theme** → **Problem Statement** → **Project Title** → **Team** | ☐ |
| 3 | Paste **Brief description** — use LONG (§5); fall back to SHORT if char-limited | ☐ |
| 4 | Paste **Business model** — use LONG (§6); fall back to SHORT if char-limited | ☐ |
| 5 | Paste **Technology stack** (§7) and **Process flow** (§8) | ☐ |
| 6 | Build idea deck from §9 slide contract → upload PDF | ☐ |
| 7 | Render and publish the 112-second Round-01 pitch/prototype-visualization film; paste the accessible video URL (§10) | ☐ |
| 8 | GitHub URL: leave placeholder or blank until repo is public (§11) | ☐ |
| 9 | Self-audit: no “first / only agentic” language anywhere | ☐ |
| 10 | Self-audit: Reg 16C + OnFinance-honest wedge present in brief + commercial | ☐ |
| 11 | Self-audit: no invented URLs, customers, revenue, or live-trading / PII claims | ☐ |

**Framing locks (non-negotiable):**
- Sandbox-ready > demo-only
- Preserve KYC / AML / investor-protection safeguards — never bypass
- 2025 Member Compliance Monitoring → 2026 Agentic Compliance continuity
- Cited obligation graph + change-impact simulator ≠ generic RAG chatbot
- **Never** claim “first / only agentic compliance” — OnFinance ComplianceOS validates the category; RegOS wedges small-RE / sandbox-inspectable / clause-cited + HITL

**Paste order:** §1 → §2 → §3 → §4 → §5 → §6 → §7 → §8 → upload deck (§9) → video (§10) → GitHub (§11)

---

## 1. Theme

**PRIMARY (paste):**

```text
SEBI Securities Market TechSprint
```

---

## 2. Problem Statement

**PRIMARY (paste):**

```text
Agentic Compliance From Regulatory Text to Operational Action
```

---

## 3. Project Title

**PRIMARY (paste):**

```text
RegOS Sentinel — Agentic Compliance OS from SEBI Circulars to Audit-Ready Action
```

**ALT (if title field is short ~60–80 chars):**

```text
RegOS Sentinel: Circulars → Cited Obligations → Audit Action
```

---

## 4. Team Members — Name & Organization (if any)

**PRIMARY (paste — replace placeholders):**

```text
[TEAM_NAME]
1. Anshu — [ORG / College / Independent] (Lead — Product, AI/Agents, Full-stack)
[Add member 2: Name — Organization / Role]
[Add member 3: Name — Organization / Role]
[Add member 4–5 if applicable]
```

**MINIMAL solo-ready:**

```text
[TEAM_NAME]
Anshu — [ORG / College / Independent]
```

> Leave organization blank or write "Independent" / college name only if true. Do not invent co-founders or affiliations.

---

## 5. Brief description of the idea

> Use **LONG** if the form allows (~2,000 chars). Fall back to **SHORT** (~1,050 chars) or **Ultra-short** (~480 chars) if rejected.

### PRIMARY LONG (paste):

```text
Problem. SEBI’s regulatory framework is continuous and text-heavy. Circulars, master circulars, and guidelines create two linked gaps for intermediaries: (1) dynamic regulatory translation — interpreting a new/amended requirement, mapping it to processes, and updating workflows consistently; and (2) ongoing compliance management — tracking obligations, linking evidence, maintaining audit trails, and closing gaps before they become findings. Both fail for the same root cause named in PS2: regulation is unstructured human-readable text, while operational systems need structured, auditable rules. Manual, circular-by-circular interpretation produces delayed and uneven implementation — especially at small stock brokers with lean compliance teams. SEBI Investor Survey 2025 shows intermediaries cite complexity/information gaps at 95%; complaint patterns (platform issues, mis-selling, poor response, grievance delays) are operational-compliance failures.

Solution. RegOS Sentinel is an agentic compliance operating layer — not a chatbot. Five supervised agents convert real public SEBI documents into a cited obligation graph and evidence workflow: Watcher (new/amended circular detection), Interpreter (schema-constrained extraction: actor, action, condition, deadline, evidence, applicability, citation, confidence), Mapper (controls/owners/tasks), Evidence (SLA tasks + proof upload), Auditor (audit pack + risk heatmap). A deterministic Verification layer grounds every obligation against a verbatim source span before mapping. Human gates, retrieval grounding to verbatim clauses, and a labeled extraction benchmark address hallucination risk. Signature capability: a change-impact simulator that shows which controls/tasks move when a new circular lands — weeks of manual impact analysis compressed to minutes. Supporting spine: a graduated autonomy dial (suggest → draft → act-with-approval) so agent authority is explicit and Reg 16C-defensible; a tamper-evident hash-chained AI action log any inspector can verify; a Reg-Diff supersession view timed to SEBI's 2026 master-circular rewrite; and DPI hooks — DigiLocker-verifiable evidence and Bhashini-route multilingual obligation briefs for lean broker teams.

Why now / SEBI mandate. PS2 is the AI-era continuation of 2025’s Member Compliance Monitoring track. SEBI Reg 16C (2025) makes intermediaries solely accountable for AI/ML output accuracy, data integrity, and legal compliance — whether tools are in-house or third-party. RegOS is designed for that liability regime: human approval gates, clause-level provenance, AI action audit logs, confidence routing, model card / risk register / DPDP / HITL policy. It preserves investor-protection, KYC, and AML safeguards rather than bypassing them. Packaged as Innovation-Sandbox-ready: public corpus + synthetic evidence, 90-day broker→MII pilot path, anonymized SupTech readiness view. Enterprise RegTech (Corlytics/Ascent; OnFinance ComplianceOS in India BFSI) validates the category — we do not claim to invent it. RegOS wedges underserved small/mid stock brokers with a transparent, sandbox-inspectable, CSCRF-first architecture judges and SEBI can inspect.
```

### SHORT fallback (if char-limited):

```text
RegOS Sentinel is a supervised agentic compliance OS for SEBI-regulated intermediaries. It turns unstructured SEBI circulars into clause-cited, machine-actionable obligations, maps them to owners/controls/deadlines, generates evidence workflows, and exports an audit-ready proof pack — every AI output human-approved, every line traceable to a verbatim source clause, every agent step logged for audit.

Today, lean compliance teams at small stock brokers translate each circular by hand. Implementation is slow, uneven, and hard to audit. Under SEBI’s Intermediaries (Amendment) Regulations, 2025 (Reg 16C), regulated entities remain solely responsible for AI/ML outputs — so RegOS is built as decision-support with mandatory human gates, retrieval-grounded citations, confidence thresholds, and a model card — not autonomous legal advice. Five narrow agents (Watcher → Interpreter → Mapper → Evidence → Auditor) plus a change-impact simulator collapse circular-to-action from weeks to minutes.

MVP corpus (public): Stock Broker Master Circular (Jun 2025), CSCRF (Aug 2024 + FAQ), SCORES↔ODR (Sep 2023). Evidence is synthetic and labeled; no PII. Preserves KYC/AML/investor-protection safeguards. Sandbox-ready: public corpus → broker/MII pilot → anonymized SupTech readiness view. Enterprise RegTech validates the category; RegOS wedges the underserved small-RE segment with an inspectable, citation-first architecture.
```

### Ultra-short emergency fallback (~480 chars):

```text
RegOS Sentinel turns SEBI circulars into clause-cited obligations, human-approved evidence workflows, and audit packs for small stock brokers — collapsing circular-to-action from weeks to minutes. Five supervised agents (Watcher→Interpreter→Mapper→Evidence→Auditor) run on public CSCRF + Stock Broker Master Circular + SCORES/ODR; synthetic evidence; no PII. Decision-support only; preserves KYC/AML/investor-protection safeguards. Sandbox-ready path: broker pilot → MII → anonymized SupTech readiness view.
```

---

## 6. Proposed solution — Business model / commercial potential

> Prefer **LONG** (L6 Reg 16C version). Fall back to **SHORT** if char-limited.

### PRIMARY LONG (paste):

```text
Market need. Every SEBI circular forces intermediaries to re-interpret obligations, re-assign owners, refresh evidence, and prove audit readiness. Lean teams at small stock brokers absorb this cost manually; uneven implementation creates investor-protection and supervision risk. SEBI Reg 16C (2025) raises the bar further: REs are solely responsible for AI/ML outputs used in compliance — so buyers need tools with citations, human gates, and auditable AI action logs, not black-box chat. Enterprise RegTech (Corlytics/Ascent globally; OnFinance ComplianceOS in India BFSI) proves willingness to pay and validates the category — we do not claim to invent it. Those products are enterprise-priced and oriented to large BFSI; RegOS wedges underserved small/mid stock brokers with a transparent, sandbox-inspectable, CSCRF-first architecture.

Customer & wedge. Primary buyer: compliance officer / CISO at small–mid stock brokers (corpus: Stock Broker Master Circular + CSCRF + SCORES/ODR). Secondary: industry bodies / MIIs seeking consistent member readiness. Tertiary (SupTech): anonymized aggregate readiness for SEBI/MII — synthetic/anonymized only in prototype.

Business model.
1) SaaS subscription per regulated entity (tiers by corpus pack + seats + evidence storage) — AI-accountability-ready OS: cited graph + HITL + AI action audit log + audit export + model card.
2) Implementation / corpus-onboarding fee for first circular set and process mapping.
3) Optional benchmark & assurance add-on (labeled-obligation QA, model-card refresh).
4) Optional per-circular surge when a major master circular / CSCRF-class update lands.
5) Later: connector pack (Jira/ServiceNow/email), DigiLocker evidence verification (DPI), MII/multi-member license + SupTech dashboard.

Go-to-market. (a) Hackathon prototype on public SEBI docs + synthetic evidence; (b) SEBI Innovation Sandbox testing with published KPIs and no live-trading / no PII risk; (c) 90-day single-broker or industry-body pilot; (d) expand intermediary classes using the same obligation schema; (e) regulator-facing readiness analytics without bypassing KYC/AML/investor-protection rules.

Commercial potential. Value metric = weeks→minutes circular-to-action, higher citation/audit completeness, fewer inspection findings, and Reg 16C-aligned AI governance artifacts buyers can show an inspector. Pricing can track compliance FTE time saved + audit-pack production cost. Scalability is schema-led (new circulars and intermediary types reuse the same graph), not headcount-led. This is a durable RegTech/SupTech layer SEBI can mentor into production — the real prize beyond cash awards. We do not out-feature funded peers; we win the small-RE / inspectable / sandbox-ready lane.
```

### SHORT fallback (if char-limited):

```text
Wedge: underserved small/mid stock-broker compliance teams that face circular churn, CSCRF evidence burden, and audit exposure — and now Reg 16C AI-output liability — without enterprise RegTech budgets (Corlytics/Ascent/OnFinance-class).

Model: B2B SaaS sold as an AI-accountability-ready compliance OS — per-entity subscription (cited obligation graph + HITL gates + evidence workflow + AI action audit log + audit export + model card), plus optional corpus onboarding / labeled-obligation QA. Expansion: IAs, RTAs, AMCs via corpus-agnostic schema; MII multi-member licenses; anonymized SupTech readiness dashboards (no raw PII).

Commercial path: TechSprint → SEBI Innovation Sandbox mentorship → 90-day broker/industry-body pilot (KPIs: time-to-plan, citation coverage, evidence completeness, human-approval rate) → paid pilots → annual SaaS. Category WTP is proven; our white-space is small-RE, sandbox-inspectable, SEBI-corpus-first — not “first agentic.” Revenue = efficiency + audit readiness + Reg 16C-aligned adoption — not legal advice, not a safeguard bypass.
```

---

## 7. Technology stack details

> Source: L5 §3 (preferred over L2 — includes Verification layer, LLMProvider abstraction, LangGraph orchestration).

### PRIMARY (paste):

```text
Technology stack — RegOS Sentinel

Frontend: Next.js (App Router), React, Tailwind CSS, shadcn/ui — Compliance Cockpit with split-pane source viewer, obligation table, Kanban workflow, evidence locker, change-impact simulator, and audit export.

Backend: Python FastAPI exposing ingest / compile / map / evidence / audit / simulate APIs.

Agents: LangGraph (or equivalent explicit state machine) orchestrating five supervised agents — Watcher, Interpreter, Mapper, Evidence, Auditor — with a deterministic Verification layer between Interpreter and Mapper (retrieval grounding, Pydantic validation, contradiction/supersession checks, human review queue for low-confidence items). Replayable step logs and human approval gates on every publish path.

AI/NLP: Schema-constrained LLM extraction (strict JSON / tool-calling) + pgvector retrieval grounding so every displayed obligation cites a verbatim source span; hybrid rules+classifier for applicability (e.g., CSCRF small-size RE); confidence scoring and contradiction/supersession checks.

LLM policy: Claude API (hackathon default) behind a provider abstraction (LLMProvider interface) so the same pipeline can swap to OpenAI, Azure OpenAI, or open-weight/on-prem (Ollama/vLLM) if organizers restrict hosted models — no business logic couples to one vendor.

Data: PostgreSQL for obligations, tasks, evidence, audit logs; pgvector for clause embeddings; local/S3-compatible object store for evidence files; optional Neo4j view for the compliance graph.

Parsing: Firecrawl + pdfplumber for SEBI HTML/PDF; pluggable parser interface.

Validation: Pydantic models + JSON Schema + citation-coverage tests; labeled 50–100 obligation benchmark (precision/recall/citation accuracy).

Auth / trust: Role-based access (Compliance Officer, CISO, Management, Regulator-view); full agent+human audit trail; model card, risk register, DPDP-aligned data-minimization (public corpus + synthetic intermediary data only).

Deploy: Docker Compose for reproducible demo; Vercel (web) + Render/Fly (API+DB); offline seeded fallback for jury reliability.

Trust ledger: SHA-256 hash-chained AI action log + audit-pack manifest (Merkle root printed on every exported pack; optional public-chain anchoring later) — tamper-evident audit trail without putting any data on-chain.

Stretch DPI: DigiLocker-style evidence verification mock + Bhashini-route multilingual obligation briefs (Hindi first) for rubric coverage — not required for MVP.

Why this stack: matches PS2’s “agentic” requirement with a real multi-agent workflow (not chat-RAG); NLP + retrieval for verifiable extraction; AI/ML for applicability and change impact; DPI-ready evidence path; feasible for a narrow MVP and scalable via corpus-agnostic obligation.v1 schemas.
```

---

## 8. Process flow / architecture

> Source: L5 §1.1 + §1.2 (preferred — Verification as first-class layer, explicit human gates).

### PRIMARY (paste):

```text
RegOS Sentinel is a supervised five-agent compliance pipeline. A Watcher monitors SEBI circular pages (or loads a curated corpus pack) and emits change events with document metadata. An Ingestion layer parses HTML/PDF into clause- and table-aware chunks with title, date, circular number, and source URL. An Interpreter agent performs schema-constrained LLM extraction of obligations (actor, action, condition, deadline/frequency, evidence required, applicability, citation span, confidence). A deterministic Verification layer grounds every obligation against a retrieved verbatim source span, runs Pydantic/JSON-Schema validation, and flags contradictions or supersessions; low-confidence items route to a human review queue. A Mapper agent applies the intermediary profile (stock broker · small-size / qualified RE) to filter applicability and maps Regulation → Obligation → Control → Process → Owner → Evidence into a compliance graph with workflow status. An Evidence agent generates owner/SLA tasks, accepts evidence uploads (synthetic in MVP; DigiLocker verify as stretch), and updates the evidence graph. An Auditor agent assembles dashboards, a management risk heatmap, and an exportable audit pack (PDF/HTML) with clause citations and human approval logs. A Change-Impact Simulator diffs a new circular against the current graph to show impacted obligations, controls, owners, tasks, and evidence — weeks of manual interpretation compressed to minutes.

END-TO-END FLOW

1) INGEST (Watcher) — SEBI public pages/PDFs (Stock Broker Master Circular, CSCRF + FAQ, SCORES↔ODR) → poll/diff for new or amended circulars → clause/table chunking + metadata.

2) INTERPRET (Interpreter) — Schema-constrained extraction → Obligation objects: actor | action | condition | deadline | evidence_required | applicability | source_clause | confidence → every obligation bound to a verbatim source span.

3) VERIFY — Retrieval grounding vs source · contradiction/supersession checks · Pydantic validation → low confidence / conflicts → human review queue (no silent auto-approve).

4) MAP (Mapper) — Compliance graph: Regulation → Obligation → Control → Process → Owner → Evidence → entity profile filter (e.g., Small Stock Broker / small-size RE) → generate tasks with owners, deadlines, severity.

5) EVIDENCE — Kanban states: Not Started → Assigned → Evidence Pending → Under Review → Approved / Exception → upload synthetic proof → reviewer sign-off logged.

6) AUDIT & SUPERVISE (Auditor) — Export audit pack (PDF/HTML): citations, evidence, approvals, gaps, disclaimers — each pack sealed with a hash-chained manifest (tamper-evident) → management risk heatmap → optional anonymized SupTech aggregate readiness view (synthetic).

7) CHANGE-IMPACT SIMULATOR — New circular drop → diff vs current graph → impacted obligations/controls/owners/tasks/evidence → time-to-plan measured in minutes.

SAFEGUARDS (non-negotiable)
- Graduated autonomy dial: agents suggest → draft → act only behind explicit human approval; authority level logged per action
- Decision-support only; not legal advice; compliance officer remains accountable under SEBI Reg 16C
- Preserves KYC / AML / investor-protection obligations — never bypasses them
- No live trading; no real customer PII in prototype
- Sandbox-ready: published KPIs, security posture, 90-day pilot plan
```

**ASCII diagram (optional second paste / deck slide):**

```text
SEBI public sources (HTML pages + PDF attachments + FAQ PDF)
           │
           │  [1] WATCHER — poll / pack-load · detect new/amended docs
           ▼
  ┌──────────────────── INGESTION ────────────────────┐
  │  Firecrawl / pdfplumber  ·  clause+table chunking │
  └────────────────────────┬──────────────────────────┘
                           ▼
  ┌──────────────────── INTERPRETER ──────────────────┐
  │  schema-constrained LLM extraction (strict JSON)  │
  └────────────────────────┬──────────────────────────┘
                           ▼
  ┌──────────────────── VERIFICATION ─────────────────┐
  │  retrieval grounding · Pydantic · human queue     │
  └────────────────────────┬──────────────────────────┘
                           ▼
  ┌──────── MAPPER ────────┐
  │ entity profile filter  │
  │ Reg→Obl→Ctrl→Owner→Ev  │
  └───────────┬────────────┘
              ▼
  ┌──────── EVIDENCE AGENT ────────┐
  │ task gen · SLA · uploads       │
  └───────────┬────────────────────┘
              ▼
  ┌────────── AUDITOR ─────────────┐
  │ audit pack · heatmap · SupTech │
  └───────────┬────────────────────┘
              ▼
     Human sign-off · Change-Impact Simulator
```

**MVP regulatory corpus (public SEBI documents only):**
1. Master Circular for Stock Brokers dated June 17, 2025 (`SEBI/HO/MIRSD/MIRSD-PoD/P/CIR/2025/90`) — https://www.sebi.gov.in/legal/master-circulars/jun-2025/master-circular-for-stock-brokers_94623.html
2. Cybersecurity and Cyber Resilience Framework (CSCRF) for SEBI Regulated Entities dated August 20, 2024 (`SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2024/113`) — https://www.sebi.gov.in/legal/circulars/aug-2024/cybersecurity-and-cyber-resilience-framework-cscrf-for-sebi-regulated-entities-res-_85964.html
3. FAQs on CSCRF and Cloud Framework dated June 11, 2025 — https://www.sebi.gov.in/sebi_data/faqfiles/jun-2025/1749647139924.pdf
4. SCORES Platform redressal and linkage to ODR dated September 20, 2023 (`SEBI/HO/OIAE/IGRD/CIR/P/2023/156`) — https://www.sebi.gov.in/legal/circulars/sep-2023/redressal-of-investor-grievances-through-the-sebi-complaint-redressal-scores-platform-and-linking-it-to-online-dispute-resolution-platform_77159.html

Intermediary data and evidence artifacts in the prototype are synthetic. No personal data / no non-public SEBI data.

---

## 9. Upload idea deck

> Round-01 asks for an idea deck upload. Build the deck from this contract; upload when ready.

**Filename suggestion:** `RegOS_Sentinel_SEBI_TechSprint_2026_Idea_Deck.pdf`

**Status for form:**

```text
[DECK_TO_BE_UPLOADED — build from slide contract below]
```

**Required slide list (8–10 slides):**

| # | Slide | Must include |
| --- | --- | --- |
| 1 | Title | RegOS Sentinel · PS2 title · team placeholder · “Sandbox-ready agentic compliance” |
| 2 | Problem | Unstructured circulars vs structured compliance need; small-broker pain; Survey 2025 complexity 95% |
| 3 | Why now | 2025 Member Compliance Monitoring → 2026 Agentic Compliance; SEBI Reg 16C AI-output liability; preserve-safeguards; category peers exist — wedge is small-RE + inspectable trust |
| 4 | Solution | Five agents + Verification layer; cited obligation graph; evidence workflow; audit pack; “not a chatbot” contrast |
| 5 | Architecture | Process-flow diagram from §8 |
| 6 | Demo storyboard | Entity select → CSCRF extract → cite+approve → plan → evidence → **change-impact climax** → audit export + SupTech |
| 7 | Tech stack | Stack from §7 + trust artifacts (model card, DPDP, human-in-loop, hash-chained action log, autonomy dial) |
| 8 | Feasibility & MVP | Narrow scope: brokers + 4 public corpora + synthetic evidence; Aug 9 video path |
| 9 | Market & commercial | Wedge, SaaS, sandbox→pilot→MII; OnFinance-honest near-peer table; no fake revenue claims |
| 10 | Ask / sandbox path | 90-day pilot KPIs; Innovation Sandbox mentorship; no safeguard exemption |

**Deck must NOT:** claim live broker PII; claim autonomous legal advice; invent customers/revenue; claim “first agentic”; show fake GitHub/video links as live.

---

## 10. Demo video link (max 3 min)

**URL field (paste until real link exists):**

```text
[DEMO_VIDEO_URL_PLACEHOLDER — max 3:00; upload when recorded]
```

### 3-minute script summary (record by Aug 9 prototype round)

| Time | Beat | On screen / narration |
| --- | --- | --- |
| 0:00–0:25 | Problem | “SEBI circulars are text; compliance needs owners, deadlines, evidence, audit trails. Small brokers do this by hand — slow and uneven.” |
| 0:25–0:45 | Setup | Select **Small Stock Broker**; show corpus: CSCRF + Stock Broker MC + SCORES/ODR. |
| 0:45–1:20 | Agentic extract | Watcher/Interpreter → obligation register; click one row → **highlighted source clause + confidence + human review**. “Not chat — a cited compiler.” |
| 1:20–1:50 | Operational action | Generate compliance plan → tasks to CISO/Compliance/Ops/Grievance; upload synthetic evidence; status moves to Approved. |
| 1:50–2:25 | **Climax** | **Simulate New Circular** → live diff of impacted controls/tasks. “Weeks → minutes.” |
| 2:25–2:50 | Close loop | Export audit pack (citations + approvals + gaps); flash SupTech anonymized readiness; metrics: citation coverage 100% of displayed, time-to-plan. |
| 2:50–3:00 | Sandbox ask | “Decision-support only; preserves KYC/AML/investor safeguards. Ready for SEBI Innovation Sandbox: public corpus → broker/MII pilot.” |

**Recording rules:** ≤3:00 · no PII · label synthetic evidence on screen · show human approval · end with sandbox-ready line.

---

## 11. GitHub repository link (if any)

**URL field (paste until repo is public):**

```text
[GITHUB_REPO_URL_PLACEHOLDER — publish when scaffold is ready; leave blank on form if required to be live]
```

**If the form allows a note instead of URL:**

```text
Repository will be published with the prototype (web/, services/api/agents, corpus, seed, docs). Link to be added before Round-02 / solution video.
```

---

## Judge-criteria self-audit

| Criterion | Where covered |
| --- | --- |
| **Market Impact** | §5 problem stats + small-broker uneven implementation; §6 wedge + time/audit value |
| **Technology Stack** | §7 agentic NLP/LLM/retrieval/DPI stretch; §8 five-agent + Verification flow |
| **Feasibility** | Narrow MVP corpus; synthetic evidence; Docker/offline; human-in-loop; provider abstraction |
| **Scalability** | Corpus-agnostic obligation.v1 schema; IA/RTA/AMC expansion; MII multi-member + SupTech |
| **SEBI Mandate** | Investor protection via better intermediary compliance; supervision via SupTech view; preserve KYC/AML; sandbox path; 2025→2026 continuity |

---

## Tokens to replace before final submit

| Token | Replace with |
| --- | --- |
| `[TEAM_NAME]` | Actual team name |
| `Anshu — [ORG / College / Independent]` | Real affiliation |
| `[Add member …]` | Real teammates or delete lines |
| `[DEMO_VIDEO_URL_PLACEHOLDER …]` | Real ≤3 min link, or leave blank |
| `[GITHUB_REPO_URL_PLACEHOLDER …]` | Real repo URL, or leave blank |
| `[DECK_TO_BE_UPLOADED …]` | Actual PDF upload |

---

## Novelty wedge (internal reference — do not paste verbatim unless asked)

> Enterprise agentic compliance already exists — OnFinance ComplianceOS for large BFSI, Corlytics/ClauseMatch for global Tier-1 banks. That proves the category.  
> RegOS Sentinel is built for the segment those tools don’t serve in a TechSprint-visible way: **SEBI’s lean stock brokers (Small / Mid-size REs)** who still translate the Stock Broker Master Circular, CSCRF, and SCORES↔ODR by hand.  
> We ship what a regulator can *inspect* and a sandbox can *mentor*: clause-cited obligation graph, 100% citation coverage on displayed obligations, human approval gates aligned to SEBI Reg 16C AI-output accountability, labeled extraction benchmark, live change-impact simulator (weeks→minutes), and an Innovation-Sandbox readiness pack — open architecture, not a closed enterprise black box.

**Q&A one-liner (“Isn’t this OnFinance?”):**  
> “OnFinance is the enterprise proof the market pays. RegOS is the sandbox-ready small-broker operating layer — cited, human-gated, CSCRF-first, and built so SEBI can see every obligation back to a clause.”

---

*End of Round-01 submission package. Phase 1 Gate PASSED — ready for Jul 12 HackCulture paste.*
