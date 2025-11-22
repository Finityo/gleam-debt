// ===================================
// src/lib/snowballGrowth.ts
// ===================================
import type { PlanResult } from "@/lib/debtPlan";

export type SnowballPoint = {
  monthIndex: number;
  amount: number;
};

export function snowballGrowth(plan: PlanResult): SnowballPoint[] {
  if (!plan.months.length) return [];
  return plan.months.map((m) => ({
    monthIndex: m.monthIndex,
    amount: m.totals.outflow,
  }));
}
