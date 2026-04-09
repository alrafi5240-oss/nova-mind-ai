import { Download, FileText, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusPill from './StatusPill';
import { formatMoney, humanizeMethod } from '../../utils/payment';

export default function PaymentHistoryPanel({ payments, onInvoice }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="surface rounded-[28px] p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            <Receipt className="h-3.5 w-3.5 text-sky-200" />
            Payment history
          </div>
          <h3 className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-white">Recent invoices</h3>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {payments.length ? (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-col gap-4 rounded-[22px] border border-white/10 bg-white/8 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="font-medium text-white">{payment.plan_name}</div>
                  <StatusPill status={payment.status} payment={payment} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                  <span>{humanizeMethod(payment)}</span>
                  <span>{formatMoney(payment.amount, payment.currency)}</span>
                  <span>{payment.invoice_number}</span>
                </div>
                {payment.status_message && <div className="mt-1 text-sm text-slate-400">{payment.status_message}</div>}
              </div>

              <button
                type="button"
                onClick={() => onInvoice(payment)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:border-sky-300/30 hover:bg-sky-400/10"
              >
                <Download className="h-4 w-4" />
                <span>Invoice</span>
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-[22px] border border-dashed border-white/12 bg-white/6 px-4 py-8 text-center text-sm leading-7 text-slate-400">
            <FileText className="mx-auto mb-3 h-5 w-5 text-slate-500" />
            No payments yet. Your successful card and crypto upgrades will appear here.
          </div>
        )}
      </div>
    </motion.section>
  );
}
