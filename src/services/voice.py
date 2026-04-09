"""OpenAI Whisper transcription (async)."""

from __future__ import annotations

import logging
from io import BytesIO

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

WHISPER_MODEL = "whisper-1"
MAX_AUDIO_BYTES = 10 * 1024 * 1024


async def transcribe_audio(
    client: AsyncOpenAI, audio_bytes: bytes, filename: str = "audio.m4a"
) -> str:
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise ValueError("Audio file too large")

    buffer = BytesIO(audio_bytes)
    buffer.name = filename

    result = await client.audio.transcriptions.create(
        model=WHISPER_MODEL,
        file=buffer,
    )
    text = (result.text or "").strip()
    logger.info("Whisper transcript length=%s", len(text))
    return text
