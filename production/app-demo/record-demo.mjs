// production/app-demo/record-demo.mjs
// Records a clean, reproducible run of the Episode 1 app demo.
//
// One-time setup (from repo root):
//   npm init -y && npm i -D playwright && npx playwright install chromium
//
// Then, with the dev server running (`make dev` → :8420) and the daemon up:
//   node production/app-demo/record-demo.mjs
//
// Output: production/app-demo/footage/<hash>.webm
// Convert to MP4 for CapCut:  ffmpeg -i production/app-demo/footage/*.webm production/app-demo/app-demo.mp4
//
// CAVEAT: Playwright video has no visible mouse cursor — popovers will appear
// "on their own." That's clean for a teaching cut, but if you want a visible
// cursor + auto-zoom, screen-record this same flow manually with Screen Studio
// instead. The beats/timing below are the shot list either way.

import { chromium } from "playwright";

const BASE = process.env.APP_URL || "http://localhost:8420";
const VIEWPORT = { width: 1920, height: 1080 };
const HELLO = "Reply with exactly: Hello World!";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function send(page, message) {
  await page.fill("#message", message);
  await page.click("#composer button");
  await page.waitForFunction(
    () => document.getElementById("decision")?.textContent?.includes("display"),
    { timeout: 60000 },
  );
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORT,
  recordVideo: { dir: "production/app-demo/footage", size: VIEWPORT },
});
const page = await context.newPage();
await page.goto(BASE);
await sleep(1500);

// Episode 1 runs with the system prompt OFF (introduced in Ep2).
if ((await page.getAttribute("#toggle", "data-on")) === "with") await page.click("#toggle");
await sleep(800);

// Beat 1 — meet the app: send Hello World on a reasoning model (kimi default).
await page.selectOption("#model", "kimi-k2.6:cloud");
await sleep(500);
await send(page, HELLO);
await sleep(3500);

// Beat 2 — the harness code popover (dwell so you can talk over it).
await page.hover("#node-harness .badge");
await sleep(5000);
await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height - 40);
await sleep(800);

// Beat 3 — reasoning model on the wire: re-send so the thinking stream is fresh.
await send(page, HELLO);
await sleep(3500);

// Beat 4 — switch to a non-reasoning model, same message: no thinking.
await page.selectOption("#model", "qwen3-coder-next:cloud");
await sleep(800);
await send(page, HELLO);
await sleep(3500);

// Beat 5 — the RECEIVED field legend.
await page.hover("#received-head");
await sleep(5000);

await context.close(); // finalizes the .webm
await browser.close();
console.log("Done. Footage in production/app-demo/footage/ (convert to .mp4 with ffmpeg).");
