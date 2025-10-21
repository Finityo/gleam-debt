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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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

    const { public_token, metadata } = await req.json();

    if (!public_token) {
      throw new Error('public_token is required');
    }

    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const PLAID_ENV = 'sandbox';

    console.log('Exchanging public token for user:', user.id);

    // Exchange public token for access token
    const exchangeResponse = await fetch(`https://${PLAID_ENV}.plaid.com/item/public_token/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID!,
        'PLAID-SECRET': PLAID_SECRET!,
      },
      body: JSON.stringify({ public_token }),
    });

    const exchangeData = await exchangeResponse.json();
    
    if (!exchangeResponse.ok) {
      console.error('Plaid exchange error:', exchangeData);
      throw new Error(exchangeData.error_message || 'Failed to exchange token');
    }

    const { access_token, item_id } = exchangeData;

    // Store access token securely in Vault
    const vaultSecretId = `plaid_token_${item_id}_${Date.now()}`;
    const { data: storedSecretId, error: vaultError } = await supabaseClient
      .rpc('store_plaid_token_in_vault', {
        p_token: access_token,
        p_secret_name: vaultSecretId,
        p_description: `Plaid access token for item ${item_id} (user: ${user.id})`
      });

    if (vaultError || !storedSecretId) {
      console.error('Failed to store token in Vault:', vaultError);
      throw new Error('Failed to securely store access token');
    }

    // Store the item in the database with vault reference
    const { data: plaidItem, error: insertError } = await supabaseClient
      .from('plaid_items')
      .insert({
        user_id: user.id,
        vault_secret_id: storedSecretId,
        access_token: '', // Empty for backwards compatibility
        item_id,
        institution_id: metadata?.institution?.institution_id,
        institution_name: metadata?.institution?.name,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to store Plaid item');
    }

    // Get account information
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
      console.error('Plaid accounts error:', accountsData);
      throw new Error(accountsData.error_message || 'Failed to get accounts');
    }

    // Store accounts in the database
    const accountsToInsert = accountsData.accounts.map((account: any) => ({
      user_id: user.id,
      plaid_item_id: plaidItem.id,
      account_id: account.account_id,
      name: account.name,
      official_name: account.official_name,
      type: account.type,
      subtype: account.subtype,
      mask: account.mask,
      current_balance: account.balances.current,
      available_balance: account.balances.available,
      currency_code: account.balances.iso_currency_code || 'USD',
    }));

    const { error: accountsInsertError } = await supabaseClient
      .from('plaid_accounts')
      .insert(accountsToInsert);

    if (accountsInsertError) {
      console.error('Accounts insert error:', accountsInsertError);
      throw new Error('Failed to store accounts');
    }

    console.log('Successfully stored Plaid item and accounts');

    return new Response(
      JSON.stringify({ 
        success: true,
        item_id,
        accounts: accountsData.accounts.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in exchange-public-token:', error);
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
