# SEBI Securities Market Hackathon / TechSprint: Institutional Need, Prior Art, and Winner Intelligence

Research date: 2026-06-29  
Folder: `/Users/mac/Desktop/sebi hackathon`  
Purpose: understand why SEBI is running the 2026 Securities Market TechSprint, what institutional need it is trying to solve, what previous SEBI/GFF efforts show, and what comparable regulator hackathon winners did.

---

## 1. Executive Read

SEBI did not organize the Securities Market TechSprint just to run a student hackathon. The official 2026 press release says SEBI launched it with market infrastructure institutions and industry bodies to "harness India's technological talent" for "real-world challenges" in securities markets, specifically to empower retail investors and improve transparency, efficiency, compliance, and accessibility. The 2025 SEBI-GFF hackathon used almost the same language, making 2026 a continuation of a deliberate innovation pipeline rather than a one-off event.

The deeper need is visible from SEBI's own stack of policies and problem statements:

| Layer | SEBI need | Evidence |
| --- | --- | --- |
| Investor protection | Fraud, phishing, deepfakes, mis-selling, unsuitable risk-taking, fake apps, misleading communications. | 2026 PS1, Investor Survey 2025, F&O loss study, CSCRF, investor-awareness campaigns. |
| Market development | Broaden retail access beyond equities; deepen bond/REIT/InvIT/SME capital market participation. | 2025 PS on bond liquidity and investor education; 2026 PS3 and PS4; Investor Survey 2025. |
| Supervision and compliance | Convert circulars, master circulars, and cyber/compliance rules into auditable operational systems. | 2025 "Member Compliance Monitoring"; 2026 "Agentic Compliance"; CSCRF and Regulatory Sandbox evaluation criteria. |
| Innovation sourcing | Identify prototypes that can move into SEBI Innovation Sandbox or controlled market pilots. | 2019/2021 Innovation Sandbox; 2020 Regulatory Sandbox; 2025 and 2026 launch PDFs both mention SEBI Innovation Sandbox mentorship. |

The best strategic interpretation: SEBI is trying to source deployable RegTech/SupTech and investor-protection prototypes from the outside market, using GFF as distribution, MIIs as implementation partners, and the Innovation Sandbox as a post-hackathon funnel.

The public record does not show a clean official SEBI page naming all 2025 winners and project details. I found public/social traces of 2025 winners, especially "Team Final Commit" and LinkedIn profiles/posts claiming SEBI/NSE/BSE/GFF hackathon wins, but these should be treated as weak evidence until verified with organizers. The stronger intelligence comes from official 2025 SEBI-GFF launch materials and comparable regulator hackathons like RBI HaRBInger and MAS/SFF Global FinTech Hackcelerator.

The core winner pattern across regulators: narrow, operational, explainable, regulator-deployable tools beat broad "AI platform" pitches. A winning SEBI 2026 entry should show a working, auditable prototype that reduces a measurable regulatory/investor pain, cites its rule basis, handles privacy/security, and has a credible path into an MII/intermediary/SEBI sandbox pilot.

---

## 2. Evidence Confidence Map

| Claim type | Confidence | How to use |
| --- | --- | --- |
| SEBI 2026 TechSprint purpose, PS titles, prizes, Innovation Sandbox mentorship | High | Cite directly in pitch/research. |
| SEBI 2025 Hackathon purpose, PS areas, prizes, Innovation Sandbox mentorship | High | Cite directly as predecessor event. |
| SEBI Innovation Sandbox and Regulatory Sandbox objectives | High | Cite directly to explain SEBI's innovation adoption funnel. |
| Investor pain stats from SEBI Investor Survey and F&O study | High | Cite directly for "why now." |
| 2025 SEBI hackathon winners/project names from social posts | Medium-low | Mention only as unverified public traces; verify before putting in final deck. |
| RBI/MAS comparable hackathon winners | Medium-high to high | Use as pattern evidence, especially where official pages exist. |
| Hidden motivations/institutional strategy | Inferred | Present as analysis based on official evidence, not as SEBI-stated intent. |

---

## 3. Official Ground Truth: 2026 SEBI TechSprint

Source: SEBI press release PR No. 34/2026, "Launch of Securities Market TechSprint at Global Fintech Fest 2026 (GFF '26)", Mumbai, June 22, 2026.  
URL: https://www.sebi.gov.in/media-and-notifications/press-releases/jun-2026/launch-of-securities-market-techsprint-at-global-fintech-fest-2026-gff-26-_102286.html  
Embedded PDF extracted from: https://www.sebi.gov.in/sebi_data/attachdocs/jun-2026/1782127785109.pdf

### 3.1 What SEBI explicitly says it wants

The official 2026 launch PDF says:

- SEBI launched the Securities Market TechSprint "in collaboration with leading market infrastructure institutions and industry bodies."
- The theme is "Innovation in Action: Shaping Securities Market for Tomorrow."
- The initiative aims to "harness India's technological talent to address real-world challenges within the securities market."
- It invites "cutting-edge, digital solutions" focused on:
  - empowering retail investors;
  - bolstering transparency;
  - bolstering efficiency;
  - bolstering compliance;
  - bolstering accessibility across India's capital markets.
- Shortlisted innovations "will also be considered for mentorship through the SEBI Innovation Sandbox."

This wording matters. SEBI is not asking for idea decks. It is asking for digital solutions that can show operational impact and possibly continue into its sandbox system.

### 3.2 2026 problem statements

The official 2026 press release lists four problem statements:

