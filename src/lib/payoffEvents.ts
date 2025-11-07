// ===================================
// src/lib/payoffEvents.ts
// ===================================
import { DebtPlan, Debt } from "@/lib/computeDebtPlan";
import { getPayoffOrder } from "@/lib/payoffOrder";
import { remainingByMonth } from "@/lib/remaining";

export type PayoffEvent = {
  debtId: string;
  debtName: string;
  monthIndex: number;
  remaining: number;
};

export function getPayoffEvents(plan: DebtPlan, debts: Debt[]): PayoffEvent[] {
  const order = getPayoffOrder(plan);
  const remaining = remainingByMonth(plan);
  const nameMap = Object.fromEntries(debts.map((d) => [d.id, d.name]));

  return order.map((o) => ({
    debtId: o.debtId,
    debtName: nameMap[o.debtId] || o.debtId,
    monthIndex: o.monthIndex,
    remaining: remaining[o.monthIndex]?.remaining ?? 0,
  }));
}
