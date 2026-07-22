"""Bounded, session-isolated review lane for a user-supplied PDF.

This lane is deliberately narrower than the seeded CSCRF path. It performs only operations
that are true without a network or a model call: validate, fingerprint, extract text per page,
segment passages, detect normative language deterministically, and route everything uncertain
to a human. It never converts an uploaded document into an approved legal interpretation, and
it never fabricates text for a page it could not read.
"""

from __future__ import annotations

import hashlib
import re
import threading
import unicodedata
from datetime import datetime, timedelta, timezone
from enum import Enum
from io import BytesIO
from typing import Dict, List, Optional

from pydantic import Field, model_validator
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from .models import Provenance, StrictModel

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_PAGE_COUNT = 40
MAX_PASSAGES = 400
MAX_DOCUMENTS_PER_SESSION = 5
MIN_PASSAGE_CHARS = 40
PDF_MAGIC = b"%PDF-"

DISCLAIMER = "Decision support. Not legal advice. Not a SEBI determination."


class DocumentRejected(Exception):
    """The upload cannot be processed, with a reason a person can act on."""

    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message


class DocumentState(str, Enum):
    ADDED = "ADDED"
    READING = "READING_DOCUMENT"
    READY_FOR_REVIEW = "READY_FOR_REVIEW"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    READY_FOR_APPROVAL = "READY_FOR_APPROVAL"
    APPROVED = "APPROVED"
    UNREADABLE = "COULD_NOT_READ_DOCUMENT"


class PassageClass(str, Enum):
    POSSIBLE_REQUIREMENT = "POSSIBLE_REQUIREMENT"
    RECOMMENDATION = "RECOMMENDATION"
    PERMISSION = "PERMISSION"
    BACKGROUND = "BACKGROUND"
    DUPLICATE_OR_SUPERSEDED = "DUPLICATE_OR_SUPERSEDED"
    NEEDS_REVIEW = "NEEDS_REVIEW"


UNRESOLVED_CLASSES = {PassageClass.NEEDS_REVIEW}
NO_TASK_CLASSES = {
    PassageClass.RECOMMENDATION,
    PassageClass.PERMISSION,
    PassageClass.BACKGROUND,
    PassageClass.DUPLICATE_OR_SUPERSEDED,
}

# Deterministic normative-language cues. These detect the *shape* of a sentence, not its
# meaning; anything carrying more than one strength is handed to a person rather than guessed.
MANDATORY_CUES = (
    "shall",
    "must",
    "is required to",
    "are required to",
    "is mandatory",
    "are mandated",
    "shall ensure",
    "no person shall",
)
RECOMMENDATION_CUES = (
    "are encouraged to",
    "is encouraged to",
    "should consider",
    "are advised to",
    "is advised to",
    "it is recommended",
    "are recommended to",
    "should",
)
PERMISSION_CUES = (
    "may also consider",
    "may consider",
    "may opt",
    "is permitted to",
    "are permitted to",
    "at its discretion",
    "may, at",
    "may ",
)


class ExtractedPassage(StrictModel):
    id: str
    page: int = Field(ge=1)
    ordinal: int = Field(ge=1)
    locator: str
    text: str
    classification: PassageClass
    classification_provenance: Provenance
    matched_cues: List[str] = Field(default_factory=list)
    rationale: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None

    @model_validator(mode="after")
    def validate_review_pairing(self) -> ExtractedPassage:
        if self.classification_provenance == Provenance.HUMAN_POLICY and not self.reviewed_by:
            raise ValueError("A human classification requires a named reviewer.")
        if self.reviewed_by is not None and (
            self.classification_provenance != Provenance.HUMAN_POLICY
        ):
            raise ValueError("A reviewer may only be recorded on a human classification.")
        return self


class DraftRequirement(StrictModel):
    """A structured requirement a person read out of one passage and signed for."""

    id: str
    passage_id: str
    locator: str
    quote: str
    actor: str
    action: str
    obligation_object: str
    duration_value: Optional[int] = None
    duration_unit: Optional[str] = None
    trigger: Optional[str] = None
    trigger_provenance: Optional[Provenance] = None
    computable: bool
    blocked_reason: Optional[str] = None
    reviewer_name: str
    reviewer_role: str
    reason: str
    approved_at: str
    provenance: Provenance = Provenance.HUMAN_POLICY

    @model_validator(mode="after")
    def validate_computability(self) -> DraftRequirement:
        if self.computable:
            if self.trigger is None or self.trigger_provenance is None:
                raise ValueError("A computable requirement needs a trigger and its provenance.")
            if self.blocked_reason is not None:
                raise ValueError("A computable requirement cannot carry a blocked reason.")
        else:
            if self.trigger is not None or self.trigger_provenance is not None:
                raise ValueError("An uncomputable requirement cannot carry a trigger.")
            if not self.blocked_reason:
                raise ValueError("An uncomputable requirement requires a blocked reason.")
        return self


