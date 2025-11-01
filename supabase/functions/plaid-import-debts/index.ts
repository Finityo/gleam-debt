import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { handleError, getUserIdFromRequest } from '../_shared/error-handler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SECURITY: Validation schemas for Plaid financial data
const debtDataSchema = z.object({
  balance: z.number().min(0).max(1_000_000_000).finite(),
  apr: z.number().min(0).max(1).finite(), // Already normalized to decimal
  min_payment: z.number().min(0).max(10_000_000).finite(),
  due_date: z.union([z.string().regex(/^\d{1,2}$/).nullable(), z.null()]).optional()
});

const accountSchema = z.object({
  account_id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().min(1).max(200),
  mask: z.string().max(4).nullable().optional(),
  balances: z.object({
    current: z.number().finite().nullable().optional()
  }).optional()
});

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
      console.log('Account mask map created with', accountMaskMap.size, 'entries');
    }

    const importedDebts = [];

    // Fetch liabilities for each item
    for (const item of items) {
      console.log('Fetching liabilities for item:', item.item_id);

      // Get access token from vault
      const { data: accessToken, error: tokenError } = await supabaseClient.rpc('get_plaid_token_from_vault', {
        p_item_id: item.item_id,
        p_function_name: 'plaid-import-debts'
      });

      if (tokenError || !accessToken) {
        console.error('Failed to get token for item:', item.item_id, tokenError);
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
          access_token: accessToken,
        }),
      });

      if (!liabilitiesResponse.ok) {
        const errorText = await liabilitiesResponse.text();
        console.error('Failed to fetch liabilities for item:', item.item_id, 'Status:', liabilitiesResponse.status, 'Error:', errorText);
        continue;
      }

      const liabilitiesData = await liabilitiesResponse.json();
      console.log('Liabilities received, processing debts');
      
      // Process credit card accounts
      if (liabilitiesData.liabilities?.credit) {
        console.log('Processing', liabilitiesData.liabilities.credit.length, 'credit cards');
        for (const creditAccount of liabilitiesData.liabilities.credit) {
          // Find the account in the accounts array to get balance AND mask info
          const matchingAccount = liabilitiesData.accounts.find(
            (acc: any) => acc.account_id === creditAccount.account_id
          );

          // First try to get mask from the Plaid liabilities response's accounts array
          // If not there, try our database, then fall back to account_id last 4
          let last4 = matchingAccount?.mask || accountMaskMap.get(creditAccount.account_id);
          
          if (!last4 && creditAccount.account_id) {
            last4 = creditAccount.account_id.slice(-4);
            console.log(`No mask for account ${creditAccount.account_id}, using account_id last4: ${last4}`);
          }
          
          const debtName = matchingAccount?.name || creditAccount.name || 'Credit Card';
          
          // Check for existing debt with same name and last4
          const { data: existingDebt } = await supabaseClient
            .from('debts')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', debtName)
            .eq('last4', last4)
            .maybeSingle();
          
          const rawDebtData = {
            balance: Math.abs(matchingAccount?.balances?.current || 0),
            apr: (creditAccount.aprs?.[0]?.apr_percentage || 0) / 100,
            min_payment: creditAccount.minimum_payment_amount || 
                        creditAccount.last_payment_amount || 
                        Math.abs(matchingAccount?.balances?.current || 0) * 0.02,
            due_date: creditAccount.next_payment_due_date ? new Date(creditAccount.next_payment_due_date).getDate().toString() : null,
          };
          
          // SECURITY: Validate debt data before inserting
          const debtData = debtDataSchema.parse(rawDebtData);

          if (existingDebt) {
            // Update existing debt
            const { data: debt, error: updateError } = await supabaseClient
              .from('debts')
              .update(debtData)
              .eq('id', existingDebt.id)
              .select()
              .single();
            
            if (!updateError && debt) {
              console.log('Updated existing debt:', debtName);
              importedDebts.push(debt);
            } else {
              console.error('Error updating debt:', updateError);
            }
          } else {
            // Insert new debt
            const { data: debt, error: insertError } = await supabaseClient
              .from('debts')
              .insert({
                user_id: user.id,
                name: debtName,
                last4: last4,
                ...debtData
              })
              .select()
              .single();

            if (!insertError && debt) {
              importedDebts.push(debt);
            } else {
              console.error('Error inserting debt:', insertError);
            }
          }
        }
      }

      // Process student loans
      if (liabilitiesData.liabilities?.student) {
        console.log('Processing', liabilitiesData.liabilities.student.length, 'student loans');
        for (const studentLoan of liabilitiesData.liabilities.student) {
          const debtName = studentLoan.loan_name || 'Student Loan';
          const last4 = studentLoan.account_number?.slice(-4) || null;
          
          // Check for existing debt
          const { data: existingDebt } = await supabaseClient
            .from('debts')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', debtName)
            .eq('last4', last4)
            .maybeSingle();
          
          const rawDebtData = {
            balance: Math.abs(studentLoan.balances?.current || 0),
            apr: (studentLoan.interest_rate_percentage || 0) / 100,
            min_payment: studentLoan.minimum_payment_amount || 
                        Math.abs(studentLoan.balances?.current || 0) * 0.01,
            due_date: studentLoan.next_payment_due_date ? new Date(studentLoan.next_payment_due_date).getDate().toString() : null,
          };
          
          // SECURITY: Validate debt data before inserting
          const debtData = debtDataSchema.parse(rawDebtData);

          if (existingDebt) {
            const { data: debt, error: updateError } = await supabaseClient
              .from('debts')
              .update(debtData)
              .eq('id', existingDebt.id)
              .select()
              .single();
            
            if (!updateError && debt) {
              console.log('Updated existing student loan:', debtName);
              importedDebts.push(debt);
            }
          } else {
            const { data: debt, error: insertError } = await supabaseClient
              .from('debts')
              .insert({
                user_id: user.id,
                name: debtName,
                last4: last4,
                ...debtData
              })
              .select()
              .single();

            if (!insertError && debt) {
              importedDebts.push(debt);
            } else {
              console.error('Error inserting student loan:', insertError);
            }
          }
        }
      }

      // Process mortgages
      if (liabilitiesData.liabilities?.mortgage) {
        console.log('Processing', liabilitiesData.liabilities.mortgage.length, 'mortgages');
        for (const mortgage of liabilitiesData.liabilities.mortgage) {
          const debtName = mortgage.property_address || 'Mortgage';
          const last4 = mortgage.account_number?.slice(-4) || null;
          
          // Check for existing debt
          const { data: existingDebt } = await supabaseClient
            .from('debts')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', debtName)
            .eq('last4', last4)
            .maybeSingle();
          
          const rawDebtData = {
            balance: Math.abs(mortgage.balances?.current || 0),
            apr: (mortgage.interest_rate?.percentage || 0) / 100,
            min_payment: mortgage.last_payment_amount || 
                        Math.abs(mortgage.balances?.current || 0) * 0.005,
            due_date: mortgage.next_payment_due_date ? new Date(mortgage.next_payment_due_date).getDate().toString() : null,
          };
          
          // SECURITY: Validate debt data before inserting
          const debtData = debtDataSchema.parse(rawDebtData);

          if (existingDebt) {
            const { data: debt, error: updateError } = await supabaseClient
              .from('debts')
              .update(debtData)
              .eq('id', existingDebt.id)
              .select()
              .single();
            
            if (!updateError && debt) {
              console.log('Updated existing mortgage:', debtName);
              importedDebts.push(debt);
            }
          } else {
            const { data: debt, error: insertError } = await supabaseClient
              .from('debts')
              .insert({
                user_id: user.id,
                name: debtName,
                last4: last4,
                ...debtData
              })
              .select()
              .single();

            if (!insertError && debt) {
              importedDebts.push(debt);
            } else {
              console.error('Error inserting mortgage:', insertError);
            }
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
    // SECURITY: Use centralized error handler to prevent information disclosure
    const userId = await getUserIdFromRequest(req);
    return handleError(error, {
      functionName: 'plaid-import-debts',
      userId,
      requestPath: '/plaid-import-debts'
    });
  }
});
