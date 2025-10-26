import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import ExcelJS from "npm:exceljs@4.4.0";
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
    
    // Calculate the starting balance after one-time payment was applied
    let startingBalance = d.balance;
    let remainingOneTime = oneTimePayment;
    
    // Simulate the one-time payment application to determine this debt's starting balance
    for (let j = 0; j < i && remainingOneTime > 0; j++) {
      const amountToApply = Math.min(remainingOneTime, ordered[j].balance);
      remainingOneTime -= amountToApply;
    }
    
    if (remainingOneTime > 0) {
      startingBalance = Math.max(0, startingBalance - remainingOneTime);
    }
    
    return {
      index: i + 1,
      label,
      name: d.name,
      last4: d.last4,
      balance: startingBalance,
      minPayment: startingBalance === 0 ? 0 : d.minPayment,
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

async function exportXLSX(result: { rows: DebtPlanRow[], totals: any }): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Debt Plan");
  
  // Get current date for export
  const exportDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Add date row (row 1)
  ws.mergeCells('A1:J1');
  const dateCell = ws.getCell('A1');
  dateCell.value = `Exported: ${exportDate}`;
  dateCell.alignment = { horizontal: 'left', vertical: 'middle' };
  
  // Add empty row for spacing (row 2)
  ws.addRow([]);
  
  // Add empty row for spacing (row 3)
  ws.addRow([]);

  // Define column headers (row 4) to match uploaded format exactly
  const headerRow = ws.addRow([
    'No.',
    'Creditor',
    'Last 4',
    'Balance',
    'min payment',
    'APR',
    '', // Monthly rate column (unlabeled)
    '', // Total payment column (unlabeled)
    '', // Empty column
    'Due Date',
    'Est. Months'
  ]);
  
  // Set column widths
  ws.columns = [
    { width: 6 },   // No.
    { width: 30 },  // Creditor
    { width: 8 },   // Last 4
    { width: 12 },  // Balance
    { width: 12 },  // min payment
    { width: 10 },  // APR
    { width: 14 },  // Monthly rate (unlabeled)
    { width: 14 },  // Total payment (unlabeled)
    { width: 8 },   // Empty
    { width: 10 },  // Due Date
    { width: 12 }   // Est. Months
  ];

  // Style header row
  headerRow.font = { bold: false };
  headerRow.alignment = { horizontal: 'left', vertical: 'middle' };

  // Add data rows
  result.rows.forEach(r => {
    ws.addRow([
      r.index,
      r.name,
      r.last4 ?? "",
      r.balance,
      r.minPayment,
      r.apr,
      r.monthlyRate,
      r.totalPayment,
      "", // Empty column
      r.dueDate ?? "",
      r.monthsToPayoff
    ]);
  });

  // Add totals row
  const totalsRow = ws.addRow([
    "",
    "",
    "",
    result.totals.sumBalance,
    result.totals.sumMinPayment,
    "",
    "",
    "",
    "",
    result.totals.totalMonths,
    ""
  ]);
  totalsRow.font = { bold: false };

  const buf = await wb.xlsx.writeBuffer();
  return buf;
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
    const xlsx = await exportXLSX(result);
    
    const filename = validated.strategy === 'snowball' ? 'Snowball.xlsx' : 'Avalanche.xlsx';

    return new Response(xlsx, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    console.error('Error in export-debt-xlsx:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
