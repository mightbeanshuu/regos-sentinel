"""The part a language model actually does: choosing which tool to call next.

Everything else in this package is deterministic on purpose. The corpus search, the
quote verification, the timing analysis and every gate are ordinary Python, because
those are the parts that must be *right*. What is genuinely hard to write down is the
route — given a goal and a set of tools, which call comes next, and when is the job
done. That is what a model is good at, and it is the only thing this module lets one do.

## What a wrong model decision can cost

Nothing that reaches a control. The blast radius is bounded three ways, and each one is
a property rather than an instruction the model is asked to respect:

* **It can only name tools it was given.** An invented tool name is rejected by the
  toolbox, recorded as a failed step, and the run continues. See
  :class:`~app.agents.runtime.AgentToolbox`.
* **Nothing it types can become evidence.** The planner is offered
  :data:`~app.agents.tools.TOOL_SPECS`, which is narrower than the toolbox: every tool
  there either takes an identifier and reads pinned text, or takes a string only to
  have it refuted. The tools that judge prose supplied by the caller —
  :func:`~app.agents.tools.analyse_timing` and
  :func:`~app.agents.tools.compare_span_sets` — are not on it, because a model calling
  those would be grading its own words and a gate downstream would read the verdict as
  a fact about the regulation.
* **It does not decide anything.** The findings are produced by the agent's ``gate``
  from tool output, after the model has stopped. A model that calls the wrong passages
  produces a worse-informed gate, never a differently-reasoned one.

So the honest claim, and the one the interface makes, is: *the model chose the route,
the pinned sources supplied the content, and deterministic gates decided the outcome.*

## Why runs are recorded

A live model is not reproducible, and a demo that needs the network is a demo that
fails in the room. A completed model run is written to a cassette — the exact sequence
of calls it chose — and replayed offline as
:attr:`~app.models.PlannerKind.RECORDED`, which is labelled as a replayed model trace
and never as a live one. With ``REGOS_OFFLINE=1`` nothing here touches the network at
all, and the jury path stays hermetic.
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

from ..models import AgentId
from .tools import planner_visible

PLANNER_PROMPT_VERSION = "regos-agent-planner/v1"

#: Models known to handle this planning job well, best first. Set
#: ``REGOS_PLANNER_MODEL`` to any of them. The first three are paid and need credits on
#: the OpenRouter account; the last is free and is the default so the demo runs on a
#: cold account.
#:
#: Which model plans is an operator decision, and the trace records whichever one
#: actually did — so upgrading is a single environment variable and the audit record
#: tells the truth about it either way.
SOTA_PLANNER_MODELS = (
    "anthropic/claude-sonnet-4.5",
    "openai/gpt-5",
    "google/gemini-2.5-pro",
    "openai/gpt-oss-20b:free",
)

#: A free, tool-calling-capable model, chosen by running the four agents against every
#: free tool-calling model on the account. The differences were large: weaker planners
#: stopped after one call, or looped on a query that had already failed.
#:
#: None of them produced a wrong *finding*, because findings come from the gates. What a
#: weak planner used to cost was coverage — a passage nobody looked at is reported
#: unexamined. :meth:`Agent.run` now closes that gap deterministically after the model
#: stops, so model quality affects how much of the work the model gets credit for, and
#: no longer affects whether the answer is right.
DEFAULT_PLANNER_MODEL = "openai/gpt-oss-20b:free"

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

#: Where a model can be reached, and in which dialect.
#:
#: Most providers speak the OpenAI chat-completions dialect, so one code path drives
#: them all. Google is the exception and is worth the exception: its keys authenticate
#: with an ``x-goog-api-key`` header rather than a bearer token, and its function
#: calling uses ``contents``/``functionDeclarations`` instead of ``messages``/``tools``.
#: It is first in the list because a Google AI Studio key is the strongest planner a
#: team can obtain today without a card or a spend, and a planner that gives up after
#: one call is the difference between the model doing the work and the fixed rules
#: doing it for them.
#:
#: ``OPENAI_API_KEY`` is last and points at OpenRouter deliberately: on this project
#: that variable has always held an ``sk-or-`` key, and honouring the name over the
#: value would post it to OpenAI and fail in a way nobody would diagnose quickly.
PROVIDERS = (
    {
        "env": "GEMINI_API_KEY",
        "url": "https://generativelanguage.googleapis.com/v1beta/models",
        "model": "gemini-flash-latest",
        "label": "Google AI Studio",
        "dialect": "gemini",
    },
    {
        "env": "GOOGLE_API_KEY",
        "url": "https://generativelanguage.googleapis.com/v1beta/models",
        "model": "gemini-flash-latest",
        "label": "Google AI Studio",
        "dialect": "gemini",
    },
    {
        "env": "GROQ_API_KEY",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "model": "llama-3.3-70b-versatile",
        "label": "Groq",
        "dialect": "openai",
    },
    {
        "env": "CEREBRAS_API_KEY",
        "url": "https://api.cerebras.ai/v1/chat/completions",
        "model": "llama-3.3-70b",
        "label": "Cerebras",
        "dialect": "openai",
    },
    {
        "env": "OPENROUTER_API_KEY",
        "url": OPENROUTER_URL,
        "model": "openai/gpt-oss-20b:free",
        "label": "OpenRouter",
        "dialect": "openai",
    },
    {
        "env": "OPENAI_API_KEY",
        "url": OPENROUTER_URL,
        "model": "openai/gpt-oss-20b:free",
        "label": "OpenRouter",
        "dialect": "openai",
    },
)


def resolve_provider() -> Optional[Dict[str, str]]:
    """The first configured provider, or ``None`` if no key is set anywhere."""
    for provider in PROVIDERS:
        key = os.environ.get(provider["env"])
        if key:
            return {**provider, "key": key}
    return None

CASSETTE_DIR = Path(__file__).with_name("cassettes")

#: A hard ceiling on tool calls per run. A planner that will not stop is stopped.
MAX_STEPS = 12

#: Tool output handed back to the model is truncated; the hash covers the whole thing.
MAX_OBSERVATION_CHARS = 3000

#: Longest we will wait out a free-tier rate limit before giving up on the model.
MAX_RETRY_WAIT = 15.0

SYSTEM_PROMPT = """\
You are the planner for one agent inside RegOS Sentinel, a regulatory compliance system \
used by a SEBI-regulated entity. Your only job is to choose which tool to call next.

