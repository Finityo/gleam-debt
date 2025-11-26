import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Btn } from "@/components/Btn";
import { Lightbulb } from "lucide-react";
import type { PlanResult } from "@/engine/plan-types";
import { useUpgrade } from "@/hooks/useUpgrade";

export default function CoachDrawer({ plan }: { plan: PlanResult | null }) {
  const [open, setOpen] = useState(false);
  const { upgrade, loading } = useUpgrade();

  if (!plan) return null;

  const insights = [];
  const monthsToFree = plan.totals.monthsToDebtFree;
  const totalInterest = plan.totals.interest || plan.totalInterest || 0;
  const totalPaid = (plan.totals.principal + plan.totals.interest) || plan.totalPaid || 0;

  if (monthsToFree < 24) {
    insights.push("Good work — you're on track to be debt-free in under 2 years.");
  } else {
    insights.push("Consider adding an extra $25–$50/month to shorten your timeline.");
  }

  if (totalInterest > totalPaid * 0.4) {
    insights.push("High interest load — Avalanche may help reduce total cost.");
  }

  return (
    <>
      <Btn
        variant="subtle"
        className="fixed bottom-4 right-4 bg-card border border-border shadow-lg"
        onClick={() => setOpen(true)}
      >
        <Lightbulb className="w-5 h-5 mr-2" /> Coach
      </Btn>

      <Drawer open={open} onOpenChange={setOpen}>
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-finityo-textMain">
            Coach Suggestions
          </h2>

          <ul className="space-y-3 text-sm text-finityo-textBody">
            {insights.map((x, i) => (
              <li key={i} className="p-3 rounded-lg bg-secondary/20 border border-border">
                {x}
              </li>
            ))}
          </ul>

          <div className="pt-4 space-y-3">
            <Btn
              variant="cta"
              className="w-full"
              onClick={() => {
                setOpen(false);
                upgrade("ultimate");
              }}
              disabled={loading}
            >
              {loading ? "Loading..." : "Unlock Ultimate — $4.99/mo"}
            </Btn>

            <Btn variant="outline" className="w-full" onClick={() => setOpen(false)}>
              Close
            </Btn>
          </div>
        </div>
      </Drawer>
    </>
  );
}
