from __future__ import annotations

import hashlib
import json
import os
import queue
import threading
import time
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse

from .agents.crew import CATALOGUE as AGENT_CATALOGUE
from .agents.orchestrator import (
    AUTONOMY,
    blocking_challenges,
    planner_status,
    run_agent,
    run_all_agents,
)
from .agents.tools import analyse_timing
from .answers import ask
from .assurance import build_assurance_report
from .canonical import verify_embedded_sha256
from .cci import compute_cci
from .corpus import corpus_reports
from .doccase import (
    CaseApprovalRequest,
    CaseReadingRequest,
    DocumentCase,
    approval_request_for,
    commit_case_reading,
    generate_case,
    seal_case,
)
from .docscore import DocumentScore, score_document
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
    merge_machine_read_text,
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
from .metrics import measure
from .model import load_classifier, model_card
from .models import (
    AgentCatalogueEntry,
    AgentId,
    AgentRun,
    AiAssuranceReport,
    ApplicabilityScenarioPatch,
    AssistantAnswer,
    AssistantQuestion,
    CciReport,
    CorpusPackReport,
    EntityProfilePatch,
    LiveSourceVerificationReceipt,
    MetricsReport,
    PlannerKind,
    ReferenceStatus,
    ReviewerReadingRequest,
    ReviewRequest,
    ScenarioDefinition,
    ScenarioId,
    ScenarioOutcome,
    WorkspaceState,
)
from .ocr import ocr_available, ocr_pages
from .oscal import generate_assessment_results, validate_assessment_results
from .report import (
    render_before_after_report,
    render_compliance_report,
    render_document_report,
    render_review_packet,
)
from .scenarios import (
    SCENARIO_SET_LABEL,
    SCENARIO_SET_NOTE,
    SCENARIOS,
    SCENARIOS_BY_ID,
    outcome_for,
    run_scenario,
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

    @application.get("/api/v1/live")
    def live_pulse(
        request: Request,
        pulses: int = 20,
        interval_seconds: float = 5.0,
    ) -> StreamingResponse:
        """The control centre's pulse: a bounded server-sent stream of what is true now.

        Every few seconds the stream recomputes a fingerprint of the workspace and the
        handful of numbers a screen left open on a wall needs. Nothing is stored
        between pulses, so the stream cannot drift from the workspace any more than a
        fresh page load can. A client that sees the fingerprint change refetches; a
        client that sees it hold still knows the page it is showing is still true.

        The stream ends itself after a bounded number of pulses and the browser's
        EventSource reconnects, so an abandoned tab can never hold a connection open
        forever — that bound is what makes this safe to run on a small host.
        """
        enforce_rate_limit(request, "live-pulse", limit=12)
        store = store_for(request)
        documents = documents_for(request)
        count = max(1, min(pulses, 60))
        wait = min(max(interval_seconds, 2.0), 30.0)

        def snapshot() -> dict:
            state = store.load()
            build = state.builds[-1] if state.builds else None
            tests = build.tests if build else []
            cci = compute_cci(state)
            # Uploaded documents move the fingerprint too: their identity plus how
            # far a person has taken each one. Without this, an upload or a passage
            # review is invisible to a screen watching the stream.
            doc_facts = "|".join(
                f"{item.id}:{item.sha256}:{item.state.value}"
                f":{sum(1 for p in item.passages if p.reviewed_by)}"
                f":{len(item.requirements)}"
                for item in documents.list()
            )
            return {
                "digest": hashlib.sha256(
                    (state.model_dump_json() + doc_facts).encode("utf-8")
                ).hexdigest()[:16],
                "documents": len(documents.list()),
                "at": datetime.now(timezone.utc).isoformat(),
                "decisions_waiting": sum(1 for item in tests if item.status.value == "BLOCK"),
                "checks_passed": sum(1 for item in tests if item.status.value == "PASS"),
                "checks_total": len(tests),
                "agent_runs": len(state.agent_runs),
                "cci_score": cci.score,
                "cci_band": cci.band,
            }

        def emit():
            opening = {"planner": planner_status(), "interval_seconds": wait, "pulses": count}
            yield f"retry: 4000\nevent: open\ndata: {json.dumps(opening)}\n\n"
            for index in range(count):
                yield f"event: pulse\ndata: {json.dumps(snapshot())}\n\n"
                if index + 1 < count:
                    time.sleep(wait)
            yield f"event: done\ndata: {json.dumps({'reason': 'bounded stream complete'})}\n\n"

        return StreamingResponse(
            emit(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

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
    # Demonstration scenarios A–D. Four cases, one workflow. Case A is the
    # guided review and stays the default path; B, C and D each add a kind
    # of regulatory problem A alone cannot show.
    # ------------------------------------------------------------------ #

    @application.get("/api/v1/scenarios")
    def list_scenarios(request: Request) -> dict:
        state = store_for(request).load()
        return {
            "label": SCENARIO_SET_LABEL,
            "note": SCENARIO_SET_NOTE,
            "scenarios": [item.model_dump(mode="json") for item in SCENARIOS],
            "outcomes": [
                outcome.model_dump(mode="json")
                for outcome in (outcome_for(state, item.id) for item in SCENARIOS)
                if outcome is not None
            ],
        }

    @application.get("/api/v1/scenarios/{scenario_id}", response_model=ScenarioDefinition)
    def read_scenario(scenario_id: ScenarioId) -> ScenarioDefinition:
        return SCENARIOS_BY_ID[scenario_id]

    @application.get(
        "/api/v1/scenarios/{scenario_id}/outcome",
        response_model=ScenarioOutcome,
    )
    def read_scenario_outcome(request: Request, scenario_id: ScenarioId) -> ScenarioOutcome:
        outcome = outcome_for(store_for(request).load(), scenario_id)
        if outcome is None:
            raise HTTPException(
                status_code=409,
                detail="This scenario has not been run in this session yet.",
            )
        return outcome

    @application.post("/api/v1/scenarios/{scenario_id}/run", response_model=WorkspaceState)
    def execute_scenario(request: Request, scenario_id: ScenarioId) -> WorkspaceState:
        enforce_rate_limit(request, "scenario-run", limit=20)
        try:
            return store_for(request).mutate(
                lambda state: run_scenario(state, scenario_id, "demo.operator")
            )
        except ValueError as error:
            raise HTTPException(status_code=409, detail=str(error)) from error

    # ------------------------------------------------------------------ #
    # Agents. They read; deterministic rules decide; a person judges.
    # Every run is recorded as a hash-chained trace.
    # ------------------------------------------------------------------ #

    # ------------------------------------------------------------------ #
    # The index SEBI actually scores an entity on, and an assistant that
    # may only quote the source or decline.
    # ------------------------------------------------------------------ #

    @application.get("/api/v1/model")
    def timing_model_card() -> dict:
        """What RegOS's own model is, how it was measured, and what it must not decide."""
        return model_card()

    @application.post("/api/v1/model/explain")
    def explain_timing(body: AssistantQuestion) -> dict:
        """Classify one sentence, and show the features and weights behind the answer.

        The deterministic rule runs on the same sentence. Both verdicts are returned and
        neither overrules the other — where they disagree, that is the output, and a
        person decides. Two independent methods agreeing is evidence; one silently
        winning is not.
        """
        classifier = load_classifier()
        if classifier is None:
            raise HTTPException(status_code=503, detail="The model weights are not built.")
        model = classifier.explain(body.question)
        rule = analyse_timing(body.question)
        # The rule and the model use different names for the same four outcomes.
        equivalent = {
            "PERIOD_AND_TRIGGER_STATED": "PERIOD_AND_TRIGGER",
            "PERIOD_WITHOUT_TRIGGER": "PERIOD_ONLY",
            "URGENCY_WITHOUT_PERIOD": "URGENCY_ONLY",
            "NO_TIMING_LANGUAGE": "NO_TIMING",
        }
        agree = equivalent.get(rule["verdict"]) == model["label"]
        return {
            "sentence": body.question,
            "model": model,
            "rule": {"verdict": rule["verdict"], "note": rule["note"]},
            "agree": agree,
            "note": (
                "Both methods reached the same answer independently."
                if agree
                else "The model and the fixed rule disagree. Neither overrules the "
                     "other; a person decides, and the disagreement is the finding."
            ),
        }

    @application.get("/api/v1/cci", response_model=CciReport)
    def cyber_capability_index(request: Request) -> CciReport:
        return compute_cci(store_for(request).load())

    @application.post("/api/v1/ask", response_model=AssistantAnswer)
    def ask_assistant(request: Request, body: AssistantQuestion) -> AssistantAnswer:
        enforce_rate_limit(request, "ask", limit=40)
        return ask(body.question, store_for(request).load())

    @application.get("/api/v1/agents", response_model=list[AgentCatalogueEntry])
    def agent_catalogue() -> list[AgentCatalogueEntry]:
        return AGENT_CATALOGUE

    @application.get("/api/v1/agents/runs", response_model=list[AgentRun])
    def agent_runs(request: Request) -> list[AgentRun]:
        return store_for(request).load().agent_runs

    @application.get("/api/v1/agents/planner")
    def agent_planner_status() -> dict:
        """What can plan a run right now, and what runs by default."""
        return planner_status()

    def document_anchor_for(request: Request, document_id: Optional[str]):
        """The uploaded document a run should anchor on, or ``None`` for the corpus."""
        if not document_id:
            return None
        try:
            return documents_for(request).get(document_id)
        except DocumentRejected as error:
            raise HTTPException(status_code=error.status_code, detail=error.message) from error

    @application.post("/api/v1/agents/{agent_id}/run", response_model=WorkspaceState)
    def execute_agent(
        request: Request,
        agent_id: AgentId,
        planner: PlannerKind = PlannerKind.DETERMINISTIC,
        document_id: Optional[str] = None,
    ) -> WorkspaceState:
        """Run one agent.

        ``planner`` asks for a plan source. It is a request, not a guarantee: if a live
        model is unreachable the run falls back and reports the source it actually used,
        because a trace that misnames its own planner is worse than no trace.

        ``document_id`` anchors the run on one uploaded document from this session
        instead of the pinned demo corpus; the recorded run names that anchor.
        """
        enforce_rate_limit(request, "agent-run", limit=20)
        document = document_anchor_for(request, document_id)
        return store_for(request).mutate(
            lambda state: run_agent(
                state,
                agent_id,
                actor="demo.operator",
                planner_kind=planner,
                document=document,
            )
        )

    @application.get("/api/v1/agents/{agent_id}/stream")
    def stream_agent(
        request: Request,
        agent_id: AgentId,
        planner: PlannerKind = PlannerKind.DETERMINISTIC,
        document_id: Optional[str] = None,
    ) -> StreamingResponse:
        """Run one agent, streaming each call and result as it happens.

        This is the same run as the POST endpoint, watched rather than awaited. The
        agent is driven on a worker thread and its events are drained onto the response
        as server-sent events; the workspace is written once, at the end, exactly as it
        would be otherwise. An observer cannot change what the agent finds — the
        callback only reads.
        """
        enforce_rate_limit(request, "agent-run", limit=20)
        document = document_anchor_for(request, document_id)
        store = store_for(request)
        events: queue.Queue[Optional[dict]] = queue.Queue()

        def drive() -> None:
            try:
                store.mutate(
                    lambda state: run_agent(
                        state,
                        agent_id,
                        actor="demo.operator",
                        planner_kind=planner,
                        on_event=events.put,
                        document=document,
                    )
                )
            except Exception as error:  # a failure is reported, not swallowed
                events.put({"event": "error", "message": f"{type(error).__name__}: {error}"})
            finally:
                events.put(None)

        worker = threading.Thread(target=drive, daemon=True)

        def emit():
            yield f"event: open\ndata: {json.dumps({'agent_id': agent_id.value})}\n\n"
            worker.start()
            while True:
                item = events.get()
                if item is None:
                    break
                name = item.get("event", "message")
                payload = json.dumps(item, default=str)
                yield f"event: {name}\ndata: {payload}\n\n"
            worker.join(timeout=5)
            yield f"event: done\ndata: {json.dumps({'agent_id': agent_id.value})}\n\n"

        return StreamingResponse(
            emit(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    @application.post("/api/v1/agents/run-all", response_model=WorkspaceState)
    def execute_all_agents(
        request: Request,
        planner: PlannerKind = PlannerKind.DETERMINISTIC,
        document_id: Optional[str] = None,
    ) -> WorkspaceState:
        enforce_rate_limit(request, "agent-run", limit=20)
        document = document_anchor_for(request, document_id)
        return store_for(request).mutate(
            lambda state: run_all_agents(
                state, actor="demo.operator", planner_kind=planner, document=document
            )
        )

    @application.get("/api/v1/agents/challenges")
    def agent_challenges(request: Request) -> dict:
        state = store_for(request).load()
        landed = blocking_challenges(state)
        return {
            "landed": landed,
            "blocking": bool(landed),
            "autonomy": {key.value: value for key, value in AUTONOMY.items()},
            "note": (
                "A landed challenge blocks publication until a person rules on it. No "
                "agent in this prototype holds a tool that writes to a control."
            ),
        }

    # ------------------------------------------------------------------ #
    # Corpus packs, the eight gates, the AI split, and measured metrics
    # ------------------------------------------------------------------ #

    @application.get("/api/v1/corpus/packs", response_model=list[CorpusPackReport])
    def corpus_packs(request: Request) -> list[CorpusPackReport]:
        return corpus_reports(
            store_for(request).load(),
            uploaded_count=len(documents_for(request).list()),
        )

    @application.get("/api/v1/assurance", response_model=AiAssuranceReport)
    def assurance(request: Request) -> AiAssuranceReport:
        return build_assurance_report(store_for(request).load())

    @application.get("/api/v1/metrics", response_model=MetricsReport)
    def metrics() -> MetricsReport:
        return measure()

    # ------------------------------------------------------------------ #
    # Review your document — a bounded, session-private lane for a PDF
    # the visitor supplies. Deterministic classification, no model call,
    # and no claim that an uploaded file carries official status. Scanned
    # pages are machine-read (OCR) only when a key is configured, and the
    # recovered text is always labelled machine-read.
    # ------------------------------------------------------------------ #

    @application.get("/api/v1/documents/limits")
    def document_limits() -> dict:
        return {
            "accepted_types": ["application/pdf"],
            "max_bytes": MAX_UPLOAD_BYTES,
            "max_pages": MAX_PAGE_COUNT,
            "ocr_available": ocr_available(),
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
            document = documents_for(request).add(safe_name, payload, authority.strip()[:120])
        except DocumentRejected as error:
            raise HTTPException(status_code=error.status_code, detail=error.message) from error
        if document.scope.pages_unreadable and ocr_available():
            # The network call runs here, after the workspace lock has been released —
            # a slow OCR service must never serialize every other request in the
            # session. The merge itself is pure and reacquires the lock briefly.
            recovered = ocr_pages(payload, document.scope.pages_unreadable)
            try:
                document = documents_for(request).update(
                    document.id,
                    lambda working, now: merge_machine_read_text(working, recovered),
                )
            except DocumentRejected as error:
                raise HTTPException(
                    status_code=error.status_code, detail=error.message
                ) from error
        return document

    @application.get("/api/v1/documents/{document_id}", response_model=UploadedDocument)
    def read_document(request: Request, document_id: str) -> UploadedDocument:
        try:
            return documents_for(request).get(document_id)
        except DocumentRejected as error:
            raise HTTPException(status_code=error.status_code, detail=error.message) from error

    @application.get("/api/v1/documents/{document_id}/score", response_model=DocumentScore)
    def score_uploaded_document(request: Request, document_id: str) -> DocumentScore:
        """The committed model read over this document — computed fresh on every call."""
        try:
            document = documents_for(request).get(document_id)
        except DocumentRejected as error:
            raise HTTPException(status_code=error.status_code, detail=error.message) from error
        score = score_document(document)
        if score is None:
            raise HTTPException(
                status_code=503,
                detail="No committed model weights are available in this deployment.",
            )
        return score

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

    # ------------------------------------------------------------------ #
    # The document case — the Case A ritual generated from any upload.
    # Selection is deterministic and disclosed; the reading precedes the
    # reveal; approval resolves to an ordinary signed requirement.
    # ------------------------------------------------------------------ #

    @application.post(
        "/api/v1/documents/{document_id}/case",
        response_model=DocumentCase,
        status_code=201,
    )
    def generate_document_case(request: Request, document_id: str) -> DocumentCase:
        enforce_rate_limit(request, "document-case", limit=30)
        workspace = documents_for(request)
        try:
            existing = workspace.get_case_payload(document_id)
            if existing is not None:
                return DocumentCase.model_validate(existing)
            document = workspace.get(document_id)
            case = generate_case(document, workspace.now())
            workspace.set_case_payload(document_id, case.model_dump(mode="json"))
            return case
        except DocumentRejected as error:
            raise HTTPException(status_code=error.status_code, detail=error.message) from error

    @application.get(
        "/api/v1/documents/{document_id}/case",
        response_model=Optional[DocumentCase],
        responses={204: {"description": "The document exists; no case has been generated yet."}},
    )
    def read_document_case(request: Request, document_id: str) -> Response:
        try:
            payload = documents_for(request).get_case_payload(document_id)
        except DocumentRejected as error:
            # A document that is not in this session genuinely is not found.
            raise HTTPException(status_code=error.status_code, detail=error.message) from error
        if payload is None:
            # A document with no case yet is the ordinary state of every fresh
            # upload, not a missing resource. Answering 404 made the browser log
            # a failed request on every render before a case exists — console
            # noise that reads as a real fault and buries genuine 4xx in any
            # network monitoring. 204 says "asked and answered, nothing here".
            return Response(status_code=204)
        return JSONResponse(DocumentCase.model_validate(payload).model_dump(mode="json"))

    @application.post(
        "/api/v1/documents/{document_id}/case/reading", response_model=DocumentCase
    )
    def commit_document_case_reading(
        request: Request, document_id: str, payload: CaseReadingRequest
    ) -> DocumentCase:
        enforce_rate_limit(request, "document-case", limit=30)
        workspace = documents_for(request)
        try:
            stored = workspace.get_case_payload(document_id)
            if stored is None:
                raise DocumentRejected(404, "Generate the case before committing a reading.")
            case = commit_case_reading(
                DocumentCase.model_validate(stored), payload, workspace.now()
            )
            workspace.set_case_payload(document_id, case.model_dump(mode="json"))
            return case
        except DocumentRejected as error:
            raise HTTPException(status_code=error.status_code, detail=error.message) from error

    @application.post(
        "/api/v1/documents/{document_id}/case/approve", response_model=DocumentCase
    )
    def approve_document_case(
        request: Request, document_id: str, payload: CaseApprovalRequest
    ) -> DocumentCase:
        enforce_rate_limit(request, "document-case", limit=30)
        workspace = documents_for(request)
        try:
            stored = workspace.get_case_payload(document_id)
            if stored is None:
                raise DocumentRejected(404, "Generate the case before approving it.")
            case = DocumentCase.model_validate(stored)
            requirement_request = approval_request_for(case, payload)
            updated = workspace.update(
                document_id,
                lambda document, now: approve_requirement(document, requirement_request, now),
            )
            requirement = next(
                item for item in updated.requirements if item.passage_id == case.passage_id
            )
            case = seal_case(
                case, payload, requirement.id, requirement.blocked_reason, workspace.now()
            )
            workspace.set_case_payload(document_id, case.model_dump(mode="json"))
            return case
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
            # Name the precondition that is actually unmet. This used to say
            # "approve at least one structured requirement" whatever the reason,
            # so on a 205-page framework a reviewer who had approved one was told
            # to do the thing they had just done — the real blocker was seventeen
            # passages still carrying two requirement strengths.
            waiting = document.scope.passages_needing_review
            if waiting:
                detail = (
                    f"{waiting} passage{'' if waiting == 1 else 's'} in this document still "
                    f"carr{'ies' if waiting == 1 else 'y'} more than one requirement strength. "
                    "Record a reading on each before the Compliance Build Report can be "
                    "issued — the report states what was settled, so it cannot be issued "
                    "over an open question. The draft review packet is available now."
                )
            else:
                detail = (
                    "No requirement has been approved from this document yet. Approve at "
                    "least one before downloading the Compliance Build Report. The draft "
                    "review packet is available now."
                )
            raise HTTPException(status_code=409, detail=detail)
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
