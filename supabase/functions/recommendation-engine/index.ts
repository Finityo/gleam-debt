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

type RecommendationAction =
  | { kind: 'set_strategy'; value: Strategy }
  | { kind: 'set_monthly_extra'; value: number };

type Recommendation = {
  id: string;
  type: 'accelerate' | 'strategy_compare' | 'interest_savings' | 'momentum';
  text: string;
  action?: RecommendationAction;
};

type RecommendationEngineResponse = {
  base_strategy: Strategy;
  snowball: ProjectionResult;
  avalanche: ProjectionResult;
  recommendations: Recommendation[];
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

    console.log('Running recommendation engine for user:', user.id);

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

    const baseStrategy: Strategy = (settings?.strategy as Strategy) ?? 'snowball';
    const baseExtra = Number(settings?.extra_monthly ?? 0);

    const snowball = simulatePlan(activeDebts as DebtRecord[], baseExtra, 'snowball');
    const avalanche = simulatePlan(activeDebts as DebtRecord[], baseExtra, 'avalanche');

    const recommendations: Recommendation[] = [];

    // Strategy comparison
    if (snowball.months !== avalanche.months) {
      if (avalanche.months < snowball.months) {
        recommendations.push({
          id: 'strategy-faster-avalanche',
          type: 'strategy_compare',
          text: `Avalanche pays everything off about ${snowball.months - avalanche.months} month(s) faster than Snowball using your current numbers.`,
          action: baseStrategy === 'snowball' ? { kind: 'set_strategy', value: 'avalanche' } : undefined
        });
      } else {
        recommendations.push({
          id: 'strategy-faster-snowball',
          type: 'strategy_compare',
          text: `Snowball gets you debt-free about ${avalanche.months - snowball.months} month(s) faster than Avalanche. That's because your smallest balances are powerful to clear early.`,
          action: baseStrategy === 'avalanche' ? { kind: 'set_strategy', value: 'snowball' } : undefined
        });
      }
    } else {
      recommendations.push({
        id: 'strategy-same-time',
        type: 'strategy_compare',
        text: 'Snowball and Avalanche finish at roughly the same time. Pick Snowball if you want emotional momentum, Avalanche if you want maximum interest efficiency.'
      });
    }

    // Interest savings
    const interestDiff = snowball.total_interest - avalanche.total_interest;
    if (Math.abs(interestDiff) >= 50) {
      if (interestDiff > 0) {
        recommendations.push({
          id: 'interest-avalanche-better',
          type: 'interest_savings',
          text: `Avalanche would save you about $${Math.round(interestDiff)} in interest over the life of the plan compared to Snowball.`
        });
      } else {
        recommendations.push({
          id: 'interest-snowball-better',
          type: 'interest_savings',
          text: `Snowball would save you about $${Math.round(-interestDiff)} in interest compared to Avalanche. That usually means your smallest balances are also some of your highest APRs.`
        });
      }
    }

    // Acceleration
    const bumpCandidates = [25, 50, 100].filter(n => n > baseExtra);
    const bump = bumpCandidates.length ? bumpCandidates[0] : baseExtra + 25;

    const accelSnowball = simulatePlan(activeDebts as DebtRecord[], bump, 'snowball');
    const monthsSaved = snowball.months - accelSnowball.months;
    if (monthsSaved >= 1) {
      recommendations.push({
        id: 'accelerate-extra-monthly',
        type: 'accelerate',
        text: `If you add $${bump.toFixed(0)} per month to your snowball, you'd shave about ${monthsSaved} month(s) off your payoff timeline.`,
        action: { kind: 'set_monthly_extra', value: bump }
      });
    }

    // Momentum
    const smallestDebt = activeDebts.reduce(
      (min: any, d: any) => Number(d.balance) < Number(min.balance ?? Infinity) ? d : min,
      activeDebts[0]
    );
    if (smallestDebt && Number(smallestDebt.balance) <= 300) {
      recommendations.push({
        id: 'momentum-smallest-debt',
        type: 'momentum',
        text: `Your smallest debt (${smallestDebt.name ?? 'one account'}) is under $${Number(smallestDebt.balance).toFixed(0)}. Clearing it in the next month or two would free up its minimum payment and give you a quick win.`
      });
    }

    const response: RecommendationEngineResponse = {
      base_strategy: baseStrategy,
      snowball,
      avalanche,
      recommendations
    };

    console.log('Recommendation engine generated:', recommendations.length, 'recommendations');

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recommendation engine:', error);
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
