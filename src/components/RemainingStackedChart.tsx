// ===================================
// src/components/RemainingStackedChart.tsx
// ===================================
import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DebtPlan, Debt } from "@/lib/computeDebtPlan";
import { remainingByCategory } from "@/lib/remainingByCategory";
import { CATEGORY_COLORS } from "@/lib/categoryColors";

type Props = {
  plan: DebtPlan;
  debts: Debt[];
};

export default function RemainingStackedChart({ plan, debts }: Props) {
  const data = remainingByCategory(plan, debts);

  // get list of unique categories in this plan
  const categories = Array.from(
    new Set(debts.map((d) => d.category ?? "other"))
  );

  return (
    <div className="p-4 border rounded bg-white">
      <h2 className="text-lg font-semibold mb-2">
        Remaining Balance by Category
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <XAxis dataKey="monthIndex" tickFormatter={(m) => m + 1} />
          <YAxis />
          <Tooltip />
          <Legend />

          {categories.map((cat) => (
            <Area
              key={cat}
              dataKey={cat}
              stackId="1"
              stroke={CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other}
              fill={CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
