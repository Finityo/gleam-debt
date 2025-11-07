// ===================================
// src/lib/milestones.ts
// ===================================
import { DebtPlan } from "@/lib/computeDebtPlan";
import { remainingByMonth } from "@/lib/remaining";
import { getPayoffOrder } from "@/lib/payoffOrder";

export type Milestone = {
  name: string;
  description: string;
  monthIndex: number;
  date?: string;
};

export function getMilestones(plan: DebtPlan): Milestone[] {
  const milestones: Milestone[] = [];
  
  // Calculate initial total balance
  const initialBalance = plan.months[0]?.payments.reduce(
    (sum, p) => sum + (p.balanceEnd + p.principal),
    0
  ) || 0;

  // Get remaining balance for each month
  const remaining = remainingByMonth(plan);

  // First payoff
  const payoffOrder = getPayoffOrder(plan);
  if (payoffOrder.length > 0) {
    const firstPayoff = payoffOrder[0];
    milestones.push({
      name: "First Payoff",
      description: "First debt paid to zero",
      monthIndex: firstPayoff.monthIndex - 1, // Convert to 0-based
    });
  }

  // 25% remaining (75% paid)
  const target75 = initialBalance * 0.25;
  const month75 = remaining.findIndex((r) => r.remaining <= target75);
  if (month75 !== -1) {
    milestones.push({
      name: "75% Paid",
      description: "Total balance down to 25% remaining",
      monthIndex: month75,
    });
  }

  // 50% remaining (50% paid)
  const target50 = initialBalance * 0.5;
  const month50 = remaining.findIndex((r) => r.remaining <= target50);
  if (month50 !== -1) {
    milestones.push({
      name: "50% Paid",
      description: "Debt halfway paid",
      monthIndex: month50,
    });
  }

  // 75% remaining (25% paid)
  const target25 = initialBalance * 0.75;
  const month25 = remaining.findIndex((r) => r.remaining <= target25);
  if (month25 !== -1) {
    milestones.push({
      name: "25% Paid",
      description: "Down to 75% remaining",
      monthIndex: month25,
    });
  }

  // Debt-free
  milestones.push({
    name: "Debt-Free",
    description: "All debts paid off",
    monthIndex: plan.months.length - 1,
    date: plan.debtFreeDate,
  });

  // Sort by month
  return milestones.sort((a, b) => a.monthIndex - b.monthIndex);
}
