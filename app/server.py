# app/server.py
"""FastAPI app: an SSE chat endpoint plus static frontend serving.

This module is glue only — all orchestration lives in :mod:`app.harness`.
"""
import json
from collections.abc import Iterator
from pathlib import Path

from fastapi import Depends, FastAPI, Query, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sse_starlette.sse import EventSourceResponse

from app.config import load_config
from app.harness import DEFAULT_SYSTEM_PROMPT, Harness
from app.ollama_client import make_client, stream_chat, verify_daemon

WEB_DIR = Path(__file__).resolve().parent.parent / "web"

app = FastAPI(title="Transparent Agent Harness")


@app.middleware("http")
async def always_revalidate(request: Request, call_next):
    """Tell the browser to revalidate on every request (``Cache-Control: no-cache``).

    This is a teaching/demo app whose HTML, CSS and JS are edited constantly and
    shown on screen — caching would make the browser serve a stale UI after an
    edit. ``no-cache`` means "always check with the server", which still returns
    a cheap ``304 Not Modified`` when nothing changed.
    """
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache"
    return response


def get_harness(system: bool = True) -> Harness:
    """Build a Harness wired to the local Ollama daemon (which proxies to cloud).

    Fails loudly via :func:`verify_daemon` if the daemon is down or the model
    isn't pulled. Overridden in tests with a network-free fake.

    :param system: when true (default), the harness adds its standing system
        prompt; when false, only the user's message is sent. Driven by the
        ``?system=`` query param, so the UI's with/without toggle is real.
    """
    cfg = load_config()
    client = make_client(cfg.host)
    verify_daemon(client, cfg.model)

    def chat_fn(request: dict) -> Iterator[dict]:
        return stream_chat(client, request)

    system_prompt = DEFAULT_SYSTEM_PROMPT if system else None
    return Harness(chat_fn=chat_fn, model=cfg.model, system_prompt=system_prompt)


@app.get("/api/chat")
async def chat(
    message: str = Query(...),
    harness: Harness = Depends(get_harness),
) -> EventSourceResponse:
    """Stream the harness event sequence for one user message as SSE."""
    harness.add_user_message(message)

    def event_source():
        for event in harness.run():
            yield {"data": json.dumps(event)}

    return EventSourceResponse(event_source())


@app.get("/")
@app.get("/index.html")
async def root() -> FileResponse:
    """Serve the single-page frontend (at ``/`` and the friendlier ``/index.html``)."""
    return FileResponse(WEB_DIR / "index.html")


@app.get("/favicon.ico")
async def favicon() -> FileResponse:
    """Serve the app icon so the browser's automatic request doesn't 404."""
    return FileResponse(WEB_DIR / "favicon.svg", media_type="image/svg+xml")


# check_dir=False: don't raise at import if web/ is absent; a missing asset 404s
# at request time rather than hiding the cause.
app.mount("/static", StaticFiles(directory=WEB_DIR, check_dir=False), name="static")