class DocumentScope(StrictModel):
    """What was and was not processed. Every number is counted from live state."""

    page_count: int = Field(ge=0)
    pages_read: int = Field(ge=0)
    pages_unreadable: List[int] = Field(default_factory=list)
    passages_reviewed: int = Field(ge=0)
    possible_requirements: int = Field(ge=0)
    recommendations_not_converted: int = Field(ge=0)
    permissions_not_converted: int = Field(ge=0)
    background: int = Field(ge=0)
    duplicates: int = Field(ge=0)
    passages_needing_review: int = Field(ge=0)


class UploadedDocument(StrictModel):
    id: str
    filename: str
    uploaded_at: str
    byte_count: int = Field(ge=1)
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    state: DocumentState
    authority_label: str
    authority_provenance: str
    extraction_mode: str
    passages: List[ExtractedPassage] = Field(default_factory=list)
    requirements: List[DraftRequirement] = Field(default_factory=list)
    scope: DocumentScope
    limitations: List[str] = Field(default_factory=list)
    disclaimer: str = DISCLAIMER


class PassageReviewRequest(StrictModel):
    classification: PassageClass
    reviewer_name: str = Field(min_length=2, max_length=80)
    reviewer_role: str = Field(default="Compliance Officer", min_length=2, max_length=80)
    rationale: str = Field(min_length=8, max_length=400)


class RequirementApprovalRequest(StrictModel):
    passage_id: str
    actor: str = Field(min_length=2, max_length=120)
    action: str = Field(min_length=2, max_length=120)
    obligation_object: str = Field(min_length=2, max_length=200)
    duration_value: Optional[int] = Field(default=None, ge=1, le=3650)
    duration_unit: Optional[str] = Field(default=None, max_length=20)
    trigger: Optional[str] = Field(default=None, max_length=200)
    reviewer_name: str = Field(min_length=2, max_length=80)
    reviewer_role: str = Field(default="Compliance Officer", min_length=2, max_length=80)
    reason: str = Field(min_length=8, max_length=500)


def _normalise(value: str) -> str:
    folded = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", folded).strip().lower()


def _matched(text: str, cues: tuple[str, ...]) -> List[str]:
    return [cue.strip() for cue in cues if cue in text]


def classify_passage(text: str, seen_hashes: Dict[str, str]) -> tuple[PassageClass, List[str], str]:
    """Classify one passage from its language alone. Ambiguity resolves to a human, not a guess."""
    normalised = _normalise(text)
    digest = hashlib.sha256(normalised.encode("utf-8")).hexdigest()
    if digest in seen_hashes:
        return (
            PassageClass.DUPLICATE_OR_SUPERSEDED,
            [],
            f"Identical wording already appeared at {seen_hashes[digest]}.",
        )

    mandatory = _matched(normalised, MANDATORY_CUES)
    recommended = _matched(normalised, RECOMMENDATION_CUES)
    permitted = _matched(normalised, PERMISSION_CUES)

    # "should" is a recommendation cue but also a substring risk; drop it when a stronger
    # recommendation cue already matched, so the reported cue list stays honest.
    if len(recommended) > 1 and "should" in recommended:
        recommended = [cue for cue in recommended if cue != "should"]

    strengths = sum(bool(group) for group in (mandatory, recommended, permitted))
    if strengths > 1:
        return (
            PassageClass.NEEDS_REVIEW,
            mandatory + recommended + permitted,
            "This passage carries more than one requirement strength, so a person decides "
            "which parts create work.",
        )
    if mandatory:
        return (
            PassageClass.POSSIBLE_REQUIREMENT,
            mandatory,
            "Requirement-shaped language was found. A person must confirm it before any work "
            "is created.",
        )
    if recommended:
        return (
            PassageClass.RECOMMENDATION,
            recommended,
            "Recommendation language. No mandatory task is created from this passage.",
        )
    if permitted:
        return (
            PassageClass.PERMISSION,
            permitted,
            "Permission language. No mandatory task is created from this passage.",
        )
    return (
        PassageClass.BACKGROUND,
        [],
        "No requirement, recommendation or permission language was found.",
    )


