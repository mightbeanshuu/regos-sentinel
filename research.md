# SEBI Securities Market TechSprint @ GFF 2026 — Winning Project Research (v2)

> Rewritten 2026-06-29 with live HackCulture scrape, web/firecrawl deep-dive, a PS-vs-builder-strengths pressure test, and an agentic reframe. Supersedes v1. Final recommendation unchanged in target (PS2) but materially sharpened in framing, differentiation, and build plan.

---

## 1. Executive Summary

**Recommendation: build `RegOS Sentinel` — an *agentic* compliance operating system for Problem Statement 2, "Agentic Compliance From Regulatory Text to Operational Action."**

1. RegOS Sentinel is a **multi-agent system** (Watcher → Interpreter → Mapper → Evidence → Auditor) that turns SEBI circulars into clause-cited, machine-actionable obligations, maps them to an intermediary's controls/owners/deadlines, generates evidence tasks, simulates the impact of new circulars, and exports an audit-ready proof pack — all behind **human approval gates**.
2. The PS title literally says **"Agentic"** — most teams will build a RAG chatbot over circulars. The winning move is an *agentic workflow with verifiable, cited, human-approved outputs*, not "chat with regulations."
3. It maps cleanly to the **official, now-verified rubric**: Market Impact, Technology Stack (AI/ML/NLP/DPI), Feasibility, Scalability, Alignment with SEBI's Mandate.
4. **MVP is deliberately narrow**: stock brokers as the first intermediary, using SEBI's Jun 17 2025 Master Circular for Stock Brokers + Aug 20 2024 CSCRF + Sep 20 2023 SCORES↔ODR circular as the demo corpus. All public docs, all synthetic evidence → buildable before the Aug 9 video deadline.
5. **Three differentiators no student team will have**: (a) a *verifiable obligation compiler* with clause-level provenance + confidence + human sign-off; (b) a *regulatory-change impact simulator* that shrinks circular-to-action from weeks to minutes live; (c) a **regulator-grade trust/readiness pack** (model card, risk register, DPDP statement, human-in-loop policy) — exactly the artifacts Anshu already produced for ParkPulse.
6. **Why this is Anshu's best-fit PS** (pressure-tested in §6.5): it leans on his proven edges — agentic AI orchestration, full-stack shipping, and govt-grade trust documentation — while avoiding PS1's "prove detection accuracy without a dataset" trap and PS3's "needs live broker integrations" trap.
7. Comparable winners confirm the pattern: **MAS SFF 2025 winner *ActuaViz*** converts complex insurance documents into structured machine-readable formats (the closest analog to PS2); **RBI HaRBInger 2024** winners were all narrow, deployable risk/fraud tools. Regulators reward deployability + explainability + systemic-risk reduction.
8. **Pain is quantified**: SEBI Investor Survey 2025 (53,357 respondents) shows intermediaries cite complexity/information gaps at 95%; investor complaints skew to platform issues (47%), mis-selling (41%), poor response (34%), grievance delays (30%) — all operational-compliance failures. CSCRF + SCORES/ODR are evidence-heavy, concrete corpora.
9. **Build stack (Anshu-native)**: Next.js/React + Tailwind/shadcn frontend, Python FastAPI backend, LangGraph-style agent orchestration on Claude API, Postgres + pgvector retrieval, Docker Compose demo, Vercel + Render/Fly for hosting.
10. **Final score after 4 critique loops: 93/100.** Residual risk = legal trust in AI outputs; mitigated by clause-level provenance, confidence thresholds, mandatory human approval, audit logs, and "drafts compliance action, not legal advice" positioning.

---

## 2. Hackathon Ground Truth (verified live, 2026-06-29)

### 2.1 Sources
- **Live page (scraped this session):** https://hackculture.io/hackathons/sebi-securities-market-techsprint
- **Official PS PDFs (user-supplied):** `SEBI PS/problem_explanation_{iu1gmlmfzu,npc5i8hj0r,6koz5boxj0w,ydsky1n18rr}.pdf`
- Page last modified 2026-06-28; event published 2026-06-11.

### 2.2 Event facts (confirmed)
| Item | Ground truth |
| --- | --- |
| Name | Securities Market TechSprint @ GFF 2026 |
| Tagline | Innovation in Action: Shaping Securities Market for Tomorrow |
| Host | SEBI × Global Fintech Fest, powered by HackCulture; "in collaboration with leading market infrastructure institutions and industry bodies" |
| Mode | Hybrid; finals offline |
| Finals venue | Jio World Centre, Mumbai |
| Window | Jun 22, 2026 → Sep 11, 2026 |
| Team size | 1–5 members |
| Prize pool | **₹8L+** (cash awards total ₹6.5L; the "+" covers certificates/benefits — *the v1 "discrepancy" is resolved: it is a pool framing, not an error*) |
| Support | Manvendra, Program Manager — manvendra@hackculture.in |

### 2.3 Timeline (confirmed verbatim from Schedule tab)
| Date | Milestone |
| --- | --- |
| Jun 22 – Jul 12, 2026 | Registration & Team Formation **and** Idea Submission (Round 01, elimination) |
| Jun 29 – Jul 03, 2026 | Problem Statement Deep-Dive **webinars** |
| Jul 13 – Aug 21, 2026 | Prototype Development phase |
| **Aug 9, 2026** | **Detailed solution video due** (hard deadline for shortlisted teams) |
| Aug 17 – Aug 21, 2026 | Demo & Jury Round (prototype demonstration) |
| Sep 09 – Sep 11, 2026 | Final Pitch & Awards at GFF 2026 (offline) |

> Date reconciliation: the screenshot "14 days left" ≈ Jul 12/13 registration close — consistent. v1's Jul 12 deadline is correct.

