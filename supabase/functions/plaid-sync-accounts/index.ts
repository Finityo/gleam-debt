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

    const { item_id } = await req.json();

    if (!item_id) {
      throw new Error('item_id is required');
    }

    console.log('🔄 Syncing accounts for item:', item_id);
    console.log('⚠️ REFRESH MODE - Will UPDATE existing accounts, NOT create duplicates');

    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'production';

    // Get access token from vault
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const access_token = await supabaseAdmin.rpc('get_plaid_token_from_vault', {
      p_item_id: item_id,
      p_function_name: 'plaid-sync-accounts'
    });

    if (!access_token) {
      throw new Error('Failed to retrieve access token');
    }

    // Fetch latest accounts from Plaid
    const accountsResponse = await fetch(`https://${PLAID_ENV}.plaid.com/accounts/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID!,
        'PLAID-SECRET': PLAID_SECRET!,
      },
      body: JSON.stringify({ access_token }),
    });

    const accountsData = await accountsResponse.json();

    if (!accountsResponse.ok) {
      console.error('Failed to fetch accounts from Plaid:', accountsData);
      throw new Error(accountsData.error_message || 'Failed to fetch accounts');
    }

    console.log('Fetched accounts from Plaid:', {
      item_id,
      account_count: accountsData.accounts?.length
    });

    // Get the plaid_item_id
    const { data: plaidItems } = await supabaseClient
      .from('plaid_items')
      .select('id')
      .eq('item_id', item_id)
      .eq('user_id', user.id)
      .single();

    if (!plaidItems) {
      throw new Error('Plaid item not found');
    }

    let updatedCount = 0;
    let insertedCount = 0;

    // Update or insert each account
    for (const account of accountsData.accounts) {
      // Check if account exists
      const { data: existingAccount } = await supabaseClient
        .from('plaid_accounts')
        .select('id')
        .eq('account_id', account.account_id)
        .eq('user_id', user.id)
        .single();

      const accountData = {
        user_id: user.id,
        plaid_item_id: plaidItems.id,
        account_id: account.account_id,
        name: account.name,
        official_name: account.official_name,
        type: account.type,
        subtype: account.subtype,
        mask: account.mask,
        current_balance: account.balances.current,
        available_balance: account.balances.available,
        currency_code: account.balances.iso_currency_code,
        updated_at: new Date().toISOString()
      };

      if (existingAccount) {
        // Update existing account
        const { error } = await supabaseClient
          .from('plaid_accounts')
          .update(accountData)
          .eq('id', existingAccount.id);

        if (error) {
          console.error('Error updating account:', error);
        } else {
          updatedCount++;
        }
      } else {
        // Insert new account
        const { error } = await supabaseClient
          .from('plaid_accounts')
          .insert(accountData);

        if (error) {
          console.error('Error inserting account:', error);
        } else {
          insertedCount++;
        }
      }
    }

    console.log('✓ Account sync completed:', {
      item_id,
      updated: updatedCount,
      inserted: insertedCount,
      message: updatedCount > 0 ? 'Balances refreshed successfully' : 'New accounts added'
    });

    return new Response(JSON.stringify({ 
      success: true,
      updated: updatedCount,
      inserted: insertedCount,
      total: accountsData.accounts.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in plaid-sync-accounts:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
