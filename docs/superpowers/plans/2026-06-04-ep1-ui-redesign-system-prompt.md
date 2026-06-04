# Episode 1 — UI Redesign + Functional System-Prompt Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Episode 1 web UI into an animated three-stage flow (You → Harness → Ollama) and add a real system-prompt capability with a with/without toggle that actually changes what is sent.

**Architecture:** Unchanged backbone — FastAPI SSE endpoint, a network-free `Harness` (injected `chat_fn`), and a vanilla HTML/CSS/JS frontend, all talking to a local Ollama daemon that proxies to Ollama Cloud. Changes are confined to `app/harness.py`, `app/server.py`, and `web/`.

**Tech Stack:** Python 3.13, FastAPI, sse-starlette, `ollama` client, pytest + httpx. Vanilla HTML/CSS/JS (no framework).

**Spec:** `docs/superpowers/specs/2026-06-04-ep1-ui-redesign-system-prompt-design.md`

> **TEACHING-GRADE CODE (applies to every task):** This code is shown on camera and shared; viewers read it. Prefer the most obvious top-to-bottom implementation; no abstractions beyond Episode 1's needs (YAGNI). Comments explain the *why* in plain, jargon-light English. reStructuredText docstrings (`:param:`/`:returns:`/`:raises:`). `app/harness.py` and `web/app.js` especially must read cleanly end-to-end. No fallbacks that hide failures. **Type the code in this plan verbatim** — it was written to this standard.

---

## File Structure

| File | Change | Responsibility |
|------|--------|----------------|
| `app/harness.py` | Modify | Add optional `system_prompt` (deck starts with it) + `DEFAULT_SYSTEM_PROMPT`. |
| `app/server.py` | Modify | `?system=` query param → harness; serve `/index.html`; serve `/favicon.ico`. |
| `web/favicon.svg` | Create | Tiny app icon (kills the silent favicon 404). |
| `web/index.html` | Rebuild | Pipeline header + three panels markup + toggle. |
| `web/style.css` | Rebuild | Theme, pipeline node/segment states + animation, panels, role colors. |
| `web/app.js` | Rebuild | EventSource client: render SENT + deck-from-sent + raw RECEIVED, drive pipeline phases, live answer, working toggle. |
| `tests/test_harness.py` | Modify | With/without system-prompt deck shape. |
| `tests/test_server.py` | Modify | `system` flag effect on SENT; `/`, `/index.html`, `/favicon.ico` routes. |
| docs | Modify | Reconcile prior plan's "no system prompt" note + series spec's direct-cloud wording. |

`config.py` and `ollama_client.py` are **unchanged**.

---

## Task 1: Harness — optional system prompt

**Files:**
- Modify: `app/harness.py`
- Test: `tests/test_harness.py`

- [ ] **Step 1: Add the failing tests**

Append these two tests to `tests/test_harness.py` (keep the existing tests and the existing `fake_chat_fn` unchanged):

```python
def test_harness_prepends_system_prompt_to_deck():
    h = Harness(chat_fn=fake_chat_fn, model="m", system_prompt="be brief")
    h.add_user_message("hi")
    events = list(h.run())

    # The system message must be first, then the user message — and the SENT
    # request must show exactly that (nothing added in secret).
    assert events[0]["type"] == "sent"
    assert events[0]["request"]["messages"] == [
        {"role": "system", "content": "be brief"},
        {"role": "user", "content": "hi"},
    ]


def test_harness_without_system_prompt_sends_only_user():
    h = Harness(chat_fn=fake_chat_fn, model="m")  # no system prompt
    h.add_user_message("hi")
    events = list(h.run())

    assert events[0]["request"]["messages"] == [{"role": "user", "content": "hi"}]
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `venv/bin/pytest tests/test_harness.py -v`
Expected: the two new tests FAIL with `TypeError: __init__() got an unexpected keyword argument 'system_prompt'`.

- [ ] **Step 3: Write the implementation**

Replace the entire contents of `app/harness.py` with:

```python
# app/harness.py
"""The agent harness.

Episode 1 scope: a single, non-looping call. The harness takes the user's
message, optionally puts a *system prompt* in front of it (a standing
instruction the user never types), sends the whole deck to the model once,
streams the reply, and decides to display it. Later episodes extend this
class — they never change the model.
"""
from collections.abc import Callable, Iterator

from app.ollama_client import build_request

ChatFn = Callable[[dict], Iterator[dict]]

