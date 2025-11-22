// ===================================
// src/components/ScenarioChart.tsx
// ===================================
import React from "react";
import type { DebtInput } from "@/lib/debtPlan";
import { scenarioCompareWithMilestones } from "@/lib/scenarioCompareMilestones";

type Props = {
  debts: DebtInput[];
  settings: {
    strategy?: "snowball" | "avalanche";
    extraMonthly?: number;
    oneTimeExtra?: number;
    startDate?: string;
    maxMonths?: number;
  };
};

export default function ScenarioChart({ debts, settings }: Props) {
  const { snowball, avalanche, minimum, milestones } = scenarioCompareWithMilestones(debts, settings);

  const findHalfway = (msArr: any[]) => {
    return msArr.find((m) => m.label === "50% Remaining");
  };

  const half = {
    snowball: findHalfway(milestones.snowball),
    avalanche: findHalfway(milestones.avalanche),
    minimum: null,
  };

  const data = [
    {
      name: "Snowball",
      months: snowball.totals.monthsToDebtFree ?? snowball.months.length,
      interest: snowball.totals.interest,
      half: half.snowball?.monthIndex != null ? half.snowball.monthIndex + 1 : null,
    },
    {
      name: "Avalanche",
      months: avalanche.totals.monthsToDebtFree ?? avalanche.months.length,
      interest: avalanche.totals.interest,
      half: half.avalanche?.monthIndex != null ? half.avalanche.monthIndex + 1 : null,
    },
    {
      name: "Minimum",
      months: minimum.totals.monthsToDebtFree ?? minimum.months.length,
      interest: minimum.totals.interest,
      half: null,
    },
  ];

  return (
    <div className="p-4 border border-border/40 rounded-2xl glass">
      <h2 className="text-lg font-semibold mb-3">Scenario Comparison</h2>

      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.name}>
            █ <strong>{item.name}</strong> {item.months} months
            <span className="text-sm text-gray-500 ml-3">
              → Mid: {item.half ?? "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
