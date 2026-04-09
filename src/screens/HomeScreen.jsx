import { ArrowUpRight, MessageSquareText, Mic, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassPanel from '../components/mobile/GlassPanel';
import IconBadge from '../components/mobile/IconBadge';
import SearchBar from '../components/mobile/SearchBar';
import ToolRow from '../components/mobile/ToolRow';

const sectionVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

export default function HomeScreen({
  onOpenVoice,
  onSearchChange,
  onToolSelect,
  query,
  recentTools,
  selectedTool,
  selectedToolId,
}) {
  return (
    <div className="flex h-full flex-col gap-6 pb-4">
      <section className="space-y-3">
        <div className="px-1">
          <p className="text-sm font-medium text-slate-700/68 dark:text-white/56">Home Screen</p>
          <h2 className="mt-2 font-display text-[2.25rem] font-semibold leading-[1.02] tracking-[-0.06em] text-slate-950 dark:text-white">
            Start with a softer, smarter flow.
          </h2>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_4.25rem] gap-3">
          <SearchBar query={query} onChange={onSearchChange} />

          <motion.button
            type="button"
            onClick={onOpenVoice}
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -2 }}
            className="relative flex items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,rgba(244,114,182,0.9),rgba(129,140,248,0.92),rgba(56,189,248,0.88))] text-white shadow-[0_18px_44px_rgba(168,85,247,0.28)]"
            aria-label="Open voice assistant"
          >
            <span className="absolute inset-0 rounded-[28px] bg-white/18" />
            <span className="absolute inset-[-6px] rounded-[34px] bg-fuchsia-300/28 blur-xl dark:bg-fuchsia-500/24" />
            <Mic className="relative z-10 h-6 w-6" />
          </motion.button>
        </div>
      </section>

      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <GlassPanel className="rounded-[34px]" hoverable>
          <div className="relative overflow-hidden p-5">
            <motion.div
              className="absolute inset-x-8 top-0 h-20 rounded-full bg-fuchsia-200/45 blur-3xl dark:bg-fuchsia-500/18"
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/40 bg-white/36 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-700 dark:border-white/16 dark:bg-white/[0.07] dark:text-white/62">
                  <Sparkles className="relative z-10 h-3.5 w-3.5" />
                  <span className="relative z-10">Featured workspace</span>
                  <span
                    aria-hidden="true"
                    className="shimmer-surface pointer-events-none absolute inset-0 rounded-[inherit] opacity-50"
                  />
                </div>

                <h3 className="mt-4 font-display text-[2rem] font-semibold tracking-[-0.06em] text-slate-950 dark:text-white">
                  Chat Assistant
                </h3>
                <p className="mt-3 max-w-[18rem] text-[0.95rem] leading-7 text-slate-700/78 dark:text-white/62">
                  Ask questions, draft ideas, and move through tasks with a voice-first assistant that feels effortless.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {['Voice-ready', 'Fast context', 'Glass UI'].map((chip) => (
                    <motion.span
                      key={chip}
                      whileHover={{ y: -2, scale: 1.04 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                      className="cursor-default select-none rounded-full border border-white/38 bg-white/38 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:border-white/16 dark:bg-white/[0.07] dark:text-white/55"
                    >
                      {chip}
                    </motion.span>
                  ))}
                </div>
              </div>

              <IconBadge
                icon={MessageSquareText}
                accent="from-pink-300/80 via-violet-200/70 to-sky-300/80"
                className="mt-1"
              />
            </div>

            <motion.button
              type="button"
              onClick={() => onToolSelect('chat-assistant')}
              initial="rest"
              whileHover="hover"
              whileTap={{ scale: 0.96 }}
              variants={{ rest: { y: 0 }, hover: { y: -2 } }}
              transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              className="btn-launch mt-6"
            >
              Launch Chat Assistant
              <motion.span
                variants={{
                  rest: { x: 0, y: 0 },
                  hover: { x: 2, y: -2 },
                }}
                transition={{ duration: 0.2 }}
              >
                <ArrowUpRight className="h-4 w-4" />
              </motion.span>
            </motion.button>

            {selectedToolId !== 'chat-assistant' ? (
              <p className="mt-4 text-sm text-slate-700/70 dark:text-white/50">
                Current tool focus: <span className="font-semibold">{selectedTool.label}</span>
              </p>
            ) : null}
          </div>
        </GlassPanel>
      </motion.div>

      <motion.section
        className="space-y-3"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-sm font-medium text-slate-700/68 dark:text-white/56">
              Recently Used Tools
            </p>
            <p className="mt-1 text-sm text-slate-700/60 dark:text-white/44">
              Jump back into your most natural workflows.
            </p>
          </div>

          <span className="rounded-full bg-white/34 px-3 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:bg-white/[0.07] dark:text-white/54">
            {recentTools.length} tools
          </span>
        </div>

        <div className="space-y-3">
          {recentTools.length ? (
            recentTools.map((tool) => (
              <motion.div key={tool.id} variants={itemVariants}>
                <ToolRow
                  active={selectedToolId === tool.id}
                  onClick={() => onToolSelect(tool.id)}
                  tool={tool}
                />
              </motion.div>
            ))
          ) : (
            <GlassPanel className="rounded-[28px]" innerClassName="p-5">
              <p className="text-sm leading-7 text-slate-700/76 dark:text-white/58">
                No recent tools match your search right now. Try a broader keyword to bring more options back in.
              </p>
            </GlassPanel>
          )}
        </div>
      </motion.section>
    </div>
  );
}
