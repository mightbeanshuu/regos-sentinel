from __future__ import annotations

import base64
import hashlib
import hmac
import os
import secrets
import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Callable, Deque, Dict, Optional, Protocol

from .documents import DocumentWorkspace
from .models import WorkspaceState
from .seed import initial_state


class WorkspaceStore(Protocol):
    backend: str

    def load(self) -> WorkspaceState: ...

    def save(self, state: WorkspaceState) -> WorkspaceState: ...

    def mutate(self, operation: Callable[[WorkspaceState], WorkspaceState]) -> WorkspaceState: ...

    def reset(self) -> WorkspaceState: ...


class MemoryStateStore:
    """One isolated, validated workspace held only for a single browser session."""

    backend = "bounded-signed-memory-session"

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._state = initial_state()

    @staticmethod
    def _copy(state: WorkspaceState) -> WorkspaceState:
        return WorkspaceState.model_validate(state.model_dump(mode="json"))

    def load(self) -> WorkspaceState:
        with self._lock:
            return self._copy(self._state)

    def save(self, state: WorkspaceState) -> WorkspaceState:
        with self._lock:
            self._state = self._copy(state)
            return self._copy(self._state)

    def mutate(self, operation: Callable[[WorkspaceState], WorkspaceState]) -> WorkspaceState:
        with self._lock:
            working = self._copy(self._state)
            updated = operation(working)
            self._state = self._copy(updated)
            return self._copy(self._state)

    def reset(self) -> WorkspaceState:
        return self.save(initial_state())


@dataclass
class SessionRecord:
    store: MemoryStateStore
    documents: DocumentWorkspace
    created_at: float
    last_accessed_at: float
    rate_windows: Dict[str, Deque[float]] = field(
        default_factory=lambda: defaultdict(deque)
    )


class SessionManager:
    """Bounded in-memory sessions addressed by tamper-evident opaque tokens.

    A process restart intentionally discards every session. That is the desired demo
    behaviour: the next request receives a fresh seeded synthetic workspace.
    """

    backend = "bounded-signed-memory-sessions"

    def __init__(
        self,
        secret: str,
        ttl_seconds: int = 7_200,
        max_sessions: int = 250,
    ) -> None:
        if len(secret.encode("utf-8")) < 32:
            raise ValueError("REGOS_SESSION_SECRET must contain at least 32 bytes.")
        if ttl_seconds < 60:
            raise ValueError("Session TTL must be at least 60 seconds.")
        if max_sessions < 1:
            raise ValueError("Session capacity must be positive.")
        self._secret = secret.encode("utf-8")
        self.ttl_seconds = ttl_seconds
        self.max_sessions = max_sessions
        self._sessions: Dict[str, SessionRecord] = {}
        self._lock = threading.RLock()

    @property
    def active_sessions(self) -> int:
        with self._lock:
            self._expire(time.monotonic())
            return len(self._sessions)

    def _signature(self, session_id: str) -> str:
        digest = hmac.new(self._secret, session_id.encode("ascii"), hashlib.sha256).digest()
        return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")

    def _token(self, session_id: str) -> str:
        return f"{session_id}.{self._signature(session_id)}"

    def _verified_session_id(self, token: Optional[str]) -> Optional[str]:
        if not token or token.count(".") != 1:
            return None
        session_id, supplied_signature = token.split(".", 1)
        if len(session_id) < 20 or len(session_id) > 80:
            return None
        expected_signature = self._signature(session_id)
        if not hmac.compare_digest(supplied_signature, expected_signature):
            return None
        return session_id

    def _expire(self, now: float) -> None:
        expired = [
            session_id
            for session_id, record in self._sessions.items()
            if now - record.last_accessed_at > self.ttl_seconds
        ]
        for session_id in expired:
            self._sessions.pop(session_id, None)

    def _evict_if_full(self) -> None:
        while len(self._sessions) >= self.max_sessions:
            oldest = min(
                self._sessions,
                key=lambda session_id: self._sessions[session_id].last_accessed_at,
            )
            self._sessions.pop(oldest, None)

    def acquire(self, token: Optional[str]) -> tuple[str, SessionRecord]:
        with self._lock:
            now = time.monotonic()
            self._expire(now)
            session_id = self._verified_session_id(token)
            record = self._sessions.get(session_id) if session_id else None
            if record is None:
                self._evict_if_full()
                session_id = secrets.token_urlsafe(24)
                record = SessionRecord(
                    store=MemoryStateStore(),
                    documents=DocumentWorkspace(),
                    created_at=now,
                    last_accessed_at=now,
                )
                self._sessions[session_id] = record
            else:
                record.last_accessed_at = now
            return self._token(session_id), record

    def allow(self, token: str, scope: str, limit: int, window_seconds: int) -> bool:
        with self._lock:
            session_id = self._verified_session_id(token)
            record = self._sessions.get(session_id) if session_id else None
            if record is None:
                return False
            now = time.monotonic()
            window = record.rate_windows[scope]
            while window and now - window[0] >= window_seconds:
                window.popleft()
            if len(window) >= limit:
                return False
            window.append(now)
            return True


def create_session_manager(secret: Optional[str] = None) -> SessionManager:
    configured_secret = secret or os.environ.get("REGOS_SESSION_SECRET")
    if not configured_secret:
        if os.environ.get("REGOS_ENV") == "production":
            raise RuntimeError("REGOS_SESSION_SECRET is required in production.")
        configured_secret = secrets.token_hex(32)
    ttl_seconds = int(os.environ.get("REGOS_SESSION_TTL_SECONDS", "7200"))
    max_sessions = int(os.environ.get("REGOS_SESSION_MAX_COUNT", "250"))
    return SessionManager(
        configured_secret,
        ttl_seconds=ttl_seconds,
        max_sessions=max_sessions,
    )
