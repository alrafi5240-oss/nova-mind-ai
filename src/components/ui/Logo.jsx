import { useState } from 'react';
import clsx from 'clsx';

export default function Logo({
  size = 'md',
  showText = true,
  tone = 'dark',
  responsiveText = false,
  className = '',
}) {
  const [logoSrc, setLogoSrc] = useState('/logo.svg');

  const badgeSize = {
    nav: 'h-8 w-8 rounded-[12px]',
    sm: 'h-9 w-9 rounded-[14px]',
    md: 'h-10 w-10 rounded-[16px]',
    lg: 'h-12 w-12 rounded-[18px]',
    hero: 'h-24 w-24 rounded-[30px] sm:h-28 sm:w-28',
  };

  const imagePadding = {
    nav: 'p-[5px]',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    hero: 'p-4 sm:p-5',
  };

  const titleSize = {
    nav: 'text-[14px]',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    hero: 'text-[28px] sm:text-[34px]',
  };

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div className="group/logo relative isolate shrink-0">
        <span
          className={clsx(
            'pointer-events-none absolute inset-[-18%] rounded-[36%] blur-2xl transition-opacity duration-300 group-hover/logo:opacity-100',
            tone === 'light'
              ? 'bg-[radial-gradient(circle,rgba(56,189,248,0.24)_0%,rgba(168,85,247,0.16)_46%,transparent_76%)] opacity-80'
              : 'bg-[radial-gradient(circle,rgba(37,99,235,0.16)_0%,rgba(34,211,238,0.12)_48%,transparent_76%)] opacity-75',
            size === 'hero' ? 'opacity-95' : ''
          )}
        />
        <div
          className={clsx(
            'relative flex items-center justify-center overflow-hidden border transition-transform duration-300 group-hover/logo:scale-[1.03]',
            badgeSize[size],
            tone === 'light'
              ? 'border-white/12 bg-white/6 shadow-[0_16px_34px_rgba(2,6,23,0.28),0_0_20px_rgba(96,165,250,0.12)] backdrop-blur-lg'
              : 'border-white/38 bg-white/80 shadow-[0_16px_32px_rgba(59,130,246,0.14),0_0_16px_rgba(34,211,238,0.06)] backdrop-blur-lg',
            size === 'hero' ? 'shadow-[0_24px_52px_rgba(2,6,23,0.28),0_0_26px_rgba(96,165,250,0.12)]' : ''
          )}
        >
          <span
            className={clsx(
              'pointer-events-none absolute inset-0',
              tone === 'light'
                ? 'bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.16),transparent_62%)]'
                : 'bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.16),transparent_60%)]'
            )}
          />
          <img
            src={logoSrc}
            alt="Nova Mind AI logo"
            className={clsx(
              'relative h-full w-full object-contain transition-transform duration-300 group-hover/logo:scale-[1.05]',
              imagePadding[size]
            )}
            loading="eager"
            decoding="async"
            onError={() => setLogoSrc('/logo.png')}
          />
        </div>
      </div>

      {showText && (
        <div
          className={clsx(
            titleSize[size],
            'font-semibold tracking-[-0.04em]',
            tone === 'light' ? 'text-[#F8FBFF]' : 'text-[#09111F]',
            responsiveText ? 'hidden sm:block' : 'block'
          )}
        >
          NOVA MIND AI
        </div>
      )}
    </div>
  );
}