SENTENCE_BOUNDARY = re.compile(r"(?<=[.;])\s+(?=[\"'(\[]?[A-Z0-9])")
# Matched on a word boundary, never as a bare suffix: "providers." must not be read as the
# abbreviation "rs.", which would silently glue two separate normative sentences together.
ABBREVIATION_END = re.compile(
    r"(?:^|[\s(\[])(?:no|rs|nos|e\.g|i\.e|viz|etc|cf|vs|sec|para|fig|art|ch)\.$",
    re.IGNORECASE,
)


def _split_sentences(block: str) -> List[str]:
    """Split one text block into normative units.

    The published segmentation rule (docs/SEGMENTATION.md) splits a span again only when
    separate normative statements would need different requirement strengths. Without the
    question/answer boundaries the seeded corpus provides, the sentence is the smallest unit
    that reliably carries exactly one strength — so a sentence holding two, like the CSCRF
    Q15 answer, surfaces as one passage that a person must read.
    """
    parts = SENTENCE_BOUNDARY.split(block)
    merged: List[str] = []
    for part in parts:
        candidate = part.strip()
        if not candidate:
            continue
        if merged and ABBREVIATION_END.search(merged[-1]):
            merged[-1] = f"{merged[-1]} {candidate}"
            continue
        merged.append(candidate)
    return merged


def _segment_page(page_text: str) -> List[str]:
    """Split one page into readable passages, preserving order and dropping page furniture."""
    unwrapped = page_text.replace("\r\n", "\n").replace("\r", "\n")
    blocks = re.split(r"\n\s*\n+", unwrapped)
    passages: List[str] = []
    for block in blocks:
        joined = re.sub(r"\s*\n\s*", " ", block).strip()
        joined = re.sub(r"[ \t]{2,}", " ", joined)
        if not joined:
            continue
        for sentence in _split_sentences(joined):
            if len(sentence) < MIN_PASSAGE_CHARS:
                # Too short to carry a requirement on its own; fold it into the previous
                # unit rather than dropping text a reader can see on the page.
                if passages:
                    passages[-1] = f"{passages[-1]} {sentence}".strip()
                continue
            if re.fullmatch(r"[\divxlcIVXLC.\-—·|\s]+", sentence):
                continue
            passages.append(sentence)
    return passages


def _compute_scope(passages: List[ExtractedPassage], page_count: int, unreadable: List[int]):
    def count(target: PassageClass) -> int:
        return sum(item.classification == target for item in passages)

    return DocumentScope(
        page_count=page_count,
        pages_read=page_count - len(unreadable),
        pages_unreadable=unreadable,
        passages_reviewed=len(passages),
        possible_requirements=count(PassageClass.POSSIBLE_REQUIREMENT),
        recommendations_not_converted=count(PassageClass.RECOMMENDATION),
        permissions_not_converted=count(PassageClass.PERMISSION),
        background=count(PassageClass.BACKGROUND),
        duplicates=count(PassageClass.DUPLICATE_OR_SUPERSEDED),
        passages_needing_review=count(PassageClass.NEEDS_REVIEW),
    )


def _document_state(document_passages: List[ExtractedPassage], unreadable_all: bool):
    if unreadable_all:
        return DocumentState.UNREADABLE
    if not document_passages:
        return DocumentState.UNREADABLE
    if any(item.classification in UNRESOLVED_CLASSES for item in document_passages):
        return DocumentState.NEEDS_REVIEW
    return DocumentState.READY_FOR_REVIEW


def _limitations(
    scope: DocumentScope,
    filename: str,
    truncated: bool,
) -> List[str]:
    lines = [
        "This document was supplied by the person using this demo. It has not been validated "
        "by SEBI and carries no official status here.",
        "Passages were classified from their language alone, by a fixed rule. No model was "
        "called and no legal interpretation was performed.",
        "No mandatory work is created from any passage until a named person approves a "
        "structured requirement.",
    ]
    if scope.pages_unreadable:
        pages = ", ".join(str(page) for page in scope.pages_unreadable)
        lines.append(
            f"No text could be extracted from page(s) {pages}. Those pages are likely scanned "
            "images; this prototype does not perform OCR, so they were not reviewed."
        )
    if truncated:
        lines.append(
            f"Only the first {MAX_PASSAGES} passages of {filename} were reviewed. The remainder "
            "of the document was not processed."
        )
    return lines


