import { ShieldCheck } from 'lucide-react';
import StatusPill from './StatusPill';
import { formatMoney, humanizeMethod } from '../../utils/payment';

export default function AdminPaymentsPanel({
  summary,
  payments,
  onApprove,
  onReject,
  onFail,
  processingId,
}) {
  return (
    <section className="surface rounded-[28px] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-200" />
            Admin panel
          </div>
          <h3 className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-white">Manual verification queue</h3>
        </div>

        {summary && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Total" value={summary.total_payments} />
            <MetricCard label="Pending" value={summary.pending_payments} />
            <MetricCard label="Queue" value={summary.manual_review_queue} />
            <MetricCard label="Revenue" value={formatMoney(summary.verified_volume_usd || 0, 'USD')} />
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {payments.length ? (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="rounded-[22px] border border-white/10 bg-white/8 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="font-medium text-white">
                      {payment.plan_name} • {humanizeMethod(payment)}
                    </div>
                    <StatusPill status={payment.status} payment={payment} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                    <span>User #{payment.user_id}</span>
                    <span>{formatMoney(payment.amount, payment.currency)}</span>
                    <span>{payment.invoice_number}</span>
                    {payment.trx_id && <span>TX ID: {payment.trx_id}</span>}
                    {payment.tx_hash && <span className="truncate">Hash: {payment.tx_hash}</span>}
                  </div>
                  {payment.sender && <div className="mt-1 text-sm text-slate-400">Sender: {payment.sender}</div>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    tone="approve"
                    disabled={processingId === payment.id}
                    onClick={() => onApprove(payment)}
                  >
                    {processingId === payment.id ? 'Working...' : 'Approve'}
                  </ActionButton>
                  <ActionButton tone="reject" disabled={processingId === payment.id} onClick={() => onReject(payment)}>
                    Reject
                  </ActionButton>
                  <ActionButton tone="fail" disabled={processingId === payment.id} onClick={() => onFail(payment)}>
                    Fail
                  </ActionButton>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[22px] border border-dashed border-white/12 bg-white/6 px-4 py-8 text-center text-sm leading-7 text-slate-400">
            No admin review items right now.
          </div>
        )}
      </div>
    </section>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/8 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function ActionButton({ children, tone, ...props }) {
  const toneClasses =
    tone === 'approve'
      ? 'border-emerald-400/30 bg-emerald-400/12 text-emerald-100 hover:bg-emerald-400/18'
      : tone === 'reject'
        ? 'border-amber-400/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/16'
        : 'border-rose-400/30 bg-rose-400/10 text-rose-100 hover:bg-rose-400/16';

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${toneClasses}`}
      {...props}
    >
      {children}
    </button>
  );
}
