// ===============================================
// Finityo Debt Plan Engine — Drop-in Module
// File: src/lib/debtPlan.ts
// ===============================================
/* eslint-disable @typescript-eslint/no-unused-vars */
export type Strategy = "snowball" | "avalanche";

/**
 * Normalize APR values from various formats
 * Handles: strings with %, numbers over 1000 (2499 → 24.99), etc.
 */
export function normalizeAPR(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "string") {
    const cleaned = parseFloat(value.replace("%", "").trim());
    if (isNaN(cleaned)) return 0;
    return cleaned > 100 ? cleaned / 100 : cleaned;
  }
  if (typeof value === "number") {
    if (value > 1000) return value / 100; // e.g. 2499 → 24.99
    return value;
  }
  return 0;
}

/**
 * Apply APR normalization to an array of debts
 */
export function applyAPRNormalization(debts: DebtInput[]): DebtInput[] {
  return debts.map(d => ({
    ...d,
    apr: normalizeAPR(d.apr),
  }));
}

/**
 * Format APR for display (e.g., "24.99%")
 */
export function formatAPR(value: number | string): string {
  const n = normalizeAPR(value);
  return `${n.toFixed(2)}%`;
}

export interface DebtInput {
  id: string;
  name: string;
  balance: number;
  apr: number;            // percent, e.g. 19.99
  minPayment: number;
  dueDay?: number;        // 1..28
  include?: boolean;      // default true
  notes?: string;
}

export interface ComputeParams {
  debts: DebtInput[];
  strategy: Strategy;
  extraMonthly: number;
  oneTimeExtra: number;
  startDate?: string;
  maxMonths?: number;
}

export interface DebtMonthPayment {
  debtId: string;
  startingBalance: number;
  interestAccrued: number;
  minApplied: number;
  extraApplied: number;
  totalPaid: number;
  endingBalance: number;
  closedThisMonth: boolean;
}

export interface PlanMonth {
  monthIndex: number;
  monthLabel: string;
  dateISO: string;
  payments: DebtMonthPayment[];
  totals: {
    interest: number;
    principal: number;
    outflow: number;
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
  totalPaid: number;
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
    outflowMonthly: number;
    oneTimeApplied: number;
    totalPaid: number;
  };
}