### 2.4 Official problem statements (exact titles, live page)
| PS | Title | One-line |
| --- | --- | --- |
| 1 | AI-Driven Detection of Synthetic Media and Phishing Attacks in Securities Markets | Detect deepfakes/AI-phishing/synthetic media targeting investors **and** verify official financial communications are genuine. |
| 2 | **Agentic Compliance From Regulatory Text to Operational Action** | Turn SEBI regulatory text into structured, machine-actionable, **auditable** compliance logic for intermediaries. |
| 3 | Super App for Unified Multi-Asset Investing and Awareness for Retail Investors | Consolidate holdings across brokers/depositories; open access to REITs, InvITs, bonds. |
| 4 | Simplifying IPO Offer Document Preparation for SMEs | Help SME promoters generate a disclosure-ready draft offer document; cut cost/time/early intermediary dependence. |

(Full extracted problem + desired-outcome text per PS retained in `.firecrawl/ps-*.md`.)

### 2.5 Evaluation (confirmed verbatim)
**Process:** Round 01 — preliminary application shortlisting · Round 02 — working prototype + demo video · Round 03 — final evaluation at GFF.

**Criteria (no published weights):**
1. **Market Impact** — investor protection, market efficiency, compliance, accessibility.
2. **Technology Stack** — effective use of AI, ML, Blockchain, NLP, DPI, advanced analytics.
3. **Feasibility** — real-world deployability and ease of implementation.
4. **Scalability** — scope, users, transactions, velocity.
5. **Alignment with SEBI's Mandate** — investor protection, market development, supervision.

### 2.6 Rules / constraints (confirmed)
| Rule | Implication |
| --- | --- |
| Must address **one** official PS | Pick PS2 and stay disciplined; other features are supporting context only. |
| Teams 1–5; individuals allowed | Solo-feasible MVP needed (Anshu often builds solo/lead). |
| **Original work, no IP infringement** | Original schemas/code/demo data; cite sources; no scraped proprietary content in the product. |
| Use AI/ML/Blockchain/NLP/DPI encouraged | Lean into agentic AI + NLP + retrieval; DPI angle via DigiLocker evidence verification (stretch). |
| Deliverables before each deadline | Aug 9 video is the make-or-break gate. |
| **Confidentiality, security, data privacy** compliance | Public docs + synthetic data only in demo; DPDP-aligned posture. |
| Practical, scalable, real-world | Narrow MVP + scalable obligation schema. |
| Jury decision final | Optimize for clarity, demoability, regulator trust. |

### 2.7 Eligibility (confirmed)
Startups; students (UG/PG/Doctoral); tech professionals, market researchers, innovators; fintech/regtech/wealthtech/capital-markets teams. **SEBI officials excluded.** → Anshu (student/builder) is eligible.

### 2.8 Remaining open questions for organizers
| Question | Why it matters |
| --- | --- |
| Hosted LLM APIs (Claude/OpenAI) allowed, or open-weight/on-prem required? | Decides architecture + privacy story. Ask in deep-dive webinar (Jun 29–Jul 3). |
| Exact Round-01/02 submission artifacts (deck format, repo, video length/limits)? | Page lists "idea submission" + "solution video" but not file specs. |
| Preferred intermediary category for PS2 (brokers vs IAs vs small REs)? | Stock brokers is our assumption; confirm. |
| Are PCI/NPCI/FCC official backers? | Shown on banner image; page text says "MIIs and industry bodies." Verify before citing in pitch. |
| Will SEBI provide datasets / mentor office hours? | Affects demo realism + benchmark quality. |

---

## 3. Domain Deep-Dive (with sources + stats)

### 3.1 SEBI priorities and quantified pain
- **Retail F&O losses (investor-protection urgency).** SEBI's Sep 23 2024 study: **93% of individual F&O traders incurred losses FY22–FY24; aggregate losses > ₹1.8 lakh crore.** Use as context for *why investor protection / market conduct supervision matters*, not as direct proof of PS2 compliance pain. Source: SEBI F&O press release.
- **SEBI Investor Survey 2025** (listing survey 91,950 households; main survey 53,357 respondents):
  - Product familiarity: MF/ETF 83%, stocks 77%, **REITs/InvITs only 22%**, AIFs 33% → supports PS3 *and* shows market development depends on trusted intermediaries/suitability.
  - Intermediaries cite **complexity & information gaps 95%**, risk/return concerns 94%, trust/transparency 59%.
  - Complaint mix: **technical/platform issues 47%, mis-selling/suitability 41%, poor intermediary response 34%, grievance delays 30%** → all operational-compliance failures PS2 can attack.
- **Finfluencer / synthetic-media fraud (PS1 pain).** SEBI froze **₹18.14 crore** from finfluencer Mohammad Nasiruddin Ansari ("Baap of Chart"); IOSCO 2024 Finfluencers report documents pump-and-dump and retail losses; SEBI's "cut the oxygen supply" diktat targets unregistered finfluencers. GenAI now enables deepfake CEOs, cloned voices, AI-phishing.
- **SME IPO bottleneck (PS4 pain).** FY25 saw **~235–239 SME IPOs raising ~₹9,133 crore** (PRIME Database / Indian Express). Offer-document drafting requires merchant bankers + legal counsel over months; SEBI's Jul 1 2025 guidelines added merchant-banker drafting obligations → real cost/time barrier for lean promoters.
- **CSCRF / cybersecurity.** SEBI's Aug 20 2024 CSCRF + Jun 2025 FAQ impose concrete, evidence-heavy obligations (log inventory/retention, VAPT, SOC efficacy, Market-SOC, cloud accountability, incident handling) — *the best PS2 demo corpus because controls are concrete and audit-friendly.*
- **Grievance redressal.** SEBI's Sep 20 2023 circular links SCORES → ODR with SLA timelines — a perfect demoable compliance scenario (deadlines, escalation, evidence, audit trail).

