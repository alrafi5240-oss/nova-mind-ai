import { motion } from 'framer-motion';

const blobs = [
  {
    className:
      '-left-20 top-8 h-56 w-56 bg-[radial-gradient(circle,rgba(250,180,214,0.82),rgba(250,180,214,0.1)_68%,transparent_72%)] dark:bg-[radial-gradient(circle,rgba(236,72,153,0.28),rgba(236,72,153,0.05)_68%,transparent_72%)]',
    animate: { x: [0, 22, 0], y: [0, -18, 0], scale: [1, 1.08, 1] },
    duration: 16,
  },
  {
    className:
      'right-[-4.5rem] top-24 h-64 w-64 bg-[radial-gradient(circle,rgba(165,214,255,0.86),rgba(165,214,255,0.1)_68%,transparent_72%)] dark:bg-[radial-gradient(circle,rgba(96,165,250,0.3),rgba(96,165,250,0.06)_68%,transparent_72%)]',
    animate: { x: [0, -16, 0], y: [0, 20, 0], scale: [1, 1.12, 1] },
    duration: 18,
  },
  {
    className:
      'bottom-20 left-6 h-60 w-60 bg-[radial-gradient(circle,rgba(207,196,255,0.82),rgba(207,196,255,0.08)_68%,transparent_72%)] dark:bg-[radial-gradient(circle,rgba(168,85,247,0.28),rgba(168,85,247,0.06)_68%,transparent_72%)]',
    animate: { x: [0, 18, 0], y: [0, -10, 0], scale: [1, 1.09, 1] },
    duration: 20,
  },
];

export default function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.55),transparent_28%),radial-gradient(circle_at_75%_12%,rgba(255,255,255,0.28),transparent_22%),linear-gradient(145deg,rgba(255,245,251,0.95)_0%,rgba(240,247,255,0.97)_44%,rgba(244,240,255,0.96)_100%)] dark:bg-[linear-gradient(160deg,#0e1021_0%,#13172f_34%,#181a37_68%,#151325_100%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.42),transparent_18%),radial-gradient(circle_at_84%_14%,rgba(255,255,255,0.18),transparent_18%),radial-gradient(circle_at_80%_78%,rgba(255,255,255,0.22),transparent_22%)] opacity-75 dark:opacity-40" />

      {blobs.map((blob) => (
        <motion.div
          key={blob.className}
          className={`absolute rounded-full blur-3xl ${blob.className}`}
          animate={blob.animate}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="absolute inset-0 backdrop-blur-[16px]" />
    </div>
  );
}
