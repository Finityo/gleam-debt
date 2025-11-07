import { PageShell } from "@/components/PageShell";
import { Btn } from "@/components/Btn";
import { Card } from "@/components/Card";
import { SEOHead } from "@/components/SEOHead";

export default function Index() {
  return (
    <PageShell>
      <SEOHead 
        title="Home - Finityo Debt Payoff Calculator" 
        description="Take control of your debt with Finityo's intelligent payoff calculator. Visualize your path to financial freedom."
      />
      
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-12 text-center">
        <div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-finityo-primary to-finityo-primaryAccent rounded-2xl flex items-center justify-center">
          <span className="text-4xl font-bold text-black">F</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-finityo-textMain">
          Debt Simplified.
        </h1>

        <p className="mt-4 max-w-xl mx-auto text-finityo-textBody">
          Finityo helps you visualize your journey to debt freedom with clarity, strategy, and a little bit of AI magic.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <a href="/demo/start">
            <Btn variant="primary" className="bg-finityo-cta text-black shadow-glass">
              🚀 Try the Demo
            </Btn>
          </a>
          <a href="/pricing">
            <Btn variant="outline" className="bg-transparent border border-finityo-textBody text-finityo-textBody hover:text-white">
              Learn More
            </Btn>
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Essentials — $2.99/mo" className="bg-white/5 backdrop-blur border border-white/10">
            <ul className="text-sm list-disc pl-5 space-y-1 text-finityo-textBody">
              <li>Save your payoff plan</li>
              <li>Share link</li>
              <li>Export</li>
            </ul>
          </Card>

          <Card title="Ultimate — $4.99/mo" className="bg-white/5 backdrop-blur border border-white/10">
            <ul className="text-sm list-disc pl-5 space-y-1 text-finityo-textBody">
              <li>Bank sync (Plaid)</li>
              <li>Coach Mode</li>
              <li>Notes + History</li>
              <li>Everything in Essentials</li>
            </ul>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
