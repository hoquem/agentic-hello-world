# scripts/smoke_cloud.py
"""Manual smoke test against Ollama Cloud. Requires OLLAMA_API_KEY.

Run: venv/bin/python scripts/smoke_cloud.py
"""
from app.config import load_config
from app.harness import Harness
from app.ollama_client import make_client, stream_chat


def main() -> None:
    cfg = load_config()
    client = make_client(cfg.host, cfg.api_key)
    h = Harness(chat_fn=lambda req: stream_chat(client, req), model=cfg.model)
    h.add_user_message("Reply with exactly: Hello World!")
    for event in h.run():
        if event["type"] == "sent":
            print("SENT:", event["request"])
        elif event["type"] == "received_chunk":
            print(event["raw"]["message"]["content"], end="", flush=True)
        elif event["type"] == "display":
            print("\nDISPLAY:", event["content"])


if __name__ == "__main__":
    main()
