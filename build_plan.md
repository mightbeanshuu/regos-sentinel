# build_plan.md — RegOS Sentinel

> Day-by-day build plan to the Aug 9 video and Aug 17–21 jury. Owners assume solo/small team (collapse roles if solo). Generated 2026-06-29.

## Roles (collapse if solo)
- **BE/AI** — parser, extraction schema, retrieval grounding, agent graph, API
- **FE** — Next.js dashboard, source viewer, kanban, audit export
- **DOM** — annotate obligations, process map, regulatory interpretation
- **PM** — demo script, metrics, readiness pack, pitch

## Phase A — Lock & scaffold (Jun 29 – Jul 12)
| Day | Task | Owner |
|---|---|---|
| Jun 29–Jul 3 | Attend deep-dive webinars; ask 5 open questions (hosted-LLM? datasets? preferred intermediary? Round-01/02 file specs? SupTech in-scope?) | PM |
| Jul 4–6 | Scaffold repo (`apps/web`, `services/api/agents`, `corpus`, `seed`, `docs`); Docker Compose; CI lint | BE/FE |
| Jul 7–9 | Download corpus; write 1-circular ingestion spike → 10 cited obligations (feasibility gate) | BE/AI |
| Jul 10–12 | **Round-01 idea submission**: one-pager + architecture + agentic diagram + storyboard + corpus list | PM |

## Phase B — Prototype sprint 1 (Jul 13 – Jul 20): Interpreter + provenance
| Task | Owner |
|---|---|
| Ingestion: PDF/HTML → markdown, clause/table chunking, metadata | BE/AI |
| Interpreter agent: schema-constrained extraction (actor/action/deadline/evidence/applicability/citation/confidence) | BE/AI |
| Verification: retrieval grounding (every obligation → source span); low-confidence → review queue | BE/AI |
| FE: obligation table + split-pane source-clause viewer (highlight) | FE |
| DOM: label 50 obligations from CSCRF for benchmark | DOM |

## Phase C — Prototype sprint 2 (Jul 21 – Jul 28): Mapper + Evidence
| Task | Owner |
|---|---|
| Entity profile (stock broker + size) + applicability filter (rules+classifier) | BE/AI |
| Mapper: obligation→control→owner; compliance graph in Postgres | BE/AI |
| Evidence agent: task generation, SLA/deadline, evidence upload + status | BE/AI |
| FE: kanban evidence board + status states | FE |
| Seed synthetic broker profile, process inventory, evidence artifacts | DOM |

## Phase D — Prototype sprint 3 (Jul 29 – Aug 4): Auditor + simulator
| Task | Owner |
|---|---|
| Change-impact simulator: ingest new circular → diff → impacted controls/tasks | BE/AI |
| Auditor agent: audit-pack export (PDF/HTML w/ citations + approvals) | BE/AI |
| Metric overlay (docs/obligations/citation-coverage/time-to-plan) + benchmark slide | BE/AI |
| FE: management risk heatmap + audit export view | FE |
| Readiness pack: MODEL_CARD, RISK_REGISTER, DPDP_STATEMENT, HUMAN_IN_LOOP_POLICY | PM |

## Phase E — Solution video (Aug 5 – Aug 9)
| Task | Owner |
|---|---|
| Lock single narrative: CSCRF circular → audit pack + simulator climax | PM |
| Record < 7-min demo; deploy live link (Vercel + Render) | FE/PM |
| **Submit solution video (HARD DEADLINE Aug 9)** | PM |

## Phase F — Jury prep & round (Aug 10 – Aug 21)
| Task | Owner |
|---|---|
| Harden demo; offline mode + backup screenshots | BE/FE |
| Rehearse Q&A (AI safety, legality, data) using `judge_pitch.md` | All |
| **Demo & Jury Round (Aug 17–21)** | All |

## Phase G — Finals (Aug 22 – Sep 11)
| Task | Owner |
|---|---|
| Stretch: SupTech view + DigiLocker verify + IA 2nd corpus | BE/AI |
| Pitch + UI polish; pilot one-pager | PM/FE |
| **Final pitch at GFF (Sep 9–11)** | All |

## Test checklist
- [ ] Spike: 1 circular → ≥10 cited obligations
- [ ] Benchmark: precision ≥0.85, recall reported, citation-coverage 100% of displayed
- [ ] Contradiction/supersession test passes on injected conflict
- [ ] Every displayed obligation links to a verbatim source span
- [ ] Low-confidence items route to human review
- [ ] Audit pack exports with citations + approval log
- [ ] Change simulator shows correct diff on a held-out circular
- [ ] No PII anywhere; RBAC works; DPDP statement present

## Demo readiness checklist
- [ ] Circular → audit pack in < 3 min (timed)
- [ ] Simulator "weeks→minutes" beat lands < 30s
- [ ] "Chatbot vs RegOS" contrast slide ready
- [ ] Live link + offline fallback both work
- [ ] Metric overlay visible
- [ ] Readiness pack downloadable in-demo
- [ ] 30s / 2min / 5min pitches rehearsed
- [ ] Top-10 judge Q&A answers memorized
