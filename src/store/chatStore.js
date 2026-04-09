import { create } from 'zustand';
import { API_ENDPOINTS } from '../config/api';
import { getStoredApiKey, getStoredOwnerKey } from '../utils/authStorage';
import api from '../utils/api';
import useAuthStore from './authStore';

const createConversationId = () => `chat-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const generateConversationTitle = (content) => {
  const normalized = (content || '').trim().replace(/\s+/g, ' ');
  if (!normalized) return 'New chat';
  return normalized.length > 36 ? `${normalized.slice(0, 36)}…` : normalized;
};

const normalizeConversation = (conversation) => ({
  _id: conversation?._id || createConversationId(),
  title: conversation?.title || 'New chat',
  messages: Array.isArray(conversation?.messages) ? conversation.messages : [],
  updatedAt: conversation?.updatedAt || new Date().toISOString(),
  createdAt: conversation?.createdAt || new Date().toISOString(),
  isPinned: Boolean(conversation?.isPinned),
  isArchived: Boolean(conversation?.isArchived),
  language: conversation?.language || 'en',
});

const normalizeMessageContent = (value) => {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeMessageContent(item))
      .filter(Boolean)
      .join('\n')
      .trim();
  }
  if (value && typeof value === 'object') {
    if (typeof value.content === 'string') return value.content.trim();
    if (typeof value.text === 'string') return value.text.trim();
    if (typeof value.message === 'string') return value.message.trim();
  }
  return value == null ? '' : String(value).trim();
};

const resolveAssistantReply = (payload) => {
  const candidates = [
    payload?.reply,
    payload?.message,
    payload?.text,
    payload?.response,
    payload?.data?.reply,
    payload?.data?.message,
    payload?.data?.text,
    payload?.data?.response,
    payload?.message?.content,
    payload?.message?.text,
    payload?.data?.message?.content,
    payload?.data?.message?.text,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeMessageContent(candidate);
    if (normalized) return normalized;
  }

  return '';
};

const resolveConversationId = (payload, fallbackId) =>
  payload?.session_id ||
  payload?.sessionId ||
  payload?.conversation_id ||
  payload?.conversationId ||
  payload?.data?.session_id ||
  payload?.data?.sessionId ||
  payload?.data?.conversation_id ||
  payload?.data?.conversationId ||
  fallbackId;

const upsertConversation = (conversations, conversation, previousId = null) => {
  const normalized = normalizeConversation(conversation);
  const filtered = conversations.filter(
    (item) => item._id !== normalized._id && (!previousId || item._id !== previousId)
  );
  return [normalized, ...filtered];
};

const createUserMessage = (content) => ({
  role: 'user',
  content,
  timestamp: new Date().toISOString(),
});

const createAssistantMessage = (content) => ({
  role: 'assistant',
  content,
  timestamp: new Date().toISOString(),
});

const buildOptimisticConversation = (state, content, language = 'en') => {
  const trimmed = (content || '').trim();
  const userMessage = createUserMessage(trimmed);
  const existingConversation = state.activeConversation;
  const conversationId = existingConversation?._id || createConversationId();
  const optimisticConversation = normalizeConversation({
    ...existingConversation,
    _id: conversationId,
    title: existingConversation?.title || generateConversationTitle(trimmed),
    messages: [...state.messages, userMessage],
    language,
    updatedAt: new Date().toISOString(),
  });

  return {
    trimmed,
    userMessage,
    conversationId,
    existingConversation,
    optimisticConversation,
  };
};

const beginConversationTurn = (set, get, content, language = 'en') => {
  const state = get();
  const turn = buildOptimisticConversation(state, content, language);

  set((currentState) => ({
    messages: turn.optimisticConversation.messages,
    activeConversation: turn.optimisticConversation,
    conversations: upsertConversation(
      currentState.conversations,
      turn.optimisticConversation,
      turn.existingConversation?._id
    ),
    isStreaming: true,
  }));

  return turn;
};

const completeConversationTurn = (set, get, turn, reply, payload = null) => {
  const assistantMessage = createAssistantMessage(reply);
  const nextMessages = [...turn.optimisticConversation.messages, assistantMessage];
  const resolvedConversation = normalizeConversation({
    ...turn.optimisticConversation,
    _id: resolveConversationId(payload, turn.conversationId),
    messages: nextMessages,
    updatedAt: new Date().toISOString(),
  });

  const authState = useAuthStore.getState();
  if (authState.user?.usage) {
    authState.updateUser?.({
      usage: {
        ...(authState.user.usage || {}),
        messagesThisMonth: (authState.user.usage?.messagesThisMonth || 0) + 1,
      },
    });
  }

  set((state) => ({
    messages: nextMessages,
    activeConversation: {
      ...resolvedConversation,
      messages: nextMessages,
    },
    conversations: upsertConversation(
      state.conversations,
      {
        ...resolvedConversation,
        messages: nextMessages,
      },
      turn.conversationId
    ),
    isStreaming: false,
  }));

  return { ok: true, reply, payload };
};

const failConversationTurn = (set, turn, detail) => {
  const assistantMessage = createAssistantMessage(detail);
  const failedConversation = normalizeConversation({
    ...turn.optimisticConversation,
    messages: [...turn.optimisticConversation.messages, assistantMessage],
  });

  set((state) => ({
    messages: failedConversation.messages,
    activeConversation: failedConversation,
    conversations: upsertConversation(state.conversations, failedConversation, turn.conversationId),
    isStreaming: false,
  }));

  return { ok: false, reply: detail };
};

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoading: false,
  isStreaming: false,

  fetchConversations: async () => get().conversations,

  loadConversation: async (id) => {
    const conversation = get().conversations.find((item) => item._id === id) || null;
    set({
      activeConversation: conversation,
      messages: conversation?.messages || [],
      isLoading: false,
    });
    return conversation;
  },

  startNewConversation: () => {
    set({ activeConversation: null, messages: [], isStreaming: false });
  },

  setStreaming: (value) => set({ isStreaming: Boolean(value) }),

  beginExternalTurn: (content, language = 'en') => beginConversationTurn(set, get, content, language),

  completeExternalTurn: ({ turn, reply, payload = null }) =>
    completeConversationTurn(set, get, turn, normalizeMessageContent(reply), payload),

  failExternalTurn: ({ turn, reply }) =>
    failConversationTurn(set, turn, normalizeMessageContent(reply) || 'Something went wrong'),

  sendMessage: async (content, language = 'en', mode = 'chat') => {
    const trimmed = (content || '').trim();
    if (!trimmed) {
      return { ok: false, reply: '' };
    }
    const turn = beginConversationTurn(set, get, trimmed, language);

    try {
      console.log('Chat API request:', {
        endpoint: API_ENDPOINTS.chat,
        message: trimmed,
        mode,
        conversation_id: turn.conversationId,
        session_id: turn.conversationId,
        hasApiKey: Boolean(getStoredApiKey()),
        hasOwnerKey: Boolean(getStoredOwnerKey()),
      });

      const response = await api.post(API_ENDPOINTS.chat, {
        message: trimmed,
        mode,
        session_id: turn.conversationId,
        conversation_id: turn.conversationId,
      });

      const payload = response?.data;
      console.log('Chat API response:', payload);
      const assistantReply = resolveAssistantReply(payload);
      if (!assistantReply) {
        throw new Error('Empty response from backend');
      }
      return completeConversationTurn(set, get, turn, assistantReply, payload);
    } catch (error) {
      console.error('Chat request failed:', error);
      const detail =
        error?.response?.data?.reply ||
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Something went wrong';
      return failConversationTurn(set, turn, detail);
    }
  },

  deleteConversation: async (id) => {
    set((state) => {
      const conversations = state.conversations.filter((conversation) => conversation._id !== id);
      const activeConversation = state.activeConversation?._id === id ? null : state.activeConversation;
      return {
        conversations,
        activeConversation,
        messages: activeConversation ? state.messages : [],
      };
    });
  },

  updateConversation: async (id, updates) => {
    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation._id === id ? { ...conversation, ...updates } : conversation
      ),
      activeConversation:
        state.activeConversation?._id === id
          ? { ...state.activeConversation, ...updates }
          : state.activeConversation,
    }));
  },
}));

export default useChatStore;
