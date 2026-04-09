const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');
const Conversation = require('../models/Conversation');
const { chat, detectLanguage } = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// All chat routes require auth
router.use(protect);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// POST /api/chat/message - Send message (non-streaming)
router.post(
  '/message',
  chatLimiter,
  [
    body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 10000 }),
    body('conversationId').optional().isMongoId(),
    body('language').optional().isString().isLength({ max: 5 }),
  ],
  validate,
  async (req, res) => {
    try {
      // Check message limit
      if (!req.user.canSendMessage()) {
        return res.status(429).json({
          success: false,
          message: 'Monthly message limit reached. Please upgrade your plan.',
          code: 'MESSAGE_LIMIT_REACHED',
          limit: req.user.messageLimit,
          used: req.user.usage.messagesThisMonth,
        });
      }

      const { message, conversationId, language } = req.body;
      const userLanguage = language || req.user.language || 'en';

      let conversation;

      if (conversationId) {
        conversation = await Conversation.findOne({ _id: conversationId, userId: req.user._id });
        if (!conversation) {
          return res.status(404).json({ success: false, message: 'Conversation not found.' });
        }
      } else {
        conversation = new Conversation({
          userId: req.user._id,
          language: userLanguage,
        });
      }

      // Add user message
      conversation.messages.push({ role: 'user', content: message, language: userLanguage });

      // Build messages for AI (last 20 for context)
      const contextMessages = conversation.messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Get AI response
      const aiResponse = await chat({
        messages: contextMessages,
        userLanguage,
        stream: false,
      });

      // Add assistant message
      conversation.messages.push({
        role: 'assistant',
        content: aiResponse.content,
        tokens: { input: aiResponse.inputTokens, output: aiResponse.outputTokens },
        language: userLanguage,
      });

      // Update token counts
      conversation.totalTokens.input += aiResponse.inputTokens;
      conversation.totalTokens.output += aiResponse.outputTokens;

      // Auto-generate title for new conversations
      if (conversation.messages.length === 2) {
        conversation.generateTitle();
      }

      await conversation.save();
      await req.user.incrementUsage();

      res.json({
        success: true,
        data: {
          conversationId: conversation._id,
          message: {
            role: 'assistant',
            content: aiResponse.content,
            tokens: { input: aiResponse.inputTokens, output: aiResponse.outputTokens },
          },
          usage: {
            messagesThisMonth: req.user.usage.messagesThisMonth + 1,
            limit: req.user.messageLimit,
          },
        },
      });
    } catch (error) {
      logger.error('Chat message error:', error);
      res.status(500).json({ success: false, message: error.message || 'Chat failed. Please try again.' });
    }
  }
);

// POST /api/chat/stream - Streaming chat (SSE)
router.post(
  '/stream',
  chatLimiter,
  [
    body('message').trim().notEmpty().isLength({ max: 10000 }),
    body('conversationId').optional().isMongoId(),
    body('language').optional().isString().isLength({ max: 5 }),
  ],
  validate,
  async (req, res) => {
    // Check limit
    if (!req.user.canSendMessage()) {
      return res.status(429).json({
        success: false,
        message: 'Monthly message limit reached. Please upgrade your plan.',
        code: 'MESSAGE_LIMIT_REACHED',
      });
    }

    const { message, conversationId, language } = req.body;
    const userLanguage = language || req.user.language || 'en';

    // Setup SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.flushHeaders();

    const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    try {
      let conversation;
      if (conversationId) {
        conversation = await Conversation.findOne({ _id: conversationId, userId: req.user._id });
        if (!conversation) {
          send({ type: 'error', message: 'Conversation not found.' });
          return res.end();
        }
      } else {
        conversation = new Conversation({ userId: req.user._id, language: userLanguage });
      }

      conversation.messages.push({ role: 'user', content: message, language: userLanguage });

      const contextMessages = conversation.messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      send({ type: 'start', conversationId: conversation._id });

      let fullContent = '';
      let tokenInfo = { inputTokens: 0, outputTokens: 0 };

      const aiResult = await chat({
        messages: contextMessages,
        userLanguage,
        stream: true,
        onChunk: (chunk) => {
          if (chunk.type === 'text') {
            fullContent += chunk.content;
            send({ type: 'text', content: chunk.content });
          } else if (chunk.type === 'done') {
            send({ type: 'done' });
          } else if (chunk.type === 'error') {
            send({ type: 'error', message: chunk.message });
          }
        },
      });

      tokenInfo = { inputTokens: aiResult.inputTokens, outputTokens: aiResult.outputTokens };

      // Save to DB
      conversation.messages.push({
        role: 'assistant',
        content: fullContent,
        tokens: { input: tokenInfo.inputTokens, output: tokenInfo.outputTokens },
        language: userLanguage,
      });
      conversation.totalTokens.input += tokenInfo.inputTokens;
      conversation.totalTokens.output += tokenInfo.outputTokens;

      if (conversation.messages.length === 2) conversation.generateTitle();
      await conversation.save();
      await req.user.incrementUsage();

      send({
        type: 'meta',
        conversationId: conversation._id,
        title: conversation.title,
        tokens: tokenInfo,
      });

      res.end();
    } catch (error) {
      logger.error('Streaming chat error:', error);
      send({ type: 'error', message: error.message || 'Streaming failed.' });
      res.end();
    }
  }
);

// GET /api/chat/conversations - List conversations
router.get('/conversations', async (req, res) => {
  try {
    const { page = 1, limit = 20, archived = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversations = await Conversation.find({
      userId: req.user._id,
      isArchived: archived === 'true',
    })
      .select('title createdAt updatedAt isPinned isArchived totalTokens language')
      .sort({ isPinned: -1, updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Conversation.countDocuments({
      userId: req.user._id,
      isArchived: archived === 'true',
    });

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error('List conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to load conversations.' });
  }
});

// GET /api/chat/conversations/:id - Get conversation
router.get('/conversations/:id', [param('id').isMongoId()], validate, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    res.json({ success: true, data: { conversation } });
  } catch (error) {
    logger.error('Get conversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to load conversation.' });
  }
});

// DELETE /api/chat/conversations/:id - Delete conversation
router.delete('/conversations/:id', [param('id').isMongoId()], validate, async (req, res) => {
  try {
    const deleted = await Conversation.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    res.json({ success: true, message: 'Conversation deleted.' });
  } catch (error) {
    logger.error('Delete conversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete conversation.' });
  }
});

// PATCH /api/chat/conversations/:id - Update (pin, archive, rename)
router.patch(
  '/conversations/:id',
  [param('id').isMongoId(), body('title').optional().isString().isLength({ max: 200 })],
  validate,
  async (req, res) => {
    try {
      const { title, isPinned, isArchived } = req.body;
      const update = {};
      if (title !== undefined) update.title = title;
      if (isPinned !== undefined) update.isPinned = isPinned;
      if (isArchived !== undefined) update.isArchived = isArchived;

      const conversation = await Conversation.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        update,
        { new: true }
      );
      if (!conversation) {
        return res.status(404).json({ success: false, message: 'Conversation not found.' });
      }
      res.json({ success: true, data: { conversation } });
    } catch (error) {
      logger.error('Update conversation error:', error);
      res.status(500).json({ success: false, message: 'Failed to update conversation.' });
    }
  }
);

module.exports = router;
