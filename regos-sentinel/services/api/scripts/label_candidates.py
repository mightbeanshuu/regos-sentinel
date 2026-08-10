"""Pull labelling candidates out of the circular corpus.

Two rules make this set worth labelling:

1. IT GOES THROUGH THE PRODUCT'S OWN EXTRACTOR. Every sentence is verbatim
   output of `app.documents` over a real PDF — the same text the served pipeline
   produces, extraction artifacts and all. Training on cleaner text than the
   product sees would flatter the model on exactly the inputs it fails.

2. THE NET IS WIDER THAN THE CLASSIFIER. Candidates are selected by a broad
   regex for *any* mention of time — durations, periodicities, urgency words,
   calendar anchors — NOT by the classifier's own timing patterns and NOT by the
   deterministic rule. Harvesting with the model's own net would only ever show
   it sentences it already handles, and the labels would inherit its blind spots.

The output is a JSONL file of unlabelled candidates. Labels are assigned by
reading them; nothing here writes a label.
"""
from __future__ import annotations

import glob
import hashlib
import json
import os
import re
import sys

sys.path.insert(0, "/Users/mac/Desktop/02-Hackathons/sebi hackathon/regos-sentinel/services/api")
os.environ.setdefault("REGOS_OFFLINE", "1")

from app.documents import build_uploaded_document  # noqa: E402

CORPUS = "/Users/mac/Desktop/02-Hackathons/sebi hackathon/real-pdfs"
OUT = "/private/tmp/claude-501/-Users-mac/4bd6c69f-edc7-4723-ac39-5e91379c427e/scratchpad/candidates.jsonl"

#: Deliberately broad. Anything that mentions time at all is a candidate; the
#: reading decides what it means.
TIME_HINT = re.compile(
    r"""
    \b\d+\s*(?:calendar\s+|working\s+|business\s+)?
        (?:minute|hour|day|week|month|quarter|year)s?\b
  | \b(?:annual|annually|quarterly|monthly|weekly|daily|half[-\s]?yearly|
        fortnight|periodic|periodically|biennial)\w*\b
  | \b(?:immediate|immediately|forthwith|promptly|expeditious\w*|without\s+delay|
        as\s+soon\s+as|time[-\s]bound|timely|expedite\w*)\b
  | \b(?:within|before|after|from\s+the\s+date|with\s+effect\s+from|w\.e\.f\.|
        no\s+later\s+than|not\s+later\s+than|by\s+the\s+end\s+of|
        on\s+or\s+before|prior\s+to|latest\s+by)\b
  | \b(?:financial\s+year|fiscal\s+year|calendar\s+year|due\s+date|deadline|timeline)\b
    """,
    re.IGNORECASE | re.VERBOSE,
)

#: Extraction debris a reader could not label honestly, excluded rather than
#: guessed at — the same exclusion rule the existing corpus documents.
def is_debris(text: str) -> bool:
    words = text.split()
    if len(words) < 6 or len(text) < 45:
        return True
    letters = sum(ch.isalpha() for ch in text)
    if letters / max(1, len(text)) < 0.6:            # table rows, numeric forms
        return True
    if sum(ch.isdigit() for ch in text) / max(1, len(text)) > 0.22:
        return True
    if not re.search(r"[a-z]{3}", text):             # ALL-CAPS headers
        return True
    if text.rstrip().endswith((":", "|")):           # a stem, not a statement
        return True
    if re.search(r"[^\x00-˿]{2,}", text):       # non-Latin script
        return True
    return False


def main() -> int:
    files = sorted(glob.glob(os.path.join(CORPUS, "*.pdf")))
    print(f"{len(files)} circulars in the corpus")
    rows, seen = [], set()
    for index, path in enumerate(files, 1):
        name = os.path.basename(path).replace(".pdf", "")
        try:
            payload = open(path, "rb").read()
            doc = build_uploaded_document(
                document_id="HARVEST",
                filename=os.path.basename(path),
                payload=payload,
                uploaded_at="2026-08-11T00:00:00Z",
                authority_label="SEBI",
            )
        except Exception as error:  # noqa: BLE001
            print(f"  [{index}] {name[:52]} — skipped ({type(error).__name__})")
            continue
        kept = 0
        for passage in doc.passages:
            text = " ".join(passage.text.split())
            if not TIME_HINT.search(text) or is_debris(text):
                continue
            digest = hashlib.sha256(text.lower().encode()).hexdigest()[:16]
            if digest in seen:
                continue
            seen.add(digest)
            rows.append({
                "id": digest,
                "text": text[:420],
                "source": f"SEBI: {name[:60]} · {passage.locator}",
                "doc": name,
                "strength": passage.classification,
            })
            kept += 1
        if index % 20 == 0 or kept:
            print(f"  [{index}/{len(files)}] {name[:52]}: {kept} candidates")

    with open(OUT, "w") as handle:
        for row in rows:
            handle.write(json.dumps(row) + "\n")
    docs = len({r["doc"] for r in rows})
    print(f"\n{len(rows)} candidates from {docs} circulars -> {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
