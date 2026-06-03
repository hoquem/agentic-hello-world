# app/ollama_client.py
"""Thin wrapper over the Ollama client.

The request body produced by :func:`build_request` is exactly what is both
shown to the user and sent to the model — there is no hidden transformation.

The client points at a **local** Ollama daemon, which is signed in to Ollama
Cloud (``ollama signin``) and forwards cloud-model requests on to the cloud. So
the app sends no credential of its own; the local daemon owns it.
"""
from collections.abc import Iterator
from copy import deepcopy

from ollama import Client


def build_request(messages: list[dict], model: str, stream: bool = True) -> dict:
    """Build the exact request body sent to the model.

    :param messages: the conversation deck, oldest first.
    :param model: model name, e.g. ``kimi-k2.6:cloud``.
    :param stream: whether to stream the response.
    :returns: a fresh dict (no aliasing of ``messages``).
    """
    return {"model": model, "messages": deepcopy(messages), "stream": stream}


def make_client(host: str) -> Client:
    """Create a client pointed at the local Ollama daemon.

    No Authorization header is sent: the daemon holds the Ollama Cloud
    credential (established once via ``ollama signin``) and forwards cloud-model
    requests on our behalf.

    :param host: local daemon URL, e.g. ``http://localhost:11434``.
    :returns: a configured :class:`ollama.Client`.
    """
    return Client(host=host)


def verify_daemon(client: Client, model: str) -> None:
    """Fail loudly if the local daemon is unreachable or the model is missing.

    This is the build's "no fallbacks" preflight: rather than discover a
    misconfiguration mid-stream, we confirm up front that (1) the daemon answers
    and (2) ``model`` is registered locally. It does **not** prove the daemon's
    cloud signin is still valid — only a real call (the smoke test) does that.

    :param client: a client from :func:`make_client`.
    :param model: the model name the harness intends to call.
    :raises RuntimeError: if the daemon cannot be reached, or if ``model`` is
        not among the locally registered models.
    """
    try:
        listing = client.list()
    except Exception as exc:  # daemon down / wrong host — surface it, don't hide it
        raise RuntimeError(
            f"Local Ollama daemon not reachable. Is it running (`ollama serve`) "
            f"and is OLLAMA_HOST correct? (underlying error: {exc})"
        ) from exc

    available = [m.model for m in listing.models]
    if model not in available:
        raise RuntimeError(
            f"Model {model!r} is not available on the local daemon. "
            f"Pull it first: `ollama pull {model}`. Available models: {available}"
        )


def stream_chat(client: Client, request: dict) -> Iterator[dict]:
    """Stream a chat completion using the prebuilt request body.

    The ``ollama`` client yields ``ChatResponse`` (pydantic) objects. We
    normalise each to a plain dict at this I/O boundary via ``model_dump()`` so
    the raw chunk is JSON-serialisable and can be shown verbatim in the
    RECEIVED panel — preserving the "nothing hidden" invariant on the wire.

    :param client: an Ollama client from :func:`make_client`.
    :param request: the body from :func:`build_request`.
    :yields: each raw response chunk as a plain dict.
    """
    for chunk in client.chat(
        model=request["model"],
        messages=request["messages"],
        stream=request["stream"],
    ):
        yield chunk.model_dump()
