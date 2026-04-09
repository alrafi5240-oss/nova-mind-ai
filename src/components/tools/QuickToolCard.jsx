import clsx from 'clsx';
import { ArrowUpRight } from 'lucide-react';
import GlassPanel from '../layout/GlassPanel';

export default function QuickToolCard({ isActive = false, onClick, tool }) {
  return (
    <button type="button" onClick={onClick} className="group text-left">
      <GlassPanel
        className={clsx(
          'h-full rounded-[28px] p-5 transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:bg-white/84 hover:shadow-[0_24px_56px_rgba(15,23,42,0.12)] dark:hover:bg-white/[0.09] dark:hover:shadow-[0_24px_56px_rgba(2,6,23,0.28)]',
          isActive &&
            'border-violet-200/80 bg-white/88 shadow-[0_18px_44px_rgba(139,92,246,0.16)] ring-1 ring-violet-300/40 dark:border-violet-400/20 dark:bg-white/[0.09] dark:shadow-[0_18px_44px_rgba(76,29,149,0.24)]'
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <span className={clsx('flex h-12 w-12 items-center justify-center rounded-[18px]', tool.accent)}>
            <tool.icon className="h-5 w-5" />
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/55 bg-white/75 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500 transition duration-300 group-hover:border-violet-200/80 group-hover:text-violet-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:group-hover:border-violet-400/20 dark:group-hover:text-violet-200">
            Open
            <ArrowUpRight className="h-3.5 w-3.5 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>

        <div className="mt-5">
          <h3 className="text-[1rem] font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
            {tool.label}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{tool.description}</p>
        </div>
      </GlassPanel>
    </button>
  );
}
