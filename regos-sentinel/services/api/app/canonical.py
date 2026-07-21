from __future__ import annotations

import hashlib
import json
from typing import Any, Dict


def canonical_json_bytes(payload: Any) -> bytes:
    return json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")


def canonical_sha256(payload: Any) -> str:
    return hashlib.sha256(canonical_json_bytes(payload)).hexdigest()


def verify_embedded_sha256(
    payload: Dict[str, Any], digest_field: str = "manifest_sha256"
) -> Dict[str, Any]:
    expected = payload.get(digest_field)
    unsigned_payload = {key: value for key, value in payload.items() if key != digest_field}
    actual = canonical_sha256(unsigned_payload)
    return {
        "match": isinstance(expected, str) and expected == actual,
        "expected_sha256": expected,
        "recomputed_sha256": actual,
        "canonicalization": (
            "JSON UTF-8; sort_keys=true; separators=(',', ':'); ensure_ascii=false; "
            f"digest excludes {digest_field}"
        ),
    }
