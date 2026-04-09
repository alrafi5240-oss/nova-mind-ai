import { ArrowRight, Check, Coins, CreditCard, WalletCards } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatMoney, getBillingCycleLabel, getPlanPrice } from '../../utils/payment';

const methodIcon = {
  card: CreditCard,
  card_usd: CreditCard,
  card_bdt: WalletCards,
  crypto: Coins,
  local: WalletCards,
};

export default function PricingCard({ plan, isActive, isBangladesh, billingCycle = 'monthly', layoutClass = '', onChoose }) {
  const isBestValue = plan.badge_tone === 'best';
  const isUltra = plan.badge_tone === 'ultra';
  const primaryCurrency = isBangladesh ? 'BDT' : 'USD';
  const secondaryCurrency = isBangladesh ? 'USDT' : 'BDT';
  const primaryAmount = getPlanPrice(plan, billingCycle, primaryCurrency);
  const secondaryAmount = getPlanPrice(plan, billingCycle, secondaryCurrency);
  const monthlyEquivalentPrimary = billingCycle === 'yearly' ? primaryAmount / 12 : primaryAmount;
  const primaryLabel = plan.is_free
    ? 'Current free plan'
    : formatMoney(primaryAmount, primaryCurrency);

  const secondaryLabel = plan.is_free
    ? 'Free forever'
    : billingCycle === 'yearly'
      ? `${formatMoney(monthlyEquivalentPrimary, primaryCurrency)} / month billed yearly`
      : isBangladesh
        ? `${formatMoney(secondaryAmount, 'USDT')} crypto option`
        : `${formatMoney(secondaryAmount, 'BDT')} local option`;

  const badgeClasses = isBestValue
    ? 'border-cyan-300/24 bg-cyan-400/10 text-cyan-100 shadow-[0_10px_24px_rgba(34,211,238,0.14)]'
    : isUltra
      ? 'border-amber-300/24 bg-amber-400/10 text-amber-100 shadow-[0_10px_24px_rgba(251,191,36,0.14)]'
      : 'border-white/12 bg-white/10 text-slate-200';

  const cardClasses = isBestValue
    ? 'border-cyan-300/24 bg-[linear-gradient(180deg,rgba(8,18,34,0.98),rgba(17,24,39,0.92))] shadow-[0_28px_72px_rgba(34,211,238,0.14)]'
    : isUltra
      ? 'border-amber-300/22 bg-[linear-gradient(180deg,rgba(24,18,8,0.98),rgba(17,24,39,0.94))] shadow-[0_28px_72px_rgba(251,191,36,0.14)]'
      : 'border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] shadow-[0_20px_44px_rgba(15,23,42,0.16)]';

  const buttonClasses = isBestValue
    ? 'border-cyan-300/24 bg-[linear-gradient(135deg,rgba(14,165,233,0.26),rgba(34,211,238,0.18),rgba(168,85,247,0.12))] text-white shadow-[0_16px_34px_rgba(34,211,238,0.18)] hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(34,211,238,0.22)]'
    : isUltra
      ? 'border-amber-300/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(250,204,21,0.14),rgba(59,130,246,0.1))] text-white shadow-[0_16px_34px_rgba(245,158,11,0.18)] hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(245,158,11,0.22)]'
      : 'border-sky-300/24 bg-[linear-gradient(135deg,rgba(56,189,248,0.18),rgba(168,85,247,0.14))] text-white shadow-[0_16px_34px_rgba(56,189,248,0.14)] hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(56,189,248,0.18)]';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className={`group relative overflow-hidden rounded-[30px] border p-6 transition duration-300 sm:p-7 ${cardClasses} ${layoutClass} backdrop-blur-[16px]`}
    >
      <div
        className={`pointer-events-none absolute inset-0 opacity-90 transition duration-300 ${
          isUltra
            ? 'bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.14),transparent_30%)]'
            : 'bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_28%)]'
        }`}
      />
      <div
        className={`pointer-events-none absolute inset-[1px] rounded-[29px] opacity-0 blur-2xl transition duration-300 group-hover:opacity-100 ${
          isBestValue
            ? 'bg-cyan-400/10'
            : isUltra
              ? 'bg-amber-400/12'
              : 'bg-sky-400/8'
        }`}
      />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-[24px] font-semibold tracking-[-0.03em] text-white">{plan.name}</h3>
              {plan.badge_label && (
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.12em] ${badgeClasses}`}>
                  {plan.badge_label}
                </span>
              )}
            </div>
            <p className="mt-3 max-w-[28rem] text-sm leading-7 text-slate-300">{plan.tagline || plan.description}</p>
            {plan.microcopy && <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{plan.microcopy}</p>}
            {(isBestValue || isUltra) && (
              <div
                className={`mt-4 rounded-[18px] border px-3 py-2 text-xs font-medium tracking-[0.02em] ${
                  isBestValue
                    ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100'
                    : 'border-amber-300/18 bg-amber-400/10 text-amber-100'
                }`}
              >
                {isBestValue
                  ? 'Agent Mode starts here. Best fit for users who already rely on AI daily.'
                  : 'Built for maximum throughput, maximum priority, and premium support.'}
              </div>
            )}
          </div>

          {isActive && (
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
              Active
            </span>
          )}
        </div>

        <div className="mt-6 flex items-end gap-3">
          <div className="text-[40px] font-semibold tracking-[-0.05em] text-white">{primaryLabel}</div>
          {!plan.is_free && <span className="pb-2 text-sm text-slate-400">/ {getBillingCycleLabel(billingCycle)}</span>}
        </div>
        <div className="mt-2 text-sm text-slate-400">{secondaryLabel}</div>
        {!plan.is_free && billingCycle === 'yearly' && (
          <div className="mt-2 text-xs uppercase tracking-[0.18em] text-emerald-200">
            Save {plan.yearly_discount_percent || 10}% with yearly billing
          </div>
        )}

        <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-200">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="mt-1 h-4 w-4 shrink-0 text-sky-300" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-wrap gap-2">
          {plan.payment_methods.map((method) => {
            const Icon = methodIcon[method] || CreditCard;
            return (
              <span
                key={`${plan.plan_type}-${method}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-medium text-slate-200 transition duration-300 group-hover:border-white/18 group-hover:bg-white/10"
              >
                <Icon className="h-3.5 w-3.5 text-sky-200" />
                {method === 'card_usd'
                  ? 'USD Card'
                  : method === 'card_bdt'
                    ? 'BDT Card'
                    : method === 'crypto'
                      ? 'Crypto'
                      : 'Card'}
              </span>
            );
          })}
        </div>

        <button
          type="button"
          disabled={isActive || plan.is_free}
          onClick={() => onChoose(plan)}
          className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3.5 text-sm font-semibold transition duration-300 ${
            isActive || plan.is_free
              ? 'cursor-not-allowed border-white/10 bg-white/8 text-slate-400'
              : buttonClasses
          }`}
        >
          <span>{isActive ? 'Current plan' : plan.is_free ? 'Included by default' : plan.button_label || 'Choose plan'}</span>
          {!isActive && !plan.is_free && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </motion.article>
  );
}
