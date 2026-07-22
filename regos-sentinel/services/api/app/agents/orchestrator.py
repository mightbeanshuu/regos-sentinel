"""Running agents against a workspace, and recording what they did.

The orchestrator is deliberately thin. It picks the agent, runs it, records the run on
the workspace, and writes one audit event. It does **not** let a finding change a
control — an agent's output reaches the rest of the system only by being read by a
person or by a deterministic gate that already exists.

The autonomy dial is here rather than inside the agents, because "how much may this
agent do" is an operator decision, not something an agent should be able to answer
about itself.
"""

from __future__ import annotations

import os
from typing import Dict, List, Optional

from ..advisory import advisory_spans, advisory_statements
from ..models import AgentId, AgentRun, AuditEvent, PlannerKind, WorkspaceState
from .crew import Adversary, Extractor, ReferenceResolver, SourceScout
from .planner import (
    ModelPlanner,
    PlannerUnavailable,
    api_key,
    load_cassette,
    planner_model,
    save_cassette,
)

#: What each agent is permitted to do with its findings. Every value is PROPOSE — the
#: prototype ships no agent with write authority, and adding one would require changing
#: this table *and* giving that agent a tool that writes, which none of them has.
AUTONOMY: Dict[AgentId, str] = {
    AgentId.REFERENCE_RESOLVER: "PROPOSE",
    AgentId.SOURCE_SCOUT: "PROPOSE",
    AgentId.ADVERSARY: "PROPOSE_AND_BLOCK",
    AgentId.EXTRACTOR: "PROPOSE",
}


def _advisory_candidate() -> List[Dict[str, str]]:
    spans = advisory_spans()
    return [
        {"subject_key": statement.subject_key, "quote": statement.exact_phrase}
        for statement in advisory_statements(spans)
        if statement.subject_key
    ]


def build_agent(state: WorkspaceState, agent_id: AgentId):
    if agent_id == AgentId.REFERENCE_RESOLVER:
        return ReferenceResolver(state)
    if agent_id == AgentId.SOURCE_SCOUT:
        return SourceScout(state, _advisory_candidate())
    if agent_id == AgentId.ADVERSARY:
        return Adversary(state)
    if agent_id == AgentId.EXTRACTOR:
        # The passages whose timing the gates actually depend on.
        span_ids = [
            span.id
            for span in state.source_spans
            if span.id in {"FAQ-Q15", "FAQ-Q17-A", "FAQ-Q17-B", "FAQ-Q14"}
        ]
        return Extractor(state, span_ids)
    raise ValueError(f"Unknown agent {agent_id!r}")


def model_planning_available() -> bool:
    """Whether a live model *could* plan right now.

    Deliberately not the same question as whether it *should*. Live planning is opt-in
    per request, because the deterministic plan is complete and reproducible and a
    hackathon demo should not degrade when a free model is having a bad minute. The
    interface offers model planning as a thing an operator asks for and can compare
    against, which is also the only honest way to show what the model contributes.
    """
    if os.environ.get("REGOS_OFFLINE") == "1":
        return False
    if os.environ.get("REGOS_MODEL_PLANNER", "").lower() in {"0", "off", "false"}:
        return False
    return bool(api_key())


def planner_status() -> Dict[str, object]:
    """What plan sources are available, for the interface to show plainly."""
    return {
        "model_available": model_planning_available(),
        "model_id": planner_model() if model_planning_available() else None,
        "offline": os.environ.get("REGOS_OFFLINE") == "1",
        "recorded_available": sorted(
            agent_id.value for agent_id in AgentId if load_cassette(agent_id)
        ),
        "default": PlannerKind.DETERMINISTIC.value,
        "note": (
            "The deterministic plan is the default because it is complete and "
            "reproducible. A model plan is something an operator asks for, and the "
            "trace records which one actually ran."
        ),
    }


def run_agent(
    state: WorkspaceState,
    agent_id: AgentId,
    actor: str = "demo.operator",
    planner_kind: Optional[PlannerKind] = None,
) -> WorkspaceState:
    """Run one agent and record the run. Nothing else changes.

    ``planner_kind`` forces a plan source; leaving it ``None`` takes the best available.
    """
    agent = build_agent(state, agent_id)
    plan: Optional[List[Dict[str, object]]] = None
    planner: Optional[ModelPlanner] = None

    if planner_kind == PlannerKind.MODEL and model_planning_available():
        try:
            planner = ModelPlanner(agent.goal, agent.toolbox.names)
        except PlannerUnavailable:
            planner = None
    elif planner_kind == PlannerKind.RECORDED:
        cassette = load_cassette(agent_id)
        plan = cassette["plan"] if cassette else None

    try:
        run: AgentRun = agent.run(plan=plan, planner=planner)
    except PlannerUnavailable:
        # The model became unreachable mid-run. Rather than ship half a plan, fall back
        # and label the result honestly as deterministic.
        agent = build_agent(state, agent_id)
        run = agent.run()

    if run.planner == PlannerKind.MODEL and not run.steps:
        # A plan with no calls in it is not a plan. This happens with small models, and
        # the right response is to fall back and say so rather than to present an empty
        # trace as an AI result.
        agent = build_agent(state, agent_id)
        run = agent.run()

    realised = getattr(agent, "realised_plan", [])
    if (
        run.planner == PlannerKind.MODEL
        and realised
        and os.environ.get("REGOS_RECORD_CASSETTES") == "1"
    ):
        save_cassette(agent_id, realised, run.model_id or "unknown", agent.goal)

    # One run per agent, replaced rather than stacked, so the trace shown is current.
    state.agent_runs = [item for item in state.agent_runs if item.agent_id != agent_id]
    state.agent_runs.append(run)

    landed = [item for item in run.findings if item.requires_human_review]
    state.audit_events.append(
        AuditEvent(
            id=f"AUD-{len(state.audit_events) + 1:04d}",
            event_type="AGENT_RUN_COMPLETED",
            actor=actor,
            created_at=run.completed_at,
            details={
                "agent_id": agent_id.value,
                "planner": run.planner.value,
                "model_id": run.model_id or "none",
                "tool_calls": run.tool_call_count,
                "findings": len(run.findings),
                "requiring_human_review": len(landed),
                "chain_head_sha256": run.chain_head_sha256,
                "chain_verified": run.chain_verified,
                "autonomy": AUTONOMY[agent_id],
            },
        )
    )
    return state


def run_all_agents(
    state: WorkspaceState,
    actor: str = "demo.operator",
    planner_kind: Optional[PlannerKind] = None,
) -> WorkspaceState:
    for agent_id in (
        AgentId.REFERENCE_RESOLVER,
        AgentId.EXTRACTOR,
        AgentId.SOURCE_SCOUT,
        AgentId.ADVERSARY,
    ):
        state = run_agent(state, agent_id, actor=actor, planner_kind=planner_kind)
    return state


def blocking_challenges(state: WorkspaceState) -> List[str]:
    """Adversary challenges that landed. A non-empty list must block publication."""
    return [
        f"{finding.id}: {finding.summary}"
        for run in state.agent_runs
        if run.agent_id == AgentId.ADVERSARY
        for finding in run.findings
        if finding.kind == "CHALLENGE_LANDED"
    ]
