import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Strategy = 'snowball' | 'avalanche';

type DebtRecord = {
  id: string;
  balance: number;
  apr: number;
  min_payment: number;
};

type Goal = {
  id: string;
  label: string;
  goal_type: string;
  target_value: number | null;
  target_date: string | null;
  strategy: Strategy | null;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type GoalsMode = 'list' | 'create' | 'update';

type ProjectionResult = {
  strategy: Strategy;
  months: number;
  debt_free_date: string;
  total_interest: number;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = user.id;

    const body = req.method === 'POST' ? await req.json() : { mode: 'list' };
    const mode: GoalsMode = body.mode ?? 'list';

    if (mode === 'create') {
      if (!body.label || !body.goal_type) {
        return new Response(
          JSON.stringify({ error: 'label and goal_type are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const insert = {
        user_id: userId,
        label: body.label,
        goal_type: body.goal_type,
        target_value: body.target_value != null ? Number(body.target_value) : null,
        target_date: body.target_date ?? null,
        strategy: body.strategy ?? null,
        status: 'active',
      };
      const { data, error } = await supabase
        .from('debt_goals')
        .insert(insert)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return new Response(JSON.stringify({ goal: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    if (mode === 'update') {
      if (!body.id) {
        return new Response(
          JSON.stringify({ error: 'id is required for update' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const patch: any = { updated_at: new Date().toISOString() };
      if (body.label != null) patch.label = body.label;
      if (body.goal_type != null) patch.goal_type = body.goal_type;
      if (body.target_value != null) patch.target_value = Number(body.target_value);
      if (body.target_date != null) patch.target_date = body.target_date;
      if (body.strategy != null) patch.strategy = body.strategy;
      if (body.status != null) {
        patch.status = body.status;
        if (body.status === 'met' || body.status === 'missed') {
          patch.completed_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('debt_goals')
        .update(patch)
        .eq('id', body.id)
        .eq('user_id', userId)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return new Response(JSON.stringify({ goal: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // mode list
    const { data: goalsRaw, error: goalsError } = await supabase
      .from('debt_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (goalsError) throw goalsError;

    const goals = (goalsRaw ?? []) as Goal[];

    if (goals.length === 0) {
      return new Response(JSON.stringify({ goals: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Get debts and settings for evaluation
    const { data: debtsRaw, error: debtsError } = await supabase
      .from('debts')
      .select('id,balance,apr,min_payment')
      .eq('user_id', userId);

    if (debtsError) throw debtsError;

    const debts: DebtRecord[] = (debtsRaw as any[])?.filter((d) => Number(d.balance) > 0) ?? [];

    const { data: settingsRow, error: settingsError } = await supabase
      .from('debt_calculator_settings')
      .select('strategy,extra_monthly')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

    const baseStrategy: Strategy = (settingsRow?.strategy as Strategy) ?? 'snowball';
    const baseExtra = Number(settingsRow?.extra_monthly ?? 0);

    const projection = simulatePlan(debts, baseExtra, baseStrategy);

    const evaluated = goals.map((g) => {
      const evaluation = evaluateGoal(g, projection, baseExtra);
      return { ...g, evaluation };
    });

    return new Response(JSON.stringify({ goals: evaluated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('goals-engine error:', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function simulatePlan(debts: DebtRecord[], monthlyExtra: number, strategy: Strategy): ProjectionResult {
  const items = debts.map((d) => ({
    id: d.id,
    balance: Number(d.balance),
    apr: Math.max(0, Number(d.apr) || 0),
    minPayment: Math.max(0, Number(d.min_payment) || 0),
  }));

  const sortDebts = () => {
    if (strategy === 'snowball') {
      items.sort((a, b) => a.balance - b.balance);
    } else {
      items.sort((a, b) => b.apr - a.apr || a.balance - b.balance);
    }
  };

  sortDebts();

  const minTotal = items.reduce((t, d) => t + d.minPayment, 0);
  const monthlyBudget = minTotal + Math.max(0, monthlyExtra);

  let months = 0;
  let totalInterest = 0;
  const now = new Date();
  const maxMonths = 50 * 12;

  while (true) {
    const remaining = items.reduce((t, d) => t + d.balance, 0);
    if (remaining <= 0.01 || months >= maxMonths) break;

    months += 1;

    for (const d of items) {
      if (d.balance <= 0) continue;
      const monthlyRate = d.apr / 100 / 12;
      const interest = d.balance * monthlyRate;
      d.balance += interest;
      totalInterest += interest;
    }

    let budget = monthlyBudget;
    for (const d of items) {
      if (d.balance <= 0 || budget <= 0) continue;
      const pay = Math.min(d.minPayment, d.balance, budget);
      d.balance -= pay;
      budget -= pay;
    }

    sortDebts();
    for (const d of items) {
      if (budget <= 0) break;
      if (d.balance <= 0) continue;
      const pay = Math.min(d.balance, budget);
      d.balance -= pay;
      budget -= pay;
    }

    for (const d of items) {
      if (d.balance > 0 && d.balance < 0.01) d.balance = 0;
    }
  }

  const debtFreeDate = new Date(now.getFullYear(), now.getMonth() + months, 1).toISOString().slice(0, 10);

  return {
    strategy,
    months,
    debt_free_date: debtFreeDate,
    total_interest: Math.round(totalInterest * 100) / 100,
  };
}

function evaluateGoal(
  g: Goal,
  projection: ProjectionResult,
  currentExtra: number
): { on_track: boolean | null; message: string } {
  const today = new Date();
  if (g.goal_type === 'debt_free_by' && g.target_date) {
    const target = new Date(g.target_date);
    const proj = new Date(projection.debt_free_date);
    if (proj <= target) {
      return {
        on_track: true,
        message: `Your plan is on pace to have everything paid by ${projection.debt_free_date}, which meets this goal.`,
      };
    } else {
      const diffMs = proj.getTime() - target.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return {
        on_track: false,
        message: `Your current projection is later than this goal by about ${diffDays} day(s). Increasing your extra payment could close the gap.`,
      };
    }
  }

  if (g.goal_type === 'extra_amount_by_date' && g.target_date && g.target_value != null) {
    const target = new Date(g.target_date);
    if (today > target) {
      const achieved = currentExtra >= Number(g.target_value);
      return {
        on_track: achieved,
        message: achieved
          ? 'You reached or exceeded your target extra payment by the deadline.'
          : 'You did not reach the target extra payment by the deadline.',
      };
    } else {
      const diffMs = target.getTime() - today.getTime();
      const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const gap = Number(g.target_value) - currentExtra;
      if (gap <= 0) {
        return {
          on_track: true,
          message: `You are already at or above this extra payment goal with about ${daysLeft} day(s) left.`,
        };
      }
      return {
        on_track: null,
        message: `You are about $${gap.toFixed(0)} below your target extra payment with about ${daysLeft} day(s) left.`,
      };
    }
  }

  return {
    on_track: null,
    message: 'This goal does not have an automated evaluation yet, but it is tracked in your list.',
  };
}
