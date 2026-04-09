import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import GlassPanel from './GlassPanel';
import IconBadge from './IconBadge';

export default function ToolRow({ active = false, onClick, tool }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.978 }}
      animate="rest"
      variants={{
        rest: { y: 0, scale: 1 },
        hover: { y: -3, scale: 1.01 },
      }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      className="w-full text-left"
    >
      <GlassPanel
        hoverable
        className={clsx(
          'rounded-[28px] transition-all duration-300',
          active
            ? 'border-white/70 bg-white/42 shadow-[0_0_0_2px_rgba(168,85,247,0.35),0_24px_80px_rgba(71,85,105,0.14)] dark:border-violet-300/36 dark:bg-white/[0.11] dark:shadow-[0_0_0_2px_rgba(167,139,250,0.3),0_30px_90px_rgba(2,6,23,0.5)]'
            : 'hover:bg-white/36 dark:hover:bg-white/[0.10]'
        )}
        innerClassName="flex items-center gap-4 p-4"
      >
        <motion.div
          variants={{
            rest: { scale: 1 },
            hover: { scale: 1.1 },
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <IconBadge icon={tool.icon} accent={tool.accent} />
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
              {tool.label}
            </h3>
            {active ? (
              <span className="rounded-full bg-white/55 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-slate-700 dark:bg-white/[0.08] dark:text-white/60">
                Ready
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-700/76 dark:text-white/58">
            {tool.description}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 self-stretch">
          <span className="rounded-full bg-white/40 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-white/[0.08] dark:text-white/45">
            {tool.category}
          </span>
          <motion.span
            className="mt-auto"
            variants={{
              rest: { x: 0, opacity: 0.72 },
              hover: { x: 4, opacity: 1 },
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <ChevronRight className="h-5 w-5 text-slate-700/72 dark:text-white/54" />
          </motion.span>
        </div>
      </GlassPanel>
    </motion.button>
  );
}
