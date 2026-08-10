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

#: Rasterisation density for the local engine.
#:
#: 150, not 200, and it was 200 for a good reason — that is where tesseract stops
#: losing small print. It came down because the hosted API could not afford it.
#: Memory here scales with the square of the density: an A4 page is 11.6 MB of
#: pixels at 200 DPI and 6.5 MB at 150, and tesseract's own working set is a
#: multiple of whatever it is handed. On the 512 MB instance the API runs on,
#: 200 DPI was enough to kill the process mid-request — SEBI's 205-page CSCRF
#: framework has exactly one page without a text layer, and that one page made
#: the whole document impossible to upload in production while every local run
#: and all 28 documents in the corpus smoke passed.
#:
#: `REGOS_OCR_DPI` puts it back up where there is memory to spare.
OCR_RENDER_DPI = max(72, int(os.environ.get("REGOS_OCR_DPI", "150")))
OCR_RENDER_SCALE = OCR_RENDER_DPI / 72

#: Container memory that must remain free before a page is rasterised at all.
#:
#: A page render plus a tesseract process is a few hundred megabytes in the worst
#: case, and if the box cannot afford it the kernel does not fail the request — it
#: kills the process, which drops every other session in flight and returns a bare
#: 502 with nothing in the log. Refusing to read one page is a far smaller harm
#: than that, and unlike the kill it can be said out loud: the page is reported
#: unreadable and the document's limitations say machine reading was not attempted.
OCR_MEMORY_HEADROOM_BYTES = int(
    os.environ.get("REGOS_OCR_HEADROOM_BYTES", str(280 * 1024 * 1024))
)

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


def _cgroup_value(*paths: str) -> Optional[int]:
    """One integer from a cgroup file, or None when it is absent or not a number."""
    for path in paths:
        try:
            raw = open(path).read().strip()
        except OSError:
            continue
        if raw in {"max", ""}:
            return None
        try:
            return int(raw)
        except ValueError:
            continue
    return None


def free_container_memory() -> Optional[int]:
    """Bytes of the container's memory limit not currently in use.

    None when there is no limit to read — a developer's laptop, or any host that
    does not put the process in a memory cgroup. The caller then behaves exactly
    as it did before this existed, because a guard that guesses a limit is worse
    than no guard: it would refuse to read pages on machines with memory to spare.
    """
    limit = _cgroup_value(
        "/sys/fs/cgroup/memory.max",  # cgroup v2
        "/sys/fs/cgroup/memory/memory.limit_in_bytes",  # cgroup v1
    )
    if limit is None or limit > 1 << 60:  # an "unlimited" sentinel
        return None
    used = _cgroup_value(
        "/sys/fs/cgroup/memory.current",
        "/sys/fs/cgroup/memory/memory.usage_in_bytes",
    )
    if used is None:
        return None
    return max(0, limit - used)


def machine_reading_affordable() -> bool:
    """Whether this box can spare the memory one page render needs."""
    free = free_container_memory()
    return free is None or free >= OCR_MEMORY_HEADROOM_BYTES


def local_ocr_available() -> bool:
    """Whether the in-process engine can run: binary, rasteriser, and memory to spare."""
    if shutil.which(OCR_LOCAL_BINARY) is None:
        return False
    try:
        import pypdfium2  # noqa: F401 — availability probe only
    except ImportError:
        return False
    # Asked last, because it is the only one of the three that can change between
    # one upload and the next.
    return machine_reading_affordable()


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
# Legibility — is what came back words, or is it a picture of a diagram?
# --------------------------------------------------------------------------- #

#: The share of whitespace-separated tokens that have to look like words before a
#: machine read is passed on as text a person should read.
#:
#: MEASURED, on SEBI's own 205-page CSCRF framework, not guessed:
#:
#:     OCR of page 32, a flowchart .............. 0.33
#:     OCR of page 116, ordinary prose .......... 0.78
#:     text layer of pages 61 / 90 / 116 / 118 .. 0.74 – 0.78
#:
#: The engine is accurate: on a page of prose its transcript scores exactly what
#: the document's own text layer scores. What it cannot do is decline. Handed a
#: diagram it returns "S=3]l osone z 3 Incident Recovery Plan a e ||2228 Execution",
#: and every one of those fragments used to become a passage in a compliance
#: review — text presented to a regulator as something read off their circular.
#:
#: 0.55 sits with margin either side of the two populations. Below it the page is
#: reported unreadable, which is what it is, and the limitation says the read was
#: attempted and came back illegible — a different fact from a blank page, and one
#: that tells the reader the page is worth opening by hand.
OCR_MIN_LEGIBILITY = float(os.environ.get("REGOS_OCR_MIN_LEGIBILITY", "0.55"))

#: A page too short to judge is not tested; the ratio is meaningless on a caption.
OCR_LEGIBILITY_MIN_TOKENS = 25


def legibility(text: str) -> float:
    """The share of tokens that look like words. 0.0 for empty text."""
    tokens = [token for token in text.split() if token]
    if not tokens:
        return 0.0
    wordish = [
        token
        for token in tokens
        if len(token) >= 3 and sum(char.isalpha() for char in token) / len(token) >= 0.8
    ]
    return len(wordish) / len(tokens)


def reads_as_prose(text: str) -> bool:
    """Whether a machine read is worth showing a person as the page's wording."""
    if len(text.split()) < OCR_LEGIBILITY_MIN_TOKENS:
        return bool(text.strip())
    return legibility(text) >= OCR_MIN_LEGIBILITY


# --------------------------------------------------------------------------- #
# The lane
# --------------------------------------------------------------------------- #


def ocr_pages(
    payload: bytes,
    page_indexes: List[int],
    _illegible: Optional[List[int]] = None,
) -> Dict[int, str]:
    """Machine-read the named pages of an uploaded PDF. 1-based page indexes.

    Returns only pages for which an engine returned text a person could read — a
    page that failed, or that came back as noise, is simply absent from the result
    and the caller reports it unreadable. Any failure at all degrades to returning
    what was recovered so far; this function never raises into the upload path.

    `_illegible` is filled in by `ocr_pages_detailed`; callers wanting that detail
    should use that instead of passing it themselves.
    """
    remote = remote_ocr_available()
    local = local_ocr_available()
    illegible = _illegible if _illegible is not None else []
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
            if not text.strip():
                continue
            if not reads_as_prose(text):
                # The engine read the page and what came back is not words. Passing
                # it on would put "S=3]l osone z 3 ||2228" into a compliance review
                # as wording extracted from a SEBI circular. The page stays
                # unreadable, which is the truthful answer, and `illegible_pages`
                # lets the caller say the read was attempted rather than absent.
                illegible.append(index)
                continue
            recovered[index] = text
    except Exception:  # noqa: BLE001 — OCR must never take the upload down with it
        return recovered
    return recovered


def ocr_pages_detailed(
    payload: bytes, page_indexes: List[int]
) -> tuple[Dict[int, str], List[int]]:
    """`ocr_pages`, plus the pages whose read came back illegible rather than empty."""
    pages: List[int] = []
    recovered = ocr_pages(payload, page_indexes, _illegible=pages)
    return recovered, sorted(pages)
