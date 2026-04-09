const normalizeBaseUrl = (value) => {
  if (!value) return 'http://127.0.0.1:8000';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

export const API_BASE = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000');

export const API_ENDPOINTS = {
  health: `${API_BASE}/health`,
  chat: `${API_BASE}/api/chat`,
  voiceToText: `${API_BASE}/voice-to-text`,
  textToVoice: `${API_BASE}/text-to-voice`,
  auth: {
    me: `${API_BASE}/auth/me`,
    guest: `${API_BASE}/auth/guest`,
    emailRequestOtp: `${API_BASE}/auth/email/request-otp`,
    emailVerify: `${API_BASE}/auth/email/verify`,
    oauthUrl: (provider) => `${API_BASE}/auth/oauth/${provider}/url`,
    oauthCallback: (provider) => `${API_BASE}/auth/oauth/${provider}/callback`,
  },
  payments: {
    config: (country) => `${API_BASE}/payment/config${country ? `?country=${encodeURIComponent(country)}` : ''}`,
    couponPreview: `${API_BASE}/payment/coupon/preview`,
    dashboard: (country) => `${API_BASE}/payment/dashboard${country ? `?country=${encodeURIComponent(country)}` : ''}`,
    stripeCheckout: `${API_BASE}/payment/stripe/checkout`,
    bdtCheckout: `${API_BASE}/payment/bdt/checkout`,
    cryptoCreate: `${API_BASE}/payment/crypto/create`,
    cryptoConfirm: `${API_BASE}/payment/crypto/verify`,
    cryptoStatus: (paymentId) => `${API_BASE}/payment/crypto/${paymentId}`,
    cryptoRetry: (paymentId) => `${API_BASE}/payment/crypto/${paymentId}/retry`,
    status: (paymentId) => `${API_BASE}/payment/status/${paymentId}`,
    localCreate: `${API_BASE}/payment/local/request`,
    history: `${API_BASE}/payment/me`,
    invoice: (paymentId) => `${API_BASE}/payment/invoices/${paymentId}`,
    adminSummary: `${API_BASE}/payment/admin/summary`,
    adminPayments: `${API_BASE}/payment/admin/payments`,
    adminApprove: (paymentId) => `${API_BASE}/payment/admin/payments/${paymentId}/approve`,
    adminReject: (paymentId) => `${API_BASE}/payment/admin/payments/${paymentId}/reject`,
    adminFail: (paymentId) => `${API_BASE}/payment/admin/payments/${paymentId}/fail`,
  },
  growth: {
    dashboard: `${API_BASE}/growth/dashboard`,
    claimReferral: `${API_BASE}/growth/referral/claim`,
  },
  operator: {
    capabilities: `${API_BASE}/api/operator/capabilities`,
    workspace: `${API_BASE}/api/operator/workspace`,
    file: `${API_BASE}/api/operator/file`,
    execute: `${API_BASE}/api/operator/execute`,
    runs: `${API_BASE}/api/operator/runs`,
    run: (runId) => `${API_BASE}/api/operator/runs/${runId}`,
    runEvents: (runId) => `${API_BASE}/api/operator/runs/${runId}/events`,
    command: `${API_BASE}/api/operator/command`,
  },
  subscription: {
    checkout: `${API_BASE}/payment/stripe/checkout`,
    cryptoConfirm: `${API_BASE}/payment/crypto/verify`,
    cryptoCreate: `${API_BASE}/payment/crypto/create`,
    plans: `${API_BASE}/payment/config`,
  },
};

export { normalizeBaseUrl };
