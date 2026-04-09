import clsx from 'clsx';
import { Sparkles } from 'lucide-react';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={clsx(
        'mb-6 flex w-full animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div className={clsx('flex max-w-[min(100%,720px)] flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
        {!isUser ? (
          <div className="flex items-center gap-2 px-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-950">
              <Sparkles className="h-3 w-3" />
            </span>
            NOVA MIND AI
          </div>
        ) : null}

        <div
          className={clsx(
            'rounded-2xl px-4 py-3 text-[0.9375rem] leading-7 shadow-sm transition duration-200',
            isUser
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
              : 'border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        <p className={clsx('px-1 text-xs text-slate-400 dark:text-slate-500', isUser ? 'text-right' : 'text-left')}>
          {isUser ? 'You' : 'Assistant'} · {message.timestamp}
        </p>
      </div>
    </div>
  );
}
