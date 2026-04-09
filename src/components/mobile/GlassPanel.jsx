import clsx from 'clsx';

export default function GlassPanel({
  as: Component = 'div',
  children,
  className = '',
  hoverable = false,
  innerClassName = '',
  ...props
}) {
  return (
    <Component
      className={clsx(
        'relative overflow-hidden rounded-[28px] border border-white/40 bg-white/30 shadow-[0_24px_80px_rgba(71,85,105,0.14)] backdrop-blur-[16px] transition-all duration-300 dark:border-white/14 dark:bg-white/[0.08] dark:shadow-[0_30px_90px_rgba(2,6,23,0.5)]',
        hoverable && [
          'group',
          'hover:border-white/55 dark:hover:border-white/18',
          'hover:shadow-[0_28px_80px_rgba(71,85,105,0.18)] dark:hover:shadow-[0_32px_90px_rgba(2,6,23,0.55)]',
        ],
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[1px] rounded-[inherit] bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0.12))] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.55),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(196,181,253,0.22),transparent_30%)] opacity-80 dark:opacity-55"
      />
      {hoverable && (
        <span
          aria-hidden="true"
          className="shimmer-surface pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
      <div className={clsx('relative z-10', innerClassName)}>{children}</div>
    </Component>
  );
}
