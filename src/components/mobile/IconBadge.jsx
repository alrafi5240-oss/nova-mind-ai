import clsx from 'clsx';

export default function IconBadge({ icon: Icon, accent, className = '' }) {
  return (
    <div
      className={clsx(
        'flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/45 bg-white/44 shadow-[0_16px_40px_rgba(255,255,255,0.24)] backdrop-blur-lg dark:border-white/14 dark:bg-white/[0.09] dark:shadow-[0_20px_44px_rgba(2,6,23,0.35)]',
        className
      )}
    >
      <div
        className={clsx(
          'flex h-11 w-11 items-center justify-center rounded-[18px] bg-gradient-to-br shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]',
          accent
        )}
      >
        <Icon className="h-5 w-5 text-slate-950" />
      </div>
    </div>
  );
}
