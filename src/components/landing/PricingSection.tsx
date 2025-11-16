import { Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const pricingPlans = [
  {
    id: "essentials",
    name: "Essentials",
    price: "2.99",
    description: "Perfect for getting started with debt payoff",
    features: [
      "Snowball & Avalanche strategies",
      "Unlimited debts",
      "Calendar view",
      "Basic insights",
      "Export tools",
      "Progress tracking",
    ],
    popular: false,
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: "4.99",
    description: "Complete debt freedom toolkit with AI insights",
    features: [
      "Everything in Essentials",
      "Plaid automatic sync",
      "AI insights & coaching",
      "Advanced coaching tools",
      "Pace monitor",
      "Share features",
      "Milestones & achievements",
      "Priority support",
    ],
    popular: true,
  },
];

export const PricingSection = () => {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <section className="w-full py-20 px-4 bg-gradient-to-b from-background/50 to-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-finityo-textMain mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-finityo-textBody max-w-2xl mx-auto">
            Choose the plan that fits your needs. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative glass rounded-2xl p-8 transition-all duration-300 ${
                hoveredPlan === plan.id ? "scale-105" : ""
              } ${
                plan.popular
                  ? "border-2 border-primary shadow-[0_0_60px_hsl(var(--primary)/0.4)]"
                  : "border border-border/50"
              }`}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-finityo-textMain mb-2">
                  {plan.name}
                </h3>
                <p className="text-finityo-textBody text-sm mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-finityo-textMain">
                    ${plan.price}
                  </span>
                  <span className="text-finityo-textBody">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-finityo-textBody text-sm">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => navigate("/pricing")}
                variant={plan.popular ? "default" : "outline"}
                className="w-full h-12 text-base font-semibold"
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-finityo-textBody">
          <p>All plans include secure checkout powered by Stripe</p>
          <p className="mt-2">Cancel anytime from your account settings</p>
        </div>
      </div>
    </section>
  );
};
