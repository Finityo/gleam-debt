// ===================================
// src/lib/computeDebtPlan.ts
// ===================================

/**
 * Debt payoff engine for Finityo demo → live mode.
 * - Strict Snowball (by balance asc) or Avalanche (by APR desc)
 * - Constant outflow: initial sum(mins) + extraMonthly stays constant each month
 * - One-time extra applied entirely in Month 1 (monthIndex = 0)
 * - Monthly interest = APR/12
 * - Two-pass allocation per month:
 *   1) cover minimums for active debts
 *   2) distribute remaining pool by strategy order (accelerate paydown)
 */

export type Debt = {
  id: string;
  name: string;
  balance: number;      // dollars
  apr: number;          // percent (e.g., 23.99)
  minPayment: number;   // dollars
  dueDay?: number;      // 1..28 optional
  include?: boolean;    // default true
  category?: string;    // optional category
};

export type Strategy = "snowball" | "avalanche";

export type Scenario = "snowball" | "avalanche" | "minimum";

export type UserSettings = {
  extraMonthly: number;     // recurring extra dollars
  oneTimeExtra: number;     // applied in Month 1
  strategy: Strategy;
};

export type MonthlyDebtPayment = {
  debtId: string;
  paid: number;         // total paid for this debt this month
  interest: number;     // portion of "paid" that covered interest
  principal: number;    // portion of "paid" that reduced principal
  balanceEnd: number;   // ending balance after this month
};

export type PlanMonth = {
  monthIndex: number;           // 0-based
  payments: MonthlyDebtPayment[];
  totalInterest: number;
  totalPaid: number;
  snowballPoolApplied: number;  // how much of the constant pool actually went out this month
};

export type DebtPlan = {
  months: PlanMonth[];
  debtFreeDate: string;         // YYYY-MM
  totalInterest: number;
  totalPaid: number;
  summary: {
    firstDebtPaidMonth: number | null; // 0-based, null if none
    initialOutflow: number;            // sum(mins at start) + extraMonthly
    finalMonthIndex: number;           // last month index
  };
};

// ---------- Utils ----------
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const cloneDebts = (debts: Debt[]): Debt[] =>
  debts.map(d => ({ ...d }));

const isActive = (d: Debt) =>
  (d.include ?? true) && d.balance > 0.000001 && d.minPayment > 0;

const monthAddISO = (start: Date, add: number) => {
  const y = start.getUTCFullYear();
  const m = start.getUTCMonth();
  const d = new Date(Date.UTC(y, m + add, 1));
  const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return ym;
};

// Strict order per strategy
const sortDebtsByStrategy = (debts: Debt[], strategy: Strategy): Debt[] => {
  const active = debts.filter(isActive);
  if (strategy === "snowball") {
    // balance asc, tiebreaker APR desc (higher APR tackled earlier if equal balance)
    return active.sort((a, b) =>
      a.balance !== b.balance
        ? a.balance - b.balance
        : b.apr - a.apr
    );
  } else {
    // avalanche: APR desc, tiebreaker balance asc
    return active.sort((a, b) =>
      a.apr !== b.apr
        ? b.apr - a.apr
        : a.balance - b.balance
    );
  }
};

// Sum of min payments for debts that were active at START (used to lock constant outflow)
const sumMins = (debts: Debt[]) =>
  debts.filter(d => (d.include ?? true) && d.minPayment > 0 && d.balance > 0)
       .reduce((acc, d) => acc + d.minPayment, 0);

