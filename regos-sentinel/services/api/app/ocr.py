"""Machine-reading (OCR) for scanned pages, via the ocr.space API.

This lane exists for exactly one case: a page of an uploaded PDF that carries no text
layer at all. Nothing else is ever sent anywhere. The rules that keep it honest:

* **Off by default.** OCR runs only when ``OCR_SPACE_API_KEY`` is present in the
  environment and ``REGOS_OFFLINE`` is not set. Without a key the upload lane behaves
  exactly as it always has — the page is reported unreadable, never guessed at.
* **The key lives in the environment only.** It is read at call time and never written
  to any file, log, or payload this service produces.
* **Failure returns nothing.** A timeout, a refusal or a malformed response yields no
  text for that page rather than fabricated text. The caller records the attempt and
  the page stays honestly unreadable.
* **Everything recovered is labelled.** Text that came back from OCR is merged with a
  distinct provenance so no reader can mistake machine-read text for a text layer the
  document actually carried.
"""

from __future__ import annotations

import os
from io import BytesIO
from typing import Dict, List

import httpx
from pypdf import PdfReader, PdfWriter

OCR_ENDPOINT = "https://api.ocr.space/parse/image"

#: ocr.space engine 2 handles mixed print quality better than engine 1 on the scans
#: this demo actually meets (photocopied circulars).
OCR_ENGINE = "2"

OCR_TIMEOUT_SECONDS = 20.0

#: Upper bound on pages machine-read per upload. A fully scanned long document would
#: otherwise hold the request open for minutes; pages beyond the bound stay honestly
#: unreadable and the document's limitations say so.
MAX_OCR_PAGES_PER_DOCUMENT = 8


def ocr_available() -> bool:
    """Whether machine reading may run at all. Absent key or offline mode disables it."""
    if os.environ.get("REGOS_OFFLINE") == "1":
        return False
    return bool(os.environ.get("OCR_SPACE_API_KEY"))


def _single_page_pdf(reader: PdfReader, page_index: int) -> bytes:
    """One page of the uploaded document, as its own PDF, for a page-scoped OCR call."""
    writer = PdfWriter()
    writer.add_page(reader.pages[page_index - 1])
    buffer = BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


def _parse_response(payload: dict) -> str:
    """The parsed text of one OCR response, or empty when the service reports failure."""
    if payload.get("IsErroredOnProcessing"):
        return ""
    parsed = payload.get("ParsedResults") or []
    return "\n".join(str(item.get("ParsedText") or "") for item in parsed).strip()


def ocr_pages(payload: bytes, page_indexes: List[int]) -> Dict[int, str]:
    """Machine-read the named pages of an uploaded PDF. 1-based page indexes.

    Returns only pages for which the service returned text — a page that failed is
    simply absent from the result, and the caller reports it unreadable. Any failure
    at all degrades to returning what was recovered so far; this function never raises
    into the upload path.
    """
    api_key = os.environ.get("OCR_SPACE_API_KEY")
    if not api_key or not ocr_available() or not page_indexes:
        return {}
    recovered: Dict[int, str] = {}
    try:
        reader = PdfReader(BytesIO(payload))
        for index in sorted(page_indexes)[:MAX_OCR_PAGES_PER_DOCUMENT]:
            if index < 1 or index > len(reader.pages):
                continue
            try:
                page_bytes = _single_page_pdf(reader, index)
                response = httpx.post(
                    OCR_ENDPOINT,
                    headers={"apikey": api_key},
                    data={
                        "OCREngine": OCR_ENGINE,
                        "filetype": "PDF",
                        "scale": "true",
                        "isOverlayRequired": "false",
                    },
                    files={"file": (f"page-{index}.pdf", page_bytes, "application/pdf")},
                    timeout=OCR_TIMEOUT_SECONDS,
                )
                response.raise_for_status()
                text = _parse_response(response.json())
                if text:
                    recovered[index] = text
            except (httpx.HTTPError, ValueError, KeyError):
                # This page stays unreadable. No text is invented for it.
                continue
    except Exception:  # noqa: BLE001 — OCR must never take the upload down with it
        return recovered
    return recovered
