import pytest
from app import config


def test_load_config_reads_env(monkeypatch):
    monkeypatch.setenv("OLLAMA_API_KEY", "sk-test")
    monkeypatch.setenv("MODEL", "gpt-oss:120b")
    monkeypatch.delenv("OLLAMA_HOST", raising=False)
    cfg = config.load_config()
    assert cfg.api_key == "sk-test"
    assert cfg.model == "gpt-oss:120b"
    assert cfg.host == "https://ollama.com"  # default


def test_load_config_raises_when_key_missing(monkeypatch):
    monkeypatch.delenv("OLLAMA_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="OLLAMA_API_KEY"):
        config.load_config()
