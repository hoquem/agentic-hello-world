# Blog post kit — "An Agent Is an LLM Wrapped in a Harness"

The Medium companion to the **Building an AI Agent from Zero** series. A
standalone conceptual essay: the model is a frozen function; every "agentic"
ability is code you add to the harness. Hello World is the first proof; the
8-rung ladder is the payoff.

- **Draft:** [`docs/blog/2026-06-29-an-agent-is-an-llm-wrapped-in-a-harness.md`](../../docs/blog/2026-06-29-an-agent-is-an-llm-wrapped-in-a-harness.md)
- **Images:** `img/` (rendered, ready to upload)

## The spine (this is the spec)

| # | Beat | Image |
|---|------|-------|
| 1 | The misconception — "the AI booked my flight." No, the harness did. | `01-llm-function.png` (hero) |
| 2 | The model is a pure function — text in, text out; no memory/hands/eyes. | `01-llm-function.png` |
| 3 | The cast — USER · HARNESS · LLM; only the harness changes. | `02-actors.png` |
| 4 | Hello World — wrap → send → receive → display; the color code. | `03-cards.png`, `04-flow.gif` |
| 5 | The deck — every call ships the whole deck; the context window. | `05-deck.gif`, `06-window.png` |
| 6 | The ladder (payoff) — every ability is the same move: add to the harness. | `07-ladder.png` ⭐ |
| 7 | Why it matters — you write an agent, you don't train one. | — |
| 8 | Nothing hidden — one real screenshot of the literal bytes; CTA. | `app-the-wire.png`, `end-card-medium.png` |

> The closing takeaway ("The model is a function. The agent is the harness.") is a text blockquote,
> not the `08-takeaway.png` card — that card is rendered but unused by the post.
>
> The post uses `end-card-medium.png` (rendered from `09-endcard.html`): a Medium-tailored close
> with a "Follow for the next part" CTA and no Episode-2 lock-in. The video end card stays at
> `production/cards/end-card.png` and is not duplicated into `img/`.
>
> Prose uses commas, not em-dashes (Medium's paste mangles em-dashes inconsistently).

## Editorial constraints (don't regress these)

- **Pure conceptual essay** + exactly **one** real app screenshot (`app-the-wire.png`).
- **Keep the "never changes" claim precise.** The model is frozen on the *build*
  axis — you never retrain/fine-tune/rewire it. Its *outputs* are still
  non-deterministic, and you can swap in a different model (a different function,
  not a modified one). Do not collapse these into "the model is deterministic."
- Brand colors are sacred: system `#f5a623` · user `#4a90e2` · assistant
  `#3fae5a` · tool `#b07cd6` · accent/teal `#4ec9b0`.

## Rebuilding the images

```
node production/blog/render-blog.mjs   # the 8 static PNG diagrams → img/
node production/blog/render-gif.mjs    # the 2 animated GIFs (flow, deck) → img/
```

- `render-blog.mjs` screenshots each `NN-*.html` (sizes declared in the script).
- `render-gif.mjs` records each `NN-*-anim.html` with Playwright and converts to
  a looping GIF via ffmpeg (two-pass palette). Loop length = the CSS animation
  length; keep them equal so the GIF loops seamlessly.
- The real screenshot `app-the-wire.png` is a frame pulled from
  `production/app-demo/footage/` (0:38, the reasoning-model run showing the
  `thinking` chunks). Re-grab with `ffmpeg -ss 38 -i <webm> -frames:v 1 out.png`.

## Publishing to Medium (zero-setup, copy-paste)

```
node production/blog/build-medium-preview.mjs   # → production/blog/medium-preview.html
open production/blog/medium-preview.html
```

The preview page has two parts:

1. **The article** — click *Select the article*, ⌘/Ctrl-C, paste into a new Medium
   story. Headings, bold, links and blockquotes survive the paste. Image spots show
   up as `⟦ IMAGE n … ⟧` anchor lines carrying that image's caption + alt text.
2. **Image gallery** — for each image in order: a thumbnail, its path, and copy-ready
   **caption** and **alt text** boxes. Drag the file into Medium at its anchor, paste
   the caption, add the alt (Medium: click image → ⋯ → Alt), delete the anchor line.

Notes:
- Alt text for every image lives in the `ALT` map in `build-medium-preview.mjs` —
  edit there, not in the generated HTML (which is machine-specific `file://` paths
  and is git-ignored / not committed).
- Title → Medium title; the italic kicker → Medium subtitle.
- Two beats use GIFs (`04-flow.gif`, `05-deck.gif`); the static `.png` of each is a
  fallback if a GIF is too heavy. GIFs are ~5–7 MB.
