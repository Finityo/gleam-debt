// ===================================
// src/lib/debtStats.ts
// ===================================
import { Debt, DebtPlan } from "@/lib/computeDebtPlan";
import { getPayoffOrder } from "./payoffOrder";

export function getDebtStats(plan: DebtPlan, debts: Debt[]) {
  const payoff = getPayoffOrder(plan);
  const payoffMap = Object.fromEntries(
    payoff.map((p) => [p.debtId, p.monthIndex])
  );

  return debts.map((d) => {
    const payoffMonth = payoffMap[d.id] ?? null;

    // Total interest + principal
    let interestPaid = 0;
    let principalPaid = 0;

    plan.months.forEach((m) => {
      m.payments.forEach((p) => {
        if (p.debtId === d.id) {
          interestPaid += p.interest;
          principalPaid += p.principal;
        }
      });
    });

    return {
      ...d,
      payoffMonth,
      interestPaid,
      principalPaid,
    };
  });
}
