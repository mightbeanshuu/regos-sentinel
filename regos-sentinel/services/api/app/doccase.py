"""A Case generated from any uploaded circular — the Case A ritual, on your document.

The demo corpus proves one behaviour above all others: when wording states a period
but not the event that starts it, RegOS refuses to compute a date and routes the gap
to a named person. This module makes that demonstration work for *any* uploaded PDF:

* **Selection is deterministic and disclosed.** The committed timing model reads every
  passage; among passages already classified as possible requirements, the
  period-without-clock-start passage with the highest model confidence becomes the
  case. The count of candidates considered ships in the payload. If no such passage
  exists, no case exists — that is an answer, not a failure.
* **The reading comes before the reveal.** The reviewer's independent reading is
  committed and time-stamped before the system's suggestion is shown, exactly as in
  the guided Case A. The suggestion itself is fixed-rule wording built from the two
  verdicts — it is never model-generated prose and it is labelled deterministic.
* **Approval is the real thing.** Approving the case runs the document lane's own
  ``approve_requirement`` — the outcome is an ordinary signed requirement in the
  document's record and its exported reports, not a parallel artefact. A recorded
  clock-start policy plus a date yields a computed due date; no policy yields an
  honestly blocked one.
"""

from __future__ import annotations

import re
from datetime import date, timedelta
from typing import List, Optional, Tuple

from pydantic import Field

from .agents.tools import analyse_timing
from .documents import (
    DocumentRejected,
    PassageClass,
    RequirementApprovalRequest,
    UploadedDocument,
)
from .model.classifier import _DURATION, load_classifier
from .models import StrictModel

CASE_KIND = "PERIOD_WITHOUT_CLOCK_START"

#: Word-numbers the duration parser understands, mirroring the classifier's lexicon.
_NUMBER_WORDS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7,
    "eight": 8, "nine": 9, "ten": 10, "twelve": 12, "fifteen": 15, "twenty": 20,
    "thirty": 30, "sixty": 60, "ninety": 90,
}

_UNIT_DAYS = {"day": 1, "week": 7}

#: Months and years are added on the calendar, not as 30- and 365-day blocks.
#:
#: They used to be: "6 months" from 2026-04-01 resolved to 2026-09-28, three days
#: early, and the screen printed that date as a plain fact. A compliance date is
#: the wrong place to carry a silent approximation — and CSCRF FAQ Q20 makes the
#: point sharper still, because it reads every CSCRF periodicity against the
#: financial year, which a rolling 180-day count cannot express at all.
_UNIT_MONTHS = {"month": 1, "year": 12}

#: Stated on every computed date, because arithmetic a reader cannot see is
#: arithmetic they cannot check.
DUE_DATE_BASIS = (
    "Counted forward on the calendar from the start date recorded by the reviewer. "
    "A month means the same day of a later month; where that day does not exist "
    "the date falls on the last day of that month."
)


def _add_months(start: date, months: int) -> date:
    """The same day of a later month, clamped to that month's length.

    31 January plus one month has no 31 February to land on. Clamping to 28/29
    February keeps the date inside the period the wording grants rather than
    spilling into March, which would hand the entity days the source did not give.
    """
    index = (start.year * 12 + start.month - 1) + months
    year, month = divmod(index, 12)
    month += 1
    if month == 12:
        next_month_start = date(year + 1, 1, 1)
    else:
        next_month_start = date(year, month + 1, 1)
    last_day = (next_month_start - timedelta(days=1)).day
    return date(year, month, min(start.day, last_day))


class CaseReading(StrictModel):
    reviewer_name: str
    reviewer_role: str
    independent_interpretation: str
    trigger_policy: str
    committed_at: str
    revealed_system_suggestion: str
    system_suggestion_revealed_at: str


class CaseApproval(StrictModel):
    reviewer_name: str
    reviewer_role: str
    reason: str
    trigger_policy: str
    trigger_date: Optional[str] = None
    agrees_with_system_suggestion: bool
    approved_at: str
    requirement_id: str
    due_date: Optional[str] = None
    #: How that date was reached. Present only when a date was actually computed.
    due_date_basis: Optional[str] = None
    blocked_reason: Optional[str] = None


