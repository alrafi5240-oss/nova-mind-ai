const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    tokens: {
      input: { type: Number, default: 0 },
      output: { type: Number, default: 0 },
    },
    language: { type: String, default: 'en' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      maxlength: 200,
    },
    messages: [messageSchema],
    model: {
      type: String,
      default: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
    },
    language: {
      type: String,
      default: 'en',
    },
    isArchived: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    totalTokens: {
      input: { type: Number, default: 0 },
      output: { type: Number, default: 0 },
    },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Index for fast queries
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ userId: 1, isArchived: 1 });

// Auto-generate title from first user message
conversationSchema.methods.generateTitle = function () {
  const firstUserMessage = this.messages.find((m) => m.role === 'user');
  if (firstUserMessage) {
    this.title = firstUserMessage.content.substring(0, 60) + (firstUserMessage.content.length > 60 ? '...' : '');
  }
};

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;
