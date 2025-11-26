// ============================================================================
// FILE: src/lib/debtPlan.ts  
// ============================================================================
import type { DebtInput, PlanMonth, PlanResult, Strategy, PlanPayment } from "@/engine/plan-types";
import { toNum, clamp, safeAPR } from "@/lib/number";

// Re-export core types
export type { DebtInput, PlanMonth, PlanResult, Strategy, PlanPayment };

export type ComputeParams = {
  debts: DebtInput[];
  strategy: Strategy;
  extraMonthly: number;
  oneTimeExtra: number;
  startDate: string;   // yyyy-mm-dd
  maxMonths?: number;
};

export type ComputeArgs = ComputeParams;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function formatAPR(apr: number): string {
  return `${apr.toFixed(2)}%`;
}

// Placeholder for legacy compatibility
export const PlanService = {
  compute: (args: ComputeParams) => computeDebtPlan(args),
};

export function computeDebtPlan(args: ComputeParams): PlanResult {
  const maxMonths = args.maxMonths ?? 600;

  // normalize + include filter
  const included = (args.debts ?? [])
    .map((d, idx) => ({
      ...d,
      id: d.id ?? String(idx),
      name: d.name ?? d.creditor ?? `Debt ${idx + 1}`,
      balance: toNum(d.balance),
      apr: safeAPR(d.apr),
      minPayment: clamp(toNum(d.minPayment), 0, 1e9),
      include: d.include !== false,
      order: toNum(d.order, idx + 1),
    }))
    .filter(d => d.include !== false);

  // order debts by strategy unless explicit order is set
  const ordered = [...included].sort((a, b) => {
    if (a.order != null || b.order != null) return (a.order ?? 1e9) - (b.order ?? 1e9);

    if (args.strategy === "avalanche") {
      if (b.apr !== a.apr) return b.apr - a.apr;
      return a.balance - b.balance;
    }
    // snowball default
    if (a.balance !== b.balance) return a.balance - b.balance;
    return a.apr - b.apr;
  });

  const monthlyBudget =
    ordered.reduce((s, d) => s + d.minPayment, 0) + toNum(args.extraMonthly);

  const months: PlanMonth[] = [];
  const balances: Record<string, number> = {};
  ordered.forEach(d => (balances[d.id] = d.balance));

  let currentDate = new Date(args.startDate);
  let oneTimeExtraLeft = toNum(args.oneTimeExtra);

  for (let m = 1; m <= maxMonths; m++) {
    // stop if all paid
    const openDebts = ordered.filter(d => balances[d.id] > 0.01);
    if (!openDebts.length) break;

    const payments: PlanMonth["payments"] = [];
    let monthInterestTotal = 0;
    let monthPrincipalTotal = 0;

    // 1) accrue interest
    const interestAccrued: Record<string, number> = {};
    openDebts.forEach(d => {
      const bal = balances[d.id];
      const monthlyRate = (d.apr / 100) / 12;
      const interest = round2(bal * monthlyRate);
      interestAccrued[d.id] = interest;
      balances[d.id] = bal + interest;
      monthInterestTotal += interest;
    });

    // 2) pay minimums
    let spent = 0;
    openDebts.forEach(d => {
      const bal = balances[d.id];
      const pay = Math.min(d.minPayment, bal);
      const interestPart = Math.min(pay, interestAccrued[d.id] ?? 0);
      const principalPart = pay - interestPart;

      balances[d.id] = round2(bal - pay);
      spent += pay;
      monthPrincipalTotal += principalPart;

      payments.push({
        debtId: d.id,
        totalPaid: round2(pay),
        principal: round2(principalPart),
        interest: round2(interestPart),
        endingBalance: round2(balances[d.id]),
        isClosed: balances[d.id] <= 0.01,
        // legacy compat
        balanceEnd: round2(balances[d.id]),
        interestAccrued: round2(interestAccrued[d.id] ?? 0),
        paid: round2(pay),
        closedThisMonth: balances[d.id] <= 0.01,
      });
    });

    // 3) snowball + one-time extra pool
    let remainingBudget = Math.max(0, monthlyBudget - spent);
    if (oneTimeExtraLeft > 0) {
      remainingBudget += oneTimeExtraLeft;
      oneTimeExtraLeft = 0; // applied once, immediately
    }

    // target is first open debt in ordered list
    for (const d of openDebts) {
      if (remainingBudget <= 0) break;
      const bal = balances[d.id];
      if (bal <= 0.01) continue;

      const extraPay = Math.min(remainingBudget, bal);
      balances[d.id] = round2(bal - extraPay);
      remainingBudget -= extraPay;
      monthPrincipalTotal += extraPay;

      // merge into existing payment row
      const row = payments.find(p => p.debtId === d.id);
      if (row) {
        row.totalPaid = round2(row.totalPaid + extraPay);
        row.principal = round2(row.principal + extraPay);
        row.endingBalance = round2(balances[d.id]);
        row.isClosed = balances[d.id] <= 0.01;
        row.balanceEnd = round2(balances[d.id]);
        row.paid = round2(row.totalPaid);
        row.closedThisMonth = balances[d.id] <= 0.01;
      } else {
        payments.push({
          debtId: d.id,
          totalPaid: round2(extraPay),
          principal: round2(extraPay),
          interest: 0,
          endingBalance: round2(balances[d.id]),
          isClosed: balances[d.id] <= 0.01,
          balanceEnd: round2(balances[d.id]),
          paid: round2(extraPay),
          closedThisMonth: balances[d.id] <= 0.01,
        });
      }
    }

    const outflow = round2(monthPrincipalTotal + monthInterestTotal);

    months.push({
      monthIndex: m,
      dateISO: currentDate.toISOString(),
      totals: {
        outflow,
        principal: round2(monthPrincipalTotal),
        interest: round2(monthInterestTotal),
      },
      snowball: round2(monthlyBudget),
      payments,
    });

    // advance month
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
  }

  const totals = months.reduce(
    (acc, mm) => {
      acc.principal += mm.totals.principal;
      acc.interest += mm.totals.interest;
      return acc;
    },
    { principal: 0, interest: 0 }
  );

  const totalPaid = round2(totals.principal + totals.interest);
  
  return {
    months: months.map(m => ({
      ...m,
      totalPaid: round2(m.totals.principal + m.totals.interest),
      totalInterest: round2(m.totals.interest),
    })),
    totals: {
      principal: round2(totals.principal),
      interest: round2(totals.interest),
      outflowMonthly: round2(monthlyBudget),
      monthsToDebtFree: months.length,
      totalPaid,
      oneTimeApplied: toNum(args.oneTimeExtra),
    },
    debts: ordered,
    settings: {
      strategy: args.strategy,
      extraMonthly: toNum(args.extraMonthly),
      oneTimeExtra: toNum(args.oneTimeExtra),
      startDate: args.startDate,
      maxMonths,
    },
    // legacy compat duplicates
    strategy: args.strategy,
    totalInterest: round2(totals.interest),
    totalPaid,
    debtFreeDate: months.length > 0 ? months[months.length - 1].dateISO : null,
    startDateISO: args.startDate,
  };
}
