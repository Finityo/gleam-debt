import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DebtRow {
  id: string;
  name: string;
  balance: string;
  apr: string;
  min_payment: string;
  due_day: number | null;
  include: boolean;
  notes: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log(`Fetching debts for user: ${user.id}`);

    // Fetch user's debts
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (debtsError) {
      console.error('Error fetching debts:', debtsError);
      throw debtsError;
    }

    console.log(`Found ${debts?.length || 0} debts`);

    // Transform to match DebtInput interface
    const transformedDebts = (debts || []).map((debt: DebtRow) => ({
      id: debt.id,
      name: debt.name,
      balance: parseFloat(debt.balance),
      apr: parseFloat(debt.apr),
      minPayment: parseFloat(debt.min_payment),
      dueDay: debt.due_day || 15,
      include: debt.include,
      notes: debt.notes || undefined,
    }));

    return new Response(
      JSON.stringify(transformedDebts),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in get-debts function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 500,
      }
    );
  }
});
