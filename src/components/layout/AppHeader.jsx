import { Menu, MoonStar, PenSquare, Sparkles, SunMedium } from 'lucide-react';

export default function AppHeader({
  activeConversation,
  activeTool,
  onMenuOpen,
  onNewChat,
  onToggleTheme,
  theme,
}) {
  return (
    <header className="mb-6 shrink-0 border-b border-slate-100 bg-white pb-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition duration-200 ease-out hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-[1.125rem] w-[1.125rem]" />
          </button>

          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950 sm:flex">
            <Sparkles className="h-[1.125rem] w-[1.125rem]" />
          </div>

          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">NOVA MIND AI</p>
            <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              {activeConversation?.title || 'New conversation'}
            </h2>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {activeTool ? (
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 md:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {activeTool.label}
            </div>
          ) : null}

          <button
            type="button"
            onClick={onNewChat}
            className="hidden h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition duration-200 ease-out hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 sm:inline-flex"
          >
            <PenSquare className="h-4 w-4" />
            New chat
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition duration-200 ease-out hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <SunMedium className="h-[1.125rem] w-[1.125rem]" />
            ) : (
              <MoonStar className="h-[1.125rem] w-[1.125rem]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
