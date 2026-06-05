// Renders the title card, end card, and thumbnail to crisp PNGs.
// Run from the repo root:  node production/cards/render-cards.mjs
import { chromium } from "playwright";

const DIR = process.cwd() + "/production/cards";
const cards = [
  { file: "title.html", out: "title-card.png", w: 1920, h: 1080 },
  { file: "end.html", out: "end-card.png", w: 1920, h: 1080 },
  { file: "thumbnail.html", out: "thumbnail.png", w: 1280, h: 720 },
];

const browser = await chromium.launch();
for (const c of cards) {
  const ctx = await browser.newContext({
    viewport: { width: c.w, height: c.h },
    deviceScaleFactor: 2, // 2x for crisp text; downscales cleanly on upload
  });
  const page = await ctx.newPage();
  await page.goto("file://" + DIR + "/" + c.file);
  await page.screenshot({ path: DIR + "/" + c.out });
  await ctx.close();
  console.log("rendered", c.out);
}
await browser.close();
