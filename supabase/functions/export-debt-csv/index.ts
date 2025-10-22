import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const debtSchema = z.object({
  name: z.string().trim().min(1).max(100),
  last4: z.string().max(4).optional(),
  balance: z.number().min(0).max(100000000),
  minPayment: z.number().min(0).max(1000000),
  apr: z.number().min(0).max(100),
  dueDate: z.string().optional()
});

const requestSchema = z.object({
  debts: z.array(debtSchema).min(1).max(100),
  extraMonthly: z.number().min(0).max(1000000),
  oneTime: z.number().min(0).max(10000000).optional(),
  strategy: z.enum(['snowball', 'avalanche'])
});

type Strategy = "snowball" | "avalanche";

interface DebtInput {
  id?: string;
  name: string;
  last4?: string;
  balance: number;
  minPayment: number;
  apr: number;
  dueDate?: string | null;
}

interface ComputeRequest {
  debts: DebtInput[];
  extraMonthly: number;
  oneTime?: number;
  strategy: Strategy;
}

interface DebtPlanRow {
  index: number;
  label: string;
  name: string;
  last4?: string;
  balance: number;
  minPayment: number;
  apr: number;
  monthlyRate: number;
  totalPayment: number;
  monthsToPayoff: number;
  cumulativeMonths: number;
  dueDate?: string | null;
}

function normalizeAPR(apr: number): number {
  return apr > 1 ? apr / 100 : apr;
}

function sortDebts(debts: DebtInput[], strategy: Strategy): DebtInput[] {
  const copy = debts.slice();
  if (strategy === "avalanche") {
    copy.sort((a, b) => {
      const aAPR = normalizeAPR(a.apr);
      const bAPR = normalizeAPR(b.apr);
      if (bAPR !== aAPR) return bAPR - aAPR;
      if (a.balance !== b.balance) return a.balance - b.balance;
      return (b.minPayment || 0) - (a.minPayment || 0);
    });
  } else {
    // Snowball: sort by balance ascending
    // If within $5, break ties by higher APR first
    copy.sort((a, b) => {
      const balanceDiff = Math.abs(a.balance - b.balance);
      if (balanceDiff <= 5) {
        // Within $5, prioritize higher APR
        const aAPR = normalizeAPR(a.apr);
        const bAPR = normalizeAPR(b.apr);
        return bAPR - aAPR;
      }
      return a.balance - b.balance;
    });
  }
  return copy;
}

function monthsToPayoff(balance: number, payment: number, monthlyRate: number): number {
  if (balance <= 0 || payment <= 0) return 0;
  if (monthlyRate <= 0) return Math.ceil(balance / payment);
  if (payment <= monthlyRate * balance) return 0;
  const months = Math.log(payment / (payment - monthlyRate * balance)) / Math.log(1 + monthlyRate);
  return Math.ceil(months);
}