function toISODate(d: Date): string { return d.toISOString().slice(0,10); }
function startOfMonth(d: Date): Date { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
function addMonths(d: Date, n: number): Date { const x = new Date(d); x.setMonth(x.getMonth()+n); return x; }
function monthLabel(d: Date): string { return d.toLocaleString("en-US", { month: "short", year: "numeric" }); }
function clampDueDay(day?: number): number { if (!day || day < 1) return 15; return Math.min(Math.max(day,1),28); }
function round2(n: number): number { return Math.round((n + Number.EPSILON)*100)/100; }

function sortIndex(strategy: Strategy, items: { balance: number; apr: number }[]): number[] {
  const arr = items.map((v,i)=>({i,...v}));
  if (strategy === "snowball") arr.sort((a,b)=> a.balance - b.balance || b.apr - a.apr);
  else arr.sort((a,b)=> b.apr - a.apr || a.balance - b.balance);
  return arr.map(x=>x.i);
}

function adjustToDueDay(monthDate: Date, dueDay: number): Date {
  const d = new Date(monthDate);
  d.setDate(clampDueDay(dueDay));
  d.setHours(0,0,0,0);
  return d;
}

// =============================================================
// TRUE CASCADING DEBT SNOWBALL ENGINE
// Applies one-time extra immediately and rolls every freed minimum
// =============================================================
export function computeDebtPlan(params: ComputeParams): PlanResult {
  const { strategy, extraMonthly, oneTimeExtra, maxMonths = 600 } = params;
  const startISO = params.startDate ?? toISODate(new Date());
  const planStart = startOfMonth(new Date(startISO));

  const debtsAll = applyAPRNormalization(params.debts).map(d => ({
    ...d,
    include: d.include !== false,
    dueDay: clampDueDay(d.dueDay),
  }));
  const debts = debtsAll.filter(d => d.include);
  if (!debts.length) {
    return {
      strategy,
      startDateISO: toISODate(planStart),
      months: [],
      debts: [],
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

  const balances = debts.map(d => round2(Math.max(0, d.balance)));
  const monthlyRates = debts.map(d => normalizeAPR(d.apr) / 12 / 100);
  const mins = debts.map(d => round2(d.minPayment));
  const originals = [...balances];

  const payoffIdx: (number | null)[] = debts.map(() => null);
  const totalIntByDebt = debts.map(() => 0);
  const totalPaidByDebt = debts.map(() => 0);

  const months: PlanMonth[] = [];
  let globalInt = 0, globalPrin = 0;

  // ====== rolling snowball tracker ======
  let rollingExtra = extraMonthly;           // monthly recurring extra
  let carryOver = 0;                         // freed mins that join snowball next month

  for (let m = 0; m < maxMonths; m++) {
    const monthDate = addMonths(planStart, m);
    const interestThis = balances.map((b, i) => b > 0 ? round2(b * monthlyRates[i]) : 0);

    // accrue interest
    for (let i = 0; i < balances.length; i++) {
      balances[i] = round2(balances[i] + interestThis[i]);
      totalIntByDebt[i] = round2(totalIntByDebt[i] + interestThis[i]);
      globalInt = round2(globalInt + interestThis[i]);
    }

    // month pool = all mins + current rolling extra (+ one-time for month 0)
    let monthPool = mins.reduce((a, b) => a + b, 0) + rollingExtra + carryOver;
    if (m === 0) monthPool += oneTimeExtra || 0;

    const minApplied = mins.map((min, i) => {
      if (balances[i] <= 0) return 0;
      const pay = Math.min(min, balances[i]);
      balances[i] = round2(balances[i] - pay);
      totalPaidByDebt[i] = round2(totalPaidByDebt[i] + pay);
      monthPool = round2(monthPool - pay);
      return pay;
    });

    // allocate remaining pool by strategy order
    const order = sortIndex(strategy, debts.map((d, i) => ({ balance: balances[i], apr: normalizeAPR(d.apr) })));
    const extraApplied = debts.map(() => 0);
    let freedMins = 0;

    for (const idx of order) {
      if (monthPool <= 0) break;
      if (balances[idx] <= 0) continue;
      const pay = Math.min(balances[idx], monthPool);
      balances[idx] = round2(balances[idx] - pay);
      extraApplied[idx] = round2(extraApplied[idx] + pay);
      totalPaidByDebt[idx] = round2(totalPaidByDebt[idx] + pay);
      monthPool = round2(monthPool - pay);
      // if debt closes here, add its min to next month
      if (balances[idx] === 0 && payoffIdx[idx] === null) {
        payoffIdx[idx] = m;
        freedMins += mins[idx];
      }
    }

    const monthPayments: DebtMonthPayment[] = debts.map((d, i) => {
      const starting = round2(balances[i] + minApplied[i] + extraApplied[i]);
      const ending = balances[i];
      const closed = starting > 0 && ending === 0;
      if (closed && payoffIdx[i] === null) payoffIdx[i] = m;
      const totalPaid = round2(minApplied[i] + extraApplied[i]);
      globalPrin = round2(globalPrin + totalPaid);
      return {
        debtId: d.id,
        startingBalance: starting,
        interestAccrued: interestThis[i],
        minApplied: minApplied[i],
        extraApplied: extraApplied[i],
        totalPaid,
        endingBalance: ending,
        closedThisMonth: closed,
      };
    });

    months.push({
      monthIndex: m,
      monthLabel: monthLabel(monthDate),
      dateISO: toISODate(startOfMonth(monthDate)),
      payments: monthPayments,
      totals: {
        interest: round2(interestThis.reduce((a, b) => a + b, 0)),
        principal: round2(monthPayments.reduce((a, p) => a + p.totalPaid, 0)),
        outflow: round2(monthPayments.reduce((a, p) => a + p.totalPaid, 0)),
      },
    });

    // ====== grow snowball for next month ======
    carryOver = freedMins;                   // add freed mins next month
    if (balances.every(b => b <= 0.0001)) break;
  }

  // summaries
  const summaries: DebtSummary[] = debts.map((d, i) => {
    const idx = payoffIdx[i];
    return {
      id: d.id,
      name: d.name,
      apr: normalizeAPR(d.apr),
      originalBalance: round2(originals[i]),
      minPayment: round2(d.minPayment),
      included: true,
      payoffMonthIndex: idx,
      payoffDateISO: idx === null ? null : toISODate(adjustToDueDay(addMonths(planStart, idx), d.dueDay!)),
      totalInterestPaid: round2(totalIntByDebt[i]),
      totalPaid: round2(totalPaidByDebt[i]),
    };
  });

  // append excluded
  for (const ex of debtsAll.filter(d => !d.include)) {
    summaries.push({
      id: ex.id,
      name: ex.name,
      apr: normalizeAPR(ex.apr),
      originalBalance: round2(ex.balance),
      minPayment: round2(ex.minPayment),
      included: false,
      payoffMonthIndex: null,
      payoffDateISO: null,
      totalInterestPaid: 0,
      totalPaid: 0,
    });
  }

  const monthsToDebtFree =
    Math.max(...summaries.filter(s => s.included && s.payoffMonthIndex !== null).map(s => s.payoffMonthIndex ?? 0)) + 1 || 0;

  return {
    strategy,
    startDateISO: toISODate(planStart),
    months,
    debts: summaries,
    totals: {
      monthsToDebtFree,
      interest: round2(globalInt),
      principal: round2(globalPrin),
      outflowMonthly: round2(extraMonthly + mins.reduce((a, b) => a + b, 0)),
      oneTimeApplied: round2(oneTimeExtra || 0),
      totalPaid: round2(globalInt + globalPrin),
    },
  };
}

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
      startDate: inputs.startDate
    });
  }
  static debtsSummaryForPrintable(plan: PlanResult) {
    return plan.debts
      .slice()
      .sort((a,b)=>{
        if (a.included!==b.included) return a.included?-1:1;
        const ai=a.payoffMonthIndex??1e9, bi=b.payoffMonthIndex??1e9;
        if (ai!==bi) return ai-bi;
        return a.name.localeCompare(b.name);
      })
      .map(d=>({
        creditor:d.name, apr:d.apr, minPayment:d.minPayment, startingBalance:d.originalBalance,
        payoffDate:d.payoffDateISO, totalInterest:d.totalInterestPaid, totalPaid:d.totalPaid, included:d.included
      }));
  }
  static calendar(plan: PlanResult) {
    return plan.months.map(m=>({
      monthIndex:m.monthIndex, monthLabel:m.monthLabel, dateISO:m.dateISO,
      totalOutflow: round2(m.payments.reduce((a,p)=>a+p.totalPaid,0)),
      totalInterest: round2(m.totals.interest), totalPrincipal: round2(m.totals.principal),
      payoffs: m.payments.filter(p=>p.closedThisMonth).map(p=> {
        const d = plan.debts.find(x=>x.id===p.debtId);
        return { debtId:p.debtId, name: d?.name ?? p.debtId };
      })
    }));
  }
  static chartSeriesRemainingPrincipal(plan: PlanResult) {
    const last = new Map<string, number>();
    plan.debts.forEach(d=>{ if(d.included) last.set(d.id, d.originalBalance); });
    const points:{label:string;remaining:number}[]=[];
    for (const m of plan.months) {
      for (const p of m.payments) if (last.has(p.debtId)) last.set(p.debtId, p.endingBalance);
      points.push({ label:m.monthLabel, remaining: round2(Array.from(last.values()).reduce((a,b)=>a+b,0)) });
    }
    return points;
  }
}