def build_uploaded_document(
    *,
    document_id: str,
    filename: str,
    payload: bytes,
    uploaded_at: str,
    authority_label: str,
) -> UploadedDocument:
    """Validate, fingerprint and deterministically read one uploaded PDF."""
    if not payload:
        raise DocumentRejected(422, "That file is empty. Choose a PDF that contains pages.")
    if len(payload) > MAX_UPLOAD_BYTES:
        raise DocumentRejected(
            413,
            f"That file is larger than the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB limit for this "
            "demo. Choose a smaller PDF or an extract of it.",
        )
    if not payload.startswith(PDF_MAGIC):
        raise DocumentRejected(
            415,
            "That file is not a PDF. This lane reads PDF documents only.",
        )

    digest = hashlib.sha256(payload).hexdigest()
    try:
        reader = PdfReader(BytesIO(payload))
        if reader.is_encrypted:
            raise DocumentRejected(
                422,
                "That PDF is password-protected. Remove the protection and upload it again.",
            )
        page_count = len(reader.pages)
    except DocumentRejected:
        raise
    except (PdfReadError, ValueError, OSError, KeyError) as error:
        raise DocumentRejected(
            422,
            "We could not read that PDF. The file may be damaged or incomplete.",
        ) from error

    if page_count < 1:
        raise DocumentRejected(422, "That PDF has no pages.")
    if page_count > MAX_PAGE_COUNT:
        raise DocumentRejected(
            413,
            f"That PDF has {page_count} pages. This demo reads up to {MAX_PAGE_COUNT} pages. "
            "Upload an extract instead.",
        )

    passages: List[ExtractedPassage] = []
    unreadable: List[int] = []
    seen_hashes: Dict[str, str] = {}
    truncated = False

    for index, page in enumerate(reader.pages, start=1):
        try:
            page_text = page.extract_text() or ""
        except Exception:  # noqa: BLE001 - a single bad page must not fail the whole document
            page_text = ""
        segments = _segment_page(page_text)
        if not segments:
            unreadable.append(index)
            continue
        for ordinal, text in enumerate(segments, start=1):
            if len(passages) >= MAX_PASSAGES:
                truncated = True
                break
            locator = f"Page {index} · passage {ordinal}"
            classification, cues, rationale = classify_passage(text, seen_hashes)
            digest_key = hashlib.sha256(_normalise(text).encode("utf-8")).hexdigest()
            seen_hashes.setdefault(digest_key, locator)
            passages.append(
                ExtractedPassage(
                    id=f"{document_id}-P{index:03d}-{ordinal:02d}",
                    page=index,
                    ordinal=ordinal,
                    locator=locator,
                    text=text,
                    classification=classification,
                    classification_provenance=Provenance.DETERMINISTIC,
                    matched_cues=cues,
                    rationale=rationale,
                )
            )
        if truncated:
            break

    scope = _compute_scope(passages, page_count, unreadable)
    state = _document_state(passages, unreadable_all=len(unreadable) == page_count)
    return UploadedDocument(
        id=document_id,
        filename=filename,
        uploaded_at=uploaded_at,
        byte_count=len(payload),
        sha256=digest,
        state=state,
        authority_label=authority_label,
        authority_provenance="USER_PROVIDED_METADATA_NOT_VERIFIED",
        extraction_mode="DETERMINISTIC_TEXT_EXTRACTION_NO_MODEL_CALL",
        passages=passages,
        requirements=[],
        scope=scope,
        limitations=_limitations(scope, filename, truncated),
    )


def apply_passage_review(
    document: UploadedDocument,
    passage_id: str,
    request: PassageReviewRequest,
    reviewed_at: str,
) -> UploadedDocument:
    passage = next((item for item in document.passages if item.id == passage_id), None)
    if passage is None:
        raise DocumentRejected(404, "That passage is not part of this document.")
    passage.classification = request.classification
    passage.classification_provenance = Provenance.HUMAN_POLICY
    passage.rationale = request.rationale
    passage.reviewed_by = f"{request.reviewer_name} · {request.reviewer_role}"
    passage.reviewed_at = reviewed_at
    passage.matched_cues = []
    return _recompute(document)


