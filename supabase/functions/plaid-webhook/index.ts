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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const payload = await req.json();
    
    console.log('Received Plaid webhook:', {
      type: payload.webhook_type,
      code: payload.webhook_code,
      item_id: payload.item_id,
      timestamp: new Date().toISOString()
    });

    // Handle different webhook types
    switch (payload.webhook_type) {
      case 'ITEM':
        await handleItemWebhook(supabaseClient, payload);
        break;
      case 'TRANSACTIONS':
        await handleTransactionsWebhook(supabaseClient, payload);
        break;
      case 'AUTH':
        await handleAuthWebhook(supabaseClient, payload);
        break;
      case 'LIABILITIES':
        await handleLiabilitiesWebhook(supabaseClient, payload);
        break;
      case 'IDENTITY':
        await handleIdentityWebhook(supabaseClient, payload);
        break;
      default:
        console.log('Unhandled webhook type:', payload.webhook_type);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleItemWebhook(supabase: any, payload: any) {
  console.log('Processing ITEM webhook:', payload.webhook_code);
  
  switch (payload.webhook_code) {
    case 'NEW_ACCOUNTS_AVAILABLE':
      console.log('New accounts available for item:', payload.item_id);
      // Trigger account refresh
      const { data: items } = await supabase
        .from('plaid_items')
        .select('access_token, user_id')
        .eq('item_id', payload.item_id);
      
      if (items && items.length > 0) {
        console.log('Found item, could trigger account refresh for user:', items[0].user_id);
      }
      break;
    case 'ERROR':
      console.error('Item error:', payload.error);
      break;
    default:
      console.log('Unhandled ITEM webhook code:', payload.webhook_code);
  }
}

async function handleTransactionsWebhook(supabase: any, payload: any) {
  console.log('Processing TRANSACTIONS webhook:', payload.webhook_code);
  // Future: implement transaction updates
}

async function handleAuthWebhook(supabase: any, payload: any) {
  console.log('Processing AUTH webhook:', payload.webhook_code);
  // Handle auth-related webhooks
}

async function handleLiabilitiesWebhook(supabase: any, payload: any) {
  console.log('Processing LIABILITIES webhook:', payload.webhook_code);
  // Handle liabilities updates
}

async function handleIdentityWebhook(supabase: any, payload: any) {
  console.log('Processing IDENTITY webhook:', payload.webhook_code);
  // Handle identity verification updates
}
