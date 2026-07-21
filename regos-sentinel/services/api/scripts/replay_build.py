from __future__ import annotations

import hashlib
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))

from app.engine import (
    approve_q17,
    commit_q17_reading,
    resolve_scoped_references,
    run_build,
)
from app.models import ReviewerReadingRequest, ReviewRequest
from app.report import render_before_after_report, render_compliance_report
from app.seed import initial_state


def main() -> None:
    if os.environ.get("REGOS_OFFLINE") != "1":
        raise SystemExit("Set REGOS_OFFLINE=1 to prove this replay makes zero network calls.")
    state = initial_state()
    state = run_build(state, actor="offline.replay")
    state = resolve_scoped_references(state, actor="offline.replay")
    state = commit_q17_reading(
        state,
        ReviewerReadingRequest(
            reviewer_name="Aditi Rao",
            reviewer_role="Compliance Officer",
            independent_interpretation=(
                "The one-week duration is explicit while the start event is not stated."
            ),
            trigger_policy="Proactive discovery date recorded by vulnerability management",
        ),
    )
    state = approve_q17(
        state,
        ReviewRequest(
            reviewer_name="Aditi Rao",
            reviewer_role="Compliance Officer",
            reason="The cited Q17 branches support the corrected conditional control.",
            trigger_policy="Proactive discovery date recorded by vulnerability management",
            trigger_date="2026-07-22",
            agrees_with_system_suggestion=True,
        ),
    )
    build_id = state.builds[-1].id
    report = render_compliance_report(state, build_id)
    comparison = render_before_after_report(state, build_id)
    output_directory = Path(__file__).parents[1] / "artifacts"
    output_directory.mkdir(exist_ok=True)
    report_path = output_directory / f"{build_id.lower()}-compliance-build-report.pdf"
    comparison_path = output_directory / f"{build_id.lower()}-before-after.pdf"
    report_path.write_bytes(report)
    comparison_path.write_bytes(comparison)
    print(f"{report_path.name} sha256={hashlib.sha256(report).hexdigest()}")
    print(f"{comparison_path.name} sha256={hashlib.sha256(comparison).hexdigest()}")


if __name__ == "__main__":
    main()
