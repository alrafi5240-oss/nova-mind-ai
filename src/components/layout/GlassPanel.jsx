import clsx from 'clsx';

export default function GlassPanel({
  as: Component = 'div',
  children,
  className = '',
  innerClassName = '',
  hoverable = false,
  ...props
}) {
  return (
    <Component
      className={clsx(
        'relative overflow-hidden rounded-2xl border border-white/55 bg-[linear-gradient(145deg,rgba(255,255,255,0.56),rgba(255,255,255,0.30)_58%,rgba(255,255,255,0.18))] shadow-[0_32px_84px_rgba(168,85,247,0.14),0_14px_36px_rgba(255,255,255,0.18)] backdrop-blur-[16px] dark:border-white/12 dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.12),rgba(30,41,59,0.14)_58%,rgba(2,6,23,0.34))] dark:shadow-[0_36px_96px_rgba(2,6,23,0.46),0_0_28px_rgba(168,85,247,0.12)]',
        hoverable && 'transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_40px_104px_rgba(168,85,247,0.18),0_16px_42px_rgba(255,255,255,0.20)] dark:hover:shadow-[0_40px_108px_rgba(2,6,23,0.52),0_0_34px_rgba(168,85,247,0.16)]',
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.40),rgba(255,255,255,0.08)_42%,transparent_70%)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02)_42%,transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(192,132,252,0.16),transparent_34%),radial-gradient(circle_at_84%_16%,rgba(244,114,182,0.12),transparent_28%),radial-gradient(circle_at_78%_82%,rgba(96,165,250,0.10),transparent_28%)] dark:bg-[radial-gradient(circle_at_14%_18%,rgba(192,132,252,0.12),transparent_34%),radial-gradient(circle_at_84%_16%,rgba(244,114,182,0.10),transparent_28%),radial-gradient(circle_at_78%_82%,rgba(96,165,250,0.10),transparent_28%)]" />
      <div className={clsx('relative z-10', innerClassName)}>{children}</div>
    </Component>
  );
}
