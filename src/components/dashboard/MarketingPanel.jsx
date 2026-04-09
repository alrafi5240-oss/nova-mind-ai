import { PlayCircle, RadioTower, Rocket } from 'lucide-react';

export default function MarketingPanel({
  hooks,
  campaigns,
  facebookAds,
  facebookVideoScripts,
  reelsScripts,
  youtubeAd,
  onboarding,
  monetizationFlow,
  conversionSystem,
  launchSystem,
  retentionSystem,
}) {
  return (
    <div className="grid gap-4">
      <section className="workspace-panel rounded-[28px] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Launch hooks
            </div>
            <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
              Messaging built for conversion
            </h2>
          </div>
          <div className="workspace-card-icon">
            <Rocket className="h-[18px] w-[18px]" />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {hooks.map((hook) => (
            <div key={hook} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
              {hook}
            </div>
          ))}
        </div>
      </section>

      <section className="workspace-panel rounded-[28px] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Traffic system
            </div>
            <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
              Acquisition plan with realistic budget control
            </h2>
          </div>
          <div className="workspace-card-icon">
            <RadioTower className="h-[18px] w-[18px]" />
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {campaigns.map((campaign) => (
            <div key={campaign.channel} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-slate-950 dark:text-white">{campaign.channel}</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-slate-200">Budget:</span> {campaign.budget}
                </div>
                <div className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-slate-200">Audience:</span> {campaign.audience}
                </div>
                <div className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-slate-200">Regions:</span> {campaign.regions}
                </div>
                <div className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-slate-200">Goal:</span> {campaign.goal}
                </div>
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-900 dark:text-slate-200">Creative:</span> {campaign.creative}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="workspace-panel rounded-[28px] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Ads system
            </div>
            <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
              Paid acquisition assets
            </h2>
          </div>
          <div className="workspace-card-icon">
            <RadioTower className="h-[18px] w-[18px]" />
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {facebookAds.map((ad) => (
            <div key={ad.title} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {ad.title}
              </div>
              <div className="mt-2 text-base font-semibold text-slate-950 dark:text-white">{ad.hook}</div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{ad.body}</p>
              <div className="mt-3 text-sm font-medium text-cyan-200">{ad.cta}</div>
            </div>
          ))}

          <div className="grid gap-4 lg:grid-cols-3">
            {facebookVideoScripts.map((script) => (
              <div key={script.title} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-slate-950 dark:text-white">{script.title}</div>
                <div className="mt-2 text-sm font-medium text-cyan-200">{script.hook}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {script.audience}
                </div>
                <div className="mt-3 space-y-2">
                  {script.flow.map((line) => (
                    <div key={line} className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="workspace-panel rounded-[28px] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Video scripts
            </div>
            <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
              Reels + YouTube storytelling
            </h2>
          </div>
          <div className="workspace-card-icon">
            <PlayCircle className="h-[18px] w-[18px]" />
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {reelsScripts.map((script) => (
            <div key={script.title} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-slate-950 dark:text-white">{script.title}</div>
              <div className="mt-3 space-y-2">
                {script.flow.map((line) => (
                  <div key={line} className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-950 dark:text-white">{youtubeAd.title}</div>
            <div className="mt-3 space-y-2">
              {youtubeAd.lines.map((line) => (
                <div key={line} className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="workspace-panel rounded-[28px] p-5 sm:p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Conversion system
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-950 dark:text-white">Landing CTA</div>
            <div className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              <div>{conversionSystem.landing.headline}</div>
              <div className="mt-2 font-medium text-slate-900 dark:text-slate-200">
                Primary: {conversionSystem.landing.primaryCta}
              </div>
              <div className="font-medium text-slate-900 dark:text-slate-200">
                Secondary: {conversionSystem.landing.secondaryCta}
              </div>
            </div>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-950 dark:text-white">Pricing psychology</div>
            <div className="mt-3 space-y-2">
              {conversionSystem.pricingPsychology.map((item) => (
                <div key={item} className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-950 dark:text-white">Upgrade triggers</div>
            <div className="mt-3 space-y-2">
              {conversionSystem.upgradeTriggers.map((item) => (
                <div key={item} className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="workspace-panel rounded-[28px] p-5 sm:p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Retention loop
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-950 dark:text-white">Onboarding</div>
            <div className="mt-3 space-y-2">
              {onboarding.map((item) => (
                <div key={item} className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-950 dark:text-white">Revenue flow</div>
            <div className="mt-3 space-y-2">
              {monetizationFlow.map((item) => (
                <div key={item} className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-950 dark:text-white">Retention system</div>
            <div className="mt-3 space-y-2">
              {retentionSystem.map((item) => (
                <div key={item} className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="workspace-panel rounded-[28px] p-5 sm:p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Launch strategy
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-950 dark:text-white">Soft launch</div>
            <div className="mt-3 space-y-2">
              {launchSystem.softLaunch.map((item) => (
                <div key={item} className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-950 dark:text-white">First 100 users</div>
            <div className="mt-3 space-y-2">
              {launchSystem.first100Users.map((item) => (
                <div key={item} className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-950 dark:text-white">Beta system</div>
            <div className="mt-3 space-y-2">
              {launchSystem.betaSystem.map((item) => (
                <div key={item} className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
