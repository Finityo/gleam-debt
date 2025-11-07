// ===================================
// src/lib/snowballGrowth.ts
// ===================================
import { DebtPlan } from "@/lib/computeDebtPlan";

export type SnowballPoint = {
  monthIndex: number;
  amount: number;
};

export function snowballGrowth(plan: DebtPlan): SnowballPoint[] {
  if (!plan.months.length) return [];
  return plan.months.map((m) => ({
    monthIndex: m.monthIndex,
    amount: m.totalPaid,
  }));
}
