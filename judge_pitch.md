# judge_pitch.md — RegOS Sentinel

> Pitch ladder + demo narration + judge Q&A. Generated 2026-06-29.

## 30-second pitch
SEBI publishes obligations as human-readable circulars, but a small stock broker's compliance team translates each one by hand into who-does-what, by-when, with-what-evidence — slow, uneven, un-auditable. RegOS Sentinel is an agentic compliance OS: AI agents watch for new circulars, extract clause-cited obligations, map them to the broker's owners and controls, generate evidence tasks, and produce an audit pack — every line traceable to its source clause, every output human-approved. Circular-to-action drops from weeks to minutes.

## 2-minute pitch
**Problem.** SEBI's Investor Survey 2025 shows intermediaries cite complexity and information gaps at 95%, and investor complaints skew to operational failures — platform issues 47%, mis-selling 41%, poor response 34%, grievance delays 30%. The root cause PS2 names is precise: regulatory text is unstructured, but compliance systems need structured, auditable rules. Today that bridge is manual legal interpretation, circular-by-circular — which is why implementation is delayed and uneven, especially at lean-team brokers.

**Solution.** RegOS Sentinel runs five supervised agents — Watcher, Interpreter, Mapper, Evidence, Auditor — each narrow and auditable, each gated by a human. Watcher detects new/amended circulars. Interpreter extracts obligations into a strict schema — actor, action, deadline, evidence, applicability — every one bound to a verbatim source clause with a confidence score. Mapper assigns owners and controls. Evidence generates tasks and validates uploads. Auditor assembles an audit pack and a management risk heatmap.

**Why us, why now.** LLMs can finally structure regulatory text — but a regulator needs verifiability, not a chatbot. So everything is cited, scored, and human-approved, with the AI's own actions logged as a compliance artifact. Enterprise tools like Corlytics and Ascent prove the category is valuable, but none are SEBI-specific, agentic, or usable by a small intermediary. We demo on real public SEBI circulars — CSCRF, the Stock Broker Master Circular, SCORES-to-ODR — with synthetic broker evidence, and we ship a regulator-grade readiness pack: model card, risk register, DPDP statement, human-in-loop policy.

**Ask.** A pilot path from one broker to an industry body to an MII, and a SupTech aggregate view that gives SEBI anonymized readiness visibility across intermediaries.

## 5-minute demo narration
1. "Meet a small stock broker. I select its profile and size." 
2. "Our Watcher agent ingests two real SEBI documents — the CSCRF circular and the Stock Broker Master Circular." 
3. "The Interpreter compiles them into structured obligations — actor, action, deadline, evidence required. Notice this isn't a chat answer; it's a register." 
4. "I click one obligation — the source viewer highlights the exact clause it came from, with a confidence score and its human-review status. Nothing is taken on faith." 
5. "The Mapper turns these into a compliance plan — tasks assigned to the CISO, Compliance Officer, Operations, Grievance Officer." 
6. "I upload evidence — a SOC report, a log inventory, a grievance log — and the evidence graph shows audit readiness." 
7. "**Now the key moment.** A new circular drops. Watch — RegOS simulates its impact instantly: here are the controls and tasks it changes. What took compliance teams weeks now takes minutes." 
8. "Finally, I export the audit pack — every obligation, its evidence, its owner approval, and its source citation — plus a management heatmap. And here's our benchmark: extraction precision on a hand-labeled set, with 100% citation coverage on everything shown." 

## Expected judge questions & answers
| Q | A |
|---|---|
| "Isn't this just RAG over PDFs?" | No — output is a structured, cited obligation graph plus an evidence workflow and audit pack, not a chat transcript. Here's a side-by-side: a chatbot gives prose; RegOS gives owners, deadlines, evidence, and a clause citation per line. |
| "How do I know it didn't hallucinate?" | Every obligation must point to a verbatim source span (retrieval-grounded); low-confidence items route to human review; and we report precision/recall/citation-coverage on a labeled benchmark. |
| "Is this legal advice? Who's liable?" | It drafts compliance actions for a human officer to approve — explicitly not legal advice. Every AI step and human approval is logged. |
| "Can a small team build and run this?" | The MVP is narrow — one intermediary, three public corpora, synthetic evidence — and it's running live now. |
| "You have no real broker data." | The regulatory corpus is real and public; broker process/evidence is clearly-labeled synthetic, with named production connectors (Jira/ServiceNow/DigiLocker). |
| "How does it scale beyond brokers?" | The obligation schema is corpus-agnostic — same pipeline onboards investment advisers, RTAs, AMCs, and future circulars. |
| "What's the SEBI benefit, not just the broker's?" | The SupTech aggregate view gives SEBI anonymized implementation-readiness by intermediary class — supervision value, no raw PII. |
| "What about data privacy?" | No PII in the prototype; RBAC, encryption, data minimization, and a DPDP-aligned statement in our readiness pack. |
| "What if the LLM API isn't allowed?" | The model sits behind a provider abstraction; we can swap to an open-weight/on-prem model with no architecture change. |
| "What's the one number that proves impact?" | Circular-to-operational-action time: weeks of manual interpretation → minutes, with a 100%-cited, audit-ready output. |
