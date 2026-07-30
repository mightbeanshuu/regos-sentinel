"""Real SEBI wording harvested from 26 published circulars (July 2026 pull).

Every sentence below is verbatim output of this product's own PDF extraction over
a real published SEBI document — the same text the served pipeline produces,
including its extraction artifacts. Every label was assigned by reading the
sentence (hand review, 2026-07-30). Sentences whose timing trigger is present
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
]
