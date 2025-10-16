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

    const { public_token, metadata } = await req.json();

    console.log('Token exchange initiated:', {
      user_id: user.id,
      institution_id: metadata?.institution?.institution_id,
      institution_name: metadata?.institution?.name,
      account_count: metadata?.accounts?.length,
      timestamp: new Date().toISOString()
    });

    if (!public_token) {
      throw new Error('public_token is required');
    }

    // Check for duplicate items (same institution)
    if (metadata?.institution?.institution_id) {
      const { data: existingItems } = await supabaseClient
        .from('plaid_items')
        .select('institution_id, institution_name')
        .eq('user_id', user.id)
        .eq('institution_id', metadata.institution.institution_id);

      if (existingItems && existingItems.length > 0) {
        console.warn('Duplicate item detected:', {
          user_id: user.id,
          institution_id: metadata.institution.institution_id,
          existing_count: existingItems.length
        });
        
        return new Response(
          JSON.stringify({ 
            error: 'This bank account is already connected. Please select a different institution.',
            duplicate: true
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const PLAID_ENV = 'production';

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

    // Store item in database
    const { error: itemError } = await supabaseClient
      .from('plaid_items')
      .insert({
        user_id: user.id,
        access_token: exchangeData.access_token,
        item_id: exchangeData.item_id,
        institution_id: metadata?.institution?.institution_id,
        institution_name: metadata?.institution?.name,
      });

    if (itemError) {
      console.error('Database error storing item:', itemError);
      throw itemError;
    }

    // Get accounts
    const accountsResponse = await fetch(`https://${PLAID_ENV}.plaid.com/accounts/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID!,
        'PLAID-SECRET': PLAID_SECRET!,
      },
      body: JSON.stringify({ access_token: exchangeData.access_token }),
    });

    const accountsData = await accountsResponse.json();

    if (!accountsResponse.ok) {
      console.error('Failed to fetch accounts from Plaid:', {
        user_id: user.id,
        item_id: exchangeData.item_id,
        error_code: accountsData.error_code,
        error_message: accountsData.error_message
      });
      throw new Error(accountsData.error_message || 'Failed to fetch accounts');
    }

    console.log('Accounts fetched from Plaid:', {
      user_id: user.id,
      item_id: exchangeData.item_id,
      account_count: accountsData.accounts?.length
    });

    // Get the plaid_item_id we just inserted
    const { data: plaidItems } = await supabaseClient
      .from('plaid_items')
      .select('id')
      .eq('item_id', exchangeData.item_id)
      .eq('user_id', user.id)
      .single();

    if (!plaidItems) {
      throw new Error('Failed to retrieve plaid item');
    }

    // Store accounts in database
    const accountsToInsert = accountsData.accounts.map((account: any) => ({
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
    }));

    const { error: accountsError } = await supabaseClient
      .from('plaid_accounts')
      .insert(accountsToInsert);

    if (accountsError) {
      console.error('Database error storing accounts:', accountsError);
      throw accountsError;
    }

    console.log('Successfully linked accounts for user:', user.id);

    return new Response(JSON.stringify({ 
      success: true,
      item_id: exchangeData.item_id,
      accounts: accountsData.accounts.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in plaid-exchange-token:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
