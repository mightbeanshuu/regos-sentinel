"""Measure the prototype and write docs/METRICS.md.

Runs the real workflow in-process, evaluates the committed gold set, and regenerates the
metrics document. Nothing is hand-written into that file.

    cd services/api && REGOS_OFFLINE=1 uv run python scripts/measure_prototype.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.metrics import as_dict, as_markdown, measure  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[3]
MARKDOWN_PATH = REPO_ROOT / "docs" / "METRICS.md"


def main() -> int:
    report = measure()
    MARKDOWN_PATH.parent.mkdir(parents=True, exist_ok=True)
    MARKDOWN_PATH.write_text(as_markdown(report), encoding="utf-8")
    print(json.dumps(as_dict(report), indent=2, ensure_ascii=False))
    print(f"\nWrote {MARKDOWN_PATH.relative_to(REPO_ROOT)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
