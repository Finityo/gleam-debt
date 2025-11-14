import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'sandbox';

function getPlaidUrl(): string {
  switch (PLAID_ENV) {
    case 'production':
      return 'https://production.plaid.com';
    case 'development':
      return 'https://development.plaid.com';
    default:
      return 'https://sandbox.plaid.com';
  }
}

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

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { webhook_code } = await req.json();

    console.log('Testing webhook trigger for user:', user.id);

    // Get user's first plaid item for testing
    const { data: items, error: itemsError } = await supabaseClient
      .from('plaid_items')
      .select('item_id')
      .eq('user_id', user.id)
      .limit(1);

    if (itemsError) {
      throw new Error(`Database error: ${itemsError.message}`);
    }

    if (!items || items.length === 0) {
      throw new Error('No connected Plaid items found');
    }

    const item = items[0];

    // Get access token from vault
    const { data: accessToken, error: tokenError } = await supabaseClient.rpc('get_plaid_token_from_vault', {
      p_item_id: item.item_id,
      p_function_name: 'plaid-test-webhook'
    });

    if (tokenError || !accessToken) {
      console.error('Failed to get token for item:', item.item_id, tokenError);
      throw new Error('Failed to retrieve access token');
    }

    console.log('Firing webhook for item:', item.item_id, 'webhook_code:', webhook_code);

    // Fire the webhook using Plaid's sandbox endpoint
    const response = await fetch(`${getPlaidUrl()}/sandbox/item/fire_webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
        webhook_code: webhook_code || 'NEW_ACCOUNTS_AVAILABLE',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Plaid API error:', errorText);
      throw new Error(`Failed to fire webhook: ${errorText}`);
    }

    const data = await response.json();
    console.log('Webhook fired successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Webhook ${webhook_code || 'NEW_ACCOUNTS_AVAILABLE'} fired successfully`,
        webhook_sent: data.webhook_fired || true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error firing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
