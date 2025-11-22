// ===================================
// src/lib/remaining.ts
// ===================================
import type { PlanResult } from "@/lib/debtPlan";

export function remainingByMonth(plan: PlanResult) {
  return plan.months.map((m) => {
    const remaining = m.payments.reduce(
      (acc, p) => acc + p.endingBalance,
      0
    );
    return {
      monthIndex: m.monthIndex,
      remaining,
    };
  });
}
