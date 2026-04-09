import { Bot, FolderKanban, Wrench } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const ITEMS = [
  { id: 'workspace', label: 'Workspace', icon: FolderKanban },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'tools', label: 'Tools', icon: Wrench },
];

export default function MobileWorkspaceNav({ activePanel, onSelectPanel }) {
  return (
    <div className="border-t border-white/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 xl:hidden">
      <div className="composer-shell mx-auto grid max-w-[720px] grid-cols-3 gap-2 rounded-[28px] p-2.5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPanel(item.id)}
              className={clsx(
                'relative flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-[22px] px-3 py-2 text-center transition-all duration-300',
                isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-workspace-nav-pill"
                  className="absolute inset-0 rounded-[22px] bg-[linear-gradient(135deg,rgba(168,85,247,0.28),rgba(244,114,182,0.18),rgba(59,130,246,0.18))] shadow-[0_18px_40px_rgba(168,85,247,0.16),0_0_22px_rgba(244,114,182,0.1)]"
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                />
              )}

              <span
                className={clsx(
                  'relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300',
                  isActive
                    ? 'border-white/18 bg-white/12 text-white'
                    : 'border-white/10 bg-white/8 text-slate-700 dark:text-slate-200'
                )}
              >
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.16em]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
