import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get all Plaid items for this user
    const { data: plaidItems, error: itemsError } = await supabaseClient
      .from('plaid_items')
      .select('*')
      .eq('user_id', user.id);

    if (itemsError) {
      console.error('Error fetching plaid items:', itemsError);
      throw new Error('Failed to fetch Plaid items');
    }

    // Get all accounts for this user
    const { data: accounts, error: accountsError } = await supabaseClient
      .from('plaid_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      throw new Error('Failed to fetch accounts');
    }

    return new Response(
      JSON.stringify({ 
        items: plaidItems || [],
        accounts: accounts || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-accounts:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
