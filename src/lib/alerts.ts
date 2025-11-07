import type { Debt, DebtPlan } from "./computeDebtPlan";

export type AlertItem = {
  id: string;
  level: "info" | "warn" | "risk";
  message: string;
};

/**
 * Generate health check alerts for a debt plan
 */
export function generateAlerts(plan: DebtPlan, debts: Debt[], today = new Date()): AlertItem[] {
  const out: AlertItem[] = [];

  // 1) Due-date cluster (many due within same week)
  const counts: Record<number, number> = {};
  debts.forEach((d) => {
    if (d.dueDay) counts[d.dueDay] = (counts[d.dueDay] || 0) + 1;
  });
  Object.entries(counts).forEach(([day, c]) => {
    if (c >= 3) {
      out.push({
        id: `cluster-${day}`,
        level: "info",
        message: `${c} payments due around day ${day} of the month`,
      });
    }
  });

  // 2) High APR risk (>= 25%)
  debts
    .filter((d) => d.apr >= 25)
    .forEach((d) =>
      out.push({
        id: `apr-${d.id}`,
        level: "risk",
        message: `High APR on ${d.name} (${d.apr.toFixed(1)}%) - prioritize this debt`,
      })
    );

  // 3) Low minimum payments (may not cover interest)
  debts.forEach((d) => {
    const monthlyInterest = (d.balance * (d.apr / 100)) / 12;
    if (d.minPayment < monthlyInterest * 1.1 && d.apr > 0) {
      out.push({
        id: `lowmin-${d.id}`,
        level: "warn",
        message: `${d.name} minimum payment barely covers interest - consider increasing payments`,
      });
    }
  });

  // 4) Progress drift: last 3 months showing slowing progress
  const months = plan.months || [];
  if (months.length >= 3) {
    const last3 = months.slice(-3);
    const progress = last3.map((m) =>
      m.payments.reduce((sum, p) => sum + p.principal, 0)
    );
    if (progress[2] < progress[0] * 0.8) {
      out.push({
        id: "drift",
        level: "warn",
        message: "Progress appears to be slowing - review your extra payments",
      });
    }
  }

  // 5) Large balance warning
  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
  if (totalBalance > 50000) {
    out.push({
      id: "largebalance",
      level: "info",
      message: `Total debt is $${totalBalance.toFixed(0)} - consider debt consolidation options`,
    });
  }

  return out;
}