# The harness's one built-in instruction for Episode 1. The user never types
# this; the harness adds it so the model behaves predictably. Turn it off (see
# app/server.py) and only the user's words are sent — so you can SEE the effect.
DEFAULT_SYSTEM_PROMPT = "Reply with exactly what the user typed, and nothing else."


class Harness:
    """Orchestrates one request/response cycle and emits UI events.

    :param chat_fn: callable taking a request body and yielding raw chunks.
    :param model: model name to call.
    :param system_prompt: optional standing instruction placed before the user
        message. When ``None``, only the user's message is sent.
    """

    def __init__(
        self, chat_fn: ChatFn, model: str, system_prompt: str | None = None
    ) -> None:
        self._chat_fn = chat_fn
        self.model = model
        # The deck is the full list of messages we will send. If there is a
        # system prompt, it goes first — so the request we send (and show on
        # screen) already contains it. Nothing is added later in secret.
        self.messages: list[dict] = []
        if system_prompt:
            self.messages.append({"role": "system", "content": system_prompt})

    def add_user_message(self, content: str) -> None:
        """Append a user message to the deck.

        :param content: the user's text to wrap as a ``user`` message.
        """
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
            content = chunk["message"]["content"]
            if content:  # None or "" = no display text in this chunk (e.g. a thinking-only or done chunk)
                assembled += content
            # Emit every chunk verbatim — including the empty/done/thinking chunks —
            # so the RECEIVED panel shows the literal wire, not a cleaned-up view.
            yield {"type": "received_chunk", "raw": chunk}

        self.messages.append({"role": "assistant", "content": assembled})
        yield {"type": "display", "content": assembled}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `venv/bin/pytest tests/test_harness.py -v`
Expected: PASS (all harness tests, including the existing ones).

- [ ] **Step 5: Commit**

```bash
git add app/harness.py tests/test_harness.py
git commit -m "feat: optional system prompt on the harness (deck starts with it)"
```

---

## Task 2: Server — system toggle param, robust routing, favicon

**Files:**
- Modify: `app/server.py`
- Create: `web/favicon.svg`
- Test: `tests/test_server.py`

- [ ] **Step 1: Create `web/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><text y="26" font-size="26">🦙</text></svg>
```

- [ ] **Step 2: Write the failing tests**

Replace the entire contents of `tests/test_server.py` with:

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


def fake_get_harness(system: bool = True) -> Harness:
    # Mirrors the real get_harness mapping, but network-free: the `system` query
    # param decides whether a system prompt is configured.
    system_prompt = "SYSTEM PROMPT" if system else None
    return Harness(chat_fn=fake_chat_fn, model="m", system_prompt=system_prompt)


def _sent_messages(body: str) -> list[dict]:
    """Pull the `sent` event's request messages out of an SSE response body."""
    for line in body.splitlines():
        if line.startswith("data:"):
            payload = json.loads(line[len("data:"):].strip())
            if payload["type"] == "sent":
                return payload["request"]["messages"]
    raise AssertionError("no 'sent' event found in stream")


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

    payloads = [
        json.loads(line[len("data:"):].strip())
        for line in body.splitlines()
        if line.startswith("data:")
    ]
    types = [p["type"] for p in payloads]
    assert types[0] == "sent"
    assert types[-1] == "display"
    assert payloads[-1]["content"] == "Hello World!"


def test_system_true_includes_system_message():
    server.app.dependency_overrides[server.get_harness] = fake_get_harness
    try:
        client = TestClient(server.app)
        with client.stream(
            "GET", "/api/chat", params={"message": "hi", "system": "true"}
        ) as resp:
            body = "".join(resp.iter_text())
    finally:
        server.app.dependency_overrides.clear()

    roles = [m["role"] for m in _sent_messages(body)]
    assert roles == ["system", "user"]


def test_system_false_omits_system_message():
    server.app.dependency_overrides[server.get_harness] = fake_get_harness
    try:
        client = TestClient(server.app)
        with client.stream(
            "GET", "/api/chat", params={"message": "hi", "system": "false"}
        ) as resp:
            body = "".join(resp.iter_text())
    finally:
        server.app.dependency_overrides.clear()

    roles = [m["role"] for m in _sent_messages(body)]
    assert roles == ["user"]


def test_root_and_index_serve_html():
    client = TestClient(server.app)
    for path in ["/", "/index.html"]:
        resp = client.get(path)
        assert resp.status_code == 200
        assert "text/html" in resp.headers["content-type"]


