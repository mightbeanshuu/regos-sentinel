from __future__ import annotations

from html import escape
from io import BytesIO
from typing import Iterable, List, Sequence

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from .documents import (
    NO_TASK_CLASSES,
    DocumentState,
    PassageClass,
    UploadedDocument,
)
from .models import BuildRun, BuildStatus, DeonticForce, WorkspaceState

DISCLAIMER = "Decision support. Not legal advice. Not a SEBI determination."
REPLAY_COMMAND = "REGOS_OFFLINE=1 uv run python scripts/replay_build.py"
INK = colors.HexColor("#17211B")
MUTED = colors.HexColor("#52605A")
GREEN = colors.HexColor("#136C4D")
AMBER = colors.HexColor("#A05A00")
PALE_GREEN = colors.HexColor("#EAF5EF")
PALE_AMBER = colors.HexColor("#FFF4DB")
PALE_GREY = colors.HexColor("#F2F4F3")
GRID = colors.HexColor("#CCD4D0")


class _InvariantCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs) -> None:
        kwargs["invariant"] = 1
        kwargs["pageCompression"] = 1
        super().__init__(*args, **kwargs)
        self.setTitle("RegOS Sentinel Compliance Build Report")
        self.setAuthor("RegOS Sentinel")
        self.setSubject("Synthetic compliance build decision-support artifact")
        self.setCreator("RegOS Sentinel deterministic report renderer")


class _DraftCanvas(_InvariantCanvas):
    """Identical deterministic canvas, plus an unmissable DRAFT watermark on every page."""

    def showPage(self) -> None:  # noqa: N802 - reportlab's API casing
        self.saveState()
        width, height = self._pagesize
        self.setFont("Helvetica-Bold", 58)
        self.setFillColor(colors.Color(0.72, 0.42, 0.0, alpha=0.11))
        self.translate(width / 2, height / 2)
        self.rotate(38)
        self.drawCentredString(0, 0, "DRAFT — NOT APPROVED")
        self.restoreState()
        super().showPage()


