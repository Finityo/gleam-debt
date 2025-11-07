// ===================================
// src/components/ScenarioChart.tsx
// ===================================
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Debt, UserSettings, DebtPlan } from "@/lib/computeDebtPlan";
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
      <h2 className="text-lg font-semibold mb-2">
        Scenario Comparison (Months)
      </h2>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(v) => Math.round(Number(v))} />
          <Legend />
          <Bar dataKey="months" fill="#000000" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