class DocumentCase(StrictModel):
    """The one defect this document best demonstrates, staged for a human decision."""

    document_id: str
    kind: str = CASE_KIND
    generated_at: str
    passage_id: str
    locator: str
    text: str
    duration_label: Optional[str] = None
    duration_value: Optional[int] = None
    duration_unit: Optional[str] = None
    model_verdict: str
    model_confidence: float
    rule_verdict: str
    verdicts_agree: bool
    candidates_considered: int = Field(ge=1)
    state: str = "READING_PENDING"  # READING_PENDING | READING_COMMITTED | APPROVED
    reading: Optional[CaseReading] = None
    approval: Optional[CaseApproval] = None
    limitation: str = (
        "The case names the wording the committed model and the fixed rule read as a "
        "period with no clock-start. Selection is a proposal — a person decides what "
        "the passage means, and nothing becomes work until they approve it."
    )


class CaseReadingRequest(StrictModel):
    reviewer_name: str = Field(min_length=2, max_length=80)
    reviewer_role: str = Field(default="Compliance Officer", min_length=2, max_length=80)
    independent_interpretation: str = Field(min_length=8, max_length=1200)
    trigger_policy: str = Field(min_length=8, max_length=200)


class CaseApprovalRequest(StrictModel):
    actor: str = Field(min_length=2, max_length=120)
    action: str = Field(min_length=2, max_length=120)
    obligation_object: str = Field(min_length=2, max_length=200)
    trigger_date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    reason: str = Field(min_length=8, max_length=500)
    agrees_with_system_suggestion: bool


def _parse_duration(text: str) -> Tuple[Optional[str], Optional[int], Optional[str]]:
    """The stated duration in the wording: its label, value and unit, when parseable."""
    match = _DURATION.search(f" {' '.join(text.lower().split())} ")
    if not match:
        return None, None, None
    label = match.group(0).strip()
    unit_match = re.search(r"(minute|hour|day|week|month|year)", label)
    number_match = re.search(r"\d+", label)
    value: Optional[int] = None
    if number_match:
        value = int(number_match.group(0))
    else:
        for word, number in _NUMBER_WORDS.items():
            if re.search(rf"\b{word}\b", label):
                value = number
                break
    unit = unit_match.group(0) if unit_match else None
    if value is None or unit is None or unit in ("minute", "hour"):
        # Sub-day periods are real but a calendar due date would misstate them.
        return label, None, None
    return label, value, f"{unit}s"


def generate_case(document: UploadedDocument, generated_at: str) -> DocumentCase:
    """Pick the passage this document's case is made of. Deterministic, disclosed."""
    classifier = load_classifier()
    if classifier is None:
        raise DocumentRejected(503, "No committed model weights are available.")

    candidates: List[Tuple[bool, float, object]] = []
    for passage in document.passages:
        if passage.classification != PassageClass.POSSIBLE_REQUIREMENT:
            continue
        verdict, confidence = classifier.predict(passage.text)
        if verdict != "PERIOD_ONLY":
            continue
        # A defect a policy can actually cure — a day-or-longer duration a recorded
        # clock-start would turn into a date — outranks one that never could
        # (sub-day periods make no calendar due date).
        _, value, unit = _parse_duration(passage.text)
        curable = value is not None and unit is not None
        candidates.append((curable, confidence, passage))

    if not candidates:
        raise DocumentRejected(
            404,
            "No passage in this document states a period without its clock-start, so "
            "there is no Case A defect to review here. That is the reading, not an error.",
        )

    _, confidence, passage = max(candidates, key=lambda item: (item[0], item[1]))
    label, value, unit = _parse_duration(passage.text)
    rule = analyse_timing(passage.text)
    rule_verdict = str(rule["verdict"])

    return DocumentCase(
        document_id=document.id,
        generated_at=generated_at,
        passage_id=passage.id,
        locator=passage.locator,
        text=passage.text,
        duration_label=label,
        duration_value=value,
        duration_unit=unit,
        model_verdict="PERIOD_ONLY",
        model_confidence=round(confidence, 4),
        rule_verdict=rule_verdict,
        verdicts_agree=rule_verdict == "PERIOD_WITHOUT_TRIGGER",
        candidates_considered=len(candidates),
        limitation=_limitation_for(label, value),
    )


#: Said out loud when the stated period is shorter than a day.
#:
#: `_parse_duration` deliberately drops hours and minutes: this product computes
#: calendar dates, and printing "28 September" for a two-hour RTO would misstate
#: it. That decision is right, but silently returning no due date told the reader
#: the wrong story — SEBI's own two-hour resumption target and thirty-minute
#: disaster declaration are among the sharpest deadlines it publishes, and a
#: reviewer who records the clock-start and still gets no date deserves to know
#: the limit is ours, not the circular's.
SUB_DAY_LIMITATION = (
    "This passage states a period shorter than a day ({label}). RegOS works in "
    "calendar dates, so it will not offer a due date here even once you record "
    "what starts the clock — a date would misstate an hours-scale deadline. The "
    "period and its start are still recorded, and the limit is this tool's, not "
    "the document's."
)


