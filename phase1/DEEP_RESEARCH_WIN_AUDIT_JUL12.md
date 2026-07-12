# Deep Research: Can RegOS Sentinel Win SEBI TechSprint 2026?

Date: 2026-07-12  
Scope: Round-01 submission quality, eventual winning readiness, demo-video strategy, SaaS motion language, and highest-value product additions.

## Executive Summary

RegOS Sentinel is a strong Round-01 concept because it fits the official problem statement literally and addresses the trust problem created by using AI for compliance. The organizer announcement explicitly says not to build the prototype yet during Idea Submission. The proposal already contains the right strategic components: clause-level citations, human approval, an obligation graph, change-impact analysis, a small-broker wedge, and a sandbox path. Against the five published TechSprint criteria, the current idea package scores approximately **89/100**.

It is not currently a credible final winner. The application directory contains no working product implementation, while the event's second round explicitly evaluates a working prototype and demo video. Motion polish can improve comprehension and memorability, but it cannot substitute for feasibility evidence. Current final-winning readiness is approximately **72/100**.

The highest-return path is a narrow working golden path rather than adding more speculative modules. One real SEBI source should produce cited obligations, a human-approved task, an amendment diff, and a small audit pack. Add Inspector Mode and an evaluation harness, then build the 112-second product-led film around those real behaviors. That combination can credibly reach approximately **93/100**.

## Key Findings

### 1. The official rubric rewards RegOS's direction

The event publishes five criteria: Market Impact, Technology Stack, Feasibility, Scalability, and Alignment with SEBI's Mandate. The literal PS2 ask is to turn regulatory text into structured, machine-actionable, auditable compliance logic for intermediaries.

RegOS aligns unusually well with that wording. The strongest differentiators are not the number of agents or the visual brand. They are operational outputs, auditability, applicability, and verifiable human control.

Primary source: https://hackculture.io/hackathons/sebi-securities-market-techsprint

### 2. The project currently has an implementation credibility gap

`regos-motion/` contains a substantial coded visualization system. `regos-sentinel/` currently contains directories but no application files. Therefore:

- the deck and video can demonstrate the intended experience
- they cannot honestly be described as a working product
- seeded metrics cannot be presented as measured performance
- Round-02 readiness is materially below the idea score

This is the largest risk to winning.

### 3. SEBI's AI-governance direction creates a specific product opportunity

Regulation 16C makes intermediaries responsible for AI/ML outputs, data integrity, and compliance. SEBI's responsible-AI consultation work emphasizes governance, ongoing monitoring, model testing, auditability, explainability, model versioning, replay, third-party oversight, human-in-the-loop controls, and controlled testing.

RegOS should turn those ideas into an inspectable interface instead of mentioning them only in architecture text. Inspector Mode is therefore more valuable than another broad dashboard.

Primary sources:

- https://www.sebi.gov.in/legal/regulations/feb-2025/securities-and-exchange-board-of-india-intermediaries-amendment-regulations-2025_91809.html
- https://www.sebi.gov.in/reports-and-statistics/reports/jun-2025/consultation-paper-on-guidelines-for-responsible-usage-of-ai-ml-in-indian-securities-markets_94687.html

### 4. The 95% statistic is valid but easy to misuse

The SEBI Investor Survey 2025's intermediary-perspective chapter reports complexity and lack of information as a key barrier at 95%. The intermediary survey covered 1,313 respondents across intermediary categories.

This supports the broader need for clearer securities-market information. It does not directly prove demand for RegOS or measure compliance-team workload. The deck must preserve the exact intermediary-perspective framing and avoid turning the number into a customer-validation claim.

Primary source: https://www.sebi.gov.in/sebi_data/commondocs/jan-2026/Investor%20Survey%202025%20Main%20Report.pdf

### 5. Competitive proximity increases the proof burden

OnFinance ComplianceOS and global regulatory-obligation platforms show that the category exists. This validates demand while weakening any generic novelty claim.

