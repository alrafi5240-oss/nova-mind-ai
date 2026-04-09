import { useEffect } from 'react';
import clsx from 'clsx';
import { Sparkles, X } from 'lucide-react';
import GlassPanel from '../layout/GlassPanel';
import QuickToolCard from './QuickToolCard';

export default function QuickToolsPanel({
  brandName = 'NOVA MIND AI',
  onClose,
  onToolOpen,
  open,
  quickToolSections,
  selectedToolId,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 transition duration-300',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
        aria-label="Close Quick Tools panel"
      />

      <div className="absolute inset-0 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex min-h-full items-center justify-center">
          <GlassPanel
            className={clsx(
              'w-full max-w-[900px] rounded-[34px] border-white/70 bg-white/76 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.16)] transition duration-300 ease-out dark:bg-slate-950/62 dark:shadow-[0_36px_120px_rgba(2,6,23,0.48)] sm:p-6 lg:p-7',
              open ? 'translate-y-0 scale-100' : 'translate-y-4 scale-[0.98]'
            )}
            role="dialog"
            aria-modal="true"
            aria-label={`${brandName} Quick Tools`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/75 px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  {brandName}
                </div>
                <h2 className="mt-4 font-display text-[2rem] font-semibold tracking-[-0.06em] text-slate-950 dark:text-white sm:text-[2.4rem]">
                  Quick Tools Panel
                </h2>
                <p className="mt-3 text-[0.98rem] leading-7 text-slate-600 dark:text-slate-300">
                  Jump into the right workflow instantly with a clean, focused tool panel built for NOVA MIND AI.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/55 bg-white/75 text-slate-600 shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.10]"
                aria-label="Close Quick Tools panel"
              >
                <X className="h-[1.125rem] w-[1.125rem]" />
              </button>
            </div>

            <div className="mt-8 space-y-8">
              {quickToolSections.map((section) => (
                <section key={section.id} className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        {brandName}
                      </p>
                      <h3 className="mt-2 text-[1.15rem] font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                        {section.title}
                      </h3>
                    </div>
                    <p className="max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {section.description}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {section.tools.map((tool) => (
                      <QuickToolCard
                        key={tool.id}
                        isActive={selectedToolId === tool.id}
                        onClick={() => onToolOpen(tool.id)}
                        tool={tool}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
