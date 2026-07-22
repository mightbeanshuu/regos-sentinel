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
from app.agents.tools import analyse_timing, search_corpus, verify_quote
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


def test_resetting_the_demo_clears_agent_runs() -> None:
    client = client_for()
    client.post("/api/v1/agents/run-all")

    state = client.post("/api/v1/demo/reset").json()

    assert state["agent_runs"] == []
