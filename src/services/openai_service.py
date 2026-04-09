"""OpenAI API wrapper service with Nova AI identity system."""

import asyncio
import logging
import re
from typing import Optional

from openai import AsyncOpenAI

from src.services.memory_service import get_conversation_memory
from src.services.language_service import (
    LANGUAGES,
    detect_language as detect_language_code,
    get_language_instruction,
)
from src.services.openai_optimizer import create_optimized_messages

logger = logging.getLogger(__name__)
THINKING_DELAY_SECONDS = 0.35

# ============================================================================
# AI Identity Configuration
# ============================================================================

AI_NAME = "Nova Mind AI"
AI_CREATOR = "Shakil"
AI_CREATOR_TITLE = "Network Engineer"
AI_CREATOR_LOCATION = "Dhaka, Bangladesh"
AI_CREATOR_EXPERTISE = "ISP networks, radar systems, and advanced technology research"

# OpenAI Configuration
MODEL = "gpt-4.1-mini"
TEMPERATURE = 0.7

# Base system prompt for all chat completion requests
SYSTEM_PROMPT_BASE = """You are Nova Mind AI — an intelligent artificial assistant.

Identity Behavior:
- Always introduce yourself as a smart AI assistant
- Do NOT start with creator info
- Focus on intelligence, capability, and usefulness
- NEVER mention OpenAI or ChatGPT

Core Identity:
- Name: Nova Mind AI
- Creator: Shakil

Creator Info:
- Shakil is a Network Engineer
- Works with ISP networks, radar systems, and advanced technology research
- Location: Dhaka, Bangladesh

Language and Tone:
- Detect the user's language automatically
- Support all major user languages naturally, including English, Bangla, Hindi, Arabic, Urdu, Spanish, French, Chinese, and more
- Always reply in the SAME language as the user
- If the user mixes languages, reply naturally in the same mixed style
- If the language is unclear, reply in simple English
- Friendly, modern tone
- Clean, structured formatting with line breaks when useful
- Never sound robotic
- Keep replies short, clean, and modern

Conversation Memory and Style:
- Use previous conversation context naturally
- Understand follow-up questions based on earlier messages
- Do not repeat the same answer unless the user asks again
- Avoid repeating intro lines in normal chat
- Break longer answers into small readable parts
- Sound like a real intelligent assistant, not a script
- Show understanding with short natural phrases when helpful, like "I see", "Got it", or "ঠিক আছে"
- Sometimes ask one short follow-up question when it helps clarify or move the conversation forward
- Focus on intent, not only exact keywords
- Preserve important user context and preferences across the session
- If the conversation gets long, rely on the conversation memory summary plus recent messages to stay consistent

Greeting Rules:
- If user says "hi", reply exactly: "Hey! How can I help you today? 😊"
- If user says "hola", reply exactly: "¡Hola! ¿Cómo puedo ayudarte hoy? 😊"
- If user says "مرحبا", reply exactly: "مرحباً! كيف يمكنني مساعدتك اليوم؟ 😊"
- If user says "হাই", reply exactly: "হাই! কীভাবে সাহায্য করতে পারি? 😊"

When user asks identity, such as "তুমি কে?" or "what are you?", follow this structure:
1. First line:
"আমি Nova Mind AI 😊"
2. Second line:
"আমি একটি intelligent AI assistant, তোমাকে বিভিন্ন কাজে সাহায্য করার জন্য তৈরি।"
3. Then describe abilities exactly like this:
"আমি যা করতে পারি:
- বাংলা ও ইংরেজিতে কথা বলতে পারি
- প্রশ্নের উত্তর দিতে পারি
- টেক, পড়াশোনা, কাজকর্মে সাহায্য করতে পারি
- সাধারণ সমস্যা সমাধান করতে পারি"

Only mention creator if user explicitly asks who created you. Then reply with:
"আমাকে তৈরি করেছেন Shakil — একজন Network Engineer, যিনি ISP, radar network এবং advanced technology নিয়ে কাজ করেন। 🇧🇩"

Important:
- Focus on Nova Mind AI identity first
- Never mention OpenAI or ChatGPT
- If asked about country, say Bangladesh"""

