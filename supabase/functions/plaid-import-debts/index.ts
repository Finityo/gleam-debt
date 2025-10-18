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

    // Get all user's Plaid items
    const { data: items, error: itemsError } = await supabaseClient
      .from('plaid_items')
      .select('item_id')
      .eq('user_id', user.id);

    if (itemsError) throw itemsError;

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No connected accounts found', debts: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const importedDebts = [];

    // Fetch liabilities for each item
    for (const item of items) {
      console.log('Fetching liabilities for item:', item.item_id);

      // Get access token from Vault
      const { data: tokenData, error: tokenError } = await supabaseClient
        .rpc('get_plaid_token_from_vault', {
          p_item_id: item.item_id,
          p_function_name: 'plaid-import-debts'
        });

      if (tokenError || !tokenData) {
        console.error('Failed to get token from Vault for item:', item.item_id, tokenError);
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
          access_token: tokenData,
        }),
      });

      if (!liabilitiesResponse.ok) {
        console.error('Failed to fetch liabilities for item:', item.item_id);
        continue;
      }

      const liabilitiesData = await liabilitiesResponse.json();
      
      // Process credit card accounts
      if (liabilitiesData.liabilities?.credit) {
        for (const creditAccount of liabilitiesData.liabilities.credit) {
          const debtData = {
            user_id: user.id,
            name: creditAccount.name || 'Credit Card',
            balance: creditAccount.balances?.current || 0,
            apr: creditAccount.aprs?.[0]?.apr_percentage || 0,
            min_payment: creditAccount.last_payment_amount || creditAccount.balances?.current * 0.02,
            last4: creditAccount.mask || null,
            due_date: creditAccount.next_payment_due_date || null,
          };

          // Insert or update debt
          const { data: debt, error: debtError } = await supabaseClient
            .from('debts')
            .upsert(debtData, { 
              onConflict: 'user_id,name,last4',
              ignoreDuplicates: false 
            })
            .select()
            .single();

          if (!debtError && debt) {
            importedDebts.push(debt);
          }
        }
      }

      // Process student loans
      if (liabilitiesData.liabilities?.student) {
        for (const studentLoan of liabilitiesData.liabilities.student) {
          const debtData = {
            user_id: user.id,
            name: studentLoan.loan_name || 'Student Loan',
            balance: studentLoan.balances?.current || 0,
            apr: studentLoan.interest_rate_percentage || 0,
            min_payment: studentLoan.minimum_payment_amount || studentLoan.balances?.current * 0.01,
            last4: studentLoan.account_number?.slice(-4) || null,
            due_date: studentLoan.next_payment_due_date || null,
          };

          const { data: debt, error: debtError } = await supabaseClient
            .from('debts')
            .upsert(debtData, { 
              onConflict: 'user_id,name,last4',
              ignoreDuplicates: false 
            })
            .select()
            .single();

          if (!debtError && debt) {
            importedDebts.push(debt);
          }
        }
      }

      // Process mortgages
      if (liabilitiesData.liabilities?.mortgage) {
        for (const mortgage of liabilitiesData.liabilities.mortgage) {
          const debtData = {
            user_id: user.id,
            name: mortgage.property_address || 'Mortgage',
            balance: mortgage.balances?.current || 0,
            apr: mortgage.interest_rate?.percentage || 0,
            min_payment: mortgage.last_payment_amount || mortgage.balances?.current * 0.005,
            last4: mortgage.account_number?.slice(-4) || null,
            due_date: mortgage.next_payment_due_date || null,
          };

          const { data: debt, error: debtError } = await supabaseClient
            .from('debts')
            .upsert(debtData, { 
              onConflict: 'user_id,name,last4',
              ignoreDuplicates: false 
            })
            .select()
            .single();

          if (!debtError && debt) {
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
