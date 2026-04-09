import { ArrowUpRight, Sparkles } from 'lucide-react';

export default function GrowthStatCard({ label, value, detail, icon: Icon = Sparkles, cta }) {
  return (
    <div className="workspace-card rounded-[24px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            {label}
          </div>
          <div className="mt-3 text-[28px] font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
            {value}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{detail}</p>
        </div>

        <div className="workspace-card-icon">
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>

      {cta && (
        <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-200">
          {cta}
          <ArrowUpRight className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
