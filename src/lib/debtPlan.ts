// ===============================================
// Finityo Debt Plan Engine — Drop-in Module
// File: src/lib/debtPlan.ts
// ===============================================

/**
 * Public Types your pages can import
 */
export type Strategy = "snowball" | "avalanche";

export interface DebtInput {
  id: string;
  name: string;
  balance: number;        // current principal
  apr: number;            // e.g., 19.99 (percent)
  minPayment: number;     // required minimum payment
  dueDay?: number;        // 1..28 (safe range), optional (defaults: 15)
  include?: boolean;      // if false, skipped from plan math but listed
  notes?: string;
}

export interface ComputeParams {
  debts: DebtInput[];
  strategy: Strategy;           // "snowball" or "avalanche"
  extraMonthly: number;         // extra amount every month
  oneTimeExtra: number;         // applied in Month 1 immediately
  startDate?: string;           // ISO date (yyyy-mm-dd); default: today
  maxMonths?: number;           // guardrail; default: 600
}

export interface DebtMonthPayment {
  debtId: string;
  startingBalance: number;
  interestAccrued: number;
  minApplied: number;       // portion counted against the debt's minimum
  extraApplied: number;     // snowball/avalanche extra beyond min
  totalPaid: number;        // minApplied + extraApplied (capped to balance+interest)
  endingBalance: number;
  closedThisMonth: boolean;
}

export interface PlanMonth {
  monthIndex: number;           // 0-based
  monthLabel: string;           // e.g., "Nov 2025"
  dateISO: string;              // first-of-month ISO for reference
  payments: DebtMonthPayment[];
  totals: {
    interest: number;
    principal: number;
    outflow: number;           // constant: sum(mins of open at t0) + extraMonthly (+ oneTime in m0)
  };
}

export interface DebtSummary {
  id: string;
  name: string;
  apr: number;
  originalBalance: number;
  minPayment: number;
  included: boolean;
  payoffMonthIndex: number | null;
  payoffDateISO: string | null;
  totalInterestPaid: number;
  totalPaid: number;             // interest + principal
}

export interface PlanResult {
  strategy: Strategy;
  startDateISO: string;
  months: PlanMonth[];
  debts: DebtSummary[];
  totals: {
    monthsToDebtFree: number;
    interest: number;
    principal: number;
    outflowMonthly: number;      // constant outflow (see note)
    oneTimeApplied: number;      // in Month 1
    totalPaid: number;
  };
}

/**
 * Utility: date helpers
 */
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function startOfMonth(d: Date): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function monthLabel(d: Date): string {
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}
function clampDueDay(day?: number): number {
  if (!day || day < 1) return 15;
  return Math.min(Math.max(day, 1), 28);
}

/**
 * Sorting per strategy:
 * - snowball: smallest balance first
 * - avalanche: highest APR first
 */
function sortIndex(strategy: Strategy, items: { balance: number; apr: number }[]): number[] {
  const indexed = items.map((v, i) => ({ i, ...v }));
  if (strategy === "snowball") {
    indexed.sort((a, b) => a.balance - b.balance || b.apr - a.apr);
  } else {
    indexed.sort((a, b) => b.apr - a.apr || a.balance - b.balance);
  }
  return indexed.map(x => x.i);
}

/**
 * Core compute engine
 * Rules:
 *  - Interest accrues monthly: i = bal * (APR/12/100)
 *  - Constant outflow each month = SUM(mins of *initially included & open* debts) + extraMonthly
 *    (As debts close, their mins "roll over" into the snowball automatically.)
 *  - Month 1: add oneTimeExtra to the monthly pool and cascade immediately.
 *  - No negative balances: payments cap at (balance + interest).
 *  - Debts with include=false are carried through for display but not paid.
 */
