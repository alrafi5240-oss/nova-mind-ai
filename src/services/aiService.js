const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are NOVA MIND AI, a powerful, intelligent, and professional AI assistant created by SHAKIL (CIO, Bangladesh).

You are a global AI product that:
- Understands and responds in ALL languages (English, Bangla/Bengali, Arabic, Hindi, French, Spanish, Chinese, Russian, and more)
- Always replies in the SAME language the user writes in
- Provides accurate, helpful, and clear answers
- Maintains a professional yet friendly tone
- Handles complex technical, creative, analytical, and general questions
- Never refuses to help with legitimate requests

Your identity:
- Name: NOVA MIND AI
- Creator: SHAKIL (CIO, Bangladesh)
- Mission: Empower people worldwide with intelligent AI assistance
- Tagline: "Think Beyond. Act Smart."

Always be helpful, accurate, and professional.`;

const getLanguageInstruction = (language) => {
  const instructions = {
    bn: 'সর্বদা বাংলায় উত্তর দিন।',
    ar: 'أجب دائماً باللغة العربية.',
    hi: 'हमेशा हिंदी में जवाब दें।',
    fr: 'Répondez toujours en français.',
    es: 'Responde siempre en español.',
    zh: '请始终用中文回答。',
    ru: 'Всегда отвечайте на русском языке.',
    pt: 'Responda sempre em português.',
    de: 'Antworten Sie immer auf Deutsch.',
    en: 'Always respond in English.',
  };
  return instructions[language] || '';
};

const chat = async ({ messages, userLanguage = 'en', model, stream = false, onChunk }) => {
  const langInstruction = getLanguageInstruction(userLanguage);
  const systemPrompt = langInstruction
    ? `${SYSTEM_PROMPT}\n\nLanguage instruction: ${langInstruction}`
    : SYSTEM_PROMPT;

  const claudeMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const selectedModel = model || process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

  if (stream && onChunk) {
    return chatStream({ claudeMessages, systemPrompt, selectedModel, onChunk });
  }

  try {
    const response = await anthropic.messages.create({
      model: selectedModel,
      max_tokens: 4096,
      system: systemPrompt,
      messages: claudeMessages,
    });

    return {
      content: response.content[0].text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model: response.model,
    };
  } catch (error) {
    logger.error('Anthropic API error:', error);
    if (error.status === 429) throw new Error('AI service is busy. Please try again in a moment.');
    if (error.status === 401) throw new Error('AI service configuration error. Please contact support.');
    throw new Error('Failed to get AI response. Please try again.');
  }
};

const chatStream = async ({ claudeMessages, systemPrompt, selectedModel, onChunk }) => {
  let inputTokens = 0;
  let outputTokens = 0;
  let fullContent = '';

  try {
    const stream = await anthropic.messages.create({
      model: selectedModel,
      max_tokens: 4096,
      system: systemPrompt,
      messages: claudeMessages,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const chunk = event.delta.text;
        fullContent += chunk;
        onChunk({ type: 'text', content: chunk });
      } else if (event.type === 'message_start') {
        inputTokens = event.message.usage?.input_tokens || 0;
      } else if (event.type === 'message_delta') {
        outputTokens = event.usage?.output_tokens || 0;
      } else if (event.type === 'message_stop') {
        onChunk({ type: 'done' });
      }
    }

    return { content: fullContent, inputTokens, outputTokens };
  } catch (error) {
    logger.error('Streaming error:', error);
    onChunk({ type: 'error', message: error.message });
    throw error;
  }
};

const detectLanguage = async (text) => {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: `Detect the language of this text and respond with ONLY the ISO 639-1 language code (e.g., en, bn, ar, hi, fr, es): "${text.substring(0, 200)}"`,
        },
      ],
    });
    const code = response.content[0].text.trim().toLowerCase().slice(0, 5);
    return code || 'en';
  } catch {
    return 'en';
  }
};

module.exports = { chat, detectLanguage };
