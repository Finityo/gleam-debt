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

    console.log('Generating spending insights for user:', user.id);

    // Get current month
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Fetch user's debts for monthly payments
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id);

    if (debtsError) throw debtsError;

    // Fetch debt plans for extra payments
    const { data: plans, error: plansError } = await supabase
      .from('debt_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (plansError) throw plansError;

    // Calculate spending totals
    const minimumPayments = debts?.reduce((sum, debt) => sum + Number(debt.min_payment || 0), 0) || 0;
    const extraPayments = plans?.[0] ? Number(plans[0].extra_monthly || 0) : 0;
    const oneTimePayments = plans?.[0] ? Number(plans[0].one_time || 0) : 0;
    const totalDebtPayments = minimumPayments + extraPayments + oneTimePayments;

    // Calculate interest accrued this month (approximate)
    const monthlyInterest = debts?.reduce((sum, debt) => {
      const balance = Number(debt.balance || 0);
      const apr = Number(debt.apr || 0);
      return sum + (balance * (apr / 100 / 12));
    }, 0) || 0;

    const totals = {
      minimumPayments: Math.round(minimumPayments * 100) / 100,
      extraPayments: Math.round(extraPayments * 100) / 100,
      oneTimePayments: Math.round(oneTimePayments * 100) / 100,
      totalDebtPayments: Math.round(totalDebtPayments * 100) / 100,
      monthlyInterest: Math.round(monthlyInterest * 100) / 100
    };

    // Detect anomalies
    const anomalies = [];

    // Check for high interest accrual
    if (monthlyInterest > 100) {
      anomalies.push({
        type: 'high_interest',
        severity: 'warning',
        message: `You're accruing $${Math.round(monthlyInterest)} in interest this month`,
        suggestion: 'Consider increasing your extra monthly payment to reduce interest costs'
      });
    }

    // Check if making only minimum payments
    if (extraPayments === 0 && debts && debts.length > 0) {
      anomalies.push({
        type: 'minimum_only',
        severity: 'info',
        message: 'You\'re only making minimum payments',
        suggestion: 'Adding even $50 extra per month can significantly reduce payoff time'
      });
    }

    // Check for high utilization
    const highBalanceDebts = debts?.filter(d => Number(d.balance) > 5000).length || 0;
    if (highBalanceDebts >= 2) {
      anomalies.push({
        type: 'high_debt_load',
        severity: 'warning',
        message: `You have ${highBalanceDebts} debts over $5,000`,
        suggestion: 'Focus on paying down one debt at a time using the snowball method'
      });
    }

    console.log('Generated insights:', { month, totals, anomalies });

    // Upsert spending insights
    const { error: upsertError } = await supabase
      .from('user_spending_insights')
      .upsert({
        user_id: user.id,
        month: month,
        totals: totals,
        anomalies: anomalies,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,month'
      });

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({ month, totals, anomalies }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating spending insights:', error);
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
