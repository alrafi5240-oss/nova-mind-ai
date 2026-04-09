import { useEffect } from 'react';
import {
  Bot,
  ChevronRight,
  FolderKanban,
  MessageSquarePlus,
  Plus,
  Wrench,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import Logo from './ui/Logo';

const PANEL_ITEMS = [
  { id: 'workspace', label: 'Workspace', icon: FolderKanban },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'tools', label: 'Tools', icon: Wrench },
];

const MODE_LABELS = {
  chat: 'Chat Assistant',
  agent: 'Agent',
  super_agent: '⚡ Super Agent',
};

export default function Sidebar({
  isOpen,
  onClose,
  onNewChat,
  onSelectConversation,
  activeId,
  activePanel,
  onSelectPanel,
  activeMode,
  onSelectMode,
  modes = [],
  tools = [],
}) {
  const { conversations, fetchConversations, deleteConversation } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-[min(90vw,340px)] p-3 transition-transform duration-300 sm:p-4 lg:static lg:w-[312px] lg:translate-x-0 lg:p-5',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="sidebar-panel flex h-full flex-col rounded-[28px] bg-white/[0.03] p-4 sm:rounded-[32px] sm:p-5">
          <div className="flex items-start justify-between gap-3 sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="ui-label">
                AI Workspace
              </div>
              <Logo size="sm" tone="light" responsiveText className="mt-2 min-w-0" />
              <div className="ui-copy mt-2 text-xs leading-6">
                Chat, approval-first agents, and autonomous delivery in one calm workspace.
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="glass-button inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <motion.button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            className="btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            New Thread
          </motion.button>

          <div className="mt-7">
            <p className="ui-label">
              Sections
            </p>
            <div className="mt-3 space-y-2.5">
              {PANEL_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activePanel === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectPanel(item.id);
                      onClose();
                    }}
                    className={clsx(
                      'interactive-ripple flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-300 hover:translate-x-1',
                      isActive
                        ? 'sidebar-card-active text-white'
                        : 'border-white/8 bg-white/[0.03] text-slate-200/90 hover:bg-white/[0.06] hover:text-white'
                    )}
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between">
              <p className="ui-label">
                Execution Layers
              </p>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                {MODE_LABELS[activeMode] || 'Chat Assistant'}
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {modes.map((mode) => {
                const isActive = mode.id === activeMode;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      onSelectMode(mode.id);
                      onClose();
                    }}
                    className={clsx(
                      'interactive-ripple mode-option-button w-full rounded-2xl border px-4 py-3 text-left transition-all duration-300 hover:translate-x-1',
                      isActive
                        ? mode.id === 'super_agent'
                          ? 'super-agent-glow super-agent-pulse text-white'
                          : 'sidebar-card-active text-white'
                        : 'border-white/8 bg-white/[0.03] text-slate-200/90 hover:bg-white/[0.06] hover:text-white'
                    )}
                  >
                    <div className="text-sm font-semibold">{mode.label}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-300/75">{mode.helper}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between">
            <p className="ui-label">
              Workspace Threads
            </p>
            <MessageSquarePlus className="h-4 w-4 text-slate-500" />
          </div>

          <div className="premium-scroll mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {conversations.length === 0 ? (
              <div className="sidebar-card rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm leading-7 text-slate-300/80">
                Start a chat, agent task, or super-agent build and the workspace history will appear here.
              </div>
            ) : (
              conversations.map((conversation, index) => {
                const isActive = conversation._id === activeId;

                return (
                  <motion.div
                    key={conversation._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, delay: index * 0.02 }}
                    className={clsx(
                      'sidebar-card group rounded-2xl border px-3 py-3 transition-all duration-300 hover:translate-x-1',
                      isActive
                        ? 'sidebar-card-active'
                        : 'border-white/5 bg-white/[0.04] hover:border-white/10 hover:bg-white/[0.06]'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectConversation(conversation._id);
                          onClose();
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="truncate text-sm font-medium text-white">
                          {conversation.title || 'New workspace thread'}
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-300/70">
                          {(conversation.messages?.[conversation.messages.length - 1]?.content || 'Ready to continue').slice(0, 52)}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteConversation(conversation._id)}
                        className="opacity-0 transition-opacity hover:text-rose-300 group-hover:opacity-100"
                      >
                        <X className="h-4 w-4 text-slate-500" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="sidebar-card mt-6 rounded-2xl px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-white">{user?.full_name || 'Workspace Guest'}</div>
                <div className="mt-1 text-xs text-slate-300/80">{user?.email || 'Guest session'}</div>
              </div>
              <span className="rounded-full border border-emerald-400/18 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                Live
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
                <div className="ui-label text-[11px] tracking-[0.18em]">
                  Tools
                </div>
                <div className="mt-2 text-lg font-semibold text-white">{String(tools.length).padStart(2, '0')}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
                <div className="ui-label text-[11px] tracking-[0.18em]">
                  Layer
                </div>
                <div className="mt-2 text-sm font-semibold text-white">{MODE_LABELS[activeMode] || 'Chat Assistant'}</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-200/90">
              <span className="font-semibold text-white">NOVA MIND AI</span> combines direct chat, approval-first agents, and autonomous super-agent execution in one workspace.
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
