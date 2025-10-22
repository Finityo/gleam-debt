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
      console.error('Unauthorized item removal request - no user');
      throw new Error('Unauthorized');
    }

    const { item_id } = await req.json();

    console.log('Item removal initiated:', {
      user_id: user.id,
      item_id: item_id,
      timestamp: new Date().toISOString()
    });

    if (!item_id) {
      throw new Error('item_id is required');
    }

    // Get the item to ensure user owns it
    const { data: item, error: itemError } = await supabaseClient
      .from('plaid_items')
      .select('id, vault_secret_id')
      .eq('item_id', item_id)
      .eq('user_id', user.id)
      .single();

    if (itemError || !item) {
      console.error('Item not found for removal:', {
        user_id: user.id,
        item_id: item_id,
        error: itemError?.message
      });
      throw new Error('Item not found or access denied');
    }

    // Get access token from vault
    const { data: accessToken, error: tokenError } = await supabaseClient.rpc('get_plaid_token_from_vault', {
      p_item_id: item_id,
      p_function_name: 'plaid-remove-item'
    });

    if (tokenError || !accessToken) {
      console.error('Failed to get token for item:', item_id, tokenError);
      throw new Error('Failed to retrieve access token');
    }

    console.log('Item found, removing from Plaid:', {
      user_id: user.id,
      item_id: item_id
    });

    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const PLAID_ENV = 'production';

    // Try to remove from Plaid, but don't fail if it errors (e.g., sandbox/production mismatch)
    try {
      const plaidResponse = await fetch(`https://${PLAID_ENV}.plaid.com/item/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PLAID-CLIENT-ID': PLAID_CLIENT_ID!,
          'PLAID-SECRET': PLAID_SECRET!,
        },
        body: JSON.stringify({
          access_token: accessToken,
        }),
      });

      const plaidData = await plaidResponse.json();

      if (plaidResponse.ok) {
        console.log('Item removed from Plaid successfully:', {
          user_id: user.id,
          item_id: item_id,
          removed_item_id: plaidData.removed_item_id
        });
      } else {
        console.warn('Plaid item removal failed (non-critical):', {
          user_id: user.id,
          item_id: item_id,
          error_code: plaidData.error_code,
          error_message: plaidData.error_message
        });
      }
    } catch (plaidError: any) {
      console.warn('Plaid API call failed (continuing with DB cleanup):', plaidError.message);
    }

    // Delete all associated accounts first (foreign key constraint)
    const { error: accountsDeleteError } = await supabaseClient
      .from('plaid_accounts')
      .delete()
      .eq('plaid_item_id', item.id);

    if (accountsDeleteError) {
      console.error('Failed to delete accounts:', {
        user_id: user.id,
        item_id: item_id,
        error: accountsDeleteError.message
      });
      throw new Error('Failed to delete associated accounts');
    }

    console.log('Accounts deleted:', {
      user_id: user.id,
      item_id: item_id
    });

    // Delete item status tracking
    const { error: statusDeleteError } = await supabaseClient
      .from('plaid_item_status')
      .delete()
      .eq('item_id', item_id);

    if (statusDeleteError) {
      console.error('Error deleting item status:', statusDeleteError);
      // Don't throw, this is non-critical
    }

    // Delete vault secret
    if (item.vault_secret_id) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseAdmin
        .from('vault.secrets')
        .delete()
        .eq('name', item.vault_secret_id);

      console.log('Vault secret deleted:', item.vault_secret_id);
    }

    // Delete the item itself
    const { error: itemDeleteError } = await supabaseClient
      .from('plaid_items')
      .delete()
      .eq('id', item.id);

    if (itemDeleteError) {
      console.error('Failed to delete item from database:', {
        user_id: user.id,
        item_id: item_id,
        error: itemDeleteError.message
      });
      throw new Error('Failed to delete item');
    }

    console.log('Item removal complete:', {
      user_id: user.id,
      item_id: item_id,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Item removed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Item removal error:', {
      error_message: error.message,
      error_stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
