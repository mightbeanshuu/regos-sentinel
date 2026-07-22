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

from typing import Dict, List

from ..advisory import advisory_spans, advisory_statements
from ..models import AgentId, AgentRun, AuditEvent, WorkspaceState
from .crew import Adversary, Extractor, ReferenceResolver, SourceScout

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


def run_agent(
    state: WorkspaceState,
    agent_id: AgentId,
    actor: str = "demo.operator",
) -> WorkspaceState:
    """Run one agent and record the run. Nothing else changes."""
    run: AgentRun = build_agent(state, agent_id).run()

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


def run_all_agents(state: WorkspaceState, actor: str = "demo.operator") -> WorkspaceState:
    for agent_id in (
        AgentId.REFERENCE_RESOLVER,
        AgentId.EXTRACTOR,
        AgentId.SOURCE_SCOUT,
        AgentId.ADVERSARY,
    ):
        state = run_agent(state, agent_id, actor=actor)
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
