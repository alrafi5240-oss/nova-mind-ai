import { Sparkles } from 'lucide-react';
import WorkspaceIntro from './WorkspaceIntro';
import MessageBubble from './MessageBubble';

function TypingBubble() {
  return (
    <div className="mb-6 flex w-full justify-start animate-fade-in">
      <div className="flex max-w-[min(100%,720px)] flex-col gap-2">
        <div className="flex items-center gap-2 px-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-950">
            <Sparkles className="h-3 w-3" />
          </span>
          NOVA MIND AI
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-slate-300 [animation-delay:150ms] dark:bg-slate-600" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-slate-300 [animation-delay:300ms] dark:bg-slate-600" />
          </div>
        </div>
        <p className="px-1 text-xs text-slate-400 dark:text-slate-500">Thinking…</p>
      </div>
    </div>
  );
}

export default function ChatWorkspace({
  activeConversation,
  isGenerating,
  messageEndRef,
  messages,
  onToolSelect,
  selectedTool,
  selectedToolId,
  workspaceTools,
}) {
  const showIntro = messages.length <= 1;

  return (
    <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="pb-4">
        {showIntro ? (
          <WorkspaceIntro
            onToolSelect={onToolSelect}
            selectedToolId={selectedToolId}
            workspaceTools={workspaceTools}
          />
        ) : (
          <div className="mb-6 animate-slide-up">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Conversation</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {activeConversation?.title || 'Workspace'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {selectedTool ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {selectedTool.label}
                </span>
              ) : null}
              <span className="text-xs text-slate-400 dark:text-slate-500">{activeConversation?.updatedAt || 'Now'}</span>
            </div>
            {activeConversation?.preview ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{activeConversation.preview}</p>
            ) : null}
          </div>
        )}

        <div className="flex flex-col">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isGenerating ? <TypingBubble /> : null}
          <div ref={messageEndRef} className="h-px shrink-0" />
        </div>
      </div>
    </main>
  );
}
