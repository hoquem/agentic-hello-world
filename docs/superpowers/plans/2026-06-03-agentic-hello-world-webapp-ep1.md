# Transparent Agent Harness Web App (Episode 1 scope) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Superseded in part (2026-06-04):** Episode 1 now (a) talks to a **local** Ollama daemon that proxies to Ollama Cloud — not the cloud directly — and (b) includes a single fixed **system prompt** with a with/without toggle, plus a redesigned UI (animated pipeline + living panels). The harness code in Task 4 below also predates the None-content guard and the `system_prompt` parameter. See `docs/superpowers/plans/2026-06-04-ep1-ui-redesign-system-prompt.md` for the current shape.

**Goal:** Build a radically-transparent web app where a user types a request, a thin Python `Harness` wraps it in a user message, sends it to an Ollama Cloud model, streams the reply back, and displays it — while showing the *literal* JSON sent and the *raw* response received.

**Architecture:** FastAPI backend exposing a Server-Sent-Events endpoint. A single, deliberately-readable `Harness` class owns the message "deck" and emits a typed event stream (`sent` → `received_chunk*` → `display`). The Ollama call is injected as a `chat_fn` dependency so the harness and server are testable without network access. A no-framework vanilla HTML/CSS/JS frontend renders three panels (User / Harness deck / raw wire) using the series' sacred role-color code.

**Tech Stack:** Python 3.13, FastAPI, uvicorn, `ollama` client (pointed at Ollama Cloud), `sse-starlette`, pytest + httpx for tests. Vanilla HTML/CSS/JS frontend. No fallbacks that hide failures — missing config or a failed call surfaces loudly, on screen.

**Scope boundary (Episode 1):** ONE non-looping call. No system prompt, no tools, no multi-turn memory, no planning/reasoning. Those are later episodes that extend `Harness`. Build only what Ep 1 needs, but structure `Harness` so later capabilities are additive.

---

## File Structure

```
agentic-hello-world/
├── app/
│   ├── __init__.py
│   ├── config.py          # env loading; raises loudly if OLLAMA_API_KEY missing
│   ├── ollama_client.py   # build_request() + real client factory + stream_chat()
│   ├── harness.py         # the Harness class — the teaching artifact
│   └── server.py          # FastAPI: SSE /api/chat + static file serving
├── web/
│   ├── index.html         # three-panel layout
│   ├── style.css          # role-colored cards + panel styling
│   └── app.js             # EventSource client; renders deck + SENT/RECEIVED
├── tests/
│   ├── test_config.py
│   ├── test_ollama_client.py
│   ├── test_harness.py
│   └── test_server.py
├── pyproject.toml
├── Makefile               # setup-dev / dev / test / lint (matches user habit)
├── .env.example
└── README.md
```

**Responsibilities:**
- `config.py` — single source of truth for `OLLAMA_API_KEY`, `OLLAMA_HOST`, `MODEL`. Fails fast.
- `ollama_client.py` — builds the exact request dict we display *and* send (transparency invariant: shown == sent); wraps `ollama.Client`.
- `harness.py` — pure orchestration logic, network-free via injected `chat_fn`. The one file a viewer should read end-to-end.
- `server.py` — HTTP/SSE glue only. No business logic.
- `web/*` — presentation only.

---

## Task 1: Project scaffold, dependencies, dev commands

**Files:**
- Create: `pyproject.toml`, `Makefile`, `.env.example`, `app/__init__.py`, `tests/__init__.py`

- [ ] **Step 1: Create `pyproject.toml`**

```toml
[project]
name = "agentic-hello-world"
version = "0.1.0"
description = "A radically-transparent AI agent harness, built one capability at a time."
requires-python = ">=3.13"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.32",
    "ollama>=0.4",
    "sse-starlette>=2.1",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3",
    "httpx>=0.27",
    "ruff>=0.7",
]

[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]

[tool.ruff]
line-length = 100
```

