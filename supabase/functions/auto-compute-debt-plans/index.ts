import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DebtInput {
  name: string;
  last4?: string;
  balance: number;
  minPayment: number;
  apr: number;
  dueDate?: string | null;
}

type Strategy = "snowball" | "avalanche";

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
      const balanceDiff = Math.abs(a.balance - b.balance);
      if (balanceDiff <= 5) {
        const aAPR = normalizeAPR(a.apr);
        const bAPR = normalizeAPR(b.apr);
        return bAPR - aAPR;
      }
      return a.balance - b.balance;
    });
  }
  return copy;
}

function computePlan(debts: DebtInput[], extraMonthly: number, oneTime: number, strategy: Strategy) {
  const userExtraBudget = Math.max(0, extraMonthly || 0);
  const oneTimePayment = Math.max(0, oneTime || 0);

  const cleaned = debts
    .filter(d => d.name?.trim() && d.balance > 0 && (d.minPayment || 0) > 0)
    .map(d => ({
      ...d,
      apr: normalizeAPR(d.apr),
      minPayment: Math.max(0, d.minPayment || 0),
      balance: Math.max(0, d.balance || 0)
    }));

  const ordered = sortDebts(cleaned, strategy);

  const debtsTracking = ordered.map(d => ({
    ...d,
    currentBalance: d.balance,
    totalInterest: 0,
    totalPaid: 0,
    paidOffMonth: 0
  }));

  if (oneTimePayment > 0) {
    let remainingOneTime = oneTimePayment;
    for (let i = 0; i < debtsTracking.length && remainingOneTime > 0; i++) {
      const amountToApply = Math.min(remainingOneTime, debtsTracking[i].currentBalance);
      debtsTracking[i].currentBalance -= amountToApply;
      remainingOneTime -= amountToApply;
    }
  }

  let snowballExtra = userExtraBudget;
  const schedule = [];
  const payoffOrder: string[] = [];
  let month = 1;
  const maxMonths = 360;

  while (month <= maxMonths) {
    const monthSnapshot: {
      month: number;
      debts: Array<{
        name: string;
        last4?: string;
        payment: number;
        interest: number;
        principal: number;
        endBalance: number;
      }>;
      snowballExtra: number;
      totalPaidThisMonth: number;
      totalRemaining: number;
    } = {
      month,
      debts: [],
      snowballExtra,
      totalPaidThisMonth: 0,
      totalRemaining: 0
    };

    let anyDebtRemaining = false;
    let currentSmallestIndex = -1;

    for (let i = 0; i < debtsTracking.length; i++) {
      if (debtsTracking[i].currentBalance > 0) {
        currentSmallestIndex = i;
        anyDebtRemaining = true;
        break;
      }
    }

    if (!anyDebtRemaining) break;

    for (let i = 0; i < debtsTracking.length; i++) {
      const debt = debtsTracking[i];
      
      if (debt.currentBalance <= 0) {
        monthSnapshot.debts.push({
          name: debt.name,
          last4: debt.last4,
          payment: 0,
          interest: 0,
          principal: 0,
          endBalance: 0
        });
        continue;
      }

      const monthlyRate = debt.apr / 12;
      const interest = debt.currentBalance * monthlyRate;
      
      const targetPayment = i === currentSmallestIndex 
        ? debt.minPayment + snowballExtra 
        : debt.minPayment;

      const actualPayment = Math.min(targetPayment, debt.currentBalance + interest);
      const principal = actualPayment - interest;

      const newBalance = Math.max(0, debt.currentBalance - principal);
      
      monthSnapshot.debts.push({
        name: debt.name,
        last4: debt.last4,
        payment: actualPayment,
        interest,
        principal,
        endBalance: newBalance
      });

      debt.currentBalance = newBalance;
      debt.totalInterest += interest;
      debt.totalPaid += actualPayment;
      monthSnapshot.totalPaidThisMonth += actualPayment;

      if (debt.currentBalance === 0 && debt.paidOffMonth === 0) {
        debt.paidOffMonth = month;
        payoffOrder.push(debt.name);
        snowballExtra += debt.minPayment;
      }
    }

    monthSnapshot.totalRemaining = debtsTracking.reduce((sum, d) => sum + d.currentBalance, 0);
    schedule.push(monthSnapshot);

    if (monthSnapshot.totalRemaining === 0) break;
    month++;
  }

  const rows = ordered.map((d, i) => {
    const tracked = debtsTracking[i];
    const label = d.last4 ? `${d.name} (${d.last4})` : d.name;
    
    let startingBalance = d.balance;
    let remainingOneTime = oneTimePayment;
    
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
      totalPayment: 0,
      monthsToPayoff: tracked.paidOffMonth,
      cumulativeMonths: tracked.paidOffMonth,
      dueDate: d.dueDate ?? null
    };
  });

  const totals = {
    numDebts: rows.length,
    sumBalance: rows.reduce((s, r) => s + r.balance, 0),
    sumMinPayment: rows.reduce((s, r) => s + r.minPayment, 0),
    strategy,
    extraMonthly: userExtraBudget,
    oneTime: oneTimePayment,
    totalMonths: schedule.length,
    debtFreeMonth: schedule.length
  };

  return { rows, totals, schedule, payoffOrder };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  );

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log(`[AUTO-COMPUTE] Starting for user: ${user.id}`);

    // Fetch user's debts
    const { data: debts, error: debtsError } = await supabaseClient
      .from('debts')
      .select('name, last4, balance, min_payment, apr, due_date')
      .eq('user_id', user.id);

    if (debtsError) throw debtsError;

    if (!debts || debts.length === 0) {
      console.log('[AUTO-COMPUTE] No debts found, skipping computation');
      return new Response(
        JSON.stringify({ message: 'No debts to compute' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user's calculator settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('debt_calculator_settings')
      .select('extra_monthly, one_time, strategy')
      .eq('user_id', user.id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.log('[AUTO-COMPUTE] Settings error (non-fatal):', settingsError);
    }

    const extraMonthly = settings?.extra_monthly || 0;
    const oneTime = settings?.one_time || 0;
    const strategies: Strategy[] = ['snowball', 'avalanche'];

    const debtInputs: DebtInput[] = debts.map(d => ({
      name: d.name,
      last4: d.last4 || undefined,
      balance: parseFloat(d.balance?.toString() || '0'),
      minPayment: parseFloat(d.min_payment?.toString() || '0'),
      apr: parseFloat(d.apr?.toString() || '0'),
      dueDate: d.due_date
    }));

    console.log(`[AUTO-COMPUTE] Computing plans for ${debts.length} debts`);

    // Compute both strategies
    for (const strategy of strategies) {
      const planData = computePlan(debtInputs, extraMonthly, oneTime, strategy);
      
      // Store or update the computed plan
      const { error: upsertError } = await supabaseClient
        .from('debt_plans')
        .upsert({
          user_id: user.id,
          strategy,
          extra_monthly: extraMonthly,
          one_time: oneTime,
          plan_data: planData,
          debt_snapshot: debtInputs,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,strategy'
        });

      if (upsertError) {
        console.error(`[AUTO-COMPUTE] Error storing ${strategy} plan:`, upsertError);
      } else {
        console.log(`[AUTO-COMPUTE] Successfully stored ${strategy} plan`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Debt plans computed and stored',
        debtsProcessed: debts.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AUTO-COMPUTE] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});