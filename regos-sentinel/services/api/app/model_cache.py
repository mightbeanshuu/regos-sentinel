from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Tuple

import httpx
from pydantic import BaseModel, ConfigDict, Field

from .canonical import canonical_sha256
from .models import ModelRunReceipt, SourceSpan

PROMPT_VERSION = "regos-extraction/q15-q17-v1"
DEFAULT_MODEL = "openrouter/free"
CACHE_PATH = Path(__file__).with_name("model_cache") / "aster-cscrf-q15-q17.json"


class _StrictCacheModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class CachedCandidate(_StrictCacheModel):
    candidate_id: str
    source_span_id: str
    actor: str
    action: str
    object: str
    condition: str
    duration: int
    unit: str
    trigger: str | None
    computable: bool
    blocked_reason: str | None
    exact_quote: str


class CachedExtraction(_StrictCacheModel):
    provider: str
    model_id: str
    prompt_version: str
    generated_at: str
    output_token_limit: int = Field(ge=1, le=4096)
    candidates: List[CachedCandidate]


def _input_payload(spans: List[SourceSpan]) -> Dict[str, Any]:
    scoped = [item for item in spans if item.id in {"FAQ-Q15", "FAQ-Q17-A", "FAQ-Q17-B"}]
    return {
        "prompt_version": PROMPT_VERSION,
        "instruction": (
            "Extract obligation candidates. Never invent a trigger. If the source states a "
            "duration but no clock-start, return trigger=null, computable=false and a reason."
        ),
        "spans": [
            {"id": item.id, "locator": item.locator, "text": item.text} for item in scoped
        ],
    }


def _validate_safety(extraction: CachedExtraction) -> None:
    patch = next(
        (item for item in extraction.candidates if item.source_span_id == "FAQ-Q17-A"),
        None,
    )
    if patch is None:
        raise ValueError("Committed extraction cache is missing the Q17(a) candidate.")
    if patch.trigger is not None or patch.computable or not patch.blocked_reason:
        raise ValueError("Q17(a) cache must abstain when the source does not state a trigger.")
    if patch.duration != 1 or patch.unit != "week":
        raise ValueError("Q17(a) cache must preserve the source-explicit one-week duration.")


def _generate_cache(input_payload: Dict[str, Any]) -> CachedExtraction:
    if os.environ.get("REGOS_OFFLINE") == "1":
        raise RuntimeError("Committed model cache is required when REGOS_OFFLINE=1.")
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is required only when the model cache is cold.")
    output_limit = min(int(os.environ.get("REGOS_MODEL_OUTPUT_TOKENS", "900")), 1000)
    response = httpx.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": os.environ.get("REGOS_OPENROUTER_MODEL", DEFAULT_MODEL),
            "temperature": 0,
            "max_tokens": output_limit,
            "response_format": {"type": "json_object"},
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Return only JSON matching: {candidates:[{candidate_id,source_span_id,"
                        "actor,action,object,condition,duration,unit,trigger,computable,"
                        "blocked_reason,exact_quote}]}. Preserve exact quotes."
                    ),
                },
                {"role": "user", "content": json.dumps(input_payload)},
            ],
        },
        timeout=30,
    )
    response.raise_for_status()
    envelope = response.json()
    raw_content = envelope["choices"][0]["message"]["content"]
    parsed = json.loads(raw_content)
    extraction = CachedExtraction(
        provider="OpenRouter",
        model_id=str(envelope.get("model") or DEFAULT_MODEL),
        prompt_version=PROMPT_VERSION,
        generated_at="2026-07-22T00:00:00Z",
        output_token_limit=output_limit,
        candidates=parsed["candidates"],
    )
    _validate_safety(extraction)
    return extraction


def load_model_cache(spans: List[SourceSpan]) -> Tuple[ModelRunReceipt, CachedExtraction]:
    input_payload = _input_payload(spans)
    input_sha256 = canonical_sha256(input_payload)
    cache_key = canonical_sha256(
        {"prompt_version": PROMPT_VERSION, "input_sha256": input_sha256}
    )
    cache_hit = CACHE_PATH.exists()
    if cache_hit:
        extraction = CachedExtraction.model_validate_json(CACHE_PATH.read_text())
    else:
        extraction = _generate_cache(input_payload)
    if extraction.prompt_version != PROMPT_VERSION:
        raise ValueError("Committed extraction cache uses an unexpected prompt version.")
    _validate_safety(extraction)
    output_payload = extraction.model_dump(mode="json")
    receipt = ModelRunReceipt(
        provider=extraction.provider,
        model_id=extraction.model_id,
        prompt_version=extraction.prompt_version,
        cache_key=cache_key,
        input_sha256=input_sha256,
        output_sha256=canonical_sha256(output_payload),
        cache_hit=cache_hit,
        output_token_limit=extraction.output_token_limit,
        generated_at=extraction.generated_at,
        extraction_scope=(
            "Q15 and Q17 obligation candidates; deterministic gates remain authoritative"
        ),
    )
    return receipt, extraction
