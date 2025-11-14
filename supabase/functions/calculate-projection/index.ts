import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type DebtRecord = {
  id: string;
  user_id: string;
  name?: string;
  balance: number;
  apr: number;
  min_payment: number;
};

type Strategy = 'snowball' | 'avalanche';

type ProjectionResult = {
  strategy: Strategy;
  months: number;
  debt_free_date: string;
  total_interest: number;
  monthly_projection: { month: number; remaining: number }[];
};

type ProjectionResponse = {
  snowball: ProjectionResult;
  avalanche: ProjectionResult;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Calculating projection for user:', user.id);

    // Fetch debts
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('id, user_id, name, balance, apr, min_payment')
      .eq('user_id', user.id);

    if (debtsError) throw debtsError;

    const activeDebts = (debts || []).filter((d: any) => Number(d.balance) > 0);

    if (activeDebts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active debts found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch settings
    const { data: settings, error: settingsError } = await supabase
      .from('debt_calculator_settings')
      .select('strategy, extra_monthly')
      .eq('user_id', user.id)
      .maybeSingle();

    if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

    const monthlyExtra = Number(settings?.extra_monthly ?? 0);

    const snowball = simulatePlan(activeDebts as DebtRecord[], monthlyExtra, 'snowball');
    const avalanche = simulatePlan(activeDebts as DebtRecord[], monthlyExtra, 'avalanche');

    const response: ProjectionResponse = {
      snowball,
      avalanche
    };

    console.log('Projection calculated:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error calculating projection:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function simulatePlan(
  debts: DebtRecord[],
  monthlyExtra: number,
  strategy: Strategy
): ProjectionResult {
  const items = debts.map(d => ({
    id: d.id,
    name: d.name || 'Debt',
    balance: Number(d.balance),
    apr: Math.max(0, Number(d.apr) || 0),
    minPayment: Math.max(0, Number(d.min_payment) || 0),
    totalInterest: 0
  }));

  const sortDebts = () => {
    if (strategy === 'snowball') {
      items.sort((a, b) => a.balance - b.balance);
    } else {
      items.sort((a, b) => b.apr - a.apr || a.balance - b.balance);
    }
  };

  sortDebts();

  const totalMinBase = items.reduce((t, d) => t + d.minPayment, 0);
  const monthlyBudget = totalMinBase + monthlyExtra;

  let monthCount = 0;
  let totalInterestPaid = 0;
  const monthlyProjection: { month: number; remaining: number }[] = [];

  const now = new Date();
  const maxMonths = 50 * 12;

  while (true) {
    const remainingPrincipal = items.reduce((t, d) => t + d.balance, 0);
    monthlyProjection.push({
      month: monthCount + 1,
      remaining: round2(remainingPrincipal)
    });

    if (remainingPrincipal <= 0.01 || monthCount >= maxMonths) {
      break;
    }

    monthCount += 1;

    // Accrue interest
    for (const d of items) {
      if (d.balance <= 0) continue;
      const monthlyRate = d.apr / 100 / 12;
      const interest = d.balance * monthlyRate;
      d.balance += interest;
      d.totalInterest += interest;
      totalInterestPaid += interest;
    }

    // Apply payments
    let budget = monthlyBudget;

    // Minimums first
    for (const d of items) {
      if (d.balance <= 0 || budget <= 0) continue;
      const pay = Math.min(d.minPayment, d.balance, budget);
      d.balance -= pay;
      budget -= pay;
    }

    // Extra to priority debt
    sortDebts();
    for (const d of items) {
      if (budget <= 0) break;
      if (d.balance <= 0) continue;
      const pay = Math.min(d.balance, budget);
      d.balance -= pay;
      budget -= pay;
    }

    // Clean up tiny balances
    for (const d of items) {
      if (d.balance > 0 && d.balance < 0.01) {
        d.balance = 0;
      }
    }
  }

  const debtFreeDate = new Date(
    now.getFullYear(),
    now.getMonth() + monthCount,
    1
  ).toISOString().slice(0, 10);

  return {
    strategy,
    months: monthCount,
    debt_free_date: debtFreeDate,
    total_interest: round2(totalInterestPaid),
    monthly_projection: monthlyProjection
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
