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

    console.log('Analyzing transactions for user:', user.id);

    const now = new Date();
    const monthStr = now.toISOString().slice(0, 7);
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Fetch transactions for current month
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', firstOfMonth.toISOString())
      .lt('date', nextMonth.toISOString());

    if (txError) throw txError;

    // Fetch user settings
    const { data: settings, error: settingsError } = await supabase
      .from('insight_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    const anomalyThreshold = Number(settings?.anomaly_threshold ?? 500);
    const ignoredCategories = (settings?.ignored_categories ?? []) as string[];

    const totalsByCategory: Record<string, number> = {};
    const merchantTotals: Record<string, number> = {};
    let totalSpend = 0;
    let netCashFlow = 0;
    const largeTransactions: Array<{
      amount: number;
      merchant: string | null;
      date: string;
    }> = [];

    for (const t of transactions ?? []) {
      const amount = Number(t.amount ?? 0);
      const merchant = (t.merchant ?? 'Unknown') as string;
      const categoryArray = (t.category ?? []) as string[];
      const category = categoryArray.length > 0 ? categoryArray[0] : 'Uncategorized';

      if (ignoredCategories.includes(category)) {
        netCashFlow += amount;
        continue;
      }

      totalsByCategory[category] = (totalsByCategory[category] ?? 0) + Math.abs(amount);
      merchantTotals[merchant] = (merchantTotals[merchant] ?? 0) + Math.abs(amount);

      if (amount < 0) {
        totalSpend += Math.abs(amount);
      }
      netCashFlow += amount;

      if (Math.abs(amount) >= anomalyThreshold) {
        largeTransactions.push({
          amount,
          merchant,
          date: String(t.date)
        });
      }
    }

    const daysInMonth = Math.round(
      (nextMonth.getTime() - firstOfMonth.getTime()) / (1000 * 60 * 60 * 24)
    ) || 30;
    const avgDailySpend = daysInMonth > 0 ? totalSpend / daysInMonth : 0;

    const topMerchants = Object.entries(merchantTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([merchant, total]) => ({ merchant, total }));

    const result = {
      month: monthStr,
      totals_by_category: totalsByCategory,
      top_merchants: topMerchants,
      avg_daily_spend: avgDailySpend,
      net_cash_flow: netCashFlow,
      large_transactions: largeTransactions
    };

    console.log('Transaction analysis complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing transactions:', error);
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
