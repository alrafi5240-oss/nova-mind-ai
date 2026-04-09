"""Language detection and management service."""

import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

# Language codes and their properties
LANGUAGES = {
    "en": {
        "name": "English",
        "native_name": "English",
        "unicode_range": r"[a-zA-Z]",
        "confidence_boost": 1.0,
    },
    "bn": {
        "name": "Bengali",
        "native_name": "বাংলা",
        "unicode_range": r"[\u0980-\u09FF]",
        "confidence_boost": 1.5,
    },
    "hi": {
        "name": "Hindi",
        "native_name": "हिन्दी",
        "unicode_range": r"[\u0900-\u097F]",
        "confidence_boost": 1.5,
    },
    "ar": {
        "name": "Arabic",
        "native_name": "العربية",
        "unicode_range": r"[\u0600-\u06FF]",
        "confidence_boost": 1.5,
    },
    "ur": {
        "name": "Urdu",
        "native_name": "اردو",
        "unicode_range": r"[\u0600-\u06FF]",
        "confidence_boost": 1.55,
    },
    "fr": {
        "name": "French",
        "native_name": "Français",
        "unicode_range": r"[a-zA-Zàâäéèêëïîôùûüœç]",
        "confidence_boost": 1.0,
    },
    "es": {
        "name": "Spanish",
        "native_name": "Español",
        "unicode_range": r"[a-zA-Záéíóúñ¿¡]",
        "confidence_boost": 1.0,
    },
    "de": {
        "name": "German",
        "native_name": "Deutsch",
        "unicode_range": r"[a-zA-ZäöüßÄÖÜ]",
        "confidence_boost": 1.0,
    },
    "ja": {
        "name": "Japanese",
        "native_name": "日本語",
        "unicode_range": r"[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]",
        "confidence_boost": 1.5,
    },
    "zh": {
        "name": "Chinese",
        "native_name": "中文",
        "unicode_range": r"[\u4E00-\u9FFF\u3400-\u4DBF]",
        "confidence_boost": 1.5,
    },
    "ru": {
        "name": "Russian",
        "native_name": "Русский",
        "unicode_range": r"[\u0400-\u04FF]",
        "confidence_boost": 1.5,
    },
    "ko": {
        "name": "Korean",
        "native_name": "한국어",
        "unicode_range": r"[\uAC00-\uD7AF\u1100-\u11FF]",
        "confidence_boost": 1.5,
    },
    "pt": {
        "name": "Portuguese",
        "native_name": "Português",
        "unicode_range": r"[a-zA-Zãõáéíóú]",
        "confidence_boost": 1.0,
    },
    "it": {
        "name": "Italian",
        "native_name": "Italiano",
        "unicode_range": r"[a-zA-Zàèéìòù]",
        "confidence_boost": 1.0,
    },
    "tr": {
        "name": "Turkish",
        "native_name": "Türkçe",
        "unicode_range": r"[a-zA-ZçğıöşüÇĞİÖŞÜ]",
        "confidence_boost": 1.0,
    },
    "th": {
        "name": "Thai",
        "native_name": "ไทย",
        "unicode_range": r"[\u0E00-\u0E7F]",
        "confidence_boost": 1.5,
    },
}

LANGUAGE_HINTS = {
    "en": ["hello", "hi", "thanks", "please"],
    "bn": ["হাই", "ধন্যবাদ", "আপনি", "তুমি"],
    "hi": ["नमस्ते", "धन्यवाद", "आप", "क्या"],
    "ar": ["مرحبا", "شكرا", "كيف", "من"],
    "ur": ["سلام", "شکریہ", "آپ", "کیا", "میں"],
    "es": ["hola", "gracias", "como", "ayuda"],
    "fr": ["bonjour", "merci", "comment", "aider"],
    "zh": ["你好", "谢谢", "帮助"],
}


