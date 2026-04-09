import { motion } from 'framer-motion';
import { Home, LayoutGrid, Mic } from 'lucide-react';
import clsx from 'clsx';
import GlassPanel from './GlassPanel';

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'voice', label: 'Voice', icon: Mic },
  { id: 'tools', label: 'Tools', icon: LayoutGrid },
];

export default function BottomNavigation({ activeScreen, onChange }) {
  return (
    <GlassPanel className="rounded-[32px] px-2 py-2.5">
      <nav className="grid grid-cols-3 gap-1" aria-label="Primary">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeScreen === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={clsx(
                'relative flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-[24px] px-3 py-2 text-xs font-medium transition-colors duration-300',
                isActive ? 'text-slate-950 dark:text-white' : 'text-slate-700/72 dark:text-white/56'
              )}
            >
              {tab.id === 'voice' && isActive && (
                <motion.span
                  className="absolute inset-0 rounded-[24px] bg-fuchsia-400/18 dark:bg-fuchsia-500/14"
                  animate={{ scale: [1, 1.06, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {isActive ? (
                <motion.span
                  layoutId="bottom-nav-pill"
                  className="absolute inset-0 rounded-[24px] border border-white/50 bg-[linear-gradient(135deg,rgba(244,114,182,0.22),rgba(129,140,248,0.24),rgba(56,189,248,0.2))] shadow-[0_14px_38px_rgba(168,85,247,0.18),inset_0_1px_0_rgba(255,255,255,0.55)] dark:border-white/[0.12] dark:bg-[linear-gradient(135deg,rgba(244,114,182,0.12),rgba(129,140,248,0.14),rgba(56,189,248,0.10))] dark:shadow-[0_18px_42px_rgba(2,6,23,0.34),inset_0_1px_0_rgba(255,255,255,0.08)]"
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                />
              ) : null}

              <motion.span
                className={clsx(
                  'relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/30 dark:bg-white/[0.06]'
                )}
                animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <Icon
                  className={clsx(
                    'h-[1.125rem] w-[1.125rem]',
                    isActive ? 'text-violet-600 dark:text-violet-300' : ''
                  )}
                />
              </motion.span>
              <span className="relative z-10 tracking-[0.01em]">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </GlassPanel>
  );
}
