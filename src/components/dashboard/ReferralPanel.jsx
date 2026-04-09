import { Copy, Gift, Link2, Loader2, Send } from 'lucide-react';

export default function ReferralPanel({
  referral,
  claimCode,
  onClaimCodeChange,
  onClaim,
  onCopyCode,
  onCopyLink,
  isClaiming = false,
}) {
  return (
    <section className="workspace-panel rounded-[28px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Referral system
          </div>
          <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
            Share the workspace. Earn reward.
          </h2>
          <p className="mt-3 max-w-[620px] text-sm leading-7 text-slate-600 dark:text-slate-400">
            Each paid conversion adds reward value to the account and compounds the growth loop over time.
          </p>
        </div>

        <div className="workspace-card-icon">
          <Gift className="h-[18px] w-[18px]" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Your code
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base font-semibold tracking-[0.22em] text-white">
              {referral?.referral_code || 'NOVA'}
            </div>
            <button type="button" onClick={onCopyCode} className="btn-secondary">
              <Copy className="h-4 w-4" />
              Copy code
            </button>
          </div>

          <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Referral link
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
              {referral?.referral_link}
            </div>
            <button type="button" onClick={onCopyLink} className="btn-primary whitespace-nowrap">
              <Link2 className="h-4 w-4" />
              Copy link
            </button>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Claim code
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
            If a user invited you, attach the code here once and keep the account inside the growth funnel.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <input
              value={claimCode}
              onChange={(event) => onClaimCodeChange(event.target.value.toUpperCase())}
              placeholder="Enter referral code"
              className="input-field"
            />
            <button type="button" onClick={onClaim} className="btn-secondary w-full justify-center" disabled={isClaiming}>
              {isClaiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isClaiming ? 'Attaching code' : 'Attach code'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
