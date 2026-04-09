import { humanizePaymentStatus, paymentStatusTone } from '../../utils/payment';

const TONE_CLASSES = {
  success: 'border-emerald-400/30 bg-emerald-400/12 text-emerald-100',
  pending: 'border-sky-400/30 bg-sky-400/12 text-sky-100',
  danger: 'border-rose-400/30 bg-rose-400/12 text-rose-100',
  neutral: 'border-white/15 bg-white/10 text-slate-200',
};

export default function StatusPill({ status, payment = null, className = '' }) {
  const tone = paymentStatusTone(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${TONE_CLASSES[tone]} ${className}`}
    >
      {humanizePaymentStatus(payment || { status })}
    </span>
  );
}
