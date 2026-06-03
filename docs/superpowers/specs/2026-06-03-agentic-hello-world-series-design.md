# Building an AI Agent from Zero — Series Design

**Date:** 2026-06-03
**Status:** Approved (brainstorm) — pending user review of this spec
**Author:** m.hoque@gmail.com + Claude

---

## 1. Overview & goal

A YouTube **series of ~3-minute shorts** that builds an AI agent from nothing,
one capability at a time. The series sells exactly one idea:

> **An agent is a stateless LLM (text in → text out) wrapped in a harness (the code you write). The LLM never changes. Every new ability lives in the harness.**

Each short is **hybrid**: an abstract, code-driven animation introduces the
concept, then we cut to a **real working web app** that shows the *literal bytes*
sent to and received from the model — nothing hidden.

- **Audience:** broad tech (open gentle, end on real mechanics).
- **Narration:** scripted voiceover + timed captions.
- **Animation tool:** Motion Canvas (TypeScript, code-driven).
- **Real system:** Python harness + web UI, talking to **Ollama Cloud** models.

Production strategy: **lock the full 8-episode arc now; fully script Episode 1
as the pilot + reusable template.** If Ep 1 lands, the rest are fill-in-the-blanks.

---

## 2. The series arc (Approach A — micro-episodes)

| # | Title | One-line payoff | New thing added to the harness |
|---|-------|-----------------|-------------------------------|
| 0 | *Trailer / cold open* (60-90s) | "An agent is an LLM in a loop. Let's build one from nothing." | — |
| 1 | **Hello World** | Wrap → send → receive → display. The LLM is a pure function: no memory, no hands, no eyes. | The basic call + display |
| 2 | **The System Prompt** | The LLM needs a job description. Same input, different standing orders → different behavior. | The amber system card |
| 3 | **Reading the Reply** | The harness must *parse* the reply and decide: display it, or act on it. | A parse/route step |
| 4 | **Tools** | Give the LLM hands. It can't fetch weather — but it can *ask* the harness to. The loop is born. | Tool registry + the loop |
| 5 | **Context & Memory** | The LLM is stateless. "Memory" = the harness re-sending the whole conversation every turn. | Persisted message deck + context window |
| 6 | **Planning** | For multi-step tasks, make the model write a plan first, then execute it step by step. | A plan the harness tracks |
| 7 | **Reasoning** | Let the model think before it speaks. The harness separates *think* from *say*. | Thinking/reasoning channel |
| 8 | **Capstone** | A tiny real agent: plans, reasons, calls a tool, builds context — shown live in the UI. | Everything together |

Note: Ep 3 (parsing) and Ep 4 (tools) are tightly linked; kept separate so
parsing gets its own 2-min beat and makes tools click. Revisit if Ep 1 feedback
suggests merging.

---

## 3. The shared visual language

Constant across all 8 shorts **and** the web UI, so the animation and the real
demo feel like the same world.

### Three actors (always same positions)

```
   USER                 HARNESS                    LLM
  (left)               (center)                  (right)
 a person          the code YOU write          a brain / black box
 + a screen        holds the message deck,     stateless · frozen ·
                   the loop, the tools          text in → text out
```

- The **Harness is the protagonist** — the only thing that changes per episode.
- The **LLM is a sealed black box** stamped *stateless / no memory*, re-stamped
  every episode to drive the core idea home.

### Role-colored cards (the color code is sacred, never changes)

| Role | Color | Mental model |
|------|-------|--------------|
| **System** | 🟡 amber/gold | standing orders / job description |
| **User** | 🔵 blue | the request |
| **Assistant** | 🟢 green | the model's reply |
| **Tool** | 🟣 purple | a result handed back to the model |

### "The deck" — the central motif

Every call to the LLM ships the **entire stack of cards**, not just the latest.
We always animate the full deck flying right. This one choice teaches:

- **statelessness** (we must resend everything every time),
- **context growth** ("the deck gets taller each turn"),
- **the context window** (a frame the deck must fit inside),
- later, **why agents "forget."**

### Recurring per-episode beats

1. "What's new in the harness this time" highlight.
2. The deck ships right.
3. The raw reply comes back.
4. The harness **decides** what to do.
5. A one-line takeaway card in the LLM black-box style.

### Tooling

