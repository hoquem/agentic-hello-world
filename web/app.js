// web/app.js
// The browser side of the harness. It opens a streaming connection to the
// server and mirrors, step by step, exactly what the harness reports doing:
// what it SENT, each raw chunk it RECEIVED, and the final answer to DISPLAY.
// Nothing here invents data — every panel is filled from the server's events.

const $ = (id) => document.getElementById(id);

// Whether the harness should add its system prompt. The user never types the
// prompt itself; this toggle only turns it on or off so you can see the effect.
let useSystemPrompt = true;

// Light up the pipeline and set the status pill. Each "phase" is a moment in
// the journey: which node is active/done, and which segment is flowing.
//   states: "idle" | "active" | "done";  flow: "out" | "in" | "" (none)
function setPhase(text, { user, harness, ollama, flow }) {
  $("state").textContent = text;
  $("node-user").dataset.state = user;
  $("node-harness").dataset.state = harness;
  $("node-ollama").dataset.state = ollama;
  $("seg-out").dataset.flow = flow === "out" ? "on" : "";
  $("seg-in").dataset.flow = flow === "in" ? "on" : "";
}

// Render one message card in the Harness deck. We use textContent (not
// innerHTML) so the text is shown literally and can never inject markup.
function addCard(role, content) {
  const card = document.createElement("div");
  card.className = `card ${role}`;
  const label = document.createElement("div");
  label.className = "role";
  label.textContent = role === "system" ? "system · added by harness" : role;
  const body = document.createElement("div");
  body.className = "txt";
  body.textContent = content;
  card.append(label, body);
  $("deck").appendChild(card);
}

// Escape text before putting it in HTML (model output is untrusted).
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Usage/timing stats — highlighted teal so the "learning data" stands out.
const STAT_KEYS = new Set([
  "eval_count", "prompt_eval_count", "total_duration",
  "load_duration", "eval_duration", "prompt_eval_duration", "done_reason",
]);

// Turn one chunk into color-coded JSON. The whole chunk is shown verbatim
// (nothing hidden); colors just make the important fields easy to spot:
// content = green, thinking = purple, done:true = amber, usage stats = teal.
function colorize(key, value) {
  if (value === null) return '<span class="j-null">null</span>';
  if (Array.isArray(value))
    return "[" + value.map((v) => colorize(null, v)).join(", ") + "]";
  if (typeof value === "object")
    return "{" + Object.entries(value)
      .map(([k, v]) => `<span class="j-key">"${esc(k)}"</span>: ${colorize(k, v)}`)
      .join(", ") + "}";
  if (typeof value === "string") {
    const cls = key === "content" && value ? "j-content"
              : key === "thinking" && value ? "j-thinking" : "j-str";
    return `<span class="${cls}">"${esc(value)}"</span>`;
  }
  if (typeof value === "boolean")
    return `<span class="${key === "done" && value ? "j-done" : "j-num"}">${value}</span>`;
  return `<span class="${STAT_KEYS.has(key) ? "j-stat" : "j-num"}">${value}</span>`;
}

// Show one received chunk: a colored tag for what it carries, then the full
// color-coded chunk. "done" is the final summary chunk; an empty in-between
// chunk (no text, not done) is a "step".
function addChunk(raw) {
  const msg = raw.message || {};
  let tag = "step";
  if (raw.done) tag = "done";
  else if (msg.content) tag = "content";
  else if (msg.thinking) tag = "thinking";

  const line = document.createElement("div");
  line.className = "chunk";
  line.dataset.tag = tag;
  line.innerHTML = `<span class="tag">${tag}: </span>${colorize(null, raw)}`;
  $("received").appendChild(line);
}

// The toggle in the Harness panel header: include the system prompt, or not.
// "without" also disables the editable field, to make it clear nothing is sent.
$("toggle").addEventListener("click", () => {
  useSystemPrompt = !useSystemPrompt;
  $("toggle").dataset.on = useSystemPrompt ? "with" : "without";
  $("system-prompt").disabled = !useSystemPrompt;
});