| PS | Problem statement | Institutional pain |
| --- | --- | --- |
| 1 | AI-Driven Detection of Synthetic Media and Phishing Attacks in Securities Markets | GenAI-enabled impersonation, phishing, fake financial communications, investor manipulation, trust failure. |
| 2 | Agentic Compliance - From Regulatory Text to Operational Action | Circulars/master circulars are unstructured human text, while intermediaries need structured, auditable workflows. |
| 3 | Super App for Unified Multi-Asset Investing and Awareness for Retail Investors | Retail investors have fragmented holdings, low alternate-product awareness, and poor cross-asset intelligence. |
| 4 | Simplifying IPO offer document preparation for SMEs | SME IPO drafting is expensive, slow, expert-heavy, and blocks smaller issuers from public capital markets. |

### 3.3 2026 prize signal

The official 2026 launch PDF lists:

| Prize | Amount |
| --- | --- |
| 1st Prize | INR 2,50,000 |
| 2nd Prize | INR 2,00,000 |
| 3rd Prize | INR 1,50,000 |
| Jury Recommendation | INR 50,000 each |

Prize size is modest relative to industry costs. That implies the real value is not cash; it is regulator/MII visibility, GFF stage access, and potential sandbox mentorship.

---

## 4. Official Ground Truth: 2025 SEBI-GFF Hackathon

Source: SEBI press release PR No. 42/2025, "Launch of Securities Market Hackathon at Global Fintech Fest 2025 (GFF '25)", Mumbai, July 18, 2025.  
URL: https://www.sebi.gov.in/media-and-notifications/press-releases/jul-2025/launch-of-securities-market-hackathon-at-global-fintech-fest-2025-gff-25-_95410.html  
Embedded PDF extracted from: https://www.sebi.gov.in/sebi_data/attachdocs/jul-2025/1753078175151.pdf  
Hack2Skill event page: https://hack2skill.com/event/sebi-hackathon  
CDSL participant communiqué mirror: https://avantiscdnprodstorage.blob.core.windows.net/legalupdatedocs/44932/CDSL-notified-regarding-the-Launch-of-Securities-Market-Hackathon-at-Global-Fintech-Fest-2025-GFF25-JULY252025.pdf

### 4.1 2025 event purpose

The 2025 launch PDF states:

- SEBI launched the hackathon with BSE, CDSL, NSDL, and KFintech.
- Theme: "Driving Innovation and tech oriented solutions in securities market."
- Goal: bring together India's brightest minds to build "digital-first solutions" for "real-world challenges" in securities markets.
- Participants had to build tools that:
  - empower retail investors;
  - enhance transparency;
  - enhance efficiency;
  - enhance compliance;
  - enhance accessibility across capital markets.
- Selected solutions could receive mentorship through the SEBI Innovation Sandbox.

This is almost the same institutional language as 2026. The difference is that 2026's title changed from "Hackathon" to "TechSprint" and its problem statements shifted toward AI threats, agentic compliance, multi-asset retail intelligence, and SME IPO drafting.

### 4.2 2025 problem areas

The 2025 official PDF and CDSL communiqué list the 2025 problem areas:

| 2025 area | What it reveals about SEBI's needs |
| --- | --- |
| Fraud Prevention | SEBI wanted digital tools to stop investor/market abuse. |
| Enhancing Retail Investor Education & Engagement | SEBI saw investor awareness and trust as market-development bottlenecks. |
| Improving Liquidity in Bond Markets | SEBI wanted deeper non-equity capital-market participation. |
| Member Compliance Monitoring | SEBI wanted tech-enabled supervision/compliance for regulated market participants. |

### 4.3 2025 Hack2Skill event page: evaluation criteria

Hack2Skill's 2025 event page describes the event as powered by BSE, CDSL, KFinTech, NSDL, and SEBI, and says it aimed to catalyze responsible, tech-led innovation aligned with SEBI's vision.

The listed evaluation criteria:

| Criterion | Meaning |
| --- | --- |
| Market Impact | Depth of improvement in market infrastructure, investor safety, investor access, or compliance. |
| Technology Stack | Advanced tech such as AI/ML, LLMs, blockchain, NLP, Digital Public Infrastructure, and robust cybersecurity. |
| Feasibility | Real-world deployability and ease of implementation. |
| Scalability | Ability to scale scope, users, transactions, velocity. |
| Alignment with SEBI's Mandate | Investor protection, market development, and supervision. |

This rubric is a direct signal of what SEBI rewards: impact, technical substance, deployability, scale, and mandate alignment.

---

## 5. Strategic Arc: SEBI's Innovation Funnel Before the Hackathons

The SEBI-GFF hackathons sit on top of a longer institutional journey.

### 5.1 2017: Committee on Financial and Regulatory Technologies

SEBI constituted a Committee on Financial and Regulatory Technologies (CFRT) in 2017 under T.V. Mohandas Pai to examine FinTech/RegTech opportunities and challenges. Public secondary sources and SEBI-referenced citations point to this as the starting point for formal fintech/regtech policy exploration.

Official URL referenced in secondary sources: https://www.sebi.gov.in/media/press-releases/aug-2017/sebi-constitutes-committee-on-financial-and-regulatory-technologies-cfrt-_35526.html  
Secondary source: https://www.finseclaw.com/article/constitution-of-committees-on-fmc-and-cfrt

Interpretation: SEBI has been thinking about FinTech and RegTech for nearly a decade. The TechSprint is not random; it is a public innovation challenge attached to a pre-existing regulatory innovation strategy.

