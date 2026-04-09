import { Loader2, Play, TerminalSquare } from 'lucide-react';

export default function TerminalControlPanel({
  command = '',
  onCommandChange,
  onRunCommand,
  isRunning = false,
  result = null,
}) {
  return (
    <div className="workspace-panel rounded-[26px] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Terminal Control
          </div>
          <div className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
            Safe workspace commands
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Run guarded engineering commands and inspect the output without leaving the workspace.
          </p>
        </div>

        <div className="workspace-card-icon">
          <TerminalSquare className="h-[18px] w-[18px]" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="file-editor-shell">
          <div className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Command
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={command}
              onChange={(event) => onCommandChange(event.target.value)}
              className="w-full rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400/40 focus:ring-4 focus:ring-cyan-400/10 dark:bg-white/5 dark:text-slate-100"
              placeholder="npm run build"
            />
            <button
              type="button"
              onClick={onRunCommand}
              disabled={isRunning || !command.trim()}
              className="rail-action-button rail-action-primary shrink-0 justify-center"
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isRunning ? 'Running…' : 'Run'}
            </button>
          </div>
        </div>

        {result && (
          <div className="space-y-3 rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    result.success ? 'bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.45)]' : 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.45)]'
                  }`}
                />
                {result.success ? 'Completed' : 'Failed'}
              </div>
              <div className="command-chip">
                {result.cwd}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 font-mono text-[11px] text-cyan-100/90">
              {result.command}
            </div>

            <pre className="max-h-56 overflow-auto rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 font-mono text-[11px] leading-5 text-slate-200">
              {result.combined_output || result.stderr || result.stdout || 'Command completed with no output.'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
