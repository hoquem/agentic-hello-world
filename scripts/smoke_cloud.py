# scripts/smoke_cloud.py
"""Manual smoke test through the local Ollama daemon (which proxies to cloud).

Prereqs (one time): `ollama signin`, then `ollama pull <model>` for the model in
your .env / defaults.

Run: venv/bin/python scripts/smoke_cloud.py
"""
from app.config import load_config
from app.harness import Harness
from app.ollama_client import make_client, stream_chat, verify_daemon


def main() -> None:
    cfg = load_config()
    client = make_client(cfg.host)
    verify_daemon(client, cfg.model)  # fail loudly before we stream
    h = Harness(chat_fn=lambda req: stream_chat(client, req), model=cfg.model)
    h.add_user_message("Reply with exactly: Hello World!")
    for event in h.run():
        if event["type"] == "sent":
            print("SENT:", event["request"])
        elif event["type"] == "received_chunk":
            content = event["raw"]["message"]["content"]
            if content:  # thinking/done chunks carry no display text
                print(content, end="", flush=True)
        elif event["type"] == "display":
            print("\nDISPLAY:", event["content"])


if __name__ == "__main__":
    main()
