"""The per-document model scorecard: fresh, deterministic, honest about gaps."""

from __future__ import annotations

import io

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.docscore import score_document
from app.documents import PassageClass, build_uploaded_document

#: The three verdicts that mean "this wording says something about time".
TIMED = ("PERIOD_AND_TRIGGER", "PERIOD_ONLY", "URGENCY_ONLY")


def _pdf(lines: list[str]) -> bytes:
    buffer = io.BytesIO()
    page = canvas.Canvas(buffer, pagesize=A4)
    y = 780
    for line in lines:
        page.drawString(40, y, line)
        y -= 24
    page.showPage()
    page.save()
    return buffer.getvalue()


def _document(lines: list[str]):
    return build_uploaded_document(
        document_id="DOC-TEST-1",
        filename="circular.pdf",
        payload=_pdf(lines),
        authority_label="Test authority",
        uploaded_at="2026-07-29T00:00:00Z",
    )


def test_scorecard_counts_come_from_the_passages() -> None:
    document = _document(
        [
            "REs shall close all findings within 3 months of submission of the VAPT report.",
            "REs shall remediate high-severity findings within 1 week.",
            "REs shall patch systems on an immediate basis.",
            "This circular explains the background of the framework.",
        ]
    )
    score = score_document(document)
    assert score is not None
    assert score.passages_total == len(document.passages)
    assert len(score.rows) == score.passages_total
    # Every passage is still read and still counted — in the whole-document table.
    assert sum(score.timing_counts_all_passages.values()) == score.passages_total
    # The metric's own table covers only the passages that could carry a duty.
    assert sum(score.timing_counts.values()) == score.passages_normative
    assert score.with_timing_language == (
        score.timing_counts["PERIOD_AND_TRIGGER"]
        + score.timing_counts["PERIOD_ONLY"]
        + score.timing_counts["URGENCY_ONLY"]
    )
    assert score.deadlines_with_trigger == score.timing_counts["PERIOD_AND_TRIGGER"]
    assert score.sha256 == document.sha256


def test_the_clarity_ratio_never_counts_a_passage_that_creates_no_duty() -> None:
    """The denominator has to match the claim the number makes.

    Run over every passage, the ratio pulled in table rows, background prose and
    permissions — on a real 205-page framework, 46% of its own denominator. None of
    them can have an unclear deadline, because none of them imposes one.
    """
    document = _document(
        [
            "REs shall close all findings within 3 months of submission of the VAPT report.",
            "REs shall remediate high-severity findings within 1 week.",
            # Background prose that nonetheless carries timing wording.
            "The previous framework was reviewed every 6 months before this circular.",
            # A permission with a period in it.
            "REs may retain the archived logs for a period of 5 years.",
        ]
    )
    score = score_document(document)
    assert score is not None

    duties = {
        row.passage_id
        for row in score.rows
        if row.classification in {PassageClass.POSSIBLE_REQUIREMENT, PassageClass.NEEDS_REVIEW}
        and row.timing_class != "NO_TIMING"
    }
    assert score.with_timing_language == len(duties)
    # The excluded ones are reported, not hidden.
    assert score.non_normative_timing_passages == (
        sum(score.timing_counts_all_passages[label] for label in TIMED)
        - score.with_timing_language
    )
    assert score.non_normative_timing_passages > 0
    assert score.deadline_clarity == round(
        score.deadlines_with_trigger / score.with_timing_language, 4
    )


def test_scorecard_is_deterministic() -> None:
    lines = ["REs shall submit the report within 30 days of the end of the quarter."]
    first = score_document(_document(lines))
    second = score_document(_document(lines))
    assert first is not None and second is not None
    assert first.timing_counts == second.timing_counts
    assert [row.timing_class for row in first.rows] == [
        row.timing_class for row in second.rows
    ]


def test_clarity_is_none_not_zero_when_nothing_carries_timing() -> None:
    score = score_document(
        _document(["This circular describes the history of the framework."])
    )
    assert score is not None
    if score.with_timing_language == 0:
        assert score.deadline_clarity is None


def test_blocked_durations_track_period_only() -> None:
    score = score_document(
        _document(["REs shall close all such observations within 3 months."])
    )
    assert score is not None
    assert score.blocked_durations == score.timing_counts["PERIOD_ONLY"]
