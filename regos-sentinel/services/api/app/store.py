from __future__ import annotations

import asyncio
import json
import os
import shutil
import threading
from pathlib import Path
from typing import Callable, Optional, Protocol

from psycopg import connect
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from .models import WorkspaceState
from .seed import SCHEMA_VERSION, initial_state


class StateStore:
    """Small, atomic JSON store for a demo that must survive browser refreshes.

    The domain layer is storage-agnostic. A PostgreSQL adapter can replace this
    store without changing the API or engine; JSON is the reliable local default.
    """

    def __init__(self, path: Path) -> None:
        self.backend = "atomic-json-demo"
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        if not self.path.exists():
            self.save(initial_state())
        else:
            payload = json.loads(self.path.read_text(encoding="utf-8"))
            stored_version = payload.get("schema_version", "unknown")
            if stored_version != SCHEMA_VERSION:
                safe_version = str(stored_version).replace("/", "-")
                backup = self.path.with_name(
                    f"{self.path.stem}.schema-{safe_version}.bak{self.path.suffix}"
                )
                if not backup.exists():
                    shutil.copy2(self.path, backup)
                self.save(initial_state())

    def load(self) -> WorkspaceState:
        with self._lock:
            payload = json.loads(self.path.read_text(encoding="utf-8"))
            return WorkspaceState.model_validate(payload)

    def save(self, state: WorkspaceState) -> WorkspaceState:
        with self._lock:
            temporary = self.path.with_suffix(".tmp")
            temporary.write_text(
                state.model_dump_json(indent=2),
                encoding="utf-8",
            )
            temporary.replace(self.path)
            return state

    def mutate(self, operation: Callable[[WorkspaceState], WorkspaceState]) -> WorkspaceState:
        with self._lock:
            state = self.load()
            updated = operation(state)
            return self.save(updated)

    def reset(self) -> WorkspaceState:
        return self.save(initial_state())


class WorkspaceStore(Protocol):
    backend: str

    def load(self) -> WorkspaceState: ...

    def save(self, state: WorkspaceState) -> WorkspaceState: ...

    def mutate(self, operation: Callable[[WorkspaceState], WorkspaceState]) -> WorkspaceState: ...

    def reset(self) -> WorkspaceState: ...


class PostgresStateStore:
    """PostgreSQL JSONB adapter for the same validated workspace contract.

    A single-row document keeps the prototype deterministic while still proving
    transactional persistence on the submitted PostgreSQL/pgvector stack. The
    domain can later be normalized without changing the public API.
    """

    def __init__(self, database_url: str) -> None:
        self.backend = "postgresql-jsonb-pgvector"
        self.database_url = database_url
        self._ensure_schema()

    def _ensure_schema(self) -> None:
        with connect(self.database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS regos_workspace (
                        workspace_id TEXT PRIMARY KEY,
                        state JSONB NOT NULL,
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS regos_workspace_history (
                        history_id BIGSERIAL PRIMARY KEY,
                        workspace_id TEXT NOT NULL,
                        state JSONB NOT NULL,
                        archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        reason TEXT NOT NULL
                    )
                    """
                )
                cursor.execute(
                    """
                    INSERT INTO regos_workspace (workspace_id, state)
                    VALUES ('demo', %s)
                    ON CONFLICT (workspace_id) DO NOTHING
                    """,
                    (Jsonb(initial_state().model_dump(mode="json")),),
                )
                cursor.execute(
                    "SELECT state FROM regos_workspace WHERE workspace_id = 'demo' FOR UPDATE"
                )
                row = cursor.fetchone()
                if row is None:
                    raise RuntimeError("RegOS demo workspace is missing after initialization")
                stored_state = row[0]
                stored_version = stored_state.get("schema_version", "unknown")
                if stored_version != SCHEMA_VERSION:
                    cursor.execute(
                        """
                        INSERT INTO regos_workspace_history (workspace_id, state, reason)
                        VALUES ('demo', %s, %s)
                        """,
                        (
                            Jsonb(stored_state),
                            f"schema transition {stored_version} -> {SCHEMA_VERSION}",
                        ),
                    )
                    cursor.execute(
                        """
                        UPDATE regos_workspace
                        SET state = %s, updated_at = NOW()
                        WHERE workspace_id = 'demo'
                        """,
                        (Jsonb(initial_state().model_dump(mode="json")),),
                    )

    def load(self) -> WorkspaceState:
        with connect(self.database_url, row_factory=dict_row) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT state FROM regos_workspace WHERE workspace_id = 'demo'")
                row = cursor.fetchone()
                if row is None:
                    raise RuntimeError("RegOS demo workspace is missing")
                return WorkspaceState.model_validate(row["state"])

    def save(self, state: WorkspaceState) -> WorkspaceState:
        with connect(self.database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO regos_workspace (workspace_id, state, updated_at)
                    VALUES ('demo', %s, NOW())
                    ON CONFLICT (workspace_id) DO UPDATE
                    SET state = EXCLUDED.state, updated_at = NOW()
                    """,
                    (Jsonb(state.model_dump(mode="json")),),
                )
        return state

    def mutate(self, operation: Callable[[WorkspaceState], WorkspaceState]) -> WorkspaceState:
        with connect(self.database_url, row_factory=dict_row) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT state FROM regos_workspace WHERE workspace_id = 'demo' FOR UPDATE"
                )
                row = cursor.fetchone()
                if row is None:
                    raise RuntimeError("RegOS demo workspace is missing")
                updated = operation(WorkspaceState.model_validate(row["state"]))
                cursor.execute(
                    """
                    UPDATE regos_workspace
                    SET state = %s, updated_at = NOW()
                    WHERE workspace_id = 'demo'
                    """,
                    (Jsonb(updated.model_dump(mode="json")),),
                )
        return updated

    def reset(self) -> WorkspaceState:
        return self.save(initial_state())


