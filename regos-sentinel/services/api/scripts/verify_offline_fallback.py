#!/usr/bin/env python3
"""Replay the committed jury scenario without network access and verify its receipt."""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))

RECEIPT_PATH = Path(__file__).parents[3] / "demo" / "offline-approved-receipt.json"


def replay() -> dict[str, object]:
    from app.engine import (
        approve_q17,
        commit_q17_reading,
        resolve_scoped_references,
        run_benchmark,
        run_build,
    )
    from app.models import ReviewerReadingRequest, ReviewRequest
    from app.seed import initial_state

    state = run_build(initial_state(), actor="demo.operator")
    state = resolve_scoped_references(state, actor="demo.operator")
    state = commit_q17_reading(
        state,
        ReviewerReadingRequest(
            reviewer_name="Aditi Rao",
            reviewer_role="Compliance Officer",
            independent_interpretation=(
                "The one-week duration is explicit while the start event is not stated."
            ),
            trigger_policy=(
                "Proactive discovery date recorded by vulnerability management"
            ),
        ),
    )
    state = approve_q17(
        state,
        ReviewRequest(
            reviewer_name="Aditi Rao",
            reviewer_role="Compliance Officer",
            reason="The cited Q17 branches support the corrected conditional control.",
            trigger_policy=(
                "Proactive discovery date recorded by vulnerability management"
            ),
            trigger_date="2026-07-22",
            agrees_with_system_suggestion=True,
        ),
    )
    state = run_benchmark(state)
    manifest = state.latest_manifest
    benchmark = state.latest_benchmark
    if manifest is None or benchmark is None:
        raise RuntimeError("Offline replay did not produce the expected evidence artifacts.")
    reference_document = next(
        item for item in state.documents if item.id == "SEBI-CSCRF-2024-113"
    )
    return {
        "build_id": state.builds[-1].id,
        "build_status": state.builds[-1].status.value,
        "manifest_sha256": manifest.manifest_sha256,
        "replay_input_sha256": manifest.reproducibility["replay_input_sha256"],
        "scoped_reference_set_sha256": reference_document.content_hash,
        "benchmark_run_id": benchmark.run_id,
        "benchmark_passed": benchmark.passed,
        "benchmark_failed": benchmark.failed,
    }


def main() -> int:
    receipt = json.loads(RECEIPT_PATH.read_text())
    actual = replay()
    mismatches = {
        key: {"expected": receipt.get(key), "actual": value}
        for key, value in actual.items()
        if receipt.get(key) != value
    }
    result = {"match": not mismatches, "actual": actual, "mismatches": mismatches}
    print(json.dumps(result, indent=2))
    return 1 if mismatches else 0


if __name__ == "__main__":
    raise SystemExit(main())
