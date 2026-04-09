"""Thread-safe in-memory conversation history for production API instances."""

from __future__ import annotations

from collections import defaultdict, deque
from threading import Lock

MAX_HISTORY_MESSAGES = 24


class ConversationStore:
    """Keeps the last N chat messages per `conversation_id` (OpenAI role/content dicts)."""

    def __init__(self, max_messages: int = MAX_HISTORY_MESSAGES) -> None:
        self._histories: dict[str, deque[dict[str, str]]] = defaultdict(
            lambda: deque(maxlen=max_messages)
        )
        self._locks: defaultdict[str, Lock] = defaultdict(Lock)

    def snapshot(self, conversation_id: str) -> list[dict[str, str]]:
        with self._locks[conversation_id]:
            return list(self._histories[conversation_id])

    def append_exchange(
        self, conversation_id: str, user_text: str, assistant_reply: str
    ) -> None:
        with self._locks[conversation_id]:
            h = self._histories[conversation_id]
            h.append({"role": "user", "content": user_text})
            h.append({"role": "assistant", "content": assistant_reply})

    def clear(self, conversation_id: str) -> None:
        with self._locks[conversation_id]:
            self._histories[conversation_id].clear()


store = ConversationStore()
