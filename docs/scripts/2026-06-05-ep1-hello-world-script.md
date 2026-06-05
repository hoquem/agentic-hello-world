# Episode 1 — "Hello, World — but with an LLM" (Script v3)

**Series:** Building an AI Agent from Zero
**Format:** Long-form educational (~6:30–7 min) → shorts cut on top (see end).
**Audience:** Software engineers.
**Thesis:** We used to *write code* for Hello World — deterministic, same output every run. Now we *write a prompt* to a stateless model — and the behaviour isn't guaranteed; it depends on the model and on chance. The harness is the code we wrap around that model.

**Through-line:** *make the model say exactly "Hello World!"* — and discover that getting predictable behaviour out of an LLM is a different game than writing code.

**v3 tightenings applied:** cold-tease the payoff up front · merged reveal+reframe · compressed harness walkthrough to its punch · thinned VO with deliberate silence beats · the two non-determinism causes are explicitly named (randomness / which model). Locked: open prompt = "Give me a one-sentence fun fact."; print-vs-LLM shown **side-by-side**.

**Tracks:** **VO** (voiceover) · **SCREEN** (on screen / app cues). `[beat]` = hold ~1s, no VO, let the screen land. Timecodes approximate.

---

## 0:00–0:10 — COLD OPEN

**SCREEN:** Hard cut to a terminal. Rapid burst, sub-1s each:
`print("Hello, World!")` · `console.log("Hello, World!")` · `System.out.println("Hello, World!");` → each prints `Hello, World!`.

**VO:** "Every engineer's first program is the same. Hello, World. One line. Run it — and it says exactly what you told it to. Every time."

**SCREEN:** Three identical outputs. Caption: **same code → same output. always.**

---

## 0:10–0:16 — COLD TEASE (show the destination)

**SCREEN:** Quick flash — the same LLM prompt ("Give me a one-sentence fun fact.") run twice, side by side → **two different answers.** Caption punches in: **…but not with an LLM.**

**VO:** "Unless you ask an LLM. Then 'the same program' can give you *this*… or *this*."

`[beat]`

---

## 0:16–0:28 — THE TURN

**VO:** "So: how do you write Hello World with an LLM — and why doesn't it behave like every other program you've written?"

**SCREEN:** Snippets clear to a single blinking cursor. Title on the live cursor: **HELLO, WORLD — with an LLM.**

---

## 0:28–1:10 — THE LLM VERSION, IN PLAIN PYTHON

**VO:** "Same as before — just Python. Import the Ollama client, send one message — 'reply with exactly: Hello World!' — print the reply."

**SCREEN:** ~8-line file:
```python
from ollama import Client

client = Client()
reply = client.chat(
    "kimi-k2.6:cloud",
    messages=[{"role": "user", "content": "Reply with exactly: Hello World!"}],
)
print(reply["message"]["content"])
```
Run → `Hello World!` `[beat]`

**VO:** "Hello World. But that wasn't one line — and nothing *computed* that answer. We *asked a model* for it."

**SCREEN:** Caption: **we asked — we didn't compute.**

---

## 1:10–1:55 — THE REVEAL (cause #1: randomness)

**VO:** "A fixed instruction behaves. But just *ask* it something —"

**SCREEN:** Change the message to `"Give me a one-sentence fun fact."`. **Side-by-side:** left, `print("Hello, World!")` run 3× → identical; right, the LLM run 3× → three different facts.

`[beat]`

**VO:** "Same code. The print is identical every time. The LLM isn't. That's the shift — from writing instructions to writing a prompt, where the behaviour isn't guaranteed. To see *why*, you have to see the actual bytes. So I built something that hides nothing."

**SCREEN:** Split card: **CODE → deterministic / PROMPT → it depends.** Fade into the app.

---

## 1:55–2:45 — MEET THE TRANSPARENT HARNESS

**SCREEN:** The web app — three panels + pipeline. (Production note: system-prompt toggle is **OFF** this episode.)

