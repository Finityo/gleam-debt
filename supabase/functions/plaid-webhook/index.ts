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
  
  // Get item info for user_id
  const { data: items } = await supabase
    .from('plaid_items')
    .select('user_id')
    .eq('item_id', payload.item_id)
    .single();

  if (!items) {
    console.error('Item not found:', payload.item_id);
    return;
  }

  const userId = items.user_id;
  
  switch (payload.webhook_code) {
    case 'NEW_ACCOUNTS_AVAILABLE':
      console.log('New accounts available for item:', payload.item_id);
      // Mark item as needing update for new account selection
      await supabase
        .from('plaid_item_status')
        .upsert({
          user_id: userId,
          item_id: payload.item_id,
          needs_update: true,
          update_reason: 'new_accounts_available',
          last_webhook_code: payload.webhook_code,
          last_webhook_at: new Date().toISOString(),
        });
      break;
    
    case 'PENDING_EXPIRATION':
      console.log('Item pending expiration:', payload.item_id);
      await supabase
        .from('plaid_item_status')
        .upsert({
          user_id: userId,
          item_id: payload.item_id,
          needs_update: true,
          update_reason: 'pending_expiration',
          last_webhook_code: payload.webhook_code,
          last_webhook_at: new Date().toISOString(),
        });
      break;
    
    case 'PENDING_DISCONNECT':
      console.log('Item pending disconnect:', payload.item_id);
      await supabase
        .from('plaid_item_status')
        .upsert({
          user_id: userId,
          item_id: payload.item_id,
          needs_update: true,
          update_reason: 'pending_disconnect',
          last_webhook_code: payload.webhook_code,
          last_webhook_at: new Date().toISOString(),
        });
      break;
    
    case 'USER_PERMISSION_REVOKED':
      console.log('User permission revoked:', payload.item_id);
      await supabase
        .from('plaid_item_status')
        .upsert({
          user_id: userId,
          item_id: payload.item_id,
          needs_update: true,
          update_reason: 'permission_revoked',
          last_webhook_code: payload.webhook_code,
          last_webhook_at: new Date().toISOString(),
        });
      break;
    
    case 'LOGIN_REPAIRED':
      console.log('Login repaired for item:', payload.item_id);
      // Clear the update requirement
      await supabase
        .from('plaid_item_status')
        .upsert({
          user_id: userId,
          item_id: payload.item_id,
          needs_update: false,
          update_reason: null,
          last_webhook_code: payload.webhook_code,
          last_webhook_at: new Date().toISOString(),
        });
      break;
    case 'ERROR':
      console.error('Item error:', payload.error);
      // Check if it's ITEM_LOGIN_REQUIRED
      if (payload.error?.error_code === 'ITEM_LOGIN_REQUIRED') {
        console.log('Item login required:', payload.item_id);
        await supabase
          .from('plaid_item_status')
          .upsert({
            user_id: userId,
            item_id: payload.item_id,
            needs_update: true,
            update_reason: 'login_required',
            last_webhook_code: payload.webhook_code,
            last_webhook_at: new Date().toISOString(),
          });
      }
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
