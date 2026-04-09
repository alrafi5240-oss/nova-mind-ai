export const inferCountryCode = () => {
  if (typeof window === 'undefined') return 'US';

  const language = (navigator.language || '').toLowerCase();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone?.toLowerCase() || '';

  if (language.endsWith('-bd') || language.startsWith('bn') || timezone.includes('dhaka')) {
    return 'BD';
  }

  return 'US';
};

export const formatMoney = (amount, currency = 'USD') => {
  const normalizedCurrency = currency === 'USDT' ? 'USD' : currency;

  try {
    const formatted = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: currency === 'BDT' ? 0 : 2,
    }).format(Number(amount || 0));

    if (currency === 'USDT') {
      return formatted.replace('$', '') + ' USDT';
    }

    return formatted;
  } catch {
    return currency === 'BDT' ? `৳${amount}` : `$${amount}`;
  }
};

export const formatRelativeCountdown = (expiresAt) => {
  if (!expiresAt) return 'No expiry';

  const deltaMs = new Date(expiresAt).getTime() - Date.now();
  if (deltaMs <= 0) return 'Expired';

  const totalSeconds = Math.floor(deltaMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} left`;
};

export const paymentStatusTone = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'verified':
      return 'success';
    case 'pending':
    case 'verifying':
      return 'pending';
    case 'expired':
    case 'failed':
    case 'rejected':
      return 'danger';
    default:
      return 'neutral';
  }
};

export const getPlanPrice = (plan, billingCycle = 'monthly', currency = 'USD') => {
  if (!plan) return 0;

  if (billingCycle === 'yearly') {
    if (currency === 'BDT') return plan.price_bdt_yearly ?? plan.price_bdt ?? 0;
    if (currency === 'USDT') return plan.price_crypto_yearly ?? plan.price_crypto ?? 0;
    return plan.price_usd_yearly ?? plan.price_usd ?? 0;
  }

  if (currency === 'BDT') return plan.price_bdt ?? 0;
  if (currency === 'USDT') return plan.price_crypto ?? 0;
  return plan.price_usd ?? 0;
};

export const getBillingCycleLabel = (billingCycle = 'monthly') =>
  billingCycle === 'yearly' ? 'year' : 'month';

export const humanizePaymentStatus = (payment) => {
  const status = (payment?.status || '').toLowerCase();
  const category = (payment?.category || '').toLowerCase();

  if (category === 'crypto') {
    if (status === 'verified') return 'Completed';
    if (status === 'verifying') return 'Confirming';
    if (status === 'pending' && payment?.tx_hash) return 'Detecting';
    if (status === 'pending') return 'Waiting';
  }

  if (status === 'verified') return 'Completed';
  if (status === 'verifying') return 'Confirming';
  if (status === 'pending') return 'Processing';
  if (status === 'failed') return 'Failed';
  if (status === 'rejected') return 'Rejected';
  if (status === 'expired') return 'Expired';
  return status || 'Status';
};

export const humanizeMethod = (payment) => {
  const method = payment?.method || '';
  if (method === 'stripe') return 'Card / Stripe';
  if (method === 'bdt_card') return 'Bangladesh Card Gateway';
  if (method === 'bkash') return 'bKash';
  if (method === 'nagad') return 'Nagad';
  if (method === 'usdt_trc20') return 'USDT TRC20';
  if (method === 'usdt_ton') return 'USDT TON';
  if (method === 'usdt_erc20') return 'USDT ERC20';
  return method || 'Payment';
};
