// Renders the blog diagrams to crisp PNGs (same approach as render-cards.mjs).
// Run from the repo root:  node production/blog/render-blog.mjs
import { chromium } from "playwright";

const DIR = process.cwd() + "/production/blog";
const OUT = DIR + "/img";

// One entry per diagram. Sizes are the on-page canvas; deviceScaleFactor 2
// makes the text crisp and downscales cleanly when uploaded to Medium.
const diagrams = [
  { file: "01-llm-function.html", out: "01-llm-function.png", w: 1600, h: 900 },
  { file: "02-actors.html",       out: "02-actors.png",       w: 1600, h: 900 },
  { file: "03-cards.html",        out: "03-cards.png",        w: 1600, h: 760 },
  { file: "04-flow.html",         out: "04-flow.png",         w: 1600, h: 900 },
  { file: "05-deck.html",         out: "05-deck.png",         w: 1600, h: 900 },
  { file: "06-window.html",       out: "06-window.png",       w: 1600, h: 900 },
  { file: "07-ladder.html",       out: "07-ladder.png",       w: 1500, h: 1500 },
  { file: "08-takeaway.html",     out: "08-takeaway.png",     w: 1600, h: 760 },
  { file: "09-endcard.html",      out: "end-card-medium.png", w: 1600, h: 900 },
];

const browser = await chromium.launch();
for (const d of diagrams) {
  const ctx = await browser.newContext({
    viewport: { width: d.w, height: d.h },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto("file://" + DIR + "/" + d.file);
  await page.screenshot({ path: OUT + "/" + d.out });
  await ctx.close();
  console.log("rendered", d.out);
}
await browser.close();
