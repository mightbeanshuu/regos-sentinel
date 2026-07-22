"""The agent substrate: real tools, a recorded plan, and a tamper-evident trace.

An agent here is three separable things, and keeping them separate is what makes the
result defensible:

**Tools** are ordinary deterministic Python. Searching a pinned corpus, verifying a
quotation against its source, diffing two versions — none of that needs a model, and
all of it is testable without one.

**A planner** chooses which tool to call next. That is the part a language model is
genuinely good at, and the only part it does. Three planners exist:
``MODEL`` (live), ``RECORDED`` (a committed trace replayed offline) and
``DETERMINISTIC`` (fixed code). A deterministic plan is *never* labelled AI — the
provenance vocabulary would be a lie if it were.

**Gates** decide what survives. An agent finding is a proposal; a deterministic gate
accepts or rejects it, and material acceptances still route to a person.

## Why the chain

Every step is hashed over its own content plus the previous step's digest. The result
is an append-only chain: change any step after the fact and every later digest breaks.
The regulatory literature on agentic systems is blunt that an agent whose actions
cannot be inventoried and replayed cannot satisfy a high-risk compliance regime, and
SEBI's own 5 May 2026 advisory asks REs to plan agentic mitigation *under IT Committee
guidance*. A trace that is itself an audit artifact is the answer to both.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, List, Optional, Sequence

from ..canonical import canonical_sha256
from ..models import (
    AgentFinding,
    AgentId,
    AgentRun,
    AgentStep,
    AgentStepStatus,
    PlannerKind,
)

AGENT_EPOCH = datetime(2026, 7, 22, tzinfo=timezone.utc)

#: A planned call the planner wants to make.
PlannedCall = Dict[str, Any]

#: A tool: takes a keyword payload, returns a JSON-serialisable result.
Tool = Callable[..., Any]


def offline() -> bool:
    return os.environ.get("REGOS_OFFLINE") == "1"


def _timestamp(offset_seconds: int) -> str:
    return (
        (AGENT_EPOCH + timedelta(seconds=offset_seconds)).isoformat().replace("+00:00", "Z")
    )


class ToolRejected(Exception):
    """A tool refused the call. The step is recorded, not hidden."""


class AgentToolbox:
    """The set of tools one agent may call, and nothing else.

    A tool the agent has no business calling is simply absent — the surface is the
    permission model. There is no tool here that writes to a control, and there is no
    way to add one at run time.
    """

    def __init__(self, tools: Dict[str, Tool]) -> None:
        self._tools = dict(tools)

    @property
    def names(self) -> List[str]:
        return sorted(self._tools)

    def call(self, name: str, payload: Dict[str, Any]) -> Any:
        tool = self._tools.get(name)
        if tool is None:
            raise ToolRejected(
                f"{name!r} is not available to this agent. Available: {', '.join(self.names)}"
            )
        return tool(**payload)


class TraceRecorder:
    """Builds the hash chain as the agent works."""

    def __init__(self) -> None:
        self.steps: List[AgentStep] = []

    @property
    def head(self) -> Optional[str]:
        return self.steps[-1].step_sha256 if self.steps else None

    def record(
        self,
        tool: str,
        rationale: str,
        tool_input: Dict[str, Any],
        output: Any,
        status: AgentStepStatus,
        planner: PlannerKind,
    ) -> AgentStep:
        index = len(self.steps)
        input_sha256 = canonical_sha256(tool_input)
        output_sha256 = canonical_sha256(output)
        previous = self.head
        # The digest covers the step's own content *and* its predecessor, so the chain
        # cannot be re-ordered or edited without every later digest failing.
        step_sha256 = canonical_sha256(
            {
                "index": index,
                "tool": tool,
                "input_sha256": input_sha256,
                "output_sha256": output_sha256,
                "status": status.value,
                "planner": planner.value,
                "previous_step_sha256": previous,
            }
        )
        step = AgentStep(
            index=index,
            tool=tool,
            rationale=rationale,
            tool_input=tool_input,
            tool_output_summary=summarise(output),
            status=status,
            planner=planner,
            input_sha256=input_sha256,
            output_sha256=output_sha256,
            previous_step_sha256=previous,
            step_sha256=step_sha256,
        )
        self.steps.append(step)
        return step


def summarise(output: Any) -> str:
    """A short, human-readable account of a tool result. The hash covers the whole."""
    if isinstance(output, dict):
        if "summary" in output:
            return str(output["summary"])
        return ", ".join(f"{key}={_short(value)}" for key, value in sorted(output.items()))
    if isinstance(output, list):
        return f"{len(output)} result(s)"
    return _short(output)


def _short(value: Any) -> str:
    text = str(value)
    return text if len(text) <= 90 else text[:87] + "…"


def verify_chain(steps: Sequence[AgentStep]) -> bool:
    """Recompute every digest. This is what makes the trace evidence rather than a log."""
    previous: Optional[str] = None
    for index, step in enumerate(steps):
        if step.index != index or step.previous_step_sha256 != previous:
            return False
        expected = canonical_sha256(
            {
                "index": step.index,
                "tool": step.tool,
                "input_sha256": step.input_sha256,
                "output_sha256": step.output_sha256,
                "status": step.status.value,
                "planner": step.planner.value,
                "previous_step_sha256": step.previous_step_sha256,
            }
        )
        if expected != step.step_sha256:
            return False
        previous = step.step_sha256
    return True


class Agent:
    """One agent: a goal, a toolbox, a plan, and a gate.

    Subclasses supply :meth:`deterministic_plan` (what to do with no model available)
    and :meth:`gate` (what survives). The loop, the recording and the chain are here.
    """

    agent_id: AgentId
    goal: str
    autonomy: str = "PROPOSE_ONLY — findings require a deterministic gate and a human"
    limitation: str = "Proposes; never writes to a control."

    def __init__(self, toolbox: AgentToolbox) -> None:
        self.toolbox = toolbox

    # -- to implement ---------------------------------------------------- #

    def deterministic_plan(self) -> List[PlannedCall]:
        """The fixed sequence of calls used when no model plan is available."""
        raise NotImplementedError

    def gate(self, results: List[Any]) -> List[AgentFinding]:
        """Turn raw tool results into gated findings. Deterministic, always."""
        raise NotImplementedError

    # -- the loop -------------------------------------------------------- #

    def run(self, plan: Optional[List[PlannedCall]] = None) -> AgentRun:
        planner = PlannerKind.DETERMINISTIC
        if plan is not None:
            planner = PlannerKind.RECORDED
        else:
            plan = self.deterministic_plan()

        recorder = TraceRecorder()
        results: List[Any] = []
        for call in plan:
            tool = str(call["tool"])
            payload = dict(call.get("input", {}))
            rationale = str(call.get("rationale", "")) or "No rationale recorded."
            try:
                output = self.toolbox.call(tool, payload)
                status = AgentStepStatus.OK
            except ToolRejected as error:
                output = {"error": str(error)}
                status = AgentStepStatus.TOOL_ERROR
            except Exception as error:  # a tool failure is evidence, not a crash
                output = {"error": f"{type(error).__name__}: {error}"}
                status = AgentStepStatus.TOOL_ERROR
            recorder.record(tool, rationale, payload, output, status, planner)
            if status == AgentStepStatus.OK:
                results.append(output)

        findings = self.gate(results)
        chain_ok = verify_chain(recorder.steps)
        return AgentRun(
            agent_id=self.agent_id,
            goal=self.goal,
            planner=planner,
            model_id=None,
            prompt_version=None,
            started_at=_timestamp(0),
            completed_at=_timestamp(len(recorder.steps)),
            steps=recorder.steps,
            findings=findings,
            tools_available=self.toolbox.names,
            tool_call_count=len(recorder.steps),
            chain_head_sha256=recorder.head or canonical_sha256({"empty": True}),
            chain_verified=chain_ok,
            autonomy=self.autonomy,
            limitation=self.limitation,
        )


def finding(
    finding_id: str,
    kind: str,
    summary: str,
    detail: str,
    provenance,
    accepted: bool,
    gate_reason: str,
    citations=None,
    requires_human_review: bool = True,
) -> AgentFinding:
    return AgentFinding(
        id=finding_id,
        kind=kind,
        summary=summary,
        detail=detail,
        citations=list(citations or []),
        provenance=provenance,
        accepted_by_gate=accepted,
        gate_reason=gate_reason,
        requires_human_review=requires_human_review,
    )
