import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
const PLAID_ENV = 'production';

function getPlaidUrl(): string {
  if (PLAID_ENV === 'production') {
    return 'https://production.plaid.com';
  }
  return 'https://sandbox.plaid.com';
}

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

    console.log('Importing debts for user:', user.id);

    // Get all user's Plaid items with access tokens
    const { data: items, error: itemsError } = await supabaseClient
      .from('plaid_items')
      .select('item_id, access_token')
      .eq('user_id', user.id);

    if (itemsError) throw itemsError;

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No connected accounts found', debts: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all plaid_accounts for the user to map account_id to mask
    const { data: plaidAccounts, error: accountsError } = await supabaseClient
      .from('plaid_accounts')
      .select('account_id, mask')
      .eq('user_id', user.id);

    if (accountsError) {
      console.error('Error fetching plaid accounts:', accountsError);
    }

    // Create a map of account_id to mask for quick lookup
    const accountMaskMap = new Map();
    if (plaidAccounts) {
      plaidAccounts.forEach(acc => {
        if (acc.mask) {
          accountMaskMap.set(acc.account_id, acc.mask);
        }
      });
    }

    const importedDebts = [];

    // Fetch liabilities for each item
    for (const item of items) {
      console.log('Fetching liabilities for item:', item.item_id);

      if (!item.access_token) {
        console.error('No access token found for item:', item.item_id);
        continue;
      }

      const liabilitiesResponse = await fetch(`${getPlaidUrl()}/liabilities/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET,
          access_token: item.access_token,
        }),
      });

      if (!liabilitiesResponse.ok) {
        const errorText = await liabilitiesResponse.text();
        console.error('Failed to fetch liabilities for item:', item.item_id, 'Status:', liabilitiesResponse.status, 'Error:', errorText);
        continue;
      }

      const liabilitiesData = await liabilitiesResponse.json();
      console.log('Liabilities response received:', JSON.stringify(liabilitiesData, null, 2));
      
      // Process credit card accounts
      if (liabilitiesData.liabilities?.credit) {
        console.log('Processing', liabilitiesData.liabilities.credit.length, 'credit cards');
        for (const creditAccount of liabilitiesData.liabilities.credit) {
          // Find the account in the accounts array to get balance info
          const matchingAccount = liabilitiesData.accounts.find(
            (acc: any) => acc.account_id === creditAccount.account_id
          );

          // Get mask from our database (Plaid liabilities doesn't return it for credit cards)
          const last4 = accountMaskMap.get(creditAccount.account_id) || null;
          
          const debtData = {
            user_id: user.id,
            name: matchingAccount?.name || creditAccount.name || 'Credit Card',
            balance: matchingAccount?.balances?.current || 0,
            apr: (creditAccount.aprs?.[0]?.apr_percentage || 0) / 100,
            min_payment: creditAccount.minimum_payment_amount || creditAccount.last_payment_amount || matchingAccount?.balances?.current * 0.02,
            last4: last4,
            due_date: creditAccount.next_payment_due_date ? new Date(creditAccount.next_payment_due_date).getDate().toString() : null,
          };

          console.log('Inserting debt:', debtData);

          const { data: debt, error: debtError } = await supabaseClient
            .from('debts')
            .insert(debtData)
            .select()
            .single();

          if (debtError) {
            console.error('Error inserting debt:', debtError);
          } else if (debt) {
            importedDebts.push(debt);
          }
        }
      }

      // Process student loans
      if (liabilitiesData.liabilities?.student) {
        console.log('Processing', liabilitiesData.liabilities.student.length, 'student loans');
        for (const studentLoan of liabilitiesData.liabilities.student) {
          const debtData = {
            user_id: user.id,
            name: studentLoan.loan_name || 'Student Loan',
            balance: studentLoan.balances?.current || 0,
            apr: (studentLoan.interest_rate_percentage || 0) / 100,
            min_payment: studentLoan.minimum_payment_amount || studentLoan.balances?.current * 0.01,
            last4: studentLoan.account_number?.slice(-4) || null,
            due_date: studentLoan.next_payment_due_date ? new Date(studentLoan.next_payment_due_date).getDate().toString() : null,
          };

          const { data: debt, error: debtError } = await supabaseClient
            .from('debts')
            .insert(debtData)
            .select()
            .single();

          if (debtError) {
            console.error('Error inserting student loan:', debtError);
          } else if (debt) {
            importedDebts.push(debt);
          }
        }
      }

      // Process mortgages
      if (liabilitiesData.liabilities?.mortgage) {
        console.log('Processing', liabilitiesData.liabilities.mortgage.length, 'mortgages');
        for (const mortgage of liabilitiesData.liabilities.mortgage) {
          const debtData = {
            user_id: user.id,
            name: mortgage.property_address || 'Mortgage',
            balance: mortgage.balances?.current || 0,
            apr: (mortgage.interest_rate?.percentage || 0) / 100,
            min_payment: mortgage.last_payment_amount || mortgage.balances?.current * 0.005,
            last4: mortgage.account_number?.slice(-4) || null,
            due_date: mortgage.next_payment_due_date ? new Date(mortgage.next_payment_due_date).getDate().toString() : null,
          };

          const { data: debt, error: debtError } = await supabaseClient
            .from('debts')
            .insert(debtData)
            .select()
            .single();

          if (debtError) {
            console.error('Error inserting mortgage:', debtError);
          } else if (debt) {
            importedDebts.push(debt);
          }
        }
      }
    }

    console.log('Successfully imported', importedDebts.length, 'debts');

    return new Response(
      JSON.stringify({ 
        message: `Imported ${importedDebts.length} debts successfully`,
        debts: importedDebts 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error importing debts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
