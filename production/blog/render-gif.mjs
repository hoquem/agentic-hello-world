// Records the animated diagrams to looping GIFs.
// Pipeline: Playwright records the CSS animation to webm, ffmpeg converts to a
// high-quality, infinitely-looping GIF (two-pass palette for clean color).
// Run from the repo root:  node production/blog/render-gif.mjs
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DIR = process.cwd() + "/production/blog";
const OUT = DIR + "/img";

// One entry per animation. `secs` should equal the CSS loop length so the GIF
// loops seamlessly. `fps` trades smoothness against file size.
const anims = [
  { file: "04-flow-anim.html", out: "04-flow.gif", w: 1200, h: 675, secs: 6, fps: 24 },
  { file: "05-deck-anim.html", out: "05-deck.gif", w: 1200, h: 675, secs: 6, fps: 24 },
];

const browser = await chromium.launch();
for (const a of anims) {
  const tmp = mkdtempSync(join(tmpdir(), "gif-"));
  const ctx = await browser.newContext({
    viewport: { width: a.w, height: a.h },
    deviceScaleFactor: 1,
    recordVideo: { dir: tmp, size: { width: a.w, height: a.h } },
  });
  const page = await ctx.newPage();
  await page.goto("file://" + DIR + "/" + a.file);
  await page.waitForTimeout(a.secs * 1000);
  await page.close();          // flushes the video
  await ctx.close();
  const webm = execFileSync("ls", [tmp]).toString().trim().split("\n")[0];
  const src = join(tmp, webm);

  // two-pass: build an optimized palette, then apply it
  const palette = join(tmp, "palette.png");
  const vf = `fps=${a.fps},scale=${a.w}:-1:flags=lanczos`;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-vf", `${vf},palettegen=stats_mode=full`, palette]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-i", palette,
    "-lavfi", `${vf} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3`,
    "-loop", "0", join(OUT, a.out)]);
  rmSync(tmp, { recursive: true, force: true });
  console.log("rendered", a.out);
}
await browser.close();
