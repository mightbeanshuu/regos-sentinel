# flagship_project.md — RegOS Sentinel

> The ensembled flagship (Phase 7). One core user, one PS, one killer demo, three differentiators. Generated 2026-06-29.

## 1. Name
**RegOS Sentinel**

## 2. One-line pitch
An agentic compliance OS that turns SEBI circulars into cited obligations, human-approved evidence workflows, and audit-ready proof — collapsing circular-to-action from weeks to minutes.

## 3. 30-second pitch
SEBI publishes obligations as human-readable circulars, but a small stock broker's lean compliance team has to translate each one — by hand — into who-does-what, by-when, with-what-evidence. It's slow, uneven, and un-auditable. RegOS Sentinel runs a supervised team of AI agents that watch for new circulars, extract clause-cited obligations, map them to the broker's controls and owners, generate evidence tasks, and assemble an audit pack — every line traceable to its source clause, every AI output human-approved. Drop in a new circular and RegOS shows the impact in minutes, not weeks.

## 4. Target problem statement
**PS2 — Agentic Compliance From Regulatory Text to Operational Action.** Intermediary: stock brokers (small-size RE). Corpus: Stock Broker Master Circular (Jun 2025) + CSCRF (Aug 2024 + FAQ) + SCORES↔ODR (Sep 2023).

## 5. Why this wins
- **On-theme to the letter** — PS2 literally says "Agentic"; we ship an explicit 5-agent pipeline, not a chatbot.
- **Trust moat** — clause-level citations + confidence + human gates + benchmark + readiness pack (model card/risk register/DPDP). Almost no student team ships this; it's Anshu's ParkPulse-proven muscle.
- **White-space in a validated category** — Corlytics/Ascent prove enterprises pay for obligations-management; none are SEBI-specific, agentic, small-intermediary, or demoable. We own that gap.
- **Signature demo beat** — the change-impact simulator makes "weeks → minutes" visible in 30 seconds.

## 6. MVP (by Aug 9 video)
Load 3–5 SEBI docs → select stock-broker profile/size → extract cited obligations → applicability filter → generate owner/deadline/evidence tasks → upload synthetic evidence + status → change-impact simulation on one new circular → export audit pack → live metric overlay.

## 7. Stretch (for finals)
SupTech aggregate dashboard · live circular diff-watcher (Watcher agent) · DigiLocker evidence verification (DPI tick) · Jira/Slack/email connectors · multilingual explainer · policy-as-code (OPA/YAML) export · investment-adviser 2nd corpus.

## 8. Architecture
```text
SEBI pages/PDFs ──[Watcher: poll+diff]──▶ Ingestion (Firecrawl/pdfplumber, clause+table chunking, metadata)
   ──▶ Interpreter (schema-constrained LLM extraction: actor/action/condition/deadline/evidence/applicability/citation/confidence)
   ──▶ Verification (retrieval grounding vs source span · contradiction/supersession · Pydantic validation · low-confidence→human queue)
   ──▶ Mapper → Compliance graph (Regulation→Obligation→Control→Process→Owner→Evidence; entity scope; status)
   ──▶ Evidence agent → Workflow engine (tasks, SLA, evidence upload, optional DigiLocker verify)
   ──▶ Auditor → Dashboards + audit pack (clause citations + approvals) + SupTech aggregate (anonymized)
```
Stack: Next.js/shadcn + FastAPI + LangGraph agents + Claude API (provider-abstracted) + Postgres/pgvector (+ optional Neo4j view) + Docker Compose; deploy Vercel + Render/Fly.

## 9. Data sources
Real public: SEBI Stock Broker MC, CSCRF + FAQ, SCORES↔ODR. Synthetic: broker profile, process inventory, evidence artifacts (SOC/VAPT report, log inventory, grievance log, board note), complaint tickets. Labeled: 50–100 obligations for benchmark.

## 10. AI/ML approach
Schema-constrained extraction (strict JSON) + retrieval grounding (every obligation cites a verbatim span) + hybrid rules/classifier for applicability + contradiction/supersession detection + confidence scoring + human-in-loop. Benchmark: precision/recall/citation-coverage/false-positive on the labeled set.

## 11. Validation plan
See `idea_validation.md §3` — problem/regulatory/technical/demo/market/competition tests with pass/fail criteria. Headline gates: extraction precision ≥0.85, citation-coverage 100% of displayed, demo circular→audit pack <3 min.

## 12. Demo script (5–7 min)
1. Select "Stock Broker — small-size RE". 2. Watcher ingests CSCRF + Stock Broker MC. 3. Interpreter compiles cited obligations table. 4. Click obligation → source viewer highlights clause + confidence + reviewer status. 5. Mapper generates compliance plan (CISO/Compliance/Ops/Grievance). 6. Upload synthetic evidence → evidence graph. 7. **Climax:** trigger new-circular impact simulation → live diff of impacted controls/tasks. 8. Export audit pack + management heatmap. Overlay: docs 4 · obligations 80–150 · citation 100% · time-to-plan <3 min.

## 13. Scoring justification
93/100 (`idea_scorecard.md`): PS Alignment 15/15, Compliance 6/6, Scalability 5/5, Effort-to-Reward 3/3; only structural losses (crowded field, synthetic data, production legal proof) — priced into the Crucible ceiling 93.5.

## 14. Risks & mitigations
Hallucination → citations + grounding + confidence + human gate + benchmark. Legal liability → decision-support framing + officer sign-off + "not legal advice". Generic-RAG perception → cited graph + simulator + readiness pack + contrast slide. No real data → public corpus + labeled synthetic + named connectors. Hosted-LLM policy → provider abstraction. (Full table in `research.md §9`.)

## 15. Build timeline
See `build_plan.md`. Spine: Jul 4–12 idea submission · Jul 13–Aug 4 three prototype sprints · Aug 5–9 solution video · Aug 17–21 jury · Sep 9–11 finals.

## 16. Final score
**93/100** (Phase-5 rubric) · Crucible rigor rate ~100% of a 93.5 ceiling.
