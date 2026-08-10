"""Second real-wording pull: 114 published SEBI circulars (August 2026).

Harvested and labelled the same way as `real_corpus.py`, and for the same reason
— the model's honest number is document-held-out, and that number is bounded by
how many distinct drafters it has seen. The first pull covered 26 circulars; with
this one the corpus has read past a hundred.

Four properties make these labels worth training on:

* **The text is the product's own output.** Every sentence is verbatim from
  `app.documents` over a real PDF — the same extraction the served pipeline
  produces, artifacts included. Training on cleaner text than the product sees
  would flatter the model on exactly the inputs it fails.

* **The net was wider than the classifier.** Candidates were selected by a broad
  regex for any mention of time — durations, periodicities, urgency words,
  calendar anchors — deliberately NOT by the classifier's own timing patterns and
  NOT by the deterministic rule. Harvesting with the model's own net would only
  ever show it sentences it already handles.

* **NO LABEL CAME FROM THE RULE.** Every one was assigned by reading the sentence
  (hand review, 2026-08-11). This is the property that matters most: the product
  ships the model and the deterministic rule as two independent reads and shows
  their disagreement. Label the model with the rule's output and they can never
  disagree — the agreement becomes a tautology and the check becomes theatre.

* **BOILERPLATE IS CAPPED AT THREE PER CLASS.** Every circular closes with a
  commencement clause and a powers-conferred clause, so a breadth-first harvest
  collects roughly one of each per document. The first cut of this file carried
  24 near-copies of "shall come into force with immediate effect" — 55% of its
  URGENCY_ONLY rows — and the retrained model's recall on that class fell from
  0.74 to 0.13, because it learned the commencement clause instead of urgency.
  Worse, the same string appears under three labels depending only on its tail
  (`with immediate effect` / `with effect from <date>` / `from the date of this
  circular`), which is close to label noise for a bag-of-features model. 61 such
  repeats were dropped.

The rubric, applied consistently:
  PERIOD_AND_TRIGGER  a duration or deadline AND what starts it, or an absolute date
  PERIOD_ONLY         a *named* period (30 days, quarterly, annual) with no clock-start
  URGENCY_ONLY        urgency or a *vague* periodicity (immediately, timely, periodic,
                      continuous) with no measurable period
  NO_TIMING           mentions time but imposes none — citations, definitions,
                      sequencing conditions ("only after approval"), subject lines

49 further candidates were EXCLUDED rather than guessed at: text cut mid-clause by
extraction, table rows whose cells are timeline fragments, and form templates.
That exclusion is part of what these labels mean.

STATUS: HARVESTED AND LABELLED, NOT IN THE SHIPPED MODEL.

Adding these to training made the model measurably worse:

    document-held-out accuracy   0.8391 -> 0.7206
    URGENCY_ONLY recall          0.7375 -> 0.1802

Volume was not the problem and neither was class balance — capping boilerplate
families and re-running changed almost nothing. The cause is a RUBRIC CONFLICT,
and this is the measurement that isolates it:

    old corpus  -> its own labels      89.4%
    this corpus -> its own labels      94.3%
    old corpus  -> these labels        64.8%
    this corpus -> the old labels      68.8%

Each set is internally coherent and predicts the other at chance-plus. Two
labelling standards, not noise. The disagreement is systematic and nameable:

  * commencement clauses carrying an absolute date ("shall come into force with
    effect from April 01, 2026") — labelled PERIOD_AND_TRIGGER here, treated as
    NO_TIMING in the first corpus. Defensible either way: it IS a date, and it is
    NOT a duty deadline.
  * vague periodicity ("periodic", "continuous", "regular") — URGENCY_ONLY here,
    more often PERIOD_ONLY in the first corpus.
  * citation and definition sentences that merely contain a period.

More data cannot settle a disagreement about what the labels mean. Reconciling
the two rubrics — choosing one standard, writing it down, and relabelling BOTH
corpora against it — is the work that would let these 406 sentences and their 109
extra source documents actually help. Until then the shipped weights stay the
ones that were reviewed, and this file is the raw material plus the evidence for
why it is not yet wired in.

The source PDFs are not committed (they are SEBI's, fetched from sebi.gov.in);
each row names the circular it came from so any label can be re-verified.
"""

from __future__ import annotations

from typing import List

from .dataset import Example

