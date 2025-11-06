import { DebtPlan } from "@/lib/computeDebtPlan";

export function remainingByMonth(plan: DebtPlan) {
  return plan.months.map((m) => {
    const remaining = m.payments.reduce(
      (acc, p) => acc + p.balanceEnd,
      0
    );
    return {
      monthIndex: m.monthIndex,
      remaining,
    };
  });
}