def test_favicon_served():
    client = TestClient(server.app)
    resp = client.get("/favicon.ico")
    assert resp.status_code == 200
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `venv/bin/pytest tests/test_server.py -v`
Expected: the new tests FAIL — `system` flag not honored (system message present in both cases) and `/index.html` / `/favicon.ico` return 404.

- [ ] **Step 4: Write the implementation**

Replace the entire contents of `app/server.py` with:

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
from app.harness import DEFAULT_SYSTEM_PROMPT, Harness
from app.ollama_client import make_client, stream_chat, verify_daemon

WEB_DIR = Path(__file__).resolve().parent.parent / "web"

app = FastAPI(title="Transparent Agent Harness")


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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `venv/bin/pytest tests/test_server.py -v`
Expected: PASS (6 tests). Then run the full suite: `venv/bin/pytest -q` → all green.

- [ ] **Step 6: Commit**

```bash
git add app/server.py tests/test_server.py web/favicon.svg
git commit -m "feat: ?system= toggle param, /index.html + /favicon.ico routes"
```

---

## Task 3: Frontend rebuild (pipeline + living panels + working toggle)

**Files:**
- Rebuild: `web/index.html`, `web/style.css`, `web/app.js`

Presentation layer — no automated test. Verified live in the browser. Type all three files verbatim.

- [ ] **Step 1: Write `web/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Transparent Agent Harness — Hello World</title>
  <link rel="icon" href="/favicon.ico" />
  <link rel="stylesheet" href="/static/style.css" />
</head>
<body>
  <!-- Top bar: what this is, and a live status of where we are in the flow. -->
  <header class="bar">
    <span class="title">Transparent Agent Harness</span>
    <span class="by">· running on Ollama</span>
    <span class="state" id="state">ready</span>
  </header>

  <!-- The pipeline: the mental model of the journey, You -> Harness -> Ollama.
       Nodes light up as each stage completes; the segment between them animates
       in the direction data is moving (blue out, teal back). -->
  <section class="pipe">
    <div class="node user" id="node-user" data-state="idle">
      <div class="badge">🧑</div><div class="lbl">You</div><div class="sub">your message</div>
    </div>
    <div class="seg" id="seg-out"><span class="dir">harness adds system prompt &amp; sends ▶</span></div>
    <div class="node harness" id="node-harness" data-state="idle">
      <div class="badge">⚙️</div><div class="lbl">Harness</div><div class="sub">builds the deck</div>
    </div>
    <div class="seg back" id="seg-in"><span class="dir">◀ tokens streaming back</span></div>
    <div class="node ollama" id="node-ollama" data-state="idle">
      <div class="badge">🦙</div><div class="lbl">Ollama</div>
      <div class="mode"><span>local</span><span class="cloud act">cloud</span></div>
      <div class="sub">kimi-k2.6:cloud</div>
    </div>
  </section>

  <!-- The three panels: you, the harness deck, and the raw wire. -->
  <main class="panels">
    <section class="panel" id="user-panel">
      <h2>You</h2>
      <form id="composer">
        <input id="message" value="Hello World!" autocomplete="off" />
        <button type="submit">Send</button>
      </form>
      <div class="ans-lab">Answer</div>
      <div class="answer" id="answer"></div>
    </section>

    <section class="panel" id="harness-panel">
      <h2>
        Harness · the deck
        <span class="sp-label">system prompt</span>
        <!-- Real toggle: flips whether the harness adds its system prompt. -->
        <span class="toggle" id="toggle" data-on="with" title="Toggle the system prompt on/off">
          <span class="opt with">with</span><span class="opt without">without</span>
        </span>
      </h2>
      <div class="explain">
        The harness wraps your message in a <b>system prompt</b> before sending.
        The model is stateless — this standing instruction is how the harness
        sets its behavior. You never type it.
      </div>
      <div id="deck"></div>
      <div class="decision" id="decision"></div>
    </section>

    <section class="panel" id="wire-panel">
      <h2>LLM · the wire</h2>
      <h3>▸ SENT to Ollama</h3>
      <pre id="sent"></pre>
      <h3>◂ RECEIVED <span class="muted">(raw chunks)</span></h3>
      <div id="received"></div>
    </section>
  </main>

  <script src="/static/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `web/style.css`**

```css
/* web/style.css — the sacred role colors + the animated pipeline + panels. */
:root {
  --system: #f5a623;     /* amber  — system messages / harness */
  --user: #4a90e2;       /* blue   — user messages / outbound */
  --assistant: #3fae5a;  /* green  — assistant messages */
  --thinking: #b07cd6;   /* purple — model reasoning tokens */
  --cloud: #4ec9b0;      /* teal   — the model / inbound tokens */
  --bg: #14161a; --fg: #e8e8e8; --panel: #1d2026; --line: #2a2e37; --ink: #0d0f12;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: ui-monospace, monospace; background: var(--bg); color: var(--fg);
       display: flex; flex-direction: column; height: 100vh; }

