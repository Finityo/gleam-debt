import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Strategy = 'snowball' | 'avalanche';

type DebtRecord = {
  id: string;
  user_id: string;
  name?: string;
  balance: number;
  apr: number;
  min_payment: number;
};

type ProjectionResult = {
  strategy: Strategy;
  months: number;
  debt_free_date: string;
  total_interest: number;
};

type WhatIfRequestBody = {
  strategy?: Strategy;
  monthly_extra?: number;
  lump_sum?: number;
};

type WhatIfResponse = {
  strategy: Strategy;
  baseline: ProjectionResult;
  scenario: ProjectionResult;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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

    console.log('What-if calculator for user:', user.id);

    const body: WhatIfRequestBody = req.method === 'POST' ? await req.json() : {};

    const desiredStrategy: Strategy = (body.strategy as Strategy) ?? 'snowball';
    const customExtra = body.monthly_extra != null ? Number(body.monthly_extra) : undefined;
    const lumpSum = body.lump_sum != null ? Number(body.lump_sum) : 0;

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

    const { data: settings, error: settingsError } = await supabase
      .from('debt_calculator_settings')
      .select('strategy, extra_monthly')
      .eq('user_id', user.id)
      .maybeSingle();

    if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

    const baseExtra = Number(settings?.extra_monthly ?? 0);

    const baseline = simulatePlan(activeDebts as DebtRecord[], baseExtra, desiredStrategy);

    const scenarioExtra = customExtra != null ? Math.max(0, customExtra) : baseExtra;
    const debtsWithLump = applyLumpSum(activeDebts as DebtRecord[], lumpSum, desiredStrategy);
    const scenario = simulatePlan(debtsWithLump, scenarioExtra, desiredStrategy);

    const result: WhatIfResponse = {
      strategy: desiredStrategy,
      baseline,
      scenario
    };

    console.log('What-if calculated:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in what-if calculator:', error);
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

function applyLumpSum(
  debts: DebtRecord[],
  lumpSum: number,
  strategy: Strategy
): DebtRecord[] {
  if (!lumpSum || lumpSum <= 0) return debts.map(d => ({ ...d }));

  const items = debts.map(d => ({ ...d, balance: Number(d.balance) }));

  const sort = () => {
    if (strategy === 'snowball') {
      items.sort((a, b) => a.balance - b.balance);
    } else {
      items.sort((a, b) => Number(b.apr) - Number(a.apr) || a.balance - b.balance);
    }
  };

  sort();
  let remaining = lumpSum;

  for (const d of items) {
    if (remaining <= 0) break;
    if (d.balance <= 0) continue;
    const pay = Math.min(d.balance, remaining);
    d.balance -= pay;
    remaining -= pay;
  }

  return items;
}

function simulatePlan(
  debts: DebtRecord[],
  monthlyExtra: number,
  strategy: Strategy
): ProjectionResult {
  const items = debts.map(d => ({
    id: d.id,
    balance: Number(d.balance),
    apr: Math.max(0, Number(d.apr) || 0),
    minPayment: Math.max(0, Number(d.min_payment) || 0)
  }));

  const sortDebts = () => {
    if (strategy === 'snowball') {
      items.sort((a, b) => a.balance - b.balance);
    } else {
      items.sort((a, b) => b.apr - a.apr || a.balance - b.balance);
    }
  };

  sortDebts();

  const baseMin = items.reduce((t, d) => t + d.minPayment, 0);
  const monthlyBudget = baseMin + monthlyExtra;

  let months = 0;
  let totalInterest = 0;
  const now = new Date();
  const maxMonths = 50 * 12;

  while (true) {
    const remaining = items.reduce((t, d) => t + d.balance, 0);
    if (remaining <= 0.01 || months >= maxMonths) break;

    months += 1;

    for (const d of items) {
      if (d.balance <= 0) continue;
      const monthlyRate = d.apr / 100 / 12;
      const interest = d.balance * monthlyRate;
      d.balance += interest;
      totalInterest += interest;
    }

    let budget = monthlyBudget;
    for (const d of items) {
      if (d.balance <= 0 || budget <= 0) continue;
      const pay = Math.min(d.minPayment, d.balance, budget);
      d.balance -= pay;
      budget -= pay;
    }

    sortDebts();
    for (const d of items) {
      if (budget <= 0) break;
      if (d.balance <= 0) continue;
      const pay = Math.min(d.balance, budget);
      d.balance -= pay;
      budget -= pay;
    }

    for (const d of items) {
      if (d.balance > 0 && d.balance < 0.01) d.balance = 0;
    }
  }

  const debtFreeDate = new Date(
    now.getFullYear(),
    now.getMonth() + months,
    1
  ).toISOString().slice(0, 10);

  return {
    strategy,
    months,
    debt_free_date: debtFreeDate,
    total_interest: Math.round(totalInterest * 100) / 100
  };
}
