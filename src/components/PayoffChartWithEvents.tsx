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
  Legend,
  Scatter,
  ReferenceLine,
} from "recharts";

import { DebtPlan, Debt } from "@/lib/computeDebtPlan";
import { remainingByMonth } from "@/lib/remaining";
import { getPayoffEvents } from "@/lib/payoffEvents";

type Props = {
  plan: DebtPlan;
  debts: Debt[];
  showEvents?: boolean;
};

export default function PayoffChartWithEvents({ plan, debts, showEvents = true }: Props) {
  const rem = remainingByMonth(plan);
  const events = getPayoffEvents(plan, debts);

  // Scatter overlay dataset
  const eventData = events.map((e) => ({
    month: e.monthIndex + 1,
    remaining: e.remaining,
    debtName: e.debtName,
  }));

  return (
    <div className="p-4 border border-border/40 rounded-2xl glass">
      <h2 className="text-lg font-semibold mb-2">
        Remaining Balance{showEvents ? " + Payoff Events" : ""}
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={rem}>
          <XAxis dataKey="monthIndex" tickFormatter={(m) => m + 1} />
          <YAxis />
          <Tooltip formatter={(v: any) => `$${v.toFixed?.(2) ?? v}`} />
          <Legend />

          {/* Remaining balance curve */}
          <Line
            type="monotone"
            dataKey="remaining"
            name="Remaining Balance"
            stroke="#000000"
          />

          {/* Reference lines */}
          {showEvents && events.map((e, i) => (
            <ReferenceLine
              key={i}
              x={e.monthIndex}
              stroke="#d4af37"
              strokeDasharray="3 3"
              label={{
                value: e.debtName,
                position: "top",
                fill: "#d4af37",
                fontSize: 10,
              }}
            />
          ))}

          {/* Payoff dots */}
          {showEvents && (
            <Scatter
              name="Payoff Events"
              data={eventData}
              fill="#d4af37" // gold
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
