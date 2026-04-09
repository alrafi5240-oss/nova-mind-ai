import clsx from 'clsx';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M21.82 12.25c0-.72-.06-1.25-.2-1.8H12.2v3.48h5.53c-.11.86-.73 2.15-2.1 3.02l-.02.12 3.01 2.28.21.02c1.95-1.76 3.07-4.35 3.07-7.12Z"
      />
      <path
        fill="#34A853"
        d="M12.2 21.9c2.71 0 4.98-.87 6.64-2.36l-3.2-2.42c-.85.58-1.99.98-3.44.98-2.66 0-4.92-1.76-5.73-4.2l-.12.01-3.13 2.37-.04.11c1.66 3.24 5.07 5.51 9.02 5.51Z"
      />
      <path
        fill="#FBBC05"
        d="M6.47 13.9A5.83 5.83 0 0 1 6.14 12c0-.66.12-1.3.31-1.9l-.01-.13-3.17-2.4-.1.05A9.79 9.79 0 0 0 2.18 12c0 1.58.38 3.07 1.06 4.38l3.23-2.48Z"
      />
      <path
        fill="#EA4335"
        d="M12.2 5.9c1.83 0 3.06.78 3.76 1.44l2.74-2.62C17.02 3.2 14.91 2.1 12.2 2.1c-3.95 0-7.36 2.27-9.02 5.51l3.28 2.47c.82-2.44 3.08-4.19 5.74-4.19Z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="#F25022" d="M3 3h8.6v8.6H3z" />
      <path fill="#7FBA00" d="M12.4 3H21v8.6h-8.6z" />
      <path fill="#00A4EF" d="M3 12.4h8.6V21H3z" />
      <path fill="#FFB900" d="M12.4 12.4H21V21h-8.6z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M15.47 12.73c.03 3.22 2.82 4.29 2.85 4.31-.02.08-.45 1.54-1.49 3.04-.9 1.29-1.83 2.58-3.3 2.61-1.45.03-1.91-.85-3.58-.85-1.67 0-2.18.82-3.55.88-1.41.05-2.49-1.41-3.4-2.69-1.86-2.68-3.28-7.56-1.37-10.89.95-1.65 2.65-2.7 4.49-2.73 1.4-.03 2.71.95 3.58.95.87 0 2.5-1.17 4.22-1 .72.03 2.74.29 4.03 2.18-.1.06-2.4 1.39-2.38 4.19ZM13.28 5.02c.76-.92 1.27-2.2 1.13-3.47-1.09.04-2.4.72-3.18 1.64-.7.81-1.31 2.1-1.14 3.34 1.22.09 2.44-.62 3.19-1.51Z" />
    </svg>
  );
}

const ICONS = {
  google: GoogleIcon,
  microsoft: MicrosoftIcon,
  apple: AppleIcon,
};

export default function AuthProviderButton({
  provider,
  label,
  onClick,
  disabled = false,
  compact = false,
}) {
  const Icon = ICONS[provider];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'auth-provider-button',
        compact ? 'min-h-[40px] px-4 py-2.5 text-sm' : 'min-h-[44px] px-5 py-3 text-sm'
      )}
    >
      <span className="auth-provider-icon">
        {Icon ? <Icon /> : null}
      </span>
      <span>{label}</span>
    </button>
  );
}
