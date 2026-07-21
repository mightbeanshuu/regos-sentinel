from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from .canonical import verify_embedded_sha256
from .engine import (
    approve_q17,
    commit_q17_reading,
    resolve_scoped_references,
    run_benchmark,
    run_build,
    set_applicability_scenarios,
    set_qsb_status,
)
from .models import (
    ApplicabilityScenarioPatch,
    EntityProfilePatch,
    LiveSourceVerificationReceipt,
    ReferenceStatus,
    ReviewerReadingRequest,
    ReviewRequest,
    WorkspaceState,
)
from .oscal import generate_assessment_results, validate_assessment_results
from .source_verification import SourceVerificationUnavailable, verify_official_source
from .store import create_store


def create_app(state_path: Optional[Path] = None) -> FastAPI:
    store = create_store(state_path)
    application = FastAPI(
        title="RegOS Sentinel API",
        version="0.1.0",
        description=(
            "Human-supervised regulatory compiler prototype. This API provides decision "
            "support and does not produce legal advice or automated regulatory filings."
        ),
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.get("/health")
    def health() -> dict:
        state = store.load()
        return {
            "status": "ok",
            "service": "regos-sentinel-api",
            "schema_version": state.schema_version,
            "persistence": store.backend,
        }

    @application.get("/api/v1/workspace", response_model=WorkspaceState)
    def workspace() -> WorkspaceState:
        return store.load()

    @application.post(
        "/api/v1/sources/verify-live",
        response_model=LiveSourceVerificationReceipt,
    )
    def verify_live_source() -> LiveSourceVerificationReceipt:
        state = store.load()
        try:
            return verify_official_source(state.source_spans)
        except SourceVerificationUnavailable as error:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Live SEBI source verification is temporarily unavailable. "
                    "The pinned reviewed corpus remains available for the offline demo."
                ),
            ) from error

    @application.post("/api/v1/demo/reset", response_model=WorkspaceState)
    def reset_demo() -> WorkspaceState:
        return store.reset()

    @application.post("/api/v1/builds/run", response_model=WorkspaceState)
    def build() -> WorkspaceState:
        return store.mutate(lambda state: run_build(state, actor="demo.operator"))

    @application.post("/api/v1/reviews/q17/approve", response_model=WorkspaceState)
    def review_q17(request: ReviewRequest) -> WorkspaceState:
        state = store.load()
        if any(review.span_id == "FAQ-Q17-A" for review in state.reviews):
            raise HTTPException(
                status_code=409,
                detail="Q17 already has a persisted review decision.",
            )
        if any(item.status != ReferenceStatus.RESOLVED for item in state.references):
            raise HTTPException(
                status_code=409,
                detail=(
                    "Close the scoped Q15–Q17 source dependencies before approving a policy "
                    "decision."
                ),
            )
        reading = next(
            (item for item in state.reviewer_readings if item.span_id == "FAQ-Q17-A"),
            None,
        )
        if reading is None:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Commit an independent reviewer reading before revealing and "
                    "approving the system suggestion."
                ),
            )
        if (
            reading.reviewer_name != request.reviewer_name
            or reading.trigger_policy != request.trigger_policy
        ):
            raise HTTPException(
                status_code=409,
                detail="Approval must use the same reviewer and policy committed before reveal.",
            )
        return store.mutate(lambda current: approve_q17(current, request))

    @application.post("/api/v1/reviews/q17/reading", response_model=WorkspaceState)
    def commit_review_reading(request: ReviewerReadingRequest) -> WorkspaceState:
        state = store.load()
        if any(item.status != ReferenceStatus.RESOLVED for item in state.references):
            raise HTTPException(
                status_code=409,
                detail="Resolve the cited Q15–Q17 dependencies before recording a reading.",
            )
        if any(item.span_id == "FAQ-Q17-A" for item in state.reviewer_readings):
            raise HTTPException(
                status_code=409,
                detail="An independent Q17 reading is already committed and immutable.",
            )
        return store.mutate(lambda current: commit_q17_reading(current, request))

    @application.post("/api/v1/references/scoped/resolve", response_model=WorkspaceState)
    def resolve_references() -> WorkspaceState:
        state = store.load()
        if all(item.status == ReferenceStatus.RESOLVED for item in state.references):
            raise HTTPException(status_code=409, detail="Scoped references are already resolved.")
        return store.mutate(
            lambda current: resolve_scoped_references(current, actor="demo.operator")
        )

    @application.post(
        "/api/v1/references/q17/resolve",
        response_model=WorkspaceState,
        include_in_schema=False,
    )
    def resolve_reference_compatibility_alias() -> WorkspaceState:
        return resolve_references()

    @application.patch("/api/v1/entity/profile", response_model=WorkspaceState)
    def patch_entity_profile(request: EntityProfilePatch) -> WorkspaceState:
        def operation(state: WorkspaceState) -> WorkspaceState:
            updated = set_qsb_status(state, request.is_qsb, request.reviewer_name)
            updated.latest_manifest = None
            if updated.builds:
                return run_build(updated, actor=request.reviewer_name)
            return updated

        return store.mutate(operation)

    @application.patch("/api/v1/applicability/scenario", response_model=WorkspaceState)
    def patch_applicability_scenario(
        request: ApplicabilityScenarioPatch,
    ) -> WorkspaceState:
        def operation(state: WorkspaceState) -> WorkspaceState:
            updated = set_applicability_scenarios(
                state,
                request.has_second_registration,
                request.has_dormant_license,
                request.reviewer_name,
            )
            updated.latest_manifest = None
            if updated.builds:
                return run_build(updated, actor=request.reviewer_name)
            return updated

        return store.mutate(operation)

    @application.post("/api/v1/benchmarks/run", response_model=WorkspaceState)
    def benchmark() -> WorkspaceState:
        return store.mutate(run_benchmark)

    @application.get("/api/v1/manifests/latest")
    def latest_manifest(download: bool = False) -> Response:
        state = store.load()
        if state.latest_manifest is None:
            raise HTTPException(
                status_code=409,
                detail="No approved Compliance Build Manifest exists. Resolve blocking gates.",
            )
        content = json.dumps(state.latest_manifest.model_dump(mode="json"), indent=2)
        headers = {}
        if download:
            headers["Content-Disposition"] = (
                f'attachment; filename="{state.latest_manifest.build_id.lower()}-manifest.json"'
            )
        return Response(content=content, media_type="application/json", headers=headers)

    @application.post("/api/v1/manifest/verify")
    def verify_manifest(payload: dict) -> dict:
        return verify_embedded_sha256(payload)

    @application.get("/api/v1/exports/oscal/assessment-results")
    def oscal_assessment_results(download: bool = False) -> Response:
        state = store.load()
        try:
            artifact = generate_assessment_results(state)
        except ValueError as error:
            raise HTTPException(status_code=409, detail=str(error)) from error
        validation = validate_assessment_results(artifact)
        if not validation["valid"]:
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "Generated OSCAL artifact failed the pinned NIST schema.",
                    "validation": validation,
                },
            )
        headers = {
            "X-OSCAL-Version": str(validation["schema_version"]),
            "X-OSCAL-Schema-SHA256": str(validation["schema_sha256"]),
        }
        if download:
            headers["Content-Disposition"] = (
                f'attachment; filename="{state.latest_manifest.build_id.lower()}-oscal-ar.json"'
            )
        return Response(
            content=json.dumps(artifact, indent=2),
            media_type="application/json",
            headers=headers,
        )

    @application.get("/api/v1/exports/oscal/validation")
    def oscal_validation() -> dict:
        state = store.load()
        try:
            artifact = generate_assessment_results(state)
        except ValueError as error:
            raise HTTPException(status_code=409, detail=str(error)) from error
        return validate_assessment_results(artifact)

    return application


app = create_app()