### 3.2 Active SEBI corpora ideal for a PS2 demo
| Corpus | Date | Why it's good for the demo |
| --- | --- | --- |
| Master Circular for Stock Brokers | Jun 17 2025 | Consolidated broker obligations; PS2 explicitly suggests this corpus. |
| CSCRF for SEBI REs | Aug 20 2024 (+ Jun 2025 FAQ) | Concrete, evidence-heavy cyber controls; size-tiered applicability (great for the applicability classifier demo). |
| SCORES↔ODR linkage | Sep 20 2023 | SLA + escalation + evidence = vivid workflow demo. |
| Master Circular for Investment Advisers | Feb 06 2026 | Optional 2nd intermediary to prove "corpus-agnostic" scalability. |
| Master Circular on Surveillance | May 15 2026 | Stretch corpus for the change-impact simulator. |

### 3.3 India-Stack / ecosystem rails (use selectively)
| Rail | Fit to PS2 | MVP decision |
| --- | --- | --- |
| DigiLocker / verifiable credentials | Verify evidence authenticity (audit reports, board notes) | **Stretch** "DPI" tick for rubric. |
| Account Aggregator (Sahamati) | Consent-based data; more relevant to PS3 | Mention as future consented evidence ingestion only. |
| CKYC/KRA | KYC obligations corpus | Future corpus extension. |
| SEBI/exchange circular feeds | Core ingestion channel | **Core** to the Watcher agent. |
| SCORES/ODR | Complaint SLA obligations | **MVP scenario.** |

---

## 4. Winner Intelligence & Winning Patterns

### 4.1 Comparable events and what won
| Event | Winners / finding | Pattern to steal |
| --- | --- | --- |
| **MAS SFF Global FinTech Hackcelerator 2025** | Winners *ActuaViz, Claimsio, Oxford Risk*; selected on Demo Day from 17 finalists; brief = "market-ready AI financial services." | Market-ready, narrow, operational beats abstract AI. |
| **ActuaViz** (MAS 2025) | Converts complex insurance documentation → structured, machine-readable formats powering comparisons/chatbots/simulations. | **Direct PS2 analog** — document→structured→action wins when demoed concretely. |
| **Claimsio** (MAS 2025) | AI-native debt-collection workflow for SMEs, soft→legal escalation. | End-to-end *workflow* automation > a single model. |
| **Oxford Risk** (MAS 2025) | Behavioral layer (biases, risk tolerance) personalizing advice. | Explainability + human decision augmentation are valued. |
| **RBI HaRBInger 2024** (theme: *Zero Financial Frauds* + *Being Divyang Friendly*) | OneRadar (real-time fraud, FPL); Satark (Epifi) + Tager AI (NapID) for mule accounts; Xaults (CBDC privacy via stealth addresses + ZKP); currency-ID wearables for visually impaired. | Regulators reward **narrow, deployable, systemic-risk-reducing** tools with a crisp live demo. |
| **RBI HaRBInger 2026** (4th ed.) | Bank of Baroda among winners; trust/fraud/CBDC/inclusion themes. | Trust-first fintech keeps winning Indian regulator hackathons. |
| **SFF Global FinTech Hackcelerator (general)** | Requires market-ready solution, live demo video, proposal, pitch deck, alignment to one PS; corporate "champions" map solutions to pilots. | One clean PS + live demo + **pilot path** repeatedly emphasized. |
| **FCA (UK) TechSprints** | Collaborative regulatory innovation; regulatory reporting, registry/supervisory data. | Build something regulators + participants can *test together*. |
| **FINRA RegTech report** | RegTech categories: surveillance/monitoring, KYC/AML, regulatory intelligence, reporting. | Validates PS2 + surveillance themes as globally recognized RegTech. |

### 4.2 Winning patterns (the checklist RegOS must satisfy)
1. **Narrow real problem** — one intermediary, one corpus first.
2. **Structured, not chat** — show obligations, owners, deadlines, evidence, status; not a transcript.
3. **Explainability** — every output cites the clause + shows why the entity is in scope.
4. **Human-in-the-loop** — a regulated system cannot let an LLM silently decide compliance.
5. **Live, fast demo** — circular → tasks → audit pack in < 5 minutes.
6. **Pilot/deployment path** — how a broker / MII / SEBI adopts it safely.
7. **Privacy by design** — public docs + synthetic data; no PII in prototype.
8. **Metrics** — extraction precision/recall, citation coverage, time saved, evidence completeness.
9. **Trust artifacts** — model card, risk register, DPDP posture (rare in student demos = instant credibility).

---

## 5. White-Space Map
| Space | Crowding | Pain | Hackathon fit | Verdict |
| --- | --- | --- | --- | --- |
| Deepfake/phishing detection (PS1) | High (generic detectors everywhere) | High | Hard to prove accuracy w/o dataset | Pivot to **authentication/provenance**, not another detector |
| Verified financial-comms registry (PS1) | Low in securities context | High | Strong, but needs ecosystem adoption | Good finalist idea; adoption risk |
| **Regulatory text → compliance action (PS2)** | Many RAG demos; **few produce auditable obligations + evidence workflow** | **PS2 names it the core unsolved problem** | **Strongest fit** | **Highest win-prob if verifiable + agentic** |
| Multi-asset super app (PS3) | Very high | Real | Needs live integrations in timeline | Hard to demo credibly |
| Suitability engine (PS3) | Moderate | Mis-selling | OK | Less differentiated than PS2 |
| SME IPO full draft generator (PS4) | Low–moderate | Real cost/time | Feasible GenAI drafting | Strong but legal-liability + merchant-banker review complexity |
| SME IPO **gap checker** (PS4) | Low | Useful | Less risky than full draft | Good fallback, narrower impact |
| Compliance **evidence graph** | Low | Small intermediaries struggle w/ audit trails | PS2 | **Core differentiator** |
| Regulatory **change-impact simulator** | Under-solved, demoable | New circulars → delay | PS2 | **Second key differentiator** |
| **SupTech aggregate view** | Rare in demos | Regulators need readiness visibility | PS2 | Strong judge appeal |

---

## 6. Idea Candidates, Scoring Matrix & PS Pressure-Test