Rules that define your role:
- You choose the route. You do not decide outcomes. Deterministic gates read the tool \
results after you stop and decide what is true; nothing you say becomes a finding.
- Never compose, paraphrase or guess the content of a regulation. If you need what a \
passage says, call a tool and read it. A quotation you did not read in a tool result \
does not exist.
- Prefer the fewest calls that fully meet the goal, but finish it. If a tool returns a \
list of items to work through, the goal is met only when every item on it has been \
dealt with — not when the first one has.
- Do not repeat a call that already succeeded. If a query returns nothing useful twice, \
accept that the answer is "not present" and move on; that is a valid result, and a gate \
will record it as one.
- When you are done, reply with a one-sentence summary and no tool call.

You are working on behalf of a compliance officer who will be shown every call you \
made, in order, with a hash chain over it. Choose calls you would be willing to defend.\
"""


class PlannerUnavailable(RuntimeError):
    """No model plan could be obtained. The caller falls back and says so."""


def offline() -> bool:
    return os.environ.get("REGOS_OFFLINE") == "1"


def api_key() -> Optional[str]:
    """The key of whichever provider is configured."""
    provider = resolve_provider()
    return provider["key"] if provider else None


def planner_model() -> str:
    """The model to plan with: an explicit override, else the provider's default."""
    override = os.environ.get("REGOS_PLANNER_MODEL")
    if override:
        return override
    provider = resolve_provider()
    return provider["model"] if provider else DEFAULT_PLANNER_MODEL


def planner_provider() -> str:
    provider = resolve_provider()
    return provider["label"] if provider else "none"


# --------------------------------------------------------------------------- #
# Cassettes — a model run, committed, replayable with no network
# --------------------------------------------------------------------------- #


def cassette_path(agent_id: AgentId) -> Path:
    return CASSETTE_DIR / f"{agent_id.value.lower()}.json"


def load_cassette(agent_id: AgentId) -> Optional[Dict[str, Any]]:
    """Return a committed model plan for this agent, if one has been recorded."""
    path = cassette_path(agent_id)
    if not path.exists():
        return None
    cassette = json.loads(path.read_text())
    if cassette.get("prompt_version") != PLANNER_PROMPT_VERSION:
        # A prompt change invalidates the recording; replaying it would misattribute
        # one prompt's choices to another.
        return None
    return cassette


def save_cassette(
    agent_id: AgentId, plan: List[Dict[str, Any]], model_id: str, goal: str
) -> Path:
    CASSETTE_DIR.mkdir(exist_ok=True)
    path = cassette_path(agent_id)
    path.write_text(
        json.dumps(
            {
                "agent_id": agent_id.value,
                "goal": goal,
                "model_id": model_id,
                "prompt_version": PLANNER_PROMPT_VERSION,
                "plan": plan,
            },
            indent=2,
            sort_keys=True,
        )
        + "\n"
    )
    return path


# --------------------------------------------------------------------------- #
# The live planner
# --------------------------------------------------------------------------- #


