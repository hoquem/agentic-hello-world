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