/* ---- top bar ---- */
.bar { display: flex; align-items: center; gap: 12px; padding: 13px 20px;
       border-bottom: 1px solid var(--line); background: #1a1d23; }
.bar .title { font-size: .92rem; text-transform: uppercase; letter-spacing: .12em; color: #aeb6c2; font-weight: 600; }
.bar .by { font-size: .72rem; color: #6f7884; }
.state { margin-left: auto; font-size: .9rem; color: var(--cloud); }

/* ---- pipeline ---- */
.pipe { display: flex; align-items: flex-start; padding: 22px 26px 20px; border-bottom: 1px solid var(--line); }
.node { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 130px; }
.node .badge { width: 58px; height: 58px; border-radius: 15px; display: flex; align-items: center;
               justify-content: center; font-size: 1.85rem; background: var(--panel);
               border: 2px solid #333a45; transition: all .2s; }
.node .lbl { font-size: .96rem; color: var(--fg); font-weight: 600; }
.node .sub { font-size: .76rem; color: #9fb3c8; }
/* node states, set by app.js via data-state */
.node[data-state="active"] .badge { border-color: var(--cloud);
  box-shadow: 0 0 0 4px rgba(78,201,176,.18), 0 0 20px rgba(78,201,176,.4); animation: breathe 1.3s ease-in-out infinite; }
.node[data-state="done"] .badge { border-color: var(--assistant); }
.node[data-state="done"] .badge::after { content: "✓"; position: absolute; top: -8px; right: -8px;
  font-size: .8rem; background: var(--assistant); color: #08120a; border-radius: 50%; width: 18px; height: 18px;
  display: flex; align-items: center; justify-content: center; }
@keyframes breathe { 0%,100% { opacity: .4 } 50% { opacity: 1 } }

.mode { display: inline-flex; border: 1px solid var(--line); border-radius: 999px; overflow: hidden; font-size: .6rem; letter-spacing: .05em; }
.mode span { padding: 3px 9px; color: #6f7884; text-transform: uppercase; }
.mode .cloud.act { background: var(--cloud); color: #08221d; font-weight: 700; }

/* segments: a track with a moving pulse shown only while data flows */
.seg { flex: 1; height: 4px; margin: 29px 6px 0; position: relative; background: var(--line); border-radius: 2px; overflow: hidden; }
.seg .dir { position: absolute; top: -19px; left: 50%; transform: translateX(-50%); font-size: .7rem; color: #8a93a3; white-space: nowrap; }
.seg::after { content: ""; position: absolute; top: 0; height: 100%; width: 38%; border-radius: 2px; opacity: 0; }
.seg[data-flow="on"]::after { opacity: 1; background: linear-gradient(90deg, transparent, var(--user), transparent); animation: flowright 1.5s linear infinite; }
.seg.back[data-flow="on"]::after { background: linear-gradient(90deg, transparent, var(--cloud), transparent); animation: flowleft 1.4s linear infinite; }
@keyframes flowright { 0% { left: -40% } 100% { left: 100% } }
@keyframes flowleft  { 0% { left: 100% } 100% { left: -40% } }

/* ---- panels ---- */
.panels { display: grid; grid-template-columns: 1fr 1.2fr 1.3fr; flex: 1; min-height: 0; }
.panel { padding: 17px; border-right: 1px solid var(--line); overflow: auto; }
.panel:last-child { border-right: 0; }
h2 { font-size: .8rem; text-transform: uppercase; letter-spacing: .1em; color: #8a93a3; margin: 0 0 12px;
     display: flex; align-items: center; gap: 8px; }
h3 { font-size: .78rem; color: #8a93a3; margin: 14px 0 5px; font-weight: 600; }
.muted { color: #6f7884; }

/* you panel */
#composer { display: flex; gap: 8px; }
#message { flex: 1; background: var(--ink); border: 1px solid #333a45; border-radius: 7px; padding: 10px 12px; font-size: .92rem; color: #cfd6df; font-family: inherit; }
button { background: var(--user); color: #fff; border: 0; border-radius: 7px; padding: 0 16px; font-size: .92rem; font-weight: 600; cursor: pointer; }
.ans-lab { font-size: .8rem; text-transform: uppercase; letter-spacing: .1em; color: #8a93a3; margin: 18px 0 6px; }
.answer { font-size: 2rem; line-height: 1.25; color: #fff; min-height: 2rem; }
.answer.streaming::after { content: ""; display: inline-block; width: 11px; height: 1.7rem; background: var(--assistant); vertical-align: -4px; margin-left: 3px; animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0 } }

/* harness panel */
.sp-label { margin-left: auto; font-size: .62rem; text-transform: none; letter-spacing: 0; color: #6f7884; }
.toggle { display: inline-flex; border: 1px solid var(--line); border-radius: 999px; overflow: hidden; cursor: pointer; font-size: .62rem; }
.toggle .opt { padding: 3px 9px; color: #6f7884; }
.toggle[data-on="with"] .with { background: var(--system); color: #1a1206; font-weight: 700; }
.toggle[data-on="without"] .without { background: #3a4350; color: #fff; font-weight: 700; }
.explain { border-left: 4px solid var(--system); background: rgba(245,166,35,.07); border-radius: 0 8px 8px 0;
           padding: 9px 12px; margin-bottom: 12px; font-size: .8rem; line-height: 1.5; color: #d8c7a6; }
.explain b { color: #f5d79a; }
.card { border-left: 5px solid #666; border-radius: 0 7px 7px 0; background: var(--ink); padding: 9px 13px; margin: 8px 0; }
.card .role { font-size: .66rem; text-transform: uppercase; letter-spacing: .08em; opacity: .75; margin-bottom: 3px; }
.card.system { border-color: var(--system); } .card.system .role { color: var(--system); }
.card.user { border-color: var(--user); } .card.user .role { color: var(--user); }
.card.assistant { border-color: var(--assistant); } .card.assistant .role { color: var(--assistant); }
.card .txt { font-size: .95rem; color: #eef2f6; white-space: pre-wrap; word-break: break-word; }
.decision { margin-top: 12px; font-size: .84rem; color: var(--assistant); }

/* wire panel */
pre { background: var(--ink); border: 1px solid #20242c; border-radius: 7px; padding: 11px; font-size: .78rem;
      line-height: 1.45; color: #9fb3c8; white-space: pre-wrap; word-break: break-word; margin: 0; }
.chunk { font-size: .78rem; padding: 4px 0; border-bottom: 1px dashed #20242c; color: #7e8794;
         white-space: pre-wrap; word-break: break-word; }
.chunk .tag { font-weight: 700; }
.chunk[data-tag="thinking"] .tag { color: var(--thinking); }
.chunk[data-tag="content"] .tag { color: var(--assistant); }
.chunk[data-tag="done"] .tag { color: #6f7884; }
```

- [ ] **Step 3: Write `web/app.js`**

```javascript
// web/app.js
// The browser side of the harness. It opens a streaming connection to the
// server and mirrors, step by step, exactly what the harness reports doing:
// what it SENT, each raw chunk it RECEIVED, and the final answer to DISPLAY.
// Nothing here invents data — every panel is filled from the server's events.

const $ = (id) => document.getElementById(id);

// Whether the harness should add its system prompt. The user never types the
// prompt itself; this toggle only turns it on or off so you can see the effect.
let useSystemPrompt = true;

// Light up the pipeline and set the status pill. Each "phase" is a moment in
// the journey: which node is active/done, and which segment is flowing.
//   states: "idle" | "active" | "done";  flow: "out" | "in" | "" (none)
function setPhase(text, { user, harness, ollama, flow }) {
  $("state").textContent = text;
  $("node-user").dataset.state = user;
  $("node-harness").dataset.state = harness;
  $("node-ollama").dataset.state = ollama;
  $("seg-out").dataset.flow = flow === "out" ? "on" : "";
  $("seg-in").dataset.flow = flow === "in" ? "on" : "";
}

// Render one message card in the Harness deck. We use textContent (not
// innerHTML) so the text is shown literally and can never inject markup.
function addCard(role, content) {
  const card = document.createElement("div");
  card.className = `card ${role}`;
  const label = document.createElement("div");
  label.className = "role";
  label.textContent = role === "system" ? "system · added by harness" : role;
  const body = document.createElement("div");
  body.className = "txt";
  body.textContent = content;
  card.append(label, body);
  $("deck").appendChild(card);
}

// Show one raw received chunk, tagged by what it carries: thinking tokens (the
// model reasoning, purple), content tokens (the actual reply, green), or the
// final "done" marker. The full raw chunk is shown — nothing cleaned up.
function addChunk(raw) {
  const msg = raw.message || {};
  let tag = "done";
  if (msg.content) tag = "content";
  else if (msg.thinking) tag = "thinking";

  const line = document.createElement("div");
  line.className = "chunk";
  line.dataset.tag = tag;
  const label = document.createElement("span");
  label.className = "tag";
  label.textContent = tag + ": ";
  const body = document.createElement("span");
  body.textContent = JSON.stringify(raw);
  line.append(label, body);
  $("received").appendChild(line);
}

// The toggle in the Harness panel header: flip the system prompt on/off.
$("toggle").addEventListener("click", () => {
  useSystemPrompt = !useSystemPrompt;
  $("toggle").dataset.on = useSystemPrompt ? "with" : "without";
});

// Send a message and stream the harness's events back.
$("composer").addEventListener("submit", (e) => {
  e.preventDefault();
  const message = $("message").value;

  // Clear every panel so each run starts fresh.
  $("deck").innerHTML = "";
  $("received").innerHTML = "";
  $("sent").textContent = "";
  $("answer").textContent = "";
  $("answer").classList.remove("streaming");
  $("decision").textContent = "";

  setPhase("sending…", { user: "done", harness: "active", ollama: "idle", flow: "out" });

  // Open the stream. The server reads ?system= to decide whether the harness
  // adds its system prompt — so this toggle changes what is really sent.
  const url = `/api/chat?message=${encodeURIComponent(message)}&system=${useSystemPrompt}`;
  const es = new EventSource(url);
  let sawContent = false;

  es.onmessage = (ev) => {
    const event = JSON.parse(ev.data);

    if (event.type === "sent") {
      // Show the exact request, and build the deck FROM it — so what you see is
      // precisely what was sent (the system message appears only if present).
      $("sent").textContent = JSON.stringify(event.request, null, 2);
      for (const m of event.request.messages) addCard(m.role, m.content);
      setPhase("waiting for the model…", { user: "done", harness: "done", ollama: "active", flow: "in" });

    } else if (event.type === "received_chunk") {
      addChunk(event.raw);
      const content = event.raw.message && event.raw.message.content;
      if (content) {
        sawContent = true;
        $("answer").classList.add("streaming");
        $("answer").textContent += content;  // the reply types in live
        setPhase("receiving reply…", { user: "done", harness: "done", ollama: "active", flow: "in" });
      } else if (!sawContent) {
        setPhase("model is thinking…", { user: "done", harness: "done", ollama: "active", flow: "in" });
      }

    } else if (event.type === "display") {
      // The harness's decision: show the assembled reply.
      addCard("assistant", event.content);
      $("answer").textContent = event.content;
      $("answer").classList.remove("streaming");
      $("decision").textContent = "decision: display →";
      setPhase("done", { user: "done", harness: "done", ollama: "done", flow: "" });
      es.close();
    }
  };

  es.onerror = () => {
    // Surface failures; never hide them.
    setPhase("error: stream failed (see server logs)", { user: "done", harness: "done", ollama: "idle", flow: "" });
    $("answer").classList.remove("streaming");
    es.close();
  };
});
```

- [ ] **Step 4: Verify the server still serves and tests pass**

Run: `venv/bin/pytest -q` → all green (frontend changes don't affect tests).
Then start the server and confirm it serves the new page and the toggle reaches the backend:

```bash
set -a && . ./.env.example && set +a
venv/bin/uvicorn app.server:app --port 8013 >/tmp/ep1.log 2>&1 &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8013/            # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8013/index.html  # 200
curl -sN "http://localhost:8013/api/chat?message=Hi&system=false" | grep -m1 '"type": "sent"'   # messages has only user
curl -sN "http://localhost:8013/api/chat?message=Hi&system=true"  | grep -m1 '"type": "sent"'   # messages has system + user
kill %1 2>/dev/null
```
Expected: both pages 200; the `system=false` SENT event's `messages` contains only a `user` role; `system=true` contains `system` then `user`.

- [ ] **Step 5: Commit**

```bash
git add web/index.html web/style.css web/app.js
git commit -m "feat: animated pipeline + living panels + working system-prompt toggle"
```

---

## Task 4: Reconcile docs

**Files:**
- Modify: `docs/superpowers/plans/2026-06-03-agentic-hello-world-webapp-ep1.md`
- Modify: `docs/superpowers/specs/2026-06-03-agentic-hello-world-series-design.md`
- Modify: `README.md`

- [ ] **Step 1: Note the system-prompt scope change in the prior Ep1 plan**

At the top of `docs/superpowers/plans/2026-06-03-agentic-hello-world-webapp-ep1.md`, add a short note under the title:

```markdown
> **Superseded in part (2026-06-04):** Episode 1 now includes a single fixed *system prompt* with a with/without toggle, and the UI was redesigned (animated pipeline + living panels). The harness code in Task 4 below predates the None-content guard and the `system_prompt` parameter — see `docs/superpowers/plans/2026-06-04-ep1-ui-redesign-system-prompt.md` for the current shape.
```

- [ ] **Step 2: Reconcile the series spec's wire wording**

In `docs/superpowers/specs/2026-06-03-agentic-hello-world-series-design.md`, find any wording implying the app talks *directly* to an Ollama Cloud model and add a clarifying note that the app talks to a local Ollama daemon which proxies to the cloud (Ollama can run models locally or in the cloud; the model name's `:cloud` suffix selects cloud). Keep edits minimal and factual.

- [ ] **Step 3: Update README setup if needed**

Confirm `README.md` reflects: local-daemon proxy, `ollama signin` + `ollama pull kimi-k2.6:cloud`, no API key, and that the UI now has a system-prompt toggle. Adjust only what's inaccurate.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-06-03-agentic-hello-world-webapp-ep1.md docs/superpowers/specs/2026-06-03-agentic-hello-world-series-design.md README.md
git commit -m "docs: reconcile Ep1 scope (system prompt + redesign) and wire wording"
```

---

## Task 5: Full verification + final review

- [ ] **Step 1: Full test suite + lint**

Run: `venv/bin/pytest -q` (all green) and `venv/bin/ruff check app tests` (clean).

- [ ] **Step 2: Live smoke through the daemon**

Run: `set -a && . ./.env && set +a && venv/bin/python scripts/smoke_cloud.py` (or `.env.example` if no `.env`).
Expected: prints a `SENT:` request (with the system message) and a final `DISPLAY:` line from `kimi-k2.6:cloud`.

- [ ] **Step 3: Browser verification (controller drives, or human)**

Start `make dev` (or uvicorn) and open `http://localhost:8000/`. Confirm:
- Pipeline nodes light up You → Harness → Ollama; segments animate (blue out, teal back); state pill moves through sending → thinking → receiving → done.
- Sending `Hello World!` **with** the toggle on: deck shows amber `system` + blue `user` + green `assistant`; SENT JSON includes the system message; reply echoes.
- Toggling to **without** and resending: no amber card, SENT JSON has only the user message, the reply is the model's own default (not a forced echo).
- The RECEIVED panel shows raw chunks with purple `thinking:` and green `content:` tags.
- No `/index.html` or `/favicon.ico` 404 in the console.

- [ ] **Step 4: Final code review**

Dispatch a final whole-change code review (focus: teaching-grade readability, the shown==sent invariant with the deck rendered from the `sent` event, the system toggle correctness, no fallbacks). Fix any issues.

- [ ] **Step 5: Update RESUME + finish the branch**

Update `docs/superpowers/RESUME.md` to record the redesign + system-prompt toggle as done, then use superpowers:finishing-a-development-branch.

---

## Done criteria

- `make test` green (harness with/without system prompt, server `system` flag + routes); `ruff` clean.
- Browser shows the animated pipeline + three living panels; sending animates the flow and types the reply in live.
- The `with ⇄ without` toggle visibly changes the deck, the `SENT` JSON, and the model's reply — driven by the real backend.
- `SENT` shown on screen is byte-for-byte what is sent (system message only when the toggle is on).
- No `/index.html` or `/favicon.ico` 404s.
- `app/harness.py` and `web/app.js` read cleanly end-to-end as teaching artifacts.
