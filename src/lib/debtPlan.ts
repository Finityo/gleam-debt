// ===============================================
// Finityo Debt Plan Engine — Drop-in Module
// File: src/lib/debtPlan.ts
// ===============================================
/* eslint-disable @typescript-eslint/no-unused-vars */
export type Strategy = "snowball" | "avalanche";

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

export function computeDebtPlan(params: ComputeParams): PlanResult {
  const { strategy, extraMonthly, oneTimeExtra, maxMonths = 600 } = params;
  const startISO = params.startDate ?? toISODate(new Date());
  const planStart = startOfMonth(new Date(startISO));

  const debtsAll = params.debts.map(d => ({ ...d, include: d.include !== false, dueDay: clampDueDay(d.dueDay) }));
  const debts = debtsAll.filter(d => d.include);
  if (debts.length === 0) {
    return {
      strategy, startDateISO: toISODate(planStart), months: [], debts: debtsAll.map(d=>({
        id:d.id, name:d.name, apr:d.apr, originalBalance:d.balance, minPayment:d.minPayment, included: !!d.include,
        payoffMonthIndex:null, payoffDateISO:null, totalInterestPaid:0, totalPaid:0
      })), totals: { monthsToDebtFree:0, interest:0, principal:0, outflowMonthly:0, oneTimeApplied:0, totalPaid:0 }
    };
  }

  const working = debts.map(d => Math.max(0, round2(d.balance)));
  const rates = debts.map(d => d.apr>0 ? d.apr/12/100 : 0);
  const mins = debts.map(d => Math.max(0, round2(d.minPayment)));
  const originals = [...working];

  const baseOutflow = round2(mins.reduce((a,b)=>a+b,0) + (extraMonthly || 0));

  const payoffIdx: (number|null)[] = debts.map(()=>null);
  const totalIntByDebt = debts.map(()=>0);
  const totalPaidByDebt = debts.map(()=>0);

  const months: PlanMonth[] = [];
  let globalInt = 0;
  let globalPrin = 0;

  for (let m=0;m<maxMonths;m++) {
    const mdate = addMonths(planStart, m);
    const interestThis = working.map((bal,i)=> bal>0 ? round2(bal * rates[i]) : 0);
    for (let i=0;i<working.length;i++) if (working[i]>0) {
      working[i] = round2(working[i] + interestThis[i]);
      totalIntByDebt[i] = round2(totalIntByDebt[i] + interestThis[i]);
      globalInt = round2(globalInt + interestThis[i]);
    }

    let pool = round2(baseOutflow + (m===0 ? (oneTimeExtra||0) : 0));

    const minApplied = mins.map((min,i)=>{
      if (working[i]<=0) return 0;
      const pay = Math.min(min, working[i]);
      pool = round2(pool - pay);
      working[i] = round2(working[i] - pay);
      totalPaidByDebt[i] = round2(totalPaidByDebt[i] + pay);
      return pay;
    });

    const order = sortIndex(strategy, debts.map((d,i)=>({ balance: working[i], apr: d.apr })));
    const extraApplied = debts.map(()=>0);
    for (const idx of order) {
      if (pool<=0) break;
      if (working[idx]<=0) continue;
      const pay = Math.min(working[idx], pool);
      extraApplied[idx] = round2(extraApplied[idx] + pay);
      working[idx] = round2(working[idx] - pay);
      totalPaidByDebt[idx] = round2(totalPaidByDebt[idx] + pay);
      pool = round2(pool - pay);
    }

    let monthOut = 0, monthPrin = 0;
    const payments: DebtMonthPayment[] = debts.map((d,i)=>{
      const starting = round2(working[i] + minApplied[i] + extraApplied[i]);
      const interest = interestThis[i];
      const totalPaid = round2(minApplied[i] + extraApplied[i]);
      const ending = working[i];
      const closed = starting>0 && ending===0;
      if (closed && payoffIdx[i]===null) payoffIdx[i] = m;

      monthOut = round2(monthOut + totalPaid);
      monthPrin = round2(monthPrin + totalPaid);

      return {
        debtId: d.id,
        startingBalance: starting,
        interestAccrued: interest,
        minApplied: round2(minApplied[i]),
        extraApplied: round2(extraApplied[i]),
        totalPaid,
        endingBalance: ending,
        closedThisMonth: closed
      };
    });

    globalPrin = round2(globalPrin + monthPrin);

    months.push({
      monthIndex: m,
      monthLabel: monthLabel(mdate),
      dateISO: toISODate(startOfMonth(mdate)),
      payments,
      totals: { interest: round2(interestThis.reduce((a,b)=>a+b,0)), principal: monthPrin, outflow: monthOut }
    });

    if (working.every(b=>b<=0.000001)) break;
  }

  const summaries: DebtSummary[] = debts.map((d,i)=>{
    const idx = payoffIdx[i];
    return {
      id:d.id, name:d.name, apr:d.apr, originalBalance: round2(originals[i]), minPayment: round2(d.minPayment), included: true,
      payoffMonthIndex: idx, payoffDateISO: (idx===null?null: toISODate(adjustToDueDay(addMonths(planStart, idx), d.dueDay!))),
      totalInterestPaid: round2(totalIntByDebt[i]), totalPaid: round2(totalPaidByDebt[i])
    };
  });
  for (const ex of debtsAll.filter(d=>!d.include)) {
    summaries.push({
      id: ex.id, name: ex.name, apr: ex.apr, originalBalance: round2(ex.balance), minPayment: round2(ex.minPayment),
      included:false, payoffMonthIndex:null, payoffDateISO:null, totalInterestPaid:0, totalPaid:0
    });
  }

  const monthsToDebtFree =
    Math.max(...summaries.filter(s=>s.included && s.payoffMonthIndex!==null).map(s=>s.payoffMonthIndex ?? 0)) + 1 || 0;

  return {
    strategy,
    startDateISO: toISODate(planStart),
    months,
    debts: summaries,
    totals: {
      monthsToDebtFree,
      interest: round2(globalInt),
      principal: round2(globalPrin),
      outflowMonthly: baseOutflow,
      oneTimeApplied: round2(oneTimeExtra || 0),
      totalPaid: round2(globalInt + globalPrin),
    }
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
