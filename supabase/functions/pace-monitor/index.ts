import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Strategy = "snowball" | "avalanche";

type PaceResponse = {
  projected_debt_free_date: string | null;
  projected_months: number | null;
  goal_target_date: string | null;
  pace_status: "ahead" | "on_track" | "behind" | "no_goal";
  days_delta: number | null;
  total_debts_estimate: number;
  closed_debts: number;
  progress_pct: number;
};

type DebtRecord = {
  id: string;
  balance: number;
  apr: number;
  min_payment: number;
  status?: string | null;
};

type CalculatorSettings = {
  strategy: Strategy;
  monthly_extra: number;
};

function simulatePlanForCoach(
  debts: DebtRecord[],
  settings: CalculatorSettings,
  strategy: Strategy
) {
  const items = debts.map((d) => ({
    id: d.id,
    balance: Number(d.balance),
    apr: Math.max(0, Number(d.apr) || 0),
    minPayment: Math.max(0, Number(d.min_payment) || 0)
  }));

  const sortDebts = () => {
    if (strategy === "snowball") {
      items.sort((a, b) => a.balance - b.balance);
    } else {
      items.sort((a, b) => b.apr - a.apr || a.balance - b.balance);
    }
  };

  sortDebts();

  const monthlyExtra = Math.max(0, Number(settings.monthly_extra) || 0);
  const minTotal = items.reduce((t, d) => t + d.minPayment, 0);
  const monthlyBudget = minTotal + monthlyExtra;

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

  const debtFreeDate = new Date(
    now.getFullYear(),
    now.getMonth() + months,
    1
  )
    .toISOString()
    .slice(0, 10);

  return {
    strategy,
    months,
    debt_free_date: debtFreeDate,
    total_interest: Math.round(totalInterest * 100) / 100
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") ?? ""
        }
      }
    });

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const userId = user.id;

    // debts + settings for projection
    const { data: debtsRaw, error: debtsError } = await supabase
      .from("debts")
      .select("id,balance,apr,min_payment,status")
      .eq("user_id", userId);
    if (debtsError) throw debtsError;

    const debts: DebtRecord[] =
      (debtsRaw as any[])?.filter(
        (d) =>
          Number(d.balance) > 0 &&
          (d.status === null ||
            d.status === "active" ||
            d.status === "open")
      ) ?? [];

    const { data: settingsRow, error: settingsError } = await supabase
      .from("debt_calculator_settings")
      .select("strategy,monthly_extra")
      .eq("user_id", userId)
      .maybeSingle();
    if (settingsError && settingsError.code !== "PGRST116") {
      throw settingsError;
    }

    const strategy: Strategy =
      (settingsRow?.strategy as Strategy) ?? "snowball";
    const monthly_extra = Number(settingsRow?.monthly_extra ?? 0);

    const projection = simulatePlanForCoach(
      debts,
      { strategy, monthly_extra },
      strategy
    );

    // goals
    const { data: goals, error: goalsError } = await supabase
      .from("debt_goals")
      .select("id,label,goal_type,target_date,status")
      .eq("user_id", userId)
      .eq("goal_type", "debt_free_by")
      .order("target_date", { ascending: true });

    if (goalsError) throw goalsError;

    const activeGoals = (goals ?? []).filter(
      (g: any) => g.status === "active"
    );
    const nearestGoal = activeGoals[0] ?? null;

    let pace_status: PaceResponse["pace_status"] = "no_goal";
    let days_delta: number | null = null;
    let goal_target_date: string | null = null;

    if (nearestGoal && nearestGoal.target_date && projection.debt_free_date) {
      goal_target_date = nearestGoal.target_date;
      const proj = new Date(projection.debt_free_date);
      const target = new Date(nearestGoal.target_date);
      const diffMs = target.getTime() - proj.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      days_delta = diffDays;

      if (diffDays >= 30) {
        pace_status = "ahead";
      } else if (diffDays <= -30) {
        pace_status = "behind";
      } else {
        pace_status = "on_track";
      }
    }

    // closed debts estimate via payoff_events
    const { data: events, error: eventsError } = await supabase
      .from("payoff_events")
      .select("event_type")
      .eq("user_id", userId);
    if (eventsError) throw eventsError;

    const closedDebts =
      events?.filter((e: any) => e.event_type === "debt_closed").length ?? 0;

    // crude estimate of total debts = currently open + closed
    const totalDebtsEst = debts.length + closedDebts;
    const progressPct =
      totalDebtsEst > 0
        ? Math.round((closedDebts / totalDebtsEst) * 100)
        : 0;

    const body: PaceResponse = {
      projected_debt_free_date: projection.debt_free_date,
      projected_months: projection.months,
      goal_target_date,
      pace_status,
      days_delta,
      total_debts_estimate: totalDebtsEst,
      closed_debts: closedDebts,
      progress_pct: progressPct
    };

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (e) {
    console.error("pace-monitor error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
