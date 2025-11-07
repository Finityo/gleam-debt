// ===================================
// src/components/BadgesBar.tsx
// ===================================
import React from "react";
import { DebtPlan } from "@/lib/computeDebtPlan";
import { getBadges } from "@/lib/badges";

type Props = {
  plan: DebtPlan;
};

export default function BadgesBar({ plan }: Props) {
  const badges = getBadges(plan);

  if (!badges.length) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2">
      {badges.map((b) => (
        <span
          key={b.id}
          className="px-3 py-1 text-sm rounded-full border bg-white"
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
