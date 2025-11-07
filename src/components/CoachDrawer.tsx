import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Btn } from "@/components/Btn";
import { Lightbulb } from "lucide-react";
import { DebtPlan } from "@/lib/computeDebtPlan";

export default function CoachDrawer({ plan }: { plan: DebtPlan | null }) {
  const [open, setOpen] = useState(false);

  if (!plan) return null;

  const insights = [];
  const monthsToFree = plan.summary.finalMonthIndex + 1;

  if (monthsToFree < 24) {
    insights.push("Good work — you're on track to be debt-free in under 2 years.");
  } else {
    insights.push("Consider adding an extra $25–$50/month to shorten your timeline.");
  }

  if (plan.totalInterest > plan.totalPaid * 0.4) {
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

          <Btn variant="cta" className="w-full mt-4" onClick={() => setOpen(false)}>
            Close
          </Btn>
        </div>
      </Drawer>
    </>
  );
}