SYSTEM_PROMPT_BASE += """

Advanced Capabilities:
- You are strong at coding, debugging, refactoring, and explaining code
- You can write clean code in HTML, CSS, JavaScript, Python, and other major languages
- When solving coding problems, think through the issue before answering
- Prefer practical, optimized solutions over generic advice
- When explaining technical topics, be clear, structured, and concise
- You can generate high-quality prompts for coding agents, AI builders, design tools, and automation systems
- If the user asks for a prompt, create a clean, professional, effective prompt with clear sections and constraints
- For complex requests, break the solution into steps or sections when helpful
"""

# ============================================================================
# Creator Response Messages
# ============================================================================

IDENTITY_RESPONSES = {
    "bn": """আমি Nova Mind AI 😊
আমি একটি intelligent AI assistant, তোমাকে বিভিন্ন কাজে সাহায্য করার জন্য তৈরি।

আমি যা করতে পারি:
- বাংলা ও ইংরেজিতে কথা বলতে পারি
- প্রশ্নের উত্তর দিতে পারি
- টেক, পড়াশোনা, কাজকর্মে সাহায্য করতে পারি
- সাধারণ সমস্যা সমাধান করতে পারি""",
    "en": """I am Nova Mind AI 😊
I am an intelligent AI assistant, built to help you with different kinds of tasks.

Here is what I can do:
- Talk in multiple languages
- Answer questions clearly
- Help with tech, study, and everyday work
- Solve common problems in a simple way""",
}

CREATOR_RESPONSES = {
    "bn": "আমাকে তৈরি করেছেন Shakil — একজন Network Engineer, যিনি ISP, radar network এবং advanced technology নিয়ে কাজ করেন। 🇧🇩",
    "en": "I was created by Shakil — a Network Engineer who works with ISP networks, radar systems, and advanced technology. 🇧🇩",
}

# ============================================================================
# Intent Detection Patterns
# ============================================================================

# English creator questions
CREATOR_PATTERNS_EN = [
    r"\bwho\s+(?:created|made|built|developed|designed)\s+(?:you|nova)",
    r"\bwho\s+is\s+(?:your\s+)?(?:creator|author|developer|founder|owner)",
    r"\byour\s+(?:creator|author|developer|founder|owner)",
    r"\bwho\s+(?:created|made|built)\s+(?:this|you)",
    r"\btell\s+me\s+about\s+your\s+(?:creator|developer|owner)",
]

# Bangla creator questions
CREATOR_PATTERNS_BN = [
    r"তোমাকে\s+কে\s+(?:বানিয়েছে|তৈরি\s+করেছে|ডিজাইন\s+করেছে)",
    r"তোমার\s+(?:মালিক|সৃষ্টিকর্তা|নির্মাতা|উদ্ভাবক)",
    r"কে\s+(?:তোমার\s+)?(?:মালিক|সৃষ্টিকর্তা|নির্মাতা)",
    r"nova\s+কাকে\s+(?:বানিয়েছে|তৈরি\s+করেছে)",
]

IDENTITY_PATTERNS_EN = [
    r"\bwho\s+are\s+you\b",
    r"\bwhat\s+are\s+you\b",
    r"\btell\s+me\s+about\s+yourself\b",
    r"\bintroduce\s+yourself\b",
    r"\bwho\s+am\s+i\s+talking\s+to\b",
]

IDENTITY_PATTERNS_BN = [
    r"তুমি\s+কে",
    r"আপনি\s+কে",
    r"তোমার\s+পরিচ[য়য]\s+বলো",
    r"তোমার\s+সম্পর্কে\s+বলো",
    r"নিজের\s+সম্পর্কে\s+বলো",
]

