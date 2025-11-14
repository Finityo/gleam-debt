import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type HeatDebt = {
  id: string;
  name: string | null;
  balance: number;
  apr: number;
  min_payment: number;
};

type HeatMapResponse = {
  debts: (HeatDebt & { risk_band: 'low' | 'medium' | 'high' })[];
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = user.id;

    const { data: debtsRaw, error: debtsError } = await supabase
      .from('debts')
      .select('id,name,balance,apr,min_payment')
      .eq('user_id', userId);

    if (debtsError) throw debtsError;

    const debts: HeatDebt[] = (debtsRaw as any[])?.filter((d) => Number(d.balance) > 0) ?? [];

    const mapped = debts.map((d) => {
      const apr = Number(d.apr ?? 0);
      let risk_band: 'low' | 'medium' | 'high' = 'low';
      if (apr >= 22) risk_band = 'high';
      else if (apr >= 14) risk_band = 'medium';
      return {
        ...d,
        balance: Number(d.balance ?? 0),
        apr,
        min_payment: Number(d.min_payment ?? 0),
        risk_band,
      };
    });

    const body: HeatMapResponse = { debts: mapped };

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('heat-map-data error:', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
