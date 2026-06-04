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

// Show one raw received chunk, tagged by what it carries: thinking tokens (the
// model reasoning, purple), content tokens (the actual reply, green), or the
// final "done" marker. The full raw chunk is shown — nothing cleaned up.
function addChunk(raw) {
  const msg = raw.message || {};
  let tag = "done";
  if (msg.content) tag = "content";
  else if (msg.thinking) tag = "thinking";

  const line = document.createElement("div");
  line.className = "chunk";
  line.dataset.tag = tag;
  const label = document.createElement("span");
  label.className = "tag";
  label.textContent = tag + ": ";
  const body = document.createElement("span");
  body.textContent = JSON.stringify(raw);
  line.append(label, body);
  $("received").appendChild(line);
}

// The toggle in the Harness panel header: flip the system prompt on/off.
$("toggle").addEventListener("click", () => {
  useSystemPrompt = !useSystemPrompt;
  $("toggle").dataset.on = useSystemPrompt ? "with" : "without";
});

// Send a message and stream the harness's events back.
$("composer").addEventListener("submit", (e) => {
  e.preventDefault();
  const message = $("message").value;

  // Clear every panel so each run starts fresh.
  $("deck").innerHTML = "";
  $("received").innerHTML = "";
  $("sent").textContent = "";
  $("answer").textContent = "";
  $("answer").classList.remove("streaming");
  $("decision").textContent = "";

  setPhase("sending…", { user: "done", harness: "active", ollama: "idle", flow: "out" });

  // Open the stream. The server reads ?system= to decide whether the harness
  // adds its system prompt — so this toggle changes what is really sent.
  const url = `/api/chat?message=${encodeURIComponent(message)}&system=${useSystemPrompt}`;
  const es = new EventSource(url);
  let sawContent = false;

  es.onmessage = (ev) => {
    const event = JSON.parse(ev.data);

    if (event.type === "sent") {
      // Show the exact request, and build the deck FROM it — so what you see is
      // precisely what was sent (the system message appears only if present).
      $("sent").textContent = JSON.stringify(event.request, null, 2);
      for (const m of event.request.messages) addCard(m.role, m.content);
      // The Ollama node reflects the ACTUAL model from the request we just sent:
      // a ":cloud" suffix means Ollama is offloading to the cloud, else it's local.
      $("ollama-model").textContent = event.request.model;
      $("ollama-mode").dataset.mode = event.request.model.endsWith(":cloud") ? "cloud" : "local";
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
