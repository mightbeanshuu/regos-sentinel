"""RegOS's own timing model.

The point of building rather than calling one is that its decisions can be inspected
and its errors bounded. These tests pin both: it must get the class this product exists
to catch, and it must never be the thing that decides.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.agents.tools import analyse_timing
from app.main import create_app
from app.model import load_classifier, model_card
from app.model.dataset import EXAMPLES, LABELS


def client_for() -> TestClient:
    return TestClient(create_app("test-session-secret-that-is-longer-than-thirty-two-bytes"))


def test_the_model_catches_the_shape_the_product_exists_for() -> None:
    """A period with no clock-start is the defect. Missing it makes the model useless."""
    model = load_classifier()
    assert model is not None, "weights.json must be committed"

    label, confidence = model.predict("Critical patches shall be applied within one week.")
    assert label == "PERIOD_ONLY"
    assert confidence > 0.5

    assert model.predict("Close the finding within 90 days of submission of the report.")[0] == (
        "PERIOD_AND_TRIGGER"
    )
    assert model.predict("Vulnerabilities shall be remediated immediately.")[0] == "URGENCY_ONLY"
    assert model.predict("The entity shall appoint a CISO.")[0] == "NO_TIMING"


def test_every_decision_can_be_explained() -> None:
    """The reason for owning the model: it can say why, with weights."""
    model = load_classifier()
    assert model is not None

    explanation = model.explain("Findings shall be closed within three months.")

    assert explanation["label"] == "PERIOD_ONLY"
    assert "duration_without_clock_start" in explanation["features_present"]
    contributions = {item["feature"]: item["weight"] for item in explanation["contributions"]}
    assert contributions["duration_without_clock_start"] > 0, (
        "the feature that names the defect must push towards the defect class"
    )


def test_the_model_agrees_with_the_deterministic_rule_on_the_real_corpus() -> None:
    """Two independent methods. Agreement is evidence; disagreement goes to a person."""
    model = load_classifier()
    assert model is not None
    equivalent = {
        "PERIOD_AND_TRIGGER_STATED": "PERIOD_AND_TRIGGER",
        "PERIOD_WITHOUT_TRIGGER": "PERIOD_ONLY",
        "URGENCY_WITHOUT_PERIOD": "URGENCY_ONLY",
        "NO_TIMING_LANGUAGE": "NO_TIMING",
    }
    real = [item for item in EXAMPLES if not item.synthetic]
    agreed = sum(
        1
        for item in real
        if equivalent.get(analyse_timing(item.text)["verdict"]) == model.predict(item.text)[0]
    )
    # They are built differently and will not agree everywhere; that is the point of
    # having both. What must hold is that they agree on most of the real corpus.
    assert agreed / len(real) >= 0.7


def test_the_model_card_states_its_limits_without_being_asked() -> None:
    card = model_card()

    assert card["training_examples"] == len(EXAMPLES)
    assert set(card["label_counts"]) == set(LABELS)
    assert card["metrics"]["accuracy"] > 0.8
    assert "constructed variations" in card["limitations"]
    assert "never overrules" in card["intended_use"]


def test_the_explain_endpoint_returns_both_verdicts_and_never_picks_a_winner() -> None:
    client = client_for()

    body = client.post(
        "/api/v1/model/explain",
        json={"question": "Critical patches shall be applied within one week."},
    ).json()

    assert body["model"]["label"] == "PERIOD_ONLY"
    assert body["rule"]["verdict"] == "PERIOD_WITHOUT_TRIGGER"
    assert body["agree"] is True
    assert body["model"]["contributions"], "the weights must be shown, not just the label"


def test_the_model_card_is_served() -> None:
    card = client_for().get("/api/v1/model").json()

    assert card["version"].startswith("regos-timing/")
    assert "no network" in card["architecture"].lower()
