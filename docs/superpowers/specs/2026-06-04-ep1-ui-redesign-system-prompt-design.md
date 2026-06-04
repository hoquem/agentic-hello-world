# Episode 1 — UI Redesign + Functional System-Prompt Toggle (Design Spec)

**Date:** 2026-06-04
**Status:** Approved for planning
**Relates to:**
- Series spec: `docs/superpowers/specs/2026-06-03-agentic-hello-world-series-design.md`
- Ep1 build plan: `docs/superpowers/plans/2026-06-03-agentic-hello-world-webapp-ep1.md`

This spec **extends** the shipped Episode 1 app (config → ollama_client → harness → FastAPI SSE → vanilla frontend, already built and verified live against a local Ollama daemon that proxies to Ollama Cloud). It redesigns the frontend and adds one new harness capability.

---

## Goal

A non-technical viewer of the video series should, at a glance, form an accurate **mental picture** of what happens when they send a message: their words go to a **Harness**, the harness wraps them and sends them to a model via **Ollama**, and a reply **streams back**. The redesign makes that flow visible and animated, while preserving the project's "nothing hidden" thesis (the literal bytes sent and received stay on screen).

Additionally, expose the harness's first real capability — a **system prompt** — with a **with ⇄ without toggle** that actually changes what is sent, so the audience can see that *the model is generic; the harness is what gives it behavior*.

---

## Scope

**In scope (Episode 1):**
- Full frontend redesign: animated pipeline header + three "living" panels.
- A single, fixed **system prompt** baked into the harness, plus a functional toggle to include/omit it.
- Robust SPA serving (fix the `/index.html` 404) and a favicon (kill the silent `/favicon.ico` 404).

**Deliberate scope change from the original Ep1 boundary:**
The original plan stated "**no system prompt**." This spec intentionally adds **one fixed system prompt + toggle** as the Episode 1 teaching device. Everything else about the boundary holds: **one non-looping call, no tools, no multi-turn memory, no planning/reasoning loop.** The system prompt is a constant the user never types or configures (only a presenter toggles it on/off).

**Out of scope:** user-editable system prompts, multiple system prompts, conversation history, tools, anything requiring a loop.

---

## Architecture

The backbone is unchanged:

```
Browser (vanilla HTML/CSS/JS, EventSource)
   │  GET /api/chat?message=...&system=true|false   (SSE)
   ▼
FastAPI server (app/server.py)  — glue only
   │  get_harness() builds a network-wired Harness
   ▼
Harness (app/harness.py)  — orchestration, network-free via injected chat_fn
   │  chat_fn = stream_chat(client, request)
   ▼
ollama_client (app/ollama_client.py)  — make_client / verify_daemon / stream_chat
   ▼
Local Ollama daemon (localhost:11434) ──proxies──▶ Ollama Cloud (kimi-k2.6:cloud)
```

`config.py` and `ollama_client.py` are **unchanged**. The changes live in `harness.py`, `server.py`, and the `web/` frontend.

---

## Implementation principle — teaching-grade code (overrides convenience)

The code is itself a teaching artifact: it will be shown on screen and shared, and viewers — not just maintainers — are expected to read it and understand it. Therefore, across every file in this spec:

- **Simplicity beats cleverness.** Prefer the most obvious implementation a newcomer could follow top-to-bottom. No abstractions, indirection, or "flexibility" beyond what Episode 1 needs (YAGNI). If a simpler shape reads more clearly, choose it even at a small cost to brevity.
- **Comments explain the *why* in plain English.** Short, jargon-light comments that a non-expert audience can follow — the kind you'd read aloud in a video. Avoid restating the code; explain intent and the teaching point (e.g. *why* the system message goes first, *why* nothing is hidden). reStructuredText docstrings on public functions/classes (`:param:` / `:returns:` / `:raises:`).
- **`harness.py` and `web/app.js` especially** must read cleanly end-to-end as the "watch what's happening" files.
- **No fallbacks that hide problems** — failures stay loud and visible (consistent with the rest of the build).

These constraints apply to all code produced for this spec and should be reflected in the implementation plan and enforced in code review.

---

## Component 1 — Harness: the system prompt

`Harness.__init__` gains an optional `system_prompt`:

```python
DEFAULT_SYSTEM_PROMPT = "Reply with exactly what the user typed, and nothing else."

class Harness:
    def __init__(self, chat_fn, model, system_prompt: str | None = None) -> None:
        ...
        # The deck starts with the system message when a prompt is configured,
        # so the request we SEND (and show) already contains it — nothing hidden.
        self.messages: list[dict] = []
        if system_prompt:
            self.messages.append({"role": "system", "content": system_prompt})
```

- `add_user_message` appends the user message after any system message.
- `run()` is otherwise unchanged: it builds the request from the **full deck** (so the `sent` event already reflects with/without), streams chunks, assembles only `content` (skipping `None`/empty — the existing thinking-model guard), and emits `display`.
- **Invariant preserved:** the deck shown in the Harness panel == the `messages` in the `sent` request == what is sent to Ollama.

**Why the constant lives in the harness:** it is product behavior, not environment config. `config.py` stays purely about host/model.

---

## Component 2 — Server: the toggle param + robust serving

`/api/chat` gains a boolean query param:

```
GET /api/chat?message=<text>&system=<true|false>     # system defaults to true
```

- `get_harness(system: bool = True)` maps the flag to the harness:
  `system_prompt = DEFAULT_SYSTEM_PROMPT if system else None`, then builds the Harness as today (`load_config` → `make_client` → `verify_daemon` → `Harness(..., system_prompt=...)`).
- The endpoint reads `message` and depends on `get_harness`; FastAPI resolves the `system` query param into the dependency.