export function computeDebtPlan(params: ComputeParams): PlanResult {
  const {
    strategy,
    extraMonthly,
    oneTimeExtra,
    maxMonths = 600,
  } = params;

  const startISO = params.startDate ? params.startDate : toISODate(new Date());
  const planStart = startOfMonth(new Date(startISO));

  // Build working set (deep copy so we can mutate balances)
  const debtsAll = params.debts.map(d => ({
    ...d,
    include: d.include !== false, // default true
    dueDay: clampDueDay(d.dueDay),
  }));

  // Filter to included debts for math
  const debts = debtsAll.filter(d => d.include);
  // If nothing to compute, return skeletal structure
  if (debts.length === 0) {
    return {
      strategy,
      startDateISO: toISODate(planStart),
      months: [],
      debts: debtsAll.map(d => ({
        id: d.id,
        name: d.name,
        apr: d.apr,
        originalBalance: d.balance,
        minPayment: d.minPayment,
        included: !!d.include,
        payoffMonthIndex: null,
        payoffDateISO: null,
        totalInterestPaid: 0,
        totalPaid: 0,
      })),
      totals: {
        monthsToDebtFree: 0,
        interest: 0,
        principal: 0,
        outflowMonthly: 0,
        oneTimeApplied: 0,
        totalPaid: 0,
      },
    };
  }

  // State arrays (mutating balances month-by-month)
  const workingBalances = debts.map(d => Math.max(0, round2(d.balance)));
  const monthlyRates = debts.map(d => (d.apr > 0 ? d.apr / 12 / 100 : 0));
  const mins = debts.map(d => Math.max(0, round2(d.minPayment)));

  const originalBalances = [...workingBalances];

  // Constant monthly outflow (sum of mins at t0 for included debts) + extraMonthly
  const baseOutflow = round2(mins.reduce((a, b) => a + b, 0) + (extraMonthly || 0));

  // Payoff tracking
  const payoffMonthIndex: Array<number | null> = debts.map(() => null);
  const totalInterestByDebt = debts.map(() => 0);
  const totalPaidByDebt = debts.map(() => 0);

  const months: PlanMonth[] = [];
  let globalInterest = 0;
  let globalPrincipal = 0;

  // Loop months until all paid or guardrail reached
  for (let m = 0; m < maxMonths; m++) {
    const monthDate = addMonths(planStart, m);
    const payments: DebtMonthPayment[] = [];

    // 1) Accrue interest for all open debts
    const interestThisMonth = workingBalances.map((bal, i) => {
      if (bal <= 0) return 0;
      const interest = round2(bal * monthlyRates[i]);
      return interest;
    });

    // Apply interest to balances before payments
    for (let i = 0; i < workingBalances.length; i++) {
      if (workingBalances[i] > 0) {
        workingBalances[i] = round2(workingBalances[i] + interestThisMonth[i]);
        totalInterestByDebt[i] = round2(totalInterestByDebt[i] + interestThisMonth[i]);
        globalInterest = round2(globalInterest + interestThisMonth[i]);
      }
    }

    // 2) Compute available pool this month (constant outflow + one-time in month 0)
    let monthPool = baseOutflow + (m === 0 ? (oneTimeExtra || 0) : 0);
    monthPool = round2(monthPool);

    // 3) First, cover minimums for all still-open debts (but cap at balance)
    const minApplied = mins.map((min, i) => {
      if (workingBalances[i] <= 0) return 0;
      const pay = Math.min(min, workingBalances[i]);
      monthPool = round2(monthPool - pay);
      workingBalances[i] = round2(workingBalances[i] - pay);
      totalPaidByDebt[i] = round2(totalPaidByDebt[i] + pay);
      return pay;
    });

    // 4) Allocate remaining pool by strategy order to principal (snowball/avalanche)
    const order = sortIndex(strategy, debts.map((d, i) => ({
      balance: workingBalances[i],
      apr: d.apr,
    })));

    const extraApplied = debts.map(() => 0);
    for (const idx of order) {
      if (monthPool <= 0) break;
      if (workingBalances[idx] <= 0) continue;

      const pay = Math.min(workingBalances[idx], monthPool);
      extraApplied[idx] = round2(extraApplied[idx] + pay);
      workingBalances[idx] = round2(workingBalances[idx] - pay);
      totalPaidByDebt[idx] = round2(totalPaidByDebt[idx] + pay);
      monthPool = round2(monthPool - pay);
    }

    // 5) Build month record & close trackers
    let monthOutflow = 0;
    let monthPrincipal = 0;
    const monthPayments: DebtMonthPayment[] = debts.map((d, i) => {
      const starting = round2(
        // reconstruct starting balance before interest + payments:
        workingBalances[i] + minApplied[i] + extraApplied[i]
      );
      const interest = interestThisMonth[i];
      const totalPaid = round2(minApplied[i] + extraApplied[i]);
      const ending = workingBalances[i];
      const closed = starting > 0 && ending === 0;

      if (closed && payoffMonthIndex[i] === null) {
        payoffMonthIndex[i] = m;
      }

      monthOutflow = round2(monthOutflow + totalPaid);
      // principal portion this month = totalPaid - interest that belonged to this debt
      // But interest was added to balance prior; any payment reduces principal.
      // So all payments reduce principal (since interest already capitalized).
      monthPrincipal = round2(monthPrincipal + totalPaid);

      return {
        debtId: d.id,
        startingBalance: round2(starting),
        interestAccrued: round2(interest),
        minApplied: round2(minApplied[i]),
        extraApplied: round2(extraApplied[i]),
        totalPaid: round2(totalPaid),
        endingBalance: round2(ending),
        closedThisMonth: closed,
      };
    });

    globalPrincipal = round2(globalPrincipal + monthPrincipal);

    months.push({
      monthIndex: m,
      monthLabel: monthLabel(monthDate),
      dateISO: toISODate(startOfMonth(monthDate)),
      payments: monthPayments,
      totals: {
        interest: round2(interestThisMonth.reduce((a, b) => a + b, 0)),
        principal: round2(monthPrincipal),
        outflow: round2(monthOutflow + (m === 0 ? 0 : 0)), // explicit
      },
    });

    // Check if all included debts are closed
    const allClosed = workingBalances.every(b => b <= 0.000001);
    if (allClosed) break;
  }

  // Build debt summaries with payoff dates
  const debtSummaries: DebtSummary[] = debts.map((d, i) => {
    const idx = payoffMonthIndex[i];
    const payoffISO = idx === null ? null : toISODate(adjustToDueDay(addMonths(planStart, idx), d.dueDay));
    return {
      id: d.id,
      name: d.name,
      apr: d.apr,
      originalBalance: round2(originalBalances[i]),
      minPayment: round2(d.minPayment),
      included: true,
      payoffMonthIndex: idx,
      payoffDateISO: payoffISO,
      totalInterestPaid: round2(totalInterestByDebt[i]),
      totalPaid: round2(totalPaidByDebt[i]),
    };
  });

  // Append excluded debts to summaries (no math, for display)
  for (const ex of debtsAll.filter(d => !d.include)) {
    debtSummaries.push({
      id: ex.id,
      name: ex.name,
      apr: ex.apr,
      originalBalance: round2(ex.balance),
      minPayment: round2(ex.minPayment),
      included: false,
      payoffMonthIndex: null,
      payoffDateISO: null,
      totalInterestPaid: 0,
      totalPaid: 0,
    });
  }

  // Totals block
  const monthsToDebtFree =
    Math.max(...debtSummaries.filter(d => d.included && d.payoffMonthIndex !== null).map(d => (d.payoffMonthIndex ?? 0))) + 1 || 0;

  const result: PlanResult = {
    strategy,
    startDateISO: toISODate(planStart),
    months,
    debts: debtSummaries,
    totals: {
      monthsToDebtFree,
      interest: round2(globalInterest),
      principal: round2(globalPrincipal),
      outflowMonthly: baseOutflow,     // constant monthly outflow (excl. one-time)
      oneTimeApplied: round2(oneTimeExtra || 0),
      totalPaid: round2(globalInterest + globalPrincipal),
    },
  };

  return result;
}

