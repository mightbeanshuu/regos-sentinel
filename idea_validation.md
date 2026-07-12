# idea_validation.md — RegOS Sentinel (SEBI TechSprint 2026)

> Ruthless validation pass. Companion to `research.md` + `idea-crucible.md`. Generated via /loop strategist pass, 2026-06-29, with live firecrawl + web search. Current idea = **RegOS Sentinel** targeting **PS2 (Agentic Compliance)**.

---

## PHASE 1 — Ground Truth

| Item | Ground Truth | Confidence | Source |
|---|---|---|---|
| Targeted PS | PS2 — "Agentic Compliance From Regulatory Text to Operational Action" | High | Live HackCulture page + `SEBI PS/...npc5i8hj0r.pdf` |
| Judging criteria | Market Impact; Technology Stack (AI/ML/Blockchain/NLP/DPI); Feasibility; Scalability; Alignment with SEBI's Mandate | High | Live page (verbatim) |
| Weights | **No published weights** | High (of absence) | Live page |
| Deliverables | Round-01 idea submission → solution video (Aug 9) → working prototype demo to jury (Aug 17–21) → final pitch at GFF (Sep 9–11) | High | Live Schedule tab |
| Timeline | Reg/Idea by Jul 12; deep-dive webinars Jun 29–Jul 3; prototype Jul 13–Aug 21; video Aug 9; jury Aug 17–21; finals Sep 9–11 | High | Live page |
| Constraints/rules | One PS only; original work; AI/ML/NLP/DPI encouraged; confidentiality/security/data-privacy compliance; jury final | High | Live Rules tab |
| Prize | ₹8L+ pool (cash ₹2.5/2.0/1.5L + ₹50k jury + certificates) | High | Live Prizes tab |
| What RegOS claims to solve | Regulatory text is unstructured; compliance teams translate it manually → delayed, uneven, un-auditable. RegOS turns circulars into cited obligations + evidence workflow + audit pack + change simulator | High (design) | `research.md` |
| Current MVP scope | Stock brokers; corpus = Stock Broker MC 2025 + CSCRF 2024 + SCORES↔ODR 2023; synthetic evidence; 5-agent pipeline | High (design) | `research.md`, `idea-crucible.md` |
| Differentiators | (1) verifiable cited obligation compiler; (2) regulatory-change impact simulator; (3) regulator-grade readiness pack | High (design) | `idea-crucible.md` |
| Current risks | LLM hallucination; "generic RAG" perception; legal liability; no real broker data; hosted-LLM policy unknown | High | `research.md §9` |
| Hosted-LLM allowed? | **Unverified** — must ask in deep-dive webinar | Low | — |
| PCI/NPCI/FCC backers | **Unverified** — on banner image; page text says "MIIs + industry bodies" | Low | Screenshot vs page |
| Exact Round-01/02 file specs | **Unverified** | Low | Page lists artifacts but not formats |

---

## PHASE 2 — Current Idea Attack (six hats)

| Weakness | Severity | Evidence | Fix | If Not Fixed, Impact |
|---|---|---|---|---|
| "It's just a RAG chatbot over circulars" perception | **High** | Many teams will do exactly this; RAG-over-PDF is a default hackathon move | Lead with structured cited-obligation graph + evidence workflow + change simulator; show a "chatbot vs RegOS" contrast slide | Blends into the pack; loses Innovation + Judge Appeal points |
| LLM hallucinates a wrong obligation | High | LLMs fabricate; compliance errors are unacceptable to a regulator | Mandatory clause-citation + retrieval grounding + confidence threshold + human approval gate + benchmark | Judge kills it on trust in Q&A |
| "Is this legal advice? Who is liable?" | High | Regulators are liability-sensitive | Decision-support framing; officer sign-off; "not legal advice"; full audit log | Regulator hat rejects |
| No real intermediary/broker data | Medium | Only public circulars are real; process/evidence is synthetic | Use real public corpus + clearly-labeled synthetic evidence; name production connectors | "Toy demo" criticism (priced into ceiling) |
| Scope creep across all intermediaries | Medium | Easy to over-promise brokers+IAs+AMCs+RTAs | Lock MVP to stock brokers + CSCRF/SCORES | Misses Aug 9 video deadline |
| Enterprise RegTech already exists (Corlytics, Ascent) | Medium | firecrawl: Corlytics/ClauseMatch "regulatory obligations management"; Ascent "regulatory register" | Position as SEBI-specific + agentic + small-intermediary + clause-cited + demoable; they're Western, enterprise-priced, not SEBI-tuned | "Already solved" critique |
| Demo could be a static dashboard | Medium | Tables alone don't wow | Make the change-impact simulator the live climax ("weeks→minutes") | Forgettable demo, low Demoability |
| Parsing SEBI PDFs/tables is messy | Medium | SEBI PDFs have annexures/tables | Pre-parse the chosen docs; manual correction layer; show parser confidence | Live demo parsing failure |
| Hosted-LLM may be disallowed | Medium | Unknown organizer policy | Provider abstraction → swap to open-weight/on-prem; ask early | Architecture rework late |
| Solo-build bandwidth | Low–Med | Anshu often solo/lead | Cut list defined; narrow demo path first | Incomplete MVP |

