# app/harness.py
"""The agent harness.

Episode 1 scope: a single, non-looping call. The harness takes the user's
message, optionally puts a *system prompt* in front of it (a standing
instruction the user never types), sends the whole deck to the model once,
streams the reply, and decides to display it. Later episodes extend this
class — they never change the model.
"""
from collections.abc import Callable, Iterator

from app.ollama_client import build_request

ChatFn = Callable[[dict], Iterator[dict]]

# The harness's one built-in instruction for Episode 1. The user never types
# this; the harness adds it so the model behaves predictably. Turn it off (see
# app/server.py) and only the user's words are sent — so you can SEE the effect.
DEFAULT_SYSTEM_PROMPT = "Reply with exactly what the user typed, and nothing else."


class Harness:
    """Orchestrates one request/response cycle and emits UI events.

    :param chat_fn: callable taking a request body and yielding raw chunks.
    :param model: model name to call.
    :param system_prompt: optional standing instruction placed before the user
        message. When ``None``, only the user's message is sent.
    """

    def __init__(
        self, chat_fn: ChatFn, model: str, system_prompt: str | None = None
    ) -> None:
        self._chat_fn = chat_fn
        self.model = model
        # The deck is the full list of messages we will send. If there is a
        # system prompt, it goes first — so the request we send (and show on
        # screen) already contains it. Nothing is added later in secret.
        self.messages: list[dict] = []
        if system_prompt:
            self.messages.append({"role": "system", "content": system_prompt})

    def add_user_message(self, content: str) -> None:
        """Append a user message to the deck.

        :param content: the user's text to wrap as a ``user`` message.
        """
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
            content = chunk["message"]["content"]
            if content:  # None or "" = no display text in this chunk (e.g. a thinking-only or done chunk)
                assembled += content
            # Emit every chunk verbatim — including the empty/done/thinking chunks —
            # so the RECEIVED panel shows the literal wire, not a cleaned-up view.
            yield {"type": "received_chunk", "raw": chunk}

        self.messages.append({"role": "assistant", "content": assembled})
        yield {"type": "display", "content": assembled}
