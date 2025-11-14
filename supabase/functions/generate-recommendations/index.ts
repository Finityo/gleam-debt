import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Recommendation = {
  type: 'accelerate' | 'utilization' | 'strategy' | 'consolidation' | 'emergency';
  text: string;
  impact: {
    months_saved?: number;
    interest_saved?: number;
    score_increase?: number;
  };
  action?: {
    type: 'increase_payment' | 'pay_down_card' | 'switch_strategy';
    amount?: number;
    target_debt_id?: string;
  };
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

    console.log('Generating recommendations for user:', user.id);

    // Fetch user's debts
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id);

    if (debtsError) throw debtsError;

    // Fetch debt plans
    const { data: plans, error: plansError } = await supabase
      .from('debt_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (plansError) throw plansError;

    // Fetch plaid accounts for utilization
    const { data: accounts, error: accountsError } = await supabase
      .from('plaid_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (accountsError) throw accountsError;

    // Fetch financial health score
    const { data: healthScore, error: healthError } = await supabase
      .from('financial_health_scores')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (healthError && healthError.code !== 'PGRST116') throw healthError;

    const recommendations: Recommendation[] = [];
    const currentPlan = plans?.[0];
    const strategy = currentPlan?.strategy ?? 'snowball';
    const extraMonthly = Number(currentPlan?.extra_monthly ?? 0);
    const totalDebt = (debts ?? []).reduce((sum, d: any) => sum + Number(d.balance ?? 0), 0);

    // Recommendation 1: Accelerate payoff with extra payment
    if (extraMonthly < 100 && totalDebt > 5000) {
      const suggestedExtra = Math.min(50, Math.floor(totalDebt * 0.01));
      const monthsSaved = Math.ceil(suggestedExtra / 10); // Rough estimate
      const interestSaved = Math.round(totalDebt * 0.05 * (monthsSaved / 12));

      recommendations.push({
        type: 'accelerate',
        text: `Add $${suggestedExtra} per month to shave ${monthsSaved} months off your payoff date.`,
        impact: {
          months_saved: monthsSaved,
          interest_saved: interestSaved
        },
        action: {
          type: 'increase_payment',
          amount: suggestedExtra
        }
      });
    }

    // Recommendation 2: Credit card utilization
    const creditCards = (accounts ?? []).filter((a: any) => a.type === 'credit');
    for (const card of creditCards) {
      const balance = Math.abs(Number(card.current_balance ?? 0));
      const available = Number(card.available_balance ?? 0);
      const limit = balance + available;
      
      if (limit > 0) {
        const utilization = (balance / limit) * 100;
        
        if (utilization > 30) {
          const targetUtilization = 20;
          const targetBalance = limit * (targetUtilization / 100);
          const payDownAmount = Math.ceil(balance - targetBalance);
          
          if (payDownAmount > 0) {
            const scoreIncrease = Math.min(50, Math.ceil((utilization - targetUtilization) * 2));
            
            recommendations.push({
              type: 'utilization',
              text: `${card.name} utilization is ${utilization.toFixed(1)}% — pay down $${payDownAmount} to reach 20% and boost your Health Score.`,
              impact: {
                score_increase: scoreIncrease
              },
              action: {
                type: 'pay_down_card',
                amount: payDownAmount,
                target_debt_id: card.id
              }
            });
          }
        }
      }
    }

    // Recommendation 3: Strategy optimization
    if (debts && debts.length > 3) {
      const highAPRDebts = debts.filter((d: any) => Number(d.apr ?? 0) > 15);
      const lowBalanceDebts = debts.filter((d: any) => Number(d.balance ?? 0) < 1000);

      if (strategy === 'snowball' && highAPRDebts.length >= 2) {
        const potentialSavings = Math.round(totalDebt * 0.03);
        recommendations.push({
          type: 'strategy',
          text: `Switch to Avalanche method to save ~$${potentialSavings} in interest by targeting high-APR debts first.`,
          impact: {
            interest_saved: potentialSavings
          },
          action: {
            type: 'switch_strategy'
          }
        });
      } else if (strategy === 'avalanche' && lowBalanceDebts.length >= 2) {
        recommendations.push({
          type: 'strategy',
          text: `Consider Snowball method for psychological wins — knock out ${lowBalanceDebts.length} small debts quickly for motivation.`,
          impact: {}
        });
      }
    }

    // Recommendation 4: Consolidation opportunity
    if (debts && debts.length > 5) {
      const avgAPR = debts.reduce((sum, d: any) => sum + Number(d.apr ?? 0), 0) / debts.length;
      if (avgAPR > 12) {
        recommendations.push({
          type: 'consolidation',
          text: `With ${debts.length} debts at ${avgAPR.toFixed(1)}% avg APR, a consolidation loan could simplify payments and lower interest.`,
          impact: {}
        });
      }
    }

    // Recommendation 5: Emergency fund warning
    if (extraMonthly > 200 && totalDebt < 10000) {
      recommendations.push({
        type: 'emergency',
        text: `You're paying $${extraMonthly}/month extra. Consider building a $1,000 emergency fund first to avoid new debt.`,
        impact: {}
      });
    }

    console.log('Generated recommendations:', recommendations.length);

    return new Response(
      JSON.stringify({
        strategy,
        recommendations: recommendations.slice(0, 4) // Limit to top 4
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating recommendations:', error);
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