### 6.1 Weighted scoring
Weights: Impact 18, Alignment 17, Tech-wow 13, Feasibility 13, Demoability 13, Novelty 10, Judge-appeal 10, Win-prob 6. Totals /100.

| # | Candidate | PS | Imp | Algn | Tech | Feas | Demo | Nov | Judge | Win | **Total** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **RegOS Sentinel (agentic compiler + evidence graph + change simulator)** | 2 | 17 | 17 | 13 | 11 | 12 | 9 | 10 | 6 | **95** |
| 2 | Regulatory Change Impact Simulator for Brokers | 2 | 16 | 17 | 12 | 12 | 12 | 9 | 9 | 6 | 93 |
| 3 | CSCRF Cyber Compliance Mapper | 2 | 15 | 16 | 11 | 12 | 12 | 8 | 9 | 5 | 88 |
| 4 | SEBI Verified-Communications Registry (provenance/C2PA-style) | 1 | 16 | 16 | 12 | 9 | 10 | 9 | 9 | 5 | 86 |
| 5 | SME IPO Disclosure Draft Forge | 4 | 15 | 14 | 12 | 10 | 12 | 8 | 8 | 5 | 84 |
| 6 | Finfluencer / pump-and-dump social-graph detector | 1 | 16 | 15 | 12 | 8 | 10 | 9 | 8 | 4 | 82 |
| 7 | Cross-MII surveillance explainability workbench | 2 | 15 | 16 | 12 | 7 | 9 | 9 | 9 | 4 | 81 |
| 8 | Synthetic-media threat desk | 1 | 16 | 15 | 12 | 8 | 9 | 7 | 8 | 4 | 79 |
| 9 | SCORES/ODR SLA monitor | 2 | 13 | 15 | 9 | 12 | 11 | 7 | 8 | 4 | 79 |
| 10 | Unified multi-asset suitability dashboard | 3 | 15 | 14 | 10 | 8 | 10 | 7 | 8 | 4 | 76 |
| 11 | Retail product-education risk co-pilot | 3 | 13 | 14 | 10 | 10 | 10 | 6 | 7 | 4 | 74 |
| 12 | SME IPO gap checker only | 4 | 12 | 13 | 9 | 12 | 11 | 6 | 7 | 4 | 74 |

### 6.2 Top-3 shortlist
| Rank | Idea | Why | Weakness |
| --- | --- | --- | --- |
| 1 | RegOS Sentinel | Best alignment + judge trust + strong demo + public corpus + agentic-on-theme | Must not look like generic RAG |
| 2 | Change-Impact Simulator | Directly kills the "circular→action delay" pain | Needs baseline process map to be credible |
| 3 | CSCRF Mapper | Concrete evidence artifacts, active priority | Too narrow alone |

### 6.3 Ensemble decision
**RegOS Sentinel = agentic obligation compiler + evidence graph + change-impact simulator.** Not a Frankenstein — one operating system, one core loop: *ingest → compile cited obligations → map to controls/owners → generate evidence tasks → simulate impact of new circulars → export audit pack.*

### 6.4 The agentic reframe (the key upgrade over v1)
The PS is titled **"Agentic Compliance."** Frame RegOS as a **supervised multi-agent pipeline**, each agent narrow and auditable, with human gates:

| Agent | Job | Output | Human gate |
| --- | --- | --- | --- |
| **Watcher** | Monitors SEBI circular pages/feeds for new/amended docs | Change event + diff | — (notify) |
| **Interpreter** | Schema-constrained extraction of obligations w/ clause citations + confidence | Structured obligations (JSON) | Low-confidence → review queue |
| **Mapper** | Classifies applicability to entity profile; maps obligation→control→owner | Compliance plan | Owner confirms scope |
| **Evidence** | Generates evidence tasks, SLA deadlines, validates uploaded artifacts | Evidence graph + status | Officer approves evidence |
| **Auditor** | Assembles audit pack; flags gaps/contradictions/supersessions | Audit PDF + risk heatmap | Compliance head signs off |

This is genuinely "agentic," directly on-theme, and matches Anshu's agentic-AI experience — while every agent's output is *cited, scored, and human-approved* (the trust moat).

### 6.5 PS pressure-test vs Anshu's strengths (the honest comparison)
Anshu's edges (from track record): full-stack shipping (Next.js/Vercel), ML on real data with leakage-safe rigor (ParkPulse, Flipkart Gridlock), **govt-grade trust artifacts** (ParkPulse: whitepaper, model/data card, risk register, DPDP statement, readiness pack), agentic-AI orchestration (SBI YONO Antara agentic concept; multi-agent bridges), fast deadline execution, often solo/lead.

| PS | Fit to Anshu | Upside | Killer risk | Verdict |
| --- | --- | --- | --- | --- |
| **PS2 RegOS** | **Highest** — agentic AI + full-stack + trust artifacts all reused | Demoable, public corpus, regulator-grade story he can already produce | "Generic RAG" perception → **mitigated by agentic + evidence graph + readiness pack** | **PICK** |
| PS1 detection | Medium-high (ML strength) | Topical, fraud theme wins at RBI | **Must prove detection accuracy w/o labeled dataset; crowded** | Strong #2, riskier demo |
| PS1 provenance registry | Medium | Novel, less crowded | Needs ecosystem adoption to feel real | Finalist-grade, adoption risk |
| PS4 IPO draft | Medium | Clear GenAI drafting; less crowded | Legal liability + ICDR/SME domain depth + merchant-banker review | Best *fallback* if he wants lower competition |
| PS3 super app | Low | — | Live broker/depository integrations infeasible in timeline | Avoid |

**Conclusion:** PS2 is both the highest-scoring idea *and* the best match to Anshu's unique, hard-to-copy strengths (agentic + trust artifacts). PS4 is the contrarian fallback if he wants a less crowded field and is willing to go deep on SEBI's SME ICDR framework. PS1 only if he secures or synthesizes a credible evaluation dataset early.