### 5.2 2019: Innovation Sandbox

Source: SEBI circular "Framework for Innovation Sandbox", May 20, 2019, SEBI/MRD/CSC/CIR/P/2019/64.  
URL: https://www.sebi.gov.in/legal/circulars/may-2019/framework-for-innovation-sandbox_43027.html  
PDF: https://www.sebi.gov.in/sebi_data/attachdocs/may-2019/1558332776360.pdf

SEBI's 2019 circular says:

- Indian capital markets have been early adopters of technology.
- SEBI believes FinTech can profoundly impact securities-market development.
- FinTech can help maintain an efficient, fair, and transparent securities market ecosystem.
- SEBI wanted FinTech firms to access market-related data, particularly trading and holding data, because such data is not otherwise readily available.
- The Innovation Sandbox would let FinTech firms and non-SEBI-regulated entities test proposed solutions offline, isolated from the live market.

Key design choices:

| Design choice | What it reveals |
| --- | --- |
| Historical/anonymized data, not live data | SEBI wants innovation without market-risk leakage. |
| Depository, exchange, and RTA data | SEBI wants solutions built on actual securities-market rails. |
| APIs/test infrastructure | SEBI wants repeatable testing, not one-off demos. |
| Confidentiality and end-user agreements | Data misuse/IP/security are core concerns. |
| Cybersecurity certificate | Security is mandatory even before real deployment. |
| Benefits to consumers and capital market | Investor benefit is a gate, not decoration. |
| Post-testing plan | SEBI wants prototypes that can graduate. |

### 5.3 2020: Regulatory Sandbox

Source: SEBI circular "Framework for Regulatory Sandbox", June 5, 2020, SEBI/HO/MRD-1/CIR/P/2020/95.  
URL: https://www.sebi.gov.in/legal/circulars/jun-2020/framework-for-regulatory-sandbox_46778.html  
PDF: https://www.sebi.gov.in/sebi_data/attachdocs/jun-2020/1591360859798.pdf

The 2020 Regulatory Sandbox moves from offline test-data experimentation to controlled live testing for SEBI-registered entities.

SEBI's eligibility criteria include:

| Criterion | Hackathon implication |
| --- | --- |
| Genuineness of innovation | The project must be materially different from existing workflows. |
| Genuine need to test | The demo should explain why existing manual/process tools are insufficient. |
| Limited prior testing | A hackathon prototype should show offline/synthetic validation first. |
| Direct benefits to users/market | Quantify investor/intermediary/regulator benefit. |
| No risks to financial system | Build privacy, security, and fail-safe logic into the design. |
| Testing readiness | Provide clear KPIs and test scenarios. |
| Deployment post-testing | Show a post-hackathon adoption plan. |

SEBI's evaluation parameters for sandbox applications also include risk-mitigated testing, disclosure requirements, grievance redressal, user rights, user confirmation of risks, and post-testing deployment or exit strategy.

Critical constraint: SEBI says no exemptions from investor protection, KYC, and AML principles. A winning TechSprint solution should not imply "AI will bypass compliance." It should reduce friction while preserving regulatory safeguards.

### 5.4 2021: Revised Innovation Sandbox

Source: SEBI circular "Revised Framework for Innovation Sandbox", February 2, 2021, SEBI/HO/ITD/ITD/CIR/P/2021/16.  
URL: https://www.sebi.gov.in/legal/circulars/feb-2021/revised-framework-for-innovation-sandbox_48983.html  
PDF: https://www.sebi.gov.in/sebi_data/attachdocs/feb-2021/1612273822602.pdf

SEBI revised the objective to promote:

- innovation in new products and services;
- new ways of delivering existing products and services;
- new opportunities in securities markets;
- existing services becoming more efficient, investor-friendly, and inclusive.

The 2021 circular is especially important because it says the Innovation Sandbox gives access to both test data and test environments to financial institutions, fintech firms, startups, non-SEBI-regulated entities, and individuals.

This explains why a hackathon winner can matter even if the team is not already a regulated intermediary. SEBI has a mechanism to let outsiders test offline with market data/test infrastructure before live deployment.

---

## 6. Why SEBI Organized This TechSprint: Institutional Needs

### 6.1 Need 1: Source deployable solutions faster than regulation alone can move

SEBI issues circulars, master circulars, consultation papers, and frameworks. But technology threats and operational complexity move faster than legal drafting cycles.

The TechSprint lets SEBI:

- discover outside builders already working with AI/NLP/cyber/DPI;
- test multiple approaches cheaply;
- observe demos before committing to pilots;
- identify ideas suitable for Innovation Sandbox mentorship;
- engage MIIs/intermediaries that may later implement the solution.

The official 2025 and 2026 press releases both use the phrase "real-world challenges", which is a signal that SEBI is not asking for speculative fintech ideas.

### 6.2 Need 2: Protect retail investors from a more complex threat environment

SEBI's 2026 PS1 is about AI-generated phishing, deepfakes, fake executives/regulators, AI-generated social media, and authentication of legitimate financial communications.

This reflects a shift from old fraud to synthetic trust attacks:

| Old fraud problem | New fraud problem |
| --- | --- |
| Generic phishing email | Hyper-personalized LLM-generated phishing. |
| Fake tipster | AI-generated market expert persona. |
| WhatsApp/Telegram pump-and-dump | Synthetic video/voice/social campaigns at scale. |
| Fake website/app | Fake app plus plausible communications and social proof. |
| Investor must guess what is official | Need machine-verifiable authenticity. |

