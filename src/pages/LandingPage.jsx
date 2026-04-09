import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Bot, CheckCircle2, Monitor, ShieldCheck, Zap } from 'lucide-react';
import Logo from '../components/ui/Logo';
import {
  AGENT_STEPS,
  LANDING_CAPABILITIES,
  NOVA_PLATFORM,
  PAYMENT_METHODS,
  PLAN_PREVIEWS,
  PLATFORM_PANELS,
} from '../content/novaMindContent';

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const referralCode = useMemo(
    () => (searchParams.get('ref') || '').trim().toUpperCase(),
    [searchParams]
  );

  useEffect(() => {
    if (!referralCode || typeof window === 'undefined') return;
    window.localStorage.setItem('nova-referral-code', referralCode);
  }, [referralCode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('auth_token');
    if (token) {
      window.location.href = '/dashboard';
    }
  }, []);

  const hasToken =
    typeof window !== 'undefined' && Boolean(window.localStorage.getItem('auth_token'));

  return (
    <div className="dark">
      <div className="app-shell min-h-screen text-white">
        <header className="page-header border-b border-white/10">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
            <Logo size="sm" />

            <div className="flex items-center gap-3">
              <Link to="/pricing" className="btn-ghost text-slate-200">
                Pricing
              </Link>
              {hasToken ? (
                <>
                  <Link to="/dashboard" className="btn-secondary">
                    Dashboard
                  </Link>
                  <Link to="/chat" className="btn-primary">
                    Open workspace
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary">
                    Sign in
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Start now
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
          <section className="surface relative overflow-hidden rounded-[38px] p-6 sm:p-8 lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(167,139,250,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_26%)] blur-2xl" />

            <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_420px] xl:items-end">
              <div className="max-w-[780px]">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-100 sm:text-[11px]">
                  <Bot className="h-3.5 w-3.5 text-cyan-200" />
                  {NOVA_PLATFORM.hero.badge}
                </div>

                <h1 className="mt-7 max-w-[820px] text-[46px] font-semibold leading-[0.95] tracking-[-0.065em] text-white sm:text-[64px] lg:text-[72px] xl:text-[78px]">
                  <span className="block">Not just AI.</span>
                  <span className="block bg-[linear-gradient(135deg,#f8fafc_0%,#dbeafe_42%,#67e8f9_100%)] bg-clip-text pb-1 text-transparent [text-shadow:0_0_18px_rgba(34,211,238,0.08)]">
                    Your digital brain.
                  </span>
                </h1>

                <p className="mt-6 max-w-[640px] text-[18px] font-medium leading-8 tracking-[-0.025em] text-slate-100 sm:text-[22px] sm:leading-9">
                  {NOVA_PLATFORM.hero.subtitle}
                </p>

                <p className="mt-4 max-w-[700px] text-[15px] leading-8 text-slate-400 sm:text-[16px]">
                  {NOVA_PLATFORM.hero.description}
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  {NOVA_PLATFORM.hero.chips.map((tag) => (
                    <div
                      key={tag}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-slate-200 shadow-[0_12px_32px_rgba(15,23,42,0.18)]"
                    >
                      <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                      {tag}
                    </div>
                  ))}
                </div>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link to={hasToken ? '/chat' : '/register'} className="btn-primary">
                    {hasToken ? 'Open workspace' : NOVA_PLATFORM.hero.ctaPrimary}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/pricing" className="btn-secondary">
                    {NOVA_PLATFORM.hero.ctaSecondary}
                  </Link>
                </div>

                <p className="mt-6 max-w-[620px] text-sm leading-7 text-slate-400">
                  Start with fast chat access, then move into Coding and Agent Mode as your workflow gets more ambitious.
                </p>

                {referralCode && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
                    Referral code saved. Continue to unlock perks after sign-in.
                  </div>
                )}
              </div>

              <div className="surface-soft rounded-[30px] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Elite Ultra Agent</div>
                    <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-white">
                      A self-operating system for high-trust execution
                    </h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(56,189,248,0.22),rgba(168,85,247,0.16))] text-cyan-100 shadow-[0_16px_34px_rgba(56,189,248,0.16)]">
                    <Bot className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <StatusCard
                    icon={Monitor}
                    title="Desktop control center"
                    body="Heavy work, file-aware tasks, deep execution, and premium workspace flow live here."
                  />
                  <StatusCard
                    icon={ShieldCheck}
                    title="Permission-aware runtime"
                    body="Planning and safety control happen before sensitive actions move forward."
                  />
                  {AGENT_STEPS.map((step, index) => (
                    <div
                      key={step}
                      className="rounded-[20px] border border-white/10 bg-[#020617]/40 px-4 py-3 text-sm leading-7 text-slate-200"
                    >
                      <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold text-cyan-100">
                        {index + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[22px] border border-emerald-300/18 bg-emerald-400/10 px-4 py-4 text-sm leading-7 text-emerald-100">
                  Pro Agent is where NOVA stops feeling like chat software and starts acting like an operator system.
                </div>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <SectionIntro
              eyebrow="Capability stack"
              title="A premium AI workspace built like an operating system"
              body="Everything is structured around execution: language understanding, legal awareness, planning, permissions, automation, and serious production work."
            />

            <div className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {LANDING_CAPABILITIES.map((item) => {
                const Icon = item.icon;

                return (
                  <article key={item.title} className="surface rounded-[28px] p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Core feature</div>
                        <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.03em] text-white">{item.title}</h2>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/10 text-cyan-100 shadow-[0_14px_28px_rgba(56,189,248,0.14)]">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-300">{item.description}</p>

                    <div className="mt-5 space-y-3">
                      {item.bullets.map((bullet) => (
                        <div key={bullet} className="flex items-start gap-3 text-sm leading-7 text-slate-200">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-10">
            <SectionIntro
              eyebrow="Platform behavior"
              title="Desktop gets the full power control center. Mobile stays light."
              body="NOVA MIND AI is deliberately split by context so heavy work feels premium on desktop while mobile stays fast and lightweight."
            />

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              {PLATFORM_PANELS.map((panel) => {
                const Icon = panel.icon;

                return (
                  <article key={panel.title} className="surface rounded-[30px] p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">System mode</div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/10 text-cyan-100 shadow-[0_14px_28px_rgba(56,189,248,0.14)]">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <h3 className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-white">{panel.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{panel.description}</p>

                    <div className="mt-5 space-y-3">
                      {panel.bullets.map((bullet) => (
                        <div key={bullet} className="rounded-[18px] border border-white/10 bg-[#020617]/34 px-4 py-3 text-sm leading-7 text-slate-200">
                          {bullet}
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
            <div className="surface rounded-[30px] p-6 sm:p-7">
              <SectionIntro
                eyebrow="Payment system"
                title="Premium checkout without the clutter"
                body="Global users can upgrade with USD card, USDT auto verification, or BDT card gateway flow through one clean billing system."
              />

              <div className="mt-6 grid gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;

                  return (
                    <div key={method.title} className="rounded-[22px] border border-white/10 bg-[#020617]/36 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-100">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-white">{method.title}</div>
                            <div className="rounded-full border border-white/10 bg-white/8 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                              {method.meta}
                            </div>
                          </div>
                          <div className="mt-2 text-sm leading-6 text-slate-300">{method.body}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="surface rounded-[30px] p-6 sm:p-7">
              <SectionIntro
                eyebrow="Pricing plans"
                title="From fast chat to full AI operator mode"
                body="Each plan is tuned for more speed, more context, and a stronger execution environment."
              />

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {PLAN_PREVIEWS.map((plan) => (
                  <div
                    key={plan.name}
                    className={`rounded-[24px] border px-4 py-4 transition duration-300 hover:-translate-y-1 ${
                      plan.name === 'Elite Ultra'
                        ? 'border-amber-300/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.16),rgba(15,23,42,0.62))] shadow-[0_18px_38px_rgba(245,158,11,0.14)]'
                        : plan.name === 'Pro Agent'
                          ? 'border-cyan-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.16),rgba(15,23,42,0.6))] shadow-[0_18px_38px_rgba(56,189,248,0.16)]'
                          : 'border-white/10 bg-[#020617]/34 shadow-[0_14px_30px_rgba(15,23,42,0.16)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-base font-semibold text-white">{plan.name}</div>
                      <div className="text-sm font-semibold text-cyan-100">{plan.price}</div>
                    </div>
                    <div className="mt-3 text-sm leading-7 text-slate-300">{plan.tone}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link to="/pricing" className="btn-primary">
                  Explore pricing
                </Link>
                <Link to={hasToken ? '/chat' : '/register'} className="btn-secondary">
                  Start building
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-10 surface rounded-[34px] p-6 text-center sm:p-8">
            <div className="mx-auto max-w-[860px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                <Zap className="h-3.5 w-3.5 text-cyan-200" />
                Final CTA
              </div>
              <h2 className="mt-5 text-[34px] font-semibold tracking-[-0.05em] text-white sm:text-[48px]">
                This is not software. This is your business engine.
              </h2>
              <p className="mt-4 text-[16px] leading-8 text-slate-300">
                Move from conversation to execution with a workspace designed for intelligent decisions, automation, and serious work.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to={hasToken ? '/chat' : '/register'} className="btn-primary">
                  Start building now
                </Link>
                <Link to="/pricing" className="btn-secondary">
                  Upgrade anytime
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SectionIntro({ eyebrow, title, body }) {
  return (
    <div className="max-w-[860px]">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{eyebrow}</div>
      <h2 className="mt-3 text-[32px] font-semibold tracking-[-0.04em] text-white sm:text-[40px]">{title}</h2>
      <p className="mt-4 text-[15px] leading-8 text-slate-300">{body}</p>
    </div>
  );
}

function StatusCard({ icon: Icon, title, body }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#020617]/40 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-100">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-1 text-sm leading-6 text-slate-300">{body}</div>
        </div>
      </div>
    </div>
  );
}