RegOS's defensible wedge is:

- small and mid-size SEBI intermediaries
- named SEBI broker/CSCRF corpus
- open, inspectable benchmark
- clause-level citations
- applicability-aware obligation compilation
- human-gated Reg-Diff
- sandbox-readable governance evidence

The film should demonstrate this wedge, not merely state it.

### 6. The best demo film is shorter than the existing 172-second cut

The screenshot shows a maximum three-minute demo link, but the link is competing for judge attention. Devpost's guidance treats the demo video as one of the first judging artifacts and recommends a concise demonstration around three minutes. Recent judging commentary similarly emphasizes making the demo the pitch and showing the before/after contrast clearly.

For Round 01, **112 seconds** is the stronger choice:

- enough time for a complete narrative
- short enough to maintain attention
- forces one golden path
- leaves no room for a feature catalog
- matches the requested 1.8-2.0 minute range

Supporting sources:

- https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video
- https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/

## Detailed Evaluation

### Market Impact: 18/20 idea, 17/20 readiness

Strengths:

- meaningful operational pain
- direct relationship to compliance and supervision
- focused initial customer
- visible value metric: circular-to-plan time and audit completeness

Gaps:

- no compliance-officer interview or design-partner evidence
- the Investor Survey statistic is indirect
- no measured baseline for current manual effort

Highest-value addition: one documented interview or written validation from a broker compliance professional, with no invented affiliation or endorsement.

### Technology Stack: 18/20 idea, 13/20 readiness

Strengths:

- explicit state-machine/agent workflow
- deterministic verification layer
- structured schema
- source retrieval and citation grounding
- human gates and audit trail

Gaps:

- no running pipeline
- no benchmark results
- too many optional technologies risk looking rubric-driven
- blockchain, Neo4j, DPI, multilingual output, and multiple connectors dilute the core story

Highest-value addition: implement the extraction, verification, review, diff, and export path before optional integrations.

### Feasibility: 17/20 idea, 8/20 readiness

Strengths:

- organizers explicitly defer prototype development to the next phase
- public source documents
- synthetic entity and evidence data avoid PII risk
- narrow broker/CSCRF scope is buildable

Gaps:

- empty application repository
- no latency/cost measurements
- no parser robustness evidence
- no deterministic fallback for demo failure

Highest-value addition: a seeded offline fallback backed by the same schema as the live pipeline, clearly marked as fallback data.

### Scalability: 17/20 idea, 15/20 readiness

Strengths:

- corpus-agnostic obligation schema
- entity applicability profiles
- expansion across intermediary types
- MII and SupTech path

Gaps:

- onboarding cost for a new corpus is unknown
- review capacity and exception volume are unknown
- model and vector-store costs are not estimated
- no tenant isolation or authorization implementation

Highest-value addition: publish a one-page operating model showing cost per document, expected review rate, and steps to add a new circular family.

### SEBI Alignment: 19/20

Strengths:

- direct PS2 match
- investor-protection and supervision framing
- human oversight
- source traceability
- sandbox posture
- no live trading or PII

Remaining gap: make model replay, testing, monitoring, and pause/kill controls visible.

## Motion Analysis

### 05:28 recording

The useful design pattern is a large blue typographic cover with an architectural object intersecting the title, followed by a full-field blue transition into a contrasting light editorial page. The motion is simple but committed: type and object share depth; the background becomes the transition.

Use for RegOS:

- title monolith
- one colossal brand beat
- one full-field wipe into real product input

Do not use for every scene. Repeating giant titles would reduce the product-demo ratio.

### 06:29 recording

The useful Jitter patterns are coordinated color reveals, square-logo scale transitions, ripple responses, and shape-led wipes. The apparent jitter is a brief velocity accent created by overshoot and rapid state changes, not continuous shake.

Use for RegOS:

- icon-to-field logo reveal
- approval ripple
- teal verification edge
- 4-6 frame impact jitter around cuts

### 06:10 Trackly recording

