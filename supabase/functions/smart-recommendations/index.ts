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

type Recommendation = {
  type: 'accelerate' | 'strategy_compare' | 'momentum' | 'interest_savings';
  text: string;
};

type SmartRecommendationsResponse = {
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

    console.log('Generating smart recommendations for user:', user.id);

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
    const monthlyExtra = Number(settings?.extra_monthly ?? 0);

    const snowball = simulatePlan(activeDebts as DebtRecord[], monthlyExtra, 'snowball');
    const avalanche = simulatePlan(activeDebts as DebtRecord[], monthlyExtra, 'avalanche');

    const recommendations: Recommendation[] = [];

    // Strategy comparison
    if (snowball.months !== avalanche.months) {
      if (avalanche.months < snowball.months) {
        recommendations.push({
          type: 'strategy_compare',
          text: `Avalanche pays everything off about ${snowball.months - avalanche.months} month(s) faster than Snowball. If you can stay disciplined, switching to Avalanche might be worth it.`
        });
      } else {
        recommendations.push({
          type: 'strategy_compare',
          text: `Snowball gets you debt-free about ${avalanche.months - snowball.months} month(s) faster than Avalanche in your current setup. That's rare, but a nice edge for momentum.`
        });
      }
    } else {
      recommendations.push({
        type: 'strategy_compare',
        text: 'Snowball and Avalanche finish around the same time for your current debts. Pick the one that best fits your psychology: smallest balances for motivation, or highest APRs for math efficiency.'
      });
    }

    // Interest savings
    const interestDiff = snowball.total_interest - avalanche.total_interest;
    if (Math.abs(interestDiff) >= 50) {
      if (interestDiff > 0) {
        recommendations.push({
          type: 'interest_savings',
          text: `Avalanche would save you about $${Math.round(interestDiff)} in interest over the life of your plan compared to Snowball.`
        });
      } else {
        recommendations.push({
          type: 'interest_savings',
          text: `Snowball would save you about $${Math.round(-interestDiff)} in interest compared to Avalanche. That usually means your smallest debts are also some of your highest APRs.`
        });
      }
    }

    // Acceleration suggestion
    const bump = monthlyExtra < 50 ? 50 : monthlyExtra + 25;
    const accelSnowball = simulatePlan(activeDebts as DebtRecord[], bump, 'snowball');
    const monthsSaved = snowball.months - accelSnowball.months;
    if (monthsSaved >= 1) {
      recommendations.push({
        type: 'accelerate',
        text: `If you add $${bump.toFixed(0)} per month to your snowball, you would shave about ${monthsSaved} month(s) off your payoff timeline.`
      });
    }

    // Momentum boost
    const smallestDebt = activeDebts.reduce(
      (min: any, d: any) => Number(d.balance) < Number(min.balance ?? Infinity) ? d : min,
      activeDebts[0]
    );
    if (smallestDebt && Number(smallestDebt.balance) <= 300) {
      recommendations.push({
        type: 'momentum',
        text: `Your smallest debt (${smallestDebt.name ?? 'a balance'}) is under $${Number(smallestDebt.balance).toFixed(0)}. Closing it out in the next month or two would give a big motivation boost and free up its minimum payment for your snowball.`
      });
    }

    const response: SmartRecommendationsResponse = {
      base_strategy: baseStrategy,
      snowball,
      avalanche,
      recommendations
    };

    console.log('Smart recommendations generated:', recommendations.length);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating smart recommendations:', error);
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

    for (const d of items) {
      if (d.balance <= 0) continue;
      const monthlyRate = d.apr / 100 / 12;
      const interest = d.balance * monthlyRate;
      d.balance += interest;
      d.totalInterest += interest;
      totalInterestPaid += interest;
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
