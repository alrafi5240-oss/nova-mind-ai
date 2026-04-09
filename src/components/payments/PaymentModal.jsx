import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, CreditCard, ExternalLink, QrCode, RefreshCcw, Send, WalletCards } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import StatusPill from './StatusPill';
import { formatMoney, formatRelativeCountdown, getPlanPrice } from '../../utils/payment';

export default function PaymentModal({
  open,
  onClose,
  plan,
  config,
  currentPayment,
  billingCycle = 'monthly',
  couponCode = '',
  couponPreview = null,
  couponLoading = false,
  lastPaymentMethod = null,
  processingAction,
  onCreateStripe,
  onCreateBdtCard,
  onCreateCrypto,
  onConfirmCrypto,
  onRetryCrypto,
  onCopy,
  onSelectMethod,
  onCouponChange,
  onApplyCoupon,
  onClearCoupon,
}) {
  const availableTabs = useMemo(() => plan?.payment_methods || [], [plan]);
  const cryptoMethods = config?.crypto_methods || [];
  const gatewayConfig = config?.bdt_card || null;
  const initialTab =
    (lastPaymentMethod && availableTabs.includes(lastPaymentMethod) ? lastPaymentMethod : availableTabs[0]) || 'card_usd';

  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [cryptoMethod, setCryptoMethod] = useState(cryptoMethods[0]?.id || 'usdt_trc20');
  const [cryptoForm, setCryptoForm] = useState({ txHash: '', senderAddress: '', notes: '' });

  useEffect(() => {
    if (!open) return;
    setSelectedTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    if (!open || !selectedTab) return;
    onSelectMethod?.(selectedTab);
  }, [open, onSelectMethod, selectedTab]);

  useEffect(() => {
    if (!open) return;
    if (cryptoMethods.length) {
      setCryptoMethod((current) =>
        cryptoMethods.some((method) => method.id === current) ? current : cryptoMethods[0].id
      );
    }
  }, [open, cryptoMethods]);

  useEffect(() => {
    if (!currentPayment) return;
    setCryptoForm((current) => ({
      ...current,
      txHash: currentPayment.tx_hash || current.txHash,
      senderAddress: currentPayment.sender || current.senderAddress,
      notes: currentPayment.notes || current.notes,
    }));
  }, [currentPayment]);

  if (!plan) return null;

  const activeCryptoMethod = cryptoMethods.find((method) => method.id === cryptoMethod);
  const isCryptoFlow = currentPayment?.category === 'crypto' && currentPayment?.plan_type === plan.plan_type;
  const isBdtFlow = currentPayment?.category === 'bdt_card' && currentPayment?.plan_type === plan.plan_type;
  const cycleLabel = billingCycle === 'yearly' ? 'Yearly billing' : 'Monthly billing';
  const cryptoSteps = getCryptoSteps(currentPayment);
  const usdPlanPrice = couponPreview?.price_usd ?? getPlanPrice(plan, billingCycle, 'USD');
  const bdtPlanPrice = couponPreview?.price_bdt ?? getPlanPrice(plan, billingCycle, 'BDT');
  const cryptoPlanPrice = couponPreview?.price_crypto ?? getPlanPrice(plan, billingCycle, 'USDT');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Close payment modal"
            onClick={onClose}
            className="absolute inset-0 bg-[#020617]/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-[980px] overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(11,18,32,0.94),rgba(11,18,32,0.82))] shadow-[0_40px_90px_rgba(2,6,23,0.5)] backdrop-blur-[16px]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_28%)]" />

            <div className="relative grid gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
              <aside className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
                <div className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100">
                  Secure billing
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <h3 className="text-[30px] font-semibold tracking-[-0.04em] text-white">{plan.name}</h3>
                  {plan.badge_label && (
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                        plan.badge_tone === 'ultra'
                          ? 'border-amber-300/30 bg-amber-400/12 text-amber-100'
                          : 'border-cyan-300/30 bg-cyan-400/12 text-cyan-100'
                      }`}
                    >
                      {plan.badge_label}
                    </span>
                  )}
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-300">{plan.tagline}</div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/8 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Plan pricing</div>
                  <div className="mt-3 text-3xl font-semibold text-white">{formatMoney(usdPlanPrice, 'USD')}</div>
                  <div className="mt-2 text-sm text-slate-400">{`${formatMoney(bdtPlanPrice, 'BDT')} Bangladesh cards`}</div>
                  <div className="mt-1 text-sm text-slate-400">{`${formatMoney(cryptoPlanPrice, 'USDT')} crypto checkout`}</div>
                  <div className="mt-3 rounded-[18px] border border-white/10 bg-[#020617]/40 px-4 py-3 text-xs uppercase tracking-[0.18em] text-slate-300">
                    {cycleLabel}
                  </div>
                  {couponPreview?.coupon_code && (
                    <div className="mt-3 rounded-[18px] border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                      {couponPreview.coupon_code}
                      {couponPreview.coupon_discount_percent ? ` • ${couponPreview.coupon_discount_percent}% off` : ''}
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/8 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Coupon code</div>
                  <div className="mt-4 flex flex-col gap-3">
                    <input
                      value={couponCode}
                      onChange={(event) => onCouponChange?.(event.target.value)}
                      className="input-field"
                      placeholder="Enter code"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={onApplyCoupon}
                        className="inline-flex items-center justify-center rounded-full border border-sky-300/30 bg-sky-400/12 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400/16"
                      >
                        {couponLoading ? 'Checking...' : 'Apply'}
                      </button>
                      {couponPreview?.coupon_code && (
                        <button
                          type="button"
                          onClick={onClearCoupon}
                          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/8 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/16 hover:bg-white/12"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="text-sm leading-6 text-slate-400">
                      {couponPreview?.message || 'Apply a coupon before checkout if you have one.'}
                    </div>
                  </div>
                </div>

                {currentPayment && currentPayment.plan_type === plan.plan_type && (
                  <div className="mt-5 rounded-[24px] border border-white/10 bg-white/8 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Latest request</div>
                      <StatusPill status={currentPayment.status} payment={currentPayment} />
                    </div>
                    <div className="mt-3 text-sm text-white">{currentPayment.invoice_number}</div>
                    <div className="mt-2 text-sm text-slate-400">{currentPayment.status_message}</div>
                    {currentPayment.coupon_code && (
                      <div className="mt-3 text-xs uppercase tracking-[0.16em] text-cyan-200">
                        Coupon {currentPayment.coupon_code}
                        {currentPayment.coupon_discount_percent ? ` • ${currentPayment.coupon_discount_percent}% off` : ''}
                      </div>
                    )}
                    {currentPayment.expires_at && (
                      <div className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {formatRelativeCountdown(currentPayment.expires_at)}
                      </div>
                    )}
                  </div>
                )}
              </aside>

              <section className="p-6 sm:p-7">
                <div className="flex flex-wrap gap-2">
                  {availableTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSelectedTab(tab)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        selectedTab === tab
                          ? 'border-sky-300/30 bg-sky-400/12 text-white shadow-[0_0_24px_rgba(56,189,248,0.12)]'
                          : 'border-white/10 bg-white/8 text-slate-300 hover:border-white/16 hover:bg-white/12'
                      }`}
                    >
                      {tab === 'card_usd' ? 'Card (USD)' : tab === 'card_bdt' ? 'Card (BDT)' : 'Crypto (USDT)'}
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  {selectedTab === 'card_usd' && (
                    <div className="space-y-4">
                        <PanelCard
                          icon={CreditCard}
                          title="Stripe checkout"
                          description="Secure USD billing with Visa, Mastercard, AMEX, and Apple Pay. The workspace activates as soon as Stripe confirms payment."
                        />
                      <button
                        type="button"
                        onClick={() => onCreateStripe(plan)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-sky-300/30 bg-[linear-gradient(135deg,rgba(56,189,248,0.22),rgba(168,85,247,0.18))] px-4 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(56,189,248,0.2)]"
                      >
                        {processingAction === 'stripe' ? 'Opening checkout...' : 'Continue to secure checkout'}
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {selectedTab === 'card_bdt' && (
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="space-y-4">
                        <PanelCard
                          icon={WalletCards}
                          title={gatewayConfig?.provider || 'SSLCommerz / ShurjoPay / AamarPay'}
                          description="Secure redirect checkout for Bangladesh bank cards with webhook-based verification and premium activation flow."
                        />

                        {isBdtFlow ? (
                          <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Gateway payment</div>
                                <div className="mt-2 text-[28px] font-semibold text-white">
                                  {formatMoney(currentPayment.amount, 'BDT')}
                                </div>
                              </div>
                              <StatusPill status={currentPayment.status} payment={currentPayment} />
                            </div>
                            <div className="mt-4 text-sm leading-7 text-slate-300">{currentPayment.status_message}</div>
                            <div className="mt-4 rounded-[20px] border border-white/10 bg-[#020617]/40 px-4 py-3 text-sm text-slate-200">
                              {currentPayment.invoice_number}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {currentPayment.notes && (
                                <button
                                  type="button"
                                  onClick={() => window.open(currentPayment.notes, '_blank', 'noopener,noreferrer')}
                                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-slate-200 transition hover:border-sky-300/30 hover:bg-sky-400/10"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Continue payment
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-[24px] border border-dashed border-white/12 bg-white/6 px-5 py-10 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/8">
                              <WalletCards className="h-5 w-5 text-sky-200" />
                            </div>
                            <div className="mt-4 text-base font-medium text-white">Start Bangladesh card checkout</div>
                            <div className="mt-2 text-sm leading-7 text-slate-400">
                              Use a local Visa or Mastercard through a secure gateway redirect. NOVA upgrades the plan automatically after webhook confirmation.
                            </div>
                            <button
                              type="button"
                              onClick={() => onCreateBdtCard(plan)}
                              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-sky-300/30 bg-[linear-gradient(135deg,rgba(56,189,248,0.22),rgba(168,85,247,0.18))] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(56,189,248,0.2)]"
                            >
                              {processingAction === 'bdt-card' ? 'Opening gateway...' : 'Continue to secure gateway'}
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="rounded-[28px] border border-white/10 bg-white/8 p-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Status flow</div>
                        <div className="mt-4 space-y-3">
                          <FlowStep label="Redirecting" body="Secure handoff to SSLCommerz / ShurjoPay / AamarPay." />
                          <FlowStep label="Verifying" body="Gateway authorizes the card and posts webhook status." />
                          <FlowStep label="Instant activation" body="NOVA AI upgrades the plan immediately after confirmation." />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTab === 'crypto' && (
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {cryptoMethods.map((method) => (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setCryptoMethod(method.id)}
                              className={`rounded-[22px] border px-4 py-4 text-left transition ${
                                cryptoMethod === method.id
                                  ? 'border-sky-300/30 bg-sky-400/12'
                                  : 'border-white/10 bg-white/8 hover:border-white/16 hover:bg-white/10'
                              }`}
                            >
                              <div className="font-medium text-white">{method.label}</div>
                              <div className="mt-2 text-sm leading-6 text-slate-400">{method.description}</div>
                            </button>
                          ))}
                        </div>

                        {isCryptoFlow ? (
                          <div className="space-y-4">
                            <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Send exact amount</div>
                                  <div className="mt-2 text-[28px] font-semibold text-white">
                                    {formatMoney(currentPayment.amount, 'USDT')}
                                  </div>
                                </div>
                                <StatusPill status={currentPayment.status} payment={currentPayment} />
                              </div>

                              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                                {cryptoSteps.map((step) => (
                                  <ProgressStep key={step.label} label={step.label} state={step.state} />
                                ))}
                              </div>

                              <div className="mt-4 rounded-[20px] border border-white/10 bg-[#020617]/40 px-4 py-3 text-sm text-slate-200">
                                {currentPayment.deposit_address}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => onCopy(currentPayment.deposit_address)}
                                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-slate-200 transition hover:border-sky-300/30 hover:bg-sky-400/10"
                                >
                                  <Copy className="h-4 w-4" />
                                  Copy address
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRetryCrypto(currentPayment.id)}
                                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-slate-200 transition hover:border-sky-300/30 hover:bg-sky-400/10"
                                >
                                  <RefreshCcw className="h-4 w-4" />
                                  Retry
                                </button>
                              </div>
                              {currentPayment.expires_at && (
                                <div className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                                  {formatRelativeCountdown(currentPayment.expires_at)}
                                </div>
                              )}
                            </div>

                            <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                              <div className="text-sm font-medium text-white">Optional transaction hash</div>
                              <div className="mt-2 text-sm leading-6 text-slate-400">
                                Auto verification checks every 10 seconds. Adding the hash helps if the chain is delayed.
                              </div>
                              <div className="mt-4 space-y-3">
                                <input
                                  value={cryptoForm.txHash}
                                  onChange={(event) => setCryptoForm((current) => ({ ...current, txHash: event.target.value }))}
                                  className="input-field"
                                  placeholder="Transaction hash"
                                />
                                <input
                                  value={cryptoForm.senderAddress}
                                  onChange={(event) =>
                                    setCryptoForm((current) => ({ ...current, senderAddress: event.target.value }))
                                  }
                                  className="input-field"
                                  placeholder="Sender wallet address"
                                />
                                <textarea
                                  value={cryptoForm.notes}
                                  onChange={(event) => setCryptoForm((current) => ({ ...current, notes: event.target.value }))}
                                  className="input-field min-h-[112px] resize-none"
                                  placeholder="Notes (optional)"
                                />
                                <button
                                  type="button"
                                  onClick={() => onConfirmCrypto(currentPayment.id, cryptoForm)}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/12 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-400/16"
                                >
                                  <Send className="h-4 w-4" />
                                  {processingAction === 'crypto-confirm' ? 'Saving...' : 'Save transaction hash'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-[24px] border border-dashed border-white/12 bg-white/6 px-5 py-10 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/8">
                              <WalletCards className="h-5 w-5 text-sky-200" />
                            </div>
                            <div className="mt-4 text-base font-medium text-white">Create a crypto payment request</div>
                            <div className="mt-2 text-sm leading-7 text-slate-400">
                              Generate a unique deposit amount for {activeCryptoMethod?.label}. NOVA AI will monitor the chain automatically.
                            </div>
                            <button
                              type="button"
                              onClick={() => onCreateCrypto(plan, cryptoMethod)}
                              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400/16"
                            >
                              <QrCode className="h-4 w-4" />
                              {processingAction === 'crypto-create' ? 'Generating...' : 'Generate payment request'}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="rounded-[28px] border border-white/10 bg-white/8 p-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">QR deposit</div>
                        <div className="mt-4 flex justify-center rounded-[24px] border border-white/10 bg-white p-4">
                          <QRCodeSVG
                            size={220}
                            value={
                              currentPayment?.qr_payload ||
                              `${activeCryptoMethod?.network || 'USDT'}:${activeCryptoMethod?.wallet_address || ''}?amount=${cryptoPlanPrice || usdPlanPrice}`
                            }
                            bgColor="#ffffff"
                            fgColor="#0f172a"
                            includeMargin
                          />
                        </div>
                        <div className="mt-4 text-center text-sm leading-7 text-slate-400">
                          Scan to pay with {activeCryptoMethod?.label || 'crypto'}.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PanelCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
          <Icon className="h-5 w-5 text-sky-200" />
        </div>
        <div>
          <div className="font-medium text-white">{title}</div>
          <div className="mt-2 text-sm leading-7 text-slate-400">{description}</div>
        </div>
      </div>
    </div>
  );
}

function FlowStep({ label, body }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#020617]/30 p-4">
      <div className="text-sm font-medium text-white">{label}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{body}</div>
    </div>
  );
}

function ProgressStep({ label, state }) {
  const stateClasses =
    state === 'done'
      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
      : state === 'active'
        ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100'
        : 'border-white/10 bg-white/6 text-slate-400';

  return (
    <div className={`rounded-[18px] border px-3 py-3 text-center text-xs uppercase tracking-[0.18em] ${stateClasses}`}>
      {label}
    </div>
  );
}

function getCryptoSteps(payment) {
  const status = (payment?.status || '').toLowerCase();

  if (status === 'verified') {
    return [
      { label: 'Waiting', state: 'done' },
      { label: 'Detecting', state: 'done' },
      { label: 'Confirming', state: 'done' },
      { label: 'Completed', state: 'done' },
    ];
  }

  if (status === 'verifying') {
    return [
      { label: 'Waiting', state: 'done' },
      { label: 'Detecting', state: 'done' },
      { label: 'Confirming', state: 'active' },
      { label: 'Completed', state: 'idle' },
    ];
  }

  if (status === 'pending' && payment?.tx_hash) {
    return [
      { label: 'Waiting', state: 'done' },
      { label: 'Detecting', state: 'active' },
      { label: 'Confirming', state: 'idle' },
      { label: 'Completed', state: 'idle' },
    ];
  }

  return [
    { label: 'Waiting', state: 'active' },
    { label: 'Detecting', state: 'idle' },
    { label: 'Confirming', state: 'idle' },
    { label: 'Completed', state: 'idle' },
  ];
}
