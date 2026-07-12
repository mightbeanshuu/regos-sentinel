# Winning Product Build Spec: What to Build for SEBI TechSprint 2026

Date: 2026-06-29  
Decision: build a web-based RegTech/SupTech product, not a mobile app or simple website.

---

## 1. Direct Answer

To maximize win probability, build:

```text
RegOS Sentinel
= desktop-first web dashboard
+ agentic compliance backend
+ cited obligation graph
+ evidence workflow
+ audit-pack export
+ small SEBI/MII SupTech view
```

Do **not** build just:

- a landing page;
- a generic chatbot;
- a mobile app;
- a Figma-only prototype;
- a PDF summarizer;
- a consumer super-app clone.

The judges are evaluating market impact, technology stack, feasibility, scalability, and SEBI mandate alignment. A working B2B dashboard with a real agentic workflow hits all five. A mobile app only makes sense for PS3, but PS3 is integration-heavy and crowded.

---

## 2. Why Web Dashboard Wins

| Product form | Fit | Verdict |
| --- | --- | --- |
| Mobile app | Good for retail investor PS3 only; weak for compliance/circular workflows. | Avoid for flagship. |
| Simple website | Good for marketing, bad for prototype proof. | Optional landing page only. |
| Chatbot | Easy but crowded; looks like low-effort RAG. | Avoid as core. |
| Browser extension | Good for PS1 phishing/authentication, not PS2. | Possible separate PS1 idea, not flagship. |
| API-only product | Hard to demo visually. | Add API/export, but not core. |
| Desktop web dashboard | Best for compliance teams, auditors, SEBI/MII judges, evidence review, source citations. | Build this. |
| Web dashboard + agent backend + audit export | Strongest RegTech demo. | Winning form. |

Regulators trust workflows, citations, controls, review logs, evidence, and exports. They do not trust black-box AI magic.

---

## 3. Product Positioning

### One-line pitch

RegOS Sentinel turns SEBI circulars into clause-cited compliance tasks, evidence workflows, and audit-ready proof packs in minutes.

### What it is

A supervised agentic compliance operating layer for SEBI-regulated intermediaries.

### What it is not

It is not legal advice, not autonomous compliance, and not a replacement for compliance officers.

### First user

Small or mid-sized stock broker compliance team.

### Judge-facing second user

SEBI or MII observer who wants aggregate compliance readiness visibility.

---

## 4. Exact Product Surfaces to Build

### Surface 1: Compliance Cockpit

Purpose: first screen judges see.

Must show:

- selected entity profile: `Small Stock Broker`;
- corpus loaded: Stock Broker Master Circular, CSCRF, SCORES/ODR;
- obligation count;
- open tasks;
- overdue tasks;
- evidence completion score;
- risk heatmap;
- latest circular impact.

Why it wins:

It immediately looks like deployable software, not a research notebook.

### Surface 2: Circular Ingestion + Source Viewer

Purpose: prove that the system works from real SEBI documents.

Must show:

- upload/select SEBI circular PDF;
- extracted sections;
- source text pane;
- highlighted clause span;
- generated obligation beside the source;
- confidence score;
- "needs human review" status.

Why it wins:

This kills the "LLM hallucination" objection. Every output is traceable.

### Surface 3: Obligation Compiler

Purpose: show the core AI/agentic differentiator.

Each obligation should have structured fields:

| Field | Example |
| --- | --- |
| `actor` | Stock Broker / CISO / Compliance Officer |
| `action` | Conduct cyber audit after audit period |
| `deadline` | Annual / within stated timeline |
| `condition` | Applicable to small RE / qualified RE / all REs |
| `evidence_required` | Audit report, VAPT closure evidence, board approval |
| `source_clause` | Exact circular section/page |
| `confidence` | 0.91 |
| `review_status` | Draft / approved / rejected |

Why it wins:

This is not "chat with circulars." It is a regulatory text compiler.

### Surface 4: Applicability Filter

Purpose: show that rules differ by intermediary type.

Must show:

- entity category;
- scale/threshold inputs;
- which obligations are in scope;
- which obligations are out of scope;
- reason for applicability.

Example:

```text
Entity: Small Stock Broker
CSCRF category: Small-size RE
In scope: asset inventory, cyber audit, incident handling
Not in scope: MII-only dashboard submission requirement
Reason: clause applies only to MIIs and Qualified REs
```

Why it wins:

Regulators care about wrong applicability. This is a major trust feature.

### Surface 5: Compliance Workflow Board

Purpose: turn regulation into operational action.

Must show Kanban/status workflow:

- `Not Started`;
- `Assigned`;
- `Evidence Pending`;
- `Under Review`;
- `Approved`;
- `Exception`.

