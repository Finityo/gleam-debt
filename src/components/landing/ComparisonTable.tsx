import { Check, X } from "lucide-react";

interface Feature {
  name: string;
  essentials: boolean;
  ultimate: boolean;
  tooltip?: string;
}

const features: Feature[] = [
  { name: "Snowball payoff strategy", essentials: true, ultimate: true },
  { name: "Avalanche payoff strategy", essentials: true, ultimate: true },
  { name: "Unlimited debts", essentials: true, ultimate: true },
  { name: "Calendar view", essentials: true, ultimate: true },
  { name: "Export tools (CSV, PDF)", essentials: true, ultimate: true },
  { name: "Progress tracking", essentials: true, ultimate: true },
  { name: "Notes & tags", essentials: true, ultimate: true },
  { name: "Share/Export plan", essentials: true, ultimate: true },
  { name: "Secure cloud backup", essentials: true, ultimate: true },
  { name: "AI insights & coaching", essentials: false, ultimate: true },
  { name: "Plaid bank sync", essentials: false, ultimate: true },
  { name: "Advanced coaching tools", essentials: false, ultimate: true },
  { name: "Pace monitor", essentials: false, ultimate: true },
  { name: "Milestones & celebrations", essentials: false, ultimate: true },
  { name: "Priority support", essentials: false, ultimate: true },
];

export const ComparisonTable = () => {
  return (
    <section className="w-full py-20 px-4 bg-gradient-to-b from-background to-background/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-finityo-textMain mb-4">
            Compare Plans
          </h2>
          <p className="text-lg text-finityo-textBody max-w-2xl mx-auto">
            Choose the plan that matches your debt freedom goals
          </p>
        </div>

        <div className="glass rounded-2xl border border-border/50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="grid grid-cols-3 gap-4 p-6 bg-white/5 border-b border-border/50">
            <div className="text-finityo-textBody font-semibold">Feature</div>
            <div className="text-center">
              <div className="text-finityo-textMain font-bold text-lg">Essentials</div>
              <div className="text-finityo-textBody text-sm">$2.99/mo</div>
            </div>
            <div className="text-center">
              <div className="text-finityo-textMain font-bold text-lg">Ultimate</div>
              <div className="text-finityo-textBody text-sm">$4.99/mo</div>
            </div>
          </div>

          {/* Features */}
          <div className="divide-y divide-border/30">
            {features.map((feature, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-4 p-4 hover:bg-white/5 transition-colors"
              >
                <div className="text-finityo-textBody text-sm flex items-center">
                  {feature.name}
                </div>
                <div className="flex justify-center items-center">
                  {feature.essentials ? (
                    <Check className="w-5 h-5 text-accent" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex justify-center items-center">
                  {feature.ultimate ? (
                    <Check className="w-5 h-5 text-accent" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground/30" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="p-6 bg-white/5 border-t border-border/50 text-center">
            <p className="text-sm text-finityo-textBody">
              All plans include secure checkout powered by Stripe • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
