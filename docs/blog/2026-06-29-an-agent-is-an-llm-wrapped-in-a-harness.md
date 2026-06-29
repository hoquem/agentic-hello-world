<!--
  Medium post draft — "An Agent Is an LLM Wrapped in a Harness. Here's the Whole Idea."
  Conceptual essay (~1,750 words). Images are in production/blog/img/.
  On Medium: paste the prose, then drop each image where the [IMAGE …] marker sits
  and copy the *caption* line beneath it into Medium's caption field.
  Title → Medium title.  Subtitle → Medium subtitle (the kicker line).
-->

# An Agent Is an LLM Wrapped in a Harness. Here's the Whole Idea.

*The model never changes. Everything you call "agentic" is code you wrote.*

[IMAGE: production/blog/img/01-llm-function.png]
*Caption: The whole thing in one picture — a model takes text and returns text. Everything else is yours to build.*

---

> "The AI read my email, checked my calendar, and booked the flight."

We talk about AI like it's a colleague — something that *does* things. It reads. It remembers. It decides. It acts.

Almost none of that is the AI.

The model at the center of every "AI agent" can't read your email. It has no calendar. It can't book anything, can't remember what you said yesterday, and can't even press a button. Strip away the branding and what's left is startlingly small: **a function that takes in text and returns text.** That is the entire machine.

Everything else — the reading, the remembering, the deciding, the doing — is ordinary code. Code somebody wrote. Code *you* can write.

That is the one idea worth holding onto before anything else about agents makes sense:

> **An agent is a stateless model wrapped in a harness. The model is frozen. Every new ability lives in the harness.**

Let me unpack that one piece at a time — no math, no framework, just the shape of the thing.

## The model is a function

A large language model does exactly one thing. You hand it some text, and it hands back the text that should plausibly come next. That's it. Ask it a question, it returns an answer. Give it half a sentence, it returns the other half.

And notice what it *cannot* do:

- **No memory.** Every call starts from a blank slate. The model has no idea what you asked it ten seconds ago — unless you tell it again.
- **No hands.** It can't hit an API, run a query, or send an email. It can only emit text.
- **No eyes.** It can't see your screen, your files, or the outside world.

One honest caveat, because it matters later: a model is not a function in the tidy way `print()` is. Ask the exact same question twice and you can get two different answers — there's deliberate randomness in how it picks words. Swap in a different model and you'll get a different reply again. So "frozen" doesn't mean "predictable."

It means something more specific: **the model is a sealed artifact.** As you build an agent, you never reach inside and rewire it. You can't teach it your calendar by editing it. You don't make it smarter to give it new powers. It is a black box — text in, text out — and it stays exactly as it came.

So if the model can't remember, can't act, and never changes… where does an "agent" come from?

## Meet the cast: you, the harness, the model

[IMAGE: production/blog/img/02-actors.png]
*Caption: Three actors, one of which is the whole story. Only the harness changes.*

There are only three players in this entire field, and they never move from their seats.

On the left, **you** — the user. You type a request and read an answer.

On the right, the **model** — frozen, stateless, text in and text out.

And in the middle, the **harness** — the code you write around the model. The harness is the protagonist of this story. It's the only part that ever changes, and it's the entire reason an "agent" can do anything at all. The harness holds the conversation, builds each request, sends it to the model, reads the reply, and decides what to do next.

Keep your eye on the middle. Everything interesting happens there.

## The simplest possible agent

Let's build the smallest agent that could possibly exist: a program that says "Hello World!" — except the words come from the *model*, not from us.

First, the vocabulary. Every message in this world is a **card**, and every card has a role with a fixed color. This color code never changes — not in this post, not across the whole series.

[IMAGE: production/blog/img/03-cards.png]
*Caption: The sacred color code. Four roles, four colors, used everywhere.*

Now watch the loop. It has four steps:

[IMAGE: production/blog/img/04-flow.gif]  <!-- animated; static fallback: 04-flow.png -->
*Caption: Wrap → send → receive → display. The entire program.*

1. **Wrap.** You type "Hello World!". The harness wraps your words in a blue *user* card.
2. **Send.** It ships that card across to the model.
3. **Receive.** The model reads it and sends back a green *assistant* card.
4. **Display.** The harness reads the reply and prints it on your screen.

There it is: "Hello World!", *generated* by the model, *displayed* by the harness. No memory, no tools, no loop — just one round trip. It barely deserves the word "agent."

But look closely, because every piece of a real agent is already here in miniature. The harness built a message. It sent it. It got a reply. It made a decision about what to do with that reply. Everything that follows is just *more of that* — the same four moves, with more code in the middle.

## The one move that scales: the deck

Here's a question that breaks most people's mental model: if the model has no memory, how does a chatbot remember what you said three messages ago?

It doesn't. **The harness does.**

[IMAGE: production/blog/img/05-deck.gif]  <!-- animated; static fallback: 05-deck.png -->
*Caption: "Memory" is an illusion. Every turn, the harness re-sends the entire conversation.*