**Motion Canvas** for abstract segments (purpose-built for labeled packets
flowing between boxes; code-driven = reproducible + consistent across 8
episodes). Real-UI segments are screen recordings of the web app (§5).

---

## 4. Per-episode script template

Every episode script is structured as:

1. **Cold open (10-15s)** — restate/extend the core idea; hook.
2. **Title card (3-5s).**
3. **Concept in the abstract (45-70s)** — Motion Canvas animation introducing
   the one new harness capability, using the deck motif.
4. **Cut to real UI (40-60s)** — the same thing happening for real, with the
   raw SENT/RECEIVED bytes on screen. "Nothing hidden."
5. **Takeaway card (10-15s)** — black-box-style one-liner + one-sentence tease
   of the next episode's gap.
6. **End card (3-5s)** — subscribe + next-episode teaser.

Each script document contains four parallel columns/tracks: **timecode · VO ·
on-screen captions · animation & UI cues.**

---

## 5. Real-system architecture

The web app is the "for real" half of every hybrid short. Its job is **radical
transparency**: show the literal bytes to/from the model.

### Three-panel layout (mirrors the visual language)

```
┌─────────────┬────────────────────────────┬──────────────────────┐
│   USER       │        HARNESS              │      LLM (wire)       │
│  (left)      │       (center)              │      (right)          │
│              │                             │                       │
│ input box    │  the message deck           │  ► SENT  (raw JSON    │
│ + final      │  (role-colored cards)       │    request body)      │
│ displayed    │  loop counter: turn 1/N     │                       │
│ output       │  tool registry              │  ◄ RECEIVED (raw      │
│              │  parsed decision:           │    JSON response,     │
│              │  "display" / "call tool"    │    streamed)          │
└─────────────┴────────────────────────────┴──────────────────────┘
```

The center deck uses the **exact same role-colored cards** as the animation.
The right panel's **SENT / RECEIVED** view shows the unedited payload, with the
same colors highlighting each message. When the harness loops (a tool call), you
watch the deck grow a card and re-ship — that visual *is* the lesson.

### Stack

- **Backend:** FastAPI (Python). One thin, deliberately readable `Harness`
  class — the star of the codebase. It owns the message list, builds the
  request, calls the model, parses the reply, runs tools, and loops. Each
  episode = a small reviewable diff to this one class.
- **LLM:** **Ollama Cloud** via the standard `ollama` Python client (flat
  subscription). Verified usage:

  ```python
  import os
  from ollama import Client

  client = Client(
      host="https://ollama.com",
      headers={"Authorization": "Bearer " + os.environ["OLLAMA_API_KEY"]},
  )

  for part in client.chat("gpt-oss:120b", messages=messages, stream=True):
      print(part["message"]["content"], end="", flush=True)
  ```

  - Host: `https://ollama.com`; auth: `OLLAMA_API_KEY` env var (key from
    ollama.com/settings/keys), sent as `Authorization: Bearer <key>`.
  - Model naming: base name (e.g. `gpt-oss:120b`) when hitting the cloud API
    directly; the `-cloud` suffix is only for local-offload mode.
  - Tool-capable models for Eps 4-8: `gpt-oss:120b`, `qwen3-coder:480b`.
    Thinking models for Ep 7: `kimi-k2-thinking`, `deepseek-v3.1`.
- **Transport:** Server-Sent Events to stream tokens *and* push the sent/received
  payloads to the UI live.
- **Frontend:** Vanilla HTML/CSS/JS, no framework — keeps the codebase
  inspectable and on-message ("nothing hidden"); plenty for three panels + cards.

### Why this stack

The codebase itself is a teaching artifact: someone should read the whole
harness in one sitting. A framework would bury the one thing we're exposing.
Aligns with the "simple, readable, testable" project principle. **No fallbacks
that hide what the model or harness actually did** — errors surface on screen.

### Build order

Build the UI just far enough to demo **Episode 1** (a single, non-looping call),
then extend the `Harness` class by exactly the capability each later episode
teaches. The code grows in lockstep with the series.

---

## 6. Episode 1 — "Hello World" (full pilot script, ~2.5 min)

**Goal of the episode:** get the program to display **"Hello World!"** — but with
the words generated by the *model*, displayed by the *harness*. End on a clean
win, then tease the gap that motivates Ep 2 (the system prompt).

