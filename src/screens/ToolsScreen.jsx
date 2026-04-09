import { motion } from 'framer-motion';
import GlassPanel from '../components/mobile/GlassPanel';
import ToolRow from '../components/mobile/ToolRow';

export default function ToolsScreen({
  filteredTools,
  onToolSelect,
  query,
  selectedToolId,
  setQuery,
}) {
  return (
    <div className="flex h-full flex-col gap-6 pb-4">
      <section className="space-y-2 px-1">
        <p className="text-sm font-medium text-slate-700/68 dark:text-white/56">Tools Screen</p>
        <h2 className="font-display text-[2.15rem] font-semibold leading-[1.04] tracking-[-0.06em] text-slate-950 dark:text-white">
          Premium tools, one calm surface.
        </h2>
        <p className="max-w-[20rem] text-[0.95rem] leading-7 text-slate-700/76 dark:text-white/58">
          Keep every capability easy to scan, tap, and launch without breaking the visual flow.
        </p>
      </section>

      {query ? (
        <GlassPanel className="rounded-[28px]" innerClassName="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-white/50">
              Active search
            </p>
            <p className="mt-1 text-sm text-slate-800 dark:text-white/72">
              Showing tools related to “{query}”.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setQuery('')}
            className="rounded-full bg-white/48 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white/62 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
          >
            Clear
          </button>
        </GlassPanel>
      ) : null}

      <div className="space-y-3">
        {filteredTools.length ? (
          filteredTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.05 }}
            >
              <ToolRow
                active={selectedToolId === tool.id}
                onClick={() => onToolSelect(tool.id)}
                tool={tool}
              />
            </motion.div>
          ))
        ) : (
          <GlassPanel className="rounded-[30px]" innerClassName="p-6">
            <p className="text-sm leading-7 text-slate-700/76 dark:text-white/58">
              Nothing matched that search. Try “chat”, “image”, or “pdf” to quickly narrow the list.
            </p>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
