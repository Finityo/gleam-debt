import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Strategy = 'snowball' | 'avalanche';

type DebtRecord = {
  id: string;
  balance: number;
  apr: number;
  min_payment: number;
  status?: string | null;
};

type CalculatorSettings = {
  strategy: Strategy;
  monthly_extra: number;
};

type Alert = {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
};

type RiskAlertsResponse = {
  alerts: Alert[];
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

    const userId = user.id;
    console.log('Generating risk alerts for user:', userId);

    // Get debts
    const { data: debtsRaw, error: debtsError } = await supabase
      .from('debts')
      .select('id,balance,apr,min_payment')
      .eq('user_id', userId);

    if (debtsError) throw debtsError;

    const debts: DebtRecord[] = (debtsRaw as any[])?.filter(
      (d) => Number(d.balance) > 0
    ) ?? [];

    // Get calculator settings
    const { data: settingsRow, error: settingsError } = await supabase
      .from('debt_calculator_settings')
      .select('strategy,extra_monthly')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    const settings: CalculatorSettings = {
      strategy: (settingsRow?.strategy as Strategy) ?? 'snowball',
      monthly_extra: Number(settingsRow?.extra_monthly ?? 0),
    };

    // Get accounts for utilization
    const { data: accountsRaw, error: accountsError } = await supabase
      .from('plaid_accounts')
      .select('type,current_balance,available_balance')
      .eq('user_id', userId);

    if (accountsError) throw accountsError;

    const alerts: Alert[] = [];

    // 1) High credit utilization
    const cards = (accountsRaw ?? []).filter((a: any) => a.type === 'credit');
    const ccUsed = cards.reduce(
      (t: number, a: any) => t + Math.abs(Number(a.current_balance ?? 0)),
      0
    );
    const ccLimit = cards.reduce(
      (t: number, a: any) => {
        const balance = Math.abs(Number(a.current_balance ?? 0));
        const available = Number(a.available_balance ?? 0);
        return t + balance + available;
      },
      0
    );

    if (ccLimit > 0) {
      const util = (ccUsed / ccLimit) * 100;
      if (util >= 90) {
        alerts.push({
          type: 'high_utilization',
          severity: 'high',
          message: `Your credit card utilization is extremely high (${util.toFixed(0)}%). This can hurt your score and keep interest charges heavy. Consider targeting your highest-utilization card next.`,
        });
      } else if (util >= 75) {
        alerts.push({
          type: 'high_utilization',
          severity: 'medium',
          message: `Your credit card utilization is elevated (${util.toFixed(0)}%). Paying down those cards will help your overall health score.`,
        });
      }
    }

    const totalDebt = debts.reduce((t, d) => t + Number(d.balance ?? 0), 0);

    // 2) No extra payment
    if (settings.monthly_extra <= 0 && totalDebt > 0) {
      alerts.push({
        type: 'no_extra',
        severity: totalDebt > 5000 ? 'medium' : 'low',
        message:
          'You are currently only paying minimums. Adding even a small extra amount each month could shave months or years off your payoff timeline.',
      });
    }

    // 3) Heavy APR exposure
    const highAprDebts = debts.filter((d) => Number(d.apr ?? 0) >= 22);
    if (highAprDebts.length > 0) {
      const highAprTotal = highAprDebts.reduce(
        (t, d) => t + Number(d.balance ?? 0),
        0
      );
      if (highAprTotal > 0) {
        alerts.push({
          type: 'heavy_interest',
          severity: highAprTotal > 3000 ? 'high' : 'medium',
          message:
            'You have balances with very high APRs (22%+). Attacking those first or switching to Avalanche may save a significant amount of interest.',
        });
      }
    }

    // 4) Long payoff horizon
    const minPaymentsTotal = debts.reduce(
      (t, d) => t + Number(d.min_payment ?? 0),
      0
    );
    const monthlyBudget = minPaymentsTotal + Math.max(0, settings.monthly_extra);

    if (totalDebt > 0 && monthlyBudget > 0) {
      const estMonths = totalDebt / (monthlyBudget * 0.9);
      if (estMonths > 120) {
        alerts.push({
          type: 'long_payoff',
          severity: 'high',
          message:
            'Your current payment pace points to a payoff timeline longer than 10 years. Increasing your extra payment or adjusting your strategy could shorten this dramatically.',
        });
      } else if (estMonths > 60) {
        alerts.push({
          type: 'long_payoff',
          severity: 'medium',
          message:
            'Your payoff horizon looks to be more than 5 years. If possible, consider bumping your monthly extra or applying occasional lump sums.',
        });
      }
    }

    // Log latest alerts
    if (alerts.length > 0) {
      const rows = alerts.map((a) => ({
        user_id: userId,
        alert_type: a.type,
        severity: a.severity,
        message: a.message,
      }));
      await supabase.from('user_risk_alerts').insert(rows);
    }

    const body: RiskAlertsResponse = { alerts };

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('risk-alerts error:', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
