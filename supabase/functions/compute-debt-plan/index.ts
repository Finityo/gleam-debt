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
    copy.sort((a, b) => {
      if (a.balance !== b.balance) return a.balance - b.balance;
      return (b.minPayment || 0) - (a.minPayment || 0);
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
  const extra = Math.max(0, req.extraMonthly || 0);
  const oneTime = Math.max(0, req.oneTime || 0);

  const cleaned = req.debts
    .filter(d => d.name?.trim())
    .map(d => ({
      ...d,
      apr: normalizeAPR(d.apr),
      minPayment: Math.max(0, d.minPayment || 0),
      balance: Math.max(0, d.balance || 0)
    }));

  const ordered = sortDebts(cleaned, req.strategy);

  const rows: DebtPlanRow[] = [];
  let cumMin = 0;
  let cumMonths = 0;

  ordered.forEach((d, i) => {
    cumMin += d.minPayment;
    const monthlyRate = d.apr > 0 ? d.apr / 12 : 0;
    const totalPayment = extra + cumMin;

    const effectiveBalance = i === 0 ? Math.max(0, d.balance - oneTime) : d.balance;

    const m = monthsToPayoff(effectiveBalance, totalPayment, monthlyRate);
    cumMonths += m;

    const label = d.last4 ? `${d.name} (${d.last4})` : d.name;

    rows.push({
      index: i + 1,
      label,
      name: d.name,
      last4: d.last4,
      balance: effectiveBalance,
      minPayment: d.minPayment,
      apr: d.apr,
      monthlyRate,
      totalPayment,
      monthsToPayoff: m,
      cumulativeMonths: cumMonths,
      dueDate: d.dueDate ?? null
    });
  });

  const totals = {
    numDebts: rows.length,
    sumBalance: rows.reduce((s, r) => s + r.balance, 0),
    sumMinPayment: rows.reduce((s, r) => s + r.minPayment, 0),
    strategy: req.strategy,
    extraMonthly: extra,
    oneTime,
    totalMonths: rows.at(-1)?.cumulativeMonths ?? 0
  };

  return { rows, totals };
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

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: error.errors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    console.error('Error in compute-debt-plan:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
