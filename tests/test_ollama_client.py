# tests/test_ollama_client.py
from app.ollama_client import build_request


def test_build_request_shape():
    messages = [{"role": "user", "content": "Reply with exactly: Hello World!"}]
    req = build_request(messages, model="gpt-oss:120b")
    assert req == {
        "model": "gpt-oss:120b",
        "messages": [{"role": "user", "content": "Reply with exactly: Hello World!"}],
        "stream": True,
    }


def test_build_request_does_not_alias_messages():
    messages = [{"role": "user", "content": "hi"}]
    req = build_request(messages, model="m")
    req["messages"].append({"role": "user", "content": "mutated"})
    assert len(messages) == 1  # builder must copy, not alias