SEBI's Investor Survey 2025 adds why this is dangerous:

- Social media, including YouTube, Instagram, and X, is a major awareness channel for non-investors.
- WhatsApp and Telegram also influence investor awareness.
- Investors and non-investors face complexity, lack of information, risk/return concerns, and trust/transparency gaps.

When retail education comes through social channels and those channels can be synthetically manipulated, investor protection becomes a technology problem.

### 6.3 Need 3: Convert regulatory text into operational compliance

PS2 is the clearest RegTech/SupTech need. The problem statement says the root problem is that regulatory frameworks exist as unstructured, human-readable text while operational compliance systems require structured, machine-actionable rules.

This is exactly what SEBI's own circular flow creates:

- new circulars and master circulars keep coming;
- different intermediary categories have different obligations;
- smaller intermediaries have limited compliance capacity;
- implementation can be delayed or inconsistent;
- evidence and audit trails are manual and fragile.

SEBI's CSCRF FAQ is an example of the burden:

- small regulated entities may keep IT asset inventories manually if they maintain periodic updates and compliance;
- vulnerabilities identified in VAPT have timelines for closure;
- high-severity patch failures can be tested against a one-week patch timeline;
- cloud providers and third-party vendors do not remove accountability from the regulated entity;
- MIIs and Qualified REs are expected to build automated tools/dashboards for compliance submission;
- Market-SOC exists partly because smaller/self-certification REs cannot always maintain their own SOC.

This is why PS2 exists. SEBI needs the regulated ecosystem to turn text into operational tasks, deadlines, evidence, and dashboards.

### 6.4 Need 4: Make market development safer, not just broader

SEBI wants broader participation in capital markets, but the Investor Survey shows knowledge gaps:

- The SEBI Investor Survey 2025 covered 91,950 households in the listing survey and 53,357 households in the main survey.
- Awareness of specialized products like REITs/InvITs, corporate bonds, F&O, and AIFs remains limited.
- Household penetration of advanced products such as F&O, REITs/InvITs, corporate bonds, and AIFs remains below 1%.
- Intermediaries report lower investor familiarity for REITs/InvITs and AIFs compared with mutual funds and stocks.
- Non-investors cite complexity/information gaps, risk/return concerns, and trust/transparency as major barriers.

This explains PS3. SEBI wants retail investors to discover and understand multiple asset classes, but not through reckless gamification. The institutional need is suitable, explainable, risk-aware participation.

### 6.5 Need 5: Deepen SME access to public capital markets

PS4 says SMEs are critical for economic growth but face high complexity and cost in preparing IPO offer documents. Drafting requires merchant bankers, legal counsel, and compliance professionals for months, which can be disproportionate to the capital being raised.

SEBI's need is not to remove authorized intermediaries. The problem statement explicitly says the solution must preserve the role of authorized intermediaries in review and certification. The real need is:

- capture issuer information in a structured way;
- flag missing/inconsistent disclosures early;
- generate a disclosure-ready draft;
- reduce early-stage dependency and cost;
- broaden the SME listing pipeline without weakening investor disclosure.

### 6.6 Need 6: Create an adoption funnel from prototype to sandbox to market

Both 2025 and 2026 launch PDFs say selected/shortlisted solutions may receive SEBI Innovation Sandbox mentorship. That line is strategically important.

The funnel looks like this:

```text
Public problem statements at GFF
        |
        v
Hackathon / TechSprint applications
        |
        v
Shortlisted prototype + demo
        |
        v
Final pitch at GFF before regulator/MII ecosystem
        |
        v
SEBI Innovation Sandbox mentorship / test-data environment
        |
        v
Potential intermediary/MII pilot
        |
        v
Possible market-wide adoption or regulatory learning
```

This is why "deployability" matters more than model novelty alone.

---

## 7. Problem Statement Intent Decomposition

### 7.1 PS1: AI synthetic media and phishing

SEBI's underlying need:

- detect malicious synthetic content;
- verify authentic communications from SEBI, exchanges, listed companies, and registered intermediaries;
- protect retail and first-generation investors from fake authority signals;
- give intermediaries and MIIs an incident-response workflow, not just a detector score.

What a winning solution must avoid:

- generic deepfake detector demo with no securities-market specificity;
- no channel strategy;
- no verification mechanism;
- no false-positive/false-negative handling;
- no investor-facing explanation.

High-win angle:

- combine content-risk scoring with authenticity registry/provenance and escalation workflow.

### 7.2 PS2: Agentic compliance

SEBI's underlying need:

- convert circular/master-circular text into structured obligations;
- map obligations to intermediary category, owner, due date, evidence, and audit status;
- reduce implementation lag after circular issuance;
- give smaller intermediaries compliance leverage;
- give SEBI/MII a consistent compliance-readiness view.

What a winning solution must avoid:

- "chat with SEBI PDFs" only;
- hallucinated legal answers;
- no clause citations;
- no evidence workflow;
- no human review layer.

High-win angle:

- obligation graph + workflow engine + evidence pack + change-impact simulator.

### 7.3 PS3: Retail multi-asset super app

SEBI's underlying need:

- unify fragmented investor holdings across demat/trading/broker/depository accounts;
- add portfolio risk/exposure analytics;
- raise awareness of REITs, InvITs, corporate bonds, and other products;
- improve suitability and reduce mis-selling;
- make sophisticated portfolio intelligence available to retail investors.

