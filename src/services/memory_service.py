"""In-memory conversation history management service."""

import logging
from collections import defaultdict, deque
from threading import Lock
from typing import Optional

logger = logging.getLogger(__name__)

# Maximum messages to keep per conversation
MAX_HISTORY_SIZE = 24


class ConversationMemory:
    """Thread-safe in-memory conversation history storage."""

    def __init__(self, max_messages: int = MAX_HISTORY_SIZE):
        """Initialize conversation memory.

        Args:
            max_messages: Maximum number of messages to keep per conversation
        """
        self.max_messages = max_messages
        # Store messages per conversation_id
        self._conversations: dict[str, deque] = defaultdict(
            lambda: deque(maxlen=max_messages)
        )
        # Thread safety locks per conversation
        self._locks: dict[str, Lock] = defaultdict(Lock)

    def get_history(self, conversation_id: str) -> list[dict]:
        """Get conversation history as list of message dicts.

        Args:
            conversation_id: Conversation identifier

        Returns:
            List of messages with role and content
        """
        conversation_id = (conversation_id or "").strip() or "default"
        with self._locks[conversation_id]:
            return list(self._conversations[conversation_id])

    def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
    ) -> None:
        """Add a single message to conversation history.

        Args:
            conversation_id: Conversation identifier
            role: Message role ("user" or "assistant")
            content: Message text
        """
        conversation_id = (conversation_id or "").strip() or "default"
        if not content or not content.strip():
            logger.warning(f"Attempted to add empty message to {conversation_id}")
            return

        with self._locks[conversation_id]:
            self._conversations[conversation_id].append({
                "role": role,
                "content": content.strip()
            })

    def add_exchange(
        self,
        conversation_id: str,
        user_message: str,
        assistant_reply: str,
    ) -> None:
        """Add a user message and assistant reply to history.

        Args:
            conversation_id: Conversation identifier
            user_message: User's message
            assistant_reply: Assistant's response
        """
        conversation_id = (conversation_id or "").strip() or "default"

        with self._locks[conversation_id]:
            self._conversations[conversation_id].append({
                "role": "user",
                "content": user_message.strip()
            })
            self._conversations[conversation_id].append({
                "role": "assistant",
                "content": assistant_reply.strip()
            })

        logger.debug(
            f"Added exchange to conversation {conversation_id}: "
            f"user={len(user_message)}chars, assistant={len(assistant_reply)}chars"
        )

    def clear_conversation(self, conversation_id: str) -> None:
        """Clear all messages for a conversation.

        Args:
            conversation_id: Conversation identifier
        """
        conversation_id = (conversation_id or "").strip() or "default"

        with self._locks[conversation_id]:
            self._conversations[conversation_id].clear()

        logger.info(f"Cleared conversation {conversation_id}")

    def get_stats(self) -> dict:
        """Get memory statistics.

        Returns:
            Dict with conversation count and message counts
        """
        stats = {
            "total_conversations": len(self._conversations),
            "conversations": {}
        }

        for cid, messages in self._conversations.items():
            stats["conversations"][cid] = {
                "message_count": len(messages)
            }

        return stats


# Global conversation memory instance
_memory = ConversationMemory()


def get_conversation_memory() -> ConversationMemory:
    """Get the global conversation memory instance."""
    return _memory