Each task should show:

- owner;
- deadline;
- regulatory source;
- required evidence;
- risk severity;
- audit history.

Why it wins:

This directly matches PS2: regulatory text to operational action.

### Surface 6: Evidence Locker

Purpose: show compliance proof.

Must support synthetic evidence uploads:

- VAPT report sample;
- IT asset inventory CSV;
- board/partner approval note;
- cyber audit certificate;
- grievance SLA log;
- incident response drill evidence.

For each evidence item:

- link to obligation;
- reviewer;
- timestamp;
- approval/rejection;
- missing evidence warning.

Why it wins:

Evidence is where compliance becomes real. Most teams will stop at extraction.

### Surface 7: Change-Impact Simulator

Purpose: signature demo moment.

Button:

```text
Simulate New SEBI Circular
```

Output:

- new obligations added;
- existing obligations changed;
- controls impacted;
- owners affected;
- tasks generated;
- evidence requirements changed;
- risk score movement.

Demo line:

"This is the moment that normally takes a compliance team days or weeks. RegOS shows the operational impact in under a minute."

Why it wins:

It creates a memorable judge moment and proves the system is more than a static dashboard.

### Surface 8: Audit Pack Export

Purpose: close the loop.

Export as PDF/HTML:

- entity profile;
- corpus list;
- obligation table;
- source citations;
- evidence list;
- approval log;
- exceptions;
- open risks;
- model limitations/disclaimer.

Why it wins:

Judges can imagine this being used in an actual audit, inspection, or internal compliance review.

### Surface 9: SupTech / SEBI-MII View

Purpose: judge appeal.

Show anonymized aggregate dashboard:

- number of intermediaries onboarded;
- obligations by compliance status;
- common gaps;
- circulars with slow implementation;
- high-risk unresolved controls;
- readiness trend.

Important: use synthetic/anonymized data only.

Why it wins:

This turns the product from only RegTech for one broker into SupTech intelligence for the regulator/MII ecosystem.

---

## 5. Backend Pieces Required

### Required by Aug 9

| Component | Build detail |
| --- | --- |
| Document loader | Preload 3-5 SEBI PDFs/markdown files. |
| Parser | Extract chunks, sections, tables; manual correction allowed for demo. |
| Retrieval | pgvector or lightweight local vector store. |
| Obligation extractor | LLM/function-call strict JSON schema. |
| Citation validator | Every displayed obligation must link to source span. |
| Applicability engine | Rules + simple classifier over entity profile. |
| Task generator | Obligation to owner/deadline/evidence workflow. |
| Evidence store | Upload synthetic files and map to obligations. |
| Audit export | Generate PDF/HTML report. |
| Metrics overlay | Show time-to-plan, citation coverage, extraction precision sample. |

### Optional for finals

| Component | Why |
| --- | --- |
| Live SEBI circular watcher | Stronger "Watcher agent" story. |
| DigiLocker/verifiable credential mock | DPI tick, but do not overbuild. |
| Slack/Jira/email connector mock | Shows enterprise integration. |
| Policy-as-code export | Differentiates from dashboards. |
| Second corpus for Investment Advisers | Proves scalability. |

---

## 6. Recommended Tech Stack

| Layer | Recommendation |
| --- | --- |
| Frontend | Next.js + React + Tailwind/shadcn or equivalent dashboard UI. |
| Backend | Python FastAPI. |
| Agents | LangGraph-style pipeline or explicit Python agent steps. |
| LLM | Hosted API for hackathon speed; design docs should mention VPC/on-prem option. |
| Database | Postgres. |
| Vector search | pgvector. |
| File storage | Local/S3-compatible storage for demo evidence. |
| PDF export | Playwright/WeasyPrint/HTML-to-PDF. |
| Deployment | Vercel frontend + Render/Fly/Railway API + Postgres, or single Docker Compose fallback. |
| Demo backup | Offline seeded mode with screenshots and local run. |

Do not spend time building native mobile. It lowers speed and does not improve PS2 scoring.

---

## 7. MVP Scope

### Must build

1. Dashboard home.
2. Document/source viewer.
3. Obligation extraction table with citations.
4. Entity profile + applicability filter.
5. Compliance workflow tasks.
6. Evidence upload/mapping with synthetic files.
7. Change-impact simulator.
8. Audit-pack export.
9. SupTech aggregate view with synthetic data.

### Should build

1. Labeled benchmark screen showing extraction precision/recall on 20-30 manually labeled obligations.
2. Human approval flow.
3. Risk heatmap.
4. Model card and DPDP/privacy page.
5. "Not legal advice, human review required" trust banner.

