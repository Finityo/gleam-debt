import React from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";

const PricingNew: React.FC = () => {
  const navigate = useNavigate();

  const tiers = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      tagline: "Start organizing your debts.",
      highlights: [
        "Manual debt entry",
        "Basic payoff projection",
        "Goals and milestones",
        "Printable summaries"
      ],
      cta: "Use Free Plan"
    },
    {
      id: "essentials",
      name: "Essentials",
      price: "$4.99",
      tagline: "Smarter payoff with visibility.",
      highlights: [
        "Everything in Free",
        "What-If calculator",
        "Heat map & Pace Monitor",
        "Insights and basic alerts"
      ],
      cta: "Upgrade to Essentials"
    },
    {
      id: "ultimate",
      name: "Ultimate",
      price: "$9.99",
      tagline: "Full intelligence and coaching.",
      highlights: [
        "Everything in Essentials",
        "Ask-The-Coach chat",
        "Deep insights & streaks",
        "Advanced milestones and share cards"
      ],
      cta: "Go Ultimate"
    }
  ];

  const handleSelect = (planId: string) => {
    console.log("Selected plan:", planId);
    navigate("/dashboard");
  };

  return (
    <PageShell>
      <div className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Choose your Finityo plan
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              Start free. Upgrade only when you&apos;re ready for more firepower.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`flex flex-col justify-between rounded-3xl border bg-card p-4 text-xs shadow-lg md:p-5 ${
                  tier.id === "ultimate"
                    ? "border-amber-500/70"
                    : tier.id === "essentials"
                    ? "border-cyan-500/60"
                    : "border-border"
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-foreground">{tier.name}</div>
                  <div className="mt-1 text-lg font-semibold">{tier.price}</div>
                  <div className="text-[11px] text-muted-foreground">{tier.tagline}</div>
                  <ul className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                    {tier.highlights.map((h) => (
                      <li key={h} className="flex gap-1">
                        <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleSelect(tier.id)}
                    className={`w-full rounded-xl border px-3 py-1.5 text-[11px] font-semibold ${
                      tier.id === "ultimate"
                        ? "border-amber-400/80 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30"
                        : tier.id === "essentials"
                        ? "border-cyan-400/80 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
                        : "border-border bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {tier.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default PricingNew;
