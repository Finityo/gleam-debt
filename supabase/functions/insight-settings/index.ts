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

    console.log('Insight settings request for user:', user.id, 'Method:', req.method);

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('insight_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      const defaults = {
        user_id: user.id,
        anomaly_threshold: 500,
        ignored_categories: [] as string[],
        daily_alerts: false,
        weekly_reports: true
      };

      return new Response(JSON.stringify(data ?? defaults), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await req.json();
      const payload = {
        user_id: user.id,
        anomaly_threshold: body.anomaly_threshold ?? 500,
        ignored_categories: (body.ignored_categories as string[]) ?? [],
        daily_alerts: !!body.daily_alerts,
        weekly_reports: !!body.weekly_reports,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('insight_settings')
        .upsert(payload, { onConflict: 'user_id' })
        .select('*')
        .maybeSingle();

      if (error) throw error;

      console.log('Settings saved:', data);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error('Error in insight-settings:', error);
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
