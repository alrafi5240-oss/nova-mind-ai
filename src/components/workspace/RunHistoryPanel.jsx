import { Clock3, Cpu, Sparkles } from 'lucide-react';
import clsx from 'clsx';

const STATUS_STYLES = {
  completed: 'border-emerald-400/18 bg-emerald-400/10 text-emerald-100',
  failed: 'border-rose-400/18 bg-rose-400/10 text-rose-100',
  running: 'border-cyan-400/18 bg-cyan-400/10 text-cyan-100',
  planning: 'border-cyan-400/18 bg-cyan-400/10 text-cyan-100',
  queued: 'border-white/10 bg-white/10 text-slate-200',
};

export default function RunHistoryPanel({ runs = [], onSelectRun }) {
  return (
    <div className="workspace-panel rounded-[26px] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="ui-label">
            Task History
          </div>
          <div className="ui-heading mt-2">
            Recent agent runs
          </div>
          <p className="ui-copy mt-2">
            Every agent and super-agent task is tracked so you can inspect the latest execution flow quickly.
          </p>
        </div>

        <div className="workspace-card-icon">
          <Clock3 className="h-[18px] w-[18px]" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {runs.length ? (
          runs.map((run) => (
            <button
              key={run.id}
              type="button"
              onClick={() => onSelectRun?.(run)}
              className="status-tile premium-hover-card w-full rounded-[24px] border px-4 py-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-950 dark:text-slate-50">#{run.id}</span>
                    <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                      {run.mode === 'super_agent' ? 'Super Agent' : 'Agent'}
                    </span>
                  </div>
                  <div className="ui-copy mt-2.5">
                    {run.summary || run.goal}
                  </div>
                </div>

                <span
                  className={clsx(
                    'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
                    STATUS_STYLES[run.status] || STATUS_STYLES.queued
                  )}
                >
                  {run.status}
                </span>
              </div>

              <div className="ui-muted mt-3 flex flex-wrap items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em]">
                <span className="inline-flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" />
                  {run.changed_files_count || 0} file updates
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  {run.command_count || 0} commands
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.05] px-4 py-4 text-sm leading-7 text-slate-600 dark:text-white/60">
            No agent runs yet. Launch an Agent or Super Agent task and the execution history will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
