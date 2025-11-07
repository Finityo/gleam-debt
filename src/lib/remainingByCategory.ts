// ===================================
// src/lib/remainingByCategory.ts
// ===================================
import { Debt, DebtPlan } from "@/lib/computeDebtPlan";
import { getCategoryColor } from "./categoryColors";

export function remainingByCategory(plan: DebtPlan, debts: Debt[]) {
  const categoryMap = Object.fromEntries(
    debts.map((d) => [d.id, d.category ?? "other"])
  );

  return plan.months.map((m) => {
    const row: Record<string, number | string> = {
      monthIndex: m.monthIndex,
    };

    m.payments.forEach((p) => {
      const cat = categoryMap[p.debtId];
      row[cat] = (row[cat] as number ?? 0) + p.balanceEnd;
    });

    return row;
  });
}
