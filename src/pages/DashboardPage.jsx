import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUp,
  Clock3,
  LogOut,
  MessageSquare,
  Plus,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import ChatBubble from '../components/ChatBubble';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';

const NAV_ITEMS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'history', label: 'History', icon: Clock3 },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

const formatConversationTime = (value) => {
  if (!value) return 'Just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

function WorkspaceMenu({ activeSection, onSelectSection }) {
  return (
    <nav className="space-y-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectSection(item.id)}
            className={clsx(
              'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all duration-300',
              isActive
                ? 'border border-white/14 bg-white/12 text-white shadow-[0_18px_36px_rgba(15,23,42,0.22)]'
                : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
            )}
          >
            <span
              className={clsx(
                'inline-flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-lg',
                isActive
                  ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100'
                  : 'border-white/8 bg-white/[0.05] text-slate-400'
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function EmptyChatState({ onPrompt }) {
  const prompts = [
    'Outline the fastest launch plan for my AI product.',
    'Help me write a clearer feature brief for the next sprint.',
    'Summarize the product direction into 3 clean priorities.',
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/16 bg-cyan-300/10 text-cyan-100 shadow-[0_0_28px_rgba(79,172,254,0.18)]">
        <Sparkles className="h-5 w-5" />
      </div>
      <h2 className="mt-6 text-[28px] font-semibold tracking-[-0.04em] text-white">
        Start a focused conversation
      </h2>
      <p className="mt-3 max-w-[540px] text-sm leading-7 text-slate-300">
        Use NOVA MIND AI like a clean private workspace for thinking, planning, and shipping ideas without distractions.
      </p>

      <div className="mt-8 flex w-full max-w-[700px] flex-wrap justify-center gap-3">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPrompt(prompt)}
            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.1] hover:text-white"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatComposer({ value, onChange, onSubmit, disabled }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
  }, [value]);

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[26px] border border-white/10 bg-white/[0.06] p-3 backdrop-blur-lg shadow-[0_20px_45px_rgba(2,6,23,0.22)]"
    >
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Message NOVA MIND AI"
          disabled={disabled}
          className="min-h-[56px] max-h-[140px] flex-1 resize-none bg-transparent px-2 py-3 text-[15px] leading-7 text-white outline-none placeholder:text-slate-400"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSubmit(event);
            }
          }}
        />

        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className={clsx(
            'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-white transition-all duration-300',
            disabled || !value.trim()
              ? 'cursor-not-allowed border-white/8 bg-white/[0.06] text-slate-500'
              : 'border-cyan-300/14 bg-[linear-gradient(135deg,rgba(79,172,254,0.92),rgba(0,242,254,0.88))] shadow-[0_14px_32px_rgba(0,150,255,0.22)] hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(0,150,255,0.28)]'
          )}
          aria-label="Send message"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, fetchMe, logout } = useAuthStore();
  const {
    conversations,
    activeConversation,
    messages,
    isStreaming,
    sendMessage,
    loadConversation,
    startNewConversation,
  } = useChatStore();

  const [activeSection, setActiveSection] = useState('chat');
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const profileName = user?.full_name || user?.name || 'Nova User';
  const profileEmail = user?.email || 'Guest session';
  const profileInitial = profileName.charAt(0).toUpperCase() || 'N';
  const currentTitle = activeConversation?.title || 'New conversation';

  const historyItems = useMemo(
    () =>
      conversations.map((conversation) => ({
        id: conversation._id,
        title: conversation.title || 'New chat',
        preview:
          (conversation.messages?.[conversation.messages.length - 1]?.content || 'No messages yet').slice(0, 92),
        updatedAt: formatConversationTime(conversation.updatedAt || conversation.createdAt),
      })),
    [conversations]
  );

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || isStreaming) return;
    setActiveSection('chat');
    setDraft('');
    await sendMessage(trimmed, user?.language || 'en', 'chat');
  };

  const handleOpenConversation = async (conversationId) => {
    await loadConversation(conversationId);
    setActiveSection('chat');
  };

  const handleNewChat = () => {
    startNewConversation();
    setActiveSection('chat');
    setDraft('');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(79,172,254,0.24),transparent_24%),radial-gradient(circle_at_82%_22%,rgba(96,165,250,0.16),transparent_22%),radial-gradient(circle_at_52%_108%,rgba(34,211,238,0.16),transparent_30%),linear-gradient(145deg,#08111f_0%,#0f172a_48%,#0d4d68_100%)] opacity-100" />
        <div className="absolute left-[-8%] top-[12%] h-72 w-72 rounded-full bg-blue-400/18 blur-[120px]" />
        <div className="absolute right-[-10%] top-[22%] h-80 w-80 rounded-full bg-cyan-300/14 blur-[140px]" />
        <div className="absolute bottom-[-14%] left-[28%] h-96 w-96 rounded-full bg-violet-400/12 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1320px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid flex-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-[30px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-lg shadow-[0_24px_56px_rgba(2,6,23,0.24)]">
            <div className="flex items-center gap-3">
              <Logo size="nav" showText={false} />
              <div>
                <div className="text-[14px] font-semibold tracking-[-0.01em] text-white">
                  NOVA MIND AI
                </div>
                <div className="text-xs text-slate-400">Workspace</div>
              </div>
            </div>

            <div className="mt-8">
              <WorkspaceMenu activeSection={activeSection} onSelectSection={setActiveSection} />
            </div>

            <button
              type="button"
              onClick={handleNewChat}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/14 bg-[linear-gradient(135deg,rgba(79,172,254,0.18),rgba(0,242,254,0.14))] px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,rgba(79,172,254,0.22),rgba(0,242,254,0.18))]"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>

            <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Current session</div>
              <div className="mt-3 text-sm font-medium text-white">{currentTitle}</div>
              <div className="mt-2 text-sm leading-6 text-slate-400">
                {messages.length > 0
                  ? `${messages.length} messages in this conversation`
                  : 'Start a new chat to build focus and momentum.'}
              </div>
            </div>
          </aside>

          <div className="flex min-h-[780px] flex-col gap-5">
            <header className="rounded-[26px] border border-white/10 bg-white/[0.05] px-5 py-4 backdrop-blur-lg shadow-[0_20px_50px_rgba(2,6,23,0.2)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {activeSection === 'chat'
                      ? 'AI workspace'
                      : activeSection === 'history'
                        ? 'Recent conversations'
                        : 'Workspace settings'}
                  </div>
                  <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white">
                    {activeSection === 'chat'
                      ? 'Focused AI chat'
                      : activeSection === 'history'
                        ? 'Conversation history'
                        : 'Profile and preferences'}
                  </h1>
                </div>

                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(79,172,254,0.82),rgba(0,242,254,0.65))] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,150,255,0.18)]">
                    {profileInitial}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{profileName}</div>
                    <div className="truncate text-xs text-slate-400">{profileEmail}</div>
                  </div>
                </div>
              </div>
            </header>

            <motion.section
              layout
              className="flex flex-1 flex-col rounded-[30px] border border-white/10 bg-white/[0.05] backdrop-blur-lg shadow-[0_26px_60px_rgba(2,6,23,0.24)]"
            >
              <AnimatePresence mode="wait">
                {activeSection === 'chat' && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                    className="flex h-full min-h-0 flex-col"
                  >
                    <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
                      {messages.length === 0 ? (
                        <EmptyChatState onPrompt={(prompt) => setDraft(prompt)} />
                      ) : (
                        <div className="space-y-6">
                          {messages.map((message, index) => (
                            <ChatBubble
                              key={`${message.timestamp || index}-${index}`}
                              message={message}
                            />
                          ))}
                          {isStreaming && (
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-300">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                              NOVA MIND AI is thinking
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/8 px-5 py-5 sm:px-7">
                      <ChatComposer
                        value={draft}
                        onChange={setDraft}
                        onSubmit={handleSend}
                        disabled={isStreaming}
                      />
                    </div>
                  </motion.div>
                )}

                {activeSection === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                    className="flex h-full flex-col px-5 py-6 sm:px-7"
                  >
                    {historyItems.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <div className="text-lg font-medium text-white">No conversation history yet</div>
                        <div className="mt-2 max-w-md text-sm leading-7 text-slate-400">
                          Once you start chatting, recent conversations will appear here for quick return and context.
                        </div>
                      </div>
                    ) : (
                      <div className="premium-scroll grid gap-3 overflow-y-auto pr-1">
                        {historyItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => void handleOpenConversation(item.id)}
                            className={clsx(
                              'rounded-[24px] border px-4 py-4 text-left transition-all duration-300 hover:-translate-y-0.5',
                              activeConversation?._id === item.id
                                ? 'border-cyan-300/18 bg-cyan-300/10 shadow-[0_18px_40px_rgba(0,150,255,0.12)]'
                                : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-white">{item.title}</div>
                                <div className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                                  {item.preview}
                                </div>
                              </div>
                              <div className="shrink-0 text-xs text-slate-500">{item.updatedAt}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeSection === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                    className="grid gap-4 px-5 py-6 sm:px-7 lg:grid-cols-2"
                  >
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Profile
                      </div>
                      <div className="mt-4 text-lg font-medium text-white">{profileName}</div>
                      <div className="mt-2 text-sm text-slate-400">{profileEmail}</div>
                      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                        Provider: {user?.provider || 'email'}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Workspace
                      </div>
                      <div className="mt-4 text-sm leading-7 text-slate-300">
                        Clean, private, and optimized for focused AI work across chat, history, and settings.
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.1]"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}
