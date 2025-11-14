import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('Computing financial health for user:', user.id);

    // Fetch user's debts
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id);

    if (debtsError) throw debtsError;

    // Fetch user's debt plans
    const { data: plans, error: plansError } = await supabase
      .from('debt_plans')
      .select('*')
      .eq('user_id', user.id);

    if (plansError) throw plansError;

    // Fetch Plaid accounts (credit cards for utilization)
    const { data: accounts, error: accountsError } = await supabase
      .from('plaid_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (accountsError) throw accountsError;

    // Calculate factors
    const totalDebt = debts?.reduce((sum, debt) => sum + Number(debt.balance || 0), 0) || 0;

    // Credit card utilization
    const creditCards = accounts?.filter(a => a.type === 'credit') || [];
    let cardUtilization = 0;
    if (creditCards.length > 0) {
      const totalUsed = creditCards.reduce((sum, card) => sum + Math.abs(Number(card.current_balance || 0)), 0);
      const totalLimit = creditCards.reduce((sum, card) => sum + Number(card.available_balance || 0) + Math.abs(Number(card.current_balance || 0)), 0);
      cardUtilization = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
    }

    // Payment progress (extra payments being made)
    const latestPlan = plans?.[0];
    const extraPayment = latestPlan ? Number(latestPlan.extra_monthly || 0) : 0;
    const progressBonus = extraPayment > 0 ? Math.min(extraPayment / 10, 50) : 0;

    // Calculate score (300-850 range like FICO)
    let score = 850;
    
    // Debt burden penalty (max -250 points)
    score -= Math.min(totalDebt / 1000, 250);
    
    // Credit utilization penalty (max -200 points)
    score -= Math.min(cardUtilization * 2, 200);
    
    // Progress bonus (up to +50 points for extra payments)
    score += progressBonus;

    // Clamp score between 300 and 850
    const finalScore = Math.max(300, Math.min(850, Math.round(score)));

    const factors = {
      totalDebt: Math.round(totalDebt),
      cardUtilization: Math.round(cardUtilization * 10) / 10,
      extraPayment: Math.round(extraPayment),
      progressBonus: Math.round(progressBonus)
    };

    console.log('Calculated score:', finalScore, 'factors:', factors);

    // Upsert health score
    const { error: upsertError } = await supabase
      .from('financial_health_scores')
      .upsert({
        user_id: user.id,
        score: finalScore,
        factors: factors,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({ score: finalScore, factors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error computing financial health:', error);
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