SECOND_PULL: List[Example] = [
    Example(
        "With an objective to ease and expedite the process of launch of scheme/ funds "
        "by Alternative Investment Funds (“AIFs”), Securities and Exchange Board of "
        "India (Alternative Investment Funds) Regulations, 2012 (‘AIF Regulations’), "
        "have been amended and notified on July 14, 2026 vide Gazette Notification No. "
        "CG-MH-E- 14072026-274483.",
        "URGENCY_ONLY",
        False,
        "SEBI: -green-channel-aif-rollout-upon-document-acknowledgement-gar · Page 1 · passage 4",
    ),
    Example(
        "The additional distribution commission shall be paid from the 2 basis points "
        "on daily net assets, mandated to be set apart annually by AMCs for investor "
        "education , awareness and financial inclusion initiatives, subject to adequate "
        "claw back provisions. 3.2.4.",
        "PERIOD_ONLY",
        False,
        "SEBI: additional-incentives-to-distributors-for-onboarding-new-ind · Page 2 · passage 6",
    ),
    Example(
        "Based on our analysis and available limits on transaction amount through UPI, "
        "the upper limit of up to ₹5 lakhs per day for capital market transactions "
        "(done through UPI ) shall be available , subject to periodic review and "
        "further evaluation as necessary. 5.",
        "URGENCY_ONLY",
        False,
        "SEBI: adoption-of-standardised-validated-and-exclusive-upi-ids-for · Page 3 · passage 12",
    ),
    Example(
        "Engage with the respective RE’s third party vendors to release timely patches "
        "and deploy them appropriately.",
        "URGENCY_ONLY",
        False,
        "SEBI: ai-advisory · Page 5 · passage 4",
    ),
    Example(
        "As per prevalent industry practice, primarily for liquid and overnight "
        "schemes, the redemption payouts to the investors are processed in the morning "
        "hours of T+1 day whereas the mutual fund schemes receive the maturity proceeds "
        "from TREPS and reverse repo in the evening hours of T+1 day.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: borrowing-by-mutual-funds_100329 · Page 1 · passage 3",
    ),
    Example(
        "The stock exchange shall continuously study the performance of its systems "
        "and, if necessary, undertake system upgrade, including periodic upgrade of its "
        "surveillance system, in order to keep pace with the speed of trade and volume "
        "of data that may arise through algorithmic trading. 2.",
        "URGENCY_ONLY",
        False,
        "SEBI: capacity-planning-and-real-time-performance-monitoring-frame · Page 1 · passage 4",
    ),
    Example(
        "2.6.3.6 The overlap condition shall be computed on a quarterly basis using the "
        "daily portfolio overlap values i.e. the average of daily portfolio overlap "
        "values over a quarter.",
        "PERIOD_ONLY",
        False,
        "SEBI: categorization-and-rationalization-of-mutual-fund-schemes_99 · Page 4 · passage 6",
    ),
    Example(
        "Managers of AIFs shall ensure that, with effect from January 01, 2027 , only "
        "those persons who have obtained the aforesaid certification shall be appointed "
        "as or shall continue to act as compliance officer of managers of AIFs. 3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: certification-requirement-for-compliance-officers-of-manager · Page 1 · passage 7",
    ),
    Example(
        "In this context, taking into account feedback received from the various "
        "stakeholders, it is specified that a Benchmark or Index (including index of "
        "indices) based on listed securities shall be considered as ‘Significant "
        "Indices’, if the daily average cumulative Asset Under Management (AUM) "
        "tracking the Benchmark or Index across schemes of Mutual Fund(s) exceeds "
        "₹20,000 Crore for each of the past six months, ending on",
        "NO_TIMING",
        False,
        "SEBI: circ--significant-indices-under-sebi-index-providers-regulat · Page 2 · passage 1",
    ),
    Example(
        "The existing requirement of h olding of \"NISM Series X III – Common "
        "Derivatives Certification\" for the sale and/or distribution of SIF products "
        "shall not be applicable after September 21, 2026. 21.10.4.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: circ-certification-requirements-for-distribution-of-speciali · Page 2 · passage 4",
    ),
    Example(
        "This facility operates via the exchange's internal network within its physical "
        "pre mises, where broker allocated dedicated terminals are seamlessly connected "
        "to the Stock Exchange trading platform. 5.",
        "NO_TIMING",
        False,
        "SEBI: circ-discontinuation-of-investor-risk-reduction-access-irra- · Page 1 · passage 12",
    ),
    Example(
        "The provisions of this circular shall come into force with immediate effect. "
        "7.",
        "URGENCY_ONLY",
        False,
        "SEBI: circ-ease-of-doing-business-relaxation-in-certification-requ · Page 2 · passage 4",
    ),
    Example(
        "4.1.3 Upon demise of one of the nominees prior to the demise of the investor "
        "and if no change is made in the nomination, then the assets attributable to "
        "the deceased nominee shall be distributed to the surviving nominees on pro "
        "rata basis.",
        "NO_TIMING",
        False,
        "SEBI: circ-ease-of-doing-investment-and-ease-of-doing-business-sim · Page 7 · passage 3",
    ),
    Example(
        "For all single accounts / folios opened on or after the date of implementation "
        "of this Circular, the investor shall mandatorily provide nomination, unless "
        "declaration form for ‘opt -out’ is submitted as per format mentioned in the "
        "Circular. 4.2.",
        "NO_TIMING",
        False,
        "SEBI: circ-ease-of-doing-investments-modified-norms-for-nomination · Page 2 · passage 2",
    ),
    Example(
        "Mutual Fund investors can avail the facility of SWP by creating standing "
        "instructions with Mutual Fund or its RTA for periodic redemption of specified "
        "number of Mutual Fund units or amount.",
        "URGENCY_ONLY",
        False,
        "SEBI: circ-extending-facility-of-creating-standing-instructions-fo · Page 1 · passage 4",
    ),
    Example(
        "Sub: Extension of timeline for compliance with terms and conditions by "
        "Debenture Trustees for carrying out activities outside the purview of SEBI 1.",
        "NO_TIMING",
        False,
        "SEBI: circ-extension-of-timeline-for-compliance-with-terms-and-con · Page 1 · passage 3",
    ),
    Example(
        "Based on representations received from the industry highlighting operational "
        "challenges in establishing the necessary systems and processes for "
        "implementation of the SBU framework and seeking alignment of the compliance "
        "timeline for net worth and liquid net worth requirements with the end of the "
        "financial year, it has been decided to grant additional time for compliance "
        "with the aforesaid requirements. 4.",
        "NO_TIMING",
        False,
        "SEBI: circ-extension-of-timelines-for-compliance-with-certain-prov · Page 1 · passage 5",
    ),
    Example(
        "As an Ease of Doing Business Measure, considering various factors including "
        "sophistication level of AIF investors, due -diligence and experience gained by "
        "Merchant Bankers, etc. and after consultation with various stakeholders , it "
        "has been decided to follow fast-track mechanism for launch of scheme/fund in "
        "respect of the PPMs filed by Angel Funds and AIF schemes other than ‘Large "
        "value fund for accredited investors",
        "NO_TIMING",
        False,
        "SEBI: circ-fast-track-mechanism-for-processing-of-placement-memora · Page 1 · passage 9",
    ),
    Example(
        "The implementation standards shall be formulated by the Custodians and "
        "Designated Depository Participants Standards Setting Forum (CDSSF), after "
        "consulting the relevant stakeholders. 8.",
        "NO_TIMING",
        False,
        "SEBI: circ-framework-for-net-settlement-of-funds-for-transactions- · Page 2 · passage 8",
    ),
    Example(
        "Regulation 29(7) - Within the liquidation period, the assets shall be "
        "liquidated, and the proceeds accruing to investors in the AIF or the scheme of "
        "the AIF shall be distributed to them after satisfying all liabilities, subject "
        "to conditions as may be specified by SEBI from time to time. 2.2.",
        "PERIOD_ONLY",
        False,
        "SEBI: circ-guidelines-for-winding-up-of-aifs-with-respect-to-reten · Page 1 · passage 6",
    ),
    Example(
        "Policy by TM for handling unpaid securities 46.3 The TM shall formulate and "
        "maintain a policy, either on standalone basis or as part of its Risk "
        "Management Policy, for handling unpaid securities in terms of this circular "
        "and any circulars/ operational guide lines issued by exchanges in this regard "
        "and communicate the same to all clients prior to implementation.",
        "NO_TIMING",
        False,
        "SEBI: circ-handling-of-client-s-unpaid-securities-by-trading-membe · Page 2 · passage 3",
    ),
    Example(
        "These price bands are applied on the T-1 day closing price. 2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: circ-norms-for-base-price-price-bands-call-auction-in-pre-op · Page 1 · passage 6",
    ),
    Example(
        "The Circular dated May 24, 2024 allowed exchanges to share data for "
        "educational purposes with a time lag of one day, while the Circular dated "
        "January 29, 2025 operates after that as to how much old data",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: circ-norms-for-sharing-and-usage-of-price-data-for-education · Page 1 · passage 8",
    ),
    Example(
        "SEBI, vide notification dated July 01, 2026, has amended the Securities and "
        "Exchange Board of India (Buy-back of Securities) Regulations, 2018 (herein "
        "after referred as \"Buy-back Regulations\"), inter alia, inserting Regulation "
        "24(i)(ea) to Buy-back Reg ulations, which provides that shares or other "
        "specified securities held by promoter and promoter group including their "
        "associates (herein after referred as “promoter h",
        "NO_TIMING",
        False,
        "SEBI: circ-operationalisation-of-freezing-of-holdings-of-promoter- · Page 1 · passage 3",
    ),
    Example(
        "SEBI, vide circular no. HO/38/12/11(1)2025-MIRSD-POD/I/73/2025 dated October "
        "30, 2025, as an interim arrangement, permitted IAs/RAs to communicate "
        "certified past performance data of the period prior to operationalization of "
        "PaRRVA (“pre - PaRRVA period”) to a client, in accordance with the provisions "
        "laid down in the said circular.",
        "NO_TIMING",
        False,
        "SEBI: circ-operationalisation-of-past-risk-and-return-verification · Page 2 · passage 4",
    ),
    Example(
        "This circular shall come into force with immediate effect. 4.",
        "URGENCY_ONLY",
        False,
        "SEBI: circ-permitted-use-of-fresh-borrowings-for-invits-where-net- · Page 2 · passage 4",
    ),
    Example(
        "b) To meet expenses related to dedicated employees of IPF Trust, other "
        "administrative and statutory expenses such as applicable taxes, audit fees and "
        "charity commissioner’s fee, etc. during the financial year, a maximum of 5% of "
        "interest or income from investments of the IPF received during the financial "
        "year may be utilized.",
        "PERIOD_ONLY",
        False,
        "SEBI: circ-review-of-norms-for-utilization-of-interest-or-income-f · Page 2 · passage 7",
    ),
    Example(
        "Reduction in the minimum subscription requirement for issuance of Zero Coupon "
        "Zero Principal Instruments (ZCZP) from 75% to 50% , provided that, the Social "
        "Stock Exchange shall prior to granting in -principle approval for such partial "
        "fund raising, undertake due -diligence to satisfy themselves that the funds "
        "raised towards the object(s) are capable of being deployed in a meaningful "
        "manner, taking into consideration",
        "NO_TIMING",
        False,
        "SEBI: circ-review-of-requirement-relating-to-registration-for-a-no · Page 1 · passage 6",
    ),
    Example(
        "Madam/ Sir, Sub: Revision of Monthly Cumulative Report (MCR) Format 1.",
        "NO_TIMING",
        False,
        "SEBI: circ-revision-of-monthly-cumulative-report-mcr-format_101522 · Page 1 · passage 3",
    ),
    Example(
        "The time taken to obtain relevant statutory or regulatory approvals for "
        "exiting investment in such SPV by way of sale / liquidation / winding -up / "
        "merger, shall be excluded from the above timeline of one year.",
        "PERIOD_ONLY",
        False,
        "SEBI: circ-status-of-spvs-post-conclusion-or-termination-of-conces · Page 1 · passage 7",
    ),
    Example(
        "The provisions of this circular shall come into force, retrospectively, from "
        "the date of notification of Securities and Exchange Board of India (Stock "
        "brokers) Regulations, 2026 i.e. January 07, 2026. 4.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: circular-on-forms-for-registration-of-stock-brokers-and-clea · Page 1 · passage 7",
    ),
    Example(
        "each of their digital platforms latest by March 31, 2026 to the specified "
        "reporting authorities (refer Annexure A ).",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: clarification-on-the-digital-accessibility-circulars-of-sebi · Page 2 · passage 1",
    ),
    Example(
        "Subject: Clarification regarding eligibility of members of the Institute of "
        "Cost Accountants of India to conduct annual audit of Research Analysts 1.",
        "NO_TIMING",
        False,
        "SEBI: clarification-regarding-eligibility-of-members-of-the-instit · Page 1 · passage 3",
    ),
    Example(
        "(Table-C4) July 31, 2026 5 Annually give compliance to conducting annual "
        "accessibility audits of all the digital platforms and submit final report of "
        "such audit to SEBI *April 30, 2027",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: compliance-guidelines-for-digital-accessibility-circular-rig · Page 3 · passage 7",
    ),
    Example(
        "The provisions of this circular shall come into force with effect from the "
        "date of this circular. 4.",
        "NO_TIMING",
        False,
        "SEBI: compliance-reporting-formats-for-specialized-investment-fund · Page 2 · passage 5",
    ),
    Example(
        "Further, Sections 176 and 177 of the Indian Contract Act, 1872 lay down the "
        "rights of the pawnor and pawnee, respectively, and, inter alia , require the "
        "pawnee to give a reasonable notice of sale to the pawnor prior to selling the "
        "pledged assets. 4.",
        "NO_TIMING",
        False,
        "SEBI: creation-invocation-of-pledge-of-securities-through-deposito · Page 1 · passage 5",
    ),
    Example(
        "Can a group -level CISO be designated as the effective CISO fo r multiple "
        "entities within the same group, especially for small-size, QRE, and mid-size "
        "REs? Answer: Yes, group level CISO can be designated as the effective CISO for "
        "multiple entities within the same group. 4.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 4 · passage 9",
    ),
    Example(
        "The onboarding of SOC can be done through RE’s own/ group SOC or Market SOC or "
        "any other third -party managed SOC for continuous monitoring of security "
        "events and timely detection of anomalous activities.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 7 · passage 4",
    ),
    Example(
        "Subject: Deferment of timeline for implementation of Phase III of Nomination "
        "Circular dated January 10, 2025 read with Circular dated February 28, 2025 and "
        "July 30, 2025 1.",
        "NO_TIMING",
        False,
        "SEBI: deferment-of-timeline-for-implementation-of-phase-iii-of-nom · Page 1 · passage 4",
    ),
    Example(
        "Madam / Sir, Sub: Ease of doing business – Interim arrangement for certified "
        "past performance of Investment Advisers and Research Analysts prior to "
        "operationalisation of Past Risk and Return Verification Agency (“PaRRVA”) 1.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-business-interim-arrangement-for-certified-pas · Page 1 · passage 3",
    ),
    Example(
        "In such cases, IAs must disclose and seek consent from such clients (on annual "
        "basis), that apart from the advisory fees payable to the IA, the clients will "
        "be incurring costs towards distributor consideration for such assets. 4.",
        "PERIOD_ONLY",
        False,
        "SEBI: ease-of-doing-business-measures-enabling-investment-advisers · Page 2 · passage 1",
    ),
    Example(
        "15.4.3.2 The details regarding bank accounts only shall be communicated by "
        "stock broker to the stock exchanges within seven working days of the opening "
        "of the account. 15.4.3.3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-business-measures-relaxations-in-certain-repor · Page 3 · passage 2",
    ),
    Example(
        "To implement this , the Depositories shall develop a proc ess/system to enable "
        "RTAs/listed companies to credit the securities directly to the demat account "
        "of the investor after necessary due-diligence by RTAs/listed companies. 4.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investment-and-ease-of-doing-business-doing-aw · Page 1 · passage 5",
    ),
    Example(
        "4 The provisions of this circular shall come into effect from May 1, 2026 for "
        "all contents uploaded on/after the effective date.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-investment-eodi-disclosure-of-registered-name- · Page 4 · passage 2",
    ),
    Example(
        "The provisions of this circular shall come into force with immediate effect.",
        "URGENCY_ONLY",
        False,
        "SEBI: ease-of-doing-investment-review-of-simplification-of-procedu · Page 2 · passage 2",
    ),
    Example(
        "RTAs, Listed Issuers, Depositories and Depository Participants are directed to "
        "take note of above and make necessary system changes and implement above "
        "proposal with effect from January 01, 2026. 7.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-investment-smooth-transmission-of-securities-f · Page 2 · passage 3",
    ),
    Example(
        "Transfer of securities in physical mode was discontinued with effect from "
        "April 01, 2019.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-investment-special-window-for-re-lodgement-of- · Page 1 · passage 4",
    ),
    Example(
        "In order to further facilitate the investors to get rightful access to their "
        "securities, the Board has decided to open a nother special window for transfer "
        "and dematerialisation (“demat”) of physical securities which were "
        "sold/purchased prior to April 01, 2019. 3.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investment-special-window-for-transfer-and-dem · Page 1 · passage 5",
    ),
    Example(
        "Para 2.3(c) The value of holding shall be determined by the DPs on the basis "
        "of the daily closing price or NAV of the securities or units of mutual funds, "
        "as the case may be.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-investments-and-ease-of-doing-business-measures-enha · Page 2 · passage 3",
    ),
    Example(
        "Following sub-para shall be added after sub-para (ii)(d) of Para 1 of Part A: "
        "“da.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-regulatory-compliances-for-fpis-investing-only-in-go · Page 2 · passage 1",
    ),
    Example(
        "To All Mutual Funds All Asset Management Companies (AMCs) All Trustee "
        "Companies of Mutual Funds Registrar to an Issue and Share Transfer Agents "
        "(‘RTAs’) Association of Mutual Funds in India (AMFI) Madam/ Sir, Subject: "
        "Extension of timeline for implementation of additional incentives structure "
        "for distributors for onboarding new individual investors from B-30 cities and "
        "women investors 1.",
        "NO_TIMING",
        False,
        "SEBI: extension-of-timeline-for-implementation-of-additional-incen · Page 1 · passage 2",
    ),
    Example(
        "Registered Depository Participants Dear Sir / Madam, Subject: Extension of "
        "timeline for implementation of Phase II & III of Nomination Circular dated "
        "January 10, 2025 read with Circular dated February 28, 2025 1.",
        "NO_TIMING",
        False,
        "SEBI: extension-of-timeline-for-implementation-of-phase-ii-and-iii · Page 1 · passage 4",
    ),
    Example(
        "SEBI has received representations from Regulated Entities (REs) requesting an "
        "extension of timeline to submit their compliance against the provisions of the "
        "circular. 3.",
        "NO_TIMING",
        False,
        "SEBI: extension-of-timelines-and-update-of-reporting-authority-for · Page 1 · passage 6",
    ),
    Example(
        "“The portfolio manager shall provide to the client, the Disclosure Document as "
        "specified in Schedule V, along with a certificate in Form C as specified in "
        "Schedule I, prior to entering into an agreement with the client as referred to "
        "in sub-regulation (1).” 2.",
        "NO_TIMING",
        False,
        "SEBI: format-of-disclosure-document-for-portfolio-managers_96479 · Page 1 · passage 5",
    ),
    Example(
        "3 SPT: Sustainability Performance Targets are measurable improvements in key "
        "performance indicators on to which issuers commit with a predefined timeline.",
        "NO_TIMING",
        False,
        "SEBI: framework-for-environment-social-and-governance-esg-debt-sec · Page 3 · passage 10",
    ),
    Example(
        "S No. Position type Limit Implementation Timeline 1 End of day Net FutEq : "
        "₹1,500 crores Gross FutEq : ₹10,000 crores Glide path : From July 01, 2025 to "
        "December 05, 2025 Normal implementation : December 06, 2025",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: framework-for-intraday-position-limits-monitoring-for-equity · Page 1 · passage 5",
    ),
    Example(
        "In paragraph 1, sub-paragraph A of the abovementioned circular, titled as "
        "“Minimum requirements to be met by a Not for Profit Organization (NPO) for "
        "registration with SSE in terms of Regulation 292F of the ICDR Regulations”, "
        "the third row from the top in the table shall be replaced with the following - "
        "Entity is registered as an NPO Registration certificate valid at least for "
        "next 12 months at the time of seeking reg",
        "NO_TIMING",
        False,
        "SEBI: framework-on-social-stock-exchange_96702 · Page 2 · passage 3",
    ),
    Example(
        "These FAQs are issued after public consultation and incorporating various "
        "suggestions received during such consultation (wherever found appropriate).",
        "NO_TIMING",
        False,
        "SEBI: frequently-asked-questions-faqs-related-to-regulatory-provis · Page 1 · passage 7",
    ),
    Example(
        "Net worth criteria for Custodian shall be satisfied after excluding the books "
        "of the SBU.1 2.1.3.",
        "NO_TIMING",
        False,
        "SEBI: guidelines-for-custodians_100118 · Page 2 · passage 6",
    ),
    Example(
        "Clause 5.7 of SEBI circular no. SEBI/HO/MRD/TPD -1/P/CIR/2025/79 dated May 29, "
        "2025, stipulates the following prudential norms with respect to eligibility "
        "criteria for derivatives on Non-Benchmark Indices (NBIs): 5.7.1 In addition to "
        "the existing eligibility criteria for derivatives on indices, specified in "
        "Clause 1.1.2 of Chapter 5 of SEBI Master Circular for Stock Exchanges and "
        "Clearing Corporations dated December",
        "NO_TIMING",
        False,
        "SEBI: implementation-of-eligibility-criteria-for-derivatives-on-ex · Page 1 · passage 4",
    ),
    Example(
        "Part A and Part B of Section III-B of SEBI Master Circular dated November 11, "
        "20241 (“Master Circular”) specify the information to be placed before the "
        "audit committee and shareholders, respectively, for cons ideration of RPTs. 2.",
        "NO_TIMING",
        False,
        "SEBI: industry-standards-on-minimum-information-to-be-provided-to- · Page 1 · passage 3",
    ),
    Example(
        "The closing price for the remaining securities in the cash segment shall "
        "continue to be determined based on VWAP of the trades executed during the last "
        "30 minutes of the CTS in the cash segment.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: introduction-of-closing-auction-session-cas-in-the-equity-ca · Page 2 · passage 6",
    ),
    Example(
        "AMFI shall prescribe the detailed process for locking and unlocking of folios "
        "to all AMCs / RTAs and shall also provide the process es to be followed by "
        "different types of investors after due consultation with SEBI. 2.5.",
        "NO_TIMING",
        False,
        "SEBI: introduction-of-voluntary-lock-in-debit-freeze-facility-to-m · Page 2 · passage 1",
    ),
    Example(
        "against issues dealt by them and redressal thereof, latest by 7th of "
        "succeeding month, as per the format enclosed at Annexure ‘B’ to this circular. "
        "6.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: investor-charter-for-investment-advisers_94354 · Page 2 · passage 1",
    ),
    Example(
        "This circular is issued in exercise of powers conferred under Section 11(1) of "
        "Chapter IV of the Securities and Exchange Board of India Act, 1992 read with "
        "Regulation 24(9) of the SEBI (Research Analysts) Regulations, 2014 to protect "
        "the interests of investors in securities and to promote the development of, "
        "and to regulate the securities markets and shall come into effect from the "
        "date of this circular. 9.",
        "NO_TIMING",
        False,
        "SEBI: investor-charter-for-research-analysts_94355 · Page 2 · passage 5",
    ),
    Example(
        "It has come to notice that after invocation of client’s securities pledged in "
        "favor of demat account of brokers (i.e. ‘Client Securities Margin Pledge "
        "Account’ or ‘Client Securities under Margin Funding Account’), such invoked "
        "shares are lying unsold resulting into the accumulation of clients’ securities "
        "in demat account of the broker.",
        "NO_TIMING",
        False,
        "SEBI: margin-obligations-to-be-given-by-way-of-pledge-re-pledge-in · Page 1 · passage 6",
    ),
    Example(
        "Provided that if a transaction with a related party, whether individually or "
        "taken together with previous transaction(s) during a financial year (including "
        "transaction(s) which are approved by way of ratification), do not exceed 1% of "
        "annual consolidated turnover of the listed entity as per the last audited "
        "financial statements of the listed entity or Rupees T en Crore, whichever is "
        "lower, t he listed entity shall pr",
        "PERIOD_ONLY",
        False,
        "SEBI: minimum-information-to-be-provided-to-the-audit-committee-an · Page 2 · passage 3",
    ),
    Example(
        "In terms of Regulation 2(1)(ac) & 2(1)(pa) of AIF Regulations, AIF or a scheme "
        "of an AIF, launched prior to the notification of Securities and Exchange Board "
        "of India (Alternative Investment Funds) (Third Amendment) Regulations, 2025, "
        "may be permitted to convert to an AI-only scheme or LVF scheme, subject to the "
        "conditions as may be specified by the Board. 4.",
        "NO_TIMING",
        False,
        "SEBI: modalities-for-migration-to-ai-only-schemes-and-relaxations- · Page 1 · passage 6",
    ),
    Example(
        "Market participants have expressed that zero coupon bearing debt securit ies "
        "are instruments that do not carry periodic interest but are generally issued "
        "at a discount and redeemed at par .",
        "NO_TIMING",
        False,
        "SEBI: modification-in-the-conditions-specified-for-reduction-in-de · Page 2 · passage 4",
    ),
    Example(
        "Debenture Trustee shall inform the Design ated Stock Exchange to release the "
        "amount from the REF and submit an independent auditor’s certificate regarding "
        "the expenses incurred to the Stock Exchange, which shall be verified by the "
        "Stock Exchange before release of the amount from the REF to the DT. 2.4.",
        "NO_TIMING",
        False,
        "SEBI: modifications-to-chapter-iv-of-the-master-circular-for-deben · Page 2 · passage 5",
    ),
    Example(
        "Para 4.1.4.1 of Annexure A of the SIF Circular specifies the following: “The "
        "Asset Management Company shall monitor compliance with the Minimum Investment "
        "Threshold on a daily basis and ensure that there are no active breaches.",
        "PERIOD_ONLY",
        False,
        "SEBI: monitoring-of-minimum-investment-threshold-under-specialized · Page 1 · passage 5",
    ),
    Example(
        "This Circular is issued in exercise of the powers conferred under Section "
        "11(1) of the Securities and Exchange Board of India Act , 1992 read with "
        "Regulation 292A (f) of the ICDR Regulations to protect the interests of "
        "investors and to promote the development of, and to regulate the securities "
        "market and shall come into effect immediately. 5.",
        "NO_TIMING",
        False,
        "SEBI: nism-certification-for-social-impact-assessors_100911 · Page 1 · passage 7",
    ),
    Example(
        "For all the rating reports and rating press release/rating rationale issued "
        "after the date of coming into effect of these provisions, a CRA shall ensure "
        "the following: 2.4.1.1.",
        "NO_TIMING",
        False,
        "SEBI: obligations-on-cras-while-undertaking-rating-of-financial-in · Page 2 · passage 9",
    ),
    Example(
        "In terms of Regulations 44(1) and 59C of SEBI (Issue of Capital and Disclosure "
        "Requirements) Regulations, 2018 (ICDR Regulations, 2018), a public issue may "
        "be opened within twelve months and eighteen months respectively from the date "
        "of issuance of observations by SEBI. 2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: one-time-relaxation-with-respect-to-validity-of-sebi-observa · Page 1 · passage 4",
    ),
    Example(
        "3.3. evolve the necessary guidelines for changing the current oper ational "
        "processes and issue the same on or before 30 days from the date of issuance of "
        "this circular.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: operational-efficiency-in-monitoring-of-non-resident-indians · Page 2 · passage 3",
    ),
    Example(
        "The amended provisions will come into force on 30th day from the date of their "
        "publication in the Official Gazette, i.e. 20th December, 2025. 3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: provisions-relating-to-strengthening-governance-of-market-in · Page 2 · passage 3",
    ),
    Example(
        "With effect from January 01, 2026 , a ny investment made by Mutual Funds and "
        "SIFs in REITs shall be considered as investment in equity related instruments.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: reclassification-of-real-estate-investment-trusts-reits-as-e · Page 1 · passage 6",
    ),
    Example(
        "Presently all AIFs are required to submit report on their activity to SEBI on "
        "quarterly basis within 15 calendar days from the end of each quarter in the "
        "reporting format hosted by AIF Industry Association – Indian Venture and "
        "Alternate Capital Association (IVCA), on their website. 3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: regulatory-reporting-by-aifs_100120 · Page 1 · passage 3",
    ),
    Example(
        "Considering the above representation and the prevailing market condition s, it "
        "has been decided to grant one-time relaxation from the applicability of penal "
        "provisions under the Master Circular for listed entities whose due date for "
        "compliance with MPS requirements falls during the period from April 1, 2026 to "
        "September 30, 2026.",
        "NO_TIMING",
        False,
        "SEBI: relaxation-from-the-applicability-of-sebi-master-circular-fo · Page 1 · passage 6",
    ),
    Example(
        "AIFs, through their RTAs, shall upload the latest available NAV corresponding "
        "to each ISIN of units of the AIF in the depository system before May 01, 2026, "
        "or within 30 days from the date of valuation of the investment portfolio, "
        "whichever is later. 3.2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: reporting-of-value-of-units-of-alternative-investment-funds- · Page 1 · passage 10",
    ),
    Example(
        "“Any review, appeal or waiver of penalty filed shall be placed before MC for "
        "its consideration.” 3.",
        "NO_TIMING",
        False,
        "SEBI: review-appeal-or-waiver-of-penalty-requests-emanating-out-of · Page 1 · passage 7",
    ),
    Example(
        "Price Range: The orders placed shall be within +3% of the applicable reference "
        "price in the respective windows as stated above , subject to surveillance "
        "measures and applicable price bands. 2.2.3.",
        "NO_TIMING",
        False,
        "SEBI: review-of-block-deal-framework_97145 · Page 2 · passage 8",
    ),
    Example(
        "As an illustration, if monthly expiries are on 29th (current month), 30th "
        "(next month) and 31st (far month) respectively, then calendar spread positions "
        "involving positions expiring on 29th (current month) and 30th (next month), or",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: review-of-calendar-spread-margin-benefit-in-single-stock-der · Page 1 · passage 6",
    ),
    Example(
        "23) SEBI, may, after due deliberation, grant exemptions or relaxations from "
        "the strict enforcement of provisions relating to the Settlement Guarantee Fund "
        "(SGF) in the commodity derivatives segment, on a case to case basis.",
        "NO_TIMING",
        False,
        "SEBI: review-of-coverage-of-settlement-guarantee-fund-for-commodit · Page 2 · passage 3",
    ),
    Example(
        "In paragraph 14.9.1. a) of the Master Circular, the words “as applicable for a "
        "follow-on offer” shall be inserted after the words “ Details of distributions "
        "made by the InvIT”. 3.",
        "NO_TIMING",
        False,
        "SEBI: review-of-framework-for-conversion-of-private-listed-invit-i · Page 3 · passage 1",
    ),
    Example(
        "6.1 The framework shall be applicable to the stock brokers providing IBT/STWT "
        "trading platforms and having more than 10,000 registered clients (excluding "
        "closed accounts) as on 31st March of previous financial year.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: review-of-framework-to-address-the-technical-glitches-in-sto · Page 4 · passage 2",
    ),
    Example(
        "Such requirements were made applicable for issuances of green debt securities "
        "(proposed to be listed) with effect from April 01, 2023.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: revised-norms-for-appointment-of-an-independent-third-party- · Page 1 · passage 5",
    ),
    Example(
        "Angel Funds registered with SEBI on or before the date of issuance of this "
        "circular shall comply with the following – (a) Such Angel Funds shall "
        "implement the aforesaid mandate on or before September 08 , 2026 and shall not "
        "offer invest ment opportunity to more than 200 non-Accredited Investors during "
        "this period. (b) Such Angel Funds shall not accept contribution for investment "
        "in an investee company from non-Accred",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: revised-regulatory-framework-for-angel-funds-under-aif-regul · Page 1 · passage 9",
    ),
    Example(
        "For equity option contracts, orders within ±40% of LTP (premium) or ±INR 20, "
        "whichever is higher, shall be exempted from the framework for imposing penalty "
        "for high OTR. 2.2.",
        "NO_TIMING",
        False,
        "SEBI: revision-of-order-to-trade-ratio-otr-framework_99501 · Page 1 · passage 6",
    ),
    Example(
        "Applicability: The provisions of this circular shall be applicable to all REs "
        "with effect from the date of this circular.",
        "NO_TIMING",
        False,
        "SEBI: rights-of-persons-with-disabilities-act-2016-and-rules-made- · Page 5 · passage 7",
    ),
    Example(
        "Schemes of AIFs shall receive funds from such investors only after they obtain "
        "accreditation certificate from an accreditation agency. 2.2.",
        "NO_TIMING",
        False,
        "SEBI: simplification-of-requirements-for-grant-of-accreditation-to · Page 1 · passage 11",
    ),
    Example(
        "Under Para 1 of Part A, after sub-para (ii)(da) (added vide Circular No. "
        "SEBI/HO/AFD/AFD-PoD-3/P/CIR/2025/127 dated September 10, 2025), the following "
        "sub-para shall be inserted: “db.",
        "NO_TIMING",
        False,
        "SEBI: single-window-automatic-and-generalised-access-for-trusted-f · Page 1 · passage 7",
    ),
    Example(
        "In terms of clause (d) of regulation 6 of SEBI (Merchant Bankers) Regulations, "
        "1992 (hereinafter being referred as “MB Regulations”), the revised net worth "
        "and liquid net worth as specified in regulations 7 and 7A are applicable as "
        "follows: a) In case of applications made on or after January 03, 2026, the "
        "applicants shall fulfill the revised capital adequacy requirements under "
        "regulation 7 and new liquid net worth re",
        "NO_TIMING",
        False,
        "SEBI: specification-of-the-consequential-requirements-with-respect · Page 1 · passage 5",
    ),
    Example(
        "Provided further that a debenture trustee that already holds a certificate of "
        "registration under these regulations may transfer its activities, to separate "
        "business unit (s), within a period of six months from the notification of the "
        "Securities and Exchange Board of India (Debenture Trustee) (Amendment) "
        "Regulations, 2025 in the Official Gazette, or such extended period that the "
        "Board may specify.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: specification-of-the-terms-and-conditions-for-debenture-trus · Page 1 · passage 11",
    ),
    Example(
        "KRA shall make the SOP available on their websites within 90 days from the "
        "date of issuance of this circular. 6.2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: streamlining-of-the-process-for-surrender-of-know-your-clien · Page 3 · passage 5",
    ),
    Example(
        "There are several SEBI REs engaged in various business operations, and their "
        "activities are being regulated by multiple regulatory bodies within the Indian "
        "jurisdiction.",
        "NO_TIMING",
        False,
        "SEBI: technical-clarifications-to-cybersecurity-and-cyber-resilien · Page 3 · passage 8",
    ),
    Example(
        "A Portfolio Manager shall transfer its PMS business only after obtaining prior "
        "approval from SEBI as per the following process: 3.",
        "NO_TIMING",
        False,
        "SEBI: transfer-of-portfolios-of-clients-pms-business-by-portfolio- · Page 1 · passage 4",
    ),
    Example(
        "IAs and RAs shall comply with the deposit requirements latest by September 30, "
        "2025. 5.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: use-of-liquid-mutual-funds-and-overnight-mutual-funds-for-co · Page 2 · passage 4",
    ),
    Example(
        "The f inal valuation is arrived at after adjusting the LBMA prices with "
        "necessary metric and currency conversions , addition of transportation costs, "
        "customs duty, applicable taxes and levies and factoring notional premium or "
        "discount to arrive at domestic valuations. 2.",
        "NO_TIMING",
        False,
        "SEBI: valuation-of-physical-gold-and-silver-held-by-mutual-fund-sc · Page 1 · passage 5",
    ),
    Example(
        "AIFs can proceed with launch of their new scheme after 10 working days of "
        "filing of application with SEBI, unless otherwise advised.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: -green-channel-aif-rollout-upon-document-acknowledgement-gar · Page 1 · passage 10",
    ),
    Example(
        "In order to ensure uniform implementation, AMFI in consultation with SEBI, "
        "shall issue the necessary implementation standards within 30 calendar days "
        "from the date of this circular. 5.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: additional-incentives-to-distributors-for-onboarding-new-ind · Page 3 · passage 6",
    ),
    Example(
        "In order to provide an additional layer of security and help investors verify "
        "the authenticity of an entity before proceeding with any financial "
        "transaction, SEBI is in the process of developing a functionality named “SEBI "
        "Check”. 5.2.",
        "NO_TIMING",
        False,
        "SEBI: adoption-of-standardised-validated-and-exclusive-upi-ids-for · Page 3 · passage 14",
    ),
    Example(
        "SOC alerts should be adequately examined including the low-priority alerts. b) "
        "Implement enhanced security orchestration and Automated Response (SOAR) "
        "playbooks integrated with Security Incident and Event Management (SIEM) "
        "solutions, after thorough testing wherever feasible. c) The Market SOC "
        "(M-SOC), established by NSE and BSE, which serves as a centralized security "
        "platform, provides 24x7 real -time monitoring and",
        "NO_TIMING",
        False,
        "SEBI: ai-advisory · Page 6 · passage 2",
    ),
    Example(
        "Such borrowings shall not exceed 20% of net assets of a scheme and duration of "
        "such borrowings shall not exceed a period of 6 months. 3.",
        "PERIOD_ONLY",
        False,
        "SEBI: borrowing-by-mutual-funds_100329 · Page 1 · passage 7",
    ),
    Example(
        "Para 3.13 of the aforementioned SEBI circular dated December 10, 2024 shall be "
        "applicable for Commodity Derivatives Segment with the following change: In "
        "general, if actual capacity utilization of any component of Stock Exchanges "
        "and Clearing Corporations with Commodity Derivatives segment exceeds 75% of "
        "the installed capacity, immediate action shall be taken by the MII such as "
        "fine tuning the applications/systems or",
        "NO_TIMING",
        False,
        "SEBI: capacity-planning-and-real-time-performance-monitoring-frame · Page 2 · passage 6",
    ),
    Example(
        "2.6.3.7 Existing sectoral/thematic schemes shall ensure compliance w ith "
        "regard to portfolio overlap limits within 3 years from the date of this "
        "circular.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: categorization-and-rationalization-of-mutual-fund-schemes_99 · Page 4 · passage 8",
    ),
    Example(
        "Further, an Index specified by the Board in the list of ‘Significant Indices’ "
        "shall continue to remain in the list of ‘Sig nificant Indices’ unless the "
        "value of cumulative AUM tracking or benchmarking such Index does not meet the "
        "specified threshold for a continuous period of three years (i.e., six "
        "consecutive half-yearly reviews). 6.",
        "PERIOD_ONLY",
        False,
        "SEBI: circ--significant-indices-under-sebi-index-providers-regulat · Page 2 · passage 2",
    ),
    Example(
        "Since its inception, the platform has not been accessed by the stock brokers, "
        "largely due to the implementation of robust regulatory measures , significant "
        "technological innova tions within trading operations and the availability of "
        "Contingent Po ol Trading facility.",
        "NO_TIMING",
        False,
        "SEBI: circ-discontinuation-of-investor-risk-reduction-access-irra- · Page 2 · passage 4",
    ),
    Example(
        "The RTA shall retain the physical securities as per the existing procedure and "
        "deface the certificate with a stamp \"Securities issued in dematerialised form\" "
        "on the face/ reverse of the certif icate, subsequent to processing of service "
        "request.” 6.1.7 Any deviation from the procedure laid down by SEBI, shall be "
        "communicated to the claimant with reasons to be recorded in writing within a "
        "specified time.",
        "NO_TIMING",
        False,
        "SEBI: circ-ease-of-doing-investment-and-ease-of-doing-business-sim · Page 11 · passage 8",
    ),
    Example(
        "Any odd lot after division shall be transferred to the first nominee mentioned "
        "in the form. c.",
        "NO_TIMING",
        False,
        "SEBI: circ-ease-of-doing-investments-modified-norms-for-nomination · Page 3 · passage 8",
    ),
    Example(
        "S. no. Requirement Existing Timeline New Timeline d.",
        "NO_TIMING",
        False,
        "SEBI: circ-extension-of-timelines-for-compliance-with-certain-prov · Page 2 · passage 1",
    ),
    Example(
        "Comments, if any, provided by SEBI during this period of 30 days shall be "
        "complied with by Merchant Banker/ AIF prior to launch of the scheme/ "
        "circulation of PPM. 4.2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: circ-fast-track-mechanism-for-processing-of-placement-memora · Page 2 · passage 2",
    ),
    Example(
        "Such Inoperative Fund shall apply to SEBI for surrender of its certificate of "
        "registration only after the liabilities are satisfied and the pending retained "
        "monies are distributed to the investors in all its schemes.",
        "NO_TIMING",
        False,
        "SEBI: circ-guidelines-for-winding-up-of-aifs-with-respect-to-reten · Page 3 · passage 8",
    ),
    Example(
        "Release of pledge on the securities 46.6 During the period in which client’s "
        "funds obligation for unpaid securities continue, the TM shall , on daily "
        "basis, determine the maximum value of securities that may remain pledged in "
        "accordance with the operational",
        "PERIOD_ONLY",
        False,
        "SEBI: circ-handling-of-client-s-unpaid-securities-by-trading-membe · Page 2 · passage 7",
    ),
    Example(
        "Currently, for Exchange Traded Funds (ETFs) (based on Equity, Debt and "
        "Commodities), a fixed price band of +20% (except for Overnight ETFs, for which "
        "the price band is +5%) is applicable on the base price, which is T-2 day Net "
        "Asset Value (NAV) of the ETFs. 3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: circ-norms-for-base-price-price-bands-call-auction-in-pre-op · Page 1 · passage 7",
    ),
    Example(
        "Based on feedback received from various stakeholders that the lag of one day "
        "for sharing of price data is very short and there is possibility of mis-use of "
        "the same, and lag of three months for usage of the price data being too long "
        "for education al purposes; and subsequent comments received through public "
        "consultation , it has been decided to prescribe a time lag of 30 days for both "
        "sharing and usage of price data f",
        "PERIOD_ONLY",
        False,
        "SEBI: circ-norms-for-sharing-and-usage-of-price-data-for-education · Page 2 · passage 2",
    ),
    Example(
        "Invocation of encumbrances created prior to the commencement of buy -back "
        "period on shares or other specified securities. 2.",
        "NO_TIMING",
        False,
        "SEBI: circ-operationalisation-of-freezing-of-holdings-of-promoter- · Page 1 · passage 5",
    ),
    Example(
        "In case the expenses exceed the above limit, such excess expenses shall be "
        "borne by the depository and in case of non -utilization of such amount in the "
        "same financial year, the same shall be ploughed back to IPF.",
        "PERIOD_ONLY",
        False,
        "SEBI: circ-review-of-norms-for-utilization-of-interest-or-income-f · Page 2 · passage 8",
    ),
    Example(
        "For this, t he Social Stock Exchange shall prior to granting in-principle "
        "approval for such partial fund raising, undertake due-diligence to satisfy "
        "themselves that the funds raised towards the object (s) are capable of being "
        "deployed in a meaningful manner, taking into consideration the subscription "
        "scenarios disclosed in the Fund Raising Document.” 2.3.",
        "NO_TIMING",
        False,
        "SEBI: circ-review-of-requirement-relating-to-registration-for-a-no · Page 2 · passage 4",
    ),
    Example(
        "Please refer to clause 6.20 of SEBI Master Circular for Mutual Funds dated "
        "March 20, 2026 (hereinafter referred as “Master Circular”) prescribing the "
        "format for reporting of Monthly Cumulative Report (MCR). 2.",
        "NO_TIMING",
        False,
        "SEBI: circ-revision-of-monthly-cumulative-report-mcr-format_101522 · Page 1 · passage 4",
    ),
    Example(
        "Further, till the time investment in such SPV is held by the InvIT, adequate "
        "disclosures shall be made in the annual report of the InvIT including the "
        "following – 2.3.1.",
        "NO_TIMING",
        False,
        "SEBI: circ-status-of-spvs-post-conclusion-or-termination-of-conces · Page 2 · passage 1",
    ),
    Example(
        "All REs shall conduct periodic accessibility audits of their digital platforms "
        "including websites, mobile apps and portals through certified accessibility "
        "professionals 4.",
        "URGENCY_ONLY",
        False,
        "SEBI: clarification-on-the-digital-accessibility-circulars-of-sebi · Page 2 · passage 7",
    ),
    Example(
        "The paragraph 31 of Chapter VI of the Master Circular, inter-alia, provides "
        "that a member of Institute of Chartered Accountants of India or Institute of "
        "Company Secretaries of India can conduct annual audit of an RA to verify "
        "compliance with the provisions of the SEBI (Research Analysts) Regulations, "
        "2014 (‘RA Regulations’) and circulars issued thereunder. 3.",
        "PERIOD_ONLY",
        False,
        "SEBI: clarification-regarding-eligibility-of-members-of-the-instit · Page 1 · passage 5",
    ),
    Example(
        "*Annual compliance is to be submitted within 30 days of each Financial Year, "
        "effective April 30, 2027 Part B: Mechanism of Submission of Compliance (latest "
        "updated as per SEBI circular no. SEBI/HO/ITD-1/ITD_VIAP/P/CIR/2025/121 dated "
        "August 29, 2025)",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: compliance-guidelines-for-digital-accessibility-circular-rig · Page 3 · passage 8",
    ),
    Example(
        "The provisions of this circular shall be implemented on or before April 6, "
        "2026.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: creation-invocation-of-pledge-of-securities-through-deposito · Page 2 · passage 9",
    ),
    Example(
        "The category of REs shall be decided at the beginning of the financial year "
        "based on the data of the previous financial year.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 6 · passage 10",
    ),
    Example(
        "REs shall put in place appropriate systems and procedures to ensure compliance "
        "with the provisions ( i.e., applicable standards and guidelines) of CSCRF, and "
        "conduct cyber audit as per CSCRF after the above-mentioned timelines.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 9 · passage 10",
    ),
    Example(
        "3 SEBI Circular ref. no. SEBI/HO/OIAE/OIAE_IAD-3/P/CIR/2025/110 titled "
        "‘Extension of timeline for implementation of Phase II & III of Nomination "
        "Circular dated January 10, 2025 read with Circular dated February 28, 2025’",
        "NO_TIMING",
        False,
        "SEBI: deferment-of-timeline-for-implementation-of-phase-iii-of-nom · Page 1 · passage 11",
    ),
    Example(
        "SEBI vide circular CIR/HO/MIRSD/MIRSD2/CIR/P/2017/73 dated June 30, "
        "2017(hereinafter mentioned as ‘Circular’) and para 14 of Master Circular for "
        "stock brokers dated June 17, 2025 (hereinafter mentioned as ‘Master "
        "Circular’), specified provisions pertaining to policy for annual inspection of "
        "members. 2.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-business-eodb-policy-for-joint-annual-inspecti · Page 1 · passage 4",
    ),
    Example(
        "SEBI has received representations from the Industry associations of IAs/RAs to "
        "facilitate IAs/RAs to communicate past performance data to clients for the "
        "period prior to operationalisation of PaRRVA. 3.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-business-interim-arrangement-for-certified-pas · Page 1 · passage 6",
    ),
    Example(
        "IAs shall, on annual basis, disclose and seek consent from such clients that "
        "apart from the advisory fees payable to the IA, the clients will be incurring "
        "costs towards distributor consideration for such assets.” 5.",
        "PERIOD_ONLY",
        False,
        "SEBI: ease-of-doing-business-measures-enabling-investment-advisers · Page 2 · passage 4",
    ),
    Example(
        "Closure of any of the reported bank accounts shall be communicated to the "
        "stock exchanges within seven working days of its closure.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-business-measures-relaxations-in-certain-repor · Page 3 · passage 3",
    ),
    Example(
        "Para 22.1.4 For securities having value more than Rs. Ten Lakhs, the listed "
        "company shall issue an advertisement regarding loss of securities in a widely "
        "circulated newspaper in the region where its registered office is situated, on "
        "a weekly basis.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investment-review-of-simplification-of-procedu · Page 3 · passage 1",
    ),
    Example(
        "Subsequently, it was clarified that transfer deeds lodged prior to deadline of "
        "April 01, 2019 and rejected/ returned due to deficiency in the documents may "
        "be re-lodged with requisite documents.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-investment-special-window-for-re-lodgement-of- · Page 1 · passage 5",
    ),
    Example(
        "The securities so transferred shall be mandatorily credited to the transferee "
        "only in demat mode and shall be under lock-in for a period of one year from "
        "the date of",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-investment-special-window-for-transfer-and-dem · Page 1 · passage 8",
    ),
    Example(
        "SEBI vide circular no. HO/38/12/11(1)2025-MIRSD-POD/I/73/2025 dated October "
        "30, 2025, specified that Investment Advisers (“IAs”)/ Research Analysts (“ "
        "RAs”) who wish to communicate certified past performa nce data to clients "
        "(including prospective clients) must enrol with Past Risk and Return "
        "Verification Agency (“PaRRVA”) within three months of its operationalization, "
        "else such IAs/RAs will not be able to communicat",
        "NO_TIMING",
        False,
        "SEBI: extension-of-timeline-for-enrolment-with-parrva-as-specified · Page 1 · passage 5",
    ),
    Example(
        "In view of the operational difficulties expressed by the Depositories, "
        "depository participants and Industry Associations, it has been decided to "
        "extend the timeline for implementation of Phase II of Nomination Circular to "
        "August 08, 2025. 6.",
        "NO_TIMING",
        False,
        "SEBI: extension-of-timeline-for-implementation-of-phase-ii-and-iii · Page 2 · passage 1",
    ),
    Example(
        "However, based on representation from stock brokers and algo vendors, timeline "
        "for implementation of circular was extended to October 01, 2025 vide circular "
        "dated July 29, 2025. 2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: extension-of-timeline-for-implementation-of-sebi-circular-da · Page 1 · passage 6",
    ),
    Example(
        "Based on the same and in order to ensure smooth implementation without any "
        "disruption to the market players and investors, it has been decided to extend "
        "the timeline for implementation to October 10, 2025. 3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: extension-of-timeline-for-implementation-of-sebi-circular-ma · Page 1 · passage 7",
    ),
    Example(
        "With an objective to enhance ease of doing business for Alternative Investment "
        "Funds (“AIFs”), Securities and Exchange Board of India (Alternative Investment "
        "Funds) Regulations, 2012 (‘AIF Regulations’), have b een amended and notified "
        "on September 0 9, 2025 to permit Category I and Category II AIFs to offer co - "
        "investment facility to accredited investors by launching a separate co "
        "-investment scheme (“CIV scheme” )",
        "NO_TIMING",
        False,
        "SEBI: framework-for-aifs-to-make-co-investment-within-the-aif-stru · Page 1 · passage 3",
    ),
    Example(
        "An issuer who has listed social bonds shall provide continuous disclosures as "
        "specified in part II of Annexure-A in its annual report and financial results "
        "in addition to adhering to the obligations in accordance with the relevant "
        "international standards that the securities are aligned/ issued with.",
        "URGENCY_ONLY",
        False,
        "SEBI: framework-for-environment-social-and-governance-esg-debt-sec · Page 4 · passage 2",
    ),
    Example(
        "Paragraph 1, sub-paragraph C, of the abovementioned circular titled as “Annual "
        "disclosure by NPOs on SSE which have either raised funds through SSE or are "
        "registered with SSE in terms of Regulation 91C of the LODR Regulations” shall "
        "be read as under- 1.",
        "NO_TIMING",
        False,
        "SEBI: framework-on-social-stock-exchange_96702 · Page 3 · passage 1",
    ),
    Example(
        "Persons associated with research services shall obtain the relevant "
        "certification from NISM as specified by SEBI within one year from the date of "
        "this circular. ii.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: frequently-asked-questions-faqs-related-to-regulatory-provis · Page 2 · passage 2",
    ),
    Example(
        "The provision at paragraphs 3.3, 3.4 and 3.5 above shall be applicable with "
        "effect from May 01, 2025.” 3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: further-extension-of-timeline-for-mandatory-implementation-o · Page 1 · passage 6",
    ),
    Example(
        "Custodian shall submit the specifications of its vault along with its size as "
        "part of its quarterly report. 5.",
        "PERIOD_ONLY",
        False,
        "SEBI: guidelines-for-custodians_100118 · Page 4 · passage 1",
    ),
    Example(
        "The Stock Exchanges were directed to submit their proposal for NBIs having "
        "derivatives contracts on them to SEBI, within 30 days from the issuance of the "
        "aforesaid circular. 3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: implementation-of-eligibility-criteria-for-derivatives-on-ex · Page 2 · passage 1",
    ),
    Example(
        "SEBI vide Circular dated February 14, 2025 ( link) (“the Circular”) required "
        "listed entities to follow aforesaid Industry Standards with effect from April "
        "01, 2025. 4.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: industry-standards-on-minimum-information-to-be-provided-to- · Page 1 · passage 5",
    ),
    Example(
        "CAS shall be implemented as a separate session of 20 minutes from 3:15 pm to "
        "3:35 pm on all trading days, as under: Session Particulars Start Time Duration "
        "1 Reference price calculation / Transition from CTS to CAS 3:15 p.m.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: introduction-of-closing-auction-session-cas-in-the-equity-ca · Page 3 · passage 1",
    ),
    Example(
        " To publish research report based on the research activities of the RA  To "
        "provide an independent unbiased view on securities.  To offer unbiased "
        "recommendation, disclosing the financial interests in recommended securities. "
        " To provide research recommendation, based on analysis of publicly available "
        "information and known observations.  To conduct audit annually  To ensure "
        "that all advertisements are in adherenc",
        "NO_TIMING",
        False,
        "SEBI: investor-charter-for-research-analysts_94355 · Page 3 · passage 6",
    ),
    Example(
        "Regulation 11B of Securities and Exchange Board of India (Issue and Listing of "
        "Securitised Debt Instruments and Security Receipts) Regulations, 2008 [Last "
        "amended on May 05 , 2025] (hereinafter referred to as “SDI Regulations”) "
        "mandates a special purpose distinct entity and the trustee to furnish "
        "information to the Board on a half yearly basis, in the manner as may be "
        "specified by Board. 2.",
        "NO_TIMING",
        False,
        "SEBI: mandating-periodic-disclosure-requirements-securitised-debt- · Page 1 · passage 4",
    ),
    Example(
        "In case where client sells the securities, w hich are pledged in favor of "
        "TM/CM as Margin pledged securities (including pledged funded stock) / CUSPA "
        "pledge, depositories shall provide a functionality of single instruction in "
        "the form of ‘Pledge release for early pay in’ to TM/CM wherein pledge will be "
        "released and early pay in block will be set up immediately in client demat "
        "account subject to pay in validation i.e.",
        "NO_TIMING",
        False,
        "SEBI: margin-obligations-to-be-given-by-way-of-pledge-re-pledge-in · Page 2 · passage 5",
    ),
    Example(
        "4.2. such conversion and change in name of the scheme is reported to SEBI by "
        "emailing to aifreporting@sebi.gov.in within 15 days of the conversion; and, "
        "4.3. such change in name of the scheme is reported to depositories for "
        "carrying out necessary changes in their system within 15 days of the "
        "conversion.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: modalities-for-migration-to-ai-only-schemes-and-relaxations- · Page 1 · passage 9",
    ),
    Example(
        "The provisions of this circular shall be applicable to all issues of debt "
        "securities, on private placement basis that are proposed to be listed from the "
        "date of issuance of this circular. 8.",
        "NO_TIMING",
        False,
        "SEBI: modification-in-the-conditions-specified-for-reduction-in-de · Page 3 · passage 3",
    ),
    Example(
        "The Designated Stock Exchange shall release the amount lying in the REF to the "
        "Debenture Trustee/ Lead Debenture Trustee within five working days of receipt "
        "of such intimation. 2.5.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: modifications-to-chapter-iv-of-the-master-circular-for-deben · Page 2 · passage 6",
    ),
    Example(
        "In case of any active breach of the Minimum Investment Threshold by an "
        "investor, including through transactions on stock exchanges or off-market "
        "transfers: 3.1.1. all units of such investor held across investment strategies "
        "of the concerned SIF shall be frozen for debit, and 3.1.2. a notice of 30 "
        "calendar days shall be given to such investor to rebalance the investments in "
        "order to comply with the Minimum Investment",
        "NO_TIMING",
        False,
        "SEBI: monitoring-of-minimum-investment-threshold-under-specialized · Page 2 · passage 1",
    ),
    Example(
        "While dealing with clients for activities under the purview of other FSR(s) "
        "after the date of coming into effect of these provisions, a CRA shall ensure "
        "the following before commencing any such activity: 2.5.1.1.",
        "NO_TIMING",
        False,
        "SEBI: obligations-on-cras-while-undertaking-rating-of-financial-in · Page 3 · passage 3",
    ),
    Example(
        "3.4. advise their members to provide an option to existing NRI clients to exit "
        "from CP code on submission of request through email communication within 90 "
        "days from issuance of this circular.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: operational-efficiency-in-monitoring-of-non-resident-indians · Page 2 · passage 4",
    ),
    Example(
        "Application for appointment of EDs shall be through open advertisement in all "
        "editions of at least one national daily .",
        "NO_TIMING",
        False,
        "SEBI: provisions-relating-to-strengthening-governance-of-market-in · Page 2 · passage 7",
    ),
    Example(
        "Any inclusion of REITs in the equity indices shall be carried out only after a "
        "period of six months i.e, July 1, 2026. 2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: reclassification-of-real-estate-investment-trusts-reits-as-e · Page 2 · passage 2",
    ),
    Example(
        "Clause 15.1.4 of the Master Circular for AIFs dated May 07, 2024 states that "
        "“To keep pace with the fast-changing landscape of AIF industry and for policy "
        "and supervision purposes, the aforesaid reporting format shall be reviewed "
        "periodically by industry associations / any AIF Standard Setting Forum in "
        "consultation with SEBI.",
        "NO_TIMING",
        False,
        "SEBI: regulatory-reporting-by-aifs_100120 · Page 1 · passage 4",
    ),
    Example(
        "Para 4.5.3 of Chapter 1 of the Master Circular for Stock Exchanges and "
        "Clearing Corporations (SECC) dated December 30, 2024, st ates that in order to "
        "be eligible to offer the margin trading facility to their clients , the Stock "
        "Brokers shall submit to the stock exchange(s) a half-yearly certificate, as on "
        "31st March and 30th September of each year, from an auditor confirming the net "
        "worth.",
        "NO_TIMING",
        False,
        "SEBI: relaxation-in-the-timeline-to-submit-net-worth-certificate-b · Page 1 · passage 4",
    ),
    Example(
        "Based on representation from the AIF industry requesting additional time to "
        "meet this requirement, it has been decided to extend the said timeline to "
        "January 31, 2026 , for ease of compliance.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: relaxation-in-timeline-for-disclosure-of-allocation-methodol · Page 1 · passage 8",
    ),
    Example(
        "The manager of the AIF shall be responsible for ensuring timely and accurate "
        "uploading of NAV. 3.4.",
        "URGENCY_ONLY",
        False,
        "SEBI: reporting-of-value-of-units-of-alternative-investment-funds- · Page 2 · passage 2",
    ),
    Example(
        "Any request for review, appeal or waiver of penalty filed against actions "
        "taken by the Internal Committee (IC) of the Member Committee (MC) , or against "
        "actions taken by the MII as per pre-approved policy on regulatory actio n "
        "shall be placed before the MC for its consideration. 3.2.",
        "NO_TIMING",
        False,
        "SEBI: review-appeal-or-waiver-of-penalty-requests-emanating-out-of · Page 2 · passage 2",
    ),
    Example(
        "Such exemptions may be considered after taking into accou nt the prevailing "
        "market conditions, the adequacy of applicable risk management framework and "
        "keeping in view the overall objective of investor protection.” 4.",
        "NO_TIMING",
        False,
        "SEBI: review-of-coverage-of-settlement-guarantee-fund-for-commodit · Page 2 · passage 4",
    ),
    Example(
        "7.1 Stock broker s shall inform regarding the technical glitch to the stock "
        "exchanges and also to their clients within 2 hours from the time of occurrence "
        "of the glitch.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: review-of-framework-to-address-the-technical-glitches-in-sto · Page 4 · passage 4",
    ),
    Example(
        "In terms of Regulation 19D(6) of AIF Regulations, an Angel Fund shall on-board "
        "at least five Accredited Investors before declaring its first close in the "
        "manner as may be specified by SEBI from time to time.",
        "URGENCY_ONLY",
        False,
        "SEBI: revised-regulatory-framework-for-angel-funds-under-aif-regul · Page 2 · passage 2",
    ),
    Example(
        "Orders placed within the range of ±0.75% of the LTP shall be exempted from the "
        "framework for imposing penalty for high OTR.",
        "NO_TIMING",
        False,
        "SEBI: revision-of-order-to-trade-ratio-otr-framework_99501 · Page 1 · passage 9",
    ),
    Example(
        "Executive Summary Recently, writ petitions were filed before the Hon’ble "
        "Supreme Court of India to formulate appropriate rules and guidelines for "
        "conducting Digital Know Your Client (“KYC”) /e-KYC/video KYC (Know Your "
        "Customer) process through alternative methods with a view to ensuring that the "
        "process is more inclusive and accessible to all persons with disabilities in "
        "accordance with the provisions of the Rights o",
        "NO_TIMING",
        False,
        "SEBI: rights-of-persons-with-disabilities-act-2016-and-rules-made- · Page 7 · passage 2",
    ),
    Example(
        "(Number of years for which financial information is provided shall determine "
        "the validity of the accreditation) a) Copies of Income Tax Return(s) or ITR "
        "Acknowledgement (Only in case of individuals/HUF/Family Trust/Sole "
        "Proprietorship), or; b) Copies of audited Financial Statements, or; c) Copies "
        "of Audited Financial Statements prepared by the statutory auditor for the "
        "current financial Year (Only in case the entity",
        "NO_TIMING",
        False,
        "SEBI: simplification-of-requirements-for-grant-of-accreditation-to · Page 3 · passage 3",
    ),
    Example(
        "Those applicants who have filed application before January 03, 2026 and are "
        "granted registration subsequently are also considered as existing MBs for the "
        "purpose of this circular. 2.2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: specification-of-the-consequential-requirements-with-respect · Page 1 · passage 6",
    ),
    Example(
        "A DT undertaking such activities, as on the date of this circular, shall make "
        "the said disclosure on its website, within thirty days from the date of this "
        "circular. 2.7.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: specification-of-the-terms-and-conditions-for-debenture-trus · Page 2 · passage 11",
    ),
    Example(
        "The SOP shall be reviewed periodically as and when circumstances "
        "warrant/necessitates or at least once in a 5 years. 7.",
        "PERIOD_ONLY",
        False,
        "SEBI: streamlining-of-the-process-for-surrender-of-know-your-clien · Page 3 · passage 6",
    ),
    Example(
        "Further, Chapter VI of the DT Master Circular has, inter-alia, specified that "
        "the issuer and the Debenture Trustee shall ensure that the terms and "
        "conditions relating to periodical monitoring are incorporated in the debenture "
        "trust deed. 3.",
        "URGENCY_ONLY",
        False,
        "SEBI: timeline-for-submission-of-information-by-the-issuer-to-the- · Page 1 · passage 6",
    ),
    Example(
        "Portfolio Managers shall have the option to transfer select Investment "
        "Approach(es) or complete PMS business to an other Portfolio Manager within the "
        "same group , subject to the following conditions: 3.1.1.",
        "NO_TIMING",
        False,
        "SEBI: transfer-of-portfolios-of-clients-pms-business-by-portfolio- · Page 1 · passage 6",
    ),
    Example(
        "Accordingly, it has been decided that with effect from April 01, 2026 , in "
        "terms of Regulation 22(9) and Regulation 63(9) and subject to the investment "
        "valuation norms specified in Seventh Schedule of SEBI (Mutual Funds) "
        "Regulations, 2026, the mutual funds shall val ue physical Gold and Silver by "
        "using the polled spot prices published by the recognized stock exchanges which "
        "are used for settlement of physically deliv",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: valuation-of-physical-gold-and-silver-held-by-mutual-fund-sc · Page 1 · passage 9",
    ),
    Example(
        "However, AIFs can proceed with launch of their first schemes from the date of "
        "grant of SEBI registration (or) after 10 working days of filing of application "
        "with SEBI, whichever is later. 2.4.1.2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: -green-channel-aif-rollout-upon-document-acknowledgement-gar · Page 1 · passage 11",
    ),
    Example(
        "Obtain API access which will function as per the details provided, and to "
        "issue the UPI ID only after verification using the utility as shown in "
        "Annexure D. 6.2.2.",
        "NO_TIMING",
        False,
        "SEBI: adoption-of-standardised-validated-and-exclusive-upi-ids-for · Page 4 · passage 14",
    ),
    Example(
        "Risk Assessment: The Cyb er Security and Cyber Resilience Framework (CSCRF) of "
        "SEBI has mandated periodic Risk Assessment of the REs including their Third "
        "Party Service Providers to enhance visibility and conduct a reasonably "
        "accurate assessment of the overall cybersecurity risk posture.",
        "URGENCY_ONLY",
        False,
        "SEBI: ai-advisory · Page 6 · passage 4",
    ),
    Example(
        "Accordingly, it has been decided that with effect from April 01, 2026, the "
        "following conditions shall be applicable for intraday borrowings by mutual "
        "funds: 4.1.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: borrowing-by-mutual-funds_100329 · Page 2 · passage 1",
    ),
    Example(
        "Considering the above, Stock Exchanges and Clearing Corporations are advised "
        "to prepare and submit their Capacity Planning and Real Time Performance "
        "Monitoring Policy document for Commodity Derivatives Segment to SEBI within "
        "three months from the date of this Circular, after taking approval from their "
        "SCOT and the Governing Board. 6.",
        "NO_TIMING",
        False,
        "SEBI: capacity-planning-and-real-time-performance-monitoring-frame · Page 3 · passage 2",
    ),
    Example(
        "Schemes unable to meet the portfolio overlap criteria after 3 years shall be "
        "mandatorily merged with other schemes as per applicable provisions.",
        "PERIOD_ONLY",
        False,
        "SEBI: categorization-and-rationalization-of-mutual-fund-schemes_99 · Page 4 · passage 9",
    ),
    Example(
        "6.1.11.2 In case the transmission claim is not settled within the stipulated "
        "timelines or rejected, the entity shall communicate to the claimant, the "
        "reasons, in writing, for such delay/rejection.",
        "NO_TIMING",
        False,
        "SEBI: circ-ease-of-doing-investment-and-ease-of-doing-business-sim · Page 13 · passage 1",
    ),
    Example(
        "In the periodic statement of account / holding statement furnished to the "
        "investor, the regulated entity shall print, either;",
        "URGENCY_ONLY",
        False,
        "SEBI: circ-ease-of-doing-investments-modified-norms-for-nomination · Page 4 · passage 3",
    ),
    Example(
        "AIFs having schemes which have retained monies in terms of paragraph 3 above "
        "and AIFs tagged as ‘Inoperative Funds’ shall submit a n annual status report "
        "on retained monies and outstanding liabilities to SEBI and to investors of the "
        "relevant scheme(s), in the format as given at Annexure C of this circular.",
        "PERIOD_ONLY",
        False,
        "SEBI: circ-guidelines-for-winding-up-of-aifs-with-respect-to-reten · Page 4 · passage 3",
    ),
    Example(
        "Invocation of pledge 46.8 If the client fails to meet the payment obligation "
        "within the prescribed timeline, the TM shall, in accordance with its policy, "
        "invoke the pledge and liquidate the unpaid securities .",
        "NO_TIMING",
        False,
        "SEBI: circ-handling-of-client-s-unpaid-securities-by-trading-membe · Page 3 · passage 4",
    ),
    Example(
        "The cooling off period shall be of 15 minutes after trades are executed at or "
        "above 9.90% and so on, during which trading shall continue within the "
        "prevailing price band.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: circ-norms-for-base-price-price-bands-call-auction-in-pre-op · Page 2 · passage 9",
    ),
    Example(
        "Operational modalities for permitting invocation or release of encumbrances "
        "created prior to the commencement of buy-back period and freeze to continue to "
        "apply on invoked/released shares or other specified securities. e.",
        "NO_TIMING",
        False,
        "SEBI: circ-operationalisation-of-freezing-of-holdings-of-promoter- · Page 2 · passage 2",
    ),
    Example(
        "Life Cycle Fund with Maturity of 10 Years iii.",
        "NO_TIMING",
        False,
        "SEBI: circ-revision-of-monthly-cumulative-report-mcr-format_101522 · Page 2 · passage 8",
    ),
    Example(
        "Assets and Liabilities of the SPV (including specific reserves, if any): "
        "Provide the nature and amount of respective carrying value of assets and "
        "liabilities (including specific reserves, if any) on broad/grouped basis as "
        "determined in the annual audited financial statements of the SPV. 2.3.2.3.",
        "NO_TIMING",
        False,
        "SEBI: circ-status-of-spvs-post-conclusion-or-termination-of-conces · Page 2 · passage 5",
    ),
    Example(
        "Given the representation from the Institute of Cost Accountants of India and "
        "considering the recognition of Cost Accountants to conduct annual audit of "
        "RAs, under Regulation 25(3) of the RA Regulations, it has been decided to "
        "modify the aforementioned paragraph to clarify eligibility of members of the "
        "Institute of Cost Accountants of India to conduct annual audit of RAs. 4.",
        "PERIOD_ONLY",
        False,
        "SEBI: clarification-regarding-eligibility-of-members-of-the-instit · Page 1 · passage 6",
    ),
    Example(
        "This mechanism of compliance is applicable for all REs mentioned in row 3 of "
        "the table immediately above.",
        "NO_TIMING",
        False,
        "SEBI: compliance-guidelines-for-digital-accessibility-circular-rig · Page 3 · passage 10",
    ),
    Example(
        "Can the IT asset inventory be maintained manually (e.g., using Excel) instead "
        "of implementing an ITSM tool for organizations with minimal IT setups? Answer: "
        "While automated ITSM tools provide g reater efficiency and accuracy, smaller "
        "REs having lean structure with minimal IT infrastructure may maintain manual "
        "inventories, provided periodic updates and compliance with SEBI CSCRF asset "
        "management requirements are being",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 7 · passage 2",
    ),
    Example(
        "CSCRF is a result of coordinated effort s after an extensive consultations and "
        "discussion s with the stakeholders including Market Infrastructure "
        "Institutions (MIIs), REs, industry associations, government o rganizations "
        "(for example Indian Computer Emergency Response Team - CERT-In, National "
        "Critical Information Infrastructure Protection Centre , etc. ), Industry "
        "Standard Forum (ISF), information security auditors,",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 13 · passage 7",
    ),
    Example(
        "In view of the foregoing, it has been decided to defer the timeline for "
        "implementing the aforesaid Circular from December 15, 2025 to a further date "
        "to be notified separately. 6.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: deferment-of-timeline-for-implementation-of-phase-iii-of-nom · Page 2 · passage 2",
    ),
    Example(
        "Presently, annual inspection of stock brokers / deposi tory participants "
        "(‘Brokers’/DPs) are conducted by each of the MIIs (Stock "
        "Exchanges/Depositories/Clearing Corporations) separately.",
        "PERIOD_ONLY",
        False,
        "SEBI: ease-of-doing-business-eodb-policy-for-joint-annual-inspecti · Page 1 · passage 5",
    ),
    Example(
        "c) IAs/RAs who wish to communicate certified past performance data to clients "
        "(including prospective clients) must enrol with PaRRVA within three months of "
        "its operationalization, else such IAs/RAs will not be able to communicate "
        "certified past performance data to clients post three months from the date of "
        "operationalization of PaRRVA.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-business-interim-arrangement-for-certified-pas · Page 2 · passage 2",
    ),
    Example(
        "The periodicity and mechanism of sharing the said details shall be jointly "
        "deter mined by stock exchanges and depositories. 5.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-business-measures-relaxations-in-certain-repor · Page 3 · passage 7",
    ),
    Example(
        "Any LOC issued before April 02, 2026, may be submitted by the investors to DP "
        "for dematerialisation within the specified timeline i.e. 120 days from the "
        "date of issuance of LOC. 7.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-investment-and-ease-of-doing-business-doing-aw · Page 2 · passage 4",
    ),
    Example(
        "The timeline for processing of the service request for issuance of duplicate "
        "security certificates shall commence from the date of submission of complete "
        "documentation by the investor or issuance of newspaper publication by the "
        "listed company, whichever is later.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investment-review-of-simplification-of-procedu · Page 3 · passage 2",
    ),
    Example(
        "Based on discussion, the Panel recommended that to alleviate the issue faced "
        "by the in vestors that missed the March 31, 2021 deadline for re-lodgement, "
        "one more opportunity may be granted for them to re-lodge such shares for "
        "transfer. 3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-investment-special-window-for-re-lodgement-of- · Page 1 · passage 9",
    ),
    Example(
        "The Depositories are advised to:- 8.1. make amendments to the relevant bye "
        "-laws, rules and regulations for the implementation of the above decision "
        "immediately, as may be applicable/necessary;",
        "URGENCY_ONLY",
        False,
        "SEBI: ease-of-investments-and-ease-of-doing-business-measures-enha · Page 2 · passage 9",
    ),
    Example(
        "From the date of transition becoming effective, the FPI shall be required to "
        "comply with regulatory requirements as applicable to a regular FPI.” 3.6.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-regulatory-compliances-for-fpis-investing-only-in-go · Page 3 · passage 8",
    ),
    Example(
        "Further, the Depositories, after consultation with depository participants and "
        "ANMI, have requested for extension of time for implementation of Phase III of "
        "Nomination Circular till December 15, 2025 to allow depository participants "
        "sufficient time for development and testing.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: extension-of-timeline-for-implementation-of-phase-ii-and-iii · Page 2 · passage 2",
    ),
    Example(
        "An issuer who has listed sustainability-linked bonds shall provide disclosures "
        "as specified in Part II of Annexure-B along with its annual report and "
        "financial results .",
        "NO_TIMING",
        False,
        "SEBI: framework-for-environment-social-and-governance-esg-debt-sec · Page 4 · passage 6",
    ),
    Example(
        "In view of the aforesaid discussions and after deliberations in SMAC, it is "
        "decided to implement the following entity level intraday monitoring framework "
        "for index options to ensure market stability, while facilitating participation "
        "by various market participants including liquidity providers / market makers: "
        "4.1.",
        "NO_TIMING",
        False,
        "SEBI: framework-for-intraday-position-limits-monitoring-for-equity · Page 2 · passage 3",
    ),
    Example(
        "The following disclosures would be made by the NPOs on an Annual Basis (i.e.) "
        "within 60 days from end of Financial year: a. Disclosures on General aspects: "
        "i.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: framework-on-social-stock-exchange_96702 · Page 3 · passage 2",
    ),
    Example(
        "What are the communications excluded from the definition of research report? "
        "\"Research report” does not include the following communications: - i. comments "
        "on general trends in the securities market; ii. discussions on the broad-based "
        "indices; iii. commentaries on economic, political or market conditions; iv. "
        "periodic reports or other communications prepared for unit holders of Mutual "
        "Fund or Alternative Investment F",
        "NO_TIMING",
        False,
        "SEBI: frequently-asked-questions-faqs-related-to-regulatory-provis · Page 4 · passage 2",
    ),
    Example(
        "However, where Custodian Regulations prescribe any additional requirements, "
        "the Custodian shall ensure that such requirements are appropriately "
        "incorporated within the relevant bank wide policies or through supplementary "
        "procedures, as necessary. 5.1.3.",
        "NO_TIMING",
        False,
        "SEBI: guidelines-for-custodians_100118 · Page 4 · passage 7",
    ),
    Example(
        "The excess weight after adjustment from the top constituents would be distr "
        "ibuted amongst the other constituents as long as they meet the prudential "
        "norms mentioned",
        "NO_TIMING",
        False,
        "SEBI: implementation-of-eligibility-criteria-for-derivatives-on-ex · Page 4 · passage 3",
    ),
    Example(
        "Pursuant to feedback and requests received from various stakeholders, SEBI "
        "vide Circular dated March 21, 2025 ( link) extended the timeline for "
        "applicability of the Industry Standards to July 01, 2025 and referred the "
        "feedback received for simplification of the Industry Standards to ISF for "
        "consideration and review of existing Industry Standards. 6.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: industry-standards-on-minimum-information-to-be-provided-to- · Page 2 · passage 1",
    ),
    Example(
        " To enter into an agreement with the client providing all details including "
        "fee details, aspects of Conflict of interest disclosure and maintaining "
        "confidentiality of information.  To do a proper and unbiased risk – profiling "
        "and suitability assessment of the client.  To conduct audit annually.  To "
        "disclose the status of complaints on its website.  To disclose the name, "
        "proprietor name, type of registration, reg",
        "NO_TIMING",
        False,
        "SEBI: investor-charter-for-investment-advisers_94354 · Page 3 · passage 5",
    ),
    Example(
        "In this regard, pursuant to the discussions held with the stakeholders, it has "
        "been decided that the Trustee of special purpose distinct entity shall submit "
        "the disclosures, as mentioned in Annexure I and Annexure II, on a half yearly "
        "basis to the Board and on the stock e xchange where the SDIs are listed , "
        "within 30 days from the end of March or September.",
        "NO_TIMING",
        False,
        "SEBI: mandating-periodic-disclosure-requirements-securitised-debt- · Page 1 · passage 5",
    ),
    Example(
        "Provided that if a transaction with a related party, whether individually or "
        "taken together with previous transaction(s) during a financial year (including "
        "transaction(s) which are approved by way of ratification), do not exceed 1% of "
        "annual consolidated turnover of the listed entity as per the last audited "
        "financial statements of the listed entity or Rupees Ten Crore, whichever is "
        "lower, the listed entity shall prov",
        "PERIOD_ONLY",
        False,
        "SEBI: minimum-information-to-be-provided-to-the-audit-committee-an · Page 2 · passage 7",
    ),
    Example(
        "In terms of Regulation 13(5) of AIF Regulations, it may be noted that maximum "
        "extension permissible for AI only schemes shall be of five years, inclusive of "
        "tenure extended, if any, prior to conversion to AI -only scheme / LVF scheme. "
        "7.",
        "PERIOD_ONLY",
        False,
        "SEBI: modalities-for-migration-to-ai-only-schemes-and-relaxations- · Page 2 · passage 2",
    ),
    Example(
        "The Debenture Trustee shall on an annual basis update the debenture holders "
        "regarding the utilization of such funds.” 4.",
        "PERIOD_ONLY",
        False,
        "SEBI: modifications-to-chapter-iv-of-the-master-circular-for-deben · Page 2 · passage 11",
    ),
    Example(
        "Pursuant to the notice under para 3.1.2 to the investor: 3.2.1. in case "
        "investor reba lances his /her investments in SIF within the notice period of "
        "30 calendar days, the units of SIF of such investor shall be unfreezed, and no "
        "further action shall be taken with regard to compliance with Minimum "
        "Investment Threshold.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: monitoring-of-minimum-investment-threshold-under-specialized · Page 2 · passage 2",
    ),
    Example(
        "Further, CRA shall confirm the compliance of the same to SEBI after sending "
        "intimations to all existing clients 2.6.",
        "NO_TIMING",
        False,
        "SEBI: obligations-on-cras-while-undertaking-rating-of-financial-in · Page 3 · passage 8",
    ),
    Example(
        "Prior to completion of term of the existing ED, the MII shall forward the "
        "names to SEBI at least two months before the last working day of the existing "
        "ED. 3.1.5.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: provisions-relating-to-strengthening-governance-of-market-in · Page 2 · passage 12",
    ),
    Example(
        "In case of any revisions in the reporting format, revised format shall be made "
        "available on websites of industry associations / the AIF Standard Setting "
        "Forum at least 1 month prior to end of the quarter.” 4.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: regulatory-reporting-by-aifs_100120 · Page 1 · passage 5",
    ),
    Example(
        "Such a certificate shall be submitted not later than 30th April and 31st "
        "October of every year. 2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: relaxation-in-the-timeline-to-submit-net-worth-certificate-b · Page 1 · passage 5",
    ),
    Example(
        "Any request for review, appeal or waiver of penalty filed against actions "
        "taken by the MC from the date of implementation of this circular shall be "
        "handled by a mechanism setup by the Governing Board of the MII with Public "
        "Interest Directors and/or Independent External Professionals not forming part "
        "of the MC.",
        "NO_TIMING",
        False,
        "SEBI: review-appeal-or-waiver-of-penalty-requests-emanating-out-of · Page 2 · passage 3",
    ),
    Example(
        "7.3 Stock brokers shall submit a Preliminary Incident Report (as per the "
        "format prescribed by stock exchanges) to the stock exchange within T+1 day of "
        "the incident (T being the date of the incident).",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: review-of-framework-to-address-the-technical-glitches-in-sto · Page 4 · passage 7",
    ),
    Example(
        "The first close of an Angel Fund shall be declared not later than 12 months "
        "from the date of SEBI communication for taking the PPM of the Angel Fund on "
        "record. 3.2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: revised-regulatory-framework-for-angel-funds-under-aif-regul · Page 2 · passage 4",
    ),
    Example(
        "However, for equity option contracts, orders placed within the range of ±40% "
        "of LTP (premium) or ±INR 20,",
        "NO_TIMING",
        False,
        "SEBI: revision-of-order-to-trade-ratio-otr-framework_99501 · Page 1 · passage 10",
    ),
    Example(
        "The major roles and responsibilities of the Nodal Officer shall be to ensure "
        "digital accessibility for every investor by ensuring that activities, "
        "including but not limited to conducting accessibility audits, mitigation of "
        "accessibility audit findings, implementation of accessibility guid elines, and "
        "timely redressal of grievance.",
        "NO_TIMING",
        False,
        "SEBI: rights-of-persons-with-disabilities-act-2016-and-rules-made- · Page 8 · passage 8",
    ),
    Example(
        "The latest net-worth certificate shall not be older than 6 months.",
        "PERIOD_ONLY",
        False,
        "SEBI: simplification-of-requirements-for-grant-of-accreditation-to · Page 3 · passage 4",
    ),
    Example(
        "FPIs who wish to continue with their registration for the subsequent block of "
        "three years (10 years in case of SWAGAT-FI), should pay the fees to their DDPs "
        "and inform change in information, if any, as submitted earlier.",
        "PERIOD_ONLY",
        False,
        "SEBI: single-window-automatic-and-generalised-access-for-trusted-f · Page 3 · passage 4",
    ),
    Example(
        "Page 2 of 9 Table (I): Phased implementation of capital adequacy and liquid "
        "net worth requirements Category Phase (I) - on or before January 02, 2027 "
        "Phase (II) - on or before January 02, 2028 capital adequacy being net worth "
        "liquid net worth requirement capital adequacy being net worth liquid net worth "
        "requirement Category I Rs. 25 cr Rs. 6.25 cr Rs.50 cr Rs.12.5 cr Category II "
        "Rs. 7.5 cr Rs. 1.875 cr Rs.10 cr Rs.2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: specification-of-the-consequential-requirements-with-respect · Page 2 · passage 1",
    ),
    Example(
        "Before undertaking any activities which are not regulated by SEBI, there shall "
        "be an upfront written disclosure by the DT , as mentioned at paragraph 2.6 and "
        "2.7 above,",
        "NO_TIMING",
        False,
        "SEBI: specification-of-the-terms-and-conditions-for-debenture-trus · Page 2 · passage 15",
    ),
    Example(
        "Zero-trust security model (PR.AA.S4 and PR.AA.S5 guidelines – Page 97): “REs "
        "shall follow zero -trust security model in such a way that access (from within "
        "or outside REs’ network) to their critical systems is denied by default and "
        "allowed only after proper authentication and authorization.”",
        "NO_TIMING",
        False,
        "SEBI: technical-clarifications-to-cybersecurity-and-cyber-resilien · Page 6 · passage 13",
    ),
    Example(
        "Reports/ Certificate Periodicity Security cover Certificate (in the format as "
        "specified in Annex-VA to DT Master Circular) Quarterly basis within 60 days "
        "from end of each quarter except last quarter when submission is to be made "
        "within 75 days.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: timeline-for-submission-of-information-by-the-issuer-to-the- · Page 1 · passage 8",
    ),
    Example(
        "If the entire PMS business is transferred, the certificat e of PMS "
        "registration of transferor shall be surrendered within a period of 45 working "
        "days from the date of completion of transfer. 3.1.2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: transfer-of-portfolios-of-clients-pms-business-by-portfolio- · Page 1 · passage 7",
    ),
    Example(
        "In terms of proviso to Regulation 12(3A) of AIF Regulations, AI only funds and "
        "LVFs are exempt from filing their PPM with SEBI through Merchant Banker and "
        "incorporating comments of SEBI in their PPM i.e. AI only funds and LVFs can "
        "launch their scheme immediately upon filing of PPM with SEBI .",
        "NO_TIMING",
        False,
        "SEBI: -green-channel-aif-rollout-upon-document-acknowledgement-gar · Page 3 · passage 10",
    ),
    Example(
        "the equity cash segment of the Stock Exchanges with effect from the date of "
        "applicability of the aforesaid SEBI circular dated January 16, 2026 and in the "
        "manner specified therein. 7.",
        "NO_TIMING",
        False,
        "SEBI: borrowing-by-mutual-funds_100329 · Page 3 · passage 1",
    ),
    Example(
        "6.1.11.3 In case the entity does not settle the transmission claim within the "
        "given timelines and such delay is attributable to the entity, SEBI may "
        "undertake appropriate action in terms of relevant act/regulations/circulars "
        "etc. 6.1.11.4 For all cases of transmission involving securities held in "
        "physical mode, the claimant should have the original security certificate(s) "
        "(except for cases which fall under duplicate-",
        "NO_TIMING",
        False,
        "SEBI: circ-ease-of-doing-investment-and-ease-of-doing-business-sim · Page 13 · passage 2",
    ),
    Example(
        "Send bi-annual messages to such investors by way of emails and SMS, nudging "
        "and guiding them to provide nomination b.",
        "PERIOD_ONLY",
        False,
        "SEBI: circ-ease-of-doing-investments-modified-norms-for-nomination · Page 4 · passage 7",
    ),
    Example(
        "The TM shall give reasonable notice to the client before invocation of pledge "
        "and liquidation of unpaid securities.",
        "NO_TIMING",
        False,
        "SEBI: circ-handling-of-client-s-unpaid-securities-by-trading-membe · Page 3 · passage 5",
    ),
    Example(
        "If the trades are executed at or above 9.90% and so on, during the last 30 "
        "minutes of trading, then the cooling-off period shall be of 5 minutes. 5.1.3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: circ-norms-for-base-price-price-bands-call-auction-in-pre-op · Page 3 · passage 1",
    ),
    Example(
        "Life Cycle Fund with Maturity of 15 Years iv.",
        "NO_TIMING",
        False,
        "SEBI: circ-revision-of-monthly-cumulative-report-mcr-format_101522 · Page 2 · passage 9",
    ),
    Example(
        "Contingent Liabilities: Details of Contingent Liabilities of the SPV as set "
        "out in its annual audited financial statements. 2.3.2.4.",
        "NO_TIMING",
        False,
        "SEBI: circ-status-of-spvs-post-conclusion-or-termination-of-conces · Page 2 · passage 6",
    ),
    Example(
        "In terms of regulation 25(3) of the RA Regulations, research analyst or "
        "research entity shall conduct annual audit in respect of compliance with RA "
        "regulations and circulars issued thereunder from a member of Institute of "
        "Chartered Accountants of India or Institute of Company Secretaries of India or "
        "Institute of Cost Accountants of India within six months from the end of each "
        "financial year and submit a compliance au",
        "PERIOD_ONLY",
        False,
        "SEBI: clarification-regarding-eligibility-of-members-of-the-instit · Page 1 · passage 9",
    ),
    Example(
        "Further, REs should consider a nd assess factors such as impact of system "
        "failure on operations, sensitivity of data processed, potential security risks "
        "(e.g. PII data breach) and their connectivity to critical systems before "
        "classifying systems as critical/ non-critical. 13.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 7 · passage 14",
    ),
    Example(
        "Periodic audit s shall be conducted by a CERT-In empanelled IS auditing "
        "organization to audit the implementation and provide compliance with the "
        "applicable standards and mandatory guidelines mentioned in the CSCRF. f.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 15 · passage 12",
    ),
    Example(
        "Joint annual inspection instead of separate inspections by MIIs: Entities "
        "selected for annual inspections shall be inspected for all segments jointly by "
        "all exchanges along with their depository participant (DP) operations (if "
        "broker is also registered as DP) and clearing activity (if the broker is",
        "PERIOD_ONLY",
        False,
        "SEBI: ease-of-doing-business-eodb-policy-for-joint-annual-inspecti · Page 1 · passage 8",
    ),
    Example(
        "d) The applicable period for such past performance data shall be prior to the "
        "date of operationalization of PaRRVA.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-business-interim-arrangement-for-certified-pas · Page 2 · passage 3",
    ),
    Example(
        "The investors shall have a demat erialisation (“demat”) account before "
        "submitting the service request.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investment-and-ease-of-doing-business-doing-aw · Page 3 · passage 3",
    ),
    Example(
        "I/We_____________________________________________________________ "
        "__________________hereby further swear / solemnly declare that if, after the "
        "duplicate share certificate(s) is / are issued to us as aforesaid, the "
        "original security(ies) certificate(s) is / are at any time subsequently, "
        "found, reco vered or traced by us or by anyone on our behalf, then, we "
        "unconditionally undertake not to deal with the said original s",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investment-review-of-simplification-of-procedu · Page 5 · passage 4",
    ),
    Example(
        "Thus, in order to facilitate ease of investing for investors and to secure the "
        "rights of investors in the securities which were purchased by them, it has "
        "been decided to open a special window only for re -lodgement of transfer deeds "
        ", which were lodged prior to the deadline of April 01, 2019 and "
        "rejected/returned/not attended to",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investment-special-window-for-re-lodgement-of- · Page 1 · passage 10",
    ),
    Example(
        "Transfer deed executed prior to April 01, 2019; c.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-investment-special-window-for-transfer-and-dem · Page 2 · passage 4",
    ),
    Example(
        "8.2. bring the provisions of this circular to the notice of their DPs and also "
        "to disseminate the same on their website; and 8.3. put in place appropriate "
        "systems and procedures to give effect to the provisions made in this circular "
        "within a period of 75 days, and implement the provisions after user testing "
        "within 90 days from the date of issuance of this circular. 9.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-investments-and-ease-of-doing-business-measures-enha · Page 2 · passage 10",
    ),
    Example(
        "After due consideration, SEBI has decided to extend the timeline until "
        "September 03, 2026,",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: extension-of-timeline-for-enrolment-with-parrva-as-specified · Page 1 · passage 8",
    ),
    Example(
        "An Issuer who is eligible to list specified securities on SME exchange as "
        "defined in Regulation 2(1)(ddd ) of the SEBI (Issue of Capital and Disclosure "
        "Requirements) Regulations, 2018 and intends to issue ESG debt securities shall "
        "have to comply with the post listing o bligations as specified under "
        "‘Continuous disclosure requirements’ specified in Annexure-A and Annexure-B, "
        "and paragraph 2 of Chapter IX (green Debt S",
        "NO_TIMING",
        False,
        "SEBI: framework-for-environment-social-and-governance-esg-debt-sec · Page 5 · passage 8",
    ),
    Example(
        "Stock Exchanges and Clearing Corporations are advised to prepare a joint "
        "Standard Operating Procedure (SOP) detailing modalities for intraday "
        "monitoring in line with the instant circular and submit the same to SEBI "
        "within 15 days from the date of this circular and issue an SO P to market "
        "participants before the Circular becomes effective. 6.",
        "NO_TIMING",
        False,
        "SEBI: framework-for-intraday-position-limits-monitoring-for-equity · Page 3 · passage 7",
    ),
    Example(
        "The following disclosures would be made by the NPOs on an Annual Basis of the "
        "financial year by October 31st of each year or before the due date of filing "
        "the income tax return as prescribed under the provisions of the Income Tax "
        "Act, 1961, whichever is later: a. Disclosures on General aspects: i.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: framework-on-social-stock-exchange_96702 · Page 4 · passage 1",
    ),
    Example(
        "What are the communications excluded under periodic reports referred to in "
        "answer to FAQ No. 4 above? Periodic reports such as sending financial account "
        "statements, annual reports and any other communication as required under the "
        "specific regulations prepared for unit holders of Mutual Fund or Alternative "
        "Investment Fund or clients of Portfolio Managers and Investment Advisers are "
        "excluded from the definition of rese",
        "NO_TIMING",
        False,
        "SEBI: frequently-asked-questions-faqs-related-to-regulatory-provis · Page 5 · passage 3",
    ),
    Example(
        "Considering the challenges highlighted by QSBs in ensuring timely readiness of "
        "systems on or before November 01, 202 5 and request to extend the same for "
        "ensuring smooth implementation, it has been decided to extend the timeline for "
        "QSBs for putting in place the necessary systems and processes for enabling "
        "seamless participation of investors in optional T+0 settlement cycle.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: further-extension-of-timeline-for-mandatory-implementation-o · Page 2 · passage 1",
    ),
    Example(
        "Custodian (except which is a Bank or a subsidiary/ associate/ joint venture of "
        "a Bank) shall, before appointing directors, Key Managerial Personnel (KMP), "
        "consult the Nomination and Remuneration Committee with regard to their "
        "appointment, tenure and remuneration. 5.2.",
        "NO_TIMING",
        False,
        "SEBI: guidelines-for-custodians_100118 · Page 5 · passage 5",
    ),
    Example(
        "4.4 Stock Exchanges shall ensure that the process of compliance with "
        "prudential norms for the aforementi oned indices are implemented latest by the "
        "aforementioned timelines. 5.",
        "NO_TIMING",
        False,
        "SEBI: implementation-of-eligibility-criteria-for-derivatives-on-ex · Page 4 · passage 6",
    ),
    Example(
        "The derivative segment on such special trading days shall be closed after 10 "
        "minutes from the close of the order entry period in CAS.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: introduction-of-closing-auction-session-cas-in-the-equity-ca · Page 4 · passage 2",
    ),
    Example(
        "In case of any grie vance / complaint, an investor may approach the concerned "
        "Investment Adviser who shall strive to redress the grievance immediately, but "
        "not later than 21 days of the receipt of the grievance.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: investor-charter-for-investment-advisers_94354 · Page 4 · passage 5",
    ),
    Example(
        "a) Percentage of assets maturing within one year",
        "PERIOD_ONLY",
        False,
        "SEBI: mandating-periodic-disclosure-requirements-securitised-debt- · Page 3 · passage 4",
    ),
    Example(
        "The detailed operating gu idelines shall be specified by d epositories on or "
        "before July 01, 2025. 8.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: margin-obligations-to-be-given-by-way-of-pledge-re-pledge-in · Page 3 · passage 7",
    ),
    Example(
        "Further, it has been decided to exempt LVFs from following the standard "
        "template of placement memorandum and annual audit of the terms of placement "
        "memorandum, without requirement of specific waivers from investors.",
        "NO_TIMING",
        False,
        "SEBI: modalities-for-migration-to-ai-only-schemes-and-relaxations- · Page 2 · passage 3",
    ),
    Example(
        "3.2.2. in case the investor fails to rebalance the investments within the "
        "aforesaid 30 calendar day period, the frozen units shall be automatically "
        "redeemed by the AMC, at the applicable Net Asset Value of the next immediate "
        "business day after the 30th calendar day of the notice period. 3.3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: monitoring-of-minimum-investment-threshold-under-specialized · Page 2 · passage 3",
    ),
    Example(
        "Internal Audit Report Every CRA undertaking any activity regulated by other "
        "FSR(s) shall ensure that, in respect of such activities, it submits an "
        "undertaking as part of the half-yearly internal audit report, confirming "
        "compliance with the requirements of CRA Regulations and",
        "PERIOD_ONLY",
        False,
        "SEBI: obligations-on-cras-while-undertaking-rating-of-financial-in · Page 3 · passage 9",
    ),
    Example(
        "Public Interest Directors ( PIDs) shall ensure that the performance of EDs is "
        "assessed based on an annual performance evaluation mechanism similar to that "
        "of MD. 3.1.6.",
        "PERIOD_ONLY",
        False,
        "SEBI: provisions-relating-to-strengthening-governance-of-market-in · Page 2 · passage 13",
    ),
    Example(
        "It has been decided that, AIFs will submit a comprehensive Annual Activity "
        "Report at the end of March of each financial year.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: regulatory-reporting-by-aifs_100120 · Page 1 · passage 9",
    ),
    Example(
        "Accordingly, in order to be eligible to offer the margin trading facility to "
        "their clients, the Stock Brokers shall submit the certificate as stated in "
        "para 1 above within 45 days from the half year ended on September 30 and "
        "within 60 days from the half year ended on 31st March.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: relaxation-in-the-timeline-to-submit-net-worth-certificate-b · Page 1 · passage 7",
    ),
    Example(
        "However, if T+1 day falls on a trading holiday; submission may be done on next "
        "trading day.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: review-of-framework-to-address-the-technical-glitches-in-sto · Page 4 · passage 8",
    ),
    Example(
        "Existing Angel Funds which have not yet declared first close, s hall do so on "
        "or before September 08, 2026. 3.3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: revised-regulatory-framework-for-angel-funds-under-aif-regul · Page 2 · passage 5",
    ),
    Example(
        "A grievance redressal mechanism specific to accessibility issues shall be "
        "institutionalized within the REs.",
        "NO_TIMING",
        False,
        "SEBI: rights-of-persons-with-disabilities-act-2016-and-rules-made- · Page 8 · passage 10",
    ),
    Example(
        "In terms of amended sub-regulation (4) of regulation 3 of MB Regulations, "
        "every existing MB shall categorize itself either as Category I or Category II "
        "by complying with net worth and liquid net worth requirements within such time "
        "period and in the manner as specified by the Board.",
        "NO_TIMING",
        False,
        "SEBI: specification-of-the-consequential-requirements-with-respect · Page 2 · passage 2",
    ),
    Example(
        "The said disclosure shall be made, on all engagement letters, contracts, "
        "agreements, and business communication that such activities do not fall within "
        "the regulatory purview of SEBI.",
        "NO_TIMING",
        False,
        "SEBI: specification-of-the-terms-and-conditions-for-debenture-trus · Page 3 · passage 2",
    ),
    Example(
        "RC.RP.S2 guideline (Page 128-129): “In the event of disruption of any one or "
        "more of the critical systems, the RE shall, within 30 minutes of the incident, "
        "declare that incident as ‘Disaster’ based on the business impact analysis.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: technical-clarifications-to-cybersecurity-and-cyber-resilien · Page 9 · passage 1",
    ),
    Example(
        "A statement of value of pledged securities A statement of value for Debt "
        "Service Reserve Account or any other form of security offered Net worth "
        "certificate of guarantor in case debt securities are secured by way of "
        "personal guarantee) Half yearly basis within 60 days from end of each "
        "half-year.",
        "NO_TIMING",
        False,
        "SEBI: timeline-for-submission-of-information-by-the-issuer-to-the- · Page 1 · passage 9",
    ),
    Example(
        "The entire process of transfer shall be completed as expeditiously as possible "
        "but not later than two months from the date of approval.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: transfer-of-portfolios-of-clients-pms-business-by-portfolio- · Page 2 · passage 7",
    ),
    Example(
        "However, first schemes of AI only funds and/ or LVFs can be launched from the "
        "date of grant of SEBI registration.",
        "NO_TIMING",
        False,
        "SEBI: -green-channel-aif-rollout-upon-document-acknowledgement-gar · Page 3 · passage 11",
    ),
    Example(
        "The intermediaries will have to stop accepting payments using the current UPI "
        "IDs post the specified deadline.",
        "NO_TIMING",
        False,
        "SEBI: adoption-of-standardised-validated-and-exclusive-upi-ids-for · Page 13 · passage 7",
    ),
    Example(
        "Any surplus funds remaining after settling the client’s obligation shall be "
        "credited to the client’s ledger.",
        "NO_TIMING",
        False,
        "SEBI: circ-handling-of-client-s-unpaid-securities-by-trading-membe · Page 3 · passage 9",
    ),
    Example(
        "The price band would be flexed by 5% of the base price after the cooling off "
        "period, for a maximum of two instances in one direction. 5.1.4.",
        "NO_TIMING",
        False,
        "SEBI: circ-norms-for-base-price-price-bands-call-auction-in-pre-op · Page 3 · passage 2",
    ),
    Example(
        "Life Cycle Fund with Maturity of 25 Years vi.",
        "NO_TIMING",
        False,
        "SEBI: circ-revision-of-monthly-cumulative-report-mcr-format_101522 · Page 2 · passage 11",
    ),
    Example(
        "Exit Strategy and Timeline: A clear plan of action detailing how and when the "
        "InvIT intends to exit its investment in the SPV or plans to acquire new "
        "infrastructure project, along with the brief details of steps taken so far and "
        "expected timeline for completion. 2.3.2.7.",
        "NO_TIMING",
        False,
        "SEBI: circ-status-of-spvs-post-conclusion-or-termination-of-conces · Page 2 · passage 10",
    ),
    Example(
        "What is periodicity of Vulnerability Assessment and Penetration Testing (VAPT) "
        "and Cyber audit for Qualified Stock Brokers (QSBs)? Answer: SEBI vide circular "
        "‘Enhanced obligations and responsibilities on Qualified Stock Brokers (QSBs)’ "
        "(SEBI/HO/MIRSD/MIRSD-PoD- 1/P/CIR/2023/24) dated February 06, 2023 has "
        "designated certain stock brokers as a Qualified Stock Brokers (QSBs) to meet "
        "enhanced obligations and responsibil",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 8 · passage 8",
    ),
    Example(
        "REs shall establish appropriate security mechanism s through Security "
        "Operations Centre (SOC) [RE’s own / group SOC, third-party SOC, or market SOC] "
        "for continuous monitoring of security events and timely detection of anomalous "
        "activities. b.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 16 · passage 2",
    ),
    Example(
        "This will ensure that entities selected by MIIs for their annual inspection "
        "shall be inspected jointly by all MIIs at one time. II.",
        "PERIOD_ONLY",
        False,
        "SEBI: ease-of-doing-business-eodb-policy-for-joint-annual-inspecti · Page 2 · passage 3",
    ),
    Example(
        "Users a re requested to apply their due diligence before making investment "
        "decisions on the basis of the given past performance data.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-business-interim-arrangement-for-certified-pas · Page 2 · passage 9",
    ),
    Example(
        "I/We _________________________________________________________am/are making "
        "the above solemn declaration on oath with full knowledge o f the fact that in "
        "the event the original security (ies) certificate(s) issued is /are found, "
        "recovered and traced by me/us and instead of surrendering the same is / are "
        "dealt with by me/us as aforesaid, the Company will be at liberty to adopt "
        "civil and / or criminal proceedings again",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investment-review-of-simplification-of-procedu · Page 5 · passage 5",
    ),
    Example(
        "Listed companies, RTAs and Stock Exchanges shall publicize the opening of this "
        "special window through various media including print and social media, on a "
        "bi- monthly basis during the six-month period. 6.",
        "PERIOD_ONLY",
        False,
        "SEBI: ease-of-doing-investment-special-window-for-re-lodgement-of- · Page 2 · passage 4",
    ),
    Example(
        "Latest Client Master List (‘CML’), not older than 2 months , of the demat "
        "account of the transferee, duly attested by the Depository Participant; and f.",
        "PERIOD_ONLY",
        False,
        "SEBI: ease-of-doing-investment-special-window-for-transfer-and-dem · Page 2 · passage 7",
    ),
    Example(
        "In case of GS-FPIs, periodicity of KYC review by custodians shall be "
        "harmonized with the applicable periodicity of KYC review of their respective "
        "bank accounts, as prescribed by RBI.” 4.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-regulatory-compliances-for-fpis-investing-only-in-go · Page 3 · passage 10",
    ),
    Example(
        "22. “Financial Year” means the year starting from April 1 and ending on March "
        "31 in the following year.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: format-of-disclosure-document-for-portfolio-managers_96479 · Page 7 · passage 5",
    ),
    Example(
        "SSE may specify additional parameters that may be required to be disclosed by "
        "NPO on annual basis. 4.3.",
        "PERIOD_ONLY",
        False,
        "SEBI: framework-on-social-stock-exchange_96702 · Page 4 · passage 10",
    ),
    Example(
        "Application can be submitted to RAASB at https://membershipraia.bseindia.com/ "
        "RAASB shall, after scrutiny of the application, recommend the application to "
        "SEBI for grant of registration as RA.",
        "NO_TIMING",
        False,
        "SEBI: frequently-asked-questions-faqs-related-to-regulatory-provis · Page 7 · passage 3",
    ),
    Example(
        "Custodian shall devise a clear and a well-documented risk management policy "
        "which encompasses all relevant risks that may have to be borne for custodian "
        "activities such as operational risk, legal risk, risks such as mis-utilization "
        "of clients’ sensitive information, etc., after taking inputs from Risk "
        "Management Committee. 5.2.2.",
        "NO_TIMING",
        False,
        "SEBI: guidelines-for-custodians_100118 · Page 5 · passage 7",
    ),
    Example(
        "A 10 minutes post close session on such special trading days shall begin 10 "
        "minutes after the close of the derivatives segment. 4.3. Reference Price for "
        "CAS: 4.3.1.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: introduction-of-closing-auction-session-cas-in-the-equity-ca · Page 4 · passage 3",
    ),
    Example(
        "SCORES 2.0 (a web based centralized grievance redressal system of SEBI for "
        "facilitating effective grievance redressal in time-bound manner) "
        "(https://scores.sebi.gov.in)",
        "URGENCY_ONLY",
        False,
        "SEBI: investor-charter-for-investment-advisers_94354 · Page 4 · passage 7",
    ),
    Example(
        " Right to be Heard and Satisfactory Grievance Redressal  Right to have "
        "timely redressal  Right to Exit from Financial product or service in "
        "accordance with the terms and conditions agreed with the research analyst  "
        "Right to receive clear guidance and caution notice when dealing in Complex and "
        "High-Risk Financial Products and Services  Additional Rights to vulnerable "
        "consumers - Right to get access to services in",
        "URGENCY_ONLY",
        False,
        "SEBI: investor-charter-for-research-analysts_94355 · Page 6 · passage 1",
    ),
    Example(
        "b) Percentage of assets maturing within one to three year",
        "PERIOD_ONLY",
        False,
        "SEBI: mandating-periodic-disclosure-requirements-securitised-debt- · Page 3 · passage 5",
    ),
    Example(
        "The Standing Committee on Technology (SCOT) shall hold separate quarterly "
        "meetings with the ED of Vertical 1, without the presence of MD and other "
        "executives.",
        "PERIOD_ONLY",
        False,
        "SEBI: provisions-relating-to-strengthening-governance-of-market-in · Page 3 · passage 3",
    ),
    Example(
        "“The broker shall submit to the stock exchange a half-yearly certificate, as "
        "on 31st March and 30th September of each year, from an auditor confirming the "
        "net worth.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: relaxation-in-the-timeline-to-submit-net-worth-certificate-b · Page 2 · passage 2",
    ),
    Example(
        "7.4 Stock brokers shall submit a Root Cause Analysis Report (RCA) (as per the "
        "format prescribed by stock exchanges ) of the technical glitch to stock "
        "exchange, within 14 working days from the date of the incident.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: review-of-framework-to-address-the-technical-glitches-in-sto · Page 4 · passage 9",
    ),
    Example(
        "In case the first close of an Angel Fund is not declared within the timeline "
        "specified above, the Ang el Fund shall refile the PPM with SEBI as per "
        "applicable provisions of AIF Regulations by paying requisite fee to SEBI. B. "
        "Investments by Angel Funds – 4.",
        "NO_TIMING",
        False,
        "SEBI: revised-regulatory-framework-for-angel-funds-under-aif-regul · Page 2 · passage 6",
    ),
    Example(
        "Any application of a client with disability shall be rejected by the REs only "
        "after a review by a designated human officer and the said officer shall be "
        "empowered to override automated rejections and approve applications on a case "
        "by case basis, thereby ensuring equitable access to services of the REs for "
        "persons with disabilities.",
        "NO_TIMING",
        False,
        "SEBI: rights-of-persons-with-disabilities-act-2016-and-rules-made- · Page 9 · passage 11",
    ),
    Example(
        "In case of SWAGAT-FI FPI, periodicity of KYC review by custodians shall be 10 "
        "years.” 4.",
        "PERIOD_ONLY",
        False,
        "SEBI: single-window-automatic-and-generalised-access-for-trusted-f · Page 3 · passage 8",
    ),
    Example(
        "However, it is required to intimate SEBI through email to mb@sebi.gov.in, on "
        "or before January 02, 2027, about the category that an MB intends to continue "
        "from January 03, 2027.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: specification-of-the-consequential-requirements-with-respect · Page 2 · passage 4",
    ),
    Example(
        "For the existing and ongoing arrangements w.r.t the non-SEBI regulated "
        "activities, a DT shall make disclosures, as mentioned at paragraph 2.6 and 2.7 "
        "above, and obtain confirmation/ acknowledgement from the stakeholders "
        "including clients, beneficiaries and counterparties, and submit a compliance "
        "report to the Board, withi n a period of six months from the date of this "
        "circular. 2.11.",
        "NO_TIMING",
        False,
        "SEBI: specification-of-the-terms-and-conditions-for-debenture-trus · Page 3 · passage 4",
    ),
    Example(
        "Transferor KRA shall notify stakeholders (intermediaries including other KRAs, "
        "investors, creditors, Industry Associations etc) within seven working days, "
        "regarding its decision to wind down duly mentioning a sufficient notice",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: streamlining-of-the-process-for-surrender-of-know-your-clien · Page 5 · passage 10",
    ),
    Example(
        "The recovery plan shall be scenario-based and in line with the RTO and RPO "
        "specified.” Clarification: Above-mentioned guideline shall now be read as "
        "under as referred from IOSCO3: Resumption within two hours (i.e. two-hour "
        "RTO).",
        "NO_TIMING",
        False,
        "SEBI: technical-clarifications-to-cybersecurity-and-cyber-resilien · Page 9 · passage 4",
    ),
    Example(
        "Financials/value of guarantor prepared on basis of audited financial statement "
        "etc. of the guarantor (secured by way of corporate guarantee) Annual basis "
        "within 60 days from end of each financial year.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: timeline-for-submission-of-information-by-the-issuer-to-the- · Page 1 · passage 10",
    ),
    Example(
        "Accordingly, Angel Funds can proceed with circulation of the PPM to their "
        "investors for soliciting funds from the date of grant of SEBI registration. "
        "2.5.2.3.",
        "NO_TIMING",
        False,
        "SEBI: -green-channel-aif-rollout-upon-document-acknowledgement-gar · Page 4 · passage 2",
    ),
    Example(
        "Overnight funds can deploy, not exceeding, 5% of the net assets of the scheme "
        "in G -secs and/or T -bills with a residual maturity of upto 30 days for the "
        "purpose of placing the same as margin and collateral for certain transactions.",
        "PERIOD_ONLY",
        False,
        "SEBI: categorization-and-rationalization-of-mutual-fund-schemes_99 · Page 5 · passage 3",
    ),
    Example(
        "ATTESTATION Signed before me, by above signatories, identity/(ies) of whom "
        "has/have been verified.",
        "NO_TIMING",
        False,
        "SEBI: circ-ease-of-doing-investment-and-ease-of-doing-business-sim · Page 38 · passage 4",
    ),
    Example(
        "**Any odd lot after division shall be transferred to the first nominee "
        "mentioned in the form. *** The aforesaid details shall be optionally provided "
        "for the Guardian, in case of nominee is a minor.",
        "NO_TIMING",
        False,
        "SEBI: circ-ease-of-doing-investments-modified-norms-for-nomination · Page 6 · passage 11",
    ),
    Example(
        "No new scheme shall be launched and no management fees shall be charged from "
        "the investors from the date of obtaining Inoperative Fund status.",
        "NO_TIMING",
        False,
        "SEBI: circ-guidelines-for-winding-up-of-aifs-with-respect-to-reten · Page 8 · passage 9",
    ),
    Example(
        "In this regard, it is clarified that TM may request for release of pledge any "
        "time before auto-release by depository.",
        "NO_TIMING",
        False,
        "SEBI: circ-handling-of-client-s-unpaid-securities-by-trading-membe · Page 3 · passage 11",
    ),
    Example(
        "The price band would be flexed by 3% of the base price, after a cooling off "
        "period. 5.3.2.",
        "NO_TIMING",
        False,
        "SEBI: circ-norms-for-base-price-price-bands-call-auction-in-pre-op · Page 3 · passage 7",
    ),
    Example(
        "Life Cycle Fund with Maturity of 30 Years Sub total - IV V Solution Oriented "
        "Schemes ** i. Retirement Fund ii.",
        "NO_TIMING",
        False,
        "SEBI: circ-revision-of-monthly-cumulative-report-mcr-format_101522 · Page 2 · passage 12",
    ),
    Example(
        "It mentions VAPT related reporting, periodicity, and timelines. However, it is "
        "being clarified that: a.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 9 · passage 3",
    ),
    Example(
        "All cybersecurity incidents shall be reported in a timely manner through the "
        "SEBI incident reporting portal. b.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 16 · passage 11",
    ),
    Example(
        "It has been decided to revise the criteria for annual inspection as follows: "
        "a.",
        "PERIOD_ONLY",
        False,
        "SEBI: ease-of-doing-business-eodb-policy-for-joint-annual-inspecti · Page 2 · passage 6",
    ),
    Example(
        "f) After two years from the date of operationalisation of PaRRVA, IAs/RAs will "
        "be permitted to communicate/display only PaRRVA verified risk and return "
        "metrics and will not be permitted to use past performance data related to the "
        "period prior to the date of operationalisation of PaRRVA, in any communication "
        "to clients (including prospective clients). 4.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-business-interim-arrangement-for-certified-pas · Page 3 · passage 1",
    ),
    Example(
        "RTAs/listed companies shall provide reports on: 7.1 publicity; and 7.2 shares "
        "re-lodged for transfer cum demat in the format specified by SEBI (provided at "
        "Annexure-A) on monthly basis. 8.",
        "PERIOD_ONLY",
        False,
        "SEBI: ease-of-doing-investment-special-window-for-re-lodgement-of- · Page 2 · passage 6",
    ),
    Example(
        "(C) Non-delivery of objection memo to the transferor / non-availability of any "
        "document required for transfer: i) In case of non -delivery of the obje ction "
        "memo to the transferor, non- cooperation by / inability / non -traceability of "
        "the transferor / non - availability of any document required for transfer as "
        "per Para A above, an advertisement shall be published in at least: a. one "
        "English language national daily n",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investment-special-window-for-transfer-and-dem · Page 3 · passage 5",
    ),
    Example(
        "(a) any person or entity forming a part of the promoter or promoter group of "
        "the listed entity; or (b) any person or any entity, holding equity shares: (i) "
        "of twenty per cent or more; or (ii) of ten per cent or more, with effect from "
        "April 1, 2023; in the listed entity either directly or on a beneficial "
        "interest basis as provided under section 89 of the Companies Act, 2013, at any "
        "time, during the immediate preceding",
        "NO_TIMING",
        False,
        "SEBI: format-of-disclosure-document-for-portfolio-managers_96479 · Page 9 · passage 1",
    ),
    Example(
        "Brief details of decision -making process followed/proposed for determining "
        "the eligibility of project(s) and/or asset(s), for which the proceeds are "
        "being ra ised through issuance of social bonds, such as: a) Details of process "
        "followed by the issuer for evaluating and selecting the project(s) and/or "
        "asset(s); b) Process followed/ to be followed for determining how the "
        "project(s) and/or asset(s) fit within the elig",
        "NO_TIMING",
        False,
        "SEBI: framework-for-environment-social-and-governance-esg-debt-sec · Page 7 · passage 4",
    ),
    Example(
        "Paragraph 1, sub-paragraph D, clause (1) of the abovementioned circular shall "
        "be read as under- “All Social Enterprises which have raised funds using SSE "
        "will have to provide duly assessed Annual Impact Report (AIR) to SSE by "
        "October 31st of each year or before the due date of filing the income tax "
        "return as prescribed under the provisions of the Income Tax Act, 1961, "
        "whichever is later.” 4.4.",
        "NO_TIMING",
        False,
        "SEBI: framework-on-social-stock-exchange_96702 · Page 4 · passage 11",
    ),
    Example(
        "A section by the name \"Research Analyst\" has been created on the SEBI website "
        "where the details/circulars/press releases pertaining to RA regulations are "
        "being uploaded on a periodic basis. 14.",
        "URGENCY_ONLY",
        False,
        "SEBI: frequently-asked-questions-faqs-related-to-regulatory-provis · Page 7 · passage 4",
    ),
    Example(
        "Providing adequate notice to the clients before winding down of the "
        "operations; and iv.",
        "NO_TIMING",
        False,
        "SEBI: guidelines-for-custodians_100118 · Page 7 · passage 9",
    ),
    Example(
        "The Stock Exchanges, within 30 days from the date of the circular , shall "
        "jointly formulate a S tandard Operating Procedure (SOP) , in consultation with "
        "SEBI, to ensure alignment of the price band of stock futures with the price "
        "band applicable during CAS. 4.5. Types of orders allowed in CAS: 4.5.1.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: introduction-of-closing-auction-session-cas-in-the-equity-ca · Page 5 · passage 2",
    ),
    Example(
        "Rights of investors  Right to Privacy and Confidentiality  Right to "
        "Transparent Practices  Right to fair and Equitable Treatment  Right to "
        "Adequate Information  Right to Initial and Continuing Disclosure - Right to "
        "receive information about all the statutory and regulatory disclosures.  "
        "Right to Fair & True Advertisement  Right to Awareness about Service "
        "Parameters and Turnaround Times  Right to be informed o",
        "NO_TIMING",
        False,
        "SEBI: investor-charter-for-investment-advisers_94354 · Page 5 · passage 4",
    ),
    Example(
        "Always pay attention towards disclosures made in the research reports before "
        "investing. v.",
        "NO_TIMING",
        False,
        "SEBI: investor-charter-for-research-analysts_94355 · Page 6 · passage 6",
    ),
    Example(
        "c) Percentage of assets maturing within three to five years",
        "PERIOD_ONLY",
        False,
        "SEBI: mandating-periodic-disclosure-requirements-securitised-debt- · Page 3 · passage 6",
    ),
    Example(
        "The percentage of the listed entity’s annual consolidated turnover, for the "
        "immediately preceding financial year, that is represented by the value of the "
        "proposed transaction (and for a RPT involving a subsidiary, such percentage "
        "calculated on the basis of the subsidiary’s annual turnover on a standalone "
        "basis shall be additionally provided); f.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: minimum-information-to-be-provided-to-the-audit-committee-an · Page 4 · passage 6",
    ),
    Example(
        "The Regulatory Oversight Committee (ROC) and Risk Management Committee (RMC) "
        "shall hold separate quarterly meetings with the ED of Vertical 2, without the "
        "presence of MD and other executives .",
        "PERIOD_ONLY",
        False,
        "SEBI: provisions-relating-to-strengthening-governance-of-market-in · Page 3 · passage 5",
    ),
    Example(
        "Such a certificate shall be submitted not later than 31 st May and 15 th "
        "November every year.” 5.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: relaxation-in-the-timeline-to-submit-net-worth-certificate-b · Page 2 · passage 3",
    ),
    Example(
        "9.1 Software applications are prone to updates/changes and hence, it is "
        "imperative for the stock brokers to ensure that all software changes that are "
        "taking place in their applications are rigorously tested before they are used "
        "in production systems.",
        "NO_TIMING",
        False,
        "SEBI: review-of-framework-to-address-the-technical-glitches-in-sto · Page 5 · passage 7",
    ),
    Example(
        "The requirement of carrying out annual audit of compliance with terms of PPM, "
        "as per the norms prescribed in Para 2.4 of AIF Master circular, shall be "
        "applicable to Angel Funds that have made total investments (at cost) exceeding "
        "INR 100 crore.",
        "PERIOD_ONLY",
        False,
        "SEBI: revised-regulatory-framework-for-angel-funds-under-aif-regul · Page 4 · passage 5",
    ),
    Example(
        "Existing digital platforms must be upgraded to meet accessibility standards "
        "within the transition timeline. 5.4.",
        "NO_TIMING",
        False,
        "SEBI: rights-of-persons-with-disabilities-act-2016-and-rules-made- · Page 10 · passage 4",
    ),
    Example(
        "The MB shall submit a certificate from Chartered Accountant as part of Half "
        "Yearly Report certifying that the net worth and liquid net worth of the MB "
        "have been maintained as specified in MB Regulations, at all times during the "
        "corresponding half year period. 3. Definition of liquid net worth: 3.1.",
        "PERIOD_ONLY",
        False,
        "SEBI: specification-of-the-consequential-requirements-with-respect · Page 2 · passage 8",
    ),
    Example(
        "For this purpose Transferor KRA shall send a communication to the existing KYC "
        "holders clearly informing them the name of the Transferee KRA and the timeline "
        "for transfer of such records.",
        "NO_TIMING",
        False,
        "SEBI: streamlining-of-the-process-for-surrender-of-know-your-clien · Page 6 · passage 2",
    ),
    Example(
        "REs shall design and test its systems and processes to enable the safe "
        "resumption of critical operations within two hours of a disruption, even in "
        "the case of extreme but plausible scenarios.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: technical-clarifications-to-cybersecurity-and-cyber-resilien · Page 9 · passage 5",
    ),
    Example(
        "Once in three years within 60 days from the end of the financial year.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: timeline-for-submission-of-information-by-the-issuer-to-the- · Page 1 · passage 12",
    ),
    Example(
        "Existing schemes in this category shall stop all subscriptions with immediate "
        "effect.",
        "URGENCY_ONLY",
        False,
        "SEBI: categorization-and-rationalization-of-mutual-fund-schemes_99 · Page 11 · passage 2",
    ),
    Example(
        "Whether the periodicities mentioned in the CSCRF are based on calendar year or "
        "financial year? Answer: All the periodicities mentioned in the CSCRF are based "
        "on financial year.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 9 · passage 12",
    ),
    Example(
        "Compliance requirements The compliance reporting for CSCRF shall be done by "
        "the REs to their respective authorities4 in the standardized formats mentioned "
        "in this framework as per the stated periodicity.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 17 · passage 1",
    ),
    Example(
        "MIIs are advised to continuously review the policy of annual inspection and "
        "revise, as and when required, in consultation with SEBI. 7.",
        "URGENCY_ONLY",
        False,
        "SEBI: ease-of-doing-business-eodb-policy-for-joint-annual-inspecti · Page 3 · passage 4",
    ),
    Example(
        "(15) Credit Risk Credit risk or default risk refers to the risk that an issuer "
        "of a fixed income security may default (i.e., will be unable to make timely "
        "principal and interest payments on the security).",
        "NO_TIMING",
        False,
        "SEBI: format-of-disclosure-document-for-portfolio-managers_96479 · Page 11 · passage 19",
    ),
    Example(
        "Whether non-fee paying clients are considered ‘clients’ of research entity? "
        "Whether number of such non-fee paying clients shall be considered as clients "
        "for the purpose of periodic reporting and determining the deposit amount to be "
        "lien marked to RAASB?",
        "NO_TIMING",
        False,
        "SEBI: frequently-asked-questions-faqs-related-to-regulatory-provis · Page 16 · passage 8",
    ),
    Example(
        "The Stock Exchanges and CCs shall issue necessary guidelines and put in place "
        "the systems to ensure the timely and smooth operationalization of the above "
        "frameworks. 9.",
        "URGENCY_ONLY",
        False,
        "SEBI: introduction-of-closing-auction-session-cas-in-the-equity-ca · Page 12 · passage 1",
    ),
    Example(
        "IVCA shall assist all AIFs in understanding the reporting requirements and in "
        "clarifying or resolving any issues that may arise in connection with reporting "
        "to ensure accurate and timely reporting. 9.",
        "URGENCY_ONLY",
        False,
        "SEBI: regulatory-reporting-by-aifs_100120 · Page 2 · passage 7",
    ),
    Example(
        "9.2 Stock exchanges shall issue detailed gui delines with regard to testin g "
        "of software, traceability matrix, change management process and periodic "
        "updation of assets etc. The extant guidelines shall be rationalised based on "
        "the size of the stock brokers & their technology dependency.",
        "URGENCY_ONLY",
        False,
        "SEBI: review-of-framework-to-address-the-technical-glitches-in-sto · Page 5 · passage 9",
    ),
    Example(
        "It is, accordingly, specified that an MB shall generate minimum revenue, on a "
        "cumulative basis over the three immediately preceding financial years, as "
        "given below: (i) Category I: at least Rs. 25 crore (ii) Category II: at least "
        "Rs. 5 crore 9.3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: specification-of-the-consequential-requirements-with-respect · Page 6 · passage 4",
    ),
    Example(
        "The cyber audit periodicity for REs is specified in Table 21 of section 4 "
        "(CSCRF Compliance, Audit Report Submission, and Timelines) of the "
        "Cybersecurity and Cyber Resilience Framework [Circular No. SEBI/HO/ ITD - "
        "1/ITD_CSC_EXT/P/CIR/2024/113] dated August 20, 2024.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 10 · passage 2",
    ),
    Example(
        "RA/research entity is required to report this number of clients (fee-paying "
        "and non-fee paying clients) in periodic reporting format and shall also form "
        "basis for determining the requisite deposit amount applicable to the "
        "RA/research entity.",
        "NO_TIMING",
        False,
        "SEBI: frequently-asked-questions-faqs-related-to-regulatory-provis · Page 17 · passage 5",
    ),
    Example(
        "For the existing and ongoing mandates/ arrangements w.r.t the non-SEBI "
        "regulated activities, an MB shall make disclosures, as mentioned at para "
        "(11.2.6) and (11.2.7) above, and obtain confirmation/ acknowledgement from the "
        "stakeholders including clients, beneficiaries and counterparties, and submit a "
        "compliance report to the Board, within a period of six months from the "
        "effective date, i.e., on or before July 03, 202",
        "NO_TIMING",
        False,
        "SEBI: specification-of-the-consequential-requirements-with-respect · Page 8 · passage 10",
    ),
    Example(
        "How to make the submission of specific standards such as Cyber Capability "
        "Index (CCI)? For ex: the periodicity of Red Teaming exercise is half -yearly "
        "of MIIs and Qualified REs.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-faq · Page 13 · passage 1",
    ),
    Example(
        "VAPT16 The VAPT scope, periodicity and compliance has been defined in standard "
        "DE.CM.S5 and the corresponding guidelines. 4.3.1.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 48 · passage 4",
    ),
    Example(
        "Answer: All the periodicities and compliances are based on financial year.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 13 · passage 3",
    ),
    Example(
        "Further, such REs shall be required to submit the SOC efficacy report "
        "periodically as mandated in CSCRF. 61.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-faq · Page 20 · passage 8",
    ),
    Example(
        "Is it mandatory for REs to deploy all tools listed in Annexure -N, such as "
        "Database Activity Monitoring (DAM), and what are the expected capabilities of "
        "these tools? Answer: The tools listed are the SOC technologies deployed to the "
        "SOC for continuous monitoring of security events and timely detection of "
        "anomalous activities.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 20 · passage 14",
    ),
    Example(
        "The report of functional efficacy of Market SOC shall be provided by BSE and "
        "NSE (also NSDL and CDSL, if applicable) to SEBI on a periodic basis. 4.5.4.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 52 · passage 7",
    ),
    Example(
        "The cybersecurity and cyber resilience policy shall be reviewed periodically "
        "by the REs. 3.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 54 · passage 13",
    ),
    Example(
        "An annual st atus report shall be submitted to SEBI and to the investors of "
        "the relevant scheme(s) until all liabilities are resolved and a NIL bank "
        "balance is achieved. 7.",
        "PERIOD_ONLY",
        False,
        "SEBI: circ-guidelines-for-winding-up-of-aifs-with-respect-to-reten · Page 9 · passage 2",
    ),
    Example(
        "In case the price movement in the international markets is more than the "
        "aggregate Daily Price Limit (DPL) of +9%, the same may be further relaxed in "
        "stages of 3% by the Stock Exchange with the cooling-off period.",
        "NO_TIMING",
        False,
        "SEBI: circ-norms-for-base-price-price-bands-call-auction-in-pre-op · Page 3 · passage 8",
    ),
    Example(
        "In column number (9), AAUM is the average of the daily AUM of the Mutual Fund "
        "for the month. 6.",
        "NO_TIMING",
        False,
        "SEBI: circ-revision-of-monthly-cumulative-report-mcr-format_101522 · Page 2 · passage 23",
    ),
    Example(
        "How does the Cyber Capability Index (CCI) assessment to be conducted by MIIs "
        "and Qualified REs? Answer: MIIs shall conduct third-party assessment of their "
        "cyber resilience using CCI on a half-yearly basis.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 12 · passage 5",
    ),
    Example(
        "Additionally, such IT and Cybersecurity Data shall be approved by the Board/ "
        "Partners/ Proprietor annually.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 107 · passage 7",
    ),
    Example(
        "b. one regional language daily newspaper published in the place of last known "
        "address of the transferor available in the records of the listed entity, "
        "giving notice of the proposed transfer and seeking objection, if any, to the "
        "same within a period of 30 days from the date of advertisement.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investment-special-window-for-transfer-and-dem · Page 4 · passage 1",
    ),
    Example(
        "(10) Equity and equity related instruments by nature are volatile and prone to "
        "price fluctuations on a daily basis due to macro and micro economic factors.",
        "NO_TIMING",
        False,
        "SEBI: format-of-disclosure-document-for-portfolio-managers_96479 · Page 11 · passage 2",
    ),
    Example(
        "An issuer who has listed social bonds shall provide following additional "
        "disclosures along with its annual report and financial results: 1.",
        "NO_TIMING",
        False,
        "SEBI: framework-for-environment-social-and-governance-esg-debt-sec · Page 8 · passage 1",
    ),
    Example(
        "The annual impact report shall cover 67% of the program expenditure in the "
        "previous financial year.” 4.5.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: framework-on-social-stock-exchange_96702 · Page 5 · passage 3",
    ),
    Example(
        "What are trading restrictions imposed under regulation 16 of RA Regulations? "
        "Independent research analysts, part-time research analysts, individuals "
        "employed as research analyst or their associates shall not deal or trade any "
        "securities that the research analyst recommends or follows within 30 days "
        "before and 5 days after the publication of a research report on the subject "
        "company.",
        "NO_TIMING",
        False,
        "SEBI: frequently-asked-questions-faqs-related-to-regulatory-provis · Page 11 · passage 4",
    ),
    Example(
        "The Auditor, while covering the BCP-DR as a part of mandated annual Audit, "
        "shall check the preparedness of the Custodian to shift its operations from PDC "
        "to DRS and also comment on documented results and observations on DR drills "
        "conducted by the Custodian. The Auditor",
        "PERIOD_ONLY",
        False,
        "SEBI: guidelines-for-custodians_100118 · Page 8 · passage 11",
    ),
    Example(
        "a) Percentage of loan / listed debt securities / credit facility exposures "
        "overdue up to 30 days",
        "PERIOD_ONLY",
        False,
        "SEBI: mandating-periodic-disclosure-requirements-securitised-debt- · Page 4 · passage 4",
    ),
    Example(
        "Percentage of the counter -party’s annual consolidated turnover that is "
        "represented by the value of the proposed RPT on a voluntary basis; j.",
        "NO_TIMING",
        False,
        "SEBI: minimum-information-to-be-provided-to-the-audit-committee-an · Page 5 · passage 4",
    ),
    Example(
        "EDs will be required to report to the Governing Board of the MII on a "
        "quarterly basis, on areas concerning their respective verticals.",
        "PERIOD_ONLY",
        False,
        "SEBI: provisions-relating-to-strengthening-governance-of-market-in · Page 3 · passage 7",
    ),
    Example(
        "The first such Annual Activity Report shall be submitted for the year ending "
        "March 2026 latest by May 31, 2026. 7.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: regulatory-reporting-by-aifs_100120 · Page 2 · passage 2",
    ),
    Example(
        "All REs shall conduct annual accessibility audits of their digital platforms "
        "including websites, mobile apps, portals through IAAP certified accessibility "
        "professionals and report s shall be submitted as per the mechanism specified "
        "in direction 1.4 in Section 1 of this Annexure.",
        "PERIOD_ONLY",
        False,
        "SEBI: rights-of-persons-with-disabilities-act-2016-and-rules-made- · Page 10 · passage 5",
    ),
    Example(
        "The MB is also mandated to submit a certificate issued by Chartered Accountant "
        "providing the value of total underwriting obligations of the MB, as a part of "
        "Half Yearly Report.",
        "PERIOD_ONLY",
        False,
        "SEBI: specification-of-the-consequential-requirements-with-respect · Page 3 · passage 7",
    ),
    Example(
        "Activity Timeline Approved Board Resolution Day T Intimation to SEBI T+7 days "
        "Communication to stakeholders T+14 days Data migration & system deactivation "
        "T+ 60 days Audit & Closure T+75 days Submission of compliance report to SEBI "
        "T+90 days",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: streamlining-of-the-process-for-surrender-of-know-your-clien · Page 7 · passage 11",
    ),
    Example(
        "Can REs rely solely on threat intelligence shared by NCIIPC and CERT-In for "
        "their quarterly threat hunting activities, or is additional intelligence "
        "required? Answer: While threat intelligence provided by NCIIPC and CERT-In is "
        "invaluable, REs are also encouraged to supplement it with industry sources and "
        "internal threat hunting mechanisms to strengthen cybersecurity posture.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 21 · passage 12",
    ),
    Example(
        "A copy of the advertisement shall also be posted on the listed company’s "
        "website. ii) As a measure of ease to the investor, only a minimal fee may be "
        "charged by the listed company from the investor towards such advertisement. "
        "iii) Transfer shall be effected only after the expiry of 30 days fr om the "
        "newspaper advertisement.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investment-special-window-for-transfer-and-dem · Page 4 · passage 2",
    ),
    Example(
        "(17) Unlisted equities are valued at prices provided by independent valuer "
        "appointed by the Portfolio Manager basis the International Private Equity and "
        "Venture Capital Valuation (IPEV) Guidelines on a semi-annual basis.",
        "NO_TIMING",
        False,
        "SEBI: format-of-disclosure-document-for-portfolio-managers_96479 · Page 22 · passage 1",
    ),
    Example(
        "7 The target setting exercise should be based on a combination of benchmarking "
        "approaches: (1) the issuer’s own performance over time for which a minimum of "
        "3 years, where feasible, of measurement track record on the selected KPI(s) is "
        "recommended and when possible forward-looking guidance on the KPI;",
        "PERIOD_ONLY",
        False,
        "SEBI: framework-for-environment-social-and-governance-esg-debt-sec · Page 10 · passage 10",
    ),
    Example(
        "Report on fortnightly basis to submit ISIN wise AUC details of FPIs 6.2.2.",
        "PERIOD_ONLY",
        False,
        "SEBI: guidelines-for-custodians_100118 · Page 9 · passage 4",
    ),
    Example(
        "Stock Exchanges/ CCs shall jointly formulate SOPs in terms of para 4.4.3 and "
        "4.9.2 in consultation with SEBI within 30 days from the date of the circular. "
        "7.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: introduction-of-closing-auction-session-cas-in-the-equity-ca · Page 11 · passage 6",
    ),
    Example(
        "b) Percentage of loan / listed debt securities/ credit facility exposures "
        "overdue between 31 -60 days",
        "PERIOD_ONLY",
        False,
        "SEBI: mandating-periodic-disclosure-requirements-securitised-debt- · Page 5 · passage 1",
    ),
    Example(
        "Percentage of the counter -party’s annual consolidated turnover that is "
        "represented by the value of the proposed RPT, on a voluntary basis; f.",
        "NO_TIMING",
        False,
        "SEBI: minimum-information-to-be-provided-to-the-audit-committee-an · Page 5 · passage 12",
    ),
    Example(
        "The 1 st ED shall be appointed within 6 months from the date of implementation "
        "of the amendments to both SECC Regulations, 2018 and D&P Regulations, 201 8, "
        "as stated at paragraph 2 above; and 4.1.2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: provisions-relating-to-strengthening-governance-of-market-in · Page 4 · passage 5",
    ),
    Example(
        "A limited Quarterly Activity Report shall be submitted by all AIFs online on "
        "the SI Portal in a revised format within 15 calendar days from the end of each "
        "such quarter.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: regulatory-reporting-by-aifs_100120 · Page 2 · passage 3",
    ),
    Example(
        "The MB shall ensure that, in respect of activities not regulated by the SEBI, "
        "it submits an undertaking as part of the half-yearly report confirming "
        "compliance with requirements of regulation 13A and the conditions prescribed "
        "at para 11.2, duly reviewed and approved by its board of directors. 11.4.",
        "PERIOD_ONLY",
        False,
        "SEBI: specification-of-the-consequential-requirements-with-respect · Page 9 · passage 1",
    ),
    Example(
        "The listed companies / RTAs shall process the transfer requests within 7 0 "
        "days from the date of receipt of request from the transferee with complete "
        "documentation. 12.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-investment-special-window-for-transfer-and-dem · Page 4 · passage 7",
    ),
    Example(
        "An issuer who has listed sustainability -linked bonds shall provide following "
        "disclosures along with its annual report and financial results: a.",
        "NO_TIMING",
        False,
        "SEBI: framework-for-environment-social-and-governance-esg-debt-sec · Page 11 · passage 9",
    ),
    Example(
        "c) Percentage of loan / listed debt securities/ credit facility exposures "
        "overdue between 61 -90 days",
        "PERIOD_ONLY",
        False,
        "SEBI: mandating-periodic-disclosure-requirements-securitised-debt- · Page 5 · passage 2",
    ),
    Example(
        "The 2 nd ED shall be appointed within 9 months from the date of implementation "
        "of the amendments to both SECC Regulations, 2018 and D&P Regulations, 2018, as "
        "stated at paragraph 2 above. 4.2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: provisions-relating-to-strengthening-governance-of-market-in · Page 4 · passage 6",
    ),
    Example(
        "No separate submission of Quarterly Activity Report will be required for "
        "quarter ending March of every year as the Annual Activity Report includes the "
        "data points of the Quarterly Activity Report. 8.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: regulatory-reporting-by-aifs_100120 · Page 2 · passage 5",
    ),
    Example(
        "An issuer who has listed sustainability -linked bonds, shall provide following "
        "additional disclosures along with its annual report and financial results: i. "
        "up-to-date information on the performance of the selected KPI(s), including "
        "baselines where relevant; and",
        "NO_TIMING",
        False,
        "SEBI: framework-for-environment-social-and-governance-esg-debt-sec · Page 11 · passage 11",
    ),
    Example(
        "d) Percentage of loan / listed debt securities / credit facility exposures "
        "overdue for more than 90 days",
        "PERIOD_ONLY",
        False,
        "SEBI: mandating-periodic-disclosure-requirements-securitised-debt- · Page 5 · passage 3",
    ),
    Example(
        "The revised reporting formats shall be made available on the website of "
        "Standards Forum i.e. IVCA within 3 days from the date of issuance of this "
        "circular.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: regulatory-reporting-by-aifs_100120 · Page 2 · passage 6",
    ),
    Example(
        "Annexure C Format for Annual Retention Status Report (To be submitted to SEBI "
        "and investors within 30 calendar days from the end of March of every financial "
        "year) Details of AIF and its scheme(s) S.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: circ-guidelines-for-winding-up-of-aifs-with-respect-to-reten · Page 12 · passage 1",
    ),
    Example(
        "2.6.3.11 Whenever the portfolio duration is reduced below the specified floors "
        "of 3 years and 4 years in respect of Medium Term Fund and Medium to Long Term "
        "Fund respectively, the AMC shall be required to record the reasons for the "
        "same with adequate justification and maintain the same for inspection.",
        "NO_TIMING",
        False,
        "SEBI: categorization-and-rationalization-of-mutual-fund-schemes_99 · Page 8 · passage 9",
    ),
    Example(
        "(d) Receivables overdue for more than 90 days",
        "PERIOD_ONLY",
        False,
        "SEBI: mandating-periodic-disclosure-requirements-securitised-debt- · Page 15 · passage 5",
    ),
    Example(
        "Further, the Trustees shall also review the portfolio and report the same in "
        "their Half Yearly Trustee Report to SEBI.",
        "PERIOD_ONLY",
        False,
        "SEBI: categorization-and-rationalization-of-mutual-fund-schemes_99 · Page 8 · passage 11",
    ),
    Example(
        "Disclosure to be given for Jan ‘25 Average Default rate for last 12 months "
        "(Avg default rate of Jan ‘24 to Dec ‘24) 3.38% Disclosure to be given for July "
        "‘25 Average Default rate for last 12 months (Avg default rate of July ‘24 to "
        "June ‘25) 3.46%",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: mandating-periodic-disclosure-requirements-securitised-debt- · Page 19 · passage 3",
    ),
    Example(
        "Exposure in debt instruments shall be limited to government securities with "
        "maturity less than 1 year as well as repo of government bonds only.",
        "PERIOD_ONLY",
        False,
        "SEBI: categorization-and-rationalization-of-mutual-fund-schemes_99 · Page 10 · passage 4",
    ),
]
