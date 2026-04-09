import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import GlassPanel from '../components/mobile/GlassPanel';
import ListeningDots from '../components/mobile/ListeningDots';

export default function VoiceAssistantScreen({ isListening, onListeningToggle }) {
  return (
    <div className="flex h-full min-h-[70vh] flex-col gap-6 pb-4">
      <section className="space-y-2 px-1">
        <p className="text-sm font-medium text-slate-700/68 dark:text-white/56">
          Voice Assistant Screen
        </p>
        <h2 className="font-display text-[2.15rem] font-semibold leading-[1.04] tracking-[-0.06em] text-slate-950 dark:text-white">
          Voice-first, gentle, and always ready.
        </h2>
        <p className="max-w-[20rem] text-[0.95rem] leading-7 text-slate-700/76 dark:text-white/58">
          Speak naturally and let the assistant capture intent with a smooth, distraction-free listening state.
        </p>
      </section>

      <div className="flex flex-1 flex-col justify-center gap-6">
        <ListeningDots isListening={isListening} />

        <GlassPanel className="rounded-[30px]" innerClassName="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-white/50">
              Live mode
            </p>
            <p className="mt-1 text-sm text-slate-800 dark:text-white/72">
              {isListening ? 'Listening for your next command…' : 'Paused. Tap the mic to resume.'}
            </p>
          </div>

          <motion.span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/40 dark:bg-white/[0.08]"
            animate={isListening ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Volume2 className="h-5 w-5 text-slate-800 dark:text-white/72" />
          </motion.span>
        </GlassPanel>
      </div>

      <div className="pt-2">
        <motion.button
          type="button"
          onClick={onListeningToggle}
          initial="rest"
          whileHover={{ y: -2 }}
          whileTap="pressed"
          animate={
            isListening
              ? {
                  boxShadow: [
                    '0 24px 54px rgba(168,85,247,0.28)',
                    '0 24px 62px rgba(236,72,153,0.36)',
                    '0 24px 54px rgba(168,85,247,0.28)',
                  ],
                }
              : {
                  boxShadow: '0 18px 40px rgba(168,85,247,0.18)',
                }
          }
          transition={
            isListening
              ? { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
          className="relative flex w-full items-center justify-center gap-3 rounded-[32px] bg-[linear-gradient(135deg,rgba(244,114,182,0.92),rgba(167,139,250,0.92),rgba(56,189,248,0.88))] px-6 py-5 text-base font-semibold text-white"
        >
          <span className="absolute inset-0 rounded-[32px] bg-white/14" />
          <span className="absolute inset-[-10px] rounded-[40px] bg-fuchsia-300/26 blur-2xl dark:bg-fuchsia-500/22" />
          <motion.span
            className="relative z-10"
            variants={{
              rest: { rotate: 0, scale: 1 },
              pressed: { rotate: [-12, 8, 0], scale: [1.15, 0.95, 1] },
            }}
            transition={{ duration: 0.38 }}
          >
            {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </motion.span>
          <span className="relative z-10">
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
