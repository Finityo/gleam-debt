// =======================================================
// src/pages/Index.tsx  (Hero v2 — iOS-style glass + gradients)
// =======================================================
import { PageShell } from "@/components/PageShell";
import { Btn } from "@/components/Btn";
import { HeroBG } from "@/components/HeroBG";
import { FAQSection } from "@/components/landing/FAQSection";
import { EmailSignup } from "@/components/landing/EmailSignup";
import { FinalCTA } from "@/components/landing/FinalCTA";

export default function Index() {
  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <HeroBG />

        <div className="mx-auto max-w-6xl px-4 pt-20 pb-24 text-center">
          {/* App icon */}
          <div className="mx-auto mb-6 h-28 w-28 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] shadow-[var(--shadow-glow)] grid place-items-center border border-[hsl(var(--glass-border))] backdrop-blur-[12px] animate-fade-in">
            <img
              src="/finityo-icon-final.png"
              alt="Finityo"
              className="h-14 w-14 rounded-lg"
            />
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[hsl(var(--foreground))] animate-fade-in">
            Debt Simplified.
          </h1>

          {/* Subtitle */}
          <p className="mt-4 mx-auto max-w-2xl text-[hsl(var(--muted-foreground))] text-base md:text-lg animate-fade-in">
            Visualize your journey to debt freedom with clarity, strategy, and a little AI assist.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <a href="/auth" className="w-full sm:w-auto">
              <Btn variant="cta" className="w-full h-12 text-base shadow-[var(--shadow-accent)]">
                Start Free
              </Btn>
            </a>
            <a href="/setup/start" className="w-full sm:w-auto">
              <Btn variant="outline" className="w-full h-12 text-base border-[hsl(var(--border))] hover:bg-white/5">
                🚀 Try the Setup
              </Btn>
            </a>
          </div>

          {/* Quick value badges */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
            <div className="rounded-xl border border-[hsl(var(--glass-border))] bg-white/5 backdrop-blur-[12px] px-4 py-3 text-sm text-[hsl(var(--finityo-textBody))]">
              Bank Sync (Plaid) on Ultimate
            </div>
            <div className="rounded-xl border border-[hsl(var(--glass-border))] bg-white/5 backdrop-blur-[12px] px-4 py-3 text-sm text-[hsl(var(--finityo-textBody))]">
              Snowball & Avalanche Plans
            </div>
            <div className="rounded-xl border border-[hsl(var(--glass-border))] bg-white/5 backdrop-blur-[12px] px-4 py-3 text-sm text-[hsl(var(--finityo-textBody))]">
              Share, Notes, Badges, Export
            </div>
          </div>

          {/* Pricing strip */}
          <div className="mt-12 inline-flex items-center gap-3 rounded-full border border-[hsl(var(--glass-border))] bg-white/5 px-4 py-2 text-xs text-[hsl(var(--finityo-textBody))] backdrop-blur-[12px] animate-fade-in">
            <span className="font-semibold text-white">Pricing:</span>
            <span>Essentials $2.99/mo</span>
            <span>•</span>
            <span>Ultimate $4.99/mo</span>
            <a href="/pricing" className="underline underline-offset-4 hover:text-white">See details</a>
          </div>
        </div>

        {/* Feature cards row */}
        <div className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard
              title="Plan"
              desc="Enter your debts, add extra payments, pick Snowball or Avalanche."
            />
            <FeatureCard
              title="Track"
              desc="See your payoff calendar, totals, and monthly progress."
            />
            <FeatureCard
              title="Act"
              desc="Sync balances (Ultimate), export, share, and get coach tips."
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Email Signup */}
      <EmailSignup />

      {/* Final CTA */}
      <FinalCTA />
    </PageShell>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-[hsl(var(--card))]/80 backdrop-blur-[12px] p-6 text-left shadow-[var(--shadow-glass)]">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-[hsl(var(--finityo-textBody))]">{desc}</p>
    </div>
  );
}
