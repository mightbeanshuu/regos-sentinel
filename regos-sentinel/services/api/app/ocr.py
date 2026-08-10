"""Machine-reading (OCR) for scanned pages — two engines, one honesty contract.

This lane exists for exactly one case: a page of an uploaded PDF that carries no text
layer at all. Two engines can read such a page:

* **Local (tesseract).** The page is rasterised in-process (pypdfium2) and piped to
  the ``tesseract`` binary over stdin/stdout. No bytes leave the machine, nothing is
  written to disk, and it works with ``REGOS_OFFLINE=1`` — an in-process read is not
  an outbound call, so the sealed-engine promise holds. Available whenever the binary
  is installed (the API container installs it), so machine reading is on by default.
* **Remote (ocr.space).** Used only when ``OCR_SPACE_API_KEY`` is present in the
  environment *and* the deployment is not offline. The key is read at call time and
  never written to any file, log, or payload this service produces.

Per page, the remote engine (when allowed) is tried first; if it returns nothing or a
fragment shorter than ``MIN_REMOTE_CHARS``, the local engine reads the same page and
the fuller transcript wins. The rules that keep the lane honest are unchanged:

* **Failure returns nothing.** A timeout, a refusal or a malformed response yields no
  text for that page rather than fabricated text. The caller records the attempt and
  the page stays honestly unreadable.
* **Everything recovered is labelled.** Text that came back from either engine is
  merged with a distinct provenance so no reader can mistake machine-read text for a
  text layer the document actually carried.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import threading
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from typing import Dict, List, Optional

import httpx
from pypdf import PdfReader, PdfWriter

from .documents import MAX_PAGE_COUNT

OCR_ENDPOINT = "https://api.ocr.space/parse/image"

#: ocr.space engine 2 handles mixed print quality better than engine 1 on the scans
#: this demo actually meets (photocopied circulars).
OCR_ENGINE = "2"

OCR_TIMEOUT_SECONDS = 20.0

#: The local engine binary. Installed in the API container; optional elsewhere.
OCR_LOCAL_BINARY = "tesseract"

OCR_LOCAL_TIMEOUT_SECONDS = 25.0

#: Rasterisation density for the local engine. ~200 DPI is the point where tesseract
#: stops losing small print without the bitmap getting slow to move around.
OCR_RENDER_SCALE = 200 / 72

#: A remote result shorter than this is treated as an incomplete read of the page —
#: the local engine then reads the same page and the fuller transcript is kept.
MIN_REMOTE_CHARS = 32

#: The upload lane now accepts Master-Circular-scale documents (hundreds of pages),
#: but machine reading is synchronous with the upload request — at a few seconds per
#: scanned page, an unbounded read would outlive any request. Sixty pages through the
#: worker pool covers every scanned circular we have measured while staying inside a
#: live request's patience; pages beyond the bound are honestly reported unreadable
#: and the document's limitations name them.
MAX_OCR_PAGES_PER_DOCUMENT = min(60, MAX_PAGE_COUNT)

#: Concurrent page reads. The slow half (the tesseract subprocess, or the remote
#: call) parallelises safely; the pdfium rasteriser is serialised separately below.
#:
#: Two, not four, and the reason is a production-only failure. The hosted API runs
#: on a 512 MB instance. A single A4 page at this density is an 11.6 MB PPM, and
#: each concurrent read holds that plus a tesseract subprocess of its own — so at
#: four workers a scanned circular could ask for more memory than the box has, and
#: an out-of-memory kill leaves no traceback to find. It looks exactly like a 502
#: from a healthy service, which is how SEBI's own 205-page CSCRF framework failed
#: in production while passing every local run.
#:
#: `REGOS_OCR_WORKERS` raises it where there is memory to spare.
OCR_WORKERS = max(1, int(os.environ.get("REGOS_OCR_WORKERS", "2")))

#: PDFium is not thread-safe; every rasterisation goes through this lock. The
#: tesseract subprocesses — where the time actually goes — still run in parallel.
_PDFIUM_LOCK = threading.Lock()


def remote_ocr_available() -> bool:
    """Whether the ocr.space call may happen: key present and not sealed offline."""
    if os.environ.get("REGOS_OFFLINE") == "1":
        return False
    return bool(os.environ.get("OCR_SPACE_API_KEY"))


def local_ocr_available() -> bool:
    """Whether the in-process engine can run: binary on PATH and a rasteriser importable."""
    if shutil.which(OCR_LOCAL_BINARY) is None:
        return False
    try:
        import pypdfium2  # noqa: F401 — availability probe only
    except ImportError:
        return False
    return True


def ocr_available() -> bool:
    """Whether machine reading may run at all, by either engine."""
    return local_ocr_available() or remote_ocr_available()


# --------------------------------------------------------------------------- #
# Remote engine (ocr.space)
# --------------------------------------------------------------------------- #


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


def _remote_page(payload: bytes, index: int) -> str:
    """One page via ocr.space. Empty on any failure — this never raises.

    Builds its own reader so concurrent page reads never share pypdf state.
    """
    api_key = os.environ.get("OCR_SPACE_API_KEY")
    if not api_key:
        return ""
    try:
        page_bytes = _single_page_pdf(PdfReader(BytesIO(payload)), index)
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
        return _parse_response(response.json())
    except (httpx.HTTPError, ValueError, KeyError):
        return ""


# --------------------------------------------------------------------------- #
# Local engine (pypdfium2 → PPM → tesseract, all in memory)
# --------------------------------------------------------------------------- #


def _page_ppm(payload: bytes, index: int) -> Optional[bytearray]:
    """One page rasterised to a P6 PPM, in memory. None on any failure.

    PPM is built by hand so the deployment needs no imaging stack — the header plus
    the renderer's own RGB rows is the whole format.

    Written into one preallocated buffer, which is not a micro-optimisation. The
    first version copied the whole bitmap out of pdfium, then built a list of
    per-row `bytes`, then joined it: four full-size copies of an image that is
    15.5 MB before the alpha channel comes off. Measured, rasterising a single
    A4 page moved process RSS by 80 MB. On the 512 MB instance the API is hosted
    on, that is the difference between a document that uploads and an
    out-of-memory kill — and an OOM kill produces no traceback, so it reaches the
    reader as a bare 502 from a service whose logs look healthy.
    """
    try:
        import pypdfium2 as pdfium

        with _PDFIUM_LOCK:
            document = pdfium.PdfDocument(payload)
            try:
                page = document[index - 1]
                bitmap = page.render(
                    scale=OCR_RENDER_SCALE, rev_byteorder=True, prefer_bgrx=False
                )
                width, height, stride = bitmap.width, bitmap.height, bitmap.stride
                channels = bitmap.n_channels
                header = b"P6\n%d %d\n255\n" % (width, height)
                out_row = width * 3
                out = bytearray(len(header) + out_row * height)
                out[: len(header)] = header
                # A memoryview over pdfium's own buffer: read in place, no copy.
                # It stays valid only while the document is open, so the whole
                # transcription happens inside this block.
                source = memoryview(bitmap.buffer)
                cursor = len(header)
                row_bytes = width * channels
                for y in range(height):
                    row = source[y * stride : y * stride + row_bytes]
                    if channels == 4:
                        opaque = bytearray(row)
                        del opaque[3::4]
                        out[cursor : cursor + out_row] = opaque
                    else:
                        out[cursor : cursor + out_row] = row
                    cursor += out_row
                source.release()
            finally:
                document.close()
        # Returned as the bytearray it was built in. `bytes(out)` here would be a
        # final 11.6 MB copy of a buffer whose only consumer is a subprocess that
        # accepts any bytes-like object.
        return out
    except Exception:  # noqa: BLE001 — a page that cannot render stays unreadable
        return None


def _tesseract(ppm: bytes | bytearray) -> str:
    """Run the local binary over one rasterised page. Empty on any failure."""
    binary = shutil.which(OCR_LOCAL_BINARY)
    if binary is None:
        return ""
    try:
        result = subprocess.run(
            [binary, "stdin", "stdout", "-l", "eng", "--psm", "3"],
            input=ppm,
            capture_output=True,
            timeout=OCR_LOCAL_TIMEOUT_SECONDS,
        )
        if result.returncode != 0:
            return ""
        return result.stdout.decode("utf-8", "replace").strip()
    except (OSError, subprocess.SubprocessError):
        return ""


def _local_page(payload: bytes, index: int) -> str:
    """One page via the local engine. Empty on any failure — this never raises."""
    if not local_ocr_available():
        return ""
    ppm = _page_ppm(payload, index)
    if ppm is None:
        return ""
    return _tesseract(ppm)


# --------------------------------------------------------------------------- #
# The lane
# --------------------------------------------------------------------------- #


def ocr_pages(payload: bytes, page_indexes: List[int]) -> Dict[int, str]:
    """Machine-read the named pages of an uploaded PDF. 1-based page indexes.

    Returns only pages for which an engine returned text — a page that failed is
    simply absent from the result, and the caller reports it unreadable. Any failure
    at all degrades to returning what was recovered so far; this function never raises
    into the upload path.
    """
    remote = remote_ocr_available()
    local = local_ocr_available()
    if not page_indexes or not (remote or local):
        return {}
    recovered: Dict[int, str] = {}
    try:
        page_count = len(PdfReader(BytesIO(payload)).pages)
        bounded = [
            index
            for index in sorted(page_indexes)[:MAX_OCR_PAGES_PER_DOCUMENT]
            if 1 <= index <= page_count
        ]

        def read(index: int) -> tuple[int, str]:
            text = _remote_page(payload, index) if remote else ""
            # An empty or fragmentary remote read is not the last word — the local
            # engine reads the same page and the fuller transcript wins.
            if local and len(text.strip()) < MIN_REMOTE_CHARS:
                local_text = _local_page(payload, index)
                if len(local_text.strip()) > len(text.strip()):
                    text = local_text
            return index, text

        if len(bounded) <= 1:
            results = [read(index) for index in bounded]
        else:
            with ThreadPoolExecutor(max_workers=OCR_WORKERS) as pool:
                results = list(pool.map(read, bounded))
        for index, text in results:
            if text.strip():
                recovered[index] = text
    except Exception:  # noqa: BLE001 — OCR must never take the upload down with it
        return recovered
    return recovered