---

## 7. THE FLAGSHIP PROJECT — RegOS Sentinel

### 7.1 Name & pitch
- **Name:** RegOS Sentinel
- **One-liner:** *An agentic compliance OS that turns SEBI regulatory text into cited obligations, operational workflows, evidence, and audit-ready proof for securities-market intermediaries.*
- **30-sec elevator pitch:** SEBI publishes obligations as human-readable circulars, but intermediaries need machine-actionable rules with owners, deadlines, and evidence. RegOS Sentinel runs a supervised team of AI agents that watch for new circulars, extract clause-cited obligations, map them to a broker's controls and owners, generate evidence tasks, and produce an audit pack showing what was done, by whom, with what proof, and *why the rule applies*. In the demo, a stock broker drops in a CSCRF circular and RegOS turns it into a live compliance plan and a regulatory-change impact report in under three minutes — every line traceable to its source clause, every AI output human-approved.

### 7.2 Problem → why it matters → why now
| Layer | Detail |
| --- | --- |
| Problem | Regulatory text is unstructured, fast-changing, spread across circulars/master circulars/FAQs/amendments; teams translate it manually → delayed, uneven, un-auditable compliance. |
| Who suffers | Lean compliance teams at smaller brokers/IAs; regulators/MIIs facing uneven implementation; investors when controls fail (mis-selling, grievance delays, cyber lapses). |
| Pain data | Investor Survey 2025: platform issues 47%, mis-selling 41%, poor response 34%, grievance delays 30%; intermediaries cite complexity 95%. |
| Why now | LLMs can structure text, but regulators need *verifiability*. A clause-cited, human-approved agentic compiler is now feasible and far safer than free-form AI advice. |

### 7.3 Exact theme mapping
| PS2 requirement | RegOS mapping |
| --- | --- |
| Bridge regulatory text → operational action | Core loop: ingest → compile → map → tasks → audit. |
| Specify intermediary category | MVP: stock brokers (small-size RE); optional 2nd: investment advisers. |
| Specify regulatory corpus | Stock Broker MC 2025, CSCRF 2024 + FAQ, SCORES↔ODR 2023. |
| Demonstrate a concrete scenario | (a) CSCRF obligations for a small broker; (b) SCORES↔ODR grievance SLA evidence. |
| Improve efficiency/accuracy/auditability | Extraction + tasks + evidence validation + audit pack + review logs + metrics. |

### 7.4 Architecture (text diagram)
```text
SEBI source pages / PDFs / circular feeds
      │   [Watcher agent: poll + diff]
      ▼
Ingestion layer
  - scrape/parse (Firecrawl / pdfplumber)
  - section + clause + table chunking
  - metadata: title, date, circular no., URL
      │
      ▼
Interpreter agent  (schema-constrained LLM extraction)
  - actor / action / object / condition / deadline / frequency
  - evidence_required / applicability / citation / confidence
      │
      ▼
Verification layer
  - retrieval check vs source spans (every obligation must cite a span)
  - entailment / contradiction + supersession detection
  - deterministic schema validation (Pydantic)
  - low-confidence → human review queue
      │
      ▼
Mapper agent → Compliance knowledge graph (Postgres + optional Neo4j view)
  - Regulation → Obligation → Control → Process → Owner → Evidence
  - entity scope: stock broker / QSB / small RE / qualified RE
  - status: not_started / in_progress / evidence_pending / approved / exception
      │
      ▼
Evidence agent → Workflow & evidence engine
  - task generation, SLA/deadline tracking
  - evidence upload + mock connectors + (stretch) DigiLocker verify
      │
      ▼
Auditor agent → Dashboards & exports
  - compliance-team board · management risk heatmap
  - audit pack (PDF/HTML) with clause citations + approvals
  - SupTech aggregate view (anonymized, no raw PII)
```

### 7.5 Obligation schema (example)
```json
{
  "obligation_id": "CSCRF-PR-AA-S8-001",
  "source": "SEBI CSCRF Aug 20 2024",
  "actor": "Small-size stock broker",
  "action": "collect and protect identified logs",
  "frequency": "continuous",
  "evidence_required": ["log source inventory", "retention policy", "access-control review"],
  "owner_role": "CISO",
  "risk_domain": "cybersecurity",
  "citation": {
    "url": "https://www.sebi.gov.in/legal/circulars/aug-2024/cybersecurity-and-cyber-resilience-framework-cscrf-for-sebi-regulated-entities-res-_85964.html",
    "span": "CSCRF FAQ — log types & confidentiality"
  },
  "confidence": 0.86,
  "human_status": "pending_review"
}
```

### 7.6 AI/ML approach + explainability
| Component | Method |
| --- | --- |
| Parsing | PDF/HTML → markdown; chunk by headings/clauses/annexures/tables. |
| Extraction | Claude (or model-agnostic) with strict JSON schema + few-shot. |
| Applicability | Hybrid rules + classifier mapping entity profile → in-scope obligations. |
| Grounding | Retrieval check — each obligation must point to a verbatim source span (anti-hallucination). |
| Contradiction/supersession | Compare new circular vs existing obligations; flag amendments/conflicts. |
| Explainability | Show clause quote, source URL, confidence, reviewer status, change history. |
| Benchmark | 50–100 human-labeled obligations → precision/recall, citation accuracy, false-positive rate (a metric slide judges love). |

### 7.7 Tech stack (Anshu-native)
| Layer | Choice |
| --- | --- |
| Frontend | Next.js (App Router) + React + Tailwind + shadcn/ui; obligation table, source-clause viewer (split-pane highlight), Kanban evidence board, audit export. |
| Backend | Python FastAPI. |
| Agent orchestration | LangGraph (or a lightweight custom state machine) over the 5 agents; each step logged + replayable. |
| LLM | Claude API behind a provider abstraction (so an open-weight/on-prem path exists if organizers require it). |
| Storage | Postgres (obligations/tasks/audit logs) + pgvector (clause retrieval); optional Neo4j for the graph visual. |
| Parsing | Firecrawl (web/PDF) for prototype; pluggable parser for prod. |
| Validation | Pydantic + JSON Schema + citation-coverage tests. |
| Auth | Role-based (compliance officer / CISO / management / regulator view). |
| Deploy | Docker Compose for demo; Vercel (frontend) + Render/Fly (API+DB) for the live link. |