class ModelPlanner:
    """Asks a model for the next tool call, one call at a time.

    The planner holds the conversation; the agent holds the tools. After each call the
    agent hands back the tool's real output, so the model plans against what the pinned
    sources actually said rather than against what it expected them to say.
    """

    def __init__(
        self,
        goal: str,
        tool_names: List[str],
        model: Optional[str] = None,
        max_steps: int = MAX_STEPS,
        timeout: float = 45.0,
    ) -> None:
        self.goal = goal
        self.model = model or planner_model()
        self.max_steps = max_steps
        self.timeout = timeout
        self.tools = planner_visible(tool_names)
        if not self.tools:
            raise PlannerUnavailable(
                "None of this agent's tools may be offered to a model planner."
            )
        self.model_id: Optional[str] = None
        self.prompt_version = PLANNER_PROMPT_VERSION
        self._messages: List[Dict[str, Any]] = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Goal: {self.goal}\n\n"
                    "Work through it with the tools available to you. Call one tool at "
                    "a time and read each result before choosing the next."
                ),
            },
        ]
        self._pending_call_id: Optional[str] = None
        self._pending_call_name: Optional[str] = None
        #: Google's turns, kept exactly as returned. See ``_post_gemini``.
        self._gemini_contents: List[Dict[str, Any]] = []

    # -- the conversation ------------------------------------------------- #

    def _provider(self) -> Dict[str, str]:
        provider = resolve_provider()
        if offline() or provider is None:
            raise PlannerUnavailable(
                "REGOS_OFFLINE=1"
                if offline()
                else "no model provider key is set on this deployment"
            )
        return provider

    def _send(self, provider: Dict[str, str], url: str, headers: Dict[str, str], body: Any):
        """POST once, and give a rate limit exactly one second chance.

        Every free tier meters requests per minute, and a planner makes several calls in
        quick succession by design — so a 429 mid-run is ordinary rather than
        exceptional, and giving up on the first one throws away a working model. The
        provider usually says how long to wait; that is honoured up to a cap, because a
        demo cannot stall on a minute-long backoff. A second 429 is taken at its word.
        """
        for attempt in (0, 1):
            try:
                response = httpx.post(url, headers=headers, json=body, timeout=self.timeout)
                if response.status_code == 429:
                    if attempt == 0:
                        time.sleep(min(self._retry_after(response), MAX_RETRY_WAIT))
                        continue
                    raise PlannerUnavailable(
                        "the planner model is rate limited right now (HTTP 429). This is "
                        "a quota limit on the free tier, not a fault in the run."
                    )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as error:
                # Keep the first line only; the rest is library boilerplate.
                detail = str(error).strip().splitlines()[0]
                raise PlannerUnavailable(f"{type(error).__name__}: {detail}") from error
        raise PlannerUnavailable("the planner model is rate limited right now (HTTP 429).")

    @staticmethod
    def _retry_after(response: httpx.Response) -> float:
        """However long the provider asked us to wait, in seconds. Default 8."""
        header = response.headers.get("retry-after")
        if header and header.isdigit():
            return float(header)
        try:
            for detail in response.json()["error"].get("details", []):
                delay = str(detail.get("retryDelay", ""))
                if delay.endswith("s") and delay[:-1].replace(".", "", 1).isdigit():
                    return float(delay[:-1])
        except Exception:  # noqa: BLE001 — the default is fine
            pass
        return 8.0

    # -- dialects --------------------------------------------------------- #
    #
    # Both return the same normalised shape — ``{"content": str, "call": {...}|None}`` —
    # so everything above this line is dialect-agnostic. The conversation is kept in the
    # OpenAI shape and translated for Google at send time, because keeping one canonical
    # history is far easier to reason about than maintaining two.

    def _post_openai(self, provider: Dict[str, str]) -> Dict[str, Any]:
        envelope = self._send(
            provider,
            provider["url"],
            {
                "Authorization": f"Bearer {provider['key']}",
                "Content-Type": "application/json",
                # OpenRouter attributes free-tier traffic by these; others ignore them.
                "HTTP-Referer": "https://regos-sentinel.vercel.app",
                "X-Title": "RegOS Sentinel",
            },
            {
                "model": self.model,
                "temperature": 0,
                "max_tokens": 700,
                "tools": [
                    {
                        "type": "function",
                        "function": {
                            "name": tool["name"],
                            "description": tool["description"],
                            "parameters": tool["parameters"],
                        },
                    }
                    for tool in self.tools
                ],
                "tool_choice": "auto",
                "messages": self._messages,
            },
        )
        if "choices" not in envelope:
            raise PlannerUnavailable(f"Planner returned no choices: {str(envelope)[:200]}")
        self.model_id = str(envelope.get("model") or self.model)
        message = envelope["choices"][0]["message"]
        calls = message.get("tool_calls") or []
        if not calls:
            return {"content": message.get("content") or "", "call": None}
        call = calls[0]
        raw = (call.get("function") or {}).get("arguments") or "{}"
        try:
            arguments = json.loads(raw) if isinstance(raw, str) else raw
        except json.JSONDecodeError:
            # Malformed arguments are not repaired. The call goes through empty and the
            # tool rejects it, which is recorded rather than hidden.
            arguments = {}
        return {
            "content": message.get("content") or "",
            "call": {
                "id": call.get("id") or "call_0",
                "name": str((call.get("function") or {}).get("name") or ""),
                "arguments": arguments if isinstance(arguments, dict) else {},
            },
        }

    def _post_gemini(self, provider: Dict[str, str]) -> Dict[str, Any]:
        """Google's own dialect: header auth, ``contents``, ``functionDeclarations``.

        Gemini's own turns are replayed **verbatim** rather than rebuilt from the
        canonical history. Its thinking models attach a ``thoughtSignature`` to each
        ``functionCall``, and reject the next request if the signature does not come
        back with it — so a faithful-looking translation that drops the field produces
        a 400 on the second call and works perfectly on the first, which is a
        memorable way to lose an afternoon. Keeping the model's own bytes sidesteps
        the whole class of problem.
        """
        system = next(
            (m["content"] for m in self._messages if m.get("role") == "system"), ""
        )
        if not self._gemini_contents:
            self._gemini_contents = [
                {"role": "user", "parts": [{"text": m["content"]}]}
                for m in self._messages
                if m.get("role") == "user"
            ]

        body: Dict[str, Any] = {
            "contents": self._gemini_contents,
            "tools": [{
                "functionDeclarations": [
                    {
                        "name": tool["name"],
                        "description": tool["description"],
                        "parameters": tool["parameters"],
                    }
                    for tool in self.tools
                ]
            }],
            "generationConfig": {"temperature": 0, "maxOutputTokens": 700},
        }
        if system:
            body["systemInstruction"] = {"parts": [{"text": system}]}

        envelope = self._send(
            provider,
            f"{provider['url']}/{self.model}:generateContent",
            {"x-goog-api-key": provider["key"], "Content-Type": "application/json"},
            body,
        )
        candidates = envelope.get("candidates") or []
        if not candidates:
            raise PlannerUnavailable(f"Planner returned nothing: {str(envelope)[:200]}")
        self.model_id = str(envelope.get("modelVersion") or self.model)
        content = candidates[0].get("content") or {}
        parts = content.get("parts") or []
        # Verbatim, signatures and all. See the docstring.
        self._gemini_contents.append({"role": "model", "parts": parts})
        text = " ".join(str(part["text"]) for part in parts if "text" in part).strip()
        for part in parts:
            if "functionCall" in part:
                function = part["functionCall"]
                return {
                    "content": text,
                    "call": {
                        "id": function.get("id") or "call_0",
                        "name": str(function.get("name") or ""),
                        "arguments": function.get("args") or {},
                    },
                }
        return {"content": text, "call": None}

    def next_call(self) -> Optional[Dict[str, Any]]:
        """The next planned call, or ``None`` when the model considers the goal met."""
        provider = self._provider()
        reply = (
            self._post_gemini(provider)
            if provider.get("dialect") == "gemini"
            else self._post_openai(provider)
        )
        call = reply["call"]
        if call is None:
            return None

        self._pending_call_id = call["id"]
        self._pending_call_name = call["name"]
        # Keep the turn in the canonical shape so the next request continues cleanly.
        self._messages.append({
            "role": "assistant",
            "content": reply["content"],
            "tool_calls": [{
                "id": call["id"],
                "type": "function",
                "function": {
                    "name": call["name"],
                    "arguments": json.dumps(call["arguments"]),
                },
            }],
        })
        rationale = reply["content"].strip() or f"Model planner chose {call['name']}."
        return {
            "tool": call["name"],
            "input": call["arguments"],
            "rationale": rationale[:400],
        }

    def observe(self, output: Any) -> None:
        """Hand the tool's real output back to the model before it plans again."""
        payload = json.dumps(output, default=str)
        if self._gemini_contents:
            self._gemini_contents.append({
                "role": "user",
                "parts": [{
                    "functionResponse": {
                        "name": self._pending_call_name or "",
                        "response": {"result": payload[:MAX_OBSERVATION_CHARS]},
                    }
                }],
            })
        self._messages.append({
            "role": "tool",
            "tool_call_id": self._pending_call_id or "call_0",
            "name": self._pending_call_name or "",
            "content": payload[:MAX_OBSERVATION_CHARS],
        })
        self._pending_call_id = None
        self._pending_call_name = None
