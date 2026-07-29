"""The per-document model scorecard: fresh, deterministic, honest about gaps."""

from __future__ import annotations

import io

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.docscore import score_document
from app.documents import build_uploaded_document


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
    assert sum(score.timing_counts.values()) == score.passages_total
    assert score.with_timing_language == (
        score.timing_counts["PERIOD_AND_TRIGGER"]
        + score.timing_counts["PERIOD_ONLY"]
        + score.timing_counts["URGENCY_ONLY"]
    )
    assert score.sha256 == document.sha256


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
