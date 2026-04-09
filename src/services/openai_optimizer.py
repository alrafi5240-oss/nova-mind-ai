"""OpenAI API optimization utilities to reduce costs."""

import logging
import re

logger = logging.getLogger(__name__)

# Token limits
MAX_HISTORY_MESSAGES = 24  # Keep a larger rolling window for smart summarization
RECENT_HISTORY_MESSAGES = 8
SUMMARY_TRIGGER_MESSAGES = 10
MAX_SUMMARY_ITEMS = 6
MAX_MESSAGE_LENGTH = 8000  # Prevent extremely long messages
MAX_RESPONSE_TOKENS = 500  # Limit response length


def optimize_message(message: str) -> str:
    """Clean and optimize message for API call.

    Args:
        message: Original user message

    Returns:
        Optimized message
    """
    # Strip whitespace
    message = message.strip()

    # Limit length
    if len(message) > MAX_MESSAGE_LENGTH:
        logger.warning(f"Message truncated from {len(message)} to {MAX_MESSAGE_LENGTH} chars")
        message = message[:MAX_MESSAGE_LENGTH]

    return message


def estimate_tokens(text: str) -> int:
    """Rough estimate of token count (1 token ≈ 4 characters).

    Args:
        text: Text to estimate

    Returns:
        Approximate token count
    """
    return len(text) // 4


def optimize_history(history: list[dict]) -> list[dict]:
    """Reduce history size for cost optimization.

    Only keeps last N messages and removes redundant content.

    Args:
        history: Full conversation history

    Returns:
        Optimized history (max MAX_HISTORY_MESSAGES items)
    """
    if not history:
        return []

    # Keep only the last N messages from the stored history window.
    optimized = history[-MAX_HISTORY_MESSAGES:]

    logger.debug(
        f"History optimized: {len(history)} messages -> {len(optimized)} messages"
    )

    return optimized


def _compress_content(content: str, max_length: int = 180) -> str:
    """Normalize and shorten message content for memory summaries."""
    cleaned = re.sub(r"\s+", " ", (content or "").strip())
    if len(cleaned) <= max_length:
        return cleaned
    return cleaned[: max_length - 3].rstrip() + "..."


def summarize_history(history: list[dict]) -> str:
    """Create a compact summary of older messages for long conversations."""
    if not history:
        return ""

    lines = []
    for msg in history:
        content = _compress_content(msg.get("content", ""))
        if not content:
            continue
        role = msg.get("role", "assistant")
        prefix = "User" if role == "user" else "Assistant"
        lines.append(f"- {prefix}: {content}")

    if not lines:
        return ""

    if len(lines) > MAX_SUMMARY_ITEMS:
        lines = lines[:2] + ["- ..."] + lines[-(MAX_SUMMARY_ITEMS - 3):]

    return "Conversation memory summary from earlier messages:\n" + "\n".join(lines)


def get_optimization_stats(
    original_history_size: int,
    optimized_history_size: int,
    message_length: int,
    summary_text: str = "",
) -> dict:
    """Calculate optimization statistics.

    Args:
        original_history_size: Original history message count
        optimized_history_size: Optimized history message count
        message_length: User message length

    Returns:
        Dictionary with optimization stats
    """
    history_reduction = (
        (original_history_size - optimized_history_size) / original_history_size * 100
        if original_history_size > 0
        else 0
    )

    estimated_tokens = estimate_tokens("")  # System prompt baseline
    estimated_tokens += estimate_tokens("\n".join(
        msg.get("content", "") for msg in [{"content": ""}] * optimized_history_size
    ))
    estimated_tokens += estimate_tokens(summary_text)
    estimated_tokens += estimate_tokens(message_length * "a")  # Rough estimate

    return {
        "history_reduction_percent": round(history_reduction, 1),
        "messages_removed": original_history_size - optimized_history_size,
        "estimated_tokens": estimated_tokens,
        "estimated_cost_usd": round(estimated_tokens * 0.0000005, 6),  # Rough estimate
    }


def create_optimized_messages(
    system_prompt: str,
    history: list[dict],
    user_message: str,
) -> tuple[list[dict], dict]:
    """Create optimized messages list for API call.

    Args:
        system_prompt: System prompt
        history: Full conversation history
        user_message: Current user message

    Returns:
        Tuple of (optimized_messages_list, optimization_stats)
    """
    original_history_size = len(history)

    # Optimize inputs
    user_message = optimize_message(user_message)
    optimized_history = optimize_history(history)
    summary_text = ""

    if len(optimized_history) > SUMMARY_TRIGGER_MESSAGES:
        older_history = optimized_history[:-RECENT_HISTORY_MESSAGES]
        recent_history = optimized_history[-RECENT_HISTORY_MESSAGES:]
        summary_text = summarize_history(older_history)
    else:
        recent_history = optimized_history

    # Build messages
    messages = [{"role": "system", "content": system_prompt}]
    if summary_text:
        messages.append({"role": "system", "content": summary_text})
    messages.extend(recent_history)
    messages.append({"role": "user", "content": user_message})

    # Calculate stats
    stats = get_optimization_stats(
        original_history_size,
        len(recent_history),
        len(user_message),
        summary_text,
    )

    logger.debug(f"Optimization stats: {stats}")

    return messages, stats
