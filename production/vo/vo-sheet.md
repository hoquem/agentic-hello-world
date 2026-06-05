# Episode 1 — Voiceover sheet (record in your own voice)

**How to record:** read one **TAKE** at a time, pause between takes (gives you clean cut points). Re-read any take as many times as you like — keep the best. Record in a quiet room; phone/AirPods/any USB mic is fine. Aim for a calm, confident "explaining to a smart friend" tone — not hype.

**Pronunciation:** *Ollama* = "oh-LAH-ma". *LLM* = say the letters, "L-L-M". *kimi-k2.6* = "kimi K-two-point-six".

**Pacing marks:** `//` = short breath. `[beat]` = stop talking, let the screen play.

---

### TAKE 1 — Cold open
> Every engineer's first program is the same. // Hello, World. // One line. Run it — and it says exactly what you told it to. // Every time.

### TAKE 2 — Cold tease
> Unless you ask an LLM. // Then "the same program" can give you *this*… or *this*. `[beat]`

### TAKE 3 — The turn
> So: how do you write Hello World with an LLM — and why doesn't it behave like every other program you've written?

### TAKE 4 — The Python version
> Same as before — just Python. Import the Ollama client, send one message — "reply with exactly: Hello World!" — print the reply. `[beat]`
> Hello World. // But that wasn't one line — and nothing *computed* that answer. We *asked a model* for it.

### TAKE 5 — The reveal (randomness)
> A fixed instruction behaves. But just *ask* it something… `[beat]`
> Same code. The print is identical every time. The LLM isn't. // That's the shift — from writing instructions to writing a prompt, where the behaviour isn't guaranteed. // To see *why*, you have to see the actual bytes. So I built something that hides nothing.

### TAKE 6 — Meet the app
> A transparent agent harness. // Left: you. Middle: the harness — the code we write. Right: the model, on Ollama. // Every byte in and out is on screen. `[beat]`
> Wrap the message, send it, stream the reply, show it. // That trip is the whole program.

### TAKE 7 — The harness code
> Here's the entire harness — wrap, send, stream, display. That's it. `[beat]`
> And the model behind it is *stateless*. Text in, text out — no memory, no hands, no eyes. // Everything an agent ever does, for this whole series, lives in *this* code. Not the model.

### TAKE 8 — The model lever
> Randomness is one reason the behaviour moves. // Here's the other: the model itself. Same harness, same message — I'll just change *which model*. `[beat]`
> A reasoning model thinks out loud before it answers — that's the purple. The reply lands after, in green. `[beat]`
> Plain model, same message — no thinking, it just answers. // Same input, different model, different behaviour — visible in the literal bytes. `[beat]`
> All of it, unedited — reasoning, answer, tokens, timing. The real wire.

### TAKE 9 — The lesson
> So: the old Hello World was code — deterministic, the same every time. // The new one is a prompt to a model, and its behaviour depends on the model, the input, and chance. // We stopped writing the output. Now we shape the conditions and ask. `[beat]`
> And the model never changed — everything we did lived in the harness. // That's the whole series in one line.

### TAKE 10 — Tease + CTA
> One thing we kept doing: jamming our instruction into every message — "reply with exactly." // It works, but it's fragile, and you repeat it forever. // There's a better way to give a model a standing job: the system prompt. // That's next episode — and it's where this stops being a toy. `[beat]`
> Code's on GitHub, link below. Subscribe — see you in episode two.