What a winning solution must avoid:

- another brokerage app;
- unrealistic live integrations;
- nudging unsuitable high-risk investing;
- no consent/data privacy story.

High-win angle:

- portfolio intelligence and suitability/education layer first, transaction layer second.

### 7.4 PS4: SME IPO offer documents

SEBI's underlying need:

- reduce drafting complexity/cost/time;
- make SME promoters able to supply structured information without specialist knowledge;
- detect gaps/inconsistencies;
- preserve merchant-banker/legal review;
- broaden SME public listing pipeline.

What a winning solution must avoid:

- pretending AI replaces merchant bankers;
- producing unverified legal text;
- ignoring liability and disclosure risk;
- no source mapping to SEBI SME framework.

High-win angle:

- guided intake + disclosure completeness checker + draft generator + merchant-banker review console.

---

## 8. Prior SEBI Hackathons and Winner Evidence

### 8.1 Confirmed: 2025 SEBI-GFF Securities Market Hackathon

Confirmed from official SEBI PR No. 42/2025:

- Event: Securities Market Hackathon at GFF 2025.
- Partners: BSE, CDSL, NSDL, KFintech, SEBI.
- Theme: "Driving Innovation and tech oriented solutions in securities market."
- Problem areas: fraud prevention, investor education/engagement, bond-market liquidity, member compliance monitoring.
- Selected solutions could receive Innovation Sandbox mentorship.

Confirmed from Hack2Skill event page:

- Team size 1-5.
- Registration deadline: September 5, 2025.
- Hybrid.
- Free registration.
- Evaluation criteria: market impact, technology stack, feasibility, scalability, SEBI mandate alignment.

### 8.2 2025 winner traces: not official enough yet

I did not find a clean official SEBI/NSE/BSE/GFF/Hack2Skill winner archive page with complete project names and descriptions.

Public traces found:

| Trace | What it says | Confidence |
| --- | --- | --- |
| Hack2Skill/Facebook search result | "Unveiling the Trailblazers of SEBI Securities Market Hackathon 2025... Winner..." | Medium-low; social result snippet only. |
| Instagram search result | Mentions "Team Final Commit" and "winner's stage." | Medium-low; social snippet only. |
| LinkedIn profile for Vikranth Udandarao | Claims "National Winner at the SEBI-NSE-BSE Global FinTech Fest Hackathon." | Medium; profile-level self-report. |
| LinkedIn post snippets | Names team members including Abhay Shakya, Akshat Parmar, Tanmay Hire, Shaurya Bhatnagar, Vikranth Udandarao. | Medium-low; snippet/self-report, product unverified. |
| LinkedIn profile for Ayush Arya Kashyap | Claims "SEBI National Hackathon Winner." | Medium-low; self-report. |

Do not cite these as official winners in the pitch deck unless verified with:

- Hack2Skill organizer;
- GFF organizer;
- SEBI Innovation Sandbox contact;
- BSE/NSE/NSDL/CDSL/KFintech partner channels.

### 8.3 What can still be inferred from 2025

Even without official winner details, the 2025 event reveals strong patterns:

- SEBI reused the same mandate categories in 2026.
- Compliance monitoring was already a 2025 topic; PS2 is the expanded 2026 version.
- Fraud prevention was already a 2025 topic; PS1 is the GenAI/deepfake expanded 2026 version.
- Retail education was already a 2025 topic; PS3 is the product-access and portfolio-intelligence expanded 2026 version.
- Market development via bond liquidity was a 2025 topic; PS3/PS4 continue the capital-market deepening goal.

The 2026 TechSprint is therefore not random. It is a more specific, AI-era continuation of the 2025 problem set.

---

## 9. Comparable Regulator Hackathon Intelligence

### 9.1 RBI HaRBInger

RBI's HaRBInger is the closest Indian regulator analogue. It is a global hackathon focused on real regulatory/financial-system problems such as fraud prevention, CBDC, inclusion, and accessibility.

Sources:

- Search result / secondary report on HaRBInger 2024 winners: https://charltonsquantum.com/rbi-announces-harbinger-2024-winners/
- Official/press-release PDF surfaced for fourth edition: https://docs.publicnow.com/viewDoc.aspx?filename=8151%5CEXT%5C757D35283B739B580F9587BEFE8C9184EB0C4197_A2B1B5F541C6E3372474480D5E2CCE14A45150D7.PDF

Reported 2024 winning categories include:

| Winning type | What it solved | Pattern |
| --- | --- | --- |
| Real-time fraud detection | Detect financial fraud quickly. | Narrow systemic-risk reduction. |
| Mule-account detection | Identify suspicious/mule banking behavior. | Risk scoring + operational action. |
| CBDC privacy/security | Improve CBDC privacy using cryptographic tools. | Advanced tech only where tied to regulatory trust. |
| Currency identification for visually impaired users | Accessibility/inclusion. | Direct user benefit with live demoability. |

Strategic lesson for SEBI:

- Indian regulators reward clear public-good outcomes.
- Fraud, trust, compliance, and inclusion keep recurring.
- Winners are not generic AI chatbots; they are operational tools mapped to a regulator's problem.

### 9.2 MAS/SFF Global FinTech Hackcelerator

Sources:

- MAS/SFA 2025 winners: https://www.mas.gov.sg/news/media-releases/2025/mas-and-sfa-announce-fintech-award-winners-at-singapore-fintech-festival-2025
- SFF Global FinTech Hackcelerator: https://www.fintechfestival.sg/global-fintech-hackcelerator

