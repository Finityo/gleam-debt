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

    // Calculate spending totals by category
    const totals: Record<string, number> = {
      'Debt Payments': Math.round(totalDebtPayments * 100) / 100,
      'Minimum Payments': Math.round(minimumPayments * 100) / 100,
      'Extra Payments': Math.round(extraPayments * 100) / 100,
    };

    if (oneTimePayments > 0) {
      totals['One-Time Payments'] = Math.round(oneTimePayments * 100) / 100;
    }

    totals['Interest Charges'] = Math.round(monthlyInterest * 100) / 100;

    // Detect anomalies - format for display
    const anomalies: Array<{ amount: number; merchant?: string; date?: string }> = [];

    // Check for high interest accrual
    if (monthlyInterest > 100) {
      anomalies.push({
        amount: Math.round(monthlyInterest * 100) / 100,
        merchant: 'Interest Charges',
        date: new Date().toISOString().split('T')[0]
      });
    }

    // Check for large one-time payment
    if (oneTimePayments > 500) {
      anomalies.push({
        amount: Math.round(oneTimePayments * 100) / 100,
        merchant: 'One-Time Debt Payment',
        date: new Date().toISOString().split('T')[0]
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
