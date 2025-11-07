// ===================================
// src/lib/planSummary.ts
// ===================================
import { DebtPlan } from "@/lib/computeDebtPlan";

export function getPlanSummary(plan: DebtPlan) {
  if (!plan || !plan.months.length) {
    return null;
  }

  const { debtFreeDate, summary, totalInterest, totalPaid } = plan;

  // First debt paid month (convert to human month number)
  const firstDebtPaid =
    summary.firstDebtPaidMonth != null
      ? summary.firstDebtPaidMonth + 1
      : null;

  // Final snowball = amount applied in final month
  const finalMonth = plan.months.at(-1)!;
  const finalSnowball = finalMonth.totalPaid;

  return {
    debtFreeDate,
    firstDebtPaid,
    initialOutflow: summary.initialOutflow,
    finalMonthIndex: summary.finalMonthIndex,
    finalSnowball,
    totalInterest,
    totalPaid,
  };
}
