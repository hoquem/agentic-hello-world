# Episode 1 — Production kit

Everything you need to assemble the Episode 1 video. **Script:** `../docs/scripts/2026-06-05-ep1-hello-world-script.md`. **Voice:** yours. **Capture:** automated (VHS + Playwright). **Edit:** CapCut.

```
production/
├── code/        hello.py · hello.js · Hello.java · hello_llm.py · fun_fact.py
├── vhs/         terminal recordings (.tape → .mp4)
├── app-demo/    record-demo.mjs (Playwright → footage/*.webm)
├── vo/          vo-sheet.md (your read, in takes)
└── youtube/     chapters.txt · description.md · thumbnail-brief.md
```

## One-time setup

```bash
# Terminal recorder
brew install vhs ffmpeg

# App-demo recorder (from repo root)
npm init -y && npm i -D playwright && npx playwright install chromium

# The app + models (already done on this machine)
ollama signin
ollama pull kimi-k2.6:cloud
ollama pull qwen3-coder-next:cloud
```

## Capture the footage (run from the repo root)

```bash
# 1) Terminal beats → production/vhs/*.mp4
vhs production/vhs/montage.tape
vhs production/vhs/hello-llm.tape
vhs production/vhs/print-x3.tape
vhs production/vhs/llm-funfact-x3.tape

# 2) App demo → production/app-demo/footage/*.webm  (start the server first)
make dev                       # serves on :8420 (leave running in another tab)
node production/app-demo/record-demo.mjs
ffmpeg -i production/app-demo/footage/*.webm production/app-demo/app-demo.mp4

# 3) Record your VO reading production/vo/vo-sheet.md (one take per section)
```

> Tip: also screen-record the **code files** (`code/hello_llm.py`) in your editor for the "look at the file" beauty shots — VHS shows the *run*, your editor shows the *source*.

## Edit Decision List (assemble in CapCut, top to bottom)

| # | Script beat (≈time) | Video clip | VO take | On-screen text |
|---|---|---|---|---|
| 1 | Cold open (0:00) | `vhs/montage.mp4` | TAKE 1 | "same code → same output. always." |
| 2 | Cold tease (0:10) | `vhs/llm-funfact-x3.mp4` (first 2 runs, fast) | TAKE 2 | "…but not with an LLM." |
| 3 | The turn (0:16) | blinking cursor / title | TAKE 3 | "HELLO, WORLD — with an LLM" |
| 4 | Python version (0:28) | editor shot of `code/hello_llm.py` + `vhs/hello-llm.mp4` | TAKE 4 | "we asked — we didn't compute." |
| 5 | The reveal (1:10) | **side-by-side:** `vhs/print-x3.mp4` ∥ `vhs/llm-funfact-x3.mp4` | TAKE 5 | "CODE → deterministic / PROMPT → it depends" |
| 6 | Meet the app (1:55) | `app-demo.mp4` (send → flow) | TAKE 6 | — |
| 7 | Harness code (2:45) | `app-demo.mp4` (harness popover dwell) | TAKE 7 | "the model never changes. the harness does." |
| 8 | Model lever (3:25) | `app-demo.mp4` (reasoning → switch → non-reasoning → legend) | TAKE 8 | — |
| 9 | The lesson (5:00) | side-by-side print vs harness | TAKE 9 | "We don't write the output anymore. We shape the conditions." |
| 10 | Tease + CTA (5:45) | end card | TAKE 10 | GitHub URL + "Episode 2 — The System Prompt" |

## Captions, chapters, publish
- **Captions:** in CapCut, run **Auto-captions** on your VO track (more accurate than a hand-written SRT), then style them (large, bottom-center). Export burned-in for the long-form is optional; YouTube also auto-captions.
- **Chapters:** paste `youtube/chapters.txt` into the description, **re-timed to your final cut**.
- **Music:** one low, calm bed under VO (CapCut library / YouTube Audio Library), duck under voice.
- **Publish:** YouTube Studio → upload the export → title from `youtube/thumbnail-brief.md` → paste `youtube/description.md` → upload thumbnail → set "Episode 2" end screen later.

## Checklist
- [ ] `vhs` montage / hello-llm / print-x3 / llm-funfact-x3 rendered
- [ ] app-demo recorded + converted to mp4
- [ ] editor beauty shot of `hello_llm.py`
- [ ] VO takes 1–10 recorded
- [ ] CapCut timeline assembled per the EDL
- [ ] auto-captions styled
- [ ] music bed ducked under VO
- [ ] thumbnail made (1280×720)
- [ ] chapters re-timed, description pasted
- [ ] uploaded + published

## Reality check on automation
The terminal beats (VHS) and the app flow (Playwright) are fully automated and reproducible — re-run anytime. **Your two human jobs** are the VO (your voice = the channel's trust) and the final assembly taste in CapCut (~couple hours, mechanical with the EDL above). Playwright footage has no visible cursor; if you'd rather have a cursor + auto-zoom on the app demo, screen-record that one beat with Screen Studio using the same shot list — everything else stays automated.
