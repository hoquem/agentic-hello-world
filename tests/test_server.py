# tests/test_server.py
import json

from fastapi.testclient import TestClient

from app import server
from app.harness import Harness


def fake_chat_fn(request):
    for piece in ["Hello", " World", "!"]:
        yield {"message": {"content": piece}, "done": False}
    yield {"message": {"content": ""}, "done": True}


def make_fake_harness() -> Harness:
    # Model inlined (not a default arg) so FastAPI doesn't treat it as a query param.
    return Harness(chat_fn=fake_chat_fn, model="gpt-oss:120b")


def test_chat_endpoint_streams_events():
    server.app.dependency_overrides[server.get_harness] = make_fake_harness
    try:
        client = TestClient(server.app)
        with client.stream(
            "GET", "/api/chat", params={"message": "Reply with exactly: Hello World!"}
        ) as resp:
            assert resp.status_code == 200
            body = "".join(resp.iter_text())
    finally:
        server.app.dependency_overrides.clear()

    # Collect JSON payloads from the SSE "data:" lines.
    payloads = [
        json.loads(line[len("data:"):].strip())
        for line in body.splitlines()
        if line.startswith("data:")
    ]
    types = [p["type"] for p in payloads]
    assert types[0] == "sent"
    assert types[-1] == "display"
    assert payloads[-1]["content"] == "Hello World!"


def test_root_serves_index():
    client = TestClient(server.app)
    resp = client.get("/")
    assert resp.status_code == 200
    assert "text/html" in resp.headers["content-type"]
