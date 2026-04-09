import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthProviderButton from '../components/auth/AuthProviderButton';
import Logo from '../components/ui/Logo';
import useAuthStore from '../store/authStore';

const PROVIDERS = [
  { id: 'google', label: 'Continue with Google' },
  { id: 'microsoft', label: 'Continue with Microsoft' },
  { id: 'apple', label: 'Continue with Apple' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    requestEmailOtp,
    verifyEmailOtp,
    loginWithGuest,
    getOAuthUrl,
    hasHydrated,
    isLoading,
    otpPreview,
  } = useAuthStore();

  const nextPath = useMemo(
    () => location.state?.from?.pathname || '/dashboard',
    [location.state]
  );

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    otp: '',
  });
  const [step, setStep] = useState('request');
  const [socialLoading, setSocialLoading] = useState('');
  const storedReferralCode = typeof window === 'undefined'
    ? ''
    : (window.localStorage.getItem('nova-referral-code') || '').trim().toUpperCase();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const error = new URLSearchParams(window.location.search).get('error');
    if (error) {
      toast.error(error);
      return;
    }

    const urlToken = new URLSearchParams(window.location.search).get('token');

    if (urlToken) {
      localStorage.setItem('auth_token', urlToken);
      localStorage.setItem('token', urlToken);
      console.log('TOKEN:', localStorage.getItem('auth_token'));
      window.location.href = '/dashboard';
      return;
    }

    const existingToken = localStorage.getItem('auth_token');
    console.log('TOKEN:', existingToken);

    if (existingToken) {
      window.location.href = '/dashboard';
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    console.log('TOKEN:', localStorage.getItem('auth_token'));
  }, []);

  useEffect(() => {
    document.title = 'NOVA MIND AI – Premium AI Workspace';
  }, []);

  if (!hasHydrated) {
    return null;
  }

  const handleRequestOtp = async (event) => {
    event.preventDefault();

    if (!form.email) {
      toast.error('Enter your email');
      return;
    }

    const result = await requestEmailOtp(form.email, form.fullName);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    setStep('verify');
    toast.success(result.otpPreview ? `OTP sent. Demo code: ${result.otpPreview}` : 'OTP sent to your email');
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (!form.email || !form.otp) {
      toast.error('Enter the OTP code');
      return;
    }

    const result = await verifyEmailOtp(form.email, form.otp, form.fullName);
    if (result.success) {
      toast.success('Welcome to NOVA MIND AI');
      navigate(nextPath, { replace: true });
    } else {
      toast.error(result.message);
    }
  };

  const handleSocialLogin = async (provider) => {
    setSocialLoading(provider);
    try {
      const authUrl = await getOAuthUrl(provider);
      if (!authUrl) {
        throw new Error('Authentication URL is unavailable.');
      }
      window.location.assign(authUrl);
    } catch (error) {
      toast.error(error?.response?.data?.detail || error?.message || `${provider} sign-in failed.`);
      setSocialLoading('');
    }
  };

  const handleGuestLogin = async () => {
    const result = await loginWithGuest(form.fullName);
    if (result.success) {
      toast.success('Guest workspace ready');
      navigate(nextPath, { replace: true });
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="app-shell auth-page-shell min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(79,172,254,0.24),transparent_24%),radial-gradient(circle_at_82%_22%,rgba(96,165,250,0.16),transparent_22%),radial-gradient(circle_at_52%_108%,rgba(34,211,238,0.16),transparent_30%),linear-gradient(145deg,#08111f_0%,#0f172a_48%,#0d4d68_100%)] opacity-100" />
        <div className="absolute left-[-8%] top-[12%] h-72 w-72 rounded-full bg-blue-400/18 blur-[120px]" />
        <div className="absolute right-[-10%] top-[22%] h-80 w-80 rounded-full bg-cyan-300/14 blur-[140px]" />
        <div className="absolute bottom-[-14%] left-[28%] h-96 w-96 rounded-full bg-violet-400/12 blur-[150px]" />
      </div>

      <div className="auth-page-frame relative z-10 mx-auto flex min-h-screen max-w-[1100px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="-mx-4 border-b border-white/[0.06] bg-white/[0.04] px-4 py-3 backdrop-blur-[10px] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex items-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <Logo size="nav" showText={false} />
              <span className="text-[14px] font-semibold tracking-[-0.01em] text-white">
                NOVA MIND AI
              </span>
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="grid w-full max-w-[980px] gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="hidden lg:block"
            >
              <div className="max-w-[420px]">
                <div className="relative inline-flex">
                  <span className="pointer-events-none absolute inset-[-26%] rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.34)_0%,rgba(34,211,238,0.16)_38%,rgba(168,85,247,0.12)_62%,transparent_78%)] blur-3xl" />
                  <div className="relative origin-left scale-[1.12]">
                    <Logo size="hero" showText={false} tone="light" className="w-fit" />
                  </div>
                </div>

                <h1 className="mt-9 text-3xl font-semibold tracking-[-0.055em] text-white">
                  Calm AI for focused minds
                </h1>

                <p className="mt-4 max-w-[360px] text-sm text-white/70">
                  A private AI workspace built for clarity, speed, and deep focus.
                </p>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.06, ease: 'easeOut' }}
              className="surface auth-login-card mx-auto w-full max-w-[360px] rounded-2xl border border-white/20 bg-white/70 p-6 shadow-xl backdrop-blur-lg sm:p-7 dark:bg-white/[0.08]"
            >
              <Logo size="md" showText={false} className="auth-center-logo mb-5 w-fit lg:hidden" />

              <div className="space-y-3">
                <div className="space-y-3">
                  <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
                    Sign in to NOVA MIND AI
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Access your workspace using social login or email.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-2.5">
                {PROVIDERS.map((provider) => (
                  <AuthProviderButton
                    key={provider.id}
                    provider={provider.id}
                    label={socialLoading === provider.id ? `Connecting ${provider.label.replace('Continue with ', '')}...` : provider.label}
                    onClick={() => void handleSocialLogin(provider.id)}
                    disabled={isLoading || Boolean(socialLoading)}
                    compact
                  />
                ))}
              </div>

              <div className="auth-or-divider my-6">
                <span>Email OTP</span>
              </div>

              {storedReferralCode && (
                <div className="mb-4 rounded-2xl border border-emerald-300/16 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-100 backdrop-blur-lg">
                  Referral code <span className="font-semibold">{storedReferralCode}</span> is ready and will attach after sign-in.
                </div>
              )}

              <form onSubmit={step === 'request' ? handleRequestOtp : handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-900/90 dark:text-slate-100">
                    Name
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    className="input-field"
                    placeholder="Name (optional)"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-900/90 dark:text-slate-100">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    className="input-field"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>

                {step === 'verify' && (
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                        OTP Code
                      </label>
                      {otpPreview && (
                        <span className="auth-status-pill">
                          Demo code: {otpPreview}
                        </span>
                      )}
                    </div>

                    <input
                      type="text"
                      value={form.otp}
                      onChange={(event) => setForm((current) => ({ ...current, otp: event.target.value }))}
                      className="input-field"
                      placeholder="Enter the 6-digit code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || Boolean(socialLoading)}
                  className="btn-primary auth-cta-button w-full justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>Get Started →</>
                  )}
                </button>
              </form>

              {step === 'verify' && (
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="mt-3 btn-secondary w-full justify-center py-3"
                >
                  Use a different email
                </button>
              )}

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => void handleGuestLogin()}
                  disabled={isLoading || Boolean(socialLoading)}
                  className="auth-guest-link"
                >
                  Continue as guest <span aria-hidden="true">→</span>
                </button>
              </div>
            </motion.section>
          </div>
        </main>

        <footer className="pb-5 pt-2 text-center text-[12px] text-white/50">
          ©️ 2026 NOVA MIND AI
        </footer>
      </div>
    </div>
  );
}
