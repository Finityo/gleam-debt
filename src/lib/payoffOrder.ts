// ===================================
// src/lib/payoffOrder.ts
// ===================================
import type { PlanResult } from "@/lib/debtPlan";

export function getPayoffOrder(plan: PlanResult) {
  if (!plan || !plan.months.length) return [];

  const payoffMap = new Map<string, number>(); // debtId -> monthIndex
  const { months } = plan;

  months.forEach((m) => {
    m.payments.forEach((p) => {
      if (p.endingBalance <= 0 && !payoffMap.has(p.debtId)) {
        payoffMap.set(p.debtId, m.monthIndex);
      }
    });
  });

  // convert to array sorted by payoff month
  return [...payoffMap.entries()]
    .map(([debtId, monthIndex]) => ({
      debtId,
      monthIndex: monthIndex + 1, // human month index
    }))
    .sort((a, b) => a.monthIndex - b.monthIndex);
}