class VercelBlobStateStore:
    """Private Blob-backed state for the single-session hosted jury demo.

    PostgreSQL remains the transactional deployment path. This adapter gives the Vercel
    deployment durable private JSON storage and forces uncached reads so function cold starts
    do not discard reviewer decisions.
    """

    def __init__(self, pathname: str) -> None:
        self.backend = "vercel-blob-private-json"
        self.pathname = pathname
        self._lock = threading.RLock()
        payload = self._run(self._read_payload())
        if payload is None:
            self.save(initial_state())
            return
        stored_version = payload.get("schema_version", "unknown")
        if stored_version != SCHEMA_VERSION:
            safe_version = str(stored_version).replace("/", "-")
            history_path = f"regos-sentinel/history/workspace-{safe_version}.json"
            self._run(self._write_payload(history_path, payload))
            self.save(initial_state())

    @staticmethod
    def _run(coroutine):
        return asyncio.run(coroutine)

    @staticmethod
    async def _write_payload(pathname: str, payload: dict) -> None:
        from vercel.blob import AsyncBlobClient

        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        async with AsyncBlobClient() as client:
            await client.put(
                pathname,
                body,
                access="private",
                content_type="application/json",
                overwrite=True,
                cache_control_max_age=60,
            )

    async def _read_payload(self) -> Optional[dict]:
        from vercel.blob import AsyncBlobClient

        async with AsyncBlobClient() as client:
            result = await client.get(self.pathname, access="private", use_cache=False)
            if result is None or result.stream is None:
                return None
            chunks = [chunk async for chunk in result.stream]
        return json.loads(b"".join(chunks).decode("utf-8"))

    def load(self) -> WorkspaceState:
        with self._lock:
            payload = self._run(self._read_payload())
            if payload is None:
                return self.save(initial_state())
            return WorkspaceState.model_validate(payload)

    def save(self, state: WorkspaceState) -> WorkspaceState:
        with self._lock:
            payload = state.model_dump(mode="json")
            self._run(self._write_payload(self.pathname, payload))
            return state

    def mutate(self, operation: Callable[[WorkspaceState], WorkspaceState]) -> WorkspaceState:
        with self._lock:
            state = self.load()
            updated = operation(state)
            return self.save(updated)

    def reset(self) -> WorkspaceState:
        return self.save(initial_state())


def default_state_path() -> Path:
    configured = os.environ.get("REGOS_STATE_PATH")
    if configured:
        return Path(configured).expanduser().resolve()
    return Path(__file__).resolve().parent.parent / "data" / "workspace.json"


def create_store(state_path: Optional[Path] = None) -> WorkspaceStore:
    if state_path is not None:
        return StateStore(state_path)
    database_url = os.environ.get("REGOS_DATABASE_URL")
    if database_url:
        return PostgresStateStore(database_url)
    if os.environ.get("BLOB_READ_WRITE_TOKEN"):
        pathname = os.environ.get(
            "REGOS_BLOB_PATH",
            "regos-sentinel/demo-workspace.json",
        )
        return VercelBlobStateStore(pathname)
    return StateStore(default_state_path())
