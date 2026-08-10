"""Drive every real SEBI PDF on disk through the whole document lane.

The unit tests build their fixtures with ReportLab, so every PDF they see has a
clean text layer, one font, no tables and no Hindi. Real SEBI circulars have all
four, and every defect this script exists to catch was invisible until a real one
was uploaded: modal verbs split across a space, numbered lists that lost the space
after the full stop, form checkboxes that no base PDF font can draw, bilingual
front matter filed as "background", and a listing section that printed 60 rows of
1,417 without saying so.

Usage (from services/api):

    REGOS_OFFLINE=1 .venv/bin/python scripts/corpus_smoke.py [directory]

Default directory is ../../../real-pdfs relative to the repo. It is not tracked —
if it is missing the script says so and exits 0, because a corpus of real
regulator PDFs is not something to commit. Exit code is 1 when a probe fires.
"""

from __future__ import annotations

import glob
import json
import os
import re
import sys
import time
import traceback
from io import BytesIO
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("REGOS_OFFLINE", "1")

from fastapi.testclient import TestClient  # noqa: E402
from pypdf import PdfReader  # noqa: E402

from app.main import create_app  # noqa: E402
from app.report import _printable  # noqa: E402

SECRET = "corpus-smoke-secret-that-is-longer-than-thirty-two-bytes"
DEFAULT_CORPUS = Path(__file__).resolve().parents[4] / "real-pdfs"

#: A modal verb the PDF text layer broke across a space. If one of these is still
#: filed as anything but a duty, a mandatory obligation has been silently lost.
SPLIT_DEONTIC = re.compile(r"\b(s\s?h\s?a\s?l\s?l|m\s?u\s?s\s?t|s\s?h\s?o\s?u\s?l\s?d)\b", re.I)
INTACT = re.compile(r"\b(shall|must|should)\b", re.I)
#: Where a repaired modal verb is allowed to land. RECOMMENDATION belongs here:
#: "should" is guidance, so a rejoined "s hould" filed as a recommendation is the
#: repair working, not a duty being lost.
DUTY_CLASSES = {"POSSIBLE_REQUIREMENT", "NEEDS_REVIEW", "RECOMMENDATION", "PERMISSION"}
SECTION_HEADING = re.compile(
    r"^(\d+)\. (?:What was|Passages still|Requirements approved|Draft requirements"
    r"|Not converted|Human decisions|Limitations)",
    re.M,
)


def unprintable(text: str) -> str:
    """The characters this report's fonts cannot draw — the tofu test, exactly."""
    return "".join(sorted({char for char in text if not _printable(char)}))


def check(path: str) -> tuple[dict, list[str]]:
    name = os.path.basename(path)
    payload = Path(path).read_bytes()
    client = TestClient(create_app(SECRET))
    started = time.time()
    row: dict = {"file": name, "kb": len(payload) // 1024}
    found: list[str] = []

    response = client.post(
        f"/api/v1/documents?filename={name}&authority=SEBI",
        content=payload,
        headers={"Content-Type": "application/pdf"},
    )
    row["upload"] = response.status_code
    if response.status_code != 201:
        row["detail"] = response.json().get("detail", "")[:90]
        # A rejection is a valid answer (too big, too many pages) as long as it
        # explains itself. A 500 never is.
        if response.status_code >= 500:
            found.append(f"{name}: upload failed with {response.status_code}")
        return row, found

    document = response.json()
    scope = document["scope"]
    row.update(
        pages=scope["page_count"],
        passages=scope["passages_reviewed"],
        duties=scope["possible_requirements"],
        waiting=scope["passages_needing_review"],
        not_english=scope["passages_not_in_english"],
        state=document["state"],
        secs=round(time.time() - started, 1),
    )

    for passage in document["passages"]:
        for match in SPLIT_DEONTIC.finditer(passage["text"]):
            if INTACT.fullmatch(match.group(0)):
                continue
            if passage["classification"] not in DUTY_CLASSES:
                found.append(
                    f"{name}: split modal verb {match.group(0)!r} still filed "
                    f"{passage['classification']} at {passage['locator']}"
                )

    tiny = [item for item in document["passages"] if len(item["text"].strip()) < 12]
    if tiny:
        found.append(
            f"{name}: {len(tiny)} passage(s) under 12 characters reached a reviewer, "
            f"e.g. {tiny[0]['text']!r} at {tiny[0]['locator']}"
        )

    score = client.get(f"/api/v1/documents/{document['id']}/score")
    row["score"] = score.status_code
    if score.status_code == 200:
        body = score.json()
        row["clarity"] = body["deadline_clarity"]
        row["timed"] = body["with_timing_language"]
        row["excluded"] = body["non_normative_timing_passages"]
        clarity = body["deadline_clarity"]
        if clarity is not None and not 0 <= clarity <= 1:
            found.append(f"{name}: deadline clarity out of range ({clarity})")
        if body["with_timing_language"] == 0 and clarity is not None:
            found.append(f"{name}: clarity computed from an empty denominator")

    case = client.post(f"/api/v1/documents/{document['id']}/case")
    row["case"] = case.status_code
    if case.status_code == 201:
        body = case.json()
        row["case_at"] = body["locator"]
        if len(body["text"].strip()) < 25:
            found.append(f"{name}: the case selected a fragment — {body['text']!r}")
        # A duration the parser will not turn into a value is fine — hours and
        # minutes are dropped deliberately, because a calendar date would
        # misstate a two-hour RTO. What is NOT fine is doing that silently, so
        # the check is on the disclosure, not on the parse.
        if body["duration_label"] and body["duration_value"] is None:
            if "shorter than a day" not in body["limitation"]:
                found.append(
                    f"{name}: duration {body['duration_label']!r} yields no value and "
                    "the case does not say why"
                )

    packet = client.get(f"/api/v1/documents/{document['id']}/review-packet.pdf")
    row["packet"] = packet.status_code
    if packet.status_code != 200:
        found.append(f"{name}: the draft review packet was refused ({packet.status_code})")
    else:
        text = "\n".join(
            (page.extract_text() or "") for page in PdfReader(BytesIO(packet.content)).pages
        )
        row["boxes"] = text.count("■")
        stray = unprintable(text)
        if stray:
            found.append(f"{name}: characters the report cannot draw reached it — {stray!r}")
        headings = [int(number) for number in SECTION_HEADING.findall(text)]
        if headings != list(range(1, len(headings) + 1)):
            found.append(f"{name}: report sections numbered {headings}")

    report = client.get(f"/api/v1/documents/{document['id']}/report.pdf")
    row["report"] = report.status_code
    if report.status_code == 409:
        detail = report.json()["detail"]
        waiting = scope["passages_needing_review"]
        wanted = "more than one requirement strength" if waiting else "No requirement has been"
        if wanted not in detail:
            found.append(f"{name}: the refusal names the wrong precondition — {detail[:80]}")
    return row, found


def main() -> int:
    corpus = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CORPUS
    paths = sorted(glob.glob(str(corpus / "*.pdf")))
    if not paths:
        print(f"No PDFs under {corpus} — nothing to check.")
        return 0

    problems: list[str] = []
    for path in paths:
        try:
            row, found = check(path)
        except Exception:  # noqa: BLE001 - a crash IS the finding
            line = traceback.format_exc().splitlines()[-1][:140]
            row, found = {"file": os.path.basename(path), "CRASH": line}, [
                f"{os.path.basename(path)}: {line}"
            ]
        problems.extend(found)
        print(json.dumps(row), flush=True)

    print(f"\n{len(problems)} problem(s) across {len(paths)} documents")
    for problem in problems:
        print(" -", problem)
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
