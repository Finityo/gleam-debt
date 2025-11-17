// ===================================
// src/components/SnowballTimeline.tsx
// ===================================
import React from "react";
import { DebtPlan } from "@/lib/computeDebtPlan";
import { snowballGrowth } from "@/lib/snowballGrowth";

type Props = {
  plan: DebtPlan;
};

export default function SnowballTimeline({ plan }: Props) {
  const data = snowballGrowth(plan);

  if (!data.length) return null;

  return (
    <div className="p-4 border border-border/40 rounded-2xl space-y-3 max-w-md glass">
      <h2 className="text-lg font-semibold">Snowball Pool Growth</h2>

      <ul className="list-inside space-y-1">
        {data
          .filter((p) => {
            // only show jumps where snowball increases
            const prev = data[p.monthIndex - 1];
            return !prev || p.amount !== prev.amount;
          })
          .map((p, i) => (
            <li key={i}>
              Month {p.monthIndex + 1} → ${p.amount.toFixed(2)}
            </li>
          ))}
      </ul>
    </div>
  );
}
