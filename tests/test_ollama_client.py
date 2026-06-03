# tests/test_ollama_client.py
import pytest

from app.ollama_client import build_request, verify_daemon


def test_build_request_shape():
    messages = [{"role": "user", "content": "Reply with exactly: Hello World!"}]
    req = build_request(messages, model="kimi-k2.6:cloud")
    assert req == {
        "model": "kimi-k2.6:cloud",
        "messages": [{"role": "user", "content": "Reply with exactly: Hello World!"}],
        "stream": True,
    }


def test_build_request_does_not_alias_messages():
    messages = [{"role": "user", "content": "hi"}]
    req = build_request(messages, model="m")
    req["messages"].append({"role": "user", "content": "mutated"})
    assert len(messages) == 1  # builder must copy, not alias


class _FakeModel:
    """Mimics one entry of ``ollama`` ``ListResponse.models``."""

    def __init__(self, name: str) -> None:
        self.model = name


class _FakeListing:
    def __init__(self, names: list[str]) -> None:
        self.models = [_FakeModel(n) for n in names]


class _FakeClient:
    """A network-free stand-in for ``ollama.Client``."""

    def __init__(self, names: list[str] | None = None, error: Exception | None = None) -> None:
        self._names = names or []
        self._error = error

    def list(self):
        if self._error is not None:
            raise self._error
        return _FakeListing(self._names)


def test_verify_daemon_passes_when_model_present():
    client = _FakeClient(names=["kimi-k2.6:cloud", "glm-5.1:cloud"])
    verify_daemon(client, "kimi-k2.6:cloud")  # must not raise


def test_verify_daemon_raises_when_model_absent():
    client = _FakeClient(names=["glm-5.1:cloud"])
    with pytest.raises(RuntimeError, match="ollama pull kimi-k2.6:cloud"):
        verify_daemon(client, "kimi-k2.6:cloud")


def test_verify_daemon_raises_when_daemon_unreachable():
    client = _FakeClient(error=ConnectionError("connection refused"))
    with pytest.raises(RuntimeError, match="not reachable"):
        verify_daemon(client, "kimi-k2.6:cloud")