| Time | VO (voiceover) | On-screen captions | Animation / UI cues |
|------|----------------|--------------------|--------------------|
| 0:00–0:15 | "This is a large language model. People call it artificial intelligence — but really, it's a *function*. Text goes in. Text comes out. That's it. It has no memory. No hands. It can't even press a button." | TEXT IN → TEXT OUT · no memory · no hands | Black box labeled **LLM**, lone in frame. An arrow: text in → text out. Stamps thunk on: *stateless*, *no memory*, *no hands*. |
| 0:15–0:20 | — | **Building an AI Agent from Zero** · *Ep. 1: Hello World* | Title card. |
| 0:20–0:45 | "So how do we get from *this* to an 'agent' that actually does something? We wrap it. The code we write around the model is called the **harness**. Here's the whole cast: you — the user. The harness — the code we control. And the model — the one part we can't change. So everything interesting happens in the harness." | USER · HARNESS · LLM | Three actors slide into position (USER left, HARNESS center, LLM right). HARNESS gets a subtle glow ("the part we control"). |
| 0:45–1:25 | "Our goal is dead simple: get this program to print **'Hello World!'** — but have the words come from the model, not from us. So: you type a request. The harness wraps your words in a **blue card** — a *user message* — and ships the whole card across to the model. The model reads it and sends back a **green card** — the *assistant message*. The harness reads that reply and prints it to your screen. There it is — Hello World, *generated* by the model, *displayed* by the harness. That's the whole loop: wrap, send, receive, display." | wrap → send → receive → display | User types `Reply with exactly: Hello World!`. A blue card forms in HARNESS. The card (the whole "deck" of one) flies right into LLM. A green card `Hello World!` flies back. HARNESS prints **Hello World!** on the USER screen. |
| 1:25–2:05 | "Now let's prove it's real. This is the actual program — Python talking to a real model in the cloud. Watch the middle: that's our message *deck*, the exact cards we just animated. And the right panel is the part nobody usually shows you — the literal bytes. Here's the exact JSON request we send… and here's the raw response, streaming back token by token… and the harness prints it on the left. Nothing hidden. No magic. Text in, text out — and a harness that decides what to do with it." | the literal bytes · nothing hidden | **Cut to real web UI.** User clicks Send. Center: blue user card appears. Right/SENT: `{"model":"gpt-oss:120b","messages":[{"role":"user","content":"Reply with exactly: Hello World!"}],"stream":true}`. Right/RECEIVED: chunks stream in → `Hello World!`. Left panel renders **Hello World!**. |
| 2:05–2:25 | "Remember the one idea this whole series is built on: **the model never changes.** Every new ability — memory, tools, planning — we add to the *harness*. But notice something: we had to *over-specify* — 'reply with exactly.' We never actually told the model what its *job* is. Next episode, we give it one. That's the **system prompt**." | The LLM is a stateless function. Agents are built in the harness. | Black-box-style takeaway card. Then a teaser: an empty amber (system) card slot appears in the HARNESS, pulsing. |
| 2:25–2:30 | — | ▶ Ep. 2: The System Prompt · *Subscribe* | End card. |

**VO word count / pacing:** ~430 words. At a genuinely gentle explainer pace
(~135 wpm) plus pauses for the deck and stamps to land, this runs **~3:15–3:30**.
**Decision: the series targets ~3-min shorts**, so the script stays full — no
trimming. The timecodes in the table above are indicative and will stretch
slightly to ~3:15–3:30 once paced with pauses.

---

## 7. Open questions / next steps

- **Pacing decision — RESOLVED:** the series targets **~3-min shorts**. Scripts
  stay full; no VO trimming. (Was: 2.5-min target.)
- **Model pick for the pilot:** default `gpt-oss:120b` (tool-capable, good all
  rounder). Smoke-test one `client.chat` call before locking the on-screen JSON
  caption, since the literal bytes appear in-frame.
- **Channel/branding:** title-card font, color palette hexes, intro sting —
  needed before Motion Canvas work starts.
- **Repo:** this directory is not yet a git repo. Init + commit this spec when
  ready.
- **Immediate next step:** after user review of this spec, invoke the
  writing-plans skill to produce the implementation plan — likely two tracks:
  (a) the FastAPI + Ollama Cloud + vanilla-JS web app scaffolded to Ep-1 scope,
  (b) the Motion Canvas project + Episode 1 animation.
```

