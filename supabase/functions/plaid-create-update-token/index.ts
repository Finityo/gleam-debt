import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { item_id, update_mode } = await req.json();

    if (!item_id) {
      throw new Error('item_id is required');
    }

    // Get access token from database
    const { data: plaidItem, error: itemError } = await supabaseClient
      .from('plaid_items')
      .select('access_token')
      .eq('item_id', item_id)
      .eq('user_id', user.id)
      .single();

    if (itemError || !plaidItem?.access_token) {
      console.error('Failed to get token for item:', item_id, itemError);
      throw new Error('Failed to retrieve access token');
    }

    const accessToken = plaidItem.access_token;

    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const PLAID_ENV = 'production';

    const requestBody: any = {
      user: {
        client_user_id: user.id,
      },
      client_name: 'Debt Management App',
      access_token: accessToken,
      country_codes: ['US'],
      language: 'en',
    };

    // Enable account selection if updating for new accounts
    if (update_mode === 'account_selection') {
      requestBody.update = {
        account_selection_enabled: true,
      };
    }

    const response = await fetch(`https://${PLAID_ENV}.plaid.com/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID!,
        'PLAID-SECRET': PLAID_SECRET!,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Plaid API error:', data);
      throw new Error(data.error_message || 'Failed to create update link token');
    }

    console.log('Update link token created for item:', item_id);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in plaid-create-update-token:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
