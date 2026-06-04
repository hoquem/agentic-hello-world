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


def fake_get_harness(system: bool = True) -> Harness:
    # Mirrors the real get_harness mapping, but network-free: the `system` query
    # param decides whether a system prompt is configured.
    system_prompt = "SYSTEM PROMPT" if system else None
    return Harness(chat_fn=fake_chat_fn, model="m", system_prompt=system_prompt)


def _sent_messages(body: str) -> list[dict]:
    """Pull the `sent` event's request messages out of an SSE response body."""
    for line in body.splitlines():
        if line.startswith("data:"):
            payload = json.loads(line[len("data:"):].strip())
            if payload["type"] == "sent":
                return payload["request"]["messages"]
    raise AssertionError("no 'sent' event found in stream")


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

    payloads = [
        json.loads(line[len("data:"):].strip())
        for line in body.splitlines()
        if line.startswith("data:")
    ]
    types = [p["type"] for p in payloads]
    assert types[0] == "sent"
    assert types[-1] == "display"
    assert payloads[-1]["content"] == "Hello World!"


def test_system_true_includes_system_message():
    server.app.dependency_overrides[server.get_harness] = fake_get_harness
    try:
        client = TestClient(server.app)
        with client.stream(
            "GET", "/api/chat", params={"message": "hi", "system": "true"}
        ) as resp:
            body = "".join(resp.iter_text())
    finally:
        server.app.dependency_overrides.clear()

    roles = [m["role"] for m in _sent_messages(body)]
    assert roles == ["system", "user"]


def test_system_false_omits_system_message():
    server.app.dependency_overrides[server.get_harness] = fake_get_harness
    try:
        client = TestClient(server.app)
        with client.stream(
            "GET", "/api/chat", params={"message": "hi", "system": "false"}
        ) as resp:
            body = "".join(resp.iter_text())
    finally:
        server.app.dependency_overrides.clear()

    roles = [m["role"] for m in _sent_messages(body)]
    assert roles == ["user"]


def test_root_and_index_serve_html():
    client = TestClient(server.app)
    for path in ["/", "/index.html"]:
        resp = client.get(path)
        assert resp.status_code == 200
        assert "text/html" in resp.headers["content-type"]


def test_favicon_served():
    client = TestClient(server.app)
    resp = client.get("/favicon.ico")
    assert resp.status_code == 200


def test_responses_are_not_cached():
    # The UI is edited constantly; responses must tell the browser to revalidate
    # so edits to web/ show up on a normal reload.
    client = TestClient(server.app)
    for path in ["/", "/static/app.js", "/static/style.css"]:
        resp = client.get(path)
        assert resp.status_code == 200
        assert "no-cache" in resp.headers.get("cache-control", "")