MAS/SFA said the 2025 Global FinTech Hackcelerator sought "innovative and market-ready solutions" centered on AI for financial services. Seventeen finalists pitched on Demo Day. The top three were:

| Winner | Country | What it did | Why it matters for SEBI |
| --- | --- | --- | --- |
| ActuaViz / ActuaWorks | Taiwan | Converts complex insurance documentation into structured, machine-readable formats, powering comparisons, chatbots, and pricing simulations. | Closest PS2 analog: document-to-structured-action can win if it is operational and specific. |
| Claimsio | Poland | AI-native debt collection workflows for SMEs, from soft communication to legal filings and fintech services. | Workflow automation beats point-model demos. |
| Oxford Risk | UK | Uses behavioral layers such as cognitive biases and risk tolerance to personalize financial services. | Explainable human decision support is valued. |

SFF 2026 Hackcelerator page emphasizes:

- problem statements sourced from frontline corporate champions;
- pitch deck, written proposal, and demo video;
- Demo Day before a global audience;
- pilot opportunities with corporate champions;
- mentorship and investor hours.

Strategic lesson for SEBI:

- Winning teams must look pilot-ready.
- A demo video and prototype must prove workflow, not just show slides.
- The strongest entries connect a specific institutional pain to an implementation path.

### 9.3 FCA TechSprints

Source: FCA TechSprint approach PDF: http://www.fca.org.uk/publication/research/fostering-innovation-through-collaboration-evolution-techsprint-approach.pdf

FCA's TechSprint model is important because it frames sprints as collaborative regulatory innovation. Regulators bring problem context, industry brings data/technology, and prototypes test new approaches to supervision, reporting, identity, AML, or consumer protection.

Strategic lesson:

- A regulator TechSprint is not judged like a consumer startup pitch.
- The winning artifact is often a regulator-and-industry workflow that can be tested collaboratively.

### 9.4 FINRA RegTech

Source: FINRA RegTech report: https://www.finra.org/sites/default/files/2018_RegTech_Report.pdf

FINRA's RegTech framing includes surveillance/monitoring, KYC/AML, regulatory intelligence, reporting, and risk management. These categories map directly to SEBI's PS1/PS2 and parts of PS3.

Strategic lesson:

- "Regulatory intelligence" and "surveillance/monitoring" are recognized global RegTech categories.
- A SEBI PS2 product should position itself as regulatory intelligence + compliance workflow + evidence management, not as generic legal Q&A.

---

## 10. What Previous Winners Usually Did

Across RBI, MAS/SFF, FCA-style sprints, and SEBI's own 2025/2026 rubric, winners usually share these traits:

| Pattern | Meaning | Implementation for SEBI 2026 |
| --- | --- | --- |
| Narrow problem | They do not solve all finance. | Pick one PS and one user category first. |
| Real operational workflow | They move from detection/insight to action. | Show tasks, owners, SLAs, evidence, escalation. |
| Regulator deployability | They can plug into institutions/sandboxes. | Show MII/intermediary/SEBI pilot path. |
| Explainability | Regulators cannot trust black boxes. | Clause citations, confidence, audit logs, reason codes. |
| Measurable impact | Judges need numbers. | Time saved, error reduction, SLA compliance, detection recall. |
| Privacy/security posture | Financial regulators care deeply. | Public/synthetic data, DPDP posture, no PII, access control. |
| Demo realism | Live-ish data beats screenshots. | Use public SEBI circulars, synthetic intermediary records, realistic alerts. |
| Human-in-the-loop | AI should assist regulated people, not replace accountable sign-off. | Maker-checker review, compliance officer approval. |
| Post-hackathon path | Winning is not the end. | Sandbox readiness pack and 90-day pilot plan. |

---

## 11. White-Space Map for SEBI 2026

| Area | Crowding | SEBI pain | Feasibility | Winner potential |
| --- | --- | --- | --- | --- |
| Generic deepfake detector | High | High | Medium | Medium-low unless securities-specific. |
| Financial communication authenticity layer | Medium-low | Very high | Medium | High if paired with detection/escalation. |
| Regulatory text chatbot | Very high | Medium-high | High | Low if just RAG. |
| Obligation graph + evidence workflow | Medium-low | Very high | High | Very high for PS2. |
| SupTech compliance-readiness dashboard | Low | Very high | Medium-high | Very high if demo data credible. |
| Retail super app with real integrations | Very high | High | Low-medium | Medium due integration/adoption burden. |
| Retail suitability/education engine | Medium | High | High | Medium-high if tied to survey data and suitability. |
| SME IPO document generator | Medium | High | Medium-high | High if framed as draft + gap checker, not legal replacement. |
| SME IPO disclosure gap checker | Low | High | High | High but narrower wow factor. |
| Bond liquidity marketplace | Medium | High from 2025 | Medium-low | Medium; needs market design and adoption. |

Highest-probability lane remains PS2: regulatory text to operational action, if the solution is not "just a chatbot."

---

## 12. What SEBI Is Really Buying

This is inferred from official materials, not stated verbatim by SEBI.

SEBI is buying:

1. A scouting mechanism for serious builders.
2. A portfolio of prototypes mapped to current supervisory pain.
3. A way to pressure-test AI/RegTech ideas before formal procurement or policy action.
4. Market-infrastructure participation through BSE/NSE/CDSL/NSDL/KFintech-style partners.
5. Public investor-protection signaling at a major fintech event.
6. A pipeline into Innovation Sandbox mentorship.
7. Evidence about what the ecosystem can build with public circulars, synthetic data, DPI rails, and open technology.
8. A shortlist of teams that can continue beyond the hackathon.