### 7.8 MVP vs stretch
**MVP (by Aug 9 video):** load 3–5 SEBI docs · select stock-broker profile + size · extract cited obligations · applicability filter · generate owner/deadline/evidence tasks · upload synthetic evidence + status · change-impact simulation on one new circular · export audit pack · metrics overlay.

**Stretch (for finals):** SupTech aggregate dashboard · circular diff-watcher (live Watcher) · DigiLocker evidence verification (DPI tick) · Jira/Slack/email connectors · multilingual explainer · policy-as-code (OPA/YAML) export · investment-adviser 2nd corpus.

### 7.9 Judge-winning differentiators
1. **Verifiable obligation compiler** (cited + confidence + human sign-off) — beats the field's RAG chatbots.
2. **Regulatory-change impact simulator** — visibly collapses "weeks → minutes," the exact pain PS2 names.
3. **Regulator-grade trust/readiness pack** — model card, risk register, DPDP statement, human-in-loop policy, audit logs. Almost no student team ships this; it's Anshu's proven ParkPulse muscle.

### 7.10 Compliance / ethics / DPDP
- Public SEBI documents + **synthetic intermediary data** only → no personal data in the prototype.
- **DPDP-aligned** posture: data minimization, purpose limitation, role-based access, encryption, retention controls; documented in a one-page DPDP statement.
- **No autonomous legal decisions**: every obligation/recommendation is "draft compliance action," approved by a human officer; "not legal advice" disclaimer.
- Full audit log of agent actions + human approvals (itself a compliance feature).

### 7.11 Deployment / go-to-market path
| Phase | Adopter | Deployment |
| --- | --- | --- |
| Hackathon MVP | Demo broker | Public corpus + synthetic evidence, local/hosted demo |
| Pilot | One broker or industry body | Private corpus, labeled obligations, officer review |
| MII-assisted | Exchange/depository association | Standardized obligation packs per broker category |
| SupTech | SEBI / MII | Anonymized readiness dashboards |
| Production | Intermediaries | On-prem/VPC, retention controls, audit logs |

### 7.12 Why this wins (tied to rubric)
| Criterion | Why RegOS scores high |
| --- | --- |
| Market Impact | Attacks a regulator-stated core unsolved problem + measurable time saved + audit readiness. |
| Technology Stack | Agentic AI + NLP + retrieval + graph + workflow + (stretch) DPI/DigiLocker. |
| Feasibility | Public docs + synthetic data → a complete working prototype before Aug 9. |
| Scalability | One schema scales across brokers, IAs, RTAs, AMCs, MIIs, and future circulars. |
| SEBI Mandate | Investor protection + supervision + market integrity + intermediary accountability. |

---

## 8. Demo Script (5–7 min, for Aug 9 video & jury)
| # | Action | Judge takeaway |
| --- | --- | --- |
| 1 | Select "Stock Broker — small-size RE" profile | Concrete, not generic |
| 2 | Watcher ingests CSCRF + Stock Broker MC from saved URLs/PDFs | Real public SEBI corpus |
| 3 | Interpreter "Compile obligations" → table (actor/action/deadline/evidence/citation) | Structured + verifiable, not chat |
| 4 | Click one obligation → source viewer highlights the clause; shows confidence + reviewer status | Explainability + anti-hallucination |
| 5 | Mapper "Generate compliance plan" → tasks to CISO / Compliance / Ops / Grievance | Text → operational action |
| 6 | Upload synthetic evidence (SOC report, log inventory, grievance log, board note) | Evidence graph = audit readiness |
| 7 | Trigger "New circular impact simulation" (SCORES↔ODR or surveillance) | Delta analysis; weeks→minutes |
| 8 | Export audit pack + show management heatmap (done/pending/exception) | Deployable + regulator-friendly close |

**Live metric overlay:** docs ingested 4 · obligations extracted 80–150 · citation coverage 100% of displayed · low-confidence routed to review · time-to-first-plan < 3 min.

---

## 9. Risks & Mitigations
| Risk | Sev | Mitigation |
| --- | --- | --- |
| LLM hallucinates obligations | High | Strict schema + mandatory source citation + retrieval validation + confidence threshold + human approval |
| "AI compliance advice" legal liability | High | Decision-support framing; officer sign-off; "not legal advice" |
| Over-scoping all intermediaries | High | MVP = stock brokers + CSCRF/SCORES only |
| Judges see generic RAG | High | Lead with agentic pipeline + evidence graph + change simulator + readiness pack |
| Poor PDF/table parsing | Med | Pre-parse selected docs; manual correction layer for demo; show parser confidence |
| No real intermediary data | Med | Public text + synthetic process/evidence; explain prod connectors |
| Privacy/security concerns | Med | No PII; RBAC; encryption; DPDP posture |
| Competing compliance chatbots | Med | Benchmark + evidence graph + SupTech view differentiate |
| Time before Aug 9 | Med | Build the single narrative demo path first (CSCRF → audit pack) |
| Hosted-LLM not allowed | Med | Provider abstraction → swap to open-weight/on-prem; ask organizers early |

---

## 10. Build Plan & Timeline (scoped to Anshu's stack)

