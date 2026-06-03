# Resume notes — Episode 1 web app build

**Last updated:** 2026-06-03 (checkpoint before restarting Claude in dangerous mode)

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
- [ ] **Task 3** — `app/ollama_client.py` (build_request / make_client / stream_chat). NEXT.
- [ ] **Task 4** — `app/harness.py` (typed event stream; received_chunk carries `raw`).
- [ ] **Task 5** — `app/server.py` FastAPI SSE + static serving.
- [ ] **Task 6** — `scripts/smoke_cloud.py` (LIVE — needs user's OLLAMA_API_KEY; pause here).
- [ ] **Task 7** — `web/{index.html,style.css,app.js}` three-panel frontend.
- [ ] **Task 8** — `README.md`.
- [ ] Final whole-implementation code review, then superpowers:finishing-a-development-branch.

Note: Tasks 1-2 implementations are verbatim from the plan (spec-compliant by
construction); their formal two-stage review was deferred and can be folded into
the final review.

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
