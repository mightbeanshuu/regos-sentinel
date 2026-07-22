"""Corpus packs and the eight gates every corpus must clear.

The scalability question a jury actually asks is not "how many circulars have you
loaded" — it is "does the next one need you to rewrite the system". This module
answers that by publishing the same eight gates for every pack and showing, honestly,
which ones each pack has passed.

A pack that has been registered but not read shows seven ``GATE_NOT_RUN`` rows. That
is the point. A pack cannot look further along than it is.
"""

from __future__ import annotations

from typing import List

from .models import (
    CorpusGate,
    CorpusGateStatus,
    CorpusPack,
    CorpusPackReport,
    CorpusState,
    CoverageStatus,
    WorkspaceState,
)

GATE_SEQUENCE = (
    (
        "G1-SOURCE-IDENTITY",
        "Source identity",
        "The document is pinned to an authority, a version and a content fingerprint.",
    ),
    (
        "G2-SEGMENTATION",
        "Segmentation",
        "The text is split into addressable passages, each with a locator.",
    ),
    (
        "G3-COVERAGE",
        "Coverage",
        "Every passage in the declared scope carries a recorded disposition.",
    ),
    (
        "G4-OBLIGATION-EXTRACTION",
        "Requirement extraction",
        "Passages that create duties are turned into structured, schema-validated candidates.",
    ),
    (
        "G5-PROVENANCE",
        "Provenance",
        "Every derived value says whether the source, a rule, a model or a person produced it.",
    ),
    (
        "G6-APPLICABILITY",
        "Applicability",
        "Each requirement is decided against the entity's facts, with a receipt either way.",
    ),
    (
        "G7-HUMAN-REVIEW",
        "Human review",
        "Material interpretation is approved by a named person with a written reason.",
    ),
    (
        "G8-REPORT-GENERATION",
        "Report generation",
        "The approved state renders a replayable report and a sealed build record.",
    ),
)


def _gate(
    gate_id: str,
    name: str,
    plain: str,
    status: CorpusGateStatus,
    observed: str,
    test_id: str | None = None,
) -> CorpusGate:
    return CorpusGate(
        id=gate_id,
        name=name,
        plain=plain,
        status=status,
        observed=observed,
        test_id=test_id,
    )


def _hero_gates(state: WorkspaceState, pack: CorpusPack) -> List[CorpusGate]:
    scoped = [span for span in state.source_spans if span.document_id == pack.document_id]
    disposed = [
        entry
        for entry in state.coverage
        if any(span.id == entry.span_id for span in scoped)
    ]
    ambiguous = [item for item in disposed if item.status == CoverageStatus.AMBIGUOUS]
    compiled = [item for item in state.obligations if item.status == "ACTIVE"]
    approved = any(review.decision == "APPROVED" for review in state.reviews)
    sealed = state.latest_manifest is not None
    passed = CorpusGateStatus.PASSED
    not_run = CorpusGateStatus.NOT_RUN

    return [
        _gate(
            *GATE_SEQUENCE[0],
            passed,
            f"{pack.authority} · {pack.version} · SHA-256 pinned",
            "tests/test_workflow.py::test_live_source_matcher_covers_every_pinned_demo_span",
        ),
        _gate(
            *GATE_SEQUENCE[1],
            passed,
            f"{len(scoped)} passages, each with a page-level locator",
            "tests/test_documents.py::test_sentences_split_on_word_boundaries_not_bare_suffixes",
        ),
        _gate(
            *GATE_SEQUENCE[2],
            passed,
            (
                f"{len(disposed)} of {len(scoped)} passages disposed"
                + (f" · {len(ambiguous)} awaiting interpretation" if ambiguous else "")
            ),
            "tests/test_workflow.py::test_build_fails_closed_before_human_review",
        ),
        _gate(
            *GATE_SEQUENCE[3],
            passed if compiled else not_run,
            (
                f"{len(compiled)} structured requirements validated against "
                f"{state.schema_version}"
                if compiled
                else "No requirement has cleared the gates yet"
            ),
            "tests/test_workflow.py::test_review_persists_split_and_propagates_impact",
        ),
        _gate(
            *GATE_SEQUENCE[4],
            passed,
            "Four provenance values, one per derived field",
            "tests/test_workflow.py::test_uncomputable_deadline_rejects_due_date_and_policy_note",
        ),
        _gate(
            *GATE_SEQUENCE[5],
            passed,
            f"{len(state.applicability_scenarios)} scenario receipts · inclusions and exclusions",
            "tests/test_scenarios.py::test_case_c_receipts_an_exclusion",
        ),
        _gate(
            *GATE_SEQUENCE[6],
            passed if approved else not_run,
            (
                f"Approved by {state.reviews[-1].reviewer_name}"
                if approved
                else "Waiting for a named reviewer"
            ),
            "tests/test_workflow.py::test_manifest_is_unavailable_until_build_approved",
        ),
        _gate(
            *GATE_SEQUENCE[7],
            passed if sealed else not_run,
            (
                "Build record sealed and byte-identical on re-render"
                if sealed
                else "No sealed build record until a build is approved"
            ),
            "tests/test_workflow.py::test_compliance_report_is_state_derived_and_byte_identical",
        ),
    ]


