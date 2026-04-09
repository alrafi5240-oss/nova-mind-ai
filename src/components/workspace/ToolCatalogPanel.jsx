import {
  Bot,
  Code2,
  FolderKanban,
  Globe2,
  TerminalSquare,
  Waypoints,
} from 'lucide-react';
import clsx from 'clsx';

const TOOL_ICONS = {
  chat_assistant: Bot,
  workspace_files: FolderKanban,
  code_editor: Code2,
  terminal_runner: TerminalSquare,
  web_search: Globe2,
  api_caller: Waypoints,
};

export default function ToolCatalogPanel({ tools = [] }) {
  return (
    <div className="workspace-panel rounded-[26px] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="ui-label">
            Tools System
          </div>
          <div className="ui-heading mt-2">
            Live operator capabilities
          </div>
          <p className="ui-copy mt-2">
            The workspace can reason, inspect files, edit code, run guarded commands, search the web, and query safe public APIs.
          </p>
        </div>

        <div className="workspace-card-icon">
          <Bot className="h-[18px] w-[18px]" />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {tools.map((tool) => {
          const Icon = TOOL_ICONS[tool.id] || Bot;

          return (
            <div
              key={tool.id}
              className="status-tile premium-hover-card rounded-[24px] border p-5"
            >
              <div className="flex items-start gap-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-slate-800 shadow-[0_8px_20px_rgba(99,102,241,0.08)] dark:text-cyan-100">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-950 dark:text-white">{tool.label}</div>
                    <span
                      className={clsx(
                        'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
                        tool.read_only
                          ? 'border-emerald-400/18 bg-emerald-400/10 text-emerald-100'
                          : 'border-cyan-400/18 bg-cyan-400/10 text-cyan-100'
                      )}
                    >
                      {tool.read_only ? 'Read only' : 'Execution'}
                    </span>
                  </div>
                  <p className="ui-copy mt-2.5">{tool.description}</p>
                  <div className="ui-label mt-3">
                    {tool.category}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
