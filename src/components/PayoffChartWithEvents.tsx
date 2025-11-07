// ===================================
// src/components/PayoffChartWithEvents.tsx
// ===================================
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Legend,
} from "recharts";

import { DebtPlan, Debt } from "@/lib/computeDebtPlan";
import { remainingByMonth } from "@/lib/remaining";
import { getPayoffEvents } from "@/lib/payoffEvents";

type Props = {
  plan: DebtPlan;
  debts: Debt[];
};

export default function PayoffChartWithEvents({ plan, debts }: Props) {
  const rem = remainingByMonth(plan);
  const events = getPayoffEvents(plan, debts);

  // Convert for Scatter overlay
  const eventData = events.map((e) => ({
    month: e.monthIndex + 1,
    remaining: e.remaining,
    debtName: e.debtName,
  }));

  const tooltipFormatter = (v: any) =>
    typeof v === "number" ? `$${v.toFixed(2)}` : v;

  return (
    <div className="p-4 border rounded bg-white">
      <h2 className="text-lg font-semibold mb-2">
        Remaining Balance with Payoff Events
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={rem}>
          <XAxis dataKey="monthIndex" tickFormatter={(m) => m + 1} />
          <YAxis />
          <Tooltip formatter={tooltipFormatter} />
          <Legend />

          {/* Main debt curve */}
          <Line
            type="monotone"
            dataKey="remaining"
            stroke="#000000"
            name="Remaining Balance"
          />

          {/* Event markers */}
          <Scatter
            name="Payoff Events"
            data={eventData}
            fill="#d4af37" // gold
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
