"""Vercel ASGI entrypoint for the RegOS Sentinel FastAPI service."""

from services.api.app.main import create_app

app = create_app()
