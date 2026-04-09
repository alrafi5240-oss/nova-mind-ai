import { Bot, Cpu, FolderKanban, MonitorSmartphone, Sparkles, Waypoints } from 'lucide-react';
import clsx from 'clsx';

function StatusTile({ label, value, detail, icon: Icon }) {
  return (
    <div className="status-tile premium-hover-card rounded-[24px] border px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="ui-label">
            {label}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{value}</div>
          <p className="ui-copy mt-2 text-xs leading-6">{detail}</p>
        </div>

        <div className="workspace-card-icon h-10 w-10 rounded-2xl">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export default function SystemStatusPanel({
  activeMode = 'chat',
  activeModeLabel = 'Chat Assistant',
  workspaceRoot = '',
  aiRuntime,
  tools = [],
  platformShell = 'Web workspace',
  platformDetail = 'Runs from a browser with installable app support.',
}) {
  const liveCapabilities = tools.slice(0, 6);
  const modeValue =
    activeMode === 'super_agent'
      ? '⚡ Super Agent'
      : activeMode === 'agent'
        ? 'Agent'
        : 'Chat Assistant';

  return (
    <div className={clsx('workspace-panel rounded-[26px] p-4 sm:p-5', activeMode === 'super_agent' ? 'super-agent-glow' : 'workspace-card-soft')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="ui-label">
            System Info
          </div>
          <div className="ui-heading mt-2">
            Live workspace status
          </div>
          <p className="ui-copy mt-2">
            Monitor the current runtime, active model, workspace path, and the operator surface available in NOVA MIND AI.
          </p>
        </div>

        <div className="workspace-card-icon">
          {activeMode === 'super_agent' ? <Cpu className="h-[18px] w-[18px]" /> : <Bot className="h-[18px] w-[18px]" />}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <StatusTile
          label="Chat live"
          value={modeValue}
          detail={`${activeModeLabel} is currently active in the workspace.`}
          icon={Bot}
        />
        <StatusTile
          label="Platform shell"
          value={platformShell}
          detail={platformDetail}
          icon={MonitorSmartphone}
        />
        <StatusTile
          label="Workspace path"
          value={workspaceRoot || 'Loading workspace…'}
          detail="The operator uses this project root for file context and guarded execution."
          icon={FolderKanban}
        />
        <StatusTile
          label="Model active"
          value={aiRuntime?.aiEnabled ? aiRuntime?.model || 'gpt-4o-mini' : 'Demo Mode'}
          detail={
            aiRuntime?.aiEnabled
              ? 'Real OpenAI responses are enabled for the current workspace session.'
              : 'No backend API key is active, so the chat layer is running in demo mode.'
          }
          icon={Sparkles}
        />
        <StatusTile
          label="Live operator capabilities"
          value={`${tools.length} enabled`}
          detail="Files, commands, web research, and execution surfaces are available to agents based on mode."
          icon={Waypoints}
        />
      </div>

      <div className="status-tile glass-section-divider mt-5 rounded-[24px] border p-4">
        <div className="ui-label">
          Capability Surface
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {liveCapabilities.length ? (
            liveCapabilities.map((tool) => (
              <span
                key={tool.id}
                className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-800 dark:text-slate-100"
              >
                {tool.label}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-600 dark:text-slate-400">Loading capabilities…</span>
          )}
        </div>
      </div>
    </div>
  );
}