### 10.1 Milestone-aligned plan
| Window | Hackathon milestone | Build goals |
| --- | --- | --- |
| Jun 29 – Jul 03 | Deep-dive webinars | Attend; ask the 5 open questions (§2.8). Lock PS2 + stock-broker scope. Scaffold repo. |
| Jul 04 – Jul 12 | **Idea submission (Round 01)** | Submit RegOS one-pager + architecture + demo storyboard + corpus list + agentic diagram. |
| Jul 13 – Jul 20 | Prototype sprint 1 | Ingestion + chunking + Interpreter extraction + source-clause viewer + seed obligations. |
| Jul 21 – Jul 28 | Prototype sprint 2 | Entity profile + applicability filter + Mapper tasks + evidence upload + statuses. |
| Jul 29 – Aug 04 | Prototype sprint 3 | Change-impact simulator + Auditor audit-pack export + metrics overlay + 50-obligation labeled set. |
| Aug 05 – Aug 09 | **Solution video due** | Polish single narrative (CSCRF → audit pack); record < 7-min demo; ship live link. |
| Aug 10 – Aug 16 | Jury prep | Harden demo; backup screenshots + offline mode; rehearse Q&A on AI safety/legality. |
| Aug 17 – Aug 21 | **Demo & Jury Round** | Live demo; deployment + pilot path; answer compliance questions. |
| Aug 22 – Sep 08 | Finals refinement | SupTech view + DigiLocker stretch + IA 2nd corpus + UI/pitch polish + readiness pack. |
| Sep 09 – Sep 11 | **Final pitch at GFF** | SEBI mandate + measurable impact + adoption path. |

### 10.2 Repo scaffold (proposed)
```text
regos-sentinel/
├─ apps/web/            # Next.js + Tailwind + shadcn (dashboard, source viewer, kanban, audit export)
├─ services/api/        # FastAPI (routes: ingest, compile, map, evidence, audit, simulate)
│  ├─ agents/           # watcher, interpreter, mapper, evidence, auditor (LangGraph nodes)
│  ├─ schemas/          # Pydantic obligation/task/evidence models
│  ├─ retrieval/        # pgvector clause store + grounding check
│  └─ eval/             # labeled obligations + precision/recall harness
├─ corpus/              # downloaded public SEBI PDFs (CSCRF, Stock Broker MC, SCORES-ODR)
├─ seed/                # synthetic broker profile, process inventory, evidence artifacts
├─ docs/                # MODEL_CARD.md, RISK_REGISTER.md, DPDP_STATEMENT.md, ARCHITECTURE.md
├─ docker-compose.yml
└─ README.md
```

### 10.3 Solo-vs-team work breakdown
| Role (collapse if solo) | Tasks |
| --- | --- |
| AI/backend | Parser, extraction schema, retrieval grounding, agent graph, API |
| Frontend | Dashboard, source viewer, task board, evidence graph, audit export |
| Domain/compliance | Annotate obligations, build process map, verify interpretation |
| Product/pitch | Demo script, metrics, judge story, readiness pack |

### 10.4 Minimum viable demo (cut list if time-crunched)
| Must have | Cut first |
| --- | --- |
| Stock-broker profile | 2nd intermediary (IA) |
| CSCRF corpus | Full Stock Broker MC coverage |
| 30–50 high-quality obligations | 150+ obligations |
| Evidence upload + audit pack | Live connectors |
| Change simulator on one doc | Continuous Watcher |
| Citation/source viewer | Graph animations |

---

## 11. Source Bibliography
**Hackathon**
- HackCulture event page — https://hackculture.io/hackathons/sebi-securities-market-techsprint
- PS PDFs — `SEBI PS/problem_explanation_{iu1gmlmfzu,npc5i8hj0r,6koz5boxj0w,ydsky1n18rr}.pdf`

**SEBI**
- F&O loss study press release (93% / ₹1.8L cr) — https://www.sebi.gov.in/media-and-notifications/press-releases/sep-2024/updated-sebi-study-reveals-93-of-individual-traders-incurred-losses-in-equity-fando-between-fy22-and-fy24-aggregate-losses-exceed-1-8-lakh-crores-over-three-years_86906.html
- Investor Survey 2025 — https://www.sebi.gov.in/sebi_data/commondocs/jan-2026/Investor%20Survey%202025%20Main%20Report.pdf
- Annual Report 2024-25 — https://www.sebi.gov.in/reports-and-statistics/publications/aug-2025/annual-report-2024-25_96014.html
- Master Circular for Stock Brokers (Jun 17 2025) — https://www.sebi.gov.in/legal/master-circulars/jun-2025/master-circular-for-stock-brokers_94623.html
- Master Circular for Investment Advisers (Feb 06 2026) — https://www.sebi.gov.in/legal/master-circulars/feb-2026/master-circular-for-investment-advisers_99569.html
- Master Circular on Surveillance (May 15 2026) — https://www.sebi.gov.in/legal/master-circulars/may-2026/master-circular-on-surveillance-of-securities-market_101473.html
- CSCRF (Aug 20 2024) — https://www.sebi.gov.in/legal/circulars/aug-2024/cybersecurity-and-cyber-resilience-framework-cscrf-for-sebi-regulated-entities-res-_85964.html
- CSCRF FAQ (Jun 2025) — https://www.sebi.gov.in/sebi_data/faqfiles/jun-2025/1749647139924.pdf
- ODR master circular (Aug 11 2023) — https://www.sebi.gov.in/legal/master-circulars/aug-2023/online-resolution-of-disputes-in-the-indian-securities-market_75220.html
- SCORES↔ODR circular (Sep 20 2023) — https://www.sebi.gov.in/legal/circulars/sep-2023/redressal-of-investor-grievances-through-the-sebi-complaint-redressal-scores-platform-and-linking-it-to-online-dispute-resolution-platform_77159.html
- T+0 settlement circular (Mar 2024) — https://www.sebi.gov.in/legal/circulars/mar-2024/introduction-of-beta-version-of-t-0-rolling-settlement-cycle-on-optional-basis-in-addition-to-the-existing-t-1-settlement-cycle-in-equity-cash-markets_82455.html
- UPI block / ASBA-like consultation (Aug 2024) — https://www.sebi.gov.in/reports-and-statistics/reports/aug-2024/consultation-paper-on-the-facility-for-trading-in-the-secondary-market-using-upi-block-mechanism-to-be-mandatorily-offered-by-qualified-stock-brokers-qsbs-to-their-clients-asba-like-facility-for-_86226.html

