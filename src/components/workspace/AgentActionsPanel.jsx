import { AlertTriangle, CheckCircle2, Loader2, Sparkles, TerminalSquare } from 'lucide-react';
import clsx from 'clsx';

const STATUS_LABELS = {
  idle: 'Agent ready',
  queued: 'Queued',
  planning: 'Planning',
  running: 'Executing',
  completed: 'Completed',
  failed: 'Needs attention',
};

const KIND_LABELS = {
  thinking: 'Thinking',
  execution: 'Execution',
  validation: 'Validation',
  improvement: 'Improve',
  read_file: 'Read',
  write_file: 'Edit',
  run_command: 'Command',
  web_search: 'Search',
  call_api: 'API',
};

const KIND_TONES = {
  thinking: 'border-sky-400/20 bg-sky-400/10 text-sky-100',
  execution: 'border-violet-400/20 bg-violet-400/10 text-violet-100',
  validation: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
  improvement: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
  read_file: 'border-slate-400/20 bg-slate-400/10 text-slate-100',
  write_file: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100',
  run_command: 'border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100',
  web_search: 'border-indigo-400/20 bg-indigo-400/10 text-indigo-100',
  call_api: 'border-teal-400/20 bg-teal-400/10 text-teal-100',
};

const parseStructuredDetail = (detail = '') => {
  const lines = String(detail)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const structured = {
    doing: '',
    why: '',
    note: [],
  };

  lines.forEach((line) => {
    const lowered = line.toLowerCase();
    if (lowered.startsWith('doing:')) {
      structured.doing = line.slice(6).trim();
      return;
    }
    if (lowered.startsWith('why:')) {
      structured.why = line.slice(4).trim();
      return;
    }
    structured.note.push(line);
  });

  return structured;
};

export default function AgentActionsPanel({
  mode,
  actions = [],
  isStreaming = false,
  runStatus = 'idle',
  runSummary = '',
  runGoal = '',
  currentRunId = null,
}) {
  const isAgentMode = mode === 'agent' || mode === 'super_agent';
  const isSuperAgentMode = mode === 'super_agent';
  const statusLabel = STATUS_LABELS[runStatus] || STATUS_LABELS.idle;
  const statusTone =
    runStatus === 'failed'
      ? 'text-rose-100 border-rose-400/20 bg-rose-400/10'
      : runStatus === 'completed'
        ? 'text-emerald-100 border-emerald-400/20 bg-emerald-400/10'
        : 'text-cyan-50 border-cyan-400/20 bg-cyan-400/10';

  return (
    <div className={clsx('workspace-panel rounded-[26px] p-4 sm:p-5', isAgentMode ? 'agent-panel-active' : '')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="ui-label">
            Agent Thinking Log
          </div>
          <div className="ui-heading mt-2">
            {isStreaming || runStatus === 'running' || runStatus === 'planning'
              ? isSuperAgentMode
                ? 'Super Agent executing…'
                : 'Agent thinking…'
              : isAgentMode
                ? statusLabel
                : 'Agent ready'}
          </div>
          <p className="ui-copy mt-2">
            {runSummary
              ? runSummary
              : isAgentMode
                ? isSuperAgentMode
                  ? 'Super Agent is driving the task end to end with full autonomy, smart safeguards, and automatic recovery when safe.'
                  : 'Agent is sequencing context, files, and execution steps while holding critical actions behind approval.'
                : 'Switch to Agent Mode for multi-step actions, structured execution, and live progress.'}
          </p>
        </div>

        <div className="workspace-card-icon">
          <Sparkles className="h-[18px] w-[18px]" />
        </div>
      </div>

      {(currentRunId || runGoal) && (
        <div className="mt-4 space-y-2 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-xs leading-6 text-slate-600 dark:text-white/60">
          {currentRunId && (
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium uppercase tracking-[0.18em]">Run</span>
              <span className="command-chip">#{currentRunId}</span>
            </div>
          )}
          {runGoal && <p className="text-[13px] leading-6 text-slate-600 dark:text-slate-300">{runGoal}</p>}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {actions.length ? (
          actions.map((action, index) => {
            const structuredDetail = parseStructuredDetail(action.detail);
            const kindLabel = KIND_LABELS[action.kind] || 'Step';
            const kindTone = KIND_TONES[action.kind] || 'border-white/10 bg-white/5 text-slate-200';
            const isPhaseStep = ['thinking', 'execution', 'validation', 'improvement'].includes(action.kind);

            return (
              <div
                key={`${action.label}-${index}`}
                className={clsx('agent-step', isPhaseStep && 'border-white/15 bg-white/[0.065] shadow-[0_18px_48px_rgba(15,23,42,0.12)]')}
              >
                <div
                  className={clsx(
                    'agent-step-icon',
                    action.state === 'done' && 'agent-step-done',
                    action.state === 'active' && 'agent-step-active',
                    action.state === 'failed' && 'border-rose-400/30 bg-rose-500/15 text-rose-100'
                  )}
                >
                  {action.state === 'active' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : action.state === 'done' ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : action.state === 'failed' ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-white/50" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{action.label}</div>
                    <span className={clsx('inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', kindTone)}>
                      {kindLabel}
                    </span>
                    {action.command && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        <TerminalSquare className="h-3 w-3" />
                        command
                      </span>
                    )}
                  </div>
                  {(structuredDetail.doing || structuredDetail.why || structuredDetail.note.length) && (
                    <div className="mt-2 space-y-2">
                      {structuredDetail.doing && (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs leading-5 text-slate-700 dark:text-white/76">
                          <span className="ui-label mr-2 text-[10px] tracking-[0.14em]">
                            Doing
                          </span>
                          {structuredDetail.doing}
                        </div>
                      )}
                      {structuredDetail.why && (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs leading-5 text-slate-700 dark:text-white/76">
                          <span className="ui-label mr-2 text-[10px] tracking-[0.14em]">
                            Why
                          </span>
                          {structuredDetail.why}
                        </div>
                      )}
                      {structuredDetail.note.length > 0 && (
                        <div className="ui-muted text-xs leading-5">
                          {structuredDetail.note.join(' ')}
                        </div>
                      )}
                    </div>
                  )}
                  {action.command && (
                    <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 font-mono text-[11px] text-cyan-100/90">
                      {action.command}
                    </div>
                  )}
                  {action.output && (
                    <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
                      <div className="border-b border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                        Result
                      </div>
                      <pre className="overflow-x-auto px-3 py-3 font-mono text-[11px] leading-5 text-slate-200">
                        {action.output}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[20px] border border-dashed border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-600 dark:text-white/60">
            No agent actions yet. Trigger an `/agent` request or switch into Agent Mode to start a structured task flow.
          </div>
        )}
      </div>

      {(isStreaming || currentRunId) && (
        <div className={clsx('mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium', statusTone)}>
          <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.5)]" />
          {statusLabel}
        </div>
      )}
    </div>
  );
}
