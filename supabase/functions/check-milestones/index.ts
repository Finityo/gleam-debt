import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Checking milestones for user:', user.id);

    // Fetch user's debts
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id);

    if (debtsError) throw debtsError;

    // Calculate totals
    const totalOriginal = debts?.reduce((sum, debt) => {
      // Use balance as original if no original_balance field exists
      return sum + Number(debt.balance || 0);
    }, 0) || 0;

    const remaining = debts?.reduce((sum, debt) => sum + Number(debt.balance || 0), 0) || 0;
    const paidOff = totalOriginal - remaining;
    const percentPaid = totalOriginal > 0 ? (paidOff / totalOriginal) * 100 : 0;

    // Count paid off debts
    const paidOffCount = debts?.filter(d => Number(d.balance) === 0).length || 0;

    // Define milestone triggers
    const milestones = [
      {
        type: 'first_debt_paid',
        condition: paidOffCount >= 1,
        label: 'First Debt Paid Off',
        metadata: { debtCount: paidOffCount }
      },
      {
        type: 'twenty_five_percent',
        condition: percentPaid >= 25,
        label: '25% Debt Paid Off',
        metadata: { percentPaid: Math.round(percentPaid * 10) / 10 }
      },
      {
        type: 'fifty_percent',
        condition: percentPaid >= 50,
        label: '50% Debt Paid Off',
        metadata: { percentPaid: Math.round(percentPaid * 10) / 10 }
      },
      {
        type: 'seventy_five_percent',
        condition: percentPaid >= 75,
        label: '75% Debt Paid Off',
        metadata: { percentPaid: Math.round(percentPaid * 10) / 10 }
      },
      {
        type: 'debt_free',
        condition: remaining === 0 && debts && debts.length > 0,
        label: 'Debt Free!',
        metadata: { totalPaid: totalOriginal }
      }
    ];

    // Check existing milestones
    const { data: existingMilestones } = await supabase
      .from('user_milestones')
      .select('milestone_type')
      .eq('user_id', user.id);

    const existingTypes = new Set(existingMilestones?.map(m => m.milestone_type) || []);
    const newMilestones = [];

    // Insert new milestones
    for (const milestone of milestones) {
      if (milestone.condition && !existingTypes.has(milestone.type)) {
        const { error: insertError } = await supabase
          .from('user_milestones')
          .insert({
            user_id: user.id,
            milestone_type: milestone.type,
            date_reached: new Date().toISOString(),
            metadata: milestone.metadata
          });

        if (!insertError) {
          console.log('New milestone achieved:', milestone.type);
          newMilestones.push(milestone);
        }
      }
    }

    // Fetch all milestones
    const { data: allMilestones } = await supabase
      .from('user_milestones')
      .select('*')
      .eq('user_id', user.id)
      .order('date_reached', { ascending: false });

    return new Response(
      JSON.stringify({
        milestones: allMilestones,
        newMilestones: newMilestones.map(m => ({ type: m.type, label: m.label })),
        progress: {
          totalOriginal,
          remaining,
          paidOff,
          percentPaid: Math.round(percentPaid * 10) / 10,
          paidOffCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking milestones:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