def _styles() -> dict[str, ParagraphStyle]:
    sample = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "Title",
            parent=sample["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=28,
            textColor=INK,
            alignment=TA_LEFT,
            spaceAfter=8,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=sample["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            textColor=MUTED,
            spaceAfter=10,
        ),
        "h1": ParagraphStyle(
            "H1",
            parent=sample["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=21,
            textColor=INK,
            spaceBefore=4,
            spaceAfter=10,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=sample["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=GREEN,
            spaceBefore=6,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=sample["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=INK,
            spaceAfter=5,
        ),
        "small": ParagraphStyle(
            "Small",
            parent=sample["BodyText"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10.5,
            textColor=MUTED,
        ),
        "label": ParagraphStyle(
            "Label",
            parent=sample["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=10,
            textColor=MUTED,
        ),
        "hero": ParagraphStyle(
            "Hero",
            parent=sample["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=18,
            textColor=AMBER,
            alignment=TA_CENTER,
            spaceAfter=5,
        ),
        "quote": ParagraphStyle(
            "Quote",
            parent=sample["BodyText"],
            fontName="Helvetica-Oblique",
            fontSize=8.5,
            leading=12,
            leftIndent=8,
            borderColor=GRID,
            borderWidth=0.5,
            borderPadding=7,
            textColor=INK,
            spaceAfter=6,
        ),
    }


def _p(text: object, style: ParagraphStyle) -> Paragraph:
    return Paragraph(escape(str(text)).replace("\n", "<br/>"), style)


def _rich(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text, style)


def _table(
    rows: Sequence[Sequence[object]],
    widths: Sequence[float],
    styles: dict[str, ParagraphStyle],
) -> Table:
    rendered = [
        [cell if isinstance(cell, Paragraph) else _p(cell, styles["small"]) for cell in row]
        for row in rows
    ]
    table = Table(rendered, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PALE_GREY),
                ("TEXTCOLOR", (0, 0), (-1, 0), INK),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.35, GRID),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def _page_header_footer(pdf: canvas.Canvas, doc: SimpleDocTemplate) -> None:
    pdf.saveState()
    width, height = doc.pagesize
    pdf.setStrokeColor(GRID)
    pdf.line(doc.leftMargin, 13 * mm, width - doc.rightMargin, 13 * mm)
    pdf.setFont("Helvetica", 7)
    pdf.setFillColor(MUTED)
    pdf.drawString(doc.leftMargin, 8.5 * mm, "RegOS Sentinel · SYNTHETIC DEMO")
    pdf.drawRightString(width - doc.rightMargin, 8.5 * mm, f"Page {doc.page}")
    pdf.restoreState()


def _approved_build(state: WorkspaceState, build_id: str) -> BuildRun:
    build = next((item for item in state.builds if item.id == build_id), None)
    if build is None:
        raise ValueError("Build does not exist in this session.")
    if build.status != BuildStatus.APPROVED:
        raise ValueError("Compliance Build Reports are available only for approved builds.")
    if state.latest_manifest is None or state.latest_manifest.build_id != build_id:
        raise ValueError("The approved build does not have a sealed manifest in this session.")
    return build


def _new_page(story: List[object], title: str, styles: dict[str, ParagraphStyle]) -> None:
    if story:
        story.append(PageBreak())
    story.append(_p(title, styles["h1"]))


def _provenance_lines(obligation, styles: dict[str, ParagraphStyle]) -> Iterable[Paragraph]:
    for field, provenance in obligation.field_provenance.items():
        yield _rich(
            f"<b>{escape(field)}</b> · {escape(provenance.value)}",
            styles["small"],
        )


def render_compliance_report(state: WorkspaceState, build_id: str) -> bytes:
    build = _approved_build(state, build_id)
    manifest = state.latest_manifest
    assert manifest is not None
    styles = _styles()
    story: List[object] = []
    document = state.documents[0]

    story.extend(
        [
            Spacer(1, 20 * mm),
            _p("COMPLIANCE BUILD REPORT", styles["title"]),
            _p("Human-supervised regulatory compilation", styles["subtitle"]),
            Spacer(1, 8 * mm),
            _table(
                [
                    ["Entity", f"{state.entity_profile.legal_name} · SYNTHETIC"],
                    ["Build / run", f"{build.id} / {build.run_id}"],
                    ["Generated at", build.completed_at],
                    ["Source", document.title],
                    ["Official URL", document.source_url],
                    ["Source SHA-256", document.content_hash],
                    ["Hash scope", document.content_hash_scope],
                    ["Legal state", document.legal_state],
                ],
                [34 * mm, 126 * mm],
                styles,
            ),
            Spacer(1, 10 * mm),
            _p(DISCLAIMER, styles["hero"]),
            _p(
                "All entity, finding, evidence and vendor data in this report is synthetic.",
                styles["subtitle"],
            ),
        ]
    )

    _new_page(story, "2. What changed", styles)
    changes: List[str] = []
    control = state.controls[0] if state.controls else None
    if control and control.previous_rule_summary:
        changes.append(f"The existing control said: {control.previous_rule_summary}")
    patch = next((item for item in state.findings if item.id == "F-001"), None)
    other = next((item for item in state.findings if item.id == "F-002"), None)
    if patch:
        changes.append(
            f"{patch.id} is a {patch.severity.lower()}-severity missing-patch finding and was "
            "placed in the one-week branch."
        )
    if other:
        changes.append(
            f"{other.id} is a {other.severity.lower()}-severity non-patch finding and remains "
            "in the three-month branch."
        )
    blocked = next(
        (item for item in state.obligations if item.id == "OBL-PATCH-HIGH-CANDIDATE"),
        None,
    )
    if blocked and not blocked.deadline.computable:
        changes.append(
            "RegOS did not calculate the one-week due date because the cited source does not "
            "state the clock-start."
        )
    if state.reviews:
        changes.append(
            "A named compliance reviewer supplied an entity policy for the trigger; the "
            "corrected split was then compiled and approved."
        )
    for index, line in enumerate(changes[:5], start=1):
        story.append(_rich(f"<b>{index}.</b> {escape(line)}", styles["body"]))

    _new_page(story, "3. Obligations compiled", styles)
    active = [item for item in state.obligations if item.status == "ACTIVE"]
    for obligation in active:
        citation = obligation.deadline.citation
        story.append(
            KeepTogether(
                [
                    _p(f"{obligation.id} · {obligation.action} {obligation.object}", styles["h2"]),
                    _p(f'“{citation.quote}”', styles["quote"]),
                    _p(f"Locator: {citation.locator}", styles["small"]),
                    _p(
                        f"Actor: {obligation.actor}\nCondition: {obligation.condition}\n"
                        f"Deadline: {obligation.deadline.duration} {obligation.deadline.unit}",
                        styles["body"],
                    ),
                    _p("Per-field provenance", styles["label"]),
                    *_provenance_lines(obligation, styles),
                ]
            )
        )
        story.append(Spacer(1, 4 * mm))

    _new_page(story, "4. The blocked item", styles)
    if blocked:
        story.extend(
            [
                _p("PUBLICATION BLOCKED — EXPECTED SAFETY BEHAVIOUR", styles["hero"]),
                _table(
                    [
                        ["Field", "Value", "Provenance"],
                        [
                            "Duration",
                            f"{blocked.deadline.duration} {blocked.deadline.unit}",
                            blocked.deadline.duration_provenance.value,
                        ],
                        ["Source", blocked.deadline.citation.locator, "SOURCE_EXPLICIT"],
                        ["Trigger", "NOT STATED IN SOURCE", "—"],
                        ["Due date", "NOT COMPUTED BY REGOS", "—"],
                    ],
                    [34 * mm, 82 * mm, 44 * mm],
                    styles,
                ),
                Spacer(1, 6 * mm),
            ]
        )
    if state.reviews:
        review = state.reviews[-1]
        story.extend(
            [
                _p("Persisted human policy decision", styles["h2"]),
                _table(
                    [
                        ["Reviewer", review.reviewer_name],
                        ["Role", review.reviewer_role],
                        ["Recorded at", review.decided_at],
                        ["Trigger policy", review.policy_inputs.get("trigger_policy", "")],
                        ["Written reason", review.reason],
                        ["Provenance", "HUMAN_POLICY"],
                    ],
                    [38 * mm, 122 * mm],
                    styles,
                ),
            ]
        )

    _new_page(story, "5. Not converted to obligations", styles)
    story.append(
        _p(
            "These source statements were retained without creating mandatory work. This page "
            "records over-compliance avoided by preserving their actual deontic force.",
            styles["body"],
        )
    )
    declined = [
        item
        for item in state.regulatory_statements
        if item.deontic_force in {DeonticForce.RECOMMENDED, DeonticForce.PERMITTED}
    ]
    rows: List[Sequence[object]] = [["Force", "Exact source phrase", "Operational result"]]
    for statement in declined:
        rows.append(
            [
                statement.deontic_force.value,
                f'“{statement.exact_phrase}”',
                "No mandatory task created from this statement.",
            ]
        )
    story.append(_table(rows, [28 * mm, 84 * mm, 48 * mm], styles))

    _new_page(story, "6. Applicability receipt", styles)
    applicability_rows: List[Sequence[object]] = [
        ["Result", "Obligation / scenario", "Entity fact", "Clause"]
    ]
    for obligation in active:
        receipt = obligation.applicability
        applicability_rows.append(
            [
                "INCLUDED" if receipt.applies else "EXCLUDED",
                obligation.id,
                receipt.entity_fact,
                f"{receipt.citation.locator} · {receipt.citation.quote}",
            ]
        )
    for receipt in state.applicability_scenarios:
        applicability_rows.append(
            [
                "INCLUDED" if receipt.activated else "EXCLUDED",
                receipt.scenario,
                "; ".join(receipt.entity_facts),
                f"{receipt.citation.locator} · {receipt.citation.quote}",
            ]
        )
    story.append(_table(applicability_rows, [20 * mm, 42 * mm, 42 * mm, 56 * mm], styles))

    _new_page(story, "7. Tests executed", styles)
    test_rows: List[Sequence[object]] = [["Build", "Gate", "Result", "Message"]]
    for historical_build in state.builds:
        for test in historical_build.tests:
            test_rows.append(
                [historical_build.id, test.name, test.status.value, test.message]
            )
    story.append(_table(test_rows, [22 * mm, 42 * mm, 20 * mm, 76 * mm], styles))

    _new_page(story, "8. Evidence state changes", styles)
    evidence_rows: List[Sequence[object]] = [["Artifact", "State", "Reason"]]
    for evidence in state.evidence:
        evidence_rows.append(
            [f"{evidence.name} · SYNTHETIC", evidence.status.value, evidence.reason or ""]
        )
    story.append(_table(evidence_rows, [48 * mm, 38 * mm, 74 * mm], styles))

    _new_page(story, "9. Tasks raised", styles)
    task_rows: List[Sequence[object]] = [["Task", "Owner", "Branch", "Why"]]
    active_by_id = {item.id: item for item in active}
    for task in state.tasks:
        obligation = active_by_id.get(task.source_obligation_id)
        task_rows.append(
            [
                f"{task.title} · SYNTHETIC",
                task.owner,
                obligation.condition if obligation else task.source_obligation_id,
                task.work_type,
            ]
        )
    story.append(_table(task_rows, [54 * mm, 32 * mm, 44 * mm, 30 * mm], styles))

    _new_page(story, "10. Reproducibility", styles)
    reproducibility = manifest.reproducibility
    replay_rows: List[Sequence[object]] = [
        ["Source excerpt SHA-256", document.content_hash],
        ["Replay input SHA-256", reproducibility.get("replay_input_sha256", "")],
        ["Model input SHA-256", reproducibility.get("model_input_sha256", "")],
        ["Model output SHA-256", reproducibility.get("model_output_sha256", "")],
        ["Manifest SHA-256", manifest.manifest_sha256],
        ["Model", reproducibility.get("model_id", "")],
        ["Prompt version", reproducibility.get("prompt_version", "")],
        ["Cache hit", str(reproducibility.get("model_cache_hit", "")).lower()],
        ["Offline replay", reproducibility.get("offline_replay_command", REPLAY_COMMAND)],
    ]
    replay_rows = [row for row in replay_rows if row[1] != ""]
    story.append(_table(replay_rows, [44 * mm, 116 * mm], styles))

    _new_page(story, "11. Limitations", styles)
    limitations = [
        "Entity, finding, evidence, vendor and task data is synthetic.",
        (
            "Prototype scope is nine human-verified FAQ spans plus four resolved CSCRF "
            "dependencies; it is not the full regulatory corpus."
        ),
        (
            "Spans left ambiguous after approval: "
            f"{sum(item.status.value == 'AMBIGUOUS_REVIEW_REQUIRED' for item in state.coverage)}."
        ),
        (
            f"Measured benchmark: {state.latest_benchmark.label}."
            if state.latest_benchmark is not None
            else ""
        ),
        (
            "Material interpretations, including the missing clock-start, remain recorded "
            "human decisions."
        ),
        "The prototype does not file with SEBI or write to production systems.",
    ]
    for line in (item for item in limitations if item):
        story.append(_rich(f"• {escape(line)}", styles["body"]))

    output = BytesIO()
    doc = SimpleDocTemplate(
        output,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        title="RegOS Sentinel Compliance Build Report",
        author="RegOS Sentinel",
    )
    doc.build(
        story,
        canvasmaker=_InvariantCanvas,
        onFirstPage=_page_header_footer,
        onLaterPages=_page_header_footer,
    )
    return output.getvalue()


PASSAGE_LABELS: dict[PassageClass, str] = {
    PassageClass.POSSIBLE_REQUIREMENT: "Possible requirement",
    PassageClass.RECOMMENDATION: "Recommended — no mandatory task",
    PassageClass.PERMISSION: "Optional — no mandatory task",
    PassageClass.BACKGROUND: "Background only",
    PassageClass.DUPLICATE_OR_SUPERSEDED: "Duplicate or superseded",
    PassageClass.NEEDS_REVIEW: "Needs interpretation",
}

DOCUMENT_STATE_LABELS: dict[DocumentState, str] = {
    DocumentState.ADDED: "Added",
    DocumentState.READING: "Reading document",
    DocumentState.READY_FOR_REVIEW: "Ready for review",
    DocumentState.NEEDS_REVIEW: "Needs review",
    DocumentState.READY_FOR_APPROVAL: "Ready for approval",
    DocumentState.APPROVED: "Approved",
    DocumentState.UNREADABLE: "Could not read document",
}


def _document_story(
    document: UploadedDocument,
    styles: dict[str, ParagraphStyle],
    approved: bool,
) -> List[object]:
    """One conditional story shared by the draft packet and the approved report.

    A section is emitted only when the document actually holds that data. Nothing is
    padded with plausible filler.
    """
    scope = document.scope
    story: List[object] = [
        Spacer(1, 14 * mm),
        _p(
            "COMPLIANCE BUILD REPORT" if approved else "DRAFT REVIEW PACKET",
            styles["title"],
        ),
        _p(
            "Approved review of a user-supplied document"
            if approved
            else "Work in progress — this is not an approved Compliance Build Report",
            styles["subtitle"],
        ),
        Spacer(1, 6 * mm),
        _table(
            [
                ["Document", document.filename],
                ["Source status", "User-uploaded · not validated by SEBI"],
                ["Authority (as entered)", f"{document.authority_label} · user-provided metadata"],
                ["Uploaded at", document.uploaded_at],
                ["File SHA-256", document.sha256],
                ["File size", f"{document.byte_count:,} bytes"],
                ["State", DOCUMENT_STATE_LABELS[document.state]],
                ["Extraction", "Deterministic text extraction · no model call · no OCR"],
            ],
            [40 * mm, 120 * mm],
            styles,
        ),
        Spacer(1, 8 * mm),
        _p(DISCLAIMER, styles["hero"]),
    ]

    _new_page(story, "1. What was and was not read", styles)
    story.append(
        _p(
            "These counts are read from this document's actual processed state. Nothing outside "
            "the rows below was reviewed.",
            styles["body"],
        )
    )
    story.append(
        _table(
            [
                ["Measure", "Count"],
                ["Pages in document", str(scope.page_count)],
                ["Pages read", str(scope.pages_read)],
                [
                    "Pages with no extractable text",
                    ", ".join(str(page) for page in scope.pages_unreadable) or "none",
                ],
                ["Passages reviewed", str(scope.passages_reviewed)],
                ["Possible requirements", str(scope.possible_requirements)],
                ["Recommendations not converted", str(scope.recommendations_not_converted)],
                ["Permissions not converted", str(scope.permissions_not_converted)],
                ["Background passages", str(scope.background)],
                ["Duplicate or superseded", str(scope.duplicates)],
                ["Passages still needing review", str(scope.passages_needing_review)],
            ],
            [110 * mm, 50 * mm],
            styles,
        )
    )

    unresolved = [
        item for item in document.passages if item.classification == PassageClass.NEEDS_REVIEW
    ]
    if unresolved:
        _new_page(story, "2. Passages still needing a human reading", styles)
        story.append(
            _p(
                "No requirement was drafted from any passage below. Each carries more than one "
                "requirement strength, or a person set it aside.",
                styles["body"],
            )
        )
        rows: List[Sequence[object]] = [["Locator", "Passage", "Why it is unresolved"]]
        for passage in unresolved[:40]:
            rows.append([passage.locator, passage.text[:400], passage.rationale])
        story.append(_table(rows, [26 * mm, 84 * mm, 50 * mm], styles))

    if document.requirements:
        _new_page(
            story,
            "3. Requirements approved by a person" if approved else "3. Draft requirements",
            styles,
        )
        for requirement in document.requirements:
            deadline = (
                f"{requirement.duration_value} {requirement.duration_unit}"
                if requirement.duration_value is not None
                else "no duration recorded"
            )
            trigger = requirement.trigger or "NOT RECORDED — no due date was calculated"
            story.append(
                KeepTogether(
                    [
                        _p(
                            f"{requirement.id} · {requirement.action} "
                            f"{requirement.obligation_object}",
                            styles["h2"],
                        ),
                        _p(f'“{requirement.quote}”', styles["quote"]),
                        _p(f"Locator: {requirement.locator}", styles["small"]),
                        _table(
                            [
                                ["Actor", requirement.actor],
                                ["Duration", deadline],
                                ["Starts from", trigger],
                                [
                                    "Due date",
                                    "Calculated only from the recorded start event"
                                    if requirement.computable
                                    else "NOT CALCULATED",
                                ],
                                ["Blocked reason", requirement.blocked_reason or "—"],
                                [
                                    "Recorded by",
                                    f"{requirement.reviewer_name} · {requirement.reviewer_role}",
                                ],
                                ["Recorded at", requirement.approved_at],
                                ["Written reason", requirement.reason],
                                ["Provenance", "HUMAN_POLICY — confirmed by a named reviewer"],
                            ],
                            [34 * mm, 126 * mm],
                            styles,
                        ),
                    ]
                )
            )
            story.append(Spacer(1, 4 * mm))

    not_converted = [
        item for item in document.passages if item.classification in NO_TASK_CLASSES
    ]
    if not_converted:
        _new_page(story, "4. Not converted into requirements", styles)
        story.append(
            _p(
                "These statements were retained without creating mandatory work, because their "
                "language does not require it.",
                styles["body"],
            )
        )
        rows = [["Classification", "Locator", "Exact wording", "Operational result"]]
        for passage in not_converted[:60]:
            rows.append(
                [
                    PASSAGE_LABELS[passage.classification],
                    passage.locator,
                    f'“{passage.text[:300]}”',
                    "No mandatory task was created from this statement.",
                ]
            )
        story.append(_table(rows, [30 * mm, 24 * mm, 70 * mm, 36 * mm], styles))

    reviewed = [item for item in document.passages if item.reviewed_by]
    if reviewed:
        _new_page(story, "5. Human decisions on this document", styles)
        rows = [["Locator", "Reading recorded", "Reviewer", "Recorded at"]]
        for passage in reviewed:
            rows.append(
                [
                    passage.locator,
                    f"{PASSAGE_LABELS[passage.classification]} — {passage.rationale}",
                    passage.reviewed_by or "",
                    passage.reviewed_at or "",
                ]
            )
        story.append(_table(rows, [24 * mm, 76 * mm, 34 * mm, 26 * mm], styles))

    _new_page(story, "6. Limitations", styles)
    for line in document.limitations:
        story.append(_rich(f"• {escape(line)}", styles["body"]))
    if not approved:
        story.append(Spacer(1, 4 * mm))
        story.append(
            _p(
                "This packet is a draft. It records what was read and what remains open. It is "
                "not an approved Compliance Build Report.",
                styles["hero"],
            )
        )
    return story


def _render_document_pdf(
    document: UploadedDocument,
    approved: bool,
) -> bytes:
    styles = _styles()
    story = _document_story(document, styles, approved)
    output = BytesIO()
    doc = SimpleDocTemplate(
        output,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        title=(
            "RegOS Sentinel Compliance Build Report"
            if approved
            else "RegOS Sentinel Draft Review Packet"
        ),
        author="RegOS Sentinel",
    )
    doc.build(
        story,
        canvasmaker=_InvariantCanvas if approved else _DraftCanvas,
        onFirstPage=_page_header_footer,
        onLaterPages=_page_header_footer,
    )
    return output.getvalue()


def render_review_packet(document: UploadedDocument) -> bytes:
    """Pre-approval export. Always watermarked, always honest about being incomplete."""
    return _render_document_pdf(document, approved=False)


def render_document_report(document: UploadedDocument) -> bytes:
    if document.state != DocumentState.APPROVED:
        raise ValueError(
            "A Compliance Build Report is available only after a person approves at least one "
            "structured requirement."
        )
    return _render_document_pdf(document, approved=True)


def render_before_after_report(state: WorkspaceState, build_id: str) -> bytes:
    build = _approved_build(state, build_id)
    styles = _styles()
    control = state.controls[0]
    findings_by_id = {item.id: item for item in state.findings}
    computations = {item.finding_id: item for item in state.deadline_computations}
    rows: List[Sequence[object]] = [
        ["", "Before compilation", "Approved compiled result"],
        ["Control", control.previous_rule_summary or "", control.rule_summary],
    ]
    for finding_id in ("F-001", "F-002"):
        finding = findings_by_id.get(finding_id)
        computation = computations.get(finding_id)
        if finding and computation:
            branch = (
                "High-severity missing-patch branch"
                if finding.caused_by_missing_patch
                else "Other VAPT observation branch"
            )
            rows.append(
                [
                    finding_id,
                    "Single three-month control",
                    f"{branch}; due date {computation.due_date}",
                ]
            )
    rows.append(
        [
            "Vendor SLA",
            f"{state.vendor_slas[0].committed_days} calendar days",
            "ADVISORY GAP only; Q15 encouragement did not create a mandatory task",
        ]
    )
    story: List[object] = [
        _p("Before / after control coverage", styles["title"]),
        _p(
            f"{state.entity_profile.legal_name} · SYNTHETIC · {build.id} / {build.run_id}",
            styles["subtitle"],
        ),
        _p(
            "A factual comparison of the synthetic broker’s recorded control and the "
            "approved compiled branches.",
            styles["body"],
        ),
        Spacer(1, 4 * mm),
        _table(rows, [28 * mm, 65 * mm, 97 * mm], styles),
        Spacer(1, 6 * mm),
        _p(DISCLAIMER, styles["small"]),
    ]
    output = BytesIO()
    doc = SimpleDocTemplate(
        output,
        pagesize=landscape(A4),
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        title="RegOS Sentinel Before and After",
        author="RegOS Sentinel",
    )
    doc.build(
        story,
        canvasmaker=_InvariantCanvas,
        onFirstPage=_page_header_footer,
        onLaterPages=_page_header_footer,
    )
    return output.getvalue()