// ---------- Engine ----------
export function computeDebtPlan(
  inputDebts: Debt[],
  settings: UserSettings,
  opts?: { startDate?: Date; maxMonths?: number }
): DebtPlan {
  const startDate = opts?.startDate ?? new Date();     // today
  const maxMonths = opts?.maxMonths ?? 600;            // ~50 years safety cap

  // Copy debts to mutate safely
  const debts = cloneDebts(inputDebts).map(d => ({
    ...d,
    include: d.include ?? true,
    balance: round2(Math.max(0, d.balance)),
    apr: Math.max(0, d.apr),
    minPayment: round2(Math.max(0, d.minPayment)),
  }));

  // If nothing to do, return empty plan
  const startActive = debts.filter(isActive);
  if (startActive.length === 0) {
    return {
      months: [],
      debtFreeDate: monthAddISO(startDate, 0),
      totalInterest: 0,
      totalPaid: 0,
      summary: {
        firstDebtPaidMonth: null,
        initialOutflow: 0,
        finalMonthIndex: -1,
      }
    };
  }

  // Constant outflow each month: initial mins + extraMonthly
  const initialOutflow = round2(sumMins(debts) + (settings.extraMonthly || 0));

  let months: PlanMonth[] = [];
  let totalInterestAll = 0;
  let totalPaidAll = 0;

  let firstDebtPaidMonth: number | null = null;

  // Track which debts are already fully paid to find first payoff month
  const paidOnce = new Set<string>();

  for (let monthIndex = 0; monthIndex < maxMonths; monthIndex++) {
    // stop if all paid
    const anyActive = debts.some(isActive);
    if (!anyActive) break;

    let remainingPool = initialOutflow;

    // One-time extra in Month 1 only
    if (monthIndex === 0 && settings.oneTimeExtra > 0) {
      remainingPool = round2(remainingPool + settings.oneTimeExtra);
    }

    // Compute this month's interest for each debt on current principal
    const perDebtInterest = new Map<string, number>();
    for (const d of debts) {
      if (!isActive(d)) {
        perDebtInterest.set(d.id, 0);
        continue;
      }
      const monthlyRate = d.apr > 0 ? (d.apr / 100) / 12 : 0;
      const interest = round2(d.balance * monthlyRate);
      perDebtInterest.set(d.id, interest);
    }

    // Allocate in two passes following strict order
    const order = sortDebtsByStrategy(debts, settings.strategy);

    const paymentsMap: Record<string, MonthlyDebtPayment> = {};
    for (const d of order) {
      paymentsMap[d.id] = {
        debtId: d.id,
        paid: 0,
        interest: 0,
        principal: 0,
        balanceEnd: d.balance
      };
    }

    // PASS 1: cover minimums
    for (const d of order) {
      const interest = perDebtInterest.get(d.id)!;
      const totalDueThisMonth = round2(d.balance + interest);
      const minDue = round2(Math.min(d.minPayment, totalDueThisMonth));

      if (remainingPool <= 0 || totalDueThisMonth <= 0) {
        continue;
      }

      const pay = round2(Math.min(minDue, remainingPool));

      // Interest paid is min(interest, pay); the rest to principal
      const interestPaid = round2(Math.min(interest, pay));
      const principalPaid = round2(pay - interestPaid);

      // Update state
      d.balance = round2(d.balance - principalPaid);
      paymentsMap[d.id].paid = round2(paymentsMap[d.id].paid + pay);
      paymentsMap[d.id].interest = round2(paymentsMap[d.id].interest + interestPaid);
      paymentsMap[d.id].principal = round2(paymentsMap[d.id].principal + principalPaid);
      paymentsMap[d.id].balanceEnd = d.balance;

      remainingPool = round2(remainingPool - pay);
    }

    // PASS 2: accelerate using remaining pool, same strict order
    for (const d of order) {
      if (remainingPool <= 0) break;
      if (!isActive(d)) continue;

      // After min, any additional payment goes straight to principal
      const canPay = round2(Math.min(d.balance, remainingPool));
      if (canPay <= 0) continue;

      d.balance = round2(d.balance - canPay);

      paymentsMap[d.id].paid = round2(paymentsMap[d.id].paid + canPay);
      paymentsMap[d.id].principal = round2(paymentsMap[d.id].principal + canPay);
      paymentsMap[d.id].balanceEnd = d.balance;

      remainingPool = round2(remainingPool - canPay);
    }

    // Aggregate this month
    const payments = order.map(d => paymentsMap[d.id]);
    const totalInterest = round2(payments.reduce((a, p) => a + p.interest, 0));
    const totalPaid = round2(payments.reduce((a, p) => a + p.paid, 0));

    totalInterestAll = round2(totalInterestAll + totalInterest);
    totalPaidAll = round2(totalPaidAll + totalPaid);

    // Track first month in which any debt is newly paid off
    for (const d of order) {
      const wasPaidThisMonth =
        !paidOnce.has(d.id) &&
        paymentsMap[d.id].balanceEnd <= 0.000001 &&
        paymentsMap[d.id].paid > 0;

      if (wasPaidThisMonth) {
        paidOnce.add(d.id);
        if (firstDebtPaidMonth == null) firstDebtPaidMonth = monthIndex;
      }
    }

    months.push({
      monthIndex,
      payments,
      totalInterest,
      totalPaid,
      snowballPoolApplied: totalPaid // how much of constant outflow actually went out
    });

    // Safety: if no money moved this month, break to avoid infinite loop
    if (totalPaid <= 0.000001) break;
  }

  const finalMonthIndex = months.length ? months[months.length - 1].monthIndex : -1;
  const debtFreeDate = monthAddISO(startDate, Math.max(0, finalMonthIndex + 1));

  return {
    months,
    debtFreeDate,
    totalInterest: totalInterestAll,
    totalPaid: totalPaidAll,
    summary: {
      firstDebtPaidMonth: firstDebtPaidMonth ?? null,
      initialOutflow: initialOutflow,
      finalMonthIndex
    }
  };
}


// ===================================
// Local save/load helpers (no auth)
// ===================================

const LS_KEY = "finityo:debts_plan_settings_v1";

export type SavedState = {
  debts: Debt[];
  settings: UserSettings;
};

export function saveLocal(state: SavedState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {}
}

export function loadLocal(): SavedState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // naive shape check
    if (!Array.isArray(parsed.debts) || !parsed.settings) return null;
    return parsed as SavedState;
  } catch {
    return null;
  }
}

// ===================================
// Minimal example usage (commented)
// ===================================

/*
import { computeDebtPlan, saveLocal, loadLocal, Debt, UserSettings } from "@/lib/computeDebtPlan";

const debts: Debt[] = [
  { id: "1", name: "Store Card", balance: 450, apr: 24.99, minPayment: 35, include: true },
  { id: "2", name: "Medical Bill", balance: 620, apr: 0, minPayment: 25, include: true },
  { id: "3", name: "Visa", balance: 1800, apr: 22.49, minPayment: 55, include: true },
];

const settings: UserSettings = {
  strategy: "snowball",
  extraMonthly: 200,
  oneTimeExtra: 1000
};

const plan = computeDebtPlan(debts, settings);

// Save/load locally
saveLocal({ debts, settings });
const maybe = loadLocal();
*/

// ===================================
// Suggested wiring per page (notes)
// ===================================

/**
 * /demo/debts
 * - Collect debts + settings in state
 * - On "Compute", call computeDebtPlan(debts, settings)
 * - saveLocal({ debts, settings })
 *
 * /demo/plan
 * - Read debts + settings from context/local
 * - Run computeDebtPlan and render a month-by-month table
 * - Show debtFreeDate + totals
 *
 * /demo/chart
 * - Feed plan.months into a line chart of total remaining balance over time
 *   > remaining = sum of balanceEnd across debts each month
 *
 * Exports (Week 2):
 * - Excel export: write debts, settings, and months to .xlsx
 * - PDF export: 1–2 page summary (title, key metrics, first 12 months table, small chart)
 */