**Fraud / finfluencer (PS1)**
- SEBI ₹18.14 cr freeze on finfluencer "Baap of Chart" — reported (verify via SEBI order); IOSCO Finfluencers Final Report — https://www.iosco.org/library/pubdocs/pdf/IOSCOPD795.pdf

**SME IPO (PS4)**
- FY25 SME IPO stats (~235–239 IPOs, ~₹9,133 cr) — PRIME Database via Indian Express / s45.ai summary — https://s45.ai/feeds/blog/sme-ipo
- AIBI SME Handbook for Issuers — https://aibi.org.in/files/SEBI_AIBI_SME_Handbook.pdf

**Winner intelligence / global RegTech**
- MAS & SFA 2025 winners (ActuaViz, Claimsio, Oxford Risk) — https://www.mas.gov.sg/news/media-releases/2025/mas-and-sfa-announce-fintech-award-winners-at-singapore-fintech-festival-2025
- SFF Global FinTech Hackcelerator — https://www.fintechfestival.sg/global-fintech-hackcelerator
- RBI HaRBInger 2024 winners — https://charltonsquantum.com/rbi-announces-harbinger-2024-winners/
- RBI HaRBInger official PR (4th edition results) — docs.publicnow.com (RBI press release)
- FCA TechSprint approach — http://www.fca.org.uk/publication/research/fostering-innovation-through-collaboration-evolution-techsprint-approach.pdf
- FINRA RegTech report — https://www.finra.org/sites/default/files/2018_RegTech_Report.pdf
- FSB SupTech/RegTech report — https://www.fsb.org/uploads/P091020.pdf

**India Stack / ecosystem**
- Account Aggregator framework — https://financialservices.gov.in/account-aggregator-framework
- Sahamati — https://sahamati.org.in/account-aggregators/
- SCORES — https://scores.sebi.gov.in/

> Note: items labeled "reported / verify" (finfluencer ₹ figure, PCI/NPCI/FCC backers, exact prize benefits) should be confirmed against primary SEBI/HackCulture sources before quoting in the pitch.

---

## 12. Open Questions for Organizers
| Question | Why |
| --- | --- |
| Hosted LLM APIs allowed, or open-weight/on-prem required? | Architecture + privacy posture |
| Will SEBI provide datasets / annotated circulars / mentor office hours? | Benchmark + demo realism |
| Preferred PS2 intermediary category? | Confirm stock-broker assumption |
| Exact Round-01/02 artifacts (deck, repo, video length/format)? | Submission compliance |
| Is a SupTech view for SEBI in-scope/welcome? | Boosts judge appeal if yes |
| Are PCI/NPCI/FCC official backers of this TechSprint? | Pitch accuracy |
| What does "DPI" mean in their rubric? | Likely Digital Public Infrastructure — position DigiLocker stretch |

---

## 13. Critic Passes & Revision Notes

### Iteration 1 — "AI compliance chatbot for SEBI circulars" → **78/100**
- Too generic (everyone builds RAG) → reframed as obligation *compiler*, not chatbot.
- Not operational → added task generation, owners, evidence, audit pack.
- Weak trust → added citation binder, confidence, human review, benchmark.
- Too broad → narrowed to stock brokers + CSCRF/SCORES.

### Iteration 2 — "Compliance compiler for all SEBI intermediaries" → **86/100**
- Still too broad → MVP locked to stock brokers.
- Demo looked static → added change-impact simulator + live evidence upload.
- Impact under-evidenced → added Investor Survey complaint mix + F&O context.
- Adoption unclear → added broker pilot → MII rollout → SupTech view.

### Iteration 3 — "RegOS Sentinel for broker compliance evidence" → **90/100**
- Needed a memorable finals hook → elevated change-impact simulator as the killer demo.
- Needed winner comparison → added MAS ActuaViz parallel.
- Needed ethics depth → DPDP posture, no-PII, human-in-loop, no-legal-advice.
- Needed judge script → 8-step demo + metric overlay.

### Iteration 4 (new in v2) — skeptical-judge attack on the v1 final → **93/100**
- **"PS title is *Agentic* — your design buried the agents."** → Reframed as an explicit supervised 5-agent pipeline (Watcher/Interpreter/Mapper/Evidence/Auditor) with human gates (§6.4). On-theme + raises Tech-wow.
- **"Why should *this builder* win PS2 over PS1/PS4?"** → Added the PS-vs-Anshu pressure test (§6.5): agentic + full-stack + govt-grade trust artifacts are his hard-to-copy moat; PS1 detection-accuracy and PS3 integration traps avoided.
- **"Ground truth had unverified gaps."** → Live-scraped the page: rubric confirmed verbatim, timeline confirmed, **prize "₹8L+" resolves the v1 discrepancy**, eligibility confirmed.
- **"Stack was abstract."** → Added Anshu-native stack + repo scaffold + solo-vs-team breakdown + cut list (§7.7, §10).
- Residual: real-world adoption still depends on legal trust + corpus quality + institutional integration — acceptable hackathon risks given clause-level provenance, human review, and the readiness pack. Score plateaus at 93; pushing higher needs a real pilot partner, out of hackathon scope.

### Changelog
| Loop | Improvement |
| --- | --- |
| 1 | RAG/chatbot → structured obligation compiler |
| 2 | Scope → stock brokers + evidence-heavy CSCRF/SCORES |
| 3 | Added change simulator, SupTech view, benchmark, audit-pack finale |
| 4 (v2) | **Agentic reframe + builder-fit pressure test + verified ground truth + Anshu-native stack/repo** |

**Final concept:** *RegOS Sentinel — a verifiable, agentic compliance operating system for securities-market intermediaries.* **Final score: 93/100.**
