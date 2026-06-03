from app import config


def test_load_config_reads_env(monkeypatch):
    monkeypatch.setenv("OLLAMA_HOST", "http://localhost:9999")
    monkeypatch.setenv("MODEL", "glm-5.1:cloud")
    cfg = config.load_config()
    assert cfg.host == "http://localhost:9999"
    assert cfg.model == "glm-5.1:cloud"


def test_load_config_uses_local_daemon_defaults(monkeypatch):
    monkeypatch.delenv("OLLAMA_HOST", raising=False)
    monkeypatch.delenv("MODEL", raising=False)
    cfg = config.load_config()
    assert cfg.host == "http://localhost:11434"  # local daemon, which proxies to cloud
    assert cfg.model == "kimi-k2.6:cloud"