Every single turn, the harness sends the model the *whole stack of cards* — the entire conversation so far — not just your latest message. The model reads all of it as if for the first time, answers, and forgets again. Next turn, the harness sends everything *plus* the new exchange. The stack — call it **the deck** — only ever grows, until it can't (more on that in a moment).

This one detail quietly explains a lot:

- **"Memory" is just a taller deck.** There's no magic store of recollection. There's a list of messages the harness keeps re-sending.
- **It's why long chats slow down and cost more.** Every turn re-sends everything before it.
- **And it's why agents "forget."**

[IMAGE: production/blog/img/06-window.png]
*Caption: The context window is a fixed frame. When the deck overflows, the oldest cards fall out.*

The model can only read so much text at once — a fixed-size frame called the **context window**. The deck keeps getting taller, but the frame doesn't grow. When the deck overflows, the oldest cards fall out of the top. The model didn't "forget" anything. The harness simply stopped sending those cards.

Once you see memory as a list of cards the harness manages, the whole behavior of agents stops being mysterious and starts being *code you could write yourself*.

## Every new ability is the same move

Now the payoff. Here is the entire arc of building a real agent — every capability you've heard of, from system prompts to tools to reasoning:

[IMAGE: production/blog/img/07-ladder.png]
*Caption: Eight capabilities, one move. Add to the harness. The model on the right never changes.*

Read the rungs from the bottom up. Each one is a real, named capability — and each one is the *exact same move*: add a little code to the harness.

- **A system prompt?** Add an amber card to the front of the deck — a standing instruction that tells the model its job.
- **Reading the reply?** Add a step that parses what came back and decides: just display it, or act on it?
- **Tools** — the moment an "agent" becomes an agent? Add a list of actions the harness can run, and a *loop*. The model can't fetch the weather, but it can emit text that says "call `get_weather`." The harness sees that, runs the function, drops the result back into the deck as a purple *tool* card, and sends the deck around again. The model reads the answer and continues. That loop is the whole game.
- **Memory** across sessions? Save the deck to disk and reload it.
- **Planning?** Have the harness ask the model to write a list of steps first, then work through them.
- **Reasoning?** Let the model "think" in one part of its reply and "speak" in another, and have the harness treat them differently.

Look at the right side of that diagram the whole way up. The model is stamped **unchanged** at every step. We never retrained it. We never fine-tuned it. We never touched its weights. (You *can* swap in a different model — and you'll get different answers — but that's choosing a different function, not improving one.) Every new power came from the same place: **the harness got more code.**

That's the thesis, fully unpacked. "Agentic" isn't a property of the model. It's a property of the code around it.

## Why this reframe matters

This isn't just a tidy mental model. It changes how you *work*.

- **When an agent misbehaves, the bug is almost always in the harness.** The model returned text; your code did the wrong thing with it. That's where you look first.
- **When you want a new capability, you write code — you don't go shopping for a smarter model.** Most of what people wish their agent could do is a harness feature, not a model upgrade.
- **Safety lives in the harness.** A model can't do anything your harness doesn't explicitly let it do. The harness is where the guardrails actually are.
- **And the whole field gets less intimidating.** "Agent" stops being a black art and becomes what it is: a loop, a list of messages, and a few decisions — written in plain code.

You don't *train* an agent. You *write* one.

## Nothing hidden

If all of this sounds like hand-waving, here's the part I care about most: you can watch it happen for real.

[IMAGE: production/blog/img/app-the-wire.png]
*Caption: The real thing. Left: your message and the answer. Middle: the deck of cards. Right: the literal JSON sent to the model, and the raw reply streaming back, token by token.*

I built a small, deliberately transparent app that shows the **literal bytes** going to and from the model — the exact request on the wire, and the raw response streaming back. No abstraction, no SDK magic hiding the moving parts. What you're looking at there is exactly the Hello World loop from this post — not a metaphor for it, but the real thing: the blue user card becoming a line of JSON, the green assistant card streaming back word by word, and the harness deciding what to do with it.

That's the first rung of the ladder, working for real. The rungs above it — tools, memory, planning, reasoning — are what the series builds next, one transparent step at a time. But none of them change the shape you've already seen: text in, text out, and a little more code in the middle.

Even at this first rung, the whole harness is small enough to read in one sitting.

> **The model is a function. The agent is the harness.**

That's the idea the entire field is built on. Everything else is just more code in the middle.

---

*The code is open source (MIT): [github.com/hoquem/agentic-hello-world](https://github.com/hoquem/agentic-hello-world). It runs on [Ollama](https://ollama.com), so you can point it at any model — local or cloud — and watch the same bytes for yourself.*

*This is the written companion to an upcoming video series, **Building an AI Agent from Zero**, that builds this agent one rung at a time — Hello World, then the system prompt, then tools, then memory, all the way up. If the ladder above made something click, the series walks every step of it.*

[IMAGE: production/cards/end-card.png]
*Caption: Building an AI Agent from Zero — the series.*
