import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, Coins, CreditCard, Globe2, ShieldCheck, Sparkles, WalletCards, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Logo from '../components/ui/Logo';
import PricingCard from '../components/payments/PricingCard';
import PaymentModal from '../components/payments/PaymentModal';
import PaymentHistoryPanel from '../components/payments/PaymentHistoryPanel';
import AdminPaymentsPanel from '../components/payments/AdminPaymentsPanel';
import { API_ENDPOINTS } from '../config/api';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import { formatMoney, inferCountryCode } from '../utils/payment';

const resolveApiError = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.detail ||
  error?.message ||
  fallback;

export default function PricingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const [countryCode, setCountryCode] = useState('US');
  const [billingCycle, setBillingCycle] = useState(() => {
    if (typeof window === 'undefined') return 'monthly';
    return window.localStorage.getItem('nova-billing-cycle') || 'monthly';
  });
  const [config, setConfig] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [adminSummary, setAdminSummary] = useState(null);
  const [adminPayments, setAdminPayments] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activePayment, setActivePayment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState('');
  const [adminProcessingId, setAdminProcessingId] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponPreview, setCouponPreview] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [lastPaymentMethod, setLastPaymentMethod] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('nova-last-payment-method') || '';
  });

  const isAdmin = Boolean(user?.is_owner || user?.role === 'admin');
  const plans = dashboard?.plans || config?.plans || [];
  const currentPlanType = dashboard?.current_plan?.plan_type || user?.subscription?.plan || 'starter';
  const isBangladesh = Boolean(config?.location?.is_bangladesh || countryCode === 'BD');
  const usage = dashboard?.usage || null;
  const yearlyDiscountPercent = Number(config?.yearly_discount_percent || 10);
  const appliedCouponCode = couponPreview?.coupon_code || null;

  useEffect(() => {
    setCountryCode(inferCountryCode());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('nova-billing-cycle', billingCycle);
    setCouponPreview(null);
  }, [billingCycle]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (lastPaymentMethod) {
      window.localStorage.setItem('nova-last-payment-method', lastPaymentMethod);
    }
  }, [lastPaymentMethod]);

  useEffect(() => {
    if (!countryCode) return;
    loadPublicData(countryCode);
  }, [countryCode]);

  useEffect(() => {
    if (!countryCode || !isAuthenticated) return;
    loadPrivateData(countryCode);
  }, [countryCode, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!modalOpen || !activePayment?.id) return undefined;
    if (!['crypto', 'bdt_card', 'card'].includes(activePayment.category)) return undefined;
    if (!['pending', 'verifying'].includes(activePayment.status)) return undefined;

    const timer = window.setInterval(async () => {
      try {
        const endpoint = activePayment.category === 'crypto'
          ? API_ENDPOINTS.payments.cryptoStatus(activePayment.id)
          : API_ENDPOINTS.payments.status(activePayment.id);
        const { data } = await api.get(endpoint);
        setActivePayment(data);
        setHistory((current) =>
          current.map((payment) => (payment.id === data.id ? data : payment))
        );
        if (data.status === 'verified' && isAuthenticated) {
          await loadPrivateData(countryCode);
        }
      } catch {}
    }, 10000);

    return () => window.clearInterval(timer);
  }, [modalOpen, activePayment]);

  useEffect(() => {
    const paymentId = searchParams.get('payment_id');
    const gatewayState = searchParams.get('gateway');
    if (!paymentId || !isAuthenticated || !plans.length) return;

    const loadPaymentFromRedirect = async () => {
      try {
        const { data } = await api.get(API_ENDPOINTS.payments.status(paymentId));
        setActivePayment(data);
        const matchedPlan = plans.find((plan) => plan.plan_type === data.plan_type);
        if (matchedPlan) {
          setSelectedPlan(matchedPlan);
          setModalOpen(true);
        }

        if (data.status === 'verified' && isAuthenticated) {
          await loadPrivateData(countryCode);
        }

        if (gatewayState === 'success' || data.status === 'verified') {
          toast.success('Payment successful');
        } else if (gatewayState === 'failed') {
          toast.error('Payment failed');
        } else if (gatewayState === 'cancelled') {
          toast('Payment cancelled');
        } else {
          toast('Processing payment...');
        }
      } catch {}
      finally {
        const next = new URLSearchParams(searchParams);
        next.delete('payment_id');
        next.delete('gateway');
        setSearchParams(next, { replace: true });
      }
    };

    loadPaymentFromRedirect();
  }, [isAuthenticated, plans, searchParams, setSearchParams]);

  const selectedPlanPayment = useMemo(() => {
    if (!selectedPlan) return activePayment;
    if (activePayment?.plan_type === selectedPlan.plan_type) return activePayment;
    return history.find(
      (payment) =>
        payment.plan_type === selectedPlan.plan_type &&
        ['pending', 'verifying', 'expired'].includes(payment.status)
    );
  }, [activePayment, history, selectedPlan]);

  const requireAuth = () => {
    if (!isAuthenticated) {
      toast('Sign in to start payment and upgrade your workspace.');
      navigate('/login');
      return false;
    }
    return true;
  };

  async function loadPublicData(country) {
    try {
      const { data } = await api.get(API_ENDPOINTS.payments.config(country));
      setConfig(data);
    } catch (error) {
      toast.error(resolveApiError(error, 'Unable to load payment configuration.'));
    }
  }

  async function loadPrivateData(country) {
    try {
      const requests = [
        api.get(API_ENDPOINTS.payments.dashboard(country)),
        api.get(API_ENDPOINTS.payments.history),
      ];

      if (isAdmin) {
        requests.push(api.get(API_ENDPOINTS.payments.adminSummary));
        requests.push(api.get(API_ENDPOINTS.payments.adminPayments));
      }

      const [dashboardResponse, historyResponse, adminSummaryResponse, adminPaymentsResponse] = await Promise.all(
        requests
      );

      setDashboard(dashboardResponse?.data || null);
      setHistory(historyResponse?.data || []);
      setAdminSummary(adminSummaryResponse?.data?.summary || null);
      setAdminPayments(adminPaymentsResponse?.data || []);
    } catch (error) {
      toast.error(resolveApiError(error, 'Unable to load billing data.'));
    }
  }

  const openPlanModal = (plan) => {
    setSelectedPlan(plan);
    setCouponPreview(null);
    setActivePayment(
      history.find(
        (payment) =>
          payment.plan_type === plan.plan_type &&
          ['pending', 'verifying', 'expired'].includes(payment.status)
      ) || null
    );
    setModalOpen(true);
  };

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Unable to copy right now');
    }
  };

  const handleApplyCoupon = async () => {
    if (!selectedPlan) {
      toast('Choose a plan first to apply a coupon.');
      return;
    }

    const normalizedCode = couponCode.trim().toUpperCase();
    if (!normalizedCode) {
      setCouponPreview(null);
      return;
    }

    try {
      setCouponLoading(true);
      const { data } = await api.post(API_ENDPOINTS.payments.couponPreview, {
        plan_type: selectedPlan.plan_type,
        billing_cycle: billingCycle,
        coupon_code: normalizedCode,
        country_code: countryCode,
      });

      if (!data?.valid) {
        setCouponPreview(null);
        toast.error(data?.message || 'Coupon is not valid.');
        return;
      }

      setCouponCode(normalizedCode);
      setCouponPreview({
        ...data.pricing,
        message: data.message,
      });
      toast.success(data?.message || 'Coupon applied.');
    } catch (error) {
      setCouponPreview(null);
      toast.error(resolveApiError(error, 'Unable to apply coupon.'));
    } finally {
      setCouponLoading(false);
    }
  };

  const clearCoupon = () => {
    setCouponCode('');
    setCouponPreview(null);
  };

  const handleStripeCheckout = async (plan) => {
    if (!requireAuth()) return;

    try {
      setProcessingAction('stripe');
      const { data } = await api.post(API_ENDPOINTS.payments.stripeCheckout, {
        plan_type: plan.plan_type,
        country_code: countryCode,
        billing_cycle: billingCycle,
        coupon_code: appliedCouponCode,
      });

      if (!data?.session_url) {
        throw new Error('Stripe session URL missing from server response.');
      }

      if (data.payment) {
        setActivePayment(data.payment);
      }

      window.location.href = data.session_url;
    } catch (error) {
      toast.error(resolveApiError(error, 'Unable to start Stripe checkout.'));
    } finally {
      setProcessingAction('');
    }
  };

  const handleBdtCheckout = async (plan) => {
    if (!requireAuth()) return;

    try {
      setProcessingAction('bdt-card');
      const { data } = await api.post(API_ENDPOINTS.payments.bdtCheckout, {
        plan_type: plan.plan_type,
        country_code: countryCode,
        billing_cycle: billingCycle,
        coupon_code: appliedCouponCode,
      });

      if (!data?.session_url) {
        throw new Error('BDT checkout URL missing from server response.');
      }

      if (data.payment) {
        setActivePayment(data.payment);
      }

      window.location.href = data.session_url;
    } catch (error) {
      toast.error(resolveApiError(error, 'Unable to start Bangladesh card checkout.'));
    } finally {
      setProcessingAction('');
    }
  };

  const handleCreateCrypto = async (plan, method) => {
    if (!requireAuth()) return;

    try {
      setProcessingAction('crypto-create');
      const { data } = await api.post(API_ENDPOINTS.payments.cryptoCreate, {
        plan_type: plan.plan_type,
        method,
        country_code: countryCode,
        billing_cycle: billingCycle,
        coupon_code: appliedCouponCode,
      });

      if (!data?.payment) {
        throw new Error('Crypto payment request is incomplete.');
      }

      setActivePayment(data.payment);
      toast.success('Crypto payment request generated.');
      await loadPrivateData(countryCode);
    } catch (error) {
      toast.error(resolveApiError(error, 'Unable to create crypto payment.'));
    } finally {
      setProcessingAction('');
    }
  };

  const handleConfirmCrypto = async (paymentId, form) => {
    if (!form.txHash?.trim()) {
      toast.error('Transaction hash is required.');
      return;
    }

    try {
      setProcessingAction('crypto-confirm');
      const { data } = await api.post(API_ENDPOINTS.payments.cryptoConfirm, {
        payment_id: paymentId,
        tx_hash: form.txHash.trim(),
        sender_address: form.senderAddress?.trim() || null,
        notes: form.notes?.trim() || null,
      });

      if (data?.payment) {
        setActivePayment(data.payment);
      }

      toast.success(data?.message || 'Transaction hash saved.');
      await loadPrivateData(countryCode);
    } catch (error) {
      toast.error(resolveApiError(error, 'Unable to save transaction hash.'));
    } finally {
      setProcessingAction('');
    }
  };

  const handleRetryCrypto = async (paymentId) => {
    try {
      setProcessingAction('crypto-retry');
      const { data } = await api.post(API_ENDPOINTS.payments.cryptoRetry(paymentId));
      if (data?.payment) {
        setActivePayment(data.payment);
      }
      toast.success(data?.message || 'A new crypto payment window was generated.');
      await loadPrivateData(countryCode);
    } catch (error) {
      toast.error(resolveApiError(error, 'Unable to retry crypto payment.'));
    } finally {
      setProcessingAction('');
    }
  };

  const handleInvoiceDownload = async (payment) => {
    try {
      const { data } = await api.get(API_ENDPOINTS.payments.invoice(payment.id));
      const content = [
        `Invoice: ${data.invoice_number}`,
        `Status: ${data.status}`,
        `Plan: ${data.payment.plan_name}`,
        `Amount: ${formatMoney(data.payment.amount, data.payment.currency)}`,
        `Issued: ${new Date(data.issued_at).toLocaleString()}`,
      ].join('\n');

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.invoice_number}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(resolveApiError(error, 'Unable to download invoice.'));
    }
  };

  const handleAdminAction = async (type, payment) => {
    try {
      setAdminProcessingId(payment.id);
      const endpoint =
        type === 'approve'
          ? API_ENDPOINTS.payments.adminApprove(payment.id)
          : type === 'reject'
            ? API_ENDPOINTS.payments.adminReject(payment.id)
            : API_ENDPOINTS.payments.adminFail(payment.id);
      await api.post(endpoint);
      toast.success(`Payment ${type}d successfully.`);
      await loadPrivateData(countryCode);
    } catch (error) {
      toast.error(resolveApiError(error, `Unable to ${type} payment.`));
    } finally {
      setAdminProcessingId(null);
    }
  };

  return (
    <div className="dark">
      <div className="app-shell min-h-screen bg-[linear-gradient(180deg,#030712_0%,#07111f_42%,#0b1220_100%)] text-white">
        <header className="page-header border-b border-white/10">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
            <Link to="/" className="inline-flex items-center">
              <Logo size="sm" />
            </Link>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link to="/chat" className="btn-primary">
                  Open workspace
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary">
                    Sign in
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Start with NOVA AI
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
          <section className="surface relative overflow-hidden rounded-[34px] p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_30%)]" />

            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-sky-200" />
                  NOVA MIND AI billing
                </div>
                <h1 className="mt-5 max-w-[760px] text-[38px] font-semibold tracking-[-0.05em] text-white sm:text-[52px]">
                  Premium AI Workspace Plans
                </h1>
                <div className="mt-4 text-lg font-medium tracking-[-0.02em] text-cyan-100">
                  Designed to move active users into paid execution power.
                </div>
                <p className="mt-4 max-w-[720px] text-[16px] leading-8 text-slate-300">
                  Start with a lighter plan to build habit, then upgrade into Coding Mode, deeper analysis, and finally full Agent Mode when the workflow becomes serious.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <HighlightChip icon={Sparkles} label="Global Intelligence" />
                  <HighlightChip icon={Coins} label="Auto-verified Crypto" />
                  <HighlightChip icon={CreditCard} label="Secure Card Payments" />
                  <HighlightChip icon={Zap} label="Instant Activation" />
                  <HighlightChip icon={BarChart3} label="Scale Without Limits" />
                  <HighlightChip icon={Globe2} label={`Region: ${countryCode}`} />
                </div>
              </div>

              <div className="rounded-[28px] border border-white/12 bg-white/8 p-5 shadow-[0_24px_52px_rgba(15,23,42,0.16)]">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Billing controls</div>
                <div className="mt-4 flex rounded-full border border-white/10 bg-[#020617]/45 p-1">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                      billingCycle === 'monthly'
                        ? 'bg-white/12 text-white shadow-[0_10px_24px_rgba(56,189,248,0.12)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                      billingCycle === 'yearly'
                        ? 'bg-[linear-gradient(135deg,rgba(56,189,248,0.18),rgba(168,85,247,0.16))] text-white shadow-[0_10px_24px_rgba(56,189,248,0.16)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
                <div className="mt-4 rounded-[18px] border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100">
                  Save {yearlyDiscountPercent}% with yearly billing
                </div>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                  <div className="rounded-[18px] border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-cyan-100">
                    <span className="font-semibold">Best value:</span> Pro Agent is the main conversion tier and the first plan where full Agent Mode becomes the obvious unlock.
                  </div>
                  <div className="rounded-[18px] border border-amber-300/18 bg-amber-400/10 px-4 py-3 text-amber-100">
                    <span className="font-semibold">Most powerful:</span> Elite Ultra anchors premium power and makes Pro Agent feel like the smartest serious-user choice.
                  </div>
                </div>
                <div className="mt-5 rounded-[20px] border border-white/10 bg-[#020617]/40 px-4 py-3 text-sm font-medium text-slate-200">
                  {config?.location?.highlight || (isBangladesh ? 'Bangladesh pricing is shown first. Crypto remains the cleanest value path.' : 'Global billing is live with secure card and crypto checkout.')}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="surface rounded-[24px] p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Entry path</div>
              <div className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">Build habit first</div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Basic and Standard are designed to get users into daily workflow quickly without pricing shock.
              </p>
            </div>
            <div className="surface rounded-[24px] border border-cyan-300/16 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200">Primary conversion target</div>
              <div className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">Pro Agent</div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                This is the plan that turns NOVA from a smart assistant into an operator system with real execution value.
              </p>
            </div>
            <div className="surface rounded-[24px] border border-amber-300/14 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-amber-200">Premium anchor</div>
              <div className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">Elite Ultra</div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Maximum power exists for the highest-intent buyers and helps justify Pro Agent as the rational upgrade for most serious users.
              </p>
            </div>
          </section>

          <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-12">
            {plans.map((plan) => (
              <PricingCard
                key={plan.plan_type}
                plan={plan}
                isActive={currentPlanType === plan.plan_type}
                isBangladesh={isBangladesh}
                billingCycle={billingCycle}
                layoutClass={getPlanLayoutClass(plan.plan_type)}
                onChoose={openPlanModal}
              />
            ))}
          </section>

          <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <PaymentHistoryPanel payments={history} onInvoice={handleInvoiceDownload} />

            <div className="surface rounded-[28px] p-5 sm:p-6">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Workspace subscription</div>
              <h3 className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-white">Choose the smoothest checkout path</h3>
              <div className="mt-5 space-y-3">
                <MethodCard
                  icon={CreditCard}
                  title="USD card checkout"
                  meta="Visa, Mastercard, Apple Pay"
                  body="Best for international teams that want instant activation with a Stripe-grade card experience."
                />
                <MethodCard
                  icon={WalletCards}
                  title="BDT card gateway"
                  meta="SSLCommerz / ShurjoPay"
                  body="Clean Bangladesh checkout for local bank cards with secure redirect flow and webhook verification."
                />
                <MethodCard
                  icon={Coins}
                  title="USDT crypto"
                  meta="TRC20 & TON"
                  body="Generates a unique amount, auto-checks the chain every 10 seconds, and upgrades the workspace automatically."
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoTile
                  icon={Sparkles}
                  title="Last payment method"
                  body={lastPaymentMethod ? humanizeMethodLabel(lastPaymentMethod) : 'No payment method selected yet'}
                />
                <InfoTile
                  icon={BarChart3}
                  title="Usage tracking"
                  body={
                    usage?.limit
                      ? `${usage.used}/${usage.limit} daily messages used`
                      : currentPlanType === 'elite' || currentPlanType === 'ultra'
                        ? 'Unlimited priority usage'
                        : 'Usage updates after your first successful payment'
                  }
                />
              </div>

              {usage?.limit ? (
                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/8 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white">Daily workspace usage</div>
                    <div className="text-sm text-slate-300">{usage.percent}%</div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(56,189,248,0.95),rgba(168,85,247,0.85))]"
                      style={{ width: `${Math.max(4, usage.percent)}%` }}
                    />
                  </div>
                  <div className="mt-3 text-sm text-slate-400">
                    {usage.remaining} requests remaining today on your current plan.
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/8 p-4 text-sm leading-7 text-slate-300">
                  {currentPlanType === 'elite' || currentPlanType === 'ultra'
                    ? 'Your workspace is on a high-priority plan with expanded or unlimited capacity.'
                    : 'Upgrade to Standard or above for a larger AI workspace with higher throughput.'}
                </div>
              )}
            </div>
          </section>

          {isAdmin && (
            <section className="mt-10">
              <AdminPaymentsPanel
                summary={adminSummary}
                payments={adminPayments}
                onApprove={(payment) => handleAdminAction('approve', payment)}
                onReject={(payment) => handleAdminAction('reject', payment)}
                onFail={(payment) => handleAdminAction('fail', payment)}
                processingId={adminProcessingId}
              />
            </section>
          )}
        </main>

        <PaymentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          plan={selectedPlan}
          config={config}
          currentPayment={selectedPlanPayment}
          billingCycle={billingCycle}
          couponCode={couponCode}
          couponPreview={couponPreview}
          couponLoading={couponLoading}
          lastPaymentMethod={lastPaymentMethod}
          processingAction={processingAction}
          onCreateStripe={handleStripeCheckout}
          onCreateBdtCard={handleBdtCheckout}
          onCreateCrypto={handleCreateCrypto}
          onConfirmCrypto={handleConfirmCrypto}
          onRetryCrypto={handleRetryCrypto}
          onCopy={copyText}
          onSelectMethod={setLastPaymentMethod}
          onCouponChange={setCouponCode}
          onApplyCoupon={handleApplyCoupon}
          onClearCoupon={clearCoupon}
        />
      </div>
    </div>
  );
}

function HighlightChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-2 text-sm text-slate-200">
      <Icon className="h-4 w-4 text-sky-200" />
      {label}
    </span>
  );
}

function MethodCard({ icon: Icon, title, meta, body }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-[22px] border border-white/10 bg-white/8 p-4 transition"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
          <Icon className="h-5 w-5 text-sky-200" />
        </div>
        <div>
          <div className="font-medium text-white">{title}</div>
          <div className="mt-1 text-sm text-sky-100">{meta}</div>
          <div className="mt-2 text-sm leading-7 text-slate-400">{body}</div>
        </div>
      </div>
    </motion.div>
  );
}

function InfoTile({ icon: Icon, title, body }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
          <Icon className="h-4 w-4 text-sky-200" />
        </div>
        <div>
          <div className="text-sm font-medium text-white">{title}</div>
          <div className="mt-2 text-sm leading-6 text-slate-400">{body}</div>
        </div>
      </div>
    </div>
  );
}

function getPlanLayoutClass(planType) {
  if (planType === 'elite') return 'xl:col-span-4';
  return 'xl:col-span-2';
}

function humanizeMethodLabel(method) {
  if (method === 'card_usd') return 'Card (USD)';
  if (method === 'card_bdt') return 'Card (BDT)';
  if (method === 'crypto') return 'Crypto (USDT)';
  return method;
}