### Cut if time is tight

1. User auth.
2. Real-time collaboration.
3. Mobile responsiveness beyond basic.
4. Live circular scraping.
5. Real DigiLocker integration.
6. Complex role-based permissions.
7. Multi-language UI.
8. Multiple intermediary categories.

---

## 8. Demo Script: 6 Minutes

### Minute 0: Problem

"SEBI publishes regulatory obligations as circulars. Intermediaries must convert them into owners, deadlines, controls, evidence, and audit trails. Today that is manual, slow, and inconsistent."

### Minute 1: Entity setup

Open RegOS Sentinel:

- selected entity: `Small Stock Broker`;
- selected corpus: CSCRF + Stock Broker Master Circular + SCORES/ODR;
- dashboard shows compliance posture.

### Minute 2: Source-to-obligation

Open CSCRF source viewer:

- click a highlighted clause;
- show generated obligation;
- show actor/action/deadline/evidence;
- show citation and confidence;
- approve obligation.

### Minute 3: Operational workflow

Click "Generate Compliance Plan":

- tasks assigned to CISO, Compliance, Ops;
- deadlines created;
- evidence requirements listed;
- status board populated.

### Minute 4: Evidence and audit

Upload synthetic VAPT/evidence file:

- evidence maps to obligation;
- reviewer approves;
- audit log updates;
- dashboard score improves.

### Minute 5: Killer moment

Click "Simulate New Circular":

- impacted obligations appear;
- changed controls highlighted;
- new tasks generated;
- risk heatmap updates.

### Minute 6: Export + regulator view

Export audit pack:

- clause citations;
- evidence;
- approvals;
- unresolved gaps.

Switch to SupTech view:

- anonymized readiness across synthetic brokers;
- common compliance gaps;
- high-risk unresolved items.

Close:

"This is built to move from TechSprint prototype into SEBI Innovation Sandbox testing using public circulars, synthetic data first, and later MII/intermediary test environments."

---

## 9. What to Build for Each Problem Statement

If the team changes PS, this is the product form map.

| PS | Best product form | Why | Win risk |
| --- | --- | --- | --- |
| PS1 synthetic media/phishing | Web verifier + browser extension + incident dashboard | Needs content verification at point of use plus institutional response. | Detection datasets and false positives are hard. |
| PS2 agentic compliance | Desktop web dashboard + agent backend + audit export | Directly matches regulatory text to operational action. | Must avoid looking like generic RAG. |
| PS3 retail super app | Mobile-first PWA + portfolio dashboard + suitability engine | Retail users need mobile access. | Real integrations with brokers/depositories are hard in hackathon timeline. |
| PS4 SME IPO documents | Web wizard + draft generator + merchant-banker review dashboard | SME promoters and reviewers need guided document prep. | Legal liability and disclosure correctness are hard. |

Chosen flagship remains PS2 because it has the best feasibility-to-impact ratio.

---

## 10. Winning Quality Bar

The build must prove these in the demo:

| Proof | Minimum evidence |
| --- | --- |
| It is real software | Hosted link or local live demo, not slides only. |
| It uses SEBI corpus | At least 3 real public SEBI documents. |
| It is agentic | Visible pipeline: Watcher/Interpreter/Mapper/Evidence/Auditor. |
| It is trustworthy | Clause citations, confidence, human approval, audit logs. |
| It is operational | Tasks, owners, deadlines, evidence, status. |
| It is measurable | Time-to-plan, citation coverage, extraction precision sample. |
| It is safe | Synthetic data, no PII, DPDP posture, no autonomous legal advice. |
| It can scale | Same schema can extend to IAs, AMCs, RTAs, MIIs. |
| It helps SEBI | SupTech aggregate view or sandbox-readiness pack. |

---

## 11. Submission Assets to Prepare

Build these alongside the product:

1. Working demo URL.
2. Backup local Docker demo.
3. 5-7 minute demo video.
4. 8-slide pitch deck.
5. One-page architecture diagram.
6. Source bibliography.
7. Synthetic data disclosure.
8. Model card and AI-risk note.
9. DPDP/privacy note.
10. Sandbox pilot plan.
11. Benchmark sheet for extracted obligations.
12. Audit-pack sample PDF.

---

## 12. Final Build Decision

Build a **desktop-first web application**.

The winning artifact is not the UI alone. It is:

```text
Real SEBI documents
    -> cited obligations
    -> applicability logic
    -> operational workflow
    -> evidence proof
    -> audit pack
    -> regulator/MII readiness view
```

If the team builds this cleanly, it will look like something SEBI can actually mentor through the Innovation Sandbox. That is the win condition.