def _limitation_for(label: Optional[str], value: Optional[int]) -> str:
    base = (
        "The case names the wording the committed model and the fixed rule read as a "
        "period with no clock-start. Selection is a proposal — a person decides what "
        "the passage means, and nothing becomes work until they approve it."
    )
    if label and value is None:
        return f"{base} {SUB_DAY_LIMITATION.format(label=label)}"
    return base


def _suggestion(case: DocumentCase) -> str:
    """Fixed-rule wording, built from the two verdicts. Never model prose."""
    duration = f" ('{case.duration_label}')" if case.duration_label else ""
    agreement = (
        "The committed model and the fixed rule read it the same way."
        if case.verdicts_agree
        else (
            "The committed model reads it as a period without a clock-start; the fixed "
            f"rule says {case.rule_verdict}. The disagreement is part of the record."
        )
    )
    return (
        f"The passage states a duration{duration} and names no event that starts it. "
        f"{agreement} No due date can honestly be derived from the wording alone — "
        "the clock-start is a policy decision for a named person."
    )


def commit_case_reading(
    case: DocumentCase, request: CaseReadingRequest, committed_at: str
) -> DocumentCase:
    if case.state != "READING_PENDING":
        raise DocumentRejected(
            409,
            "A reading has already been committed for this case. It was time-stamped "
            "before the suggestion was revealed and cannot be rewritten.",
        )
    case.reading = CaseReading(
        reviewer_name=request.reviewer_name.strip(),
        reviewer_role=request.reviewer_role.strip(),
        independent_interpretation=request.independent_interpretation.strip(),
        trigger_policy=request.trigger_policy.strip(),
        committed_at=committed_at,
        revealed_system_suggestion=_suggestion(case),
        system_suggestion_revealed_at=committed_at,
    )
    case.state = "READING_COMMITTED"
    return case


def _due_date(case: DocumentCase, trigger_date: Optional[str]) -> Optional[str]:
    """Trigger date plus the stated duration — only when both are actually present."""
    if not trigger_date or case.duration_value is None or case.duration_unit is None:
        return None
    start = date.fromisoformat(trigger_date)
    unit = case.duration_unit.rstrip("s")
    months = _UNIT_MONTHS.get(unit)
    if months is not None:
        return _add_months(start, case.duration_value * months).isoformat()
    days = _UNIT_DAYS.get(unit)
    if days is None:
        return None
    return (start + timedelta(days=case.duration_value * days)).isoformat()


def approval_request_for(
    case: DocumentCase, request: CaseApprovalRequest
) -> RequirementApprovalRequest:
    """The ordinary requirement-approval this case approval resolves to."""
    if case.state != "READING_COMMITTED":
        raise DocumentRejected(
            409,
            "Commit an independent reading before approving — the reading must be "
            "time-stamped before the suggestion is revealed."
            if case.state == "READING_PENDING"
            else "This case has already been approved and sealed.",
        )
    assert case.reading is not None
    return RequirementApprovalRequest(
        passage_id=case.passage_id,
        actor=request.actor,
        action=request.action,
        obligation_object=request.obligation_object,
        duration_value=case.duration_value,
        duration_unit=case.duration_unit,
        trigger=case.reading.trigger_policy if request.trigger_date else None,
        reviewer_name=case.reading.reviewer_name,
        reviewer_role=case.reading.reviewer_role,
        reason=request.reason,
    )


def seal_case(
    case: DocumentCase,
    request: CaseApprovalRequest,
    requirement_id: str,
    blocked_reason: Optional[str],
    approved_at: str,
) -> DocumentCase:
    assert case.reading is not None
    due_date = _due_date(case, request.trigger_date)
    case.approval = CaseApproval(
        reviewer_name=case.reading.reviewer_name,
        reviewer_role=case.reading.reviewer_role,
        reason=request.reason.strip(),
        trigger_policy=case.reading.trigger_policy,
        trigger_date=request.trigger_date,
        agrees_with_system_suggestion=request.agrees_with_system_suggestion,
        approved_at=approved_at,
        requirement_id=requirement_id,
        due_date=due_date,
        due_date_basis=DUE_DATE_BASIS if due_date else None,
        blocked_reason=blocked_reason,
    )
    case.state = "APPROVED"
    return case
