"""Application configuration loaded from the environment.

:raises RuntimeError: when a required variable is absent. We fail loudly
    rather than fall back to a default that would hide a misconfiguration.
"""
import os
from dataclasses import dataclass

DEFAULT_HOST = "https://ollama.com"
DEFAULT_MODEL = "gpt-oss:120b"


@dataclass(frozen=True)
class Config:
    """Resolved runtime configuration.

    :param api_key: Ollama Cloud API key (Bearer token).
    :param host: Ollama API host URL.
    :param model: Model name to call, e.g. ``gpt-oss:120b``.
    """

    api_key: str
    host: str
    model: str


def load_config() -> Config:
    """Read configuration from the environment.

    :returns: a populated :class:`Config`.
    :raises RuntimeError: if ``OLLAMA_API_KEY`` is not set.
    """
    api_key = os.environ.get("OLLAMA_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OLLAMA_API_KEY is not set. Copy .env.example to .env and add your key."
        )
    return Config(
        api_key=api_key,
        host=os.environ.get("OLLAMA_HOST", DEFAULT_HOST),
        model=os.environ.get("MODEL", DEFAULT_MODEL),
    )