/**
 * Adjust payoff date to the debt's due day within that payoff month
 */
function adjustToDueDay(monthDate: Date, dueDay: number): Date {
  const d = new Date(monthDate);
  d.setDate(clampDueDay(dueDay));
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Banker's rounding to cents
 */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ====================================================
// Convenience Service for your pages (DebtPlan, Calendar,
// Charts, Mobile). Import and use directly.
// ====================================================

export interface EngineInputs {
  debts: DebtInput[];
  extraMonthly: number;
  oneTimeExtra: number;
  strategy?: Strategy;
  startDate?: string;
}

export class PlanService {
  static compute(inputs: EngineInputs): PlanResult {
    return computeDebtPlan({
      debts: inputs.debts,
      extraMonthly: inputs.extraMonthly,
      oneTimeExtra: inputs.oneTimeExtra,
      strategy: inputs.strategy ?? "snowball",
      startDate: inputs.startDate,
    });
  }

  /** Table-friendly debts list: name, last4 (if in name), payoff, totals */
  static debtsSummaryForPrintable(plan: PlanResult) {
    return plan.debts
      .slice()
      .sort((a, b) => {
        // included first, then by payoff month (nulls last), then name
        if (a.included !== b.included) return a.included ? -1 : 1;
        const ai = a.payoffMonthIndex ?? 1e9;
        const bi = b.payoffMonthIndex ?? 1e9;
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name);
      })
      .map(d => ({
        creditor: d.name,
        apr: d.apr,
        minPayment: d.minPayment,
        startingBalance: d.originalBalance,
        payoffDate: d.payoffDateISO,
        totalInterest: d.totalInterestPaid,
        totalPaid: d.totalPaid,
        included: d.included,
      }));
  }

  /** Month-by-month calendar (aggregate per month for widgets) */
  static calendar(plan: PlanResult) {
    return plan.months.map(m => ({
      monthIndex: m.monthIndex,
      monthLabel: m.monthLabel,
      dateISO: m.dateISO,
      totalOutflow: round2(m.payments.reduce((a, p) => a + p.totalPaid, 0)),
      totalInterest: round2(m.totals.interest),
      totalPrincipal: round2(m.totals.principal),
      payoffs: m.payments
        .filter(p => p.closedThisMonth)
        .map(p => {
          const debt = plan.debts.find(d => d.id === p.debtId);
          return { debtId: p.debtId, name: debt?.name ?? p.debtId };
        }),
    }));
  }

  /** Chart series: remaining principal by month */
  static chartSeriesRemainingPrincipal(plan: PlanResult) {
    // compute remaining aggregate principal at end of each month
    const lastBalances = new Map<string, number>();
    // initialize with originals
    plan.debts.forEach(d => {
      if (d.included) lastBalances.set(d.id, d.originalBalance);
    });

    const points: { label: string; remaining: number }[] = [];
    for (const m of plan.months) {
      // reconstruct per-debt ending balances from payments
      for (const p of m.payments) {
        if (!lastBalances.has(p.debtId)) continue;
        lastBalances.set(p.debtId, p.endingBalance);
      }
      const aggRemaining = round2(Array.from(lastBalances.values()).reduce((a, b) => a + b, 0));
      points.push({ label: m.monthLabel, remaining: aggRemaining });
    }
    return points;
  }
}

// ===============================================
// Example Usage (in your pages/components):
//
// import { PlanService, Strategy, DebtInput } from "@/lib/debtPlan";
//
// const plan = PlanService.compute({
//   debts: [
//     { id: "store", name: "Store Card ****1234", balance: 420.33, apr: 23.99, minPayment: 35, dueDay: 12, include: true },
//     { id: "medical", name: "Medical Bill ****7788", balance: 610.00, apr: 0, minPayment: 25, include: true },
//     { id: "visa", name: "Visa ****9925", balance: 2310.49, apr: 19.24, minPayment: 65, include: true },
//   ],
//   extraMonthly: 200,
//   oneTimeExtra: 1000,     // cascades on Month 1
//   strategy: "snowball",
// });
//
// // Debt Plan page:
// const rows = PlanService.debtsSummaryForPrintable(plan);
//
// // Calendar page:
// const calendar = PlanService.calendar(plan);
//
// // Chart page:
// const series = PlanService.chartSeriesRemainingPrincipal(plan);
//
// ===============================================
