// Builds a single self-contained page for pasting the post into Medium by hand.
//   node production/blog/build-medium-preview.mjs   →   production/blog/medium-preview.html
//
// Open the output in a browser. Step 1: click "Select the article" and Cmd/Ctrl-C,
// then paste into the Medium editor (headings, bold, links, blockquotes survive).
// Step 2: work down the image gallery — drag each file in at its ⟦ IMAGE ⟧ anchor,
// then copy its caption and alt text into Medium's fields.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const SRC = ROOT + "/docs/blog/2026-06-29-an-agent-is-an-llm-wrapped-in-a-harness.md";

// Alt text per image (basename → alt). The outstanding accessibility/SEO to-do.
const ALT = {
  "01-llm-function.png": "A model is a function: a blue ‘text in’ card reading “Reply with: Hello World!” flows into a sealed black box labelled LLM, and a green ‘text out’ card reading “Hello World!” flows out. The box is stamped stateless, can’t press a button, forgets everything.",
  "02-actors.png": "The three actors: USER on the left, HARNESS glowing in the centre, and the LLM on the right. Only the harness changes — it builds and sends the deck and decides what happens next.",
  "03-cards.png": "The role colour code: an amber System card (the job description), a blue User card (the request), a green Assistant card (the reply), and a purple Tool card (a result handed back to the model).",
  "04-flow.gif": "Animated: the Hello World loop in four steps that light up in sequence — WRAP the user message, SEND it to the LLM, RECEIVE the assistant reply, DISPLAY it on screen.",
  "05-deck.gif": "Animated: the deck grows. Each turn the harness ships the whole stack of cards to the LLM — starting with a system and user card, then growing to include the assistant reply and the next user message.",
  "06-window.png": "A fixed-size context-window frame holds a stack of message cards. As the deck grows past the frame, the oldest cards fade out the top — which is why agents ‘forget.’",
  "07-ladder.png": "An eight-rung ladder of capabilities — Hello World, system prompt, reading the reply, tools, context & memory, planning, reasoning, capstone — each adding code to the harness. Beside it, a frozen LLM stamped ‘unchanged’ at every step.",
  "app-the-wire.png": "Screenshot of the transparent harness app: the left panel shows the user message and the answer “Hello World!”, the centre shows the deck of role-coloured cards, and the right shows the literal JSON sent to the model and the raw response streaming back token by token.",
  "end-card-medium.png": "End card: Building an AI Agent from Zero. An agent is an LLM wrapped in a harness; the series builds it one rung at a time, all in the harness, and the model never changes. Follow for the next part.",
};

let md = readFileSync(SRC, "utf8").replace(/<!--[\s\S]*?-->/g, "");

// Pull out each image block ( [IMAGE: path] optionally followed by *Caption: …* )
// and leave a token in its place so pandoc converts only the prose.
const images = [];
// [^\S\n] = whitespace except newline, so we consume the image line's newline and
// (only if present) the *Caption:* line right after it — without eating blank lines.
md = md.replace(
  /\[IMAGE:\s*([^\]]+?)\s*\][^\S\n]*\n(?:[^\S\n]*\*Caption:\s*([^\n]*?)\*[^\S\n]*\n)?/g,
  (_m, path, caption) => {
    const file = path.split("/").pop();
    images.push({ n: images.length + 1, path: path.trim(), file, caption: (caption || "").trim(), alt: ALT[file] || "" });
    return `\n\nIMGPLACEHOLDER${images.length}X\n\n`;
  }
);

// Markdown → HTML (prose only).
let body = execFileSync("pandoc", ["-f", "markdown", "-t", "html5"], { input: md }).toString();

// Replace each token with a copyable, clearly-marked drag anchor.
for (const im of images) {
  const anchor =
    `<p class="anchor">⟦ IMAGE ${im.n}: drag <b>${im.file}</b>` +
    (im.caption ? ` &nbsp;·&nbsp; CAPTION: ${escapeHtml(im.caption)}` : "") +
    (im.alt ? ` &nbsp;·&nbsp; ALT: ${escapeHtml(im.alt)}` : "") +
    ` ⟧</p>`;
  body = body.replace(new RegExp(`<p>IMGPLACEHOLDER${im.n}X</p>`), anchor);
}