**Verdict of the attack:** the idea survives every attack with a concrete fix; the only irreducible items (synthetic data, crowded field, production legal proof) are correctly priced into the Crucible ceiling (93.5). It is NOT a generic chatbot once the three differentiators are front-loaded.

---

## PHASE 3 — Validation Test System

| Test | Method | Pass Criteria | Fail Criteria | Evidence Needed | Owner |
|---|---|---|---|---|---|
| **PROBLEM: pain is real** | Cite SEBI Investor Survey 2025 complaint mix + intermediary complexity stat | Pain quantified with ≥2 SEBI stats | Only anecdotal | Survey: complexity 95%; complaints platform 47% / mis-sell 41% / response 34% / delays 30% | Domain |
| PROBLEM: who suffers + frequency | Identify lean-team intermediaries; continuous obligation churn | Named user (small stock broker compliance officer) + ongoing cadence | Vague user | SEBI circular issuance cadence | Domain |
| PROBLEM: current workaround + why it fails | Manual legal interpretation, circular-by-circular tracking | Workaround documented + failure mode | No baseline | PS2 text states manual/uneven | Domain |
| **REGULATORY: maps to PS** | Compare to PS2 title + desired outcome | Verbatim title match + corpus named | Loose mapping | PS2 PDF | Domain |
| REGULATORY: SEBI corpora support | List Stock Broker MC, CSCRF, SCORES↔ODR | ≥3 real public circulars used | Fabricated refs | SEBI URLs in `research.md §11` | Domain |
| REGULATORY: privacy/audit/explainability/oversight | Design review | Citations + human gate + DPDP + audit log all present | Any missing | Readiness pack docs | QA |
| **TECHNICAL: MVP buildable** | Spike: ingest 1 circular → 10 cited obligations | Working extraction w/ citations in ≤3 days | Can't ground citations | Spike branch | AI/backend |
| TECHNICAL: extraction quality | Benchmark on 50–100 labeled obligations | Precision ≥0.85, citation-coverage 100% of displayed | <0.7 precision | Labeled set + eval harness | AI/backend |
| TECHNICAL: failure modes | Inject contradictory/superseding circulars | Flags conflict, routes to review | Silent wrong merge | Test corpus | QA |
| **DEMO: value in <5 min** | Dry-run timed demo | Circular→audit pack < 3 min, simulator beat lands | >5 min or confusing | Recorded rehearsal | Product |
| DEMO: before/after | Show manual vs RegOS | Clear weeks→minutes contrast | No contrast | Demo storyboard | Product |
| DEMO: wow moment | Change-impact simulator live diff | Judges visibly react / ask about it | Flat | Simulator working | Product |
| **MARKET: adopter + pilot** | Define broker pilot → MII → SEBI SupTech path | Concrete pilot one-pager | No adoption path | Deployment section | Product |
| MARKET: blockers | List adoption blockers | Named + mitigated | Unaddressed | Risk register | Product |
| **COMPETITION: existing tools** | firecrawl scan | Map Corlytics/Ascent/Signzy + white-space | Claim "nothing exists" | This file's competition note | Strategist |
| COMPETITION: what other teams submit + how we beat them | Predict field | RAG chatbots predicted; we beat on cited graph + simulator + readiness pack | No differentiation | Crucible §5 | Strategist |

### Competition note (firecrawl-validated)
- **Global, enterprise (category proven):** Corlytics (acquired ClauseMatch) — AI regulatory obligations + policy management; Ascent RegTech — automated regulatory register + change management. → The *category is valuable* but they are Western, enterprise-priced, not SEBI-tuned, not demoable by a student team.
- **India, adjacent (not the same problem):** Signzy, IDfy = KYC/AML/identity; regtechapi.in = broker *onboarding* automation. → None do SEBI regulatory-text → cited-obligation + evidence-graph for small intermediaries.
- **White-space:** SEBI-specific + agentic + clause-cited + evidence-graph + change-simulator + small-intermediary-friendly. RegOS sits in real white-space *inside a validated category* — the ideal position.

---

## PHASE 3.5 — Assumptions ledger (validated vs guessed)
| Assumption | Status | Note |
|---|---|---|
| PS2 is the right PS for Anshu | **Validated** (Crucible: ceiling 93.5 beats PS1 86, PS4 84) | — |
| Stock brokers is the right first intermediary | **Reasoned** | Confirm preference in webinar |
| Public SEBI corpus is sufficient for demo | **Validated** | Circulars are public; evidence synthetic |
| Hosted LLM allowed | **Guessed** | Ask organizers; abstraction de-risks |
| Judges weight Feasibility/Demo highly | **Reasoned** | Round-02 is prototype+video gated |
| Extraction can hit ≥0.85 precision | **Guessed** | Validate via spike + benchmark |
| PCI/NPCI/FCC are backers | **Guessed** | Verify before pitch |
