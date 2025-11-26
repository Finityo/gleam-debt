// ===================================
// src/lib/planSummary.ts
// ===================================
import type { PlanResult } from "@/engine/plan-types";

export function getPlanSummary(plan: PlanResult | null) {
  if (!plan || !plan.months.length) {
    return null;
  }

  const { debtFreeDate, totalInterest, totalPaid } = plan;

  // First debt paid month - find first month where a debt closed
  let firstDebtPaidMonth = null;
  for (let i = 0; i < plan.months.length; i++) {
    const hasClosedDebt = plan.months[i].payments.some(p => p.isClosed || p.closedThisMonth);
    if (hasClosedDebt) {
      firstDebtPaidMonth = i + 1; // 1-based
      break;
    }
  }

  // Final snowball = amount applied in final month
  const finalMonth = plan.months.at(-1)!;
  const finalSnowball = finalMonth.totals.outflow;

  return {
    debtFreeDate,
    firstDebtPaid: firstDebtPaidMonth,
    initialOutflow: plan.totals.outflowMonthly,
    finalMonthIndex: plan.months.length,
    finalSnowball,
    totalInterest: totalInterest || plan.totals.interest,
    totalPaid: totalPaid || (plan.totals.principal + plan.totals.interest),
  };
}