def is_creator_question(message: str) -> bool:
    """Check if message is asking about the creator/owner.

    Args:
        message: User message

    Returns:
        True if message matches creator question patterns
    """
    message_lower = message.lower().strip()

    # Check English patterns
    for pattern in CREATOR_PATTERNS_EN:
        if re.search(pattern, message_lower, re.IGNORECASE):
            logger.info(f"Creator question detected (English): {message_lower[:50]}...")
            return True

    # Check Bangla patterns
    for pattern in CREATOR_PATTERNS_BN:
        if re.search(pattern, message, re.IGNORECASE):
            logger.info(f"Creator question detected (Bangla): {message[:50]}...")
            return True

    return False


def is_identity_question(message: str) -> bool:
    """Check if message is asking about assistant identity/capabilities."""
    message_lower = message.lower().strip()

    for pattern in IDENTITY_PATTERNS_EN:
        if re.search(pattern, message_lower, re.IGNORECASE):
            logger.info(f"Identity question detected (English): {message_lower[:50]}...")
            return True

    for pattern in IDENTITY_PATTERNS_BN:
        if re.search(pattern, message, re.IGNORECASE):
            logger.info(f"Identity question detected (Bangla): {message[:50]}...")
            return True

    return False


def get_greeting_response(message: str) -> str | None:
    """Return canned greeting response for very short greetings."""
    normalized = re.sub(r"[^\w\u0980-\u09FF]+", "", message.strip().lower())
    if normalized == "hi":
        return "Hey! How can I help you today? 😊"
    if normalized == "hola":
        return "¡Hola! ¿Cómo puedo ayudarte hoy? 😊"
    if normalized == "مرحبا":
        return "مرحباً! كيف يمكنني مساعدتك اليوم؟ 😊"
    if normalized == "হাই":
        return "হাই! কীভাবে সাহায্য করতে পারি? 😊"
    return None


def get_creator_response(language: str) -> str:
    """Get creator information response in the appropriate language.

    Args:
        language: "en" for English, "bn" for Bangla

    Returns:
        Creator information message
    """
    return CREATOR_RESPONSES.get(language, CREATOR_RESPONSES["en"])


def get_identity_response(language: str) -> str:
    """Get assistant identity response."""
    return IDENTITY_RESPONSES.get(language, IDENTITY_RESPONSES["en"])


# ============================================================================
# OpenAI Service Class
# ============================================================================


