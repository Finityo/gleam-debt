// ===================================
// src/lib/badges.ts
// ===================================
import { DebtPlan } from "@/lib/computeDebtPlan";
import { getMilestones } from "./milestones";

export type Badge = {
  id: string;
  label: string;
  monthIndex: number;
};

export function getBadges(plan: DebtPlan): Badge[] {
  const ms = getMilestones(plan);

  const badges: Badge[] = [];

  for (const m of ms) {
    if (m.label === "First Debt Paid") {
      badges.push({
        id: "first",
        label: "First Debt Paid 🎉",
        monthIndex: m.monthIndex,
      });
    }

    if (m.label === "50% Remaining") {
      badges.push({
        id: "half",
        label: "Halfway There 🔥",
        monthIndex: m.monthIndex,
      });
    }

    if (m.label === "Debt-Free!") {
      badges.push({
        id: "free",
        label: "Debt-Free ✅",
        monthIndex: m.monthIndex,
      });
    }
  }

  return badges.sort((a, b) => a.monthIndex - b.monthIndex);
}
