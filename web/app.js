const $ = (id) => document.getElementById(id);

function addCard(role, content) {
  const card = document.createElement("div");
  card.className = `card ${role}`;
  card.innerHTML = `<div class="role">${role}</div><div>${content}</div>`;
  $("deck").appendChild(card);
}

$("composer").addEventListener("submit", (e) => {
  e.preventDefault();
  const message = $("message").value;

  // reset panels
  $("deck").innerHTML = "";
  $("output").textContent = "";
  $("sent").textContent = "";
  $("received").textContent = "";
  $("decision").textContent = "";

  addCard("user", message);

  const es = new EventSource(`/api/chat?message=${encodeURIComponent(message)}`);
  es.onmessage = (ev) => {
    const event = JSON.parse(ev.data);
    if (event.type === "sent") {
      $("sent").textContent = JSON.stringify(event.request, null, 2);
    } else if (event.type === "received_chunk") {
      // Show the literal wire: one raw JSON chunk per line.
      $("received").textContent += JSON.stringify(event.raw) + "\n";
    } else if (event.type === "display") {
      addCard("assistant", event.content);
      $("output").textContent = event.content;
      $("decision").textContent = 'decision: display →';
      es.close();
    }
  };
  es.onerror = () => {  // surface failures; do not hide them
    $("decision").textContent = "error: stream failed (see server logs)";
    es.close();
  };
});
