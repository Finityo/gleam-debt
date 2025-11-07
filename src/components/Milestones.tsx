// ===================================
// src/components/Milestones.tsx
// ===================================
import React from "react";
import { DebtPlan } from "@/lib/computeDebtPlan";
import { getMilestones } from "@/lib/milestones";

type Props = {
  plan: DebtPlan;
};

export default function Milestones({ plan }: Props) {
  const items = getMilestones(plan);
  if (!items.length) return null;

  return (
    <div className="p-4 border rounded space-y-3 max-w-md bg-white">
      <h2 className="text-lg font-semibold">Milestones</h2>

      <ol className="list-inside space-y-2">
        {items.map((m, i) => (
          <li key={i}>
            <strong>{m.label}</strong> — Month {m.monthIndex + 1}
          </li>
        ))}
      </ol>
    </div>
  );
}