def approve_requirement(
    document: UploadedDocument,
    request: RequirementApprovalRequest,
    approved_at: str,
) -> UploadedDocument:
    passage = next((item for item in document.passages if item.id == request.passage_id), None)
    if passage is None:
        raise DocumentRejected(404, "That passage is not part of this document.")
    if passage.classification in NO_TASK_CLASSES:
        raise DocumentRejected(
            409,
            "This passage is recorded as guidance rather than a requirement, so it cannot "
            "create mandatory work. Reclassify it first if that reading is wrong.",
        )
    if passage.classification == PassageClass.NEEDS_REVIEW:
        raise DocumentRejected(
            409,
            "Decide how this passage should be read before approving a requirement from it.",
        )
    if any(item.passage_id == request.passage_id for item in document.requirements):
        raise DocumentRejected(409, "This passage already has an approved requirement.")

    has_duration = request.duration_value is not None and bool(request.duration_unit)
    trigger = (request.trigger or "").strip() or None
    computable = bool(has_duration and trigger)
    blocked_reason: Optional[str] = None
    if not computable:
        if has_duration and trigger is None:
            blocked_reason = (
                "A duration was recorded but no event that starts it. No due date was "
                "calculated."
            )
        elif trigger is not None and not has_duration:
            blocked_reason = (
                "A starting event was recorded but no duration. No due date was calculated."
            )
        else:
            blocked_reason = "No deadline was recorded for this requirement."
        trigger = None

    document.requirements.append(
        DraftRequirement(
            id=f"{document.id}-REQ-{len(document.requirements) + 1:02d}",
            passage_id=passage.id,
            locator=passage.locator,
            quote=passage.text[:600],
            actor=request.actor.strip(),
            action=request.action.strip(),
            obligation_object=request.obligation_object.strip(),
            duration_value=request.duration_value if has_duration else None,
            duration_unit=request.duration_unit if has_duration else None,
            trigger=trigger,
            trigger_provenance=Provenance.HUMAN_POLICY if computable else None,
            computable=computable,
            blocked_reason=blocked_reason,
            reviewer_name=request.reviewer_name.strip(),
            reviewer_role=request.reviewer_role.strip(),
            reason=request.reason.strip(),
            approved_at=approved_at,
        )
    )
    return _recompute(document)


def _recompute(document: UploadedDocument) -> UploadedDocument:
    document.scope = _compute_scope(
        document.passages,
        document.scope.page_count,
        document.scope.pages_unreadable,
    )
    unresolved = any(item.classification in UNRESOLVED_CLASSES for item in document.passages)
    if unresolved:
        document.state = DocumentState.NEEDS_REVIEW
    elif document.requirements:
        document.state = DocumentState.APPROVED
    else:
        document.state = DocumentState.READY_FOR_APPROVAL
    return document


class DocumentWorkspace:
    """Uploaded documents for exactly one browser session. Never shared, never persisted."""

    def __init__(self, retention_minutes: int = 60) -> None:
        self._lock = threading.RLock()
        self._documents: Dict[str, UploadedDocument] = {}
        self._sequence = 0
        self._retention = timedelta(minutes=retention_minutes)

    @staticmethod
    def _copy(document: UploadedDocument) -> UploadedDocument:
        return UploadedDocument.model_validate(document.model_dump(mode="json"))

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")

    def list(self) -> List[UploadedDocument]:
        with self._lock:
            return [self._copy(item) for item in self._documents.values()]

    def get(self, document_id: str) -> UploadedDocument:
        with self._lock:
            document = self._documents.get(document_id)
            if document is None:
                raise DocumentRejected(
                    404,
                    "That document is not in this session. Uploads are private to one browser "
                    "session and are cleared when it ends.",
                )
            return self._copy(document)

    def add(self, filename: str, payload: bytes, authority_label: str) -> UploadedDocument:
        with self._lock:
            if len(self._documents) >= MAX_DOCUMENTS_PER_SESSION:
                raise DocumentRejected(
                    409,
                    f"This session already holds {MAX_DOCUMENTS_PER_SESSION} documents. Remove "
                    "one before adding another.",
                )
            self._sequence += 1
            document = build_uploaded_document(
                document_id=f"DOC-{self._sequence:03d}",
                filename=filename,
                payload=payload,
                uploaded_at=self._now(),
                authority_label=authority_label,
            )
            self._documents[document.id] = document
            return self._copy(document)

    def update(self, document_id: str, operation) -> UploadedDocument:
        with self._lock:
            document = self._documents.get(document_id)
            if document is None:
                raise DocumentRejected(404, "That document is not in this session.")
            working = self._copy(document)
            updated = operation(working, self._now())
            self._documents[document_id] = self._copy(updated)
            return self._copy(updated)

    def remove(self, document_id: str) -> None:
        with self._lock:
            if self._documents.pop(document_id, None) is None:
                raise DocumentRejected(404, "That document is not in this session.")

    def clear(self) -> None:
        with self._lock:
            self._documents.clear()