What SEBI is probably not buying:

1. A pure slideware startup pitch.
2. A generic AI chatbot with SEBI PDFs.
3. A consumer app that cannot be adopted by regulated entities.
4. A black-box model without explainability.
5. Any solution that weakens investor protection, KYC, AML, privacy, or market integrity.

---

## 13. Implications for Our Project Strategy

### 13.1 Build for the rubric, not for novelty alone

The 2025/2026 rubric rewards:

- market impact;
- technology stack;
- feasibility;
- scalability;
- SEBI mandate alignment.

Therefore, a winning project must show:

| Rubric item | What to show |
| --- | --- |
| Market Impact | A quantified SEBI pain, such as compliance delay, investor complaints, fraud exposure, or SME IPO drafting time. |
| Technology Stack | AI/NLP/LLM/graph/workflow/DPI only where it directly powers the outcome. |
| Feasibility | Public SEBI corpus + synthetic data + working prototype. |
| Scalability | Schema that expands across intermediary categories and circular corpora. |
| SEBI Mandate | Explicit mapping to investor protection, market development, supervision. |

### 13.2 The strongest project posture

The safest winning posture is:

```text
We are not replacing SEBI, lawyers, compliance officers, merchant bankers, or intermediaries.
We are converting trusted regulatory and market documents into auditable workflows,
with human sign-off, evidence trails, and sandbox-ready controls.
```

### 13.3 What to say in the pitch

Use this framing:

"SEBI has already built the regulatory innovation funnel: Innovation Sandbox, Regulatory Sandbox, and now GFF TechSprint. The missing layer is a prototype that can go from public rule text to operational action with evidence and accountability. Our project is built for that exact funnel."

### 13.4 What not to say

Avoid:

- "AI will automate compliance completely."
- "Users can rely on our generated legal interpretation."
- "We will integrate all brokers/depositories live during the hackathon."
- "Our deepfake detector solves fraud."
- "Our super app replaces existing brokers."
- "Our SME IPO generator replaces merchant bankers."

---

## 14. Recommended Winner Thesis

The highest-probability thesis remains:

### Build a regulator-grade PS2 product: an agentic compliance operating layer.

Core concept:

```text
SEBI circular/master circular in
        |
        v
Clause extraction and obligation graph
        |
        v
Applicability classifier by intermediary type
        |
        v
Operational tasks, owners, deadlines, evidence requirements
        |
        v
Compliance officer review and approval
        |
        v
Evidence dashboard and audit pack
        |
        v
SupTech readiness view for SEBI/MII-style oversight
```

Why this fits SEBI's need:

- Directly maps to 2026 PS2.
- Continues 2025 "Member Compliance Monitoring."
- Uses SEBI's own public circular corpus.
- Can be demoed with no live PII.
- Can show measurable time reduction and auditability.
- Can be positioned for Innovation Sandbox mentorship.
- Aligns with CSCRF's emphasis on automated dashboards and evidence.

Best differentiators:

| Differentiator | Why judges care |
| --- | --- |
| Clause-level obligation graph | Turns text into structured compliance logic, not chat. |
| Evidence pack and audit trail | Makes it regulator-grade and deployable. |
| Change-impact simulator | Shows how a new circular changes workflows and deadlines. |
| Human-in-the-loop legal/compliance review | Reduces AI trust risk. |
| SupTech aggregate readiness dashboard | Gives SEBI/MII a supervisory angle. |

---

## 15. Open Questions to Verify with Organizers

Ask these during webinars or by email:

1. Was there an official winner list for the 2025 Securities Market Hackathon? If yes, request names, project titles, and whether any entered Innovation Sandbox mentorship.
2. Will 2026 shortlisted teams get access to SEBI/MII mentors or sample datasets?
3. For PS2, does SEBI prefer stock brokers, investment advisers, AMCs, RTAs, depositories, or MIIs as the initial intermediary category?
4. Are hosted LLM APIs permitted, or should solutions be deployable on-prem/VPC/open-source models?
5. Are teams expected to submit code, deck, video, architecture, and/or demo URL at each round?
6. What are the expected video length and prototype requirements for the August 9 deadline?
7. Can the project use public SEBI circulars and synthetic intermediary data, or will official test corpora be provided?
8. Will Innovation Sandbox mentorship be available to student teams or only incorporated entities?
9. Are there any data-localization/security expectations beyond general privacy/security rules?
10. For PS1, is authenticity/provenance considered equally valid as synthetic-media detection?

---

## 16. Source Bibliography

### SEBI / official or official-adjacent sources

