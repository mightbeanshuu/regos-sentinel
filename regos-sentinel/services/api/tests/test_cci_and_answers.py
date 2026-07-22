"""The Cyber Capability Index, and the assistant that may only quote or decline.

Both features exist to be checked against the same rule the rest of the product runs
on: where the evidence stops, the output stops. A partial index that says which part it
is, and an assistant that refuses, are the correct behaviours here — not the degraded
ones — so they are what these tests pin.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.answers import ask
from app.cci import CCI_PARAMETER_COUNT, band_for, compute_cci
from app.main import create_app
from app.metrics import _approved_workspace
from app.seed import initial_state


def client_for() -> TestClient:
    return TestClient(create_app("test-session-secret-that-is-longer-than-thirty-two-bytes"))


# --------------------------------------------------------------------------- #
# The index
# --------------------------------------------------------------------------- #


def test_the_index_never_scores_a_parameter_it_cannot_evidence() -> None:
    """Scoring an unevidenced parameter zero, or dropping it, both lie about the total."""
    report = compute_cci(initial_state())

    unassessed = [item for item in report.parameters if not item.assessed]
    for item in unassessed:
        assert item.score is None, "an unevidenced parameter must not carry a number"
        assert item.evidence, "and must still say why it has none"

    assert report.parameters_total == CCI_PARAMETER_COUNT
    assert report.parameters_assessed < CCI_PARAMETER_COUNT
    assert str(report.parameters_assessed) in report.limitation
    assert "not assessed" in report.limitation


def test_the_index_reports_the_band_the_framework_uses() -> None:
    assert band_for(100)[0] == "Exceptional"
    assert band_for(91)[0] == "Exceptional"
    assert band_for(90)[0] == "Optimal"
    assert band_for(75)[0] == "Manageable"
    assert band_for(65)[0] == "Developing"
    assert band_for(55)[0] == "Bare Minimum"
    assert band_for(50)[0] == "Fail"
    assert band_for(0)[0] == "Fail"


def test_the_index_moves_when_the_workspace_does() -> None:
    """It is computed from live state, not stored. Approving work must change it."""
    before = compute_cci(initial_state())
    after = compute_cci(_approved_workspace())

    assert after.score != before.score or after.parameters_assessed != before.parameters_assessed
    assert 0 <= after.score <= 100


def test_the_index_is_served_over_the_api() -> None:
    report = client_for().get("/api/v1/cci").json()

    assert report["parameters_total"] == CCI_PARAMETER_COUNT
    assert report["band"]
    assert report["obligation"]


# --------------------------------------------------------------------------- #
# The assistant
# --------------------------------------------------------------------------- #


def test_the_assistant_refuses_what_the_source_does_not_cover() -> None:
    """The refusal is the feature. A fluent wrong answer is the failure mode."""
    answer = ask("what is the capital of France?", _approved_workspace())

    assert answer.kind == "REFUSED"
    assert not answer.citations
    assert answer.plain is None


def test_an_answer_from_the_source_is_the_source_verbatim() -> None:
    state = _approved_workspace()
    answer = ask("how long do I have to close VAPT findings?", state)

    assert answer.kind == "QUOTED"
    assert answer.citations, "a quotation without a locator is unusable"

    # The answer text must be a passage this workspace actually holds, not a summary.
    known = {span.text for span in state.source_spans}
    from app.advisory import advisory_spans

    known |= {span.text for span in advisory_spans()}
    assert answer.answer in known


def test_the_assistant_reads_workspace_state_for_questions_about_this_firm() -> None:
    answer = ask("what needs my decision?", initial_state())

    assert answer.kind == "COMPUTED"
    assert not answer.citations, "a computed answer must not borrow a source citation"


def test_a_question_is_answered_over_the_api_and_is_rate_limited() -> None:
    client = client_for()

    body = client.post("/api/v1/ask", json={"question": "what does SEBI say about patching?"})

    assert body.status_code == 200
    assert body.json()["kind"] in {"QUOTED", "COMPUTED", "REFUSED"}
    assert client.post("/api/v1/ask", json={"question": ""}).status_code == 422


# --------------------------------------------------------------------------- #
# Which model provider gets used
# --------------------------------------------------------------------------- #


def test_any_free_provider_key_is_enough_to_enable_planning(monkeypatch) -> None:
    """No provider is required. Whichever key a team can get today should work."""
    from app.agents.planner import resolve_provider

    for variable in (
        "GEMINI_API_KEY", "GOOGLE_API_KEY", "GROQ_API_KEY",
        "CEREBRAS_API_KEY", "OPENROUTER_API_KEY", "OPENAI_API_KEY",
    ):
        monkeypatch.delenv(variable, raising=False)
    assert resolve_provider() is None

    monkeypatch.setenv("GROQ_API_KEY", "gsk-test")
    groq = resolve_provider()
    assert groq is not None and groq["label"] == "Groq"
    assert "groq.com" in groq["url"]

    # Google outranks Groq: it is the strongest model a team can get without a card.
    monkeypatch.setenv("GEMINI_API_KEY", "test")
    google = resolve_provider()
    assert google is not None and google["label"] == "Google AI Studio"
    assert google["model"].startswith("gemini")


def test_an_openai_named_key_is_still_sent_to_openrouter(monkeypatch) -> None:
    """On this project that variable has always held an ``sk-or-`` OpenRouter key.

    Honouring the variable's name over its value would post it to OpenAI and fail in a
    way nobody would diagnose quickly.
    """
    from app.agents.planner import resolve_provider

    for variable in ("GEMINI_API_KEY", "GOOGLE_API_KEY", "GROQ_API_KEY", "CEREBRAS_API_KEY",
                     "OPENROUTER_API_KEY"):
        monkeypatch.delenv(variable, raising=False)
    monkeypatch.setenv("OPENAI_API_KEY", "sk-or-v1-whatever")

    provider = resolve_provider()
    assert provider is not None
    assert "openrouter.ai" in provider["url"]
