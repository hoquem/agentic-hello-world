# Episode 1 — Recording-day checklist (one-pass plan)

Goal: record VO + assemble the cut in a single session. Work top to bottom.

## 0. Pre-flight (5 min)
- [ ] Quiet room; phone on silent; close noisy apps.
- [ ] Mic check — record 5s, listen back (no hum, no clipping, no echo).
- [ ] Dev server up: `make dev` (→ http://localhost:8420) — only needed if re-recording footage.
- [ ] Ollama daemon signed in; models pulled (kimi-k2.6:cloud, qwen3-coder-next:cloud).
- [ ] Footage present in `production/` (already rendered): `vhs/*.mp4`, `app-demo/app-demo.mp4`, `cards/*.png`. (Re-render anytime per `production/README.md`.)

## 1. Record VO (20–30 min) — `production/vo/vo-sheet.md`
- [ ] Read **one TAKE at a time**, pause ~2s between takes (clean cut points).
- [ ] Re-read any take until you like it; keep the best — don't aim for one perfect pass.
- [ ] Tone: calm, "explaining to a smart friend." Hit the `[beat]` pauses.
- [ ] Watch the two reworded lines: TAKE 9 ("we never reached *inside* the model…") and the pronunciations (Ollama = "oh-LAH-ma").
- [ ] Export VO as one file (or per-take); name it clearly.

## 2. Assemble in CapCut (60–90 min) — EDL in `production/README.md`
- [ ] New 1920×1080 / 30fps project.
- [ ] Import: 5 clips, `cards/*.png`, your VO.
- [ ] Lay clips in EDL order; drop VO underneath; nudge clips to your VO timing.
- [ ] **Title card** (`title-card.png`) at the very front (~3s) — or use the built preview as reference.
- [ ] **Cold tease (0:10):** jump-cut the funfact clip to just **two differing answer lines** (don't show full runs).
- [ ] **Reveal (1:10):** put `print-x3` and `llm-funfact-x3` **side-by-side** (two tracks, each ~half width).
- [ ] **End card** (`end-card.png`) at the end (~4–5s); add YouTube end-screen elements in Studio later.
- [ ] **Captions:** Auto-captions on the VO track → style large, bottom-center.
- [ ] **Music:** one calm bed, ducked ~-18dB under VO.
- [ ] Trim dead air (the kimi "thinking" pauses in the app demo can be sped 1.5–2×).
- [ ] Export: 1080p, H.264, ~10–16 Mbps.

## 3. Publish (15 min) — YouTube Studio
- [ ] Upload export.
- [ ] Title: from `production/youtube/thumbnail-brief.md`.
- [ ] Description: paste `production/youtube/description.md`.
- [ ] Thumbnail: `cards/thumbnail.png`.
- [ ] Chapters: paste `production/youtube/chapters.txt` — **re-timed to your final cut**.
- [ ] End screen: Subscribe + "Episode 2" placeholder.
- [ ] Visibility: Unlisted first → watch it through once → then Public.

## Final gut-check before publish
- [ ] Hook lands in the first ~3 seconds.
- [ ] The "same code → different answer" reveal is unmistakable.
- [ ] Audio levels consistent; no peaks; captions synced.
- [ ] Every on-screen claim matches what's shown (no system-prompt content leaked from Ep2).
