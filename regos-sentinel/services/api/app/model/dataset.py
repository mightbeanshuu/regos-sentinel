"""The labelled corpus this model is trained on.

Every sentence here is real regulatory or quasi-regulatory wording, and every label was
assigned by reading it. The four classes are the four things that can be true about a
duty's timing, and they are the distinction the whole product turns on:

``PERIOD_AND_TRIGGER``
    A length of time *and* the event that starts it. A date can be computed.
``PERIOD_ONLY``
    A length of time and nothing that starts it. This is the FAQ Q17(a) shape — the
    defect this product exists to catch. No date may be produced.
``URGENCY_ONLY``
    Words that sound like a deadline and are not one: "immediately", "on a regular
    basis", "shall expedite". Common, and dangerous precisely because it reads as
    urgent.
``NO_TIMING``
    A duty with no timing language at all.

## On the size of this

There are 87 examples. That is small, and the metrics reported by ``train.py`` are
cross-validated and stated with that caveat attached rather than rounded up into a
claim. It is enough to learn the lexical signal, which for this task is strong and
narrow — the presence of a duration, and the presence of a clock-starting preposition.

The examples marked ``synthetic=True`` are constructed variations written to cover
shapes the real corpus contains too few of, particularly ``PERIOD_ONLY``, which is rare
in published text and is the class we most need to catch. They are labelled so that
anyone auditing the training set can strip them and re-measure.
"""

from __future__ import annotations

from typing import List, NamedTuple


class Example(NamedTuple):
    text: str
    label: str
    #: ``False`` for wording taken from a real published document.
    synthetic: bool
    source: str


PERIOD_AND_TRIGGER = "PERIOD_AND_TRIGGER"
PERIOD_ONLY = "PERIOD_ONLY"
URGENCY_ONLY = "URGENCY_ONLY"
NO_TIMING = "NO_TIMING"

LABELS = (PERIOD_AND_TRIGGER, PERIOD_ONLY, URGENCY_ONLY, NO_TIMING)


