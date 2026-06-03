# Resume notes — Episode 1 web app build

**Last updated:** 2026-06-03 (all code tasks done; only live verification remains)

## What this project is
A YouTube series ("Building an AI Agent from Zero") + a real, radically-transparent
agent harness web app that shows the literal bytes sent to / received from an
Ollama Cloud model. Core thesis: *an agent is a stateless LLM wrapped in a harness;
the LLM never changes, every capability lives in the harness.*

- **Spec:** `docs/superpowers/specs/2026-06-03-agentic-hello-world-series-design.md`
- **Plan (executing now):** `docs/superpowers/plans/2026-06-03-agentic-hello-world-webapp-ep1.md`

## Execution method
Following **superpowers:subagent-driven-development**: one implementer subagent per
task (Sonnet — tasks are mechanical, plan has verbatim code), then spec-compliance
review + code-quality review before marking a task done. The plan's code is
authoritative — give implementers the task's full text from the plan; don't make
them read the plan file.

## Branch
`feat/ep1-webapp` (do NOT implement on `master`). Working tree clean as of checkpoint.

## Progress
- [x] **Task 1** — scaffold (pyproject, Makefile, .env.example, pkg inits). Commit `17d9eae`.
- [x] **Task 2** — fail-fast config loader + tests (2 passed). Commit `3786cba`.
- [x] **Task 3** — `app/ollama_client.py` (build_request / make_client / stream_chat). Commit `0b9ce38`.
- [x] **Task 4** — `app/harness.py` (typed event stream; received_chunk carries `raw`). Commit `3a2f4b0`.
- [x] **Task 5** — `app/server.py` FastAPI SSE + static serving. Commit `e299e60`.
- [x] **Task 6** — `scripts/smoke_cloud.py` written + committed (`ddb62b3`). NOT yet run live (needs key).
- [x] **Task 7** — `web/{index.html,style.css,app.js}` three-panel frontend. Commit `c2f0674`. NOT yet browser-verified (needs key).
- [x] **Task 8** — `README.md`. Commit `552bf40`.
- [x] Final whole-implementation code review done. One Critical bug fixed (`6442ca5`, see below).
- [ ] **REMAINS (user, needs OLLAMA_API_KEY):** run `scripts/smoke_cloud.py` live + verify the
      three-panel UI in a browser. Then superpowers:finishing-a-development-branch.

**Status:** `make test` → 9 passed; `make lint` (ruff) → clean.

## Deviation from the plan (recorded for the filmed teaching artifact)
The plan's verbatim `harness.py` did `assembled += chunk["message"]["content"]`. The
`ollama` client (0.6.2) types `Message.content` as `str | None`; thinking models like the
default `gpt-oss:120b` emit chunks with `content=None` (reasoning-only + final done chunk),
so that line raises `TypeError` and would crash the live `/api/chat` and smoke paths. Fixed
in commit `6442ca5` with a `if content:` guard — **the raw chunk is still yielded verbatim**,
so `content: null` still shows on the RECEIVED panel (nothing-hidden invariant intact). This
is not a fallback hiding a bug: `None` is the wire's legitimate "no text this chunk" signal.
Test `test_harness_handles_none_content_chunks` locks it. Minor review fixes in the same
commit: `addCard` in `app.js` now uses `textContent` (was `innerHTML`); two reST docstring gaps.
**The plan doc itself still shows the old harness code — update it if filming from the plan.**

Note: Tasks 1-2 implementations are verbatim from the plan (spec-compliant by
construction); their formal two-stage review was folded into the final review above.

## How to run things
- Setup: `make setup-dev` (creates `venv/`).
- Tests: `make test` (or `venv/bin/pytest -v`). Tasks 1-5 + 7 unit/SSE tests need NO network.
- Dev server: copy `.env.example` to `.env`, add the Ollama Cloud key, then `make dev` → http://localhost:8000
- Live smoke (Task 6) and browser run (Task 7 verify) need a real `OLLAMA_API_KEY`.

## Open items
- **Pacing:** series locked to ~3-min shorts.
- **Model:** default `gpt-oss:120b`; smoke-test one call before locking the on-screen JSON.
- **Deferred plan:** the Motion Canvas animation project is a separate plan, to be
  written after the real UI exists to record/match.
- `.env` is gitignored — never commit the real key.
