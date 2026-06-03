# tests/test_harness.py
from app.harness import Harness


def fake_chat_fn(request):
    # Mimics ollama streaming chunk shape.
    for piece in ["Hello", " World", "!"]:
        yield {"message": {"content": piece}, "done": False}
    yield {"message": {"content": ""}, "done": True}


def test_harness_emits_sent_then_chunks_then_display():
    h = Harness(chat_fn=fake_chat_fn, model="gpt-oss:120b")
    h.add_user_message("Reply with exactly: Hello World!")
    events = list(h.run())

    assert events[0]["type"] == "sent"
    assert events[0]["request"]["messages"][0]["content"] == "Reply with exactly: Hello World!"
    assert events[0]["request"]["model"] == "gpt-oss:120b"

    # RECEIVED carries the raw chunk verbatim (nothing hidden on the wire).
    chunks = [e for e in events if e["type"] == "received_chunk"]
    assert "".join(c["raw"]["message"]["content"] for c in chunks) == "Hello World!"

    assert events[-1] == {"type": "display", "content": "Hello World!"}


def test_harness_appends_assistant_message_to_deck():
    h = Harness(chat_fn=fake_chat_fn, model="m")
    h.add_user_message("hi")
    list(h.run())
    assert h.messages == [
        {"role": "user", "content": "hi"},
        {"role": "assistant", "content": "Hello World!"},
    ]


def test_harness_handles_none_content_chunks():
    """Thinking models emit chunks whose ``content`` is ``None``; the harness
    must skip them when assembling text yet still emit them raw on the wire."""

    def thinking_chat_fn(request):
        yield {"message": {"content": None, "thinking": "hmm"}, "done": False}
        yield {"message": {"content": "Hello"}, "done": False}
        yield {"message": {"content": None}, "done": True}

    h = Harness(chat_fn=thinking_chat_fn, model="m")
    h.add_user_message("hi")
    events = list(h.run())

    # The None chunks are still shown verbatim on the wire (nothing hidden).
    chunks = [e for e in events if e["type"] == "received_chunk"]
    assert len(chunks) == 3
    assert chunks[0]["raw"]["message"]["content"] is None

    # ...but they contribute no text to the assembled reply.
    assert events[-1] == {"type": "display", "content": "Hello"}
    assert h.messages[-1] == {"role": "assistant", "content": "Hello"}