function computePlan(req: ComputeRequest) {
  const userExtraBudget = Math.max(0, req.extraMonthly || 0);
  const oneTimePayment = Math.max(0, req.oneTime || 0);

  // Filter: only debts with balance > 0 and valid name
  const cleaned = req.debts
    .filter(d => d.name?.trim() && d.balance > 0)
    .map(d => ({
      ...d,
      apr: normalizeAPR(d.apr),
      minPayment: Math.max(0, d.minPayment || 0),
      balance: Math.max(0, d.balance || 0)
    }));

  // Sort according to strategy
  const ordered = sortDebts(cleaned, req.strategy);

  // Initialize tracking for each debt
  const debtsTracking = ordered.map(d => ({
    ...d,
    currentBalance: d.balance,
    totalInterest: 0,
    totalPaid: 0,
    paidOffMonth: 0
  }));

  // Apply one-time payment cascading through debts in order
  if (oneTimePayment > 0) {
    let remainingOneTime = oneTimePayment;
    for (let i = 0; i < debtsTracking.length && remainingOneTime > 0; i++) {
      const amountToApply = Math.min(remainingOneTime, debtsTracking[i].currentBalance);
      debtsTracking[i].currentBalance -= amountToApply;
      remainingOneTime -= amountToApply;
    }
  }

  let snowballExtra = userExtraBudget;
  let month = 1;
  const maxMonths = 360; // safety limit

  // Monthly loop
  while (month <= maxMonths) {
    let anyDebtRemaining = false;
    let currentSmallestIndex = -1;

    // Find the current smallest unpaid debt
    for (let i = 0; i < debtsTracking.length; i++) {
      if (debtsTracking[i].currentBalance > 0) {
        currentSmallestIndex = i;
        anyDebtRemaining = true;
        break;
      }
    }

    if (!anyDebtRemaining) break;

    // Process each debt
    for (let i = 0; i < debtsTracking.length; i++) {
      const debt = debtsTracking[i];
      
      if (debt.currentBalance <= 0) continue;

      const monthlyRate = debt.apr / 12;
      const interest = debt.currentBalance * monthlyRate;
      
      // Determine target payment
      const targetPayment = i === currentSmallestIndex 
        ? debt.minPayment + snowballExtra 
        : debt.minPayment;

      // Calculate actual payment (can't exceed balance + interest)
      const actualPayment = Math.min(targetPayment, debt.currentBalance + interest);
      const principal = actualPayment - interest;

      // Update balance
      const newBalance = Math.max(0, debt.currentBalance - principal);
      
      debt.currentBalance = newBalance;
      debt.totalInterest += interest;
      debt.totalPaid += actualPayment;

      // Check if debt was paid off this month
      if (debt.currentBalance === 0 && debt.paidOffMonth === 0) {
        debt.paidOffMonth = month;
        // Roll this debt's minimum payment into snowballExtra
        snowballExtra += debt.minPayment;
      }
    }

    month++;
  }

  // Build output rows
  const rows: DebtPlanRow[] = ordered.map((d, i) => {
    const tracked = debtsTracking[i];
    const label = d.last4 ? `${d.name} (${d.last4})` : d.name;
    
    return {
      index: i + 1,
      label,
      name: d.name,
      last4: d.last4,
      balance: d.balance - (i === 0 ? oneTimePayment : 0),
      minPayment: d.minPayment,
      apr: d.apr,
      monthlyRate: d.apr / 12,
      totalPayment: tracked.totalPaid,
      monthsToPayoff: tracked.paidOffMonth,
      cumulativeMonths: tracked.paidOffMonth,
      dueDate: d.dueDate ?? null
    };
  });

  const totals = {
    numDebts: rows.length,
    sumBalance: rows.reduce((s, r) => s + r.balance, 0),
    sumMinPayment: rows.reduce((s, r) => s + r.minPayment, 0),
    strategy: req.strategy,
    extraMonthly: userExtraBudget,
    oneTime: oneTimePayment,
    totalMonths: rows.at(-1)?.monthsToPayoff ?? 0
  };

  return { rows, totals };
}

function exportCSV(result: { rows: DebtPlanRow[], totals: any }): string {
  const header = [
    "Index","Debt","Name","Last4","Balance","MinPayment","APR","MonthlyRate",
    "TotalPayment","MonthsToPayoff","CumulativeMonths","DueDate"
  ];
  const lines = [header.join(",")];

  result.rows.forEach(r => {
    lines.push([
      r.index,
      `"${r.label.replace(/"/g, '""')}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      r.last4 ?? "",
      r.balance.toFixed(2),
      r.minPayment.toFixed(2),
      r.apr.toFixed(6),
      r.monthlyRate.toFixed(6),
      r.totalPayment.toFixed(2),
      r.monthsToPayoff,
      r.cumulativeMonths,
      r.dueDate ?? ""
    ].join(","));
  });

  lines.push([
    "",
    "TOTALS",
    "",
    "",
    result.totals.sumBalance.toFixed(2),
    result.totals.sumMinPayment.toFixed(2),
    "",
    "",
    "",
    result.totals.totalMonths,
    result.totals.totalMonths,
    ""
  ].join(","));

  return lines.join("\n");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validated = requestSchema.parse(body);
    
    // Normalize APR to decimal
    validated.debts.forEach(d => (d.apr = d.apr > 1 ? d.apr / 100 : d.apr));
    
    const result = computePlan(validated);
    const csv = exportCSV(result);
    
    const filename = validated.strategy === 'snowball' ? 'Snowball.csv' : 'Avalanche.csv';

    return new Response(csv, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=${filename}`
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: error.errors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    console.error('Error in export-debt-csv:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