**VO:** "A transparent agent harness. Left: you. Middle: the harness — the code we write. Right: the model, on Ollama. Every byte in and out is on screen."

**SCREEN:** Type `Reply with exactly: Hello World!`, Send. Pipeline animates **You → Harness → Ollama**; request out (blue), tokens back (teal); answer types in. `[beat]`

**VO:** "Wrap the message, send it, stream the reply, show it. That trip is the whole program."

---

## 2:45–3:25 — THE HARNESS CODE (the punch: *this much code*)

**SCREEN:** Hover the Harness node → the `run()` popover (syntax-highlighted), zoomed.

**VO:** "Here's the entire harness — wrap, send, stream, display. That's it." `[beat]`

**VO:** "And the model behind it is *stateless*. Text in, text out — no memory, no hands, no eyes. Everything an agent ever does, for this whole series, lives in *this* code. Not the model."

**SCREEN:** Caption: **you don't reprogram the model — you wrap it.**

---

## 3:25–5:00 — THE LEVER (cause #2: which model)

**VO:** "Randomness is one reason the behaviour moves. Here's the other: the model itself. Same harness, same message — I'll just change *which model*."

**SCREEN:** Model picker under the Ollama node → **reasoning** model (kimi-k2.6:cloud). Send `Reply with exactly: Hello World!`. RECEIVED streams **purple `thinking`** first, then **green `content`**. `[beat]`

**VO:** "A reasoning model thinks out loud before it answers — that's the purple. The reply lands after, in green."

**SCREEN:** Switch to a **non-reasoning** model (qwen3-coder-next:cloud). Same message. No purple — content only.

**VO:** "Plain model, same message — no thinking, it just answers. Same input, different model, different behaviour — visible in the literal bytes."

**SCREEN:** Hover the "fields ⓘ" legend. `[beat]`

**VO:** "All of it, unedited — reasoning, answer, tokens, timing. The real wire."

---

## 5:00–5:45 — THE LESSON

**SCREEN:** Side-by-side — `print("Hello World!")` vs the harness + its varying replies.

**VO:** "So: the old Hello World was code — deterministic, the same every time. The new one is a prompt to a model, and its behaviour depends on the model, the input, and chance. We stopped writing the output. Now we shape the conditions and ask."

**SCREEN:** Caption: **We don't write the output anymore. We shape the conditions.**

**VO:** "And notice — we never reached *inside* the model. We swapped it, we fed it, we wrapped it — all from the harness. The models are interchangeable parts; the harness is the thing you write. That's the whole series in one line."

---

## 5:45–6:30 — TEASE + CTA

**VO:** "One thing we kept doing: jamming our instruction into every message — 'reply with exactly.' It works, but it's fragile, and you repeat it forever. There's a better way to give a model a standing job: the system prompt. That's next episode — and it's where this stops being a toy. Code's on GitHub below. Subscribe — see you in episode two."

**SCREEN:** End card: GitHub URL + "Episode 2 — The System Prompt."

---

## Shorts cut from this episode

1. **"Hello World, but with AI"** (~40s): montage → cold-tease (two different answers) → 8-line Python → "we asked, we didn't compute."
2. **"Why your LLM gives different answers every time"** (~50s): side-by-side `print` 3× vs LLM 3× + the CODE/PROMPT split. *Strongest standalone.*
3. **"This is the *entire* code behind an AI agent"** (~45s): the `run()` popover — "the model is stateless; the harness is everything."
4. **"Same prompt, different model, different behaviour"** (~45s): reasoning (purple thinking) vs non-reasoning on the live wire.

---

## Locked decisions
- System prompt → **Ep2** (Ep1 app runs with it OFF; instruction in the user message).
- Through-line: "make the model say exactly Hello World!"
- Non-determinism shown as **two named causes**: randomness (same-model re-runs of "Give me a one-sentence fun fact.") + which model (in-app picker).
- print-vs-LLM = **side-by-side**.
- Target ~6:30–7 min (tightened from 8; expand the model beat if you want to land back at 8).
