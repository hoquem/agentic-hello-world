"""Application configuration loaded from the environment.

The app talks to a **local** Ollama daemon (``OLLAMA_HOST``), which is signed in
to Ollama Cloud and transparently offloads cloud models. The cloud credential
therefore lives in the daemon (via ``ollama signin``), not here — so there is no
API key to load. Reachability of the daemon and availability of the model are
checked separately and loudly by :func:`app.ollama_client.verify_daemon`; this
loader only resolves the two settings and never touches the network.
"""
import os
from dataclasses import dataclass

DEFAULT_HOST = "http://localhost:11434"
DEFAULT_MODEL = "kimi-k2.6:cloud"


@dataclass(frozen=True)
class Config:
    """Resolved runtime configuration.

    :param host: local Ollama daemon URL, e.g. ``http://localhost:11434``.
    :param model: cloud model name to call, e.g. ``kimi-k2.6:cloud``.
    """

    host: str
    model: str


def load_config() -> Config:
    """Read configuration from the environment.

    :returns: a populated :class:`Config`, using local-daemon defaults when
        ``OLLAMA_HOST`` / ``MODEL`` are unset.
    """
    return Config(
        host=os.environ.get("OLLAMA_HOST", DEFAULT_HOST),
        model=os.environ.get("MODEL", DEFAULT_MODEL),
    )