const gallery = images.map((im) => `
  <figure class="gitem">
    <div class="gnum">${im.n}</div>
    <img src="file://${ROOT}/${im.path}" alt="">
    <div class="gmeta">
      <div class="gfile">📎 <code>${im.path}</code></div>
      ${im.caption ? `<label>Caption <textarea readonly rows="2">${escapeHtml(im.caption)}</textarea></label>` : ""}
      <label>Alt text <textarea readonly rows="3">${escapeHtml(im.alt)}</textarea></label>
    </div>
  </figure>`).join("\n");

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Medium publishing preview</title>
<style>
  :root{--bg:#0f1115;--card:#1a1d23;--line:#2a2e37;--fg:#e8e8e8;--muted:#8b94a3;--accent:#4ec9b0}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;padding:40px}
  .wrap{max-width:820px;margin:0 auto}
  .how{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 22px;margin-bottom:24px}
  .how h2{margin:.2em 0 .4em;font-size:18px}
  .how ol{margin:.3em 0;padding-left:1.3em} .how li{margin:.25em 0}
  button{background:var(--accent);color:#06231d;border:0;border-radius:8px;padding:10px 16px;font-weight:700;font-size:15px;cursor:pointer}
  .status{margin-left:12px;color:var(--accent);font-weight:600}
  /* ---- the copyable article ---- */
  #copy{background:#fff;color:#16181d;border-radius:12px;padding:40px 48px;font:18px/1.7 Georgia,serif}
  #copy h1{font-size:34px;line-height:1.2;font-family:-apple-system,Segoe UI,Roboto,sans-serif}
  #copy h2{font-size:25px;margin-top:1.6em;font-family:-apple-system,Segoe UI,Roboto,sans-serif}
  #copy blockquote{border-left:4px solid #ccc;margin:1.2em 0;padding:.2em 1em;color:#444;font-style:italic}
  #copy a{color:#1a73e8} #copy code{background:#eef0f3;padding:1px 5px;border-radius:4px;font-size:.9em}
  #copy .anchor{background:#fff7e6;border:1px dashed #e0a800;border-radius:6px;padding:8px 12px;
                font:13px/1.5 ui-monospace,Menlo,monospace;color:#7a5b00}
  .ghead{margin:34px 0 10px;font-size:18px}
  .gitem{display:grid;grid-template-columns:120px 1fr;gap:16px;align-items:start;background:var(--card);
         border:1px solid var(--line);border-radius:12px;padding:14px;margin:0 0 14px;position:relative}
  .gitem img{width:120px;border-radius:8px;border:1px solid var(--line)}
  .gnum{position:absolute;top:8px;left:8px;width:24px;height:24px;border-radius:50%;background:var(--accent);
        color:#06231d;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:13px}
  .gmeta{min-width:0} .gfile{margin:0 0 8px;color:var(--muted);font-size:14px} .gfile code{color:var(--fg)}
  .gmeta label{display:block;font-size:12px;color:var(--muted);margin:6px 0}
  .gmeta textarea{width:100%;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:6px;
        padding:8px;font:13px/1.5 ui-monospace,Menlo,monospace;resize:vertical}
</style></head>
<body><div class="wrap">
  <div class="how">
    <h2>Publish to Medium — two steps</h2>
    <ol>
      <li><b>Article:</b> click <i>Select the article</i>, press <b>⌘/Ctrl-C</b>, then paste into a new Medium story. Headings, bold, links and blockquotes carry over. You'll see <code>⟦ IMAGE n ⟧</code> anchor lines where pictures go.</li>
      <li><b>Images:</b> for each item below, drag the file into Medium at its anchor line, paste the <b>Caption</b> under it, add the <b>Alt</b> text (Medium: click image → ⋯ → Alt), then delete that anchor line. Files live in <code>production/blog/img/</code>.</li>
    </ol>
    <button onclick="sel()">Select the article</button><span class="status" id="st"></span>
  </div>

  <article id="copy">${body}</article>

  <h3 class="ghead">Images, in order — drag each in, then copy its caption &amp; alt</h3>
  ${gallery}
</div>
<script>
  function sel(){
    const r=document.createRange();r.selectNodeContents(document.getElementById('copy'));
    const s=getSelection();s.removeAllRanges();s.addRange(r);
    try{navigator.clipboard&&navigator.clipboard.write&&navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([document.getElementById('copy').innerHTML],{type:'text/html'})})]);}catch(e){}
    document.getElementById('st').textContent='Selected — now press ⌘/Ctrl-C, then paste into Medium.';
  }
</script>
</body></html>`;

function escapeHtml(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

writeFileSync(ROOT + "/production/blog/medium-preview.html", html);
console.log("wrote production/blog/medium-preview.html  (" + images.length + " images)");
