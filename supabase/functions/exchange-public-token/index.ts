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
      console.error('Unauthorized: No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { public_token } = await req.json();

    if (!public_token) {
      throw new Error('public_token is required');
    }

    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'production';

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      throw new Error('Plaid credentials not configured');
    }

    console.log('Exchanging public token for user:', user.id);

    // Exchange public token for access token
    const exchangeResponse = await fetch(`https://${PLAID_ENV}.plaid.com/item/public_token/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
      },
      body: JSON.stringify({ public_token }),
    });

    const exchangeData = await exchangeResponse.json();

    if (!exchangeResponse.ok) {
      console.error('Plaid exchange error:', exchangeData);
      throw new Error(exchangeData.error_message || 'Failed to exchange token');
    }

    const { access_token, item_id } = exchangeData;

    console.log('Token exchanged successfully, item_id:', item_id);

    // Fetch item details
    const itemResponse = await fetch(`https://${PLAID_ENV}.plaid.com/item/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
      },
      body: JSON.stringify({ access_token }),
    });

    const itemData = await itemResponse.json();

    if (!itemResponse.ok) {
      console.error('Plaid item/get error:', itemData);
      throw new Error(itemData.error_message || 'Failed to fetch item details');
    }

    const institutionId = itemData.item?.institution_id;

    // Fetch institution name
    let institutionName = 'Unknown Institution';
    if (institutionId) {
      const instResponse = await fetch(`https://${PLAID_ENV}.plaid.com/institutions/get_by_id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
          'PLAID-SECRET': PLAID_SECRET,
        },
        body: JSON.stringify({
          institution_id: institutionId,
          country_codes: ['US'],
        }),
      });

      const instData = await instResponse.json();
      if (instResponse.ok) {
        institutionName = instData.institution?.name || institutionName;
      }
    }

    console.log('Institution name:', institutionName);

    // Store token securely in vault
    const vaultSecretName = `plaid_token_${item_id}`;
    
    try {
      const { error: vaultError } = await supabaseClient.rpc('store_plaid_token_in_vault', {
        p_token: access_token,
        p_secret_name: vaultSecretName,
        p_description: `Plaid access token for item ${item_id}`
      });

      if (vaultError) {
        console.error('Error storing token in vault:', vaultError);
        throw new Error('Failed to store token securely');
      }

      console.log('Token stored securely in vault');
    } catch (vaultErr) {
      console.error('Vault storage failed:', vaultErr);
      throw new Error('Failed to store token securely');
    }

    // Store plaid_items with vault reference
    const { error: itemInsertError } = await supabaseClient
      .from('plaid_items')
      .insert({
        user_id: user.id,
        item_id: item_id,
        vault_secret_id: vaultSecretName,
        institution_id: institutionId,
        institution_name: institutionName,
      });

    if (itemInsertError) {
      console.error('Error inserting plaid_items:', itemInsertError);
      throw new Error('Failed to store item');
    }

    console.log('Item stored in database');

    // Fetch accounts
    const accountsResponse = await fetch(`https://${PLAID_ENV}.plaid.com/accounts/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
      },
      body: JSON.stringify({ access_token }),
    });

    const accountsData = await accountsResponse.json();

    if (!accountsResponse.ok) {
      console.error('Plaid accounts/get error:', accountsData);
      throw new Error(accountsData.error_message || 'Failed to fetch accounts');
    }

    const accounts = accountsData.accounts || [];
    console.log(`Fetched ${accounts.length} accounts`);

    // Store plaid_accounts
    for (const account of accounts) {
      const { error: accountInsertError } = await supabaseClient
        .from('plaid_accounts')
        .insert({
          user_id: user.id,
          item_id: item_id,
          account_id: account.account_id,
          name: account.name,
          official_name: account.official_name,
          mask: account.mask,
          type: account.type,
          subtype: account.subtype,
          current_balance: account.balances?.current,
          available_balance: account.balances?.available,
          limit_balance: account.balances?.limit,
        });

      if (accountInsertError) {
        console.error('Error inserting account:', accountInsertError);
      }
    }

    console.log('Accounts stored in database');

    return new Response(
      JSON.stringify({
        success: true,
        item_id: item_id,
        institution_name: institutionName,
        accounts_count: accounts.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error exchanging token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
