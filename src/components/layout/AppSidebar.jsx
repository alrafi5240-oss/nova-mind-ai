import clsx from 'clsx';
import { MessageSquarePlus, Sparkles } from 'lucide-react';
import { primaryNavItems } from '../../data/appShell';

function SidebarContent({
  activeNavId = 'workspace',
  activeConversationId,
  conversationSections,
  mobile = false,
  onClose,
  onConversationSelect,
  onNewChat,
  onPrimaryNavSelect,
  onQuickToolsOpen,
}) {
  const handleNavClick = (item) => {
    if (item.id === 'quick-tools') {
      onQuickToolsOpen?.();
      if (mobile) onClose?.();
      return;
    }
    onPrimaryNavSelect?.(item.id);
    if (mobile) onClose?.();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-6 flex items-center gap-3 px-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-950">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">NOVA MIND AI</p>
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">Workspace</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          onNewChat();
          if (mobile) onClose?.();
        }}
        className="mb-6 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-medium text-white shadow-sm transition duration-200 ease-out hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
      >
        <MessageSquarePlus className="h-4 w-4" />
        New chat
      </button>

      <nav className="mb-6 space-y-1" aria-label="Primary">
        {primaryNavItems.map((item) => {
          const isActive = activeNavId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item)}
              className={clsx(
                'flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition duration-200 ease-out',
                isActive
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
              )}
            >
              <item.icon className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={1.75} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mb-2 px-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Recent Chats</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <div className="space-y-6 pb-4">
          {conversationSections.map((section) => (
            <div key={section.label} className="space-y-1">
              <p className="px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      onConversationSelect(conversation.id);
                      if (mobile) onClose?.();
                    }}
                    className={clsx(
                      'flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition duration-200 ease-out',
                      conversation.id === activeConversationId
                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                    )}
                  >
                    <span className="truncate text-sm font-medium">{conversation.title}</span>
                    <span className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">{conversation.preview}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AppSidebar(props) {
  return (
    <aside className="hidden h-screen w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:flex">
      <div className="flex h-full min-h-0 flex-col px-4 py-6">
        <SidebarContent {...props} />
      </div>
    </aside>
  );
}

export { SidebarContent };
