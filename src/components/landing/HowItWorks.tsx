import { Database, TrendingUp, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: Database,
    title: "Connect Your Accounts",
    description: "Import or sync debts via Plaid or manual entry. Get started in seconds with automatic data import or manual tracking.",
  },
  {
    icon: TrendingUp,
    title: "Choose Your Strategy",
    description: "Select from Snowball, Avalanche, or AI Hybrid strategies. Our intelligent engine finds the optimal payoff path for your situation.",
  },
  {
    icon: CheckCircle2,
    title: "Follow Your Personalized Plan",
    description: "Get an auto-updated plan with exact payoff dates and real-time progress tracking. Watch your debt disappear month by month.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="w-full py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-finityo-textMain mb-4">
            How It Works
          </h2>
          <p className="text-lg text-finityo-textBody max-w-2xl mx-auto">
            Your path to debt freedom in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="glass rounded-2xl p-8 hover:scale-105 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.4)]">
                    <Icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-finityo-textMain mb-3">
                  {step.title}
                </h3>
                <p className="text-finityo-textBody leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <a
            href="/setup/start"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold hover:scale-105 transition-all duration-300 shadow-[0_0_40px_hsl(var(--primary)/0.4)]"
          >
            Start Your Free Plan
          </a>
        </div>
      </div>
    </section>
  );
};
