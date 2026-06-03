# app/server.py
"""FastAPI app: an SSE chat endpoint plus static frontend serving.

This module is glue only — all orchestration lives in :mod:`app.harness`.
"""
import json
from collections.abc import Iterator
from pathlib import Path

from fastapi import Depends, FastAPI, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sse_starlette.sse import EventSourceResponse

from app.config import load_config
from app.harness import Harness
from app.ollama_client import make_client, stream_chat, verify_daemon

WEB_DIR = Path(__file__).resolve().parent.parent / "web"

app = FastAPI(title="Transparent Agent Harness")


def get_harness() -> Harness:
    """Build a Harness wired to the local Ollama daemon (which proxies to cloud).

    Fails loudly via :func:`verify_daemon` if the daemon is down or the model
    isn't pulled. Overridden in tests with a network-free fake.
    """
    cfg = load_config()
    client = make_client(cfg.host)
    verify_daemon(client, cfg.model)

    def chat_fn(request: dict) -> Iterator[dict]:
        return stream_chat(client, request)

    return Harness(chat_fn=chat_fn, model=cfg.model)


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
async def root() -> FileResponse:
    """Serve the single-page frontend."""
    return FileResponse(WEB_DIR / "index.html")


# check_dir=False: don't raise at import if web/ is absent (it's created later in
# the build order); a missing asset will 404 at request time rather than hide the cause.
app.mount("/static", StaticFiles(directory=WEB_DIR, check_dir=False), name="static")