- SEBI 2026 TechSprint launch page: https://www.sebi.gov.in/media-and-notifications/press-releases/jun-2026/launch-of-securities-market-techsprint-at-global-fintech-fest-2026-gff-26-_102286.html
- SEBI 2026 TechSprint launch PDF: https://www.sebi.gov.in/sebi_data/attachdocs/jun-2026/1782127785109.pdf
- SEBI 2025 Hackathon launch page: https://www.sebi.gov.in/media-and-notifications/press-releases/jul-2025/launch-of-securities-market-hackathon-at-global-fintech-fest-2025-gff-25-_95410.html
- SEBI 2025 Hackathon launch PDF: https://www.sebi.gov.in/sebi_data/attachdocs/jul-2025/1753078175151.pdf
- Hack2Skill 2025 Securities Market Hackathon page: https://hack2skill.com/event/sebi-hackathon
- CDSL communiqué on 2025 Securities Market Hackathon: https://avantiscdnprodstorage.blob.core.windows.net/legalupdatedocs/44932/CDSL-notified-regarding-the-Launch-of-Securities-Market-Hackathon-at-Global-Fintech-Fest-2025-GFF25-JULY252025.pdf
- SEBI Innovation Sandbox 2019 circular: https://www.sebi.gov.in/legal/circulars/may-2019/framework-for-innovation-sandbox_43027.html
- SEBI Innovation Sandbox 2019 PDF: https://www.sebi.gov.in/sebi_data/attachdocs/may-2019/1558332776360.pdf
- SEBI Regulatory Sandbox 2020 circular: https://www.sebi.gov.in/legal/circulars/jun-2020/framework-for-regulatory-sandbox_46778.html
- SEBI Regulatory Sandbox 2020 PDF: https://www.sebi.gov.in/sebi_data/attachdocs/jun-2020/1591360859798.pdf
- SEBI revised Innovation Sandbox 2021 circular: https://www.sebi.gov.in/legal/circulars/feb-2021/revised-framework-for-innovation-sandbox_48983.html
- SEBI revised Innovation Sandbox 2021 PDF: https://www.sebi.gov.in/sebi_data/attachdocs/feb-2021/1612273822602.pdf
- SEBI Innovation Sandbox portal: https://innovation-sandbox.in/
- SEBI Investor Survey 2025: https://www.sebi.gov.in/sebi_data/commondocs/jan-2026/Investor%20Survey%202025%20Main%20Report.pdf
- SEBI F&O loss study press release: https://www.sebi.gov.in/media-and-notifications/press-releases/sep-2024/updated-sebi-study-reveals-93-of-individual-traders-incurred-losses-in-equity-fando-between-fy22-and-fy24-aggregate-losses-exceed-1-8-lakh-crores-over-three-years_86906.html
- SEBI CSCRF circular: https://www.sebi.gov.in/legal/circulars/aug-2024/cybersecurity-and-cyber-resilience-framework-cscrf-for-sebi-regulated-entities-res-_85964.html
- SEBI CSCRF FAQ: https://www.sebi.gov.in/sebi_data/faqfiles/jun-2025/1749647139924.pdf
- SEBI Common Advertisement Code consultation: https://www.sebi.gov.in/reports-and-statistics/reports/jun-2026/consultation-paper-on-common-advertisement-code-for-specified-sebi-regulated-entities_102304.html
- SEBI and MIIs "SEBI vs SCAM" campaign page: https://www.sebi.gov.in/media-and-notifications/press-releases/jul-2025/sebi-and-miis-launch-joint-investor-awareness-campaign-sebi-vs-scam_95575.html
- SEBI CFRT official URL referenced in secondary sources: https://www.sebi.gov.in/media/press-releases/aug-2017/sebi-constitutes-committee-on-financial-and-regulatory-technologies-cfrt-_35526.html

### Comparable hackathon / regulator sources

- MAS/SFA 2025 FinTech Award winners: https://www.mas.gov.sg/news/media-releases/2025/mas-and-sfa-announce-fintech-award-winners-at-singapore-fintech-festival-2025
- SFF Global FinTech Hackcelerator: https://www.fintechfestival.sg/global-fintech-hackcelerator
- RBI HaRBInger 2024 secondary winner report: https://charltonsquantum.com/rbi-announces-harbinger-2024-winners/
- RBI HaRBInger fourth edition press-release PDF mirror: https://docs.publicnow.com/viewDoc.aspx?filename=8151%5CEXT%5C757D35283B739B580F9587BEFE8C9184EB0C4197_A2B1B5F541C6E3372474480D5E2CCE14A45150D7.PDF
- FCA TechSprint approach PDF: http://www.fca.org.uk/publication/research/fostering-innovation-through-collaboration-evolution-techsprint-approach.pdf
- FINRA RegTech report: https://www.finra.org/sites/default/files/2018_RegTech_Report.pdf

### Lower-confidence winner trace sources to verify

- Hack2Skill/Facebook result for SEBI Securities Market Hackathon 2025 trailblazers: https://www.facebook.com/hack2skill/photos/unveiling-the-trailblazers-of-sebi-securities-market-hackathon-2025-we-are-proud/836061655590009/
- Instagram result mentioning Team Final Commit: https://www.instagram.com/p/DPiSbjjDUWm/
- LinkedIn result for Vikranth Udandarao: https://in.linkedin.com/in/vikranth-udandarao
- LinkedIn post result naming team members: https://www.linkedin.com/posts/vikranth-udandarao_fintech-hackathon-sebi-activity-7383834558556921856-JsUM
- LinkedIn result for Ayush Arya Kashyap: https://in.linkedin.com/in/ayush-arya-kashyap

---

## 17. Bottom Line for the Team

SEBI's real need is not "an app." It is a trustworthy, regulator-compatible technology layer that improves investor protection, market development, and supervision without weakening safeguards. The 2026 TechSprint is a continuation of SEBI's sandbox strategy and the 2025 Securities Market Hackathon. The project most likely to win is the one that looks like it can survive after GFF: specific problem, real SEBI corpus, operational workflow, explainable outputs, privacy/security posture, measurable impact, and a credible route into SEBI Innovation Sandbox or an MII/intermediary pilot.

