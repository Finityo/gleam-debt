import { usePlanLive } from "../context/PlanContextLive";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function BadgesLive() {
  const { plan } = usePlanLive();

  if (!plan) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-finityo-textBody">
        No plan found — compute first to see badges.
      </div>
    );
  }

  // Generate simple milestone badges from plan
  const badges = [
    { label: "First Month Complete", monthIndex: 0 },
    { label: "25% to Freedom", monthIndex: Math.floor(plan.totals.monthsToDebtFree * 0.25) },
    { label: "Halfway There", monthIndex: Math.floor(plan.totals.monthsToDebtFree * 0.5) },
    { label: "75% Complete", monthIndex: Math.floor(plan.totals.monthsToDebtFree * 0.75) },
    { label: "Debt Free!", monthIndex: plan.totals.monthsToDebtFree },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-finityo-textMain mb-2">Achievements</h1>
      <p className="text-finityo-textBody mb-6">
        Milestones you'll unlock on your debt-free journey.
      </p>

      {badges.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-finityo-textMain">No badges yet</p>
          <p className="text-sm text-finityo-textBody mt-1">
            Complete your debt payoff plan to earn achievements
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {badges.map((badge, idx) => (
            <Card key={idx} className="p-4 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-finityo-textMain">{badge.label}</h3>
                <p className="text-sm text-finityo-textBody">
                  Month {badge.monthIndex + 1}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