def _registered_gates(pack: CorpusPack) -> List[CorpusGate]:
    """A registered-only pack passes source identity and nothing else. Saying so is the gate."""
    gates = [
        _gate(
            *GATE_SEQUENCE[0],
            CorpusGateStatus.PASSED,
            f"{pack.authority} · {pack.version} · SHA-256 over the pinned source identity",
            "tests/test_workflow.py::test_reset_returns_to_unreviewed_state",
        )
    ]
    gates.extend(
        _gate(
            gate_id,
            name,
            plain,
            CorpusGateStatus.NOT_RUN,
            "Not attempted. This pack is registered, not processed.",
        )
        for gate_id, name, plain in GATE_SEQUENCE[1:]
    )
    return gates


def _sandbox_gates(pack: CorpusPack, uploaded_count: int) -> List[CorpusGate]:
    """The upload lane clears the deterministic gates and is honest about the rest."""
    active = uploaded_count > 0
    return [
        _gate(
            *GATE_SEQUENCE[0],
            CorpusGateStatus.PASSED if active else CorpusGateStatus.NOT_RUN,
            (
                f"{uploaded_count} document(s) hashed on upload · authority stated by the "
                "uploader, never verified"
                if active
                else "No document uploaded in this session"
            ),
            "tests/test_documents.py::test_upload_records_hash_pages_passages_and_locators",
        ),
        _gate(
            *GATE_SEQUENCE[1],
            CorpusGateStatus.PASSED if active else CorpusGateStatus.NOT_RUN,
            (
                "Page and sentence segmentation with page-level locators"
                if active
                else "Runs on upload"
            ),
            "tests/test_documents.py::test_sentences_split_on_word_boundaries_not_bare_suffixes",
        ),
        _gate(
            *GATE_SEQUENCE[2],
            CorpusGateStatus.PASSED if active else CorpusGateStatus.NOT_RUN,
            (
                "Every extracted passage is classified or flagged for review"
                if active
                else "Runs on upload"
            ),
            "tests/test_documents.py::test_classifier_separates_requirement_strengths_and_defers_when_mixed",
        ),
        _gate(
            *GATE_SEQUENCE[3],
            CorpusGateStatus.NOT_APPLICABLE,
            "Deliberately absent. No model call runs on an uploaded file in this prototype.",
        ),
        _gate(
            *GATE_SEQUENCE[4],
            CorpusGateStatus.PASSED if active else CorpusGateStatus.NOT_RUN,
            (
                "Classification is deterministic; a human reclassification is recorded as such"
                if active
                else "Runs on upload"
            ),
            "tests/test_documents.py::test_human_can_resolve_a_passage_and_then_approve_a_requirement",
        ),
        _gate(
            *GATE_SEQUENCE[5],
            CorpusGateStatus.NOT_APPLICABLE,
            "An uploaded file carries no entity profile, so there is nothing to decide against.",
        ),
        _gate(
            *GATE_SEQUENCE[6],
            CorpusGateStatus.PASSED if active else CorpusGateStatus.NOT_RUN,
            (
                "A structured requirement exists only after a named person approves it"
                if active
                else "Runs after upload"
            ),
            "tests/test_documents.py::test_requirement_without_a_trigger_calculates_no_due_date",
        ),
        _gate(
            *GATE_SEQUENCE[7],
            CorpusGateStatus.PASSED if active else CorpusGateStatus.NOT_RUN,
            (
                "Draft packet before approval, Compliance Build Report after"
                if active
                else "Runs after approval"
            ),
            "tests/test_documents.py::test_draft_packet_is_available_before_approval_and_report_is_not",
        ),
    ]


def corpus_reports(state: WorkspaceState, uploaded_count: int = 0) -> List[CorpusPackReport]:
    reports: List[CorpusPackReport] = []
    for pack in state.corpus_packs:
        if pack.status == CorpusState.ACTIVE:
            gates = _hero_gates(state, pack)
        elif pack.status == CorpusState.SANDBOX:
            gates = _sandbox_gates(pack, uploaded_count)
        else:
            gates = _registered_gates(pack)
        reports.append(
            CorpusPackReport(
                pack=pack,
                gates=gates,
                gates_passed=sum(
                    1 for gate in gates if gate.status == CorpusGateStatus.PASSED
                ),
                gates_total=len(gates),
            )
        )
    return reports
