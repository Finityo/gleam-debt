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

    // TEMPORARY: Store token directly in table until Vault deployment is stable
    // TODO: Re-enable Vault storage once deployment issues are resolved
    const { error: itemError } = await supabaseClient
      .from('plaid_items')
      .insert({
        user_id: user.id,
        access_token: exchangeData.access_token, // Temporary plaintext storage
        item_id: exchangeData.item_id,
        institution_id: metadata?.institution?.institution_id,
        institution_name: metadata?.institution?.name,
      });

    if (itemError) {
      console.error('Database error storing item:', itemError);
      throw itemError;
    }

    console.log('Item stored successfully (temp plaintext):', exchangeData.item_id);

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

    // Fetch and import liabilities (credit cards, loans, mortgages)
    console.log('Fetching liabilities for item:', exchangeData.item_id);
    
    const liabilitiesResponse = await fetch(`https://${PLAID_ENV}.plaid.com/liabilities/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: exchangeData.access_token,
      }),
    });

    let importedDebtsCount = 0;

    if (liabilitiesResponse.ok) {
      const liabilitiesData = await liabilitiesResponse.json();
      console.log('Liabilities response:', JSON.stringify(liabilitiesData, null, 2));
      
      // Create a map of account_id to account info for quick lookup
      const accountsMap = new Map();
      for (const account of liabilitiesData.accounts) {
        accountsMap.set(account.account_id, account);
      }
      
      // Process credit card accounts
      if (liabilitiesData.liabilities?.credit) {
        console.log('Processing', liabilitiesData.liabilities.credit.length, 'credit cards');
        for (const creditLiability of liabilitiesData.liabilities.credit) {
          const account = accountsMap.get(creditLiability.account_id);
          if (!account) continue;
          
          const debtData = {
            user_id: user.id,
            name: account.name || account.official_name || 'Credit Card',
            balance: account.balances?.current || 0,
            apr: (creditLiability.aprs?.[0]?.apr_percentage || 0) / 100,
            min_payment: creditLiability.minimum_payment_amount || creditLiability.last_payment_amount || account.balances?.current * 0.02,
            last4: account.mask || null,
            due_date: creditLiability.next_payment_due_date?.split('-')[2] || null,
          };

          const { error: debtError } = await supabaseClient
            .from('debts')
            .insert(debtData);

          if (!debtError) {
            importedDebtsCount++;
          } else {
            console.error('Error inserting credit debt:', debtError);
          }
        }
      }

      // Process student loans
      if (liabilitiesData.liabilities?.student) {
        console.log('Processing', liabilitiesData.liabilities.student.length, 'student loans');
        for (const studentLiability of liabilitiesData.liabilities.student) {
          const account = accountsMap.get(studentLiability.account_id);
          if (!account) continue;
          
          const debtData = {
            user_id: user.id,
            name: account.name || account.official_name || studentLiability.loan_name || 'Student Loan',
            balance: account.balances?.current || 0,
            apr: (studentLiability.interest_rate_percentage || 0) / 100,
            min_payment: studentLiability.minimum_payment_amount || account.balances?.current * 0.01,
            last4: account.mask || studentLiability.account_number?.slice(-4) || null,
            due_date: studentLiability.next_payment_due_date?.split('-')[2] || null,
          };

          const { error: debtError } = await supabaseClient
            .from('debts')
            .insert(debtData);

          if (!debtError) {
            importedDebtsCount++;
          } else {
            console.error('Error inserting student loan:', debtError);
          }
        }
      }

      // Process mortgages
      if (liabilitiesData.liabilities?.mortgage) {
        console.log('Processing', liabilitiesData.liabilities.mortgage.length, 'mortgages');
        for (const mortgageLiability of liabilitiesData.liabilities.mortgage) {
          const account = accountsMap.get(mortgageLiability.account_id);
          if (!account) continue;
          
          const debtData = {
            user_id: user.id,
            name: account.name || account.official_name || mortgageLiability.property_address || 'Mortgage',
            balance: account.balances?.current || 0,
            apr: (mortgageLiability.interest_rate?.percentage || 0) / 100,
            min_payment: mortgageLiability.last_payment_amount || account.balances?.current * 0.005,
            last4: account.mask || mortgageLiability.account_number?.slice(-4) || null,
            due_date: mortgageLiability.next_payment_due_date?.split('-')[2] || null,
          };

          const { error: debtError } = await supabaseClient
            .from('debts')
            .insert(debtData);

          if (!debtError) {
            importedDebtsCount++;
          } else {
            console.error('Error inserting mortgage:', debtError);
          }
        }
      }

      console.log('Successfully imported', importedDebtsCount, 'debts for user:', user.id);
    } else {
      const errorData = await liabilitiesResponse.json();
      console.error('Failed to fetch liabilities:', {
        status: liabilitiesResponse.status,
        error: errorData
      });
      console.warn('Failed to fetch liabilities, but continuing with account linking');
    }

    console.log('Successfully linked accounts for user:', user.id);

    return new Response(JSON.stringify({ 
      success: true,
      item_id: exchangeData.item_id,
      accounts: accountsData.accounts.length,
      debts_imported: importedDebtsCount
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
