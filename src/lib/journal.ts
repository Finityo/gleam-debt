// ===================================
// src/lib/journal.ts
// ===================================
import { DebtPlan, Debt } from "@/lib/computeDebtPlan";

export type JournalEntry = {
  monthIndex: number;
  pool: number;
  remaining: number;
  payoffs: {
    debtId: string;
    debtName: string;
    principal: number;
    interest: number;
  }[];
};

export function buildJournal(plan: DebtPlan, debts: Debt[]): JournalEntry[] {
  const debtMap = Object.fromEntries(debts.map((d) => [d.id, d.name]));

  return plan.months.map((m) => {
    const payoffs = m.payments
      .filter((p) => p.balanceEnd === 0 && p.principal > 0)
      .map((p) => ({
        debtId: p.debtId,
        debtName: debtMap[p.debtId],
        principal: p.principal,
        interest: p.interest,
      }));

    // Calculate remaining balance from all debt balances at end of this month
    const remaining = m.payments.reduce((sum, p) => sum + p.balanceEnd, 0);

    return {
      monthIndex: m.monthIndex,
      pool: m.snowballPoolApplied,
      remaining,
      payoffs,
    };
  });
}
