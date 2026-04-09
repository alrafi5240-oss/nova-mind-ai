import { motion } from 'framer-motion';
import GlassPanel from './GlassPanel';

const dots = [
  'bg-rose-300',
  'bg-sky-300',
  'bg-violet-300',
  'bg-fuchsia-200',
];

export default function ListeningDots({ isListening = true }) {
  return (
    <div className="relative w-full">
      <motion.div
        className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 blur-3xl dark:bg-fuchsia-500/12"
        animate={{ scale: isListening ? [0.96, 1.12, 0.96] : 1, opacity: isListening ? [0.55, 0.9, 0.55] : 0.4 }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <GlassPanel className="mx-auto flex h-[21rem] w-full items-center justify-center rounded-[40px] bg-white/24 dark:bg-white/[0.06]">
        <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-white/45 bg-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] dark:border-white/16 dark:bg-white/[0.05]">
          <motion.span
            className="absolute inset-2 rounded-full border border-white/35 dark:border-white/12"
            animate={{ scale: isListening ? [1, 1.04, 1] : 1 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            className="absolute inset-5 rounded-full border border-white/18 dark:border-white/10"
            animate={{ scale: isListening ? [1, 1.08, 1] : 1 }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.12 }}
          />
          <motion.span
            className="absolute -inset-3 rounded-full border border-white/18 dark:border-white/[0.08]"
            animate={{ scale: isListening ? [1, 1.06, 1] : 1, opacity: isListening ? [0.4, 0.7, 0.4] : 0.3 }}
            transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut', delay: 0.25 }}
          />
          <motion.span
            className="absolute -inset-7 rounded-full border border-white/10 dark:border-white/[0.05]"
            animate={{ scale: isListening ? [0.96, 1.04, 0.96] : 1, opacity: isListening ? [0.25, 0.55, 0.25] : 0.2 }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.45 }}
          />
          <motion.span
            className="absolute -inset-12 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.12),transparent_60%)] dark:bg-[radial-gradient(circle,rgba(168,85,247,0.18),transparent_60%)]"
            animate={{ scale: isListening ? [0.94, 1.08, 0.94] : 0.9, opacity: isListening ? [0.5, 1, 0.5] : 0 }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          />

          <div className="relative flex items-center gap-3">
            {dots.map((dotClass, index) => (
              <motion.span
                key={dotClass}
                className={`h-4 w-4 rounded-full shadow-[0_10px_26px_rgba(15,23,42,0.18)] ${dotClass}`}
                animate={
                  isListening
                    ? {
                        y: [0, index % 2 === 0 ? -14 : 14, 0],
                        scale: [1, 1.16, 1],
                      }
                    : { y: 0, scale: 1 }
                }
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.14,
                }}
              />
            ))}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