def detect_language(text: str) -> tuple[str, float]:
    """Detect language in text with confidence score.

    Args:
        text: Input text to analyze

    Returns:
        Tuple of (language_code, confidence) where confidence is 0-1
    """
    if not text or not text.strip():
        return "en", 0.0

    text = text.strip()
    text_lower = text.lower()
    scores = {}

    # Score each language based on character matches
    for lang_code, lang_info in LANGUAGES.items():
        pattern = lang_info["unicode_range"]
        matches = len(re.findall(pattern, text))

        if matches > 0:
            # Calculate confidence
            confidence = matches / len(text) * lang_info["confidence_boost"]
            scores[lang_code] = min(confidence, 1.0)  # Cap at 1.0

    # Keyword hints help short greetings and overlapping scripts.
    for lang_code, hints in LANGUAGE_HINTS.items():
        for hint in hints:
            if hint in text_lower or hint in text:
                scores[lang_code] = min(scores.get(lang_code, 0.0) + 0.35, 1.0)

    if not scores:
        # Default to English if no matches
        return "en", 0.5

    # Return language with highest score
    detected_lang = max(scores, key=scores.get)
    confidence = scores[detected_lang]

    logger.debug(
        f"Detected language: {detected_lang} "
        f"({LANGUAGES[detected_lang]['name']}) "
        f"with confidence {confidence:.2f}"
    )

    return detected_lang, confidence


def get_language_instruction(language_code: str) -> str:
    """Get instruction for AI to respond in specific language.

    Args:
        language_code: Language code (e.g., 'en', 'bn', 'hi')

    Returns:
        Instruction string for system prompt
    """
    lang_name = LANGUAGES.get(language_code, {}).get("name", "English")
    native_name = LANGUAGES.get(language_code, {}).get("native_name", "English")

    instructions = {
        "en": "Respond in English. Use clear, natural English language.",
        "bn": f"বাংলায় উত্তর দিন। স্বাভাবিক এবং নেটিভ বাংলা ভাষা ব্যবহার করুন। Respond in Bengali. Use natural, native Bengali language.",
        "hi": f"हिंदी में जवाब दें। प्राकृतिक और मूल हिंदी भाषा का उपयोग करें। Respond in Hindi. Use natural, native Hindi language.",
        "ar": f"أجب باللغة العربية. استخدم اللغة العربية الطبيعية والأصلية. Respond in Arabic. Use natural, native Arabic language.",
        "ur": "اردو میں جواب دیں۔ قدرتی اور روان اردو استعمال کریں۔ Respond in Urdu. Use natural, fluent Urdu.",
        "fr": "Répondez en français. Utilisez le français naturel et natif.",
        "es": "Responde en español. Usa español natural y nativo.",
        "de": "Antworte auf Deutsch. Verwende natürliches und natives Deutsch.",
        "ja": "日本語で答えてください。自然で本物の日本語を使用してください。",
        "zh": "用中文回答。使用自然而本地的中文。",
        "ru": "Отвечайте на русском языке. Используйте естественный и родной русский язык.",
        "ko": "한국어로 대답하세요. 자연스럽고 네이티브한 한국어를 사용하세요.",
        "pt": "Responda em português. Use português natural e nativo.",
        "it": "Rispondi in italiano. Usa l'italiano naturale e nativo.",
        "tr": "Türkçe cevap verin. Doğal ve yerli Türkçe kullanın.",
        "th": "ตอบในภาษาไทย ใช้ภาษาไทยที่เป็นธรรมชาติและเนื้อหา",
    }

    return instructions.get(language_code, instructions["en"])


def get_language_info(language_code: str) -> dict:
    """Get information about a language.

    Args:
        language_code: Language code

    Returns:
        Dictionary with language information
    """
    return LANGUAGES.get(language_code, LANGUAGES["en"])


def is_language_supported(language_code: str) -> bool:
    """Check if language is supported.

    Args:
        language_code: Language code to check

    Returns:
        True if language is supported
    """
    return language_code in LANGUAGES


def get_supported_languages() -> list[dict]:
    """Get list of all supported languages.

    Returns:
        List of language info dictionaries
    """
    return [
        {
            "code": code,
            "name": info["name"],
            "native_name": info["native_name"],
        }
        for code, info in LANGUAGES.items()
    ]


def normalize_language_code(language_code: str) -> str:
    """Normalize language code to supported format.

    Args:
        language_code: Raw language code

    Returns:
        Normalized language code
    """
    code = language_code.lower().strip()

    # Handle common variants
    variants = {
        "bengali": "bn",
        "hindi": "hi",
        "arabic": "ar",
        "urdu": "ur",
        "english": "en",
        "french": "fr",
        "spanish": "es",
        "german": "de",
        "japanese": "ja",
        "chinese": "zh",
        "russian": "ru",
        "korean": "ko",
        "portuguese": "pt",
        "italian": "it",
        "turkish": "tr",
        "thai": "th",
    }

    if code in variants:
        return variants[code]

    if code in LANGUAGES:
        return code

    # Default to English
    return "en"