**Robust serving (bug fixes):**
- Serve the SPA at `/` (canonical) **and** `/index.html` (both return the same `FileResponse`) so a natural URL doesn't 404.
- Add a `/favicon.ico` route returning a tiny inline SVG (or a `web/favicon.svg`) to remove the silent 404.

No business logic is added to the server beyond mapping the toggle.

---

## Component 3 — Frontend rebuild (`web/`)

Vanilla HTML/CSS/JS, no framework. Three regions:

### Pipeline header (the mental model)
- Three nodes: **You → Harness → Ollama 🦙**.
- Each node has an idle / active / done visual state. The **active segment** between nodes animates a directional pulse: **blue outbound** (request), **teal inbound** (tokens).
- The Ollama node shows a **`local | cloud`** indicator, derived purely from the model name: ends with `:cloud` → cloud, else local. Sub-label shows the model name.
- A live **state pill** (top bar) reflects the current phase ("sending…", "model thinking…", "receiving reply…", "done", or an error).

### Three living panels
- **You:** the message input + Send; below it, the assembled answer rendered large, typing in live (caret) as `content` arrives.
- **Harness · the deck:** a short "what's a harness?" explainer (amber); the message cards as they exist in the deck — **`system` (amber)** when present, **`user` (blue)**, **`assistant` (green)**; a `decision: display →` line; and the **`with ⇄ without` toggle** in the panel header.
  - **The deck cards (including the amber `system` card) are rendered from the `sent` event's `request.messages`, not from the page-level toggle boolean.** The toggle only controls the `system` query param on the next request; what the deck shows is always exactly what the server reported sending. This keeps shown==sent impossible to diverge.
- **LLM · the wire:** the literal `SENT` JSON (including the system message when present) and the raw `RECEIVED` chunks. Each chunk distinguishes the model's **`thinking`** tokens (purple) from **`content`** tokens (green), read directly from the raw chunk fields (`raw.message.thinking` vs `raw.message.content`). Nothing is cleaned up.

### The functional toggle
- A page-level boolean (default **with**). Toggling re-runs the current message with `&system=<bool>` appended to the EventSource URL.
- Effect, end-to-end: **with** → amber system card + system message in `SENT` + echo reply; **without** → no system card, no system message in `SENT`, the model's own default reply.

### Event → UI mapping (no protocol change)
The SSE event shapes are unchanged (`sent` / `received_chunk` / `display`, plus a stream error). The frontend derives pipeline states from them:

| Event | Pipeline / pill |
|-------|-----------------|
| submit | You ✓, Harness active, pill "sending…" |
| `sent` | render SENT JSON; Harness ✓; Ollama active; pill "waiting…" |
| first `received_chunk` with `thinking` | pill "model thinking…" |
| first `received_chunk` with `content` | pill "receiving reply…" |
| each `received_chunk` | append raw chunk to RECEIVED (colored) |
| `display` | Ollama ✓; pill "done"; answer shown; assistant card added |
| stream error | pill error; surfaced, not hidden |

---

## Error handling (no fallbacks)

- Daemon down / model not pulled → `verify_daemon` raises loudly (unchanged); the request fails and the frontend pill shows an error.
- Stream error → the existing `EventSource.onerror` path surfaces a visible error in the pill; it does not silently retry or hide.
- A model that returns only `thinking` and empty `content` yields an empty answer — this is shown honestly (empty answer + visible thinking chunks), not patched over.

---

## Testing

- **Harness unit tests** (network-free, fake `chat_fn`):
  - With a system prompt: the deck and the `sent` request `messages` begin with the `system` message, then the user message; assistant is appended; `display` content is correct.
  - Without a system prompt (`None`): the deck/`sent` `messages` contain only the user message.
  - Existing tests retained: event order, raw-chunk passthrough, None/empty-content handling.
- **Server test:** `GET /api/chat?...&system=false` → the streamed `sent` event's `request.messages` has **no** `system` role; `&system=true` (and default) → it **does**. Implemented by overriding `get_harness` with a fake that honors the `system` flag and a fake `chat_fn`, so the param→deck mapping is exercised without network. (Note: this override-based test covers the `system` flag's effect on deck-building, but not the real `get_harness`'s `DEFAULT_SYSTEM_PROMPT if system else None` line itself — that mapping is trivial and verified in the live run.)
- **Routing tests:** `/` and `/index.html` both return HTML 200; `/favicon.ico` returns 200.
- **Frontend:** presentation layer — verified live in the browser (pipeline animates, toggle flips the deck/SENT/reply, thinking vs content colored). No automated UI test.

---

## Files changed

- `app/harness.py` — `system_prompt` param + `DEFAULT_SYSTEM_PROMPT`.
- `app/server.py` — `system` query param; `/index.html` + `/favicon.ico` routes.
- `web/index.html`, `web/style.css`, `web/app.js` — full rebuild for the layout, animation, and working toggle.
- `web/favicon.svg` — small icon (if file-based).
- `tests/test_harness.py`, `tests/test_server.py` — system-prompt + routing coverage.
- Docs: update the Ep1 plan's "no system prompt" boundary note and the series spec's direct-cloud wording (the app proxies via the local daemon).

---

## Done criteria

- `make test` green, including the new system-prompt and routing tests.
- Opening `http://localhost:8000/` shows the animated pipeline + three panels; sending a message animates the flow and types the reply in live.
- The `with ⇄ without` toggle visibly changes the deck, the `SENT` JSON, and the model's reply — driven by the real backend.
- `SENT` shown on screen is byte-for-byte what is sent (system message included only when the toggle is on).
- No `/index.html` or `/favicon.ico` 404s.
