import React from "react";
import { DebtPlan } from "@/lib/computeDebtPlan";
import { comparePlans } from "@/lib/comparePlans";
import { Scenario } from "@/types/scenario";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  plan: DebtPlan;
  minOnlyPlan: DebtPlan;
  scenario: Scenario;
};

const scenarioLabels = {
  snowball: "Snowball Strategy 🏂",
  avalanche: "Avalanche Strategy 🏔️",
  minimum: "Minimum Only 💤",
};

export default function ComparisonCard({ plan, minOnlyPlan, scenario }: Props) {
  const c = comparePlans(plan, minOnlyPlan);

  if (scenario === "minimum") {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">Baseline Scenario</h2>
          <Badge variant="secondary">{scenarioLabels.minimum}</Badge>
        </div>
        <p className="text-muted-foreground">
          This scenario shows what happens if you only make minimum payments on all debts.
          Compare it with Snowball or Avalanche strategies to see how extra payments can save you time and money.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Strategy Comparison</h2>
        <Badge variant="default">{scenarioLabels[scenario]}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Your Strategy</p>
          <p className="text-xl font-semibold">{c.debtFreeDateReal}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {c.monthsReal} months
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Minimum Only</p>
          <p className="text-xl font-semibold">{c.debtFreeDateMin}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {c.monthsMin} months
          </p>
        </div>
      </div>

      <div className="pt-4 border-t space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Months Saved</span>
          <span className="text-lg font-bold text-green-600">
            {c.monthsSaved} months
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Interest Saved</span>
          <span className="text-lg font-bold text-green-600">
            ${c.interestSaved.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
        <div>
          <p className="text-muted-foreground">Total Interest (Your Strategy)</p>
          <p className="font-semibold">${c.interestReal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total Interest (Minimum)</p>
          <p className="font-semibold">${c.interestMin.toFixed(2)}</p>
        </div>
      </div>
    </Card>
  );
}