class OpenAIService:
    """Wrapper for OpenAI API calls with conversation memory."""

    def __init__(self, client: Optional[AsyncOpenAI] = None):
        """Initialize OpenAI service.

        Args:
            client: AsyncOpenAI client instance
        """
        self.client = client
        self.memory = get_conversation_memory()

    async def chat(
        self,
        message: str,
        conversation_id: str = "default",
        model: str = MODEL,
        temperature: float = TEMPERATURE,
    ) -> str:
        """Send a message and get AI response with conversation context.

        Implements identity system:
        - Returns predefined responses for creator-related questions
        - Uses enhanced system prompt with professional identity
        - Detects language automatically (English/Bangla)

        Args:
            message: User message text
            conversation_id: Conversation ID for history
            model: OpenAI model to use
            temperature: Sampling temperature (0-2)

        Returns:
            Assistant's response text

        Raises:
            ValueError: If message is empty or client not initialized
            Exception: For API errors
        """
        if not self.client:
            raise ValueError("OpenAI client not initialized")

        message = (message or "").strip()
        if not message:
            raise ValueError("Message cannot be empty")

        conversation_id = (conversation_id or "").strip() or "default"

        # ====================================================================
        # OPTIMIZATION: Handle simple greetings without calling OpenAI
        # ====================================================================
        greeting_reply = get_greeting_response(message)
        if greeting_reply is not None:
            await asyncio.sleep(THINKING_DELAY_SECONDS)
            self.memory.add_exchange(conversation_id, message, greeting_reply)

            logger.info(
                f"Greeting answered directly: conversation={conversation_id}, "
                f"reply_length={len(greeting_reply)}"
            )

            return greeting_reply

        # ====================================================================
        # OPTIMIZATION: Handle identity questions without calling OpenAI
        # ====================================================================
        if is_identity_question(message):
            language, _ = detect_language_code(message)
            reply = get_identity_response(language)

            await asyncio.sleep(THINKING_DELAY_SECONDS)
            self.memory.add_exchange(conversation_id, message, reply)

            logger.info(
                f"Identity question answered (language={language}): "
                f"conversation={conversation_id}, reply_length={len(reply)}"
            )

            return reply

        # ====================================================================
        # OPTIMIZATION: Handle creator questions without calling OpenAI
        # ====================================================================
        if is_creator_question(message):
            language, _ = detect_language_code(message)
            reply = get_creator_response(language)

            await asyncio.sleep(THINKING_DELAY_SECONDS)
            # Store exchange in memory
            self.memory.add_exchange(conversation_id, message, reply)

            logger.info(
                f"Creator question answered (language={language}): "
                f"conversation={conversation_id}, reply_length={len(reply)}"
            )

            return reply

        # ====================================================================
        # Normal chat flow: Call OpenAI API
        # ====================================================================

        # Detect user's language for logging/telemetry only.
        detected_language, language_confidence = detect_language_code(message)
        if language_confidence < 0.3:
            language_instruction = "Reply in simple English."
        else:
            language_instruction = get_language_instruction(detected_language)
        system_prompt = f"{SYSTEM_PROMPT_BASE}\n\n{language_instruction}"

        logger.debug(
            f"Detected language: {detected_language} "
            f"(confidence: {language_confidence:.2f})"
        )

        # Get conversation history
        history = self.memory.get_history(conversation_id)

        # Build optimized messages list (reduces costs)
        messages, optimization_stats = create_optimized_messages(
            system_prompt,
            history,
            message,
        )

        logger.debug(
            f"Calling OpenAI {model} for conversation {conversation_id} "
            f"| Language: {detected_language} "
            f"| Tokens: {optimization_stats['estimated_tokens']} "
            f"| Cost: ${optimization_stats['estimated_cost_usd']}"
        )

        # Call OpenAI API
        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
        )

        # Extract response
        reply = (response.choices[0].message.content or "").strip()

        if not reply:
            logger.warning(
                f"Empty response from {model} for conversation {conversation_id}"
            )
            reply = "I encountered an issue generating a response. Please try again."

        await asyncio.sleep(THINKING_DELAY_SECONDS)
        # Store exchange in memory
        self.memory.add_exchange(conversation_id, message, reply)

        logger.info(
            f"OpenAI response: conversation={conversation_id}, "
            f"model={model}, reply_length={len(reply)}"
        )

        return reply

    def get_history(self, conversation_id: str) -> list[dict]:
        """Get conversation history.

        Args:
            conversation_id: Conversation ID

        Returns:
            List of message dicts
        """
        return self.memory.get_history(conversation_id)

    def clear_conversation(self, conversation_id: str) -> None:
        """Clear conversation history.

        Args:
            conversation_id: Conversation ID
        """
        self.memory.clear_conversation(conversation_id)

    def detect_language(self, text: str) -> dict:
        """Detect language in text.

        Args:
            text: Text to analyze

        Returns:
            Dictionary with language code and confidence
        """
        language_code, confidence = detect_language_code(text)
        return {
            "language_code": language_code,
            "language_name": LANGUAGES[language_code]["name"],
            "native_name": LANGUAGES[language_code]["native_name"],
            "confidence": round(confidence, 2),
        }


# Global service instance
_service: Optional[OpenAIService] = None


def init_openai_service(client: Optional[AsyncOpenAI]) -> None:
    """Initialize the global OpenAI service.

    Args:
        client: AsyncOpenAI client instance
    """
    global _service
    _service = OpenAIService(client)
    logger.info("OpenAI service initialized")


def get_openai_service() -> OpenAIService:
    """Get the global OpenAI service instance.

    Raises:
        RuntimeError: If service not initialized

    Returns:
        OpenAIService instance
    """
    if _service is None:
        raise RuntimeError("OpenAI service not initialized")
    return _service