EXAMPLES: List[Example] = [
    # -- Real wording: SEBI CSCRF, its FAQ, and the May 2026 AI advisory ------ #
    Example(
        "VAPT report shall be submitted after approval from respective IT Committee "
        "for REs, within one month of completion of VAPT activity.",
        PERIOD_AND_TRIGGER, False, "CSCRF Table 19",
    ),
    Example(
        "Closure of findings identified during VAPT activity: Within 3 months of "
        "submission of VAPT report.",
        PERIOD_AND_TRIGGER, False, "CSCRF Table 19",
    ),
    Example(
        "Revalidation of VAPT shall be completed within 5 months of completion of VAPT.",
        PERIOD_AND_TRIGGER, False, "CSCRF Table 19",
    ),
    Example(
        "Based on the criticality of the patches, REs shall ensure that patches are "
        "implemented at both PDC and DR site within the upper or maximum time limit: "
        "High one week, Moderate two weeks, Low one month.",
        PERIOD_ONLY, False, "CSCRF PR.MA.S3",
    ),
    Example(
        "Compensatory controls like virtual patching shall be implemented for legacy "
        "systems for a maximum period of 6 months.",
        PERIOD_ONLY, False, "CSCRF PR.MA Guideline 6",
    ),
    Example(
        "Other vulnerabilities observations apart from implementation of patches shall "
        "be validated for non-closure against the VAPT observation closure timelines "
        "of three months.",
        PERIOD_ONLY, False, "CSCRF FAQ Q17(b)",
    ),
    Example(
        "Update all operating systems and applications with the latest patches on "
        "immediate basis.",
        URGENCY_ONLY, False, "SEBI AI advisory Annexure-A",
    ),
    Example(
        "REs shall undertake security audits on a regular and continuous basis.",
        URGENCY_ONLY, False, "SEBI AI advisory Annexure-A",
    ),
    Example(
        "All eligible REs not onboarded with any M-SOC shall expedite the onboarding.",
        URGENCY_ONLY, False, "SEBI AI advisory Annexure-A",
    ),
    Example(
        "Periodically update Asset Inventory and Software Bill of Materials.",
        URGENCY_ONLY, False, "SEBI AI advisory Annexure-A",
    ),
    Example(
        "Vendors shall implement appropriate safeguards including updating patch, VAPT, "
        "continuous monitoring and hardening measures.",
        NO_TIMING, False, "SEBI AI advisory Annexure-A",
    ),
    Example(
        "Virtual patching can be considered for protecting systems and networks.",
        NO_TIMING, False, "SEBI AI advisory Annexure-A",
    ),
    Example(
        "Connections through APIs are to be strictly on a whitelist-based approach.",
        NO_TIMING, False, "SEBI AI advisory Annexure-A",
    ),
    Example(
        "MIIs and other Regulated Entities shall seek guidance from their respective "
        "IT committees.",
        NO_TIMING, False, "SEBI AI advisory Annexure-A",
    ),
    Example(
        "All REs need to prepare a long-term plan for usage of AI in detection and "
        "autonomous or agentic mitigation.",
        NO_TIMING, False, "SEBI AI advisory Annexure-A item 10",
    ),
    Example(
        "REs are encouraged to include VAPT finding closure related timelines in their "
        "SLA with third-party service providers.",
        NO_TIMING, False, "CSCRF FAQ Q15",
    ),
    Example(
        "A graded approach based on the criticality of observations shall be followed "
        "for closure of the observations found during VAPT.",
        NO_TIMING, False, "CSCRF Table 19",
    ),
    Example(
        "The format records organisation, entity type, CSCRF category and rationale, "
        "audit period and authorised-signatory declaration.",
        NO_TIMING, False, "CSCRF Annexure-A",
    ),
    Example(
        "REs shall establish and ensure that the patch management procedures include "
        "the identification, categorization and prioritization of patches and updates.",
        NO_TIMING, False, "CSCRF PR.MA.S3",
    ),
    Example(
        "An implementation timeframe for each category of patches shall be established "
        "to apply them in a timely manner.",
        URGENCY_ONLY, False, "CSCRF PR.MA.S3",
    ),
    Example(
        "MIIs shall submit the Cyber Capability Index every six months from the end of "
        "the half-year.",
        PERIOD_AND_TRIGGER, False, "CSCRF CCI",
    ),
    Example(
        "Qualified REs shall compute the Cyber Capability Index annually.",
        PERIOD_ONLY, False, "CSCRF CCI",
    ),

    # -- Constructed variations, labelled as such ----------------------------- #
    # PERIOD_AND_TRIGGER: a duration plus an explicit clock-start.
    Example("The report shall be filed within 30 days of the date of the incident.",
            PERIOD_AND_TRIGGER, True, "constructed"),
    Example("Remediation shall be completed within two weeks from the date of discovery.",
            PERIOD_AND_TRIGGER, True, "constructed"),
    Example("Notify the board within 24 hours of detection of the breach.",
            PERIOD_AND_TRIGGER, True, "constructed"),
    Example("The audit shall commence within one month after approval from the committee.",
            PERIOD_AND_TRIGGER, True, "constructed"),
    Example("Records shall be retained for five years from the date of creation.",
            PERIOD_AND_TRIGGER, True, "constructed"),
    Example("Submit the certificate within 15 days of receipt of the notice.",
            PERIOD_AND_TRIGGER, True, "constructed"),
    Example("Close the finding within 90 days of submission of the audit report.",
            PERIOD_AND_TRIGGER, True, "constructed"),
    Example("The entity shall respond within seven days from the date of intimation.",
            PERIOD_AND_TRIGGER, True, "constructed"),
    Example("Backups shall be verified within 48 hours of completion of the backup run.",
            PERIOD_AND_TRIGGER, True, "constructed"),
    Example("Access shall be revoked within one day of separation of the employee.",
            PERIOD_AND_TRIGGER, True, "constructed"),
    Example("The plan shall be reviewed within six months of approval by the board.",
            PERIOD_AND_TRIGGER, True, "constructed"),
    Example("Report the incident within 6 hours of becoming aware of it.",
            PERIOD_AND_TRIGGER, True, "constructed"),
    Example("Testing shall conclude within three weeks after commencement of the engagement.",
            PERIOD_AND_TRIGGER, True, "constructed"),
    Example("Deficiencies shall be rectified within 60 days of the inspection report.",
            PERIOD_AND_TRIGGER, True, "constructed"),
    Example("The disclosure shall be made within two days from the trigger event.",
            PERIOD_AND_TRIGGER, True, "constructed"),

    # PERIOD_ONLY: the dangerous shape. A duration with nothing to anchor it.
    Example("Critical patches shall be applied within one week.",
            PERIOD_ONLY, True, "constructed"),
    Example("The maximum permissible downtime is four hours.",
            PERIOD_ONLY, True, "constructed"),
    Example("Findings shall be closed within three months.",
            PERIOD_ONLY, True, "constructed"),
    Example("Logs shall be retained for a period of 180 days.",
            PERIOD_ONLY, True, "constructed"),
    Example("The recovery time objective shall not exceed two hours.",
            PERIOD_ONLY, True, "constructed"),
    Example("Reviews shall be conducted at intervals not exceeding twelve months.",
            PERIOD_ONLY, True, "constructed"),
    Example("Moderate severity issues shall be remediated within two weeks.",
            PERIOD_ONLY, True, "constructed"),
    Example("The retention period shall be seven years.",
            PERIOD_ONLY, True, "constructed"),
    Example("Low severity patches shall be applied within one month.",
            PERIOD_ONLY, True, "constructed"),
    Example("A drill shall be conducted every six months.",
            PERIOD_ONLY, True, "constructed"),
    Example("Vendor agreements shall commit to a 30 day resolution timeline.",
            PERIOD_ONLY, True, "constructed"),
    Example("The assessment shall be repeated after twelve months.",
            PERIOD_ONLY, True, "constructed"),
    Example("Alerts shall be triaged within 15 minutes.",
            PERIOD_ONLY, True, "constructed"),
    Example("The maximum time limit for closure is three weeks.",
            PERIOD_ONLY, True, "constructed"),
    Example("Escalation shall occur within two business days.",
            PERIOD_ONLY, True, "constructed"),

    # URGENCY_ONLY: sounds like a deadline, is not one.
    Example("Vulnerabilities shall be remediated immediately.",
            URGENCY_ONLY, True, "constructed"),
    Example("The entity shall promptly notify the regulator.",
            URGENCY_ONLY, True, "constructed"),
    Example("Systems shall be monitored on a continuous basis.",
            URGENCY_ONLY, True, "constructed"),
    Example("Access reviews shall be carried out periodically.",
            URGENCY_ONLY, True, "constructed"),
    Example("Patches shall be applied in a timely manner.",
            URGENCY_ONLY, True, "constructed"),
    Example("The register shall be updated from time to time.",
            URGENCY_ONLY, True, "constructed"),
    Example("Incidents shall be escalated as soon as possible.",
            URGENCY_ONLY, True, "constructed"),
    Example("REs shall expedite remediation of critical findings.",
            URGENCY_ONLY, True, "constructed"),
    Example("Configuration baselines shall be reviewed regularly.",
            URGENCY_ONLY, True, "constructed"),
    Example("The committee shall meet at regular intervals.",
            URGENCY_ONLY, True, "constructed"),
    Example("Threat intelligence shall be consumed on an ongoing basis.",
            URGENCY_ONLY, True, "constructed"),
    Example("Staff shall be trained periodically on security awareness.",
            URGENCY_ONLY, True, "constructed"),
    Example("Backups shall be tested frequently.",
            URGENCY_ONLY, True, "constructed"),
    Example("The policy shall be updated whenever necessary.",
            URGENCY_ONLY, True, "constructed"),
    Example("Anomalies shall be investigated without undue delay.",
            URGENCY_ONLY, True, "constructed"),

    # NO_TIMING: a duty, plainly stated, with no temporal content.
    Example("The entity shall appoint a Chief Information Security Officer.",
            NO_TIMING, True, "constructed"),
    Example("Multi-factor authentication shall be enabled for all administrative access.",
            NO_TIMING, True, "constructed"),
    Example("The board shall approve the cybersecurity policy.",
            NO_TIMING, True, "constructed"),
    Example("Data shall be encrypted at rest and in transit.",
            NO_TIMING, True, "constructed"),
    Example("A register of critical assets shall be maintained.",
            NO_TIMING, True, "constructed"),
    Example("Third-party access shall be governed by a written agreement.",
            NO_TIMING, True, "constructed"),
    Example("The entity may adopt cloud services subject to the framework.",
            NO_TIMING, True, "constructed"),
    Example("Segregation of duties shall be enforced for privileged operations.",
            NO_TIMING, True, "constructed"),
    Example("The scope of the audit shall cover all in-scope systems.",
            NO_TIMING, True, "constructed"),
    Example("Findings shall be categorised by criticality.",
            NO_TIMING, True, "constructed"),
    Example("The CISO shall report to the Managing Director.",
            NO_TIMING, True, "constructed"),
    Example("Security controls shall be documented and approved.",
            NO_TIMING, True, "constructed"),
    Example("The entity shall maintain an incident response plan.",
            NO_TIMING, True, "constructed"),
    Example("Logging shall capture privileged user activity.",
            NO_TIMING, True, "constructed"),
    Example("Remote access shall be routed through a secure gateway.",
            NO_TIMING, True, "constructed"),
    Example("The entity shall classify data by sensitivity.",
            NO_TIMING, True, "constructed"),
    Example("Penetration testing shall be performed by an empanelled auditor.",
            NO_TIMING, True, "constructed"),
    Example("The framework applies to all registered intermediaries.",
            NO_TIMING, True, "constructed"),
    Example("Exceptions shall be recorded with a documented justification.",
            NO_TIMING, True, "constructed"),
    Example("Physical access to the data centre shall be restricted.",
            NO_TIMING, True, "constructed"),
]


def real_examples() -> List[Example]:
    return [item for item in EXAMPLES if not item.synthetic]


def counts() -> dict:
    return {label: sum(1 for item in EXAMPLES if item.label == label) for label in LABELS}
