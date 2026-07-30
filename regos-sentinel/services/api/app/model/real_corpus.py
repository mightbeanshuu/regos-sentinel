"""Real SEBI wording harvested from 26 published circulars (July 2026 pull)
and the 205-page CSCRF framework document itself (July 31 addendum).

Every sentence below is verbatim output of this product's own PDF extraction over
a real published SEBI document — the same text the served pipeline produces,
including its extraction artifacts. Every label was assigned by reading the
sentence (hand review, 2026-07-30). The cscrf-framework rows were first labelled
by three independent AI readers against the written rubric (2026-07-31); every
PERIOD_AND_TRIGGER row and a sample of each other class was then re-read by hand
before inclusion, and table debris, form templates and cut-off text were excluded.
Sentences whose timing trigger is present
linguistically but invisible to the feature set, table fragments, form templates
and cut-off text were EXCLUDED rather than guessed at; that exclusion rule is
part of what these labels mean.

The source PDFs are not committed (they are SEBI's documents, fetched from
sebi.gov.in); each row names the circular it came from so the set can be
re-verified against the published original.
"""

from __future__ import annotations

from typing import List

from .dataset import Example

REAL_EXAMPLES: List[Example] = [
    Example(
        "Due to the interconnectedness and interdependency of market participants in "
        "the Securities Market Ecosystem, a periodic coordinated approach for "
        "vulnerability management, information sharing and monitoring/assessment is "
        "required to prevent a cascading impact.",
        "URGENCY_ONLY",
        False,
        "SEBI: ai-advisory · Page 2 · passage 6",
    ),
    Example(
        "Update all operating systems and applications with the latest patches on "
        "immediate basis to mitigate any identified/known vulnerabilities.",
        "URGENCY_ONLY",
        False,
        "SEBI: ai-advisory · Page 5 · passage 1",
    ),
    Example(
        "Conduct Vulnerability Assessment (Using conventional and suitable AI based "
        "Vulnerability Assessment Tools where possible) and undertake security "
        "audits on a regular/continuous basis in accordance with Cyber Security and "
        "Cyber Resilience Framework of SEBI. 3.",
        "URGENCY_ONLY",
        False,
        "SEBI: ai-advisory · Page 5 · passage 3",
    ),
    Example(
        "Based on the assessment, vendors shall implement appropriate safeguards i "
        "ncluding updating patch, VAPT, continuous monitoring, hardening measures "
        "etc. 4.",
        "NO_TIMING",
        False,
        "SEBI: ai-advisory · Page 5 · passage 6",
    ),
    Example(
        "a) Inventory of all APIs and the applications using the APIs should be "
        "updated regularly. b) Ensure strong authentication and authorization "
        "mechanisms to enable secure verification of end-user client identity as "
        "well as limit the information access/ transfer to users/ systems based on "
        "least privilege. c) API rate limiting and throttling to prevent and detect "
        "abuse. d) Connections through APIs to be strictly on a whitelist-based "
        "approach.",
        "URGENCY_ONLY",
        False,
        "SEBI: ai-advisory · Page 5 · passage 8",
    ),
    Example(
        "a) Regular day-to-day monitoring of the systems and networks must be "
        "carried out vigorously.",
        "URGENCY_ONLY",
        False,
        "SEBI: ai-advisory · Page 6 · passage 1",
    ),
    Example(
        "In the view of enhanced risks posed by AI -driven attacks, all eligib le "
        "REs (not on boarded with any M - SOC) shall expedite the onboarding. d) "
        "MIIs are required to conduct awareness and handholding programs, including "
        "periodic workshops to ensure a smooth onboarding process and integration "
        "with M-SOC. 7.",
        "URGENCY_ONLY",
        False,
        "SEBI: ai-advisory · Page 6 · passage 3",
    ),
    Example(
        "Periodically update Asset Inventory and Software Bill of Materials for all "
        "critical applications including open source stack.",
        "URGENCY_ONLY",
        False,
        "SEBI: ai-advisory · Page 6 · passage 8",
    ),
    Example(
        "Also, undertake other measures including recalibration of risks for AI "
        "accelerated threats, AI augmented SOC transformation, and continuous "
        "vulnerability management using AI tools. **********************",
        "URGENCY_ONLY",
        False,
        "SEBI: ai-advisory · Page 7 · passage 3",
    ),
    Example(
        "Explanation: The list of ‘Significant Indices’ shall be specified by the "
        "Board from time to time”",
        "URGENCY_ONLY",
        False,
        "SEBI: -significant-indices-under-sebi-index-provid · Page 1 · passage 9",
    ),
    Example(
        "Index Providers providing any of th e ‘Significant Indices’ listed in "
        "Annexure-A shall submit an application for registration as an Index "
        "Provider to SEBI, in accordance with Regulation 4 of the IP Regulations, "
        "within a period of six months from the date of issuance of this circular.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: -significant-indices-under-sebi-index-provid · Page 2 · passage 4",
    ),
    Example(
        "An Index Provider providing ‘Significant Indices’ as on the date of this "
        "circular, may continue to carry on its Index Provider activity, provided it "
        "submit an application for registration as an Index Provider to SEBI within "
        "a period of six months from the date of this circular.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: -significant-indices-under-sebi-index-provid · Page 2 · passage 8",
    ),
    Example(
        "If an entity registered with SEBI in any other capacity, also provides "
        "‘Significant Indices’ by undertaking Index Provider activities "
        "departmentally, shall be required to form a separate legal entity to carry "
        "out the activities of an Index Provider within a period of two years from "
        "the date of this circular. 10.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: -significant-indices-under-sebi-index-provid · Page 3 · passage 1",
    ),
    Example(
        "The provisions of this circular shall come into force with immediate "
        "effect. 12.",
        "URGENCY_ONLY",
        False,
        "SEBI: -significant-indices-under-sebi-index-provid · Page 3 · passage 4",
    ),
    Example(
        "In order to ensure seamless transition to the new certification "
        "requirement, SIF distributors holding a valid \"NISM Series XIII - Common "
        "Derivatives Certification\", obtained on or before September 21, 2026, "
        "shall not be required to obtain the \"NISM Series -V-D – Mutual Fund - "
        "Specialized Investment Fund Distributors Certification\" till the expiry of "
        "their existing \"NISM Series XIII - Common Derivatives Certification\".",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: certification-requirements-for-distribution- · Page 2 · passage 5",
    ),
    Example(
        "The platform was operationalized with effect from October 01, 2023. 2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: discontinuation-of-investor-risk-reduction-a · Page 1 · passage 5",
    ),
    Example(
        "Accordingly, based on stakeholder feedback and the aforementioned factors, "
        "it has been decided to discontinue the IRRA platform with immediate effect.",
        "URGENCY_ONLY",
        False,
        "SEBI: discontinuation-of-investor-risk-reduction-a · Page 2 · passage 6",
    ),
    Example(
        "Such PAIA shall obtain NISM Series-XXV-B certification only before expiry "
        "of the validity of their existing certifications. 6.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-business-relaxation-in-certifi · Page 2 · passage 3",
    ),
    Example(
        "The provisions of this circular and the revised transmission framework "
        "specified in Annexure along with model forms provided therein, shall come "
        "into force with effect from 30 days from the date of issuance of this "
        "circular. 5.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-investment-and-ease-of-doing-b · Page 3 · passage 2",
    ),
    Example(
        "Processing entities shall provide monthly reports as per the following "
        "format to SEBI regarding processing of transmission requests under revised "
        "transmission framework for a period of 6 months on rta@sebi.gov.in : "
        "Category Number of cases pending at the beginning of the month Number of "
        "cases processed during the month Number of cases pending at the end of the "
        "month Received Approved Rejected Cases where additional documents were "
        "sought with reasons QTP Simplified Above threshold 7.",
        "PERIOD_ONLY",
        False,
        "SEBI: ease-of-doing-investment-and-ease-of-doing-b · Page 3 · passage 5",
    ),
    Example(
        "Note: Transmission of securities under QTP shall be permitted only in "
        "favour of immediate relatives of the deceased security holder (s) viz. "
        "parents, spouse, children and parents-in-law.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investment-and-ease-of-doing-b · Page 8 · passage 3",
    ),
    Example(
        "6.1.11 Time limit for settlement of claims 6.1.11.1 The entity shall "
        "process the transmission case within a period not exceeding 21 calendar "
        "days or any such period as may be specified by the Board, from the date of "
        "receipt of all the required documents associated with the claim.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: ease-of-doing-investment-and-ease-of-doing-b · Page 12 · passage 6",
    ),
    Example(
        "The provision inter-alia stipulates that a debenture trustee holding a "
        "valid certificate of registration may transfer its activities that are not "
        "regulated by SEBI to separate business unit(s) within a period of six "
        "months from the date of notification of the SEBI (Debenture Trustees) "
        "(Amendment) Regulations, 2025 in the Official Gazette, or within such "
        "extended period as may be specified by the Board. 2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: extension-of-timeline-for-compliance-with-te · Page 1 · passage 5",
    ),
    Example(
        "Based on representations received from the industry highlighting "
        "operational challenges in establishing the necessary systems and processes "
        "for effective implementation, it has been decided to grant additional six "
        "months for compliance by the DTs.",
        "PERIOD_ONLY",
        False,
        "SEBI: extension-of-timeline-for-compliance-with-te · Page 1 · passage 7",
    ),
    Example(
        "It is clarified that in terms of Regulation 12 and 19 of SEBI (AIF) "
        "Regulations, 2012, AIFs can proceed with launch of their new schemes and "
        "circulate the PPM to their investors for soliciting funds after 30 days of "
        "filing of application with SEBI, unless otherwise advised.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: fast-track-mechanism-for-processing-of-place · Page 1 · passage 11",
    ),
    Example(
        "However, in case of first scheme of AIFs, it is clarified that AIFs can "
        "proceed with launch of such schemes from the date of grant of SEBI "
        "registration (or) after 30 days of filing of application with SEBI, "
        "whichever is later. 4.1.3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: fast-track-mechanism-for-processing-of-place · Page 2 · passage 1",
    ),
    Example(
        "Timeline for First close: Further, the first close of the scheme shall be "
        "declared not later than 12 months from the date on which the AIF becomes "
        "eligible to launch its scheme as stated at para 4.1.1 & 4.1.2 above.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: fast-track-mechanism-for-processing-of-place · Page 2 · passage 3",
    ),
    Example(
        "This circular shall come into force with immediate effect and would also "
        "apply to all PPMs of non-LVF schemes pending as on date with SEBI. 9.",
        "URGENCY_ONLY",
        False,
        "SEBI: fast-track-mechanism-for-processing-of-place · Page 3 · passage 7",
    ),
    Example(
        "The provisions of this circular shall be implemented on or before December "
        "31, 2026.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: framework-for-net-settlement-of-funds-for-tr · Page 2 · passage 10",
    ),
    Example(
        "Regulation 29(10A) - An AIF may be tagged as an inoperative fund, in such "
        "manner and subject to conditions as may be specified by SEBI from time to "
        "time. 2.3.",
        "URGENCY_ONLY",
        False,
        "SEBI: guidelines-for-winding-up-of-aifs-with-respe · Page 1 · passage 7",
    ),
    Example(
        "An AIF tagged as ‘Inoperative Fund’ shall be subject to the following "
        "conditions, with effect from the date of obtaining the tag – 12.1.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: guidelines-for-winding-up-of-aifs-with-respe · Page 3 · passage 10",
    ),
    Example(
        "The report shall be submitted on SEBI Intermediary portal within 30 "
        "calendar days from the end of March of every financial year.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: guidelines-for-winding-up-of-aifs-with-respe · Page 4 · passage 4",
    ),
    Example(
        "Such policy must indicate the maximum period (shall not exceed five trading "
        "days from the pay-out date) within which the client must meet the payment "
        "obligation.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: handling-of-client-s-unpaid-securities-by-tr · Page 2 · passage 5",
    ),
    Example(
        "46.7 If the value of pledged securities exceeds this maximum pledge value, "
        "the TM shall release the pledge on the appropriate quantity of securities "
        "corresponding to the excess value on or before next trading day in "
        "accordance with operational guidelines of the exchanges.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: handling-of-client-s-unpaid-securities-by-tr · Page 3 · passage 3",
    ),
    Example(
        "Auto-release of pledge 46.10 In case, such pledge on unpaid securities is "
        "neither invoked nor released within five trading days after pay -out, the "
        "pledge on securities shall be automatically released by the depositories at "
        "the end of the sixth trading day after pay-out, and the securities shall "
        "become available to the client as free balance without encumbrance.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: handling-of-client-s-unpaid-securities-by-tr · Page 3 · passage 10",
    ),
    Example(
        "Extension of pledge in exceptional circumstances 46.12 In exceptional "
        "circumstances, if the unpaid pledged securities cannot be liquidated by "
        "stockbroker within 5 trading days after pay-out due to- a. the security "
        "being in lower circuit with only sellers; b. suspension or trading halt due "
        "to surveillance or other reasons; or c. any other valid reasons as "
        "recognized by MIIs including unforeseen circumstances beyond the control of "
        "the TM, the TM may make a request by 6 PM on fifth trading day after pay "
        "-out, to extend the pledge by up to one additional calendar week.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: handling-of-client-s-unpaid-securities-by-tr · Page 4 · passage 2",
    ),
    Example(
        "Stock exchanges shall issue operational guidelines for implementation of "
        "provisions of this circular, in consultation with depositories within 30 "
        "days from the date of issuance of this circular.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: handling-of-client-s-unpaid-securities-by-tr · Page 4 · passage 9",
    ),
    Example(
        "The amended provisions of Paragraph 46.1 to 46.11 of Master Circular shall "
        "come into force with effect from three months from the date of issuance of "
        "operational guidelines by stock exchanges. 7.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: handling-of-client-s-unpaid-securities-by-tr · Page 5 · passage 1",
    ),
    Example(
        "The amended provisions of Paragraph 46.12 to 46.14 of Master Circular shall "
        "come into force with effect from six months from the date of issuance of "
        "this circular. 8.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: handling-of-client-s-unpaid-securities-by-tr · Page 5 · passage 2",
    ),
    Example(
        "Non-guaranteed receivables sighted during the day such as inflows from "
        "maturity proceeds and/or secondary m arket settlement from NCDs, CP, CDs, "
        "OTC Swaps, etc. and to be received by the scheme by end of the day. 2.2.3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: intraday-borrowing-facility-availed-by-mutua · Page 2 · passage 3",
    ),
    Example(
        "AMCs shall be responsible for ensuring that intraday borrowings are repaid "
        "by end of the day and any intraday borrowing s converted to overnight "
        "borrowings are within regula tory limits and for the purpose s allowed in "
        "Regulation 42(1) of SEBI (Mutual Funds) Regulations, 2026. 2.4.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: intraday-borrowing-facility-availed-by-mutua · Page 2 · passage 5",
    ),
    Example(
        "Considering the operational challenges in usage of T-1 day closing NAV of "
        "the ETFs as base price, to start with, the base price for determination of "
        "price bands of ETFs shall be T-1 day Closing Price i.e. last 30 minutes of "
        "Volume Weighted Average Price (VWAP) of the ETF. 4.2.",
        "NO_TIMING",
        False,
        "SEBI: norms-for-base-price-price-bands-call-auctio · Page 2 · passage 2",
    ),
    Example(
        "In case there is no trading in the ETF during the last 30 minutes of T-1 "
        "day, then base price shall be the Last Traded Price (LTP) of the day.",
        "NO_TIMING",
        False,
        "SEBI: norms-for-base-price-price-bands-call-auctio · Page 2 · passage 3",
    ),
    Example(
        "Further, in case there is no trade on T-1 day, then base price shall be the "
        "latest available closing NAV of the ETF. 4.3.",
        "NO_TIMING",
        False,
        "SEBI: norms-for-base-price-price-bands-call-auctio · Page 2 · passage 4",
    ),
    Example(
        "However, the Stock Exchanges and Asset Management Companies of Mutual Funds "
        "shall jointly address the operational challenges to implement the use of T "
        "-1 day closing NAV of the ETFs as the base price w.e.f. April 01, 2027. 5. "
        "Price Bands for ETFs 5.1.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: norms-for-base-price-price-bands-call-auctio · Page 2 · passage 6",
    ),
    Example(
        "The said norms restricted sharing of real time price data only for orderly "
        "functioning of the securities market or for fulfilling regulatory "
        "requirements , and prescribed a time lag of one day for sharing of price "
        "data for educational and awareness activities. 2.",
        "PERIOD_ONLY",
        False,
        "SEBI: norms-for-sharing-and-usage-of-price-data-fo · Page 1 · passage 5",
    ),
    Example(
        "can be actually used for sole educational purposes and for that a time lag "
        "of three months had been prescribed. 4.",
        "PERIOD_ONLY",
        False,
        "SEBI: norms-for-sharing-and-usage-of-price-data-fo · Page 2 · passage 1",
    ),
    Example(
        "Therefore, it has been decided that NISM may have access to market price "
        "data, with a lag of one day, for the purpose of usage in its simulation "
        "lab. 6.",
        "PERIOD_ONLY",
        False,
        "SEBI: norms-for-sharing-and-usage-of-price-data-fo · Page 2 · passage 4",
    ),
    Example(
        "Market price data may be shared for investor education and awareness "
        "activities without offering any kind of monetary incentive to the "
        "participants, with a lag of thirty days.",
        "PERIOD_ONLY",
        False,
        "SEBI: norms-for-sharing-and-usage-of-price-data-fo · Page 2 · passage 7",
    ),
    Example(
        "However, the market price data may be shared with National Institute of "
        "Securities Markets (NISM) with a lag of one day only for the purpose of "
        "usage in its simulation lab.",
        "PERIOD_ONLY",
        False,
        "SEBI: norms-for-sharing-and-usage-of-price-data-fo · Page 2 · passage 8",
    ),
    Example(
        "However, the National Institute of Securities Markets (NISM) can use the "
        "market price data with a lag of one day only for the purpose of usage in "
        "its simulation lab.” 7.",
        "PERIOD_ONLY",
        False,
        "SEBI: norms-for-sharing-and-usage-of-price-data-fo · Page 3 · passage 6",
    ),
    Example(
        "Applicability: The provisions of the circular shall be applicable with "
        "effect from July 01, 2026. 8.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: norms-for-sharing-and-usage-of-price-data-fo · Page 3 · passage 7",
    ),
    Example(
        "The Depositories shall ensure that the operational framework and the "
        "necessary system enhancements are put in place before August 01, 2026. 5.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: operationalisation-of-freezing-of-holdings-o · Page 2 · passage 4",
    ),
    Example(
        "Post successful completion of the pilot -phase, CRL shall begin providing "
        "its services on regular basis from May 04, 2026.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: operationalisation-of-past-risk-and-return-v · Page 2 · passage 2",
    ),
    Example(
        "IAs/RAs who wish to communicate certified p ast performance data to clients "
        "(including prospective clients) must enroll with PaRRVA within three months "
        "of its operationalization, else such IAs/RAs will not be able to "
        "communicate certified past performance data to clients post three months "
        "from the d ate of operationalization of PaRRVA. 4.2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: operationalisation-of-past-risk-and-return-v · Page 2 · passage 6",
    ),
    Example(
        "After two years from the date of operationalization of PaRRVA, IAs/RAs will "
        "be permitted to communicate/display only PaRRVA verified risk and return "
        "metrics and will not be permitted to use past performance data related to "
        "the period prior to the date of operationalization of PaRRVA, in any "
        "communication to clients (including prospective clients). 5.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: operationalisation-of-past-risk-and-return-v · Page 2 · passage 7",
    ),
    Example(
        "At least 95% of the interest or income received every year out of any "
        "investments made from the IPF. 4.46.1.1 C.",
        "PERIOD_ONLY",
        False,
        "SEBI: review-of-norms-for-utilization-of-interest- · Page 2 · passage 3",
    ),
    Example(
        "Applicability: The provisio ns of the circular shall be applicable with "
        "effect from September 01, 2026. 6. The MIIs are directed to:",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: review-of-norms-for-utilization-of-interest- · Page 3 · passage 1",
    ),
    Example(
        "In terms of Clause (1) of Regulation 292F of SEBI ICDR Regulations, it is "
        "being specified that a Not for Profit Organization may register on a Social "
        "Stock Exchange and not raise funds through it for a period of two years "
        "from the date of",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: review-of-requirement-relating-to-registrati · Page 1 · passage 9",
    ),
    Example(
        "Such period of two years may be further extended by one additional year "
        "subject to approval by the Social Stock Exchange.” 2.2.",
        "PERIOD_ONLY",
        False,
        "SEBI: review-of-requirement-relating-to-registrati · Page 2 · passage 1",
    ),
    Example(
        "The Investment Manager shall either exit investment in such SPV by way of "
        "sale / liquidation / winding -up / merger of such SPV, or acquire any new "
        "infrastructure project in such SPV, within one year from - 2.1.1. "
        "completion/termination of concession agreement or such other agreement of "
        "similar nature, or 2.1.2. conclusion of all pending claims/litigations/tax "
        "assessments and related appeals, or 2.1.3. completion of defect liability "
        "period, whichever is later. 2.2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: status-of-spvs-post-conclusion-or-terminatio · Page 1 · passage 6",
    ),
    Example(
        "Each trading member ’s Aggregate turnover (Gross Level) during the "
        "Financial Year (April 1 to March 31) across Equity, Equity Derivative, "
        "Currency Derivatives and Commodity derivatives shall be considered.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 5 · passage 9",
    ),
    Example(
        "Once the category of RE is decided, RE shall remain in the same category "
        "throughout the financial year irrespective of any changes in the parameters "
        "during the financial year. 8.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 6 · passage 11",
    ),
    Example(
        "Therefore, the periodicity of VAPT and cyber audit for QSBs shall be "
        "half-yearly irrespective of the category they fall in as per CSCRF. 15.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-faq · Page 8 · passage 9",
    ),
    Example(
        "What is the expected timeline for addressing vulnerabilities related to "
        "third- party applications or dependencies that are outside the control of "
        "REs? Answer: The timeline for closure of vulnerabilities identified "
        "(irrespective of third- party applications or in -house) during VAPT "
        "activity is within three (3) months of submission of VAPT report.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-faq · Page 8 · passage 10",
    ),
    Example(
        "Vulnerabilities identified due to non -implementation of patches and "
        "falling under ‘high’ severity would be validated for non -compliances "
        "against the patch management timelines (1 week; please refer standard "
        "PR.MA.S3 and the corresponding guidelines specified under PR.MA: Guidelines "
        "in Part II of CSCRF ).",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-faq · Page 9 · passage 4",
    ),
    Example(
        "Other vulnerabilities observations apart from implementation of patches "
        "shall be validated for non -closure against the VAPT observation closure "
        "timelines (3 months).",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-faq · Page 9 · passage 6",
    ),
    Example(
        "Is it mandatory to test patches in a non -production environment before "
        "deploying them to production and DR sites? Answer: CSCRF emphasizes the "
        "importance of testing patches in non-production environment before "
        "deploying them to DC and DR.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 9 · passage 10",
    ),
    Example(
        "The framework mandates that encryption keys and key management operations "
        "must be handled within the boundaries of India to ensure compliance with "
        "regulatory requirements.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 11 · passage 4",
    ),
    Example(
        "However, for few of the Qualified REs, the periodicity of Cyber audit is "
        "annual.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-faq · Page 13 · passage 2",
    ),
    Example(
        "The RE shall also conduct its due diligence with respect to CSPs beforehand "
        "and on a periodic basis to ensure that legal, regulatory, business "
        "objectives, etc. of t he RE are not hampered.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-faq · Page 14 · passage 7",
    ),
    Example(
        "What is the obligation for auditing the CSP’s subcontractors/vendors? "
        "Answer: Cloud may engage non -material subcontractors to support in their "
        "operations periodically.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-faq · Page 15 · passage 11",
    ),
    Example(
        "Further, refer clause 1(vi).2 of SEBI Cloud Adoptio n Framework which "
        "mandates REs to conduct regular audits/ VAPTof its cloud deployments.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-faq · Page 16 · passage 3",
    ),
    Example(
        "Additionally, regular audits should monitor the CSP’s adherence to security "
        "and certification requirements.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-faq · Page 16 · passage 12",
    ),
    Example(
        "However, they will be required to submit the SOC efficacy report "
        "periodically as mandated in CSCRF. 60.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-faq · Page 20 · passage 4",
    ),
    Example(
        "Can REs define their own RTO and RPO based on a business impact analysis, "
        "or are they required to adhere strictly to the RTO of 2 hours and RPO of 15 "
        "minutes as mandated by CSCRF? Answer: Please refer Guideline of Standard 2 "
        "in ‘Recover: Incident Recovery Plan Execution’: In the event of disruption "
        "of any one or more of the critical systems, the RE shall, within 30 minutes "
        "of the incident, declare that incident as ‘Disaster’ based on the business "
        "impact analysis.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-faq · Page 22 · passage 7",
    ),
    Example(
        "Accordingly, the RTO shall be two (2) hours as recommended by IOSCO for the "
        "resumption of critical operations. The RPO shall be 15 minutes.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-faq · Page 22 · passage 8",
    ),
    Example(
        "Maintenance of regularly updated ‘golden images’ of critical systems and "
        "retaining spare hardware has been mandated to MIIs and Qualified REs as "
        "their business is critical to Indian securities market ecosystem. 73.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-faq · Page 23 · passage 2",
    ),
    Example(
        "“These regulations shall be applicable only to Index Providers that "
        "administer Significant Indices consisting of securities listed on a "
        "recognized stock exchange in India for use in the Indian securities "
        "market.” 3.",
        "NO_TIMING",
        False,
        "SEBI: -significant-indices-under-sebi-index-provid · Page 1 · passage 6",
    ),
    Example(
        "This requirement shall not apply to the Index Providers, if all the "
        "‘Significant Indices’ provided by them are: a.",
        "NO_TIMING",
        False,
        "SEBI: -significant-indices-under-sebi-index-provid · Page 2 · passage 5",
    ),
    Example(
        "Further, it is clarified that the grievance redressal mechanism under "
        "Regulation 23 of IP Regulations shall apply only to ‘Significant Indices’ "
        "provided by the Index Providers registered with SEBI.",
        "NO_TIMING",
        False,
        "SEBI: -significant-indices-under-sebi-index-provid · Page 3 · passage 2",
    ),
    Example(
        "Exchanges and Depositaries shall direct their empaneled application vendors "
        "(providing COTS solution to respective members) to undertake comprehensive "
        "assessment of the risks arising from the use of AI-led vulnerability "
        "detection models.",
        "NO_TIMING",
        False,
        "SEBI: ai-advisory · Page 5 · passage 5",
    ),
    Example(
        "Risk assessment shall include comprehensive scenario-based testing for "
        "assessing risks (including both internal and external risks) related to "
        "cybersecurity in REs’ IT environment.",
        "NO_TIMING",
        False,
        "SEBI: ai-advisory · Page 6 · passage 5",
    ),
    Example(
        "MIIs and other Regulated Entities shall seek guidance from their respective "
        "IT committees for mitigating risks emanating from AI -led vulnerabili ty "
        "detection models.",
        "NO_TIMING",
        False,
        "SEBI: ai-advisory · Page 7 · passage 1",
    ),
    Example(
        "sale and/or distribution of SIF products shall be required to have a valid "
        "\"NISM Series-V-D - Mutual Fund - Specialized Investment Fund Distributors "
        "Certification\".",
        "NO_TIMING",
        False,
        "SEBI: certification-requirements-for-distribution- · Page 2 · passage 1",
    ),
    Example(
        "Entities holding this certification shall be eligible to distribute both "
        "Mutual Fund and SIF products, without separately holding \"NISM Series V-A "
        "– Mutual Fund Distributors Certification\". 21.10.2.",
        "NO_TIMING",
        False,
        "SEBI: certification-requirements-for-distribution- · Page 2 · passage 2",
    ),
    Example(
        "Entities engaged in the sale and/or distribution of only Mutual Fund "
        "products shall continue to comply with NISM Series V-A certification, as "
        "specified under Gazette notification no. LAD -NRO/GN/2010-11/09/6422 dated "
        "May 31, 2010. 21.10.3.",
        "NO_TIMING",
        False,
        "SEBI: certification-requirements-for-distribution- · Page 2 · passage 3",
    ),
    Example(
        "Clearing Corporations shall provide early pay-in facility to market "
        "participants permitting them to deposit certified goods to the Clearing "
        "Corporation accredited warehouse against relevant derivatives contract s.",
        "NO_TIMING",
        False,
        "SEBI: clarification-with-respect-to-applicability- · Page 1 · passage 6",
    ),
    Example(
        "However, Clearing Corporations shall continue to collect mark to market "
        "margins from such market participants against such positions.”",
        "NO_TIMING",
        False,
        "SEBI: clarification-with-respect-to-applicability- · Page 1 · passage 8",
    ),
    Example(
        "Banks which have taken other SEBI registrations, shall be required to "
        "comply with CSCRF (as applicable).",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 4 · passage 3",
    ),
    Example(
        "However, as clarifi ed in Q.29, the controls shall apply only to IT "
        "infrastructure, network, application, software, etc. being used for SEBI RE "
        "related activities. 2.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 4 · passage 4",
    ),
    Example(
        "Can this specific exemption be given to such SEBI REs (operating also as "
        "Banks under RBI regulations) to make it uniform? Answer: As per CSCRF "
        "guidelines, the level, grade, and standing of CISO shall be at least "
        "equivalent to CTO/ CIO for MIIs and Qualified REs .",
        "NO_TIMING",
        False,
        "SEBI: cscrf-faq · Page 4 · passage 7",
    ),
    Example(
        "This circular shall s upersede earlier SEBI circular no SEBI/HO/MIRSD/MIRSD "
        "- PoD-1/P/CIR/2022/177 dated December 30, 2022. 9.",
        "NO_TIMING",
        False,
        "SEBI: discontinuation-of-investor-risk-reduction-a · Page 2 · passage 9",
    ),
    Example(
        "The PAIA (as referred at paragrap h 4.1 above) who have already obtained "
        "the NISM Series-X-A and NISM Series-X-B certifications, as on the date of "
        "this circular, shall not be required to undertake the NISM Series -XXV-B "
        "certification at this stage.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-business-relaxation-in-certifi · Page 2 · passage 2",
    ),
    Example(
        "Notwithstanding the above, the processing entities shall strive to process "
        "transmission requests received before the said date in terms of the revised "
        "framework to give benefit of the simplified procedure to investors.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investment-and-ease-of-doing-b · Page 3 · passage 3",
    ),
    Example(
        "Further, in such cases, if certain documents have alr eady been submitted "
        "by the investor, the processing entities shall not seek re-submission of "
        "such documents in the new formats. 6.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investment-and-ease-of-doing-b · Page 3 · passage 4",
    ),
    Example(
        "Applicability 1.1 The framework shall apply to transmission of listed "
        "securities and units issued by Asset Management Companies (“AMCs”) "
        "consequent to demise of sole holder/ all joint holders of securities.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investment-and-ease-of-doing-b · Page 5 · passage 2",
    ),
    Example(
        "The consent of all the joint -holders shall be required for providing or "
        "changing nominee regardless of mode of operations. 5. Number of nominees: "
        "5.1. Investors can provide up to 3 nominees. 5.2.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investments-modified-norms-for · Page 2 · passage 4",
    ),
    Example(
        "The regulated entities shall make t he nomination form available to the "
        "investors as per the format provided in Annexure-A. 6.2.",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investments-modified-norms-for · Page 2 · passage 6",
    ),
    Example(
        "The investors shall have an option to submit the nomination either online "
        "or offline. For Online nomination -",
        "NO_TIMING",
        False,
        "SEBI: ease-of-doing-investments-modified-norms-for · Page 2 · passage 7",
    ),
    Example(
        "The aforesaid facility shall be implemented in the following two phases- "
        "4.1.",
        "NO_TIMING",
        False,
        "SEBI: extending-facility-of-creating-standing-inst · Page 1 · passage 8",
    ),
    Example(
        "In Phase - I, the facility shall be made available for “Unit-based SWP / "
        "STP” i.e. standing instructions based on fixed number of units to be",
        "NO_TIMING",
        False,
        "SEBI: extending-facility-of-creating-standing-inst · Page 1 · passage 9",
    ),
    Example(
        "In Phase - ll, the facility shall be extended to “Amount-based SWP / STP” "
        "i.e. standing instruction for fixed amount which is required as pay-out at "
        "a specified frequency or for purchasing units of another scheme of the same "
        "Mutual Fund. 5.",
        "NO_TIMING",
        False,
        "SEBI: extending-facility-of-creating-standing-inst · Page 2 · passage 2",
    ),
    Example(
        "All other provisions of the SEBI Circular dated November 25, 2025 shall "
        "remain unchanged. 5.",
        "NO_TIMING",
        False,
        "SEBI: extension-of-timeline-for-compliance-with-te · Page 1 · passage 9",
    ),
    Example(
        "Accordingly, the timelines prescribed under the MB Circular dated January "
        "02, 2026 shall be as under: S. no. Requirement Existing Timeline New "
        "Timeline a.",
        "NO_TIMING",
        False,
        "SEBI: extension-of-timelines-for-compliance-with-c · Page 1 · passage 6",
    ),
    Example(
        "All other provisions of the MB Circular dated January 02, 2026 shall remain "
        "unchanged and shall be complied by Merchant Bankers. 8.",
        "NO_TIMING",
        False,
        "SEBI: extension-of-timelines-for-compliance-with-c · Page 2 · passage 6",
    ),
    Example(
        "Responsibility: The Merchant Banker and the Manager of the AIF shall be "
        "responsible for ensuring the accuracy and completeness of all disclosures "
        "made in the PPMs of non-LVF schemes, as well as in declarations submitted "
        "by them. 5. Filing requirements: 5.1.",
        "NO_TIMING",
        False,
        "SEBI: fast-track-mechanism-for-processing-of-place · Page 2 · passage 5",
    ),
    Example(
        "Disclaimer: The following disclaimer clause shall be included in the PPMs "
        "of all non-LVF schemes: “1.",
        "NO_TIMING",
        False,
        "SEBI: fast-track-mechanism-for-processing-of-place · Page 2 · passage 7",
    ),
    Example(
        "All other provisions of Master Circular for AIFs dated May 07, 2024 shall "
        "remain unchanged. 8.",
        "NO_TIMING",
        False,
        "SEBI: fast-track-mechanism-for-processing-of-place · Page 3 · passage 6",
    ),
    Example(
        "SEBI’s M aster Circular for Stock Exchanges and Clearing Corporations dated "
        "December 30, 2024 inter-alia stipulates that no institutional investor "
        "shall be allowed to do day trading, i.e., square off their transactions "
        "intra -day.",
        "NO_TIMING",
        False,
        "SEBI: framework-for-net-settlement-of-funds-for-tr · Page 1 · passage 5",
    ),
    Example(
        "For the purpose of this circular, ‘outright transactions’ shall mean either "
        "a purchase or a sale transaction, but not both, in a security in a "
        "settlement cycle undertaken by an FPI.",
        "NO_TIMING",
        False,
        "SEBI: framework-for-net-settlement-of-funds-for-tr · Page 1 · passage 10",
    ),
    Example(
        "The framework for netting of funds for transactions undertaken by FPIs in "
        "cash market shall be as follows: a) FPI transactions in securities with "
        "only outright sell or outright purchase shall be net settled to arrive at "
        "net fund obligation for such outright transactions.",
        "NO_TIMING",
        False,
        "SEBI: framework-for-net-settlement-of-funds-for-tr · Page 2 · passage 1",
    ),
    Example(
        "Regulation 29(11) - Upon winding up of the AIF, the certificate of "
        "registration shall be surrendered to SEBI.",
        "NO_TIMING",
        False,
        "SEBI: guidelines-for-winding-up-of-aifs-with-respe · Page 1 · passage 8",
    ),
    Example(
        "This shall include show -cause notices, re - assessment notices, "
        "investigation summons, or similar communicatio ns and shall not be "
        "restricted to crystallised demand notices; 3.2.",
        "NO_TIMING",
        False,
        "SEBI: guidelines-for-winding-up-of-aifs-with-respe · Page 2 · passage 4",
    ),
    Example(
        "Further, the implementation standards for standardising the operational "
        "heads under which monies may be retained, shall be formulated by Standard "
        "Setting Forum of AIFs (‘SFA’), in consultation with SEBI.",
        "NO_TIMING",
        False,
        "SEBI: guidelines-for-winding-up-of-aifs-with-respe · Page 2 · passage 9",
    ),
    Example(
        "46.2 After the creation of pledge , a communication (email / SMS) shall be "
        "sent by TM informing the client about the client’s funds obligation and "
        "also about the right of TM to sell such securities in the event of failure "
        "by client to fulfill such obligation.",
        "NO_TIMING",
        False,
        "SEBI: handling-of-client-s-unpaid-securities-by-tr · Page 2 · passage 2",
    ),
    Example(
        "46.4 The policy must include clear process es and indicate reasons, manner, "
        "timing etc. pertaining to invocation/release of pledge and liquidation of "
        "unpaid securities.",
        "NO_TIMING",
        False,
        "SEBI: handling-of-client-s-unpaid-securities-by-tr · Page 2 · passage 4",
    ),
    Example(
        "46.5 While unpaid securities pledged to CUSPA of TM may be considered for "
        "reporting client margin collection to Clearing Corporation, the TM shall "
        "not allow exposure on the basis of such securities to the client.",
        "NO_TIMING",
        False,
        "SEBI: handling-of-client-s-unpaid-securities-by-tr · Page 2 · passage 6",
    ),
    Example(
        "The quantum of intraday borrowings shall be limited to: 2.2.1.",
        "NO_TIMING",
        False,
        "SEBI: intraday-borrowing-facility-availed-by-mutua · Page 2 · passage 1",
    ),
    Example(
        "Boards of AMC and Trustees of a mutual fund shall approve the policy for "
        "use of intraday borrowing facility.",
        "NO_TIMING",
        False,
        "SEBI: intraday-borrowing-facility-availed-by-mutua · Page 2 · passage 6",
    ),
    Example(
        "AMCs shall maintain scheme wise records detailing the underlying liquidity "
        "mismatch and the expected source of repayment for the intra-day borrowing. "
        "2.6.",
        "NO_TIMING",
        False,
        "SEBI: intraday-borrowing-facility-availed-by-mutua · Page 2 · passage 9",
    ),
    Example(
        "The Base price shall be adjusted for corporate action(s), if any. 4.4.",
        "NO_TIMING",
        False,
        "SEBI: norms-for-base-price-price-bands-call-auctio · Page 2 · passage 5",
    ),
    Example(
        "For Equity ETFs and Debt ETFs (other than Overnight ETFs and Liquid ETFs), "
        "there shall be dynamic price bands, with an initial price band of +10%, "
        "which can be flexed upto +20% after a cooling off period. 5.1.2.",
        "NO_TIMING",
        False,
        "SEBI: norms-for-base-price-price-bands-call-auctio · Page 2 · passage 8",
    ),
    Example(
        "The price band shall be flexed only in the direction of the price movement "
        "without corresponding adjustment (sliding) of the band on the opposite "
        "side. 5.1.5.",
        "NO_TIMING",
        False,
        "SEBI: norms-for-base-price-price-bands-call-auctio · Page 3 · passage 3",
    ),
    Example(
        "For this purpose, the MIIs or the market intermediaries shall also enter "
        "into appropriate legal agreement with entities/persons with whom the data "
        "is be ing shared. 2(iv).",
        "NO_TIMING",
        False,
        "SEBI: norms-for-sharing-and-usage-of-price-data-fo · Page 2 · passage 9",
    ),
    Example(
        "MIIs and market intermediaries shall ensure due diligence while sharing "
        "such data.",
        "NO_TIMING",
        False,
        "SEBI: norms-for-sharing-and-usage-of-price-data-fo · Page 2 · passage 10",
    ),
    Example(
        "The legal agreement for sharing the data shall have provisions to prevent "
        "any",
        "NO_TIMING",
        False,
        "SEBI: norms-for-sharing-and-usage-of-price-data-fo · Page 2 · passage 11",
    ),
    Example(
        "Listed Companies, Recognised Stock Exchanges, Depositories, Merchant "
        "Bankers, Registrars to an Issue and Share Transfer Agents (RTAs), shall "
        "ensure compliance with this Circular and the operational framework issued "
        "by the Depositories. 6.",
        "NO_TIMING",
        False,
        "SEBI: operationalisation-of-freezing-of-holdings-o · Page 2 · passage 5",
    ),
    Example(
        "The recognition shall be valid until it is revoked or suspended by SEBI. 3.",
        "NO_TIMING",
        False,
        "SEBI: operationalisation-of-past-risk-and-return-v · Page 2 · passage 1",
    ),
    Example(
        "The PaRRVA representative/s shall be of the designation ‘Executive "
        "Director’ or ‘Senior Director ’ and should have requisite experience, "
        "capabilities, and expertise to contribute effectively to the committee. 7.3.",
        "NO_TIMING",
        False,
        "SEBI: operationalisation-of-past-risk-and-return-v · Page 3 · passage 4",
    ),
    Example(
        "The PDC representative/s shall be preferably at the CXO level 1, to e nsure "
        "strategic oversight and operational alignment, and should possess the "
        "requisite experience, capabilities, and expertise to contribute effectively "
        "to the committee. 7.4.",
        "NO_TIMING",
        False,
        "SEBI: operationalisation-of-past-risk-and-return-v · Page 3 · passage 5",
    ),
    Example(
        "Major maintenance expense shall mean expenditure incurred on maintenance of "
        "road project which is not routine maintenance and is in accordance with the "
        "obligations and requirements specified in the concession agreement;",
        "NO_TIMING",
        False,
        "SEBI: permitted-use-of-fresh-borrowings-for-invits · Page 1 · passage 8",
    ),
    Example(
        "Road Project shall mean a project in the 'Roads and bridges' infrastructure "
        "sub-sector as mentioned in the notification of the Ministry of Finance "
        "dated September 19, 2025 and shall include any amendments or additions made "
        "thereto. 2.3.",
        "NO_TIMING",
        False,
        "SEBI: permitted-use-of-fresh-borrowings-for-invits · Page 2 · passage 1",
    ),
    Example(
        "2.3.2. only the principal port ion of debt is refinanced i.e. any "
        "accumulated interest or any charges or fees by whatever name called shall "
        "not be refinanced. 3.",
        "NO_TIMING",
        False,
        "SEBI: permitted-use-of-fresh-borrowings-for-invits · Page 2 · passage 3",
    ),
    Example(
        "“To further strengthen the corpus, 100% of interest or income from IPF "
        "shall be treated as corpus of IPF.” 3.",
        "NO_TIMING",
        False,
        "SEBI: review-of-norms-for-utilization-of-interest- · Page 1 · passage 5",
    ),
    Example(
        "above mentioned Master Circular dated December 03, 2024 for Depositories "
        "shall stand modified as under: 4.46.1.1 B. Contribution to IPF of "
        "Depository i.",
        "NO_TIMING",
        False,
        "SEBI: review-of-norms-for-utilization-of-interest- · Page 2 · passage 1",
    ),
    Example(
        "The following contributions shall be made by the Depository to the IPF: c.",
        "NO_TIMING",
        False,
        "SEBI: review-of-norms-for-utilization-of-interest- · Page 2 · passage 2",
    ),
    Example(
        "In view of the above, following partial modifications to the Master "
        "Circular no. HO/49/14/14(6)2025-CFD-PoD1/I/2771/2026 dated January 19, 2026 "
        "shall be carried out: 2.1.",
        "NO_TIMING",
        False,
        "SEBI: review-of-requirement-relating-to-registrati · Page 1 · passage 7",
    ),
    Example(
        "After para 1.1.1, a new para 1.1.2. as under, shall be inserted: “1.1.2.",
        "NO_TIMING",
        False,
        "SEBI: review-of-requirement-relating-to-registrati · Page 1 · passage 8",
    ),
    Example(
        "Para 1.4.5 of abovementioned Master Circular, shall be read as under: "
        "“1.4.5.",
        "NO_TIMING",
        False,
        "SEBI: review-of-requirement-relating-to-registrati · Page 2 · passage 2",
    ),
    Example(
        "All other conditions specified in the above mentioned clause of the Master "
        "C ircular shall remain unchanged. 4.",
        "NO_TIMING",
        False,
        "SEBI: revision-of-monthly-cumulative-report-mcr-fo · Page 1 · passage 7",
    ),
    Example(
        "InvIT Level : The Investment Manager shall disclose a detailed breakup of "
        "the value of investments (gross and net basis) in the SPV(s) wherein the "
        "concession agreement or such other agreement of similar nature has "
        "ended/terminated. 2.3.2.",
        "NO_TIMING",
        False,
        "SEBI: status-of-spvs-post-conclusion-or-terminatio · Page 2 · passage 2",
    ),
    Example(
        "SPV Level : The Investment Manager shall provide additional disclosures "
        "pertaining to each SPV wherein the concession agreement or such other "
        "agreement of similar nature has ended/terminated, which shall include the "
        "following information: 2.3.2.1.",
        "NO_TIMING",
        False,
        "SEBI: status-of-spvs-post-conclusion-or-terminatio · Page 2 · passage 3",
    ),
    Example(
        "For six categories of REs where cybersecurity and cyber resilience circular "
        "already exists – by January 01, 2025. 17.2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 9 · passage 7",
    ),
    Example(
        "For other REs where CSCRF is being issued for the first time – by April 01, "
        "2025.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 9 · passage 8",
    ),
    Example(
        "Submission of CCI self- assessment evidence by MIIs and Qualified REs "
        "(GV.OV.S4) MIIs and Qualified REs Within 15 days of completion of CCI "
        "assessment (based on the applicability defined above in point 1 and 2) 3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 46 · passage 5",
    ),
    Example(
        "Accordingly, a ll MIIs and Qualified REs shall obtain ISO 27001 within 1 year "
        "of issuance of CSCRF.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 47 · passage 12",
    ),
    Example(
        "Report submission of VAPT VAPT report shall be submitted after approval from "
        "respective IT Committee for REs , within one ( 1) month of completion of VAPT "
        "activity. 2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 49 · passage 4",
    ),
    Example(
        "Closure o f findings identified during VAPT activity Within 3 months of "
        "submission of VAPT report",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 49 · passage 5",
    ),
    Example(
        "Revalidation of VAPT Revalidation of VAPT shall be completed within 5 months "
        "of completion of VAPT. 4.3.4.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 49 · passage 7",
    ),
    Example(
        "Additionally, any open vulnerabilities after 3 months of VAPT activity shall "
        "be approved by IT Committee for REs and shall be closed before start of next "
        "VAPT exercise.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 49 · passage 9",
    ),
    Example(
        "It has been mandated to close all open cyber audit observations with 3 months "
        "of cyber audit report submission after approval from respective IT Committee "
        "for REs.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 50 · passage 14",
    ),
    Example(
        "Cyber audit report submission The final cyber audit report shall be submitted "
        "after approval from respective IT Committee for REs , within 1 month of "
        "completion of cyber audit. 2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 51 · passage 6",
    ),
    Example(
        "Closure of findings identified during cyber audit Within 3 months of cyber "
        "audit report submission",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 51 · passage 7",
    ),
    Example(
        "Follow-on audit The follow -on audit shall be completed within 5 months of "
        "completion of cyber audit. 4.4.3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 51 · passage 9",
    ),
    Example(
        "Additionally, all open observation after 3 months of completion of cyber audit "
        "shall be approved by IT Committee for REs and shall be closed before start of "
        "next audit exercise. 4.4.5.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 52 · passage 2",
    ),
    Example(
        "REs shall obtain SBOM for existing their critical systems within 6 months "
        "(starting from the date of issuance of CSCRF). 2.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 88 · passage 7",
    ),
    Example(
        "Any additions/ deletions or changes in existing assets shall be reflected in "
        "the asset inventory within 3 working days. 4.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 90 · passage 8",
    ),
    Example(
        "Further, such data shall be made available to SEBI/ CERT -In/ any other "
        "government agency whenever required within a reasonable time not exceeding 48 "
        "hours from the time of request. 3.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 107 · passage 8",
    ),
    Example(
        "The lessons learn ed from conducting such red team exercise s shall be shared "
        "with SEBI within 3 months after completion of the exercise.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 121 · passage 10",
    ),
    Example(
        "Any cyber-attack, cyber security incident and / or breach falling under CERT "
        "-In Cybersecurity directions 29 shall be notified to SEBI and CERT -In within "
        "6 hours of noticing/ detecting such incidents or being brought to notice about "
        "such incidents.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 123 · passage 9",
    ),
    Example(
        "Stock Broker s/ Depository Participants shall also report the incidents to "
        "Stock Exchanges / Depositories along with SEBI and CERT -In within 6 hours of "
        "noticing/ detecting such incidents or being brought to notice about such "
        "incidents.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 123 · passage 12",
    ),
    Example(
        "The quarterly reports containing information on cyber -attacks, threats, "
        "cybersecurity incidents and breaches experienced by REs and measures taken to "
        "mitigate vulnerabilities, threats and attacks including information on bugs/ "
        "vulnerabilities, threats that may be useful for other REs and SEBI, shall be "
        "submitted to SEBI within 15 days from the quarter ended June, September, "
        "December and March of every year. 5.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 124 · passage 4",
    ),
    Example(
        "The lessons learned from conducting such cyber resilience testing shall be "
        "shared with SEBI within 3 months from the end of the relevant period of "
        "conducting cyber resilience testing.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 129 · passage 9",
    ),
    Example(
        "Any incident stated under CERT -In Cybersecurity directions35 and meeting "
        "below criteria36 shall be mandatorily reported within 6 hours of noticing / "
        "detecting such incidents or being brought to notice about such incidents: i.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 198 · passage 4",
    ),
    Example(
        "Any cyber-attack(s), cybersecurity incident(s) and breach(es) experienced by "
        "REs falling un der CERT -In Cybersecurity directions 37 shall be notified to "
        "SEBI and CERT-In within 6 hours of noticing/ detecting such incidents or being "
        "brought to notice about such incidents.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 200 · passage 3",
    ),
    Example(
        "Stock Brokers/ Depository Participants shall also report the incident(s) to "
        "Stock Exchanges/ Depositories along with SEBI and CERT-In within 6 hours of "
        "noticing/ detecting such incidents or being brought to notice about such "
        "incidents.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 200 · passage 5",
    ),
    Example(
        "No. Name of the Report/ Activity Timeline for Submission (from th e date of "
        "reporting the incident or being brought to notice about the incident) 1 "
        "Interim Report* 3 Days 2 Mitigation measure 7 Days 3 Root Cause Analysis (RCA) "
        "report** 30 Days# 4 Forensic Audit Report (on the incident) and its closure "
        "report Refer clause 3.4 below 5 Vulnerability Assessment and Penetration "
        "Testing (VAPT) for the incident and its closure reports 45 days 6 Any other "
        "report as required by SEBI To be submitted as per SEBI direction",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 201 · passage 10",
    ),
    Example(
        "RE may be provided an additional time upto 15 days from the day of being "
        "notified of the deficiency/ inaccuracy, for submitting the accurate and "
        "complete report. 3.7.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 202 · passage 10",
    ),
    Example(
        "However, the maximum period for the submission of forensic audit report shall "
        "be 75 days from date of reporting of incident.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 203 · passage 15",
    ),
    Example(
        "The timeline for setting-up of Market SOC shall be January 01, 2025.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 52 · passage 8",
    ),
    Example(
        "In the event of disruption of any one or more of the critical systems, the RE "
        "shall, within 30 minutes of the incident, declare that inci dent as ‘Disaster’ "
        "based on the business impact analysis.",
        "PERIOD_AND_TRIGGER",
        False,
        "SEBI: cscrf-framework · Page 128 · passage 11",
    ),
    Example(
        "MIIs shall conduct third -party assessment of their cyber resilience using CCI "
        "on a half-yearly basis.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 14 · passage 17",
    ),
    Example(
        "Cyber resilience third -party assessment using CCI (GV.OV.S4) MIIs Half-yearly "
        "Cyber resilience self - assessment using CCI (GV.OV.S4) Qualified REs Annually "
        "2.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 46 · passage 4",
    ),
    Example(
        "REs Cybersecurity and cyber resilience policy review (GV.PO.S2) All REs "
        "Annually 4.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 46 · passage 6",
    ),
    Example(
        "REs Cybersecurity risk management policy (GV.PO.S4) All REs Annually 5.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 46 · passage 7",
    ),
    Example(
        "IT Committee for REs meeting periodicity (Guidelines for GV.PO – Guideline 9) "
        "All REs except small-size, and self-certification REs Quarterly 6.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 46 · passage 8",
    ),
    Example(
        "REs’ risk assessmen t (threat-based) (ID.RA.S2) MIIs Half-yearly Qualified, "
        "Mid - size REs Annually 7.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 46 · passage 9",
    ),
    Example(
        "User access rights, delegated access and MIIs and Qualified REs Quarterly",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 46 · passage 10",
    ),
    Example(
        "No. Standard/ Guidelines and Clause Applicability Periodicity unused tokens "
        "review (PR.AA.S5) Other REs Half-yearly 8.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 47 · passage 1",
    ),
    Example(
        "Review of privileged users’ activities (PR.AA.S11) MIIs and Qualified REs "
        "Quarterly Other REs Half-yearly 9.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 47 · passage 2",
    ),
    Example(
        "Cybersecurity training program (PR.AT.S1) All REs Annually 10.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 47 · passage 3",
    ),
    Example(
        "Review of RE’s systems managed by third -party service providers (GV.SC.S4) "
        "MIIs and Qualified REs Half-yearly Other REs Annually 11.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 47 · passage 4",
    ),
    Example(
        "Functional Efficacy of SOC (DE.CM.S1 – Guideline 4) MIIs and Qualified REs "
        "Half-yearly Other REs who are utilizing third - party managed SOC or Market "
        "SOC services Annually 12.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 47 · passage 5",
    ),
    Example(
        "Red Teaming exercise (DE.DP.S4) MIIs and Qualified REs Half-yearly 13.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 47 · passage 6",
    ),
    Example(
        "Threat hunting (DE.DP.S5) MIIs and Qualified REs Quarterly 14.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 47 · passage 7",
    ),
    Example(
        "Cybersecurity scenario - based drill exercise for testing adequacy and "
        "effectiveness of recovery plan (RC.RP.S3) MIIs and Qualified REs Half-yearly "
        "Other REs Annually 15.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 47 · passage 8",
    ),
    Example(
        "Review of periodically and update their contingency plan, continuity of "
        "operations plan (COOP) (RS.MA.S3) MIIs and Qualified REs Half-yearly Mid-size "
        "and small-size REs Annually 16.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 47 · passage 9",
    ),
    Example(
        "Evaluation of cyber resilience posture (EV.ST.S5) Mid-size and Small-size REs "
        "Annually Note: Du ring cyber audit, auditors shall also validate the adherence "
        "to the above-mentioned periodicities. 4.2. ISO Audit and Certification 4.2.1.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 47 · passage 10",
    ),
    Example(
        "For the above-mentioned SaaS based cybersecurity solutions and SOC offerings "
        "utilized by the RE s (where the data is not processe d/ stored within the "
        "legal boundaries of India), the IT and Cybersecurity Data sent to such "
        "solutions shall be classified, assessed and periodically reviewed (at least "
        "once in a year) by the respective IT Committee for REs or equivalent body of "
        "the RE .",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 65 · passage 16",
    ),
    Example(
        "Additionally, such IT and Cybersecurity Data shall be approved by the Board/ "
        "Partners/ Proprietor annually. 3.4.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 65 · passage 17",
    ),
    Example(
        "NSE and BSE (NSDL and CDSL , if applicable) shall carry out audit of their "
        "Market SOC activity annually and submit the report to SEBI.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 70 · passage 6",
    ),
    Example(
        "REs shall conduct a risk assessment (including post -quantum risk s) of the IT "
        "environment of their organization on a half-yearly (for MIIs) and yearly (for "
        "qualified and mid-size REs) basis to acquire visibility and a reasonably "
        "accurate assessment of the overall cybersecurity risk posture.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 91 · passage 8",
    ),
    Example(
        "Such logs shall be maintained and stored in a secure location for a time "
        "period not less than two (2) years (atleast 6 months in online mode and rest "
        "in archival mode).",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 93 · passage 11",
    ),
    Example(
        "Delegated access and unused token s shall be reviewed and cleaned at least on "
        "a quarterly basis.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 97 · passage 7",
    ),
    Example(
        "REs shall ensure that DCs are patched as and when patch is released and it "
        "must be reviewed on a quarterly basis to ensure the implementation of the "
        "same. b.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 101 · passage 3",
    ),
    Example(
        "For above mentioned SaaS based cybersecurity solutions a nd SOC offerings "
        "utilized by REs where the data is not processed/stored within the legal "
        "boundaries of India, such data shall be classified, assessed and periodically "
        "reviewed (at least once in a year) by the respective IT Committee for REs or "
        "equivalent body of the RE .",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 107 · passage 6",
    ),
    Example(
        "Subsequently, the said IS auditing organisation shall be eligible for auditing "
        "the RE again only after a cooling off period of two years. c.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 112 · passage 6",
    ),
    Example(
        "Compensatory controls like virtual patching shall be implemented for legacy "
        "systems for a maximum period of 6 months.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 116 · passage 11",
    ),
    Example(
        "Additionally, t he above-mentioned policy on patch management shall be "
        "reviewed by IT Committee for REs atleast on an annual basis. 9.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 117 · passage 4",
    ),
    Example(
        "REs shall also establish processes for tracking patch compliance across all IT "
        "systems/ applications and reporting the same to their respective IT Co mmittee "
        "for REs on a quarterly basis. 11.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 117 · passage 6",
    ),
    Example(
        "No. Criticality of Patch Upper/ maximum Timeline 1 High 1 week 2 Moderate 2 "
        "weeks 3 Low 1 month",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 117 · passage 9",
    ),
    Example(
        "REs shall review the functional efficacy of SOC on a half-yearly basis. MIIs "
        "and Qualified REs (Mandatory)",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 118 · passage 10",
    ),
    Example(
        "REs shall conduct red teaming exercises as part of their cybersecurity "
        "framework on a half-yearly basis through use of red/ blue teams. 2.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 121 · passage 5",
    ),
    Example(
        "Threat hunting by leveraging threat intelligence, IOCs, IOAs, etc. shall be "
        "conducted on a quarterly basis.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 122 · passage 3",
    ),
    Example(
        "This information shall be shared with SEBI through the "
        "mkt_incidents@sebi.gov.in within 6 hours.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 123 · passage 10",
    ),
    Example(
        "However, necessary details of the incidents shall be reported on SEBI Incident "
        "Reporting Portal within 24 hours.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 123 · passage 11",
    ),
    Example(
        "All other cybersecurity incident(s) shall be reported to SEBI, CERT -In and "
        "NCIIPC (as applicable) within 24 hours. 2.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 123 · passage 13",
    ),
    Example(
        "Accordingly, the RTO shall be two (2) hours as recommended by IOSCO33 for the "
        "resumption of critical operations.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 128 · passage 12",
    ),
    Example(
        "REs shall conduct comprehensive scenario -based cyber resilience testing at "
        "least 2 times in a financial year (period icity of such testing shall be of 6 "
        "months), to validate their ability to recover and resume operations following "
        "a cybersecurity incident/ attack within prescribed RTO and RPO defined by "
        "SEBI.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 129 · passage 3",
    ),
    Example(
        "REs shall maintain offline, encrypted backups of data and shall regularly test "
        "these backups at least on a quarterly basis to ensure confidentiality, "
        "integrity and availability of data.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 130 · passage 8",
    ),
    Example(
        "Auditor must preferably have a minimum 3 years of experience in IT audit of "
        "Banking and Financial services preferably in the Securities Market.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 152 · passage 4",
    ),
    Example(
        "It shall not have been engaged over the last two years in any consulting "
        "engagement with any departments/ units of the RE being audited. f.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 152 · passage 11",
    ),
    Example(
        "While MIIs are required to conduct third -party assessment of their cyber "
        "resilience on a half-yearly basis, Qualified REs are directed to conduct self- "
        "assessment of their cyber resilience on an annual basis. B. Index Calculation "
        "Methodology- 1.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 164 · passage 2",
    ),
    Example(
        "Security Training Measure [PR.AT.S 1] Information Security Goal: Ensure that "
        "organization’s personnel are adequately trained to carry out their assigned "
        "information security- related duties and responsibilities Percentage (%) of "
        "information system security personnel that have received security training "
        "within the past one years.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 166 · passage 3",
    ),
    Example(
        "Details of the training/ awareness sessions scheduled within the past 1 year. "
        "2.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 166 · passage 5",
    ),
    Example(
        "For the reporting period, how many system audit logs have been reviewed for "
        "past six months for suspicious or abnormal activity. 2%",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 169 · passage 6",
    ),
    Example(
        "How many contingency plans were successfully tested within the past 1 year? 4.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 172 · passage 7",
    ),
    Example(
        "Reports of the contingency plan testing conducted in past one year. 4%",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 172 · passage 8",
    ),
    Example(
        "Effectiven ess Measure (Total number of CSK re ported events closed in 15 "
        "days/ Total number of CSK reported events to the organization)×1 00 100 % 1.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 184 · passage 9",
    ),
    Example(
        "Handling Critical Systems Critical Applications and assets' log ingestion in "
        "SIEM is being verified on a daily basis? Yes=1, No=0 (S) 2 S×W",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 193 · passage 10",
    ),
    Example(
        "Critical Applications and assets' integration with Anti-virus/ EDR, DAM, etc. "
        "verified on a daily basis? Yes=1, No=0 (T) 2 T×W Use-cases/rules configured on "
        "SIEM for critical systems? Yes=1, No=0 (U) 2 U×W Privilege access to critical "
        "systems verified on a weekly basis? Yes=1, No=0 (V) 2 V×W Configuration and "
        "data back-ups being taken periodically? Yes=1, No=0 (X) 2 X×W Total 75 Y *The "
        "above metric for SOC operations is not exhaustive, REs are requir ed to add "
        "other metrics depending upon the maturity of their security infrastructure and "
        "availability of tools and technologies.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 194 · passage 2",
    ),
    Example(
        "This information shall be shared to SEBI through the email ID "
        "mkt_incidents@sebi.gov.in within 6 hours and SEBI Incident Reporting Portal "
        "within 24 hours.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 200 · passage 4",
    ),
    Example(
        "Any/ all other cybersecurity incident(s) shall be reported to SEBI, CERT- In "
        "and NCIIPC (as applicable) within 24 hours.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 200 · passage 6",
    ),
    Example(
        "Implement ation (Number of information system security personnel that have "
        "completed security training within the past year/total number of information "
        "system security personnel) ×100 100 % 1.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 166 · passage 4",
    ),
    Example(
        "REs shall plan their VAPT activity in the beginning of the financial year.",
        "PERIOD_ONLY",
        False,
        "SEBI: cscrf-framework · Page 48 · passage 10",
    ),
    Example(
        "Cyber Capability Index (CCI) for MIIs and Qualified REs shall help these REs "
        "to monitor and assess their progress and cyber re silience on a periodic "
        "basis.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 6 · passage 7",
    ),
    Example(
        "Risk assessment (including post-quantum risks2) of RE’s IT environment shall "
        "be done on a periodic basis.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 15 · passage 4",
    ),
    Example(
        "The report of functional efficacy of Market SOC shall be provided by BSE and "
        "NSE to SEBI on a periodic basis. d.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 16 · passage 8",
    ),
    Example(
        "The CSCRF has provisions to address ‘harvest now - decrypt later’ attacks "
        "through continuous risk assessment and adoption of robust data protection "
        "measures.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 17 · passage 11",
    ),
    Example(
        "The closure of audit observations shall be regularly tracked by IT Committee "
        "for REs.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 52 · passage 1",
    ),
    Example(
        "Different scenarios and their respective responses shall be documented and "
        "tested on a periodic basis to check the risk management plan of the REs. 4.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 56 · passage 4",
    ),
    Example(
        "REs shall monitor, review and ensure compliance of third-party service "
        "providers performing critical activities for their respective organization on "
        "a periodic basis. 5.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 57 · passage 2",
    ),
    Example(
        "REs shall upgrade employees’ skills, periodically revise policies and conduct "
        "proof-of-concept trials in order to prepare themselves for cybersecurity "
        "challenges arising from quantum computing. 4.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 59 · passage 18",
    ),
    Example(
        "Privileged users’ activities shall be reviewed periodically.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 62 · passage 9",
    ),
    Example(
        "Effectiveness of protective technologies shall be measured on a regular basis "
        "in line with the SLAs. 11.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 66 · passage 7",
    ),
    Example(
        "Continuous monitoring: To monitor the end-points and network round the clock "
        "to immediately notify of abnormal or suspicious behavior. 2.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 69 · passage 5",
    ),
    Example(
        "REs shall conduct t hreat hunting and com promise assessment on a regular "
        "basis.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 70 · passage 13",
    ),
    Example(
        "REs cyber resilience capabilities shall be upgraded through periodic drills to "
        "ensure safe and timely restoration of critical operations.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 75 · passage 6",
    ),
    Example(
        "Along with Standards mentioned in Table 25, Self-certification REs shall be "
        "exempted from compliance to periodic cyber audit by CERT-In e mpanelled IS "
        "auditing organizations, i.e., Protect – Information Protection Processes and "
        "Procedures – Standard 14 (PR.IP.S14) and periodic evaluation of cybersecurity "
        "posture – Evolve – Strategies -Standard 5 (EV.ST.S5). 8.2.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 78 · passage 20",
    ),
    Example(
        "The policy document shall be reviewed by the aforementioned group periodically "
        "with a view to strengthen and improve cyber resilience posture. All REs "
        "(Mandatory) 3.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 82 · passage 8",
    ),
    Example(
        "This IT Committee of REs shall meet on a periodic23 basis to review the "
        "implementation of the cybersecurity and cyber resilience policy approved by "
        "their Board/ Partners/ Proprietor, and such review shall include goal setting "
        "for a target level of cyber resilience, and establish ing a plan to improve "
        "and strengthen cybersecurity and cyber resilience.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 84 · passage 12",
    ),
    Example(
        "The periodic25 reports submitted to SEBI shall highlight the critical "
        "activities handled by th e third-party service providers and REs shall certify "
        "that the above-mentioned requirement is complied with. 4.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 88 · passage 5",
    ),
    Example(
        "These controls may include host / network/ application based IPS, customized "
        "kernels for Linux, anti -virus and anti -malware software, etc. Anti-virus "
        "definition files updates and automatic anti -virus scanning shall be done on a "
        "regular basis. b.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 94 · passage 8",
    ),
    Example(
        "Physical access to the critical systems shall be revoked immediately if the "
        "same is no longer required. c.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 98 · passage 10",
    ),
    Example(
        "Solutions like IPS/ NG-IPS shall be used to continuously monitor the "
        "organizations’ network for malicious activities. c.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 100 · passage 4",
    ),
    Example(
        "A mechanism to keep this information periodically updated shall also be put in "
        "place.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 104 · passage 9",
    ),
    Example(
        "An implementation timeframe for each category of patches shall be established "
        "to apply them in a timely manner. 2.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 116 · passage 3",
    ),
    Example(
        "Communications cap acity – (“bandwidth” to ensure communications are made in a "
        "timely manner). 4. Capacity management shall be; a.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 120 · passage 2",
    ),
    Example(
        "CART solution shall be deployed for continuous, automated process of testing "
        "the security of the systems, and achieving greater visibility on attack "
        "surfaces. 3.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 121 · passage 6",
    ),
    Example(
        "REs shall periodically32 review and update their contingency plan, COOP, "
        "training exercises, and incident response and recovery plans (including CCMP) "
        "to incorporate lessons learn ed, and strengthen their response capabilities in "
        "the event of a future incident/ attack.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 126 · passage 8",
    ),
    Example(
        "REs shall undertake regular business continuity drills to check the readiness "
        "of the organization and effectiveness of existing security controls at the "
        "ground level.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 128 · passage 8",
    ),
    Example(
        "RE’s RTO shall be met for all interconnected systems and networks through "
        "capacity upgradations and periodic coordinated resilience testing. 2.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 131 · passage 3",
    ),
    Example(
        "Customers may be reminded within reasonable intervals to update their password "
        "and multi -factor credentials, and to ensure that their out -of-band "
        "authentication reset information (such as e-mail and phone number) are up-to- "
        "date. 7.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 159 · passage 14",
    ),
    Example(
        "Planning Measure [GV.RR.S 5] Information Security Goal: Develop, document, "
        "periodically update, and implement security measures for authorised access to "
        "the information systems of the organisation.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 178 · passage 2",
    ),
    Example(
        "Cybersecu rity Policy Document [GV.PO.S 1] Develop, document, periodically "
        "update, and implement cybersecurity policies and procedures for organizational "
        "information systems that describe the security controls in place or planned "
        "for information systems. Non quantifiable measure 1.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 185 · passage 2",
    ),
    Example(
        "Whether the RE has taken necessary (immediate) measures to contain the "
        "incident impact.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 200 · passage 16",
    ),
    Example(
        "All anomalies and alerts generated shall be properly monitored and "
        "investigated within stipulated time. 4.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 69 · passage 1",
    ),
    Example(
        "However, for emergency patching, patches shall be de ployed within timelines "
        "as stipulated by the OEMs. S.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 117 · passage 8",
    ),
    Example(
        "The committee shall also perform p eriodic review s of cybersecurity incident "
        "(if any), its impact, RCA and plan s to strengthen the cyber resilience in "
        "order to mitigate re-occurrence of such incidents in future. iii.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 45 · passage 5",
    ),
    Example(
        "To ensure that all the open vulnerabilities in the IT assets of REs have been "
        "fixed, revalidation VAPT and cyber audit shall also be done in a time bound "
        "manner. f.",
        "URGENCY_ONLY",
        False,
        "SEBI: cscrf-framework · Page 112 · passage 9",
    ),
    Example(
        "Further, SEBI has also issued various advisories to REs, from time to time, on "
        "Cybersecurity best practices.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 2 · passage 12",
    ),
    Example(
        "Further, SEBI has also issued several advisories on cybersecurity best "
        "practices for REs from time to time.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 13 · passage 5",
    ),
    Example(
        "Data that is required by the laws/ regulations/ circulars, etc. issued by SEBI "
        "and Govt. of India from time to time. d.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 29 · passage 7",
    ),
    Example(
        "While SOC serves twofold purpose, i.e., assessing and alerting security "
        "threats in real time thereby continuously improving organization’s security "
        "posture , however, setting-up own SOC may be onerous for the small REs.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 69 · passage 14",
    ),
    Example(
        "MIIs and Qualified REs shall get onboarded to CSK (Cyber Swachhta Kendra) and "
        "other CERT-In initiatives as notified from time to time.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 72 · passage 3",
    ),
    Example(
        "The cybersecurity policy shall encompass the principles prescribed by National "
        "Critical Information Infrastructure Protection Centre (NCIIPC) of National "
        "Technical Research Organisation (NTRO), GoI in the report titled ‘Guidelines "
        "for Protection of National Critical Information Infrastructure’ and subsequent "
        "revisions, if any, from time to time.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 85 · passage 4",
    ),
    Example(
        "REs shall incorporate best practices from standards such as ISO 27001, ISO "
        "27002, etc. or their subsequent revisions, if any, from time to time.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 85 · passage 6",
    ),
    Example(
        "REs shall use metrics like (including but not limited to) MTTD, MTTR, MTTC, "
        "number of cybersecurity incidents/ intrusion attempts detected and resolved "
        "within a specific period, number of false positives and false negatives "
        "generated by cybersecurity monitoring tools, number of successful cyber "
        "attacks occurred in the past year, and how these numbers are being reduced "
        "through continuous refinement of the monitoring process for measuring their "
        "cybersecurity maturity level.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 86 · passage 11",
    ),
    Example(
        "SEBI circulars on outsourcing of activities , currently mandated and updated "
        "from time to time, shall be complied with by the respective REs.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 90 · passage 2",
    ),
    Example(
        "CSIRT -Fin/ CERT-In advisories which are published periodically shall be "
        "referred for latest malicious domains/ IPs, C&C DNS and links.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 96 · passage 13",
    ),
    Example(
        "For capacity planning and monitoring, REs shall comply with circulars/ "
        "guidelines on capacity planning issued by SEBI (and updated from time to "
        "time).",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 106 · passage 12",
    ),
    Example(
        "Before introducing new technologies for critical systems, REs shall ensure "
        "that IT/ security team has assessed evolving security concerns and achieved "
        "fair level of maturity with such technologies before incorporating them into "
        "IT infrastructure. PR.IP.S14 1. Periodic Audit a.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 112 · passage 3",
    ),
    Example(
        "The incident shall also be reported to CERT -In in accordance with the "
        "guidelines/ directions issued by CERT-In from time to time.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 124 · passage 2",
    ),
    Example(
        "Such details, which are deemed useful for sharing with other REs, in a masked "
        "manner, shall be shared using mechanism to be specified by SEBI from time to "
        "time.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 124 · passage 5",
    ),
    Example(
        "RTO and RPO , as prescribed by SEBI from time to time , shall be included in "
        "the recovery plan for the restoration of systems after cybersecurity "
        "incidents. All REs (Mandatory) 5.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 130 · passage 7",
    ),
    Example(
        "E.g. Stock exchanges, clearing houses, depositories , stock brokers, "
        "depository participants, mutual funds, etc. The audit experien ce should have "
        "covered all the major areas mentioned under various cybersecurity frameworks "
        "and guidelines issued by SEBI from time to time .",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 152 · passage 5",
    ),
    Example(
        "Based on reviews of the incident database, IDS / IPS logs and alerts, and/ or "
        "appropriate remote access point log files, how many access points have been "
        "used to gain unauthorized access within the reporting period?",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 168 · passage 3",
    ),
    Example(
        "It may be noted that in case any RE does not report a cybersecurity incident "
        "to SEBI (when the RE is/ was aware of the incident) in a manner as laid down "
        "in the applicable cybersecurity framework, appropriate regulatory action may "
        "be taken by SEBI as deemed fit depending on the nature of the incident. 2.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 200 · passage 7",
    ),
    Example(
        "The incident shall also be reported to Indian Computer Emergency Response Team "
        "(CERT -In) in accordance with the guidelines/regulations/circular issued by "
        "CERT-In from time to time.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 200 · passage 12",
    ),
    Example(
        "5 Entities within SEBI’s purview, refer to Securities Contracts (Regulation) "
        "Act 1956, SEBI Act 1992, and Depositories Act 1996.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 24 · passage 9",
    ),
    Example(
        "If the data center is operated from outside the legal boundaries of India, "
        "then a copy of REs’ data in human/ application readable form shall be "
        "maintained within the legal boundaries of India. 5.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 27 · passage 9",
    ),
    Example(
        "The Regulatory Data shall be stored in an easily accessible, legible and "
        "usable form, within the legal boundaries of India.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 29 · passage 9",
    ),
    Example(
        "REs shall establish, communicate and enforce cybersecurity risk management "
        "roles, responsibilities, and authorities to foster accountability and "
        "continuous improvement. b.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 14 · passage 13",
    ),
    Example(
        "The periodicity of conducting cyber audit for SEBI REs in a financial year "
        "shall be as follows:",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 50 · passage 19",
    ),
    Example(
        "The details of periodicity, timeline and report submission for cyber audit by "
        "REs have been provided in the ‘CSCRF Compliance, Audit Report Submission, and "
        "Timelines’ section. d.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 112 · passage 7",
    ),
    Example(
        "Cyber audit observation against Standard 3 mentioned in ‘Detect: Continuous "
        "Security Monitoring’ header in CSCRF Part -I and respective guidelines in "
        "Part-II.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 171 · passage 3",
    ),
    Example(
        "The timeline for VAPT activity for SEBI REs shall be as follows:",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 49 · passage 2",
    ),
    Example(
        "Users within this group shall be limited and have separate accounts used for "
        "day-to-day operations with non-administrative permissions. d.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 101 · passage 6",
    ),
    Example(
        "*The above metric for SOC operations is not exhaustive, REs are required to "
        "add other metrics depending upon the maturity of their security infrastructure "
        "and availability of tools and technologies.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 196 · passage 1",
    ),
    Example(
        "This timeline shall be submitted along with the forensic investigation/ audit "
        "report.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 204 · passage 4",
    ),
    Example(
        "2 Quantum computing is a rapidly emerging technology that exploits quantum "
        "mechanics’ laws to solve complex problems.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 15 · passage 17",
    ),
    Example(
        "ISO 27001 certification11 – ISO 27001 certification is a globall y recognized "
        "standard for Information Security Management Systems (ISMS) published by the "
        "International Organization for Standardization (ISO).",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 28 · passage 1",
    ),
    Example(
        "The framework is broadly based on two approaches: cybersecurity and cyber "
        "resilience.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 31 · passage 12",
    ),
    Example(
        "Cybersecurity shall be included in human resources training programs. 1.3. "
        "GV.PO: Policy i.",
        "NO_TIMING",
        False,
        "SEBI: cscrf-framework · Page 54 · passage 9",
    ),
]