- [ ] **Step 2: Create `Makefile`** (matches the user's universal-command habit)

```makefile
VENV := venv

setup-dev:
	python3 -m venv $(VENV)
	$(VENV)/bin/pip install -e ".[dev]"

dev:  # loads .env so the fail-fast config has its key; errors loudly if .env is missing
	set -a && . ./.env && set +a && $(VENV)/bin/uvicorn app.server:app --reload --port 8000

test:
	$(VENV)/bin/pytest -v

lint:
	$(VENV)/bin/ruff check app tests

clean:
	rm -rf $(VENV) .pytest_cache **/__pycache__
```

- [ ] **Step 3: Create `.env.example`**

```
# Get a key at https://ollama.com/settings/keys
OLLAMA_API_KEY=sk-your-key-here
OLLAMA_HOST=https://ollama.com
MODEL=gpt-oss:120b
```

- [ ] **Step 4: Create empty `app/__init__.py` and `tests/__init__.py`**

```python
# (empty)
```

- [ ] **Step 5: Run setup and verify the toolchain installs**

Run: `make setup-dev && make test`
Expected: venv builds; pytest runs and reports "no tests ran" (exit 5) — acceptable at this stage.

- [ ] **Step 6: Commit**

```bash
git add pyproject.toml Makefile .env.example app/__init__.py tests/__init__.py
git commit -m "chore: scaffold project, deps, and dev commands"
```

---

## Task 2: Config (fail-fast, no fallbacks)

**Files:**
- Create: `app/config.py`
- Test: `tests/test_config.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_config.py
import pytest
from app import config


def test_load_config_reads_env(monkeypatch):
    monkeypatch.setenv("OLLAMA_API_KEY", "sk-test")
    monkeypatch.setenv("MODEL", "gpt-oss:120b")
    monkeypatch.delenv("OLLAMA_HOST", raising=False)
    cfg = config.load_config()
    assert cfg.api_key == "sk-test"
    assert cfg.model == "gpt-oss:120b"
    assert cfg.host == "https://ollama.com"  # default


def test_load_config_raises_when_key_missing(monkeypatch):
    monkeypatch.delenv("OLLAMA_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="OLLAMA_API_KEY"):
        config.load_config()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `make test` (or `venv/bin/pytest tests/test_config.py -v`)
Expected: FAIL — `module app.config has no attribute load_config`.

- [ ] **Step 3: Write minimal implementation**

```python
# app/config.py
"""Application configuration loaded from the environment.

:raises RuntimeError: when a required variable is absent. We fail loudly
    rather than fall back to a default that would hide a misconfiguration.
"""
import os
from dataclasses import dataclass

DEFAULT_HOST = "https://ollama.com"
DEFAULT_MODEL = "gpt-oss:120b"


@dataclass(frozen=True)
class Config:
    """Resolved runtime configuration.

    :param api_key: Ollama Cloud API key (Bearer token).
    :param host: Ollama API host URL.
    :param model: Model name to call, e.g. ``gpt-oss:120b``.
    """

    api_key: str
    host: str
    model: str


def load_config() -> Config:
    """Read configuration from the environment.

    :returns: a populated :class:`Config`.
    :raises RuntimeError: if ``OLLAMA_API_KEY`` is not set.
    """
    api_key = os.environ.get("OLLAMA_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OLLAMA_API_KEY is not set. Copy .env.example to .env and add your key."
        )
    return Config(
        api_key=api_key,
        host=os.environ.get("OLLAMA_HOST", DEFAULT_HOST),
        model=os.environ.get("MODEL", DEFAULT_MODEL),
    )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `venv/bin/pytest tests/test_config.py -v`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add app/config.py tests/test_config.py
git commit -m "feat: fail-fast config loader"
```

---

## Task 3: Ollama request builder (the transparency invariant)

**Files:**
- Create: `app/ollama_client.py`
- Test: `tests/test_ollama_client.py`

The key invariant: the dict we **show** in the SENT panel is byte-for-byte the dict we **pass** to the client. Test the builder; the live client is exercised in Task 6.

- [ ] **Step 1: Write the failing test**

```python
# tests/test_ollama_client.py
from app.ollama_client import build_request


def test_build_request_shape():
    messages = [{"role": "user", "content": "Reply with exactly: Hello World!"}]
    req = build_request(messages, model="gpt-oss:120b")
    assert req == {
        "model": "gpt-oss:120b",
        "messages": [{"role": "user", "content": "Reply with exactly: Hello World!"}],
        "stream": True,
    }


def test_build_request_does_not_alias_messages():
    messages = [{"role": "user", "content": "hi"}]
    req = build_request(messages, model="m")
    req["messages"].append({"role": "user", "content": "mutated"})
    assert len(messages) == 1  # builder must copy, not alias
```

- [ ] **Step 2: Run test to verify it fails**

Run: `venv/bin/pytest tests/test_ollama_client.py -v`
Expected: FAIL — cannot import `build_request`.

- [ ] **Step 3: Write minimal implementation**

```python
# app/ollama_client.py
"""Thin wrapper over the Ollama client.

The request body produced by :func:`build_request` is exactly what is both
shown to the user and sent to the model — there is no hidden transformation.
"""
from collections.abc import Iterator
from copy import deepcopy

from ollama import Client


def build_request(messages: list[dict], model: str, stream: bool = True) -> dict:
    """Build the exact request body sent to the model.

    :param messages: the conversation deck, oldest first.
    :param model: model name, e.g. ``gpt-oss:120b``.
    :param stream: whether to stream the response.
    :returns: a fresh dict (no aliasing of ``messages``).
    """
    return {"model": model, "messages": deepcopy(messages), "stream": stream}


def make_client(host: str, api_key: str) -> Client:
    """Create an Ollama Cloud client.

    :param host: API host, e.g. ``https://ollama.com``.
    :param api_key: Bearer token for the Authorization header.
    """
    return Client(host=host, headers={"Authorization": f"Bearer {api_key}"})


def stream_chat(client: Client, request: dict) -> Iterator[dict]:
    """Stream a chat completion using the prebuilt request body.

    The ``ollama`` client yields ``ChatResponse`` (pydantic) objects. We
    normalise each to a plain dict at this I/O boundary via ``model_dump()`` so
    the raw chunk is JSON-serialisable and can be shown verbatim in the
    RECEIVED panel — preserving the "nothing hidden" invariant on the wire.

    :param client: an Ollama client from :func:`make_client`.
    :param request: the body from :func:`build_request`.
    :yields: each raw response chunk as a plain dict.
    """
    for chunk in client.chat(
        model=request["model"],
        messages=request["messages"],
        stream=request["stream"],
    ):
        yield chunk.model_dump()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `venv/bin/pytest tests/test_ollama_client.py -v`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add app/ollama_client.py tests/test_ollama_client.py
git commit -m "feat: ollama request builder with shown==sent invariant"
```

---

## Task 4: The Harness (the teaching artifact)

**Files:**
- Create: `app/harness.py`
- Test: `tests/test_harness.py`

`Harness` is network-free: it takes a `chat_fn(request) -> Iterator[chunk]`. The server injects the real one; tests inject a fake. It emits a typed event stream the UI mirrors.

- [ ] **Step 1: Write the failing test**

```python
# tests/test_harness.py
from app.harness import Harness


def fake_chat_fn(request):
    # Mimics ollama streaming chunk shape.
    for piece in ["Hello", " World", "!"]:
        yield {"message": {"content": piece}, "done": False}
    yield {"message": {"content": ""}, "done": True}


def test_harness_emits_sent_then_chunks_then_display():
    h = Harness(chat_fn=fake_chat_fn, model="gpt-oss:120b")
    h.add_user_message("Reply with exactly: Hello World!")
    events = list(h.run())

    assert events[0]["type"] == "sent"
    assert events[0]["request"]["messages"][0]["content"] == "Reply with exactly: Hello World!"
    assert events[0]["request"]["model"] == "gpt-oss:120b"

    # RECEIVED carries the raw chunk verbatim (nothing hidden on the wire).
    chunks = [e for e in events if e["type"] == "received_chunk"]
    assert "".join(c["raw"]["message"]["content"] for c in chunks) == "Hello World!"

    assert events[-1] == {"type": "display", "content": "Hello World!"}


def test_harness_appends_assistant_message_to_deck():
    h = Harness(chat_fn=fake_chat_fn, model="m")
    h.add_user_message("hi")
    list(h.run())
    assert h.messages == [
        {"role": "user", "content": "hi"},
        {"role": "assistant", "content": "Hello World!"},
    ]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `venv/bin/pytest tests/test_harness.py -v`
Expected: FAIL — cannot import `Harness`.

- [ ] **Step 3: Write minimal implementation**

```python
# app/harness.py
"""The agent harness.

Episode 1 scope: a single, non-looping call. The harness wraps the user's
words into the message deck, asks the model once, streams the reply, and
decides to display it. Later episodes extend this class — they never change
the model.
"""
from collections.abc import Callable, Iterator

from app.ollama_client import build_request

ChatFn = Callable[[dict], Iterator[dict]]


class Harness:
    """Orchestrates one request/response cycle and emits UI events.

    :param chat_fn: callable taking a request body and yielding raw chunks.
    :param model: model name to call.
    """

    def __init__(self, chat_fn: ChatFn, model: str) -> None:
        self._chat_fn = chat_fn
        self.model = model
        self.messages: list[dict] = []  # the deck

    def add_user_message(self, content: str) -> None:
        """Append a user message to the deck."""
        self.messages.append({"role": "user", "content": content})

    def run(self) -> Iterator[dict]:
        """Run one cycle, yielding typed events.

        :yields: ``sent`` (the exact request), then ``received_chunk`` per
            streamed token, then a final ``display`` event.
        """
        request = build_request(self.messages, self.model)
        yield {"type": "sent", "request": request}

        assembled = ""
        for chunk in self._chat_fn(request):
            assembled += chunk["message"]["content"]
            # Emit every chunk verbatim — including the final empty/done chunk —
            # so the RECEIVED panel shows the literal wire, not a cleaned-up view.
            yield {"type": "received_chunk", "raw": chunk}

        self.messages.append({"role": "assistant", "content": assembled})
        yield {"type": "display", "content": assembled}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `venv/bin/pytest tests/test_harness.py -v`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add app/harness.py tests/test_harness.py
git commit -m "feat: Harness with typed event stream (Ep1 single-call scope)"
```

---

## Task 5: FastAPI SSE endpoint + static serving

**Files:**
- Create: `app/server.py`
- Test: `tests/test_server.py`

The endpoint injects a fake `chat_fn` in tests (via dependency override) so no network is touched. Each SSE event is one harness event serialized as JSON.

- [ ] **Step 1: Write the failing test**

```python
# tests/test_server.py
import json

from fastapi.testclient import TestClient

from app import server
from app.harness import Harness


def fake_chat_fn(request):
    for piece in ["Hello", " World", "!"]:
        yield {"message": {"content": piece}, "done": False}
    yield {"message": {"content": ""}, "done": True}


def make_fake_harness() -> Harness:
    # Model inlined (not a default arg) so FastAPI doesn't treat it as a query param.
    return Harness(chat_fn=fake_chat_fn, model="gpt-oss:120b")


def test_chat_endpoint_streams_events():
    server.app.dependency_overrides[server.get_harness] = make_fake_harness
    try:
        client = TestClient(server.app)
        with client.stream(
            "GET", "/api/chat", params={"message": "Reply with exactly: Hello World!"}
        ) as resp:
            assert resp.status_code == 200
            body = "".join(resp.iter_text())
    finally:
        server.app.dependency_overrides.clear()

    # Collect JSON payloads from the SSE "data:" lines.
    payloads = [
        json.loads(line[len("data:"):].strip())
        for line in body.splitlines()
        if line.startswith("data:")
    ]
    types = [p["type"] for p in payloads]
    assert types[0] == "sent"
    assert types[-1] == "display"
    assert payloads[-1]["content"] == "Hello World!"


def test_root_serves_index():
    client = TestClient(server.app)
    resp = client.get("/")
    assert resp.status_code == 200
    assert "text/html" in resp.headers["content-type"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `venv/bin/pytest tests/test_server.py -v`
Expected: ERROR at collection — `ModuleNotFoundError: No module named 'app.server'` (the module doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

```python
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
from app.ollama_client import make_client, stream_chat

WEB_DIR = Path(__file__).resolve().parent.parent / "web"

app = FastAPI(title="Transparent Agent Harness")


def get_harness() -> Harness:
    """Build a Harness wired to the real Ollama Cloud client.

    Overridden in tests with a network-free fake.
    """
    cfg = load_config()
    client = make_client(cfg.host, cfg.api_key)

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
```

- [ ] **Step 4: Create a placeholder `web/index.html` so the root route resolves**

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Harness</title></head>
<body><p>placeholder — replaced in Task 6</p></body></html>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `venv/bin/pytest tests/test_server.py -v`
Expected: PASS (2 passed).

- [ ] **Step 6: Commit**

```bash
git add app/server.py tests/test_server.py web/index.html
git commit -m "feat: SSE chat endpoint + static serving"
```

---

## Task 6: Live smoke test against Ollama Cloud

**Files:**
- Create: `scripts/smoke_cloud.py`

Confirms the real model returns "Hello World!" and that the on-screen request JSON is accurate — required before any of it is filmed. This is a manual, network-dependent check, not part of `make test`.

- [ ] **Step 1: Write the smoke script**

```python
# scripts/smoke_cloud.py
"""Manual smoke test against Ollama Cloud. Requires OLLAMA_API_KEY.

Run: venv/bin/python scripts/smoke_cloud.py
"""
from app.config import load_config
from app.harness import Harness
from app.ollama_client import make_client, stream_chat


def main() -> None:
    cfg = load_config()
    client = make_client(cfg.host, cfg.api_key)
    h = Harness(chat_fn=lambda req: stream_chat(client, req), model=cfg.model)
    h.add_user_message("Reply with exactly: Hello World!")
    for event in h.run():
        if event["type"] == "sent":
            print("SENT:", event["request"])
        elif event["type"] == "received_chunk":
            print(event["raw"]["message"]["content"], end="", flush=True)
        elif event["type"] == "display":
            print("\nDISPLAY:", event["content"])


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run it (requires a real key in the environment)**

Run: `set -a && source .env && set +a && venv/bin/python scripts/smoke_cloud.py`
Expected: prints the SENT request dict, streams text, and a final `DISPLAY: Hello World!` (model output may vary slightly; confirm the model name and request shape match what the UI will show).

- [ ] **Step 3: Commit**

```bash
git add scripts/smoke_cloud.py
git commit -m "test: live Ollama Cloud smoke script"
```

---

## Task 7: Three-panel frontend (the visual language)

**Files:**
- Modify: `web/index.html` (replace placeholder)
- Create: `web/style.css`, `web/app.js`

No framework. Renders the three panels and the sacred role-color code. Verified visually in the browser (no automated test — presentation layer).

- [ ] **Step 1: Write `web/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Transparent Agent Harness — Hello World</title>
  <link rel="stylesheet" href="/static/style.css" />
</head>
<body>
  <main class="panels">
    <section class="panel" id="user-panel">
      <h2>User</h2>
      <form id="composer">
        <input id="message" value="Reply with exactly: Hello World!" />
        <button type="submit">Send</button>
      </form>
      <div class="output" id="output"></div>
    </section>

    <section class="panel" id="harness-panel">
      <h2>Harness · the deck</h2>
      <div id="deck"></div>
      <div class="decision" id="decision"></div>
    </section>

    <section class="panel" id="wire-panel">
      <h2>LLM · the wire</h2>
      <h3>► SENT</h3>
      <pre id="sent"></pre>
      <h3>◄ RECEIVED</h3>
      <pre id="received"></pre>
    </section>
  </main>
  <script src="/static/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `web/style.css`** (sacred color code from the spec)

```css
:root {
  --system: #f5a623;  /* amber */
  --user: #4a90e2;    /* blue */
  --assistant: #3fae5a;/* green */
  --tool: #9b59b6;    /* purple */
  --bg: #14161a; --fg: #e8e8e8; --panel: #1d2026;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: ui-monospace, monospace; background: var(--bg); color: var(--fg); }
.panels { display: grid; grid-template-columns: 1fr 1.1fr 1.2fr; gap: 1px; height: 100vh; }
.panel { background: var(--panel); padding: 1rem; overflow: auto; }
h2 { font-size: .8rem; text-transform: uppercase; letter-spacing: .1em; opacity: .7; }
#composer { display: flex; gap: .5rem; }
#message { flex: 1; padding: .5rem; background: #0d0f12; color: var(--fg); border: 1px solid #333; }
button { padding: .5rem 1rem; background: var(--user); color: #fff; border: 0; cursor: pointer; }
.output { margin-top: 1rem; font-size: 1.4rem; min-height: 2rem; }
.card { border-left: 4px solid #666; padding: .5rem .75rem; margin: .5rem 0; background: #0d0f12; }
.card.user { border-color: var(--user); }
.card.assistant { border-color: var(--assistant); }
.card .role { font-size: .7rem; text-transform: uppercase; opacity: .6; }
pre { white-space: pre-wrap; word-break: break-word; background: #0d0f12; padding: .75rem; font-size: .8rem; }
.decision { margin-top: 1rem; font-size: .8rem; color: var(--assistant); }
```

- [ ] **Step 3: Write `web/app.js`**

```javascript
const $ = (id) => document.getElementById(id);

function addCard(role, content) {
  const card = document.createElement("div");
  card.className = `card ${role}`;
  card.innerHTML = `<div class="role">${role}</div><div>${content}</div>`;
  $("deck").appendChild(card);
}

$("composer").addEventListener("submit", (e) => {
  e.preventDefault();
  const message = $("message").value;

  // reset panels
  $("deck").innerHTML = "";
  $("output").textContent = "";
  $("sent").textContent = "";
  $("received").textContent = "";
  $("decision").textContent = "";

  addCard("user", message);

  const es = new EventSource(`/api/chat?message=${encodeURIComponent(message)}`);
  es.onmessage = (ev) => {
    const event = JSON.parse(ev.data);
    if (event.type === "sent") {
      $("sent").textContent = JSON.stringify(event.request, null, 2);
    } else if (event.type === "received_chunk") {
      // Show the literal wire: one raw JSON chunk per line.
      $("received").textContent += JSON.stringify(event.raw) + "\n";
    } else if (event.type === "display") {
      addCard("assistant", event.content);
      $("output").textContent = event.content;
      $("decision").textContent = 'decision: display →';
      es.close();
    }
  };
  es.onerror = () => {  // surface failures; do not hide them
    $("decision").textContent = "error: stream failed (see server logs)";
    es.close();
  };
});
```

- [ ] **Step 4: Verify in the browser**

Run: `set -a && source .env && set +a && make dev`, then open `http://localhost:8000`, click **Send**.
Expected: a blue user card appears in the deck; the SENT panel shows the exact request JSON; the RECEIVED panel fills with raw JSON chunks line-by-line; a green assistant card and the large output both show the assembled reply.

- [ ] **Step 5: Commit**

```bash
git add web/index.html web/style.css web/app.js
git commit -m "feat: three-panel transparent frontend (Ep1)"
```

---

## Task 8: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# Transparent Agent Harness

The "for real" companion app for the *Building an AI Agent from Zero* video
series. A user request is wrapped by a thin `Harness`, sent to an Ollama Cloud
model, and streamed back — with the literal request JSON and raw response shown
on screen. Nothing hidden.

## Setup

1. `make setup-dev`
2. `cp .env.example .env` and add your key from https://ollama.com/settings/keys
3. `set -a && source .env && set +a && make dev`
4. Open http://localhost:8000

## Test

`make test`

## Episode scope

Episode 1 = one non-looping call. Later episodes extend `app/harness.py`
(system prompt, tools, memory, planning, reasoning). The model never changes;
every capability lives in the harness.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with setup and episode scope"
```

---

## Done criteria

- `make test` is green (config, ollama_client, harness, server).
- `scripts/smoke_cloud.py` prints a real `DISPLAY:` line from the cloud model.
- The browser shows all three panels updating live, with SENT == the actual request.
- `app/harness.py` reads cleanly end-to-end as a teaching artifact.
```

