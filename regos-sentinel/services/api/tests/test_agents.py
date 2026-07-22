"""Tests for the agent layer.

Three properties matter and each has a test that would fail loudly if it stopped
holding: an agent cannot write, its trace cannot be edited after the fact, and a
landed challenge stops a build.

The last test in this file is the interesting one. The adversary agent found a real
provenance defect in code that had already shipped and passed sixty tests, and that
test is the regression guard for the fix.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.agents import Adversary, Extractor, ReferenceResolver, SourceScout, verify_chain
from app.agents.orchestrator import AUTONOMY, blocking_challenges, run_agent, run_all_agents
from app.agents.runtime import AgentToolbox, ToolRejected
from app.agents.tools import (
    TOOL_SPECS,
    analyse_timing,
    identifiers_agree,
    search_corpus,
    verify_quote,
)
from app.main import create_app
from app.metrics import _approved_workspace
from app.models import AgentId, Provenance
from app.seed import initial_state


def client_for() -> TestClient:
    return TestClient(create_app("test-session-secret-that-is-longer-than-thirty-two-bytes"))


# --------------------------------------------------------------------------- #
# The boundary: agents read, they do not write
# --------------------------------------------------------------------------- #


def test_no_agent_holds_a_tool_that_writes() -> None:
    """The permission model is the toolbox. A write tool does not exist to be called."""
    state = _approved_workspace()
    agents = [
        ReferenceResolver(state),
        SourceScout(state, [{"subject_key": "x", "quote": "y"}]),
        Adversary(state),
        Extractor(state, ["FAQ-Q15"]),
    ]
    forbidden = ("write", "create", "update", "delete", "approve", "set_", "apply", "compile")
    for agent in agents:
        for tool in agent.toolbox.names:
            assert not any(tool.startswith(word) or word in tool for word in forbidden), (
                f"{agent.agent_id.value} exposes {tool!r}, which sounds like it mutates"
            )


def test_an_agent_cannot_call_a_tool_it_was_not_given() -> None:
    box = AgentToolbox({"read_span": lambda span_id: {"span_id": span_id}})

    with pytest.raises(ToolRejected, match="not available to this agent"):
        box.call("delete_control", {"control_id": "CTRL-VAPT-07"})


def test_running_every_agent_changes_no_control_and_no_obligation() -> None:
    before = _approved_workspace()
    controls_before = [item.model_dump(mode="json") for item in before.controls]
    obligations_before = [item.model_dump(mode="json") for item in before.obligations]

    after = run_all_agents(before)

    assert [item.model_dump(mode="json") for item in after.controls] == controls_before
    assert [item.model_dump(mode="json") for item in after.obligations] == obligations_before
    assert len(after.agent_runs) == 4
    assert all(value.startswith("PROPOSE") for value in AUTONOMY.values())


# --------------------------------------------------------------------------- #
# The trace: hash-chained, and it fails if edited
# --------------------------------------------------------------------------- #


def test_every_agent_run_produces_a_verified_hash_chain() -> None:
    state = run_all_agents(_approved_workspace())

    assert len(state.agent_runs) == 4
    for run in state.agent_runs:
        assert run.steps, f"{run.agent_id.value} recorded no steps"
        assert run.chain_verified is True
        assert verify_chain(run.steps) is True
        assert run.steps[0].previous_step_sha256 is None
        for earlier, later in zip(run.steps, run.steps[1:]):
            assert later.previous_step_sha256 == earlier.step_sha256


def test_editing_a_recorded_step_breaks_the_chain() -> None:
    """A trace that survives editing is a log, not evidence."""
    run = ReferenceResolver(_approved_workspace()).run()
    assert verify_chain(run.steps) is True

    tampered = [item.model_copy(deep=True) for item in run.steps]
    tampered[0].tool_input = {"query": "something the agent never asked"}
    tampered[0].input_sha256 = "0" * 64

    assert verify_chain(tampered) is False


def test_a_tool_failure_is_recorded_rather_than_hidden() -> None:
    class Broken(ReferenceResolver):
        def deterministic_plan(self):
            return [{"tool": "no_such_tool", "input": {}, "rationale": "provoke a rejection"}]

    run = Broken(_approved_workspace()).run()

    assert run.tool_call_count == 1
    assert run.steps[0].status.value == "TOOL_ERROR"
    assert run.chain_verified is True


# --------------------------------------------------------------------------- #
# The tools do real work
# --------------------------------------------------------------------------- #


def test_corpus_search_finds_the_passage_a_pointer_names() -> None:
    """Term overlap alone matched the longest excerpt every time; identifiers fixed it."""
    assert search_corpus("CSCRF Part I · PDF page 49 · Table 19")["hits"][0]["span_id"] == (
        "CSCRF-TABLE-19"
    )
    assert search_corpus("CSCRF Part II · PR.MA.S3")["hits"][0]["span_id"] == "CSCRF-PR-MA-S3"
    assert search_corpus("PR.MA Guideline 6")["hits"][0]["span_id"] == "CSCRF-PR-MA-G6"
    assert search_corpus("Annexure-A")["hits"][0]["span_id"] == "CSCRF-ANNEXURE-A"


def test_quote_verification_refuses_a_quote_that_is_not_there() -> None:
    good = verify_quote("CSCRF-PR-MA-S3", "High — 1 week; Moderate — 2 weeks")
    invented = verify_quote("CSCRF-PR-MA-S3", "patches shall be applied within 24 hours")

    assert good["verbatim"] is True
    assert invented["verbatim"] is False
    assert "not present" in invented["reason"]


def test_timing_analysis_separates_the_three_shapes_that_matter() -> None:
    stated = analyse_timing("within three (3) months of submission of VAPT report")
    no_trigger = analyse_timing("validated against the patch management timelines (1 week)")
    no_period = analyse_timing(
        "Update all operating systems and applications with the latest patches on "
        "immediate basis"
    )

    assert stated["verdict"] == "PERIOD_AND_TRIGGER_STATED"
    assert no_trigger["verdict"] == "PERIOD_WITHOUT_TRIGGER"
    assert no_period["verdict"] == "URGENCY_WITHOUT_PERIOD"
    assert "immediate basis" in no_period["urgency_words"]


def test_the_reference_resolver_resolves_all_four_pointers_and_verifies_each() -> None:
    run = ReferenceResolver(initial_state()).run()

    resolved = [item for item in run.findings if item.kind == "REFERENCE_RESOLVED"]
    assert len(resolved) == 4
    assert {item.citations[0].span_id for item in resolved} == {
        "CSCRF-TABLE-19",
        "CSCRF-PR-MA-S3",
        "CSCRF-PR-MA-G6",
        "CSCRF-ANNEXURE-A",
    }
    assert all(item.accepted_by_gate for item in resolved)
    assert all(item.provenance == Provenance.DETERMINISTIC for item in resolved)


def test_the_scout_reads_the_advisory_as_additive_not_as_a_replacement() -> None:
    """Paragraph E says "read in conjunction with". Misreading it invents findings."""
    state = run_agent(initial_state(), AgentId.SOURCE_SCOUT)
    run = next(item for item in state.agent_runs if item.agent_id == AgentId.SOURCE_SCOUT)

    delta = next(item for item in run.findings if item.kind == "SOURCE_VERSION_DELTA")
    assert "READ_IN_CONJUNCTION_WITH" in delta.summary
    assert "untouched by this source" in delta.summary
    assert "continue to be governed by the reviewed corpus" in delta.detail

    untimed = [item for item in run.findings if item.kind == "UNTIMED_DUTY_DETECTED"]
    assert len(untimed) >= 3, "the advisory is full of duties with no stated period"


# --------------------------------------------------------------------------- #
# What a model planner may be handed, and what a wrong plan can cost
# --------------------------------------------------------------------------- #


def test_a_planner_is_never_offered_a_tool_that_judges_its_own_prose() -> None:
    """The two excluded tools take the material to be judged as an argument.

    A model calling those would be grading text it wrote, and the gate downstream would
    read the verdict as a fact about the regulation. Their identifier-taking
    replacements read the text from pinned state instead.
    """
    assert "analyse_timing" not in TOOL_SPECS
    assert "compare_span_sets" not in TOOL_SPECS
    assert "analyse_span_timing" in TOOL_SPECS
    assert "compare_registered_sources" in TOOL_SPECS

    # And the relationship a planner may declare is a closed set, not free text.
    relationship = TOOL_SPECS["compare_registered_sources"]["parameters"]["properties"]
    assert relationship["relationship"]["enum"] == ["READ_IN_CONJUNCTION_WITH", "SUPERSEDES"]


def test_a_model_plan_cannot_invent_a_finding_the_gate_did_not_make() -> None:
    """A hostile plan is executed, recorded, and changes nothing about the verdicts.

    This is the property that makes a free, fallible model acceptable here: the plan is
    the model's, the findings are the gate's.
    """

    class Hostile:
        """A planner that calls a tool it was never given, then one that exists."""

        max_steps = 4
        model_id = "test/hostile"
        prompt_version = "test"

        def __init__(self) -> None:
            self._calls = [
                {"tool": "approve_everything", "input": {}, "rationale": "try to write"},
                {"tool": "read_span", "input": {"span_id": "FAQ-Q15"}, "rationale": "read"},
            ]

        def next_call(self):
            return self._calls.pop(0) if self._calls else None

        def observe(self, output) -> None:
            return None

    state = _approved_workspace()
    run = Extractor(state, ["FAQ-Q15"]).run(planner=Hostile())

    assert run.planner.value == "MODEL_PLANNED"
    assert run.steps[0].status.value == "TOOL_ERROR", "the invented tool must be rejected"
    assert run.chain_verified is True
    # The model never called analyse_span_timing, so no verdict exists — and the gate
    # reports that absence rather than defaulting to something reassuring.
    assert [item.kind for item in run.findings] == ["TIMING_NOT_ASSESSED"]
    assert all(item.provenance == Provenance.DETERMINISTIC for item in run.findings)


def test_the_extractor_matches_verdicts_to_passages_by_id_not_by_order() -> None:
    """A model may read passages in any order. Positional pairing silently mislabels."""
    state = _approved_workspace()
    run = Extractor(state, ["FAQ-Q17-A", "FAQ-Q15"]).run()

    by_id = {item.id: item for item in run.findings}
    assert by_id["EXT-FAQ-Q15"].kind == "TIMING_COMPUTABLE"
    assert by_id["EXT-FAQ-Q17-A"].kind == "TIMING_BLOCKED"


# --------------------------------------------------------------------------- #
# The second defect an agent found: a citation gate that could not fail
# --------------------------------------------------------------------------- #


def test_a_pointer_does_not_resolve_to_a_passage_it_does_not_name() -> None:
    """Regression guard for a real defect, found by letting a model plan freely.

    The resolver drew a probe from the passage it had just fetched and then "verified"
    that probe against the same passage, so the check was true by construction and
    every search hit became a resolution. A pointer to ``Table 47`` resolved to
    Table 19, and ``PR.MA Guideline 5`` resolved to Guideline 6 — each reported to a
    compliance officer as confirmed, with a fingerprint next to it.

    Verification now runs against the pointer, which the passage did not supply.
    """
    assert identifiers_agree("Table 47", "CSCRF-TABLE-19")["agrees"] is False
    assert identifiers_agree("PR.MA Guideline 5", "CSCRF-PR-MA-G6")["agrees"] is False
    assert identifiers_agree("Annexure-Z", "CSCRF-ANNEXURE-A")["agrees"] is False

    # The four real pointers still land, and say why.
    assert identifiers_agree("CSCRF Part I · PDF page 49 · Table 19", "CSCRF-TABLE-19")[
        "agrees"
    ]
    assert identifiers_agree(
        "CSCRF Part II · PDF pages 116–117 · PR.MA.S3", "CSCRF-PR-MA-S3"
    )["agrees"]


def test_a_planner_that_repeats_a_query_cannot_manufacture_resolutions() -> None:
    """One finding per reference, not one per keystroke.

    The gate used to emit a finding per search. Under a fixed plan that was one per
    reference; under a model plan that retried a failing query six times, it was six
    resolutions of the same pointer.
    """

    class Repetitive:
        max_steps = 8
        model_id = "test/repetitive"
        prompt_version = "test"

        def __init__(self) -> None:
            self._left = 6

        def next_call(self):
            if self._left <= 0:
                return None
            self._left -= 1
            return {
                "tool": "search_corpus",
                "input": {"query": "PR.MA Guideline 5"},
                "rationale": "look for a guideline that is not in the corpus",
            }

        def observe(self, output) -> None:
            return None

    state = initial_state()
    run = ReferenceResolver(state).run(planner=Repetitive())

    unresolved = [item for item in state.references if item.status.value == "UNRESOLVED"]
    assert run.tool_call_count == 6, "every repeated call is still recorded"
    assert len(run.findings) == len(unresolved), "but findings are keyed to references"
    assert len({item.id for item in run.findings}) == len(run.findings)

    # Searching for Guideline 5 does surface Guideline 6, and the pointer that really
    # names Guideline 6 may legitimately resolve to it — the query was wrong, the
    # verification was not. What must never happen is a pointer resolving to a passage
    # it does not name, however the candidate was reached.
    for item in run.findings:
        if item.accepted_by_gate:
            pointer = item.summary.split(" → ")[0]
            assert identifiers_agree(pointer, item.citations[0].span_id)["agrees"]
    assert sum(1 for item in run.findings if not item.accepted_by_gate) == 3


# --------------------------------------------------------------------------- #
# The adversary has teeth
# --------------------------------------------------------------------------- #


def test_a_landed_challenge_blocks_the_build() -> None:
    """Not advisory. A challenge that lands stops publication until a person rules."""
    state = _approved_workspace()
    assert state.builds[-1].status.value == "APPROVED"

    # Reintroduce the defect the adversary originally found: attribute a clock-start
    # to a passage that does not state one.
    target = next(item for item in state.obligations if item.id == "OBL-VAPT-OTHER-001")
    q17b = next(item for item in state.source_spans if item.id == "FAQ-Q17-B")
    target.deadline.citation.span_id = q17b.id
    target.deadline.citation.locator = q17b.locator

    state = run_agent(state, AgentId.ADVERSARY)
    landed = blocking_challenges(state)
    assert landed, "the adversary should object to a trigger its passage does not state"

    from app.engine import run_build

    rebuilt = run_build(state, actor="test")
    gate = next(item for item in rebuilt.builds[-1].tests if item.id == "TEST-ADVERSARY-001")
    assert gate.status.value == "BLOCK"
    assert rebuilt.builds[-1].status.value == "BLOCKED_AWAITING_HUMAN"


def test_an_obligation_nobody_examined_is_not_reported_as_unchallenged() -> None:
    """Regression guard for the third defect a model plan exposed.

    Every challenge was guarded on having read the cited passage, and the summary at
    the end was not. A plan that listed the obligations and stopped therefore reported
    "withstood every challenge — the quotation is verbatim" about a quotation nothing
    had looked at, with ``requires_human_review`` false. The fixed plan always read the
    passages, so no test could see it until a model planned badly.
    """

    class ListOnly:
        max_steps = 2
        model_id = "test/list-only"
        prompt_version = "test"

        def __init__(self) -> None:
            self._calls = [
                {"tool": "list_active_obligations", "input": {}, "rationale": "enumerate"}
            ]

        def next_call(self):
            return self._calls.pop(0) if self._calls else None

        def observe(self, output) -> None:
            return None

    run = Adversary(_approved_workspace()).run(planner=ListOnly())

    assert run.findings, "the obligations exist; something must be said about them"
    assert all(item.kind == "CHALLENGE_NOT_ASSESSED" for item in run.findings)
    assert all(not item.accepted_by_gate for item in run.findings)
    assert all(item.requires_human_review for item in run.findings)
    assert not blocking_challenges(run_agent(_approved_workspace(), AgentId.ADVERSARY))


def test_the_defect_the_adversary_found_stays_fixed() -> None:
    """Regression guard for a real defect in shipped code.

    ``OBL-VAPT-OTHER-001`` used to record ``trigger="VAPT report submission"`` with
    ``SOURCE_EXPLICIT`` provenance while citing FAQ Q17(b) — a passage that states the
    three-month period and says nothing at all about what starts it. The clock-start is
    stated in Q15. Sixty tests passed over that; the adversary agent did not.
    """
    state = _approved_workspace()
    obligation = next(item for item in state.obligations if item.id == "OBL-VAPT-OTHER-001")

    assert obligation.deadline.trigger_provenance == Provenance.SOURCE_EXPLICIT
    assert obligation.deadline.citation.span_id == "FAQ-Q15"
    assert "of submission of VAPT report" in obligation.deadline.citation.quote

    # The branch definition still cites Q17(b) — that part it does state.
    assert obligation.field_citations["condition"].span_id == "FAQ-Q17-B"
    assert obligation.field_citations["trigger"].span_id == "FAQ-Q15"

    run = Adversary(state).run()
    assert all(item.kind == "CHALLENGE_SURVIVED" for item in run.findings)


# --------------------------------------------------------------------------- #
# API surface
# --------------------------------------------------------------------------- #


def test_agent_catalogue_declares_what_each_agent_may_never_do() -> None:
    client = client_for()

    catalogue = client.get("/api/v1/agents").json()

    assert len(catalogue) == 4
    for entry in catalogue:
        assert entry["reads"].strip()
        assert entry["proposes"].strip()
        assert entry["never_does"].strip()
        assert entry["gated_by"].strip()
        assert entry["tools"]


def test_running_agents_over_the_api_records_a_verified_trace() -> None:
    client = client_for()

    state = client.post("/api/v1/agents/run-all").json()

    assert len(state["agent_runs"]) == 4
    assert all(run["chain_verified"] for run in state["agent_runs"])
    events = [item for item in state["audit_events"] if item["event_type"] == "AGENT_RUN_COMPLETED"]
    assert len(events) == 4
    assert all(item["details"]["chain_verified"] for item in events)

    challenges = client.get("/api/v1/agents/challenges").json()
    assert challenges["blocking"] is False
    assert "no agent in this prototype holds a tool that writes" in challenges["note"].lower()


def test_planner_status_reports_what_can_plan_and_what_runs_by_default() -> None:
    client = client_for()

    status = client.get("/api/v1/agents/planner").json()

    assert status["default"] == "DETERMINISTIC_PLAN"
    assert isinstance(status["model_available"], bool)


def test_an_unreachable_model_falls_back_and_says_so() -> None:
    """A trace that misnames its own planner is worse than no trace at all."""
    client = client_for()

    state = client.post(
        "/api/v1/agents/ADVERSARY/run", params={"planner": "MODEL_PLANNED"}
    ).json()

    run = state["agent_runs"][0]
    # Whatever happened, the label matches what actually ran and the chain holds.
    assert run["planner"] in {"MODEL_PLANNED", "DETERMINISTIC_PLAN"}
    assert run["chain_verified"] is True
    assert run["steps"], "a run with no steps must never be presented as a result"
    if run["planner"] == "DETERMINISTIC_PLAN":
        assert run["model_id"] is None, "a deterministic plan must not claim a model"
        # And the operator is told why, rather than left to infer it from a label.
        assert run["planner_note"], "a fallback must explain itself"
        assert "requested" in run["planner_note"]


def test_watching_a_run_streams_each_call_and_still_records_it() -> None:
    """The live console is a view onto a run, not a different kind of run."""
    client = client_for()

    with client.stream(
        "GET", "/api/v1/agents/EXTRACTOR/stream", params={"planner": "DETERMINISTIC_PLAN"}
    ) as response:
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")
        body = "".join(response.iter_text())

    # The calls arrive as they happen, and the gate verdicts follow them.
    assert "event: call" in body
    assert "event: result" in body
    assert "event: finding" in body
    assert "event: done" in body
    assert "analyse_span_timing" in body

    # And the workspace holds the same run it would have held without anyone watching.
    runs = client.get("/api/v1/agents/runs").json()
    extractor = next(item for item in runs if item["agent_id"] == "EXTRACTOR")
    assert extractor["chain_verified"] is True
    assert extractor["steps"]


def test_resetting_the_demo_clears_agent_runs() -> None:
    client = client_for()
    client.post("/api/v1/agents/run-all")

    state = client.post("/api/v1/demo/reset").json()

    assert state["agent_runs"] == []
