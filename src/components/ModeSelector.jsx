import { Bot, Cpu, MessagesSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const ICONS = {
  chat: MessagesSquare,
  agent: Bot,
  super_agent: Cpu,
};

export default function ModeSelector({ options, value, onChange }) {
  const activeOption = options.find((option) => option.id === value) || options[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="ui-label">
          Workspace Mode
        </label>

        {(activeOption?.id === 'agent' || activeOption?.id === 'super_agent') && (
          <div className="agent-badge inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-50">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            {activeOption?.id === 'super_agent' ? 'Super Agent active' : 'Agent active'}
          </div>
        )}
      </div>

      <div className="mode-segment relative grid grid-cols-1 gap-2 rounded-[22px] p-1.5 md:grid-cols-3">
        {options.map((option) => {
          const Icon = ICONS[option.id] || MessagesSquare;
          const isActive = option.id === value;
          const isSuperOption = option.id === 'super_agent';
          const activeCardClass =
            option.id === 'chat'
              ? 'mode-card-chat-active'
              : option.id === 'agent'
                ? 'mode-card-agent-active'
                : 'mode-card-super-active super-agent-glow super-agent-pulse';
          const activeIconClass =
            option.id === 'chat'
              ? 'mode-option-icon-chat border-sky-300/24 bg-[linear-gradient(135deg,rgba(59,130,246,0.18),rgba(59,130,246,0.06))] text-sky-50'
              : option.id === 'agent'
                ? 'mode-option-icon-agent border-violet-300/24 bg-[linear-gradient(135deg,rgba(139,92,246,0.22),rgba(139,92,246,0.08))] text-violet-50'
                : 'mode-option-icon-super border-white/18 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] text-white';
          const activePillClass =
            option.id === 'chat'
              ? 'bg-[linear-gradient(135deg,rgba(59,130,246,0.34),rgba(96,165,250,0.24),rgba(255,255,255,0.05))] shadow-[0_16px_34px_rgba(59,130,246,0.18),0_0_24px_rgba(59,130,246,0.12)]'
              : option.id === 'agent'
                ? 'bg-[linear-gradient(135deg,rgba(139,92,246,0.36),rgba(167,139,250,0.22),rgba(255,255,255,0.04))] shadow-[0_16px_34px_rgba(139,92,246,0.18),0_0_24px_rgba(139,92,246,0.12)]'
                : 'bg-[linear-gradient(135deg,rgba(168,85,247,0.40),rgba(244,114,182,0.28),rgba(59,130,246,0.26))] shadow-[0_24px_48px_rgba(168,85,247,0.22),0_0_32px_rgba(244,114,182,0.18)]';

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={clsx(
                'mode-option-button interactive-ripple relative z-[1] flex min-h-[58px] items-center gap-3 rounded-[18px] px-4 py-3 text-left transition-all duration-300 hover:translate-x-1',
                isActive ? 'text-white' : 'text-slate-700 hover:text-slate-950 dark:text-slate-200/90 dark:hover:text-white',
                isActive && activeCardClass,
                isActive && !isSuperOption && 'workspace-card-soft'
              )}
            >
              {isActive && (
                <span className="absolute right-3 top-3 z-[2] rounded-full border border-white/18 bg-white/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/90">
                  Active
                </span>
              )}
              {isActive && (
                <motion.span
                  layoutId="workspace-mode-pill"
                  className={clsx(
                    'absolute inset-0 rounded-[18px]',
                    activePillClass
                  )}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                />
              )}

              <span
                className={clsx(
                  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300',
                  'mode-option-icon',
                  isActive
                    ? activeIconClass
                    : 'border-white/10 bg-white/10 text-slate-700 dark:bg-white/6 dark:text-slate-200'
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>

              <span className="relative min-w-0">
                <span className="block text-sm font-semibold tracking-[-0.02em]">{option.tabLabel || option.label}</span>
                <span className={clsx('mt-0.5 block text-xs leading-5', isActive ? 'text-white/78' : 'text-slate-600 dark:text-white/68')}>
                  {option.helper}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
