from __future__ import annotations

import json
import os
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from .canonical import verify_embedded_sha256
from .documents import (
    MAX_PAGE_COUNT,
    MAX_UPLOAD_BYTES,
    DocumentRejected,
    DocumentState,
    PassageReviewRequest,
    RequirementApprovalRequest,
    UploadedDocument,
    apply_passage_review,
    approve_requirement,
)
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
from .report import (
    render_before_after_report,
    render_compliance_report,
    render_document_report,
    render_review_packet,
)
from .seed import SCHEMA_VERSION
from .source_verification import SourceVerificationUnavailable, verify_official_source
from .store import DocumentWorkspace, MemoryStateStore, create_session_manager

SESSION_HEADER = "X-RegOS-Session"
SESSION_COOKIE = "regos_session"


def create_app(session_secret: Optional[str] = None) -> FastAPI:
    sessions = create_session_manager(session_secret)
    application = FastAPI(
        title="RegOS Sentinel API",
        version="0.1.0",
        description=(
            "Human-supervised regulatory compiler prototype. This API provides decision "
            "support and does not produce legal advice or automated regulatory filings."
        ),
    )
    configured_origin = os.environ.get("REGOS_WEB_ORIGIN")
    allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    if configured_origin:
        allowed_origins.append(configured_origin.rstrip("/"))
    application.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["Content-Type", SESSION_HEADER],
        expose_headers=[SESSION_HEADER],
    )

    @application.middleware("http")
    async def attach_isolated_session(request: Request, call_next):
        if request.method == "OPTIONS" or request.url.path in {
            "/health",
            "/docs",
            "/openapi.json",
            "/redoc",
        }:
            return await call_next(request)
        supplied_token = request.headers.get(SESSION_HEADER) or request.cookies.get(
            SESSION_COOKIE
        )
        token, record = sessions.acquire(supplied_token)
        request.state.regos_session_token = token
        request.state.regos_store = record.store
        request.state.regos_documents = record.documents
        response = await call_next(request)
        response.headers[SESSION_HEADER] = token
        response.set_cookie(
            SESSION_COOKIE,
            token,
            max_age=sessions.ttl_seconds,
            httponly=True,
            secure=os.environ.get("REGOS_ENV") == "production",
            samesite="none" if os.environ.get("REGOS_ENV") == "production" else "lax",
        )
        return response

    def store_for(request: Request) -> MemoryStateStore:
        return request.state.regos_store

    def documents_for(request: Request) -> DocumentWorkspace:
        return request.state.regos_documents

    def enforce_rate_limit(
        request: Request,
        scope: str,
        limit: int,
        window_seconds: int = 60,
    ) -> None:
        token = request.state.regos_session_token
        if not sessions.allow(token, scope, limit, window_seconds):
            raise HTTPException(
                status_code=429,
                detail="This demo session reached its request limit. Wait one minute and retry.",
            )

    @application.get("/health")
    def health() -> dict:
        return {
            "status": "ok",
            "service": "regos-sentinel-api",
            "schema_version": SCHEMA_VERSION,
            "persistence": sessions.backend,
            "active_sessions": sessions.active_sessions,
            "database_required": False,
        }

    @application.get("/api/v1/workspace", response_model=WorkspaceState)
    def workspace(request: Request) -> WorkspaceState:
        return store_for(request).load()

    @application.post(
        "/api/v1/sources/verify-live",
        response_model=LiveSourceVerificationReceipt,
    )
    def verify_live_source(request: Request) -> LiveSourceVerificationReceipt:
        enforce_rate_limit(request, "verify-live-source", limit=4)
        state = store_for(request).load()
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
    def reset_demo(request: Request) -> WorkspaceState:
        documents_for(request).clear()
        return store_for(request).reset()

    # ------------------------------------------------------------------ #
    # Review your document — a bounded, session-private lane for a PDF
    # the visitor supplies. Deterministic only: no model call, no OCR, no
    # claim that an uploaded file carries official status.
    # ------------------------------------------------------------------ #

    @application.get("/api/v1/documents/limits")
    def document_limits() -> dict:
        return {
            "accepted_types": ["application/pdf"],
            "max_bytes": MAX_UPLOAD_BYTES,
            "max_pages": MAX_PAGE_COUNT,
            "ocr_available": False,
            "model_extraction_available": False,
            "retention": "This browser session only. Uploads are never written to disk.",
        }

    @application.get("/api/v1/documents", response_model=list[UploadedDocument])
    def list_documents(request: Request) -> list[UploadedDocument]:
        return documents_for(request).list()

    @application.post("/api/v1/documents", response_model=UploadedDocument, status_code=201)
    async def upload_document(
        request: Request,
        filename: str = "document.pdf",
        authority: str = "Not stated by the uploader",
    ) -> UploadedDocument:
        enforce_rate_limit(request, "document-upload", limit=6)
        payload = await request.body()
        if len(payload) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413,
                detail=(
                    f"That file is larger than the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB limit "
                    "for this demo. Choose a smaller PDF or an extract of it."
                ),
            )
        safe_name = os.path.basename(filename).strip()[:120] or "document.pdf"
        try:
            return documents_for(request).add(safe_name, payload, authority.strip()[:120])
        except DocumentRejected as error:
            raise HTTPException(status_code=error.status_code, detail=error.message) from error

    @application.get("/api/v1/documents/{document_id}", response_model=UploadedDocument)
    def read_document(request: Request, document_id: str) -> UploadedDocument:
        try:
            return documents_for(request).get(document_id)
        except DocumentRejected as error:
            raise HTTPException(status_code=error.status_code, detail=error.message) from error

    @application.delete("/api/v1/documents/{document_id}", status_code=204)
    def delete_document(request: Request, document_id: str) -> Response:
        try:
            documents_for(request).remove(document_id)
        except DocumentRejected as error:
            raise HTTPException(status_code=error.status_code, detail=error.message) from error
        return Response(status_code=204)

    @application.patch(
        "/api/v1/documents/{document_id}/passages/{passage_id}",
        response_model=UploadedDocument,
    )
    def review_passage(
        request: Request,
        document_id: str,
        passage_id: str,
        payload: PassageReviewRequest,
    ) -> UploadedDocument:
        try:
            return documents_for(request).update(
                document_id,
                lambda document, now: apply_passage_review(document, passage_id, payload, now),
            )
        except DocumentRejected as error:
            raise HTTPException(status_code=error.status_code, detail=error.message) from error

    @application.post(
        "/api/v1/documents/{document_id}/requirements",
        response_model=UploadedDocument,
    )
    def approve_document_requirement(
        request: Request,
        document_id: str,
        payload: RequirementApprovalRequest,
    ) -> UploadedDocument:
        try:
            return documents_for(request).update(
                document_id,
                lambda document, now: approve_requirement(document, payload, now),
            )
        except DocumentRejected as error:
            raise HTTPException(status_code=error.status_code, detail=error.message) from error

    def document_pdf(request: Request, document_id: str, renderer, suffix: str) -> Response:
        try:
            document = documents_for(request).get(document_id)
        except DocumentRejected as error:
            raise HTTPException(status_code=error.status_code, detail=error.message) from error
        try:
            content = renderer(document)
        except ValueError as error:
            raise HTTPException(status_code=409, detail=str(error)) from error
        return Response(
            content=content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{document_id.lower()}-{suffix}.pdf"'
                ),
                "Cache-Control": "private, no-store",
            },
        )

    @application.get("/api/v1/documents/{document_id}/review-packet.pdf")
    def document_review_packet(request: Request, document_id: str) -> Response:
        return document_pdf(request, document_id, render_review_packet, "draft-review-packet")

    @application.get("/api/v1/documents/{document_id}/report.pdf")
    def document_compliance_report(request: Request, document_id: str) -> Response:
        try:
            document = documents_for(request).get(document_id)
        except DocumentRejected as error:
            raise HTTPException(status_code=error.status_code, detail=error.message) from error
        if document.state != DocumentState.APPROVED:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Approve at least one structured requirement before downloading the "
                    "Compliance Build Report. The draft review packet is available now."
                ),
            )
        return document_pdf(request, document_id, render_document_report, "compliance-build-report")

    @application.post("/api/v1/builds/run", response_model=WorkspaceState)
    def build(request: Request) -> WorkspaceState:
        enforce_rate_limit(request, "compliance-build", limit=10)
        return store_for(request).mutate(
            lambda state: run_build(state, actor="demo.operator")
        )

    @application.post("/api/v1/reviews/q17/approve", response_model=WorkspaceState)
    def review_q17(request: Request, payload: ReviewRequest) -> WorkspaceState:
        store = store_for(request)
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
            reading.reviewer_name != payload.reviewer_name
            or reading.trigger_policy != payload.trigger_policy
        ):
            raise HTTPException(
                status_code=409,
                detail="Approval must use the same reviewer and policy committed before reveal.",
            )
        return store.mutate(lambda current: approve_q17(current, payload))

    @application.post("/api/v1/reviews/q17/reading", response_model=WorkspaceState)
    def commit_review_reading(
        request: Request,
        payload: ReviewerReadingRequest,
    ) -> WorkspaceState:
        store = store_for(request)
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
        return store.mutate(lambda current: commit_q17_reading(current, payload))

    @application.post("/api/v1/references/scoped/resolve", response_model=WorkspaceState)
    def resolve_references(request: Request) -> WorkspaceState:
        store = store_for(request)
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
    def resolve_reference_compatibility_alias(request: Request) -> WorkspaceState:
        return resolve_references(request)

    @application.patch("/api/v1/entity/profile", response_model=WorkspaceState)
    def patch_entity_profile(request: Request, payload: EntityProfilePatch) -> WorkspaceState:
        def operation(state: WorkspaceState) -> WorkspaceState:
            updated = set_qsb_status(state, payload.is_qsb, payload.reviewer_name)
            updated.latest_manifest = None
            if updated.builds:
                return run_build(updated, actor=payload.reviewer_name)
            return updated

        return store_for(request).mutate(operation)

    @application.patch("/api/v1/applicability/scenario", response_model=WorkspaceState)
    def patch_applicability_scenario(
        request: Request,
        payload: ApplicabilityScenarioPatch,
    ) -> WorkspaceState:
        def operation(state: WorkspaceState) -> WorkspaceState:
            updated = set_applicability_scenarios(
                state,
                payload.has_second_registration,
                payload.has_dormant_license,
                payload.reviewer_name,
            )
            updated.latest_manifest = None
            if updated.builds:
                return run_build(updated, actor=payload.reviewer_name)
            return updated

        return store_for(request).mutate(operation)

    @application.post("/api/v1/benchmarks/run", response_model=WorkspaceState)
    def benchmark(request: Request) -> WorkspaceState:
        return store_for(request).mutate(run_benchmark)

    @application.get("/api/v1/manifests/latest")
    def latest_manifest(request: Request, download: bool = False) -> Response:
        state = store_for(request).load()
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

    def pdf_response(
        request: Request,
        build_id: str,
        renderer,
        filename_suffix: str,
    ) -> Response:
        state = store_for(request).load()
        if not any(item.id == build_id for item in state.builds):
            raise HTTPException(status_code=404, detail="Build not found in this demo session.")
        try:
            content = renderer(state, build_id)
        except ValueError as error:
            raise HTTPException(status_code=409, detail=str(error)) from error
        return Response(
            content=content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{build_id.lower()}-{filename_suffix}.pdf"'
                ),
                "Cache-Control": "private, no-store",
            },
        )

    @application.get("/api/v1/builds/{build_id}/report.pdf")
    def compliance_build_report(request: Request, build_id: str) -> Response:
        return pdf_response(
            request,
            build_id,
            render_compliance_report,
            "compliance-build-report",
        )

    @application.get("/api/v1/builds/{build_id}/before-after.pdf")
    def before_after_report(request: Request, build_id: str) -> Response:
        return pdf_response(
            request,
            build_id,
            render_before_after_report,
            "before-after",
        )

    @application.post("/api/v1/manifest/verify")
    def verify_manifest(payload: dict) -> dict:
        return verify_embedded_sha256(payload)

    @application.get("/api/v1/exports/oscal/assessment-results")
    def oscal_assessment_results(request: Request, download: bool = False) -> Response:
        state = store_for(request).load()
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
    def oscal_validation(request: Request) -> dict:
        state = store_for(request).load()
        try:
            artifact = generate_assessment_results(state)
        except ValueError as error:
            raise HTTPException(status_code=409, detail=str(error)) from error
        return validate_assessment_results(artifact)

    return application


app = create_app()
