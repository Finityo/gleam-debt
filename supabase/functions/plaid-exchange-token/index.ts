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

    const { public_token, metadata, link_session_id } = await req.json();

    console.log('Token exchange initiated:', {
      request_id: crypto.randomUUID(),
      institution_category: 'financial',
      account_count: metadata?.accounts?.length,
      timestamp: new Date().toISOString()
    });

    if (!public_token) {
      throw new Error('public_token is required');
    }

    // Enhanced duplicate detection per Plaid best practices
    // Check at account level (account_id match) for exact duplicates
    if (metadata?.accounts && metadata.accounts.length > 0) {
      const newAccountIds = metadata.accounts.map((acc: any) => acc.id);
      
      // Check if ANY of these account IDs already exist in our database
      const { data: existingAccounts } = await supabaseClient
        .from('plaid_accounts')
        .select('account_id, name, mask')
        .eq('user_id', user.id)
        .in('account_id', newAccountIds);

      if (existingAccounts && existingAccounts.length > 0) {
        console.warn('Duplicate accounts detected by account_id:', {
          user_id: user.id,
          duplicate_account_ids: existingAccounts.map(a => a.account_id),
          institution_name: metadata.institution?.name
        });
        
        return new Response(
          JSON.stringify({ 
            error: `You've already connected these accounts from ${metadata.institution?.name || 'this institution'}. To refresh your connection, please use the "Reconnect" option instead of connecting again.`,
            duplicate: true,
            institution_name: metadata.institution?.name,
            duplicate_accounts: existingAccounts
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Also check by institution + account name/mask for edge cases
    if (metadata?.institution?.institution_id && metadata?.accounts) {
      const { data: existingItems } = await supabaseClient
        .from('plaid_items')
        .select(`
          id,
          institution_id,
          institution_name,
          plaid_accounts (
            account_id,
            name,
            mask
          )
        `)
        .eq('user_id', user.id)
        .eq('institution_id', metadata.institution.institution_id);

      if (existingItems && existingItems.length > 0) {
        const newAccounts = metadata.accounts.map((acc: any) => ({
          name: acc.name,
          mask: acc.mask
        }));

        const existingAccounts = existingItems.flatMap((item: any) => 
          item.plaid_accounts.map((acc: any) => ({
            name: acc.name,
            mask: acc.mask
          }))
        );

        // Check if any new account matches by name AND mask
        const hasSimilarAccount = newAccounts.some((newAcc: any) =>
          existingAccounts.some((existingAcc: any) =>
            existingAcc.name === newAcc.name && existingAcc.mask === newAcc.mask
          )
        );

        if (hasSimilarAccount) {
          console.warn('Similar accounts detected by name+mask:', {
            user_id: user.id,
            institution_id: metadata.institution.institution_id,
            institution_name: metadata.institution.name
          });
          
          return new Response(
            JSON.stringify({ 
              error: `Accounts with the same name and last 4 digits from ${metadata.institution.name} are already connected. Please use "Reconnect" to update your existing connection.`,
              duplicate: true,
              institution_name: metadata.institution.name
            }),
            {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        console.log('Multiple items from same institution allowed - different accounts:', {
          user_id: user.id,
          institution_id: metadata.institution.institution_id,
          existing_count: existingItems.length
        });
      }
    }

    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'production';

    // Exchange public token for access token
    // Track API call timing
    const exchangeStartTime = Date.now();
    
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
    const exchangeResponseTime = Date.now() - exchangeStartTime;

    // Log API call with request_id
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (!exchangeResponse.ok) {
      console.error('Plaid exchange error:', exchangeData);
      
      // Log failed API call
      await supabaseAdmin.rpc('log_plaid_api_call', {
        p_user_id: user.id,
        p_item_id: null,
        p_endpoint: '/item/public_token/exchange',
        p_request_id: exchangeData.request_id || 'unknown',
        p_status_code: exchangeResponse.status,
        p_error_code: exchangeData.error_code,
        p_error_type: exchangeData.error_type,
        p_error_message: exchangeData.error_message,
        p_response_time_ms: exchangeResponseTime
      });
      
      throw new Error(exchangeData.error_message || 'Failed to exchange token');
    }

    const { access_token, item_id } = exchangeData;

    // Log successful API call
    await supabaseAdmin.rpc('log_plaid_api_call', {
      p_user_id: user.id,
      p_item_id: item_id,
      p_endpoint: '/item/public_token/exchange',
      p_request_id: exchangeData.request_id || 'unknown',
      p_status_code: 200,
      p_response_time_ms: exchangeResponseTime
    });

    console.log('Storing Plaid item and token in vault for:', { 
      item_id, 
      user_id: user.id,
      link_session_id: link_session_id || 'not_provided'
    });

    const vaultSecretId = `plaid_token_${item_id}`;
    const { data: storedSecretId, error: vaultError } = await supabaseAdmin.rpc('store_plaid_token_in_vault', {
      p_token: access_token,
      p_secret_name: vaultSecretId,
      p_description: `Plaid access token for item ${item_id}`
    });

    if (vaultError) {
      console.error('Vault storage error:', vaultError);
      throw new Error('Failed to securely store access token');
    }

    // Store item with vault reference, token tracking, and link_session_id
    const tokenCreatedAt = new Date().toISOString();
    const { error: itemError } = await supabaseClient
      .from('plaid_items')
      .insert({
        user_id: user.id,
        vault_secret_id: storedSecretId,
        access_token: '', // Empty for backward compatibility
        item_id: item_id,
        institution_id: metadata?.institution?.institution_id,
        institution_name: metadata?.institution?.name,
        link_session_id: link_session_id,
        token_created_at: tokenCreatedAt,
        token_rotation_required: false
      });

    if (itemError) {
      console.error('Database error storing item:', itemError);
      throw itemError;
    }

    console.log('Item stored successfully with vault encryption:', item_id);

    // Get accounts with timing
    const accountsStartTime = Date.now();
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
    const accountsResponseTime = Date.now() - accountsStartTime;

    if (!accountsResponse.ok) {
      console.error('Failed to fetch accounts from Plaid:', {
        user_id: user.id,
        item_id: item_id,
        error_code: accountsData.error_code,
        error_message: accountsData.error_message
      });
      
      // Log failed accounts fetch
      await supabaseAdmin.rpc('log_plaid_api_call', {
        p_user_id: user.id,
        p_item_id: item_id,
        p_endpoint: '/accounts/get',
        p_request_id: accountsData.request_id || 'unknown',
        p_status_code: accountsResponse.status,
        p_error_code: accountsData.error_code,
        p_error_type: accountsData.error_type,
        p_error_message: accountsData.error_message,
        p_response_time_ms: accountsResponseTime
      });
      
      throw new Error(accountsData.error_message || 'Failed to fetch accounts');
    }

    // Log successful accounts fetch
    await supabaseAdmin.rpc('log_plaid_api_call', {
      p_user_id: user.id,
      p_item_id: item_id,
      p_endpoint: '/accounts/get',
      p_request_id: accountsData.request_id || 'unknown',
      p_status_code: 200,
      p_response_time_ms: accountsResponseTime
    });

    console.log('Accounts fetched from Plaid:', {
      user_id: user.id,
      item_id: item_id,
      account_count: accountsData.accounts?.length,
      request_id: accountsData.request_id
    });

    // Get the plaid_item_id we just inserted
    const { data: plaidItems } = await supabaseClient
      .from('plaid_items')
      .select('id')
      .eq('item_id', item_id)
      .eq('user_id', user.id)
      .single();

    if (!plaidItems) {
      throw new Error('Failed to retrieve plaid item');
    }

    // Store accounts in database and log account_ids
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

    // Log all account IDs for diagnostics
    console.log('Stored accounts with IDs:', {
      item_id,
      account_ids: accountsData.accounts.map((a: any) => a.account_id),
      link_session_id
    });

    // Fetch and import liabilities (credit cards, loans, mortgages)
    console.log('Fetching liabilities for item:', item_id);
    
    const liabilitiesStartTime = Date.now();
    const liabilitiesResponse = await fetch(`https://${PLAID_ENV}.plaid.com/liabilities/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token,
      }),
    });

    let importedDebtsCount = 0;

    if (liabilitiesResponse.ok) {
      const liabilitiesData = await liabilitiesResponse.json();
      const liabilitiesResponseTime = Date.now() - liabilitiesStartTime;
      
      // Log successful liabilities fetch
      await supabaseAdmin.rpc('log_plaid_api_call', {
        p_user_id: user.id,
        p_item_id: item_id,
        p_endpoint: '/liabilities/get',
        p_request_id: liabilitiesData.request_id || 'unknown',
        p_status_code: 200,
        p_response_time_ms: liabilitiesResponseTime
      });
      console.log('Liabilities fetched, processing debts');
      
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
          
          const debtName = account.name || account.official_name || 'Credit Card';
          let last4 = account.mask;
          
          // If no mask available, use last 4 of account_id as fallback
          if (!last4 || last4.trim() === '') {
            last4 = creditLiability.account_id?.slice(-4) || null;
            console.log(`No mask for ${debtName}, using account_id last4: ${last4}`);
          }
          
          // Check for existing debt with same name and last4
          const { data: existingDebt } = await supabaseClient
            .from('debts')
            .select('id, balance, apr, min_payment')
            .eq('user_id', user.id)
            .eq('name', debtName)
            .eq('last4', last4)
            .maybeSingle();
          
          const debtData = {
            balance: account.balances?.current || 0,
            apr: (creditLiability.aprs?.[0]?.apr_percentage || 0) / 100,
            min_payment: creditLiability.minimum_payment_amount || creditLiability.last_payment_amount || account.balances?.current * 0.02,
            due_date: creditLiability.next_payment_due_date?.split('-')[2] || null,
          };

          if (existingDebt) {
            // Update existing debt
            const { error: updateError } = await supabaseClient
              .from('debts')
              .update(debtData)
              .eq('id', existingDebt.id);
            
            if (!updateError) {
              console.log('Updated existing debt:', debtName);
            } else {
              console.error('Error updating debt:', updateError);
            }
          } else {
            // Insert new debt
            const { error: insertError } = await supabaseClient
              .from('debts')
              .insert({
                user_id: user.id,
                name: debtName,
                last4: last4,
                ...debtData
              });

            if (!insertError) {
              importedDebtsCount++;
            } else {
              console.error('Error inserting credit debt:', insertError);
            }
          }
        }
      }

      // Process student loans
      if (liabilitiesData.liabilities?.student) {
        console.log('Processing', liabilitiesData.liabilities.student.length, 'student loans');
        for (const studentLiability of liabilitiesData.liabilities.student) {
          const account = accountsMap.get(studentLiability.account_id);
          if (!account) continue;
          
          const debtName = account.name || account.official_name || studentLiability.loan_name || 'Student Loan';
          let last4 = account.mask || studentLiability.account_number?.slice(-4) || null;
          
          // If no mask or account number, use account_id last 4 as fallback
          if (!last4 || last4.trim() === '') {
            last4 = studentLiability.account_id?.slice(-4) || null;
          }
          
          // Check for existing debt
          const { data: existingDebt } = await supabaseClient
            .from('debts')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', debtName)
            .eq('last4', last4)
            .maybeSingle();
          
          const debtData = {
            balance: account.balances?.current || 0,
            apr: (studentLiability.interest_rate_percentage || 0) / 100,
            min_payment: studentLiability.minimum_payment_amount || account.balances?.current * 0.01,
            due_date: studentLiability.next_payment_due_date?.split('-')[2] || null,
          };

          if (existingDebt) {
            await supabaseClient
              .from('debts')
              .update(debtData)
              .eq('id', existingDebt.id);
            console.log('Updated existing student loan:', debtName);
          } else {
            const { error: insertError } = await supabaseClient
              .from('debts')
              .insert({
                user_id: user.id,
                name: debtName,
                last4: last4,
                ...debtData
              });

            if (!insertError) {
              importedDebtsCount++;
            } else {
              console.error('Error inserting student loan:', insertError);
            }
          }
        }
      }

      // Process mortgages
      if (liabilitiesData.liabilities?.mortgage) {
        console.log('Processing', liabilitiesData.liabilities.mortgage.length, 'mortgages');
        for (const mortgageLiability of liabilitiesData.liabilities.mortgage) {
          const account = accountsMap.get(mortgageLiability.account_id);
          if (!account) continue;
          
          const debtName = account.name || account.official_name || mortgageLiability.property_address || 'Mortgage';
          let last4 = account.mask || mortgageLiability.account_number?.slice(-4) || null;
          
          // If no mask or account number, use account_id last 4 as fallback
          if (!last4 || last4.trim() === '') {
            last4 = mortgageLiability.account_id?.slice(-4) || null;
          }
          
          // Check for existing debt
          const { data: existingDebt } = await supabaseClient
            .from('debts')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', debtName)
            .eq('last4', last4)
            .maybeSingle();
          
          const debtData = {
            balance: account.balances?.current || 0,
            apr: (mortgageLiability.interest_rate?.percentage || 0) / 100,
            min_payment: mortgageLiability.last_payment_amount || account.balances?.current * 0.005,
            due_date: mortgageLiability.next_payment_due_date?.split('-')[2] || null,
          };

          if (existingDebt) {
            await supabaseClient
              .from('debts')
              .update(debtData)
              .eq('id', existingDebt.id);
            console.log('Updated existing mortgage:', debtName);
          } else {
            const { error: insertError } = await supabaseClient
              .from('debts')
              .insert({
                user_id: user.id,
                name: debtName,
                last4: last4,
                ...debtData
              });

            if (!insertError) {
              importedDebtsCount++;
            } else {
              console.error('Error inserting mortgage:', insertError);
            }
          }
        }
      }

      console.log('Successfully imported', importedDebtsCount, 'debts for user:', user.id);
    } else {
      const errorData = await liabilitiesResponse.json();
      const liabilitiesResponseTime = Date.now() - liabilitiesStartTime;
      
      // Log failed liabilities fetch
      await supabaseAdmin.rpc('log_plaid_api_call', {
        p_user_id: user.id,
        p_item_id: item_id,
        p_endpoint: '/liabilities/get',
        p_request_id: errorData.request_id || 'unknown',
        p_status_code: liabilitiesResponse.status,
        p_error_code: errorData.error_code,
        p_error_type: errorData.error_type,
        p_error_message: errorData.error_message,
        p_response_time_ms: liabilitiesResponseTime
      });
      
      console.error('Failed to fetch liabilities:', {
        status: liabilitiesResponse.status,
        error: errorData
      });
      console.warn('Failed to fetch liabilities, but continuing with account linking');
    }

    console.log('Successfully linked accounts for user:', user.id);

    return new Response(JSON.stringify({ 
      success: true,
      item_id: item_id,
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
