import { Activity, Bot, FolderKanban, Sparkles } from 'lucide-react';

const CARD_ICONS = {
  mode: Bot,
  workspace: FolderKanban,
  usage: Activity,
  tools: Sparkles,
};

function OverviewCard({ label, value, detail, icon }) {
  const Icon = CARD_ICONS[icon] || Sparkles;

  return (
    <div className="workspace-card status-tile premium-hover-card rounded-[24px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="ui-label">
            {label}
          </div>
          <div className="mt-3 text-2xl font-semibold leading-none tracking-[-0.045em] text-slate-950 dark:text-white">
            {value}
          </div>
          <p className="ui-copy mt-2.5">{detail}</p>
        </div>

        <div className="workspace-card-icon">
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceOverview({
  selectedFile,
  activeModeLabel,
  toolCount = 0,
  runCount = 0,
  usageCount = 0,
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <OverviewCard
        label="Active Layer"
        value={activeModeLabel}
        detail="Switch between direct chat, approval-first agent execution, and fully autonomous super-agent work."
        icon="mode"
      />
      <OverviewCard
        label="Focused Context"
        value={selectedFile?.name || 'Workspace root'}
        detail={selectedFile?.path || 'Pick a file to ground the current task in real project context.'}
        icon="workspace"
      />
      <OverviewCard
        label="Usage Today"
        value={`${usageCount}`}
        detail={`${runCount} tracked operator runs are available in the current workspace session.`}
        icon="usage"
      />
      <OverviewCard
        label="Tool Surface"
        value={String(toolCount).padStart(2, '0')}
        detail="Workspace tools include file access, code editing, command execution, web research, and API reads."
        icon="tools"
      />
    </div>
  );
}
