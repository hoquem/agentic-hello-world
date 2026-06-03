# app/ollama_client.py
"""Thin wrapper over the Ollama client.

The request body produced by :func:`build_request` is exactly what is both
shown to the user and sent to the model — there is no hidden transformation.
"""
from collections.abc import Iterator
from copy import deepcopy

from ollama import Client


def build_request(messages: list[dict], model: str, stream: bool = True) -> dict:
    """Build the exact request body sent to the model.

    :param messages: the conversation deck, oldest first.
    :param model: model name, e.g. ``gpt-oss:120b``.
    :param stream: whether to stream the response.
    :returns: a fresh dict (no aliasing of ``messages``).
    """
    return {"model": model, "messages": deepcopy(messages), "stream": stream}


def make_client(host: str, api_key: str) -> Client:
    """Create an Ollama Cloud client.

    :param host: API host, e.g. ``https://ollama.com``.
    :param api_key: Bearer token for the Authorization header.
    """
    return Client(host=host, headers={"Authorization": f"Bearer {api_key}"})


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
