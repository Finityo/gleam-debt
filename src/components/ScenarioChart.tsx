// ===================================
// src/components/ScenarioChart.tsx
// ===================================
import React from "react";
import { Debt, UserSettings } from "@/lib/computeDebtPlan";
import { scenarioCompare } from "@/lib/scenarioCompare";

type Props = {
  debts: Debt[];
  settings: UserSettings;
};

export default function ScenarioChart({ debts, settings }: Props) {
  const { snowball, avalanche, minimum } = scenarioCompare(debts, settings);

  const data = [
    {
      name: "Snowball",
      months: snowball.summary.finalMonthIndex + 1,
      interest: snowball.totalInterest,
    },
    {
      name: "Avalanche",
      months: avalanche.summary.finalMonthIndex + 1,
      interest: avalanche.totalInterest,
    },
    {
      name: "Minimum",
      months: minimum.summary.finalMonthIndex + 1,
      interest: minimum.totalInterest,
    },
  ];

  return (
    <div className="p-4 border rounded bg-white">
      <h2 className="text-lg font-semibold mb-3">Scenario Comparison</h2>

      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.name}>
            <strong>{item.name}:</strong> {item.months} months
          </div>
        ))}
      </div>
    </div>
  );
}
