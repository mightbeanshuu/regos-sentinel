from __future__ import annotations

import hashlib
import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List
from uuid import NAMESPACE_URL, uuid5

from jsonschema_rs import Draft7Validator

from .models import WorkspaceState

OSCAL_VERSION = "1.2.2"
OSCAL_SCHEMA_URL = (
    "https://github.com/usnistgov/OSCAL/releases/download/v1.2.2/"
    "oscal_assessment-results_schema.json"
)
REGOS_NAMESPACE = "https://regos-sentinel.local/ns/oscal"
SCHEMA_PATH = Path(__file__).parent / "oscal" / "oscal_assessment-results_schema.json"


def _stable_uuid(value: str) -> str:
    return str(uuid5(NAMESPACE_URL, f"regos-sentinel:{value}"))


def _property(name: str, value: str, property_class: str | None = None) -> Dict[str, str]:
    result = {"name": name, "ns": REGOS_NAMESPACE, "value": value}
    if property_class is not None:
        result["class"] = property_class
    return result


@lru_cache(maxsize=1)
def _schema() -> Dict[str, Any]:
    return json.loads(SCHEMA_PATH.read_text())


def generate_assessment_results(state: WorkspaceState) -> Dict[str, Any]:
    if state.latest_manifest is None or not state.builds:
        raise ValueError("An approved Compliance Build Manifest is required for OSCAL export.")

    build = state.builds[-1]
    manifest = state.latest_manifest
    observations: List[Dict[str, Any]] = []
    for test in build.tests:
        observations.append(
            {
                "uuid": _stable_uuid(f"{build.id}:{test.id}"),
                "title": test.name,
                "description": test.message,
                "props": [
                    _property("test-id", test.id, "regos-build-test"),
                    _property("status", test.status, "regos-build-test"),
                    _property(
                        "source-span-ids",
                        ",".join(test.related_span_ids) or "none",
                        "regos-provenance",
                    ),
                ],
                "methods": ["TEST"],
                "types": ["finding"],
                "collected": build.completed_at,
            }
        )

    return {
        "$schema": OSCAL_SCHEMA_URL,
        "assessment-results": {
            "uuid": _stable_uuid(f"assessment-results:{manifest.manifest_sha256}"),
            "metadata": {
                "title": "RegOS Sentinel hero-build assessment results",
                "published": build.completed_at,
                "last-modified": build.completed_at,
                "version": build.id,
                "oscal-version": OSCAL_VERSION,
                "props": [
                    _property("scope", "HERO_BUILD_ONLY", "regos-truth-label"),
                    _property(
                        "data-classification",
                        "PUBLIC_SEBI_SOURCE_AND_SYNTHETIC_ENTITY_DATA",
                        "regos-truth-label",
                    ),
                    _property(
                        "manifest-sha256",
                        manifest.manifest_sha256,
                        "regos-replay",
                    ),
                ],
                "links": [
                    {
                        "href": state.documents[0].source_url,
                        "rel": "source",
                        "media-type": "application/pdf",
                        "text": state.documents[0].title,
                    }
                ],
                "remarks": (
                    "Scoped OSCAL export for the demonstrated build. It is decision-support "
                    "output, not a SEBI filing or an automated compliance certification."
                ),
            },
            "import-ap": {
                "href": f"urn:uuid:{_stable_uuid('hero-assessment-plan')}",
                "remarks": (
                    "The prototype uses a local, scoped assessment-plan identifier; a full "
                    "OSCAL assessment-plan export is outside this round's claim."
                ),
            },
            "results": [
                {
                    "uuid": _stable_uuid(f"result:{build.id}"),
                    "title": f"RegOS Compliance Build {build.id}",
                    "description": (
                        "Deterministic gate results for the human-approved Q15/Q17 hero build."
                    ),
                    "start": build.started_at,
                    "end": build.completed_at,
                    "props": [
                        _property("build-status", build.status.value, "regos-build"),
                        _property("ruleset-version", build.ruleset_version, "regos-build"),
                        _property("schema-version", build.schema_version, "regos-build"),
                    ],
                    "reviewed-controls": {
                        "description": (
                            "Hero controls selected from the scoped CSCRF FAQ and PR.MA.S3 "
                            "dependency set."
                        ),
                        "control-selections": [
                            {
                                "include-controls": [
                                    {"control-id": "pr-ma-s3"},
                                    {"control-id": "vapt-closure"},
                                ]
                            }
                        ],
                    },
                    "observations": observations,
                    "remarks": (
                        "Each observation corresponds to a visible RegOS build gate. Exact "
                        "source locators and human-policy inputs remain in the linked build "
                        "manifest."
                    ),
                }
            ],
        },
    }


def validate_assessment_results(artifact: Dict[str, Any]) -> Dict[str, Any]:
    schema = _schema()
    errors = list(Draft7Validator(schema).iter_errors(artifact))
    schema_bytes = SCHEMA_PATH.read_bytes()
    return {
        "valid": not errors,
        "schema_version": OSCAL_VERSION,
        "schema_url": OSCAL_SCHEMA_URL,
        "schema_sha256": hashlib.sha256(schema_bytes).hexdigest(),
        "validator": "jsonschema-rs.Draft7Validator",
        "error_count": len(errors),
        "errors": [
            {
                "path": str(error.instance_path),
                "message": error.message,
            }
            for error in errors[:20]
        ],
        "scope": "HERO_BUILD_ONLY",
    }
