from __future__ import annotations

import hashlib
import re
import unicodedata
from datetime import datetime, timezone
from io import BytesIO
from typing import Iterable

import httpx
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from .models import LiveSourceVerificationReceipt, SourceSpan
from .seed import DOCUMENT_ID, SOURCE_URL

EXPECTED_FULL_PDF_SHA256 = "7a576bb94de8f219559286fd9881e3db973540602c96f73b82661cc2947f4917"

SPAN_ANCHORS: dict[str, tuple[str, ...]] = {
    "FAQ-PREFACE-4": (
        "neither be regarded as an interpretation of CSCRF",
        "binding opinion",
        "Securities and Exchange Board of India",
    ),
    "FAQ-Q14": ("periodicity of VAPT and cyber audit for QSBs shall be half-yearly",),
    "FAQ-Q15": (
        "within three (3) months of submission of VAPT report",
        "encouraged to include VAPT finding closure related timelines",
    ),
    "FAQ-Q16": ("reporting format shall be as per CSCRF Annexure-A",),
    "FAQ-Q17-A": (
        "non-implementation of patches",
        "patch management timelines 1 week",
    ),
    "FAQ-Q17-B": (
        "other vulnerabilities observations apart from implementation of patches",
        "VAPT observation closure timelines 3 months",
    ),
    "FAQ-Q20": ("periodicities mentioned in the CSCRF are based on financial year",),
    "FAQ-Q24": (
        "registered under more than one category of REs",
        "provision of highest category",
    ),
    "FAQ-Q25": (
        "registered with SEBI in the capacity of intermediary",
        "provision may continue to apply",
    ),
}


class SourceVerificationUnavailable(RuntimeError):
    pass


def _normalize(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).casefold()
    return re.sub(r"[^a-z0-9]+", "", normalized)


def match_scoped_spans(text: str, spans: Iterable[SourceSpan]) -> tuple[list[str], list[str]]:
    normalized_document = _normalize(text)
    matched: list[str] = []
    missing: list[str] = []
    for span in spans:
        anchors = SPAN_ANCHORS.get(span.id)
        if not anchors:
            continue
        if all(_normalize(anchor) in normalized_document for anchor in anchors):
            matched.append(span.id)
        else:
            missing.append(span.id)
    return matched, missing


def verify_official_source(spans: Iterable[SourceSpan]) -> LiveSourceVerificationReceipt:
    scoped_spans = [span for span in spans if span.document_id == DOCUMENT_ID]
    try:
        with httpx.Client(
            follow_redirects=True,
            timeout=httpx.Timeout(25.0),
            headers={"User-Agent": "Mozilla/5.0 RegOS-Sentinel/1.0 (+source-verifier)"},
        ) as client:
            response = client.get(SOURCE_URL)
            response.raise_for_status()

        content = response.content
        if not content.startswith(b"%PDF"):
            raise SourceVerificationUnavailable("The official source response was not a PDF.")
        reader = PdfReader(BytesIO(content))
        extracted_text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except (httpx.HTTPError, PdfReadError, OSError) as error:
        raise SourceVerificationUnavailable(str(error)) from error

    matched, missing = match_scoped_spans(extracted_text, scoped_spans)
    document_sha256 = hashlib.sha256(content).hexdigest()
    hash_matches = document_sha256 == EXPECTED_FULL_PDF_SHA256
    if missing:
        status = "PARTIAL_MATCH_REVIEW_REQUIRED"
    elif not hash_matches:
        status = "SOURCE_CHANGED_REVIEW_REQUIRED"
    else:
        status = "LIVE_SOURCE_VERIFIED"

    return LiveSourceVerificationReceipt(
        status=status,
        source_url=SOURCE_URL,
        checked_at=datetime.now(timezone.utc).isoformat(),
        http_status=response.status_code,
        content_type=response.headers.get("content-type", "unknown").split(";", 1)[0],
        document_sha256=document_sha256,
        expected_document_sha256=EXPECTED_FULL_PDF_SHA256,
        hash_matches_expected=hash_matches,
        hash_scope="SHA-256 OF THE FULL PDF BYTES FETCHED FROM THE OFFICIAL SEBI URL",
        byte_count=len(content),
        page_count=len(reader.pages),
        checked_span_count=len(matched) + len(missing),
        matched_span_ids=matched,
        missing_span_ids=missing,
        build_input="HUMAN_VERIFIED_PINNED_EXCERPTS_MATCHED_AGAINST_LIVE_PDF",
        note=(
            "The live fetch verifies source identity and the selected demo passages. "
            "The compliance build consumes the reviewed pinned excerpts, not "
            "unconstrained raw PDF text."
        ),
    )
