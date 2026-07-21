from __future__ import annotations

import json
import sys
from pathlib import Path

from app.canonical import verify_embedded_sha256


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: uv run python scripts/verify_manifest.py <manifest.json>")
        return 2

    payload = json.loads(Path(sys.argv[1]).read_text())
    result = verify_embedded_sha256(payload)
    print(json.dumps(result, indent=2))
    return 0 if result["match"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
