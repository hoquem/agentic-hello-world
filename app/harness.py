# app/harness.py
"""The agent harness.

Episode 1 scope: a single, non-looping call. The harness wraps the user's
words into the message deck, asks the model once, streams the reply, and
decides to display it. Later episodes extend this class — they never change
the model.
"""
from collections.abc import Callable, Iterator

from app.ollama_client import build_request

ChatFn = Callable[[dict], Iterator[dict]]


class Harness:
    """Orchestrates one request/response cycle and emits UI events.

    :param chat_fn: callable taking a request body and yielding raw chunks.
    :param model: model name to call.
    """

    def __init__(self, chat_fn: ChatFn, model: str) -> None:
        self._chat_fn = chat_fn
        self.model = model
        self.messages: list[dict] = []  # the deck

    def add_user_message(self, content: str) -> None:
        """Append a user message to the deck."""
        self.messages.append({"role": "user", "content": content})

    def run(self) -> Iterator[dict]:
        """Run one cycle, yielding typed events.

        :yields: ``sent`` (the exact request), then ``received_chunk`` per
            streamed token, then a final ``display`` event.
        """
        request = build_request(self.messages, self.model)
        yield {"type": "sent", "request": request}

        assembled = ""
        for chunk in self._chat_fn(request):
            assembled += chunk["message"]["content"]
            # Emit every chunk verbatim — including the final empty/done chunk —
            # so the RECEIVED panel shows the literal wire, not a cleaned-up view.
            yield {"type": "received_chunk", "raw": chunk}

        self.messages.append({"role": "assistant", "content": assembled})
        yield {"type": "display", "content": assembled}
