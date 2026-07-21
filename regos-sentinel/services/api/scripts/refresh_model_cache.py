from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))

from app.model_cache import CACHE_PATH, _generate_cache, _input_payload
from app.seed import initial_state


def main() -> None:
    state = initial_state()
    extraction = _generate_cache(_input_payload(state.source_spans))
    payload = extraction.model_dump(mode="json")
    rendered = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    CACHE_PATH.write_text(rendered)
    print(f"model={extraction.model_id}")
    print(f"cache_sha256={hashlib.sha256(rendered.encode()).hexdigest()}")


if __name__ == "__main__":
    main()