This is the main product-film grammar:

- quiet problem typography
- centered device/product rise
- sequential notifications
- logo assembly
- repeated UI push-ins
- state-driven filters and counters
- colossal caret typography
- restrained close

RegOS should adopt the grammar while replacing Trackly's consumer job-feed behavior with citation, applicability, human approval, and change-impact behavior.

## Contrarian Views and Risks

### Risk 1: A polished fake can reduce trust

If judges recognize that the film implies functionality that does not exist, high production value becomes a liability. Label Round-01 UI as prototype visualization and clearly label synthetic or simulated data.

### Risk 2: Too many governance features can make the product feel bureaucratic

Inspector Mode should appear only when a judge needs proof. The normal compliance workflow must remain fast and readable. Governance should be available, not constantly obstructive.

### Risk 3: The small-broker wedge may be challenged

Enterprise competitors may already serve securities firms. Do not claim that all brokers are ignored. Claim that RegOS is optimized for inspectability, a focused public corpus, and a sandboxable small-RE deployment path.

### Risk 4: Five agents can look like naming theater

The demo must show different state transitions or outputs produced by the agents. If all five only generate notification cards, judges may see a single pipeline split into marketing labels.

### Risk 5: A 112-second film can become too fast

At least 90-150 frames of stable reading time are needed after each major interaction. Motion should be concentrated around causes and transitions, not applied continuously.

## Open Questions

1. Is the Round-01 demo-video field mandatory or optional on submission?
2. Can the video be hosted as an unlisted YouTube link, or must it use another platform?
3. Is there access to the problem-statement webinar recording or organizer Q&A?
4. Can one broker compliance professional review the workflow before Round 02?
5. Which real SEBI circular section will be the single golden-path input?
6. Which metrics can be measured honestly before the video is rendered?
7. Is the repository intended to be public before Round 02?

## Recommended Decision

Proceed with RegOS Sentinel. Do not pivot.

Immediate priority order:

1. Submit the strongest truthful PDF.
2. Build the 112-second Round-01 pitch/prototype-visualization film.
3. Start the working golden path immediately after submission.
4. Replace seeded film segments with real captured behavior.
5. Add Inspector Mode and the 50-obligation evaluation harness.
6. Keep SupTech, DPI, and broad integrations as expansion evidence.

## Sources

- https://hackculture.io/hackathons/sebi-securities-market-techsprint — official public event details, process, criteria, and problem statements
- https://www.sebi.gov.in/media-and-notifications/press-releases/jun-2026/launch-of-securities-market-techsprint-at-global-fintech-fest-2026-gff-26-_102286.html — official launch
- https://www.sebi.gov.in/legal/regulations/feb-2025/securities-and-exchange-board-of-india-intermediaries-amendment-regulations-2025_91809.html — Regulation 16C source
- https://www.sebi.gov.in/reports-and-statistics/reports/jun-2025/consultation-paper-on-guidelines-for-responsible-usage-of-ai-ml-in-indian-securities-markets_94687.html — responsible AI/ML consultation
- https://www.sebi.gov.in/sebi_data/commondocs/jan-2026/Investor%20Survey%202025%20Main%20Report.pdf — survey evidence and exact 95% framing
- https://www.sebi.gov.in/sebi_data/faqfiles/sep-2025/1758091557500.pdf — inter-operable regulatory sandbox context
- https://jitter.video/templates/ui-elements/ — current UI motion pattern library
- https://jitter.video/template/cursor/ — cursor motion reference
- https://help.jitter.video/en/articles/9909561-create-a-click-animation — coordinated cursor/target click behavior
- https://jitter.video/templates/logos/ — logo motion references
- https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video — demo-video guidance
- https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/ — recent judging perspective

## Rerun Inputs

workflow: firecrawl-deep-research  
topic: RegOS Sentinel winning readiness for SEBI Securities Market TechSprint 2026  
depth: exhaustive  
output: markdown report plus implementation blueprint
