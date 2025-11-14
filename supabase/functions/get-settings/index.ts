import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SettingsRow {
  extra_monthly: string;
  one_time_extra: string;
  strategy: 'snowball' | 'avalanche';
  start_date: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log(`Fetching settings for user: ${user.id}`);

    // Fetch user's settings
    const { data: settings, error: settingsError } = await supabase
      .from('debt_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error, just no settings yet)
      console.error('Error fetching settings:', settingsError);
      throw settingsError;
    }

    // Return default settings if none exist
    if (!settings) {
      console.log('No settings found, returning defaults');
      return new Response(
        JSON.stringify({
          extraMonthly: 0,
          oneTimeExtra: 0,
          strategy: 'snowball',
          startDate: undefined,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log('Settings found:', settings);

    // Transform to match expected interface
    const transformedSettings = {
      extraMonthly: parseFloat((settings as SettingsRow).extra_monthly),
      oneTimeExtra: parseFloat((settings as SettingsRow).one_time_extra),
      strategy: (settings as SettingsRow).strategy,
      startDate: (settings as SettingsRow).start_date || undefined,
    };

    return new Response(
      JSON.stringify(transformedSettings),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in get-settings function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 500,
      }
    );
  }
});
