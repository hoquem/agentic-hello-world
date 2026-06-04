# Transparent Agent Harness

The "for real" companion app for the *Building an AI Agent from Zero* video
series. A user request is wrapped by a thin `Harness` and streamed to a cloud
model — with the literal request JSON and raw response shown on screen. Nothing
hidden.

The request goes to your **local** Ollama daemon (`http://localhost:11434`),
which is signed in to Ollama Cloud and forwards the call to the cloud model. So
the on-screen SENT/RECEIVED bytes are the app↔daemon wire; the model itself runs
in the cloud. The app sends no credential of its own — the daemon owns it.

## Setup

1. `make setup-dev`
2. Sign in to Ollama Cloud and make the model available (one time):
   ```
   ollama signin
   ollama pull kimi-k2.6:cloud
   ```
3. (optional) `cp .env.example .env` — only needed to override the local-daemon defaults
4. `make dev`
5. Open http://localhost:8420

If the daemon is down or the model isn't pulled, the app fails loudly on the
first request (see `verify_daemon`) rather than hiding the misconfiguration.

## Test

`make test`

A live end-to-end check against the daemon: `venv/bin/python scripts/smoke_cloud.py`

## Episode scope

Episode 1 = one non-looping call, with a single fixed **system prompt** you can
toggle on/off in the UI to see how it changes the model's behavior. The UI shows
the journey as an animated pipeline (You → Harness → Ollama) plus three panels:
your message, the harness deck, and the literal wire. Later episodes extend
`app/harness.py` (tools, memory, planning, reasoning). The model never changes;
every capability lives in the harness.