// Hover popovers (pipeline nodes + the RECEIVED field legend). We open on hover
// and keep the popover open while the cursor is over EITHER the host or the
// popover, with a short grace delay — so you can move onto it to point at or
// select the content while talking through it on camera.
// A ".floating" popover lives inside a scrolling panel, so we position it with
// fixed coordinates (relative to the host) to avoid being clipped.
document.querySelectorAll(".has-pop").forEach((host) => {
  const popover = host.querySelector(".popover");
  let closeTimer;
  const open = () => {
    clearTimeout(closeTimer);
    if (popover.classList.contains("floating")) {
      const r = host.getBoundingClientRect();
      popover.style.top = `${r.bottom + 8}px`;
      popover.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - 440))}px`;
    }
    popover.classList.add("open");
  };
  const closeSoon = () => { closeTimer = setTimeout(() => popover.classList.remove("open"), 300); };
  host.addEventListener("mouseenter", open);
  host.addEventListener("mouseleave", closeSoon);
  popover.addEventListener("mouseenter", open);   // moving onto the popover keeps it open
  popover.addEventListener("mouseleave", closeSoon);
});

// Send a message and stream the harness's events back.
$("composer").addEventListener("submit", (e) => {
  e.preventDefault();
  const message = $("message").value;
  if (!message.trim()) return;  // nothing to send — don't fire an empty request

  // Clear every panel so each run starts fresh.
  $("deck").innerHTML = "";
  $("received").innerHTML = "";
  $("sent").textContent = "";
  $("answer").textContent = "";
  $("answer").classList.remove("streaming");
  $("decision").textContent = "";

  setPhase("sending…", { user: "done", harness: "active", ollama: "idle", flow: "out" });

  // The system prompt we send is whatever is in the editable field — or empty
  // when the toggle is "without". The server prepends it verbatim, so editing
  // the field really changes what the model is told.
  const systemPrompt = useSystemPrompt ? $("system-prompt").value : "";
  const url = `/api/chat?message=${encodeURIComponent(message)}`
            + `&system_prompt=${encodeURIComponent(systemPrompt)}`
            + `&model=${encodeURIComponent($("model").value)}`;
  const es = new EventSource(url);
  let sawContent = false;

  es.onmessage = (ev) => {
    const event = JSON.parse(ev.data);

    if (event.type === "sent") {
      // Show the exact request, and build the deck FROM it — so what you see is
      // precisely what was sent (the system message appears only if present).
      $("sent").textContent = JSON.stringify(event.request, null, 2);
      for (const m of event.request.messages) addCard(m.role, m.content);
      // The Ollama node shows the ACTUAL model from the request we just sent.
      $("ollama-model").textContent = event.request.model;
      $("pop-model").textContent = event.request.model;  // keep the hover popover accurate too
      setPhase("waiting for the model…", { user: "done", harness: "done", ollama: "active", flow: "in" });

    } else if (event.type === "received_chunk") {
      addChunk(event.raw);
      const content = event.raw.message && event.raw.message.content;
      if (content) {
        sawContent = true;
        $("answer").classList.add("streaming");
        $("answer").textContent += content;  // the reply types in live
        setPhase("receiving reply…", { user: "done", harness: "done", ollama: "active", flow: "in" });
      } else if (!sawContent) {
        setPhase("model is thinking…", { user: "done", harness: "done", ollama: "active", flow: "in" });
      }

    } else if (event.type === "display") {
      // The harness's decision: show the assembled reply.
      addCard("assistant", event.content);
      $("answer").textContent = event.content;
      $("answer").classList.remove("streaming");
      $("decision").textContent = "decision: display →";
      setPhase("done", { user: "done", harness: "done", ollama: "done", flow: "" });
      es.close();
    }
  };

  es.onerror = () => {
    // Surface failures; never hide them.
    setPhase("error: stream failed (see server logs)", { user: "done", harness: "done", ollama: "idle", flow: "" });
    $("answer").classList.remove("streaming");
    es.close();
  };
});
