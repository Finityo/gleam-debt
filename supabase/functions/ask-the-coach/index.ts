import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Strategy = "snowball" | "avalanche";

type CoachRequest = {
  prompt: string;
  persona?:
    | "hybrid"
    | "motivational"
    | "accountability"
    | "marine"
    | "strategist";
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

type CoachReply = {
  reply: string;
  persona_used: string;
  highlights: string[];
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

    const body: CoachRequest =
      req.method === "POST" ? await req.json() : { prompt: "" };
    const prompt = (body.prompt ?? "").trim();
    const persona = body.persona ?? "hybrid";

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch key data for context
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

    const totalDebt = debts.reduce(
      (t, d) => t + Number(d.balance ?? 0),
      0
    );
    const highestApr = debts.reduce(
      (max, d) =>
        Number(d.apr ?? 0) > max ? Number(d.apr ?? 0) : max,
      0
    );

    const minTotal = debts.reduce(
      (t, d) => t + Number(d.min_payment ?? 0),
      0
    );

    const { data: settingsRow, error: settingsError } = await supabase
      .from("debt_calculator_settings")
      .select("strategy,monthly_extra")
      .eq("user_id", userId)
      .maybeSingle();
    if (settingsError && settingsError.code !== "PGRST116") {
      throw settingsError;
    }

    const settings: CalculatorSettings = {
      strategy: (settingsRow?.strategy as Strategy) ?? "snowball",
      monthly_extra: Number(settingsRow?.monthly_extra ?? 0)
    };

    // Utilization from plaid_accounts
    const { data: accountsRaw, error: accountsError } = await supabase
      .from("plaid_accounts")
      .select("type,current_balance,available_balance")
      .eq("user_id", userId);
    if (accountsError) throw accountsError;
    const cards = (accountsRaw ?? []).filter((a: any) => a.type === "credit");
    const ccUsed = cards.reduce(
      (t: number, a: any) => t + Number(a.current_balance ?? 0),
      0
    );
    // Note: plaid_accounts doesn't have limit, so we'll skip utilization if not available
    const utilization: number | null = null;

    // Payoff projection
    const projection = simulatePlanForCoach(
      debts,
      settings,
      settings.strategy
    );

    // Streak stats from payoff_events
    const { data: events, error: eventsError } = await supabase
      .from("payoff_events")
      .select("event_type,event_date")
      .eq("user_id", userId)
      .order("event_date", { ascending: true });

    if (eventsError) throw eventsError;

    const totalDebtsClosed =
      events?.filter((e: any) => e.event_type === "debt_closed").length ?? 0;

    // Goals snapshot
    const { data: goals, error: goalsError } = await supabase
      .from("debt_goals")
      .select("id,label,goal_type,target_date,target_value,status")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (goalsError) throw goalsError;

    const activeGoals = (goals ?? []).filter(
      (g: any) => g.status === "active"
    );

    // Build a persona-style response
    const baseLines: string[] = [];

    baseLines.push(
      `Here's how your situation looks right now:\n` +
        `• Total active debt: $${totalDebt.toFixed(0)}\n` +
        `• Strategy in calculator: ${
          settings.strategy === "snowball" ? "Snowball" : "Avalanche"
        }\n` +
        `• Extra payment set: $${settings.monthly_extra.toFixed(0)} / month\n` +
        `• Projected debt-free date: ${projection.debt_free_date} (${projection.months} month(s))`
    );

    if (highestApr > 0) {
      baseLines.push(
        `• Highest APR on your debts: ~${highestApr.toFixed(1)}%`
      );
    }
    if (totalDebtsClosed > 0) {
      baseLines.push(
        `• Debts already fully paid off: ${totalDebtsClosed}`
      );
    }
    if (activeGoals.length > 0) {
      const g = activeGoals[0];
      if (g.goal_type === "debt_free_by" && g.target_date) {
        baseLines.push(
          `• Active goal: Debt-free by ${g.target_date} ("${g.label}")`
        );
      } else if (g.goal_type === "extra_amount_by_date") {
        baseLines.push(
          `• Active goal: Reach $${Number(
            g.target_value ?? 0
          ).toFixed(0)} in extra payments by ${g.target_date} ("${
            g.label
          }")`
        );
      }
    }

    // Hybrid tone = supportive + direct + tactical
    const adviceLines: string[] = [];

    // 1) Strategy advice
    if (settings.strategy === "snowball" && highestApr >= 22) {
      adviceLines.push(
        "Tactically, your Snowball plan is fine for momentum, but because you have high APR debt, I'd seriously consider testing Avalanche in your What-If calculator. If it chops months off or saves serious interest, we can swap your strategy and let Snowball handle the psychology through small wins elsewhere."
      );
    } else if (settings.strategy === "avalanche") {
      adviceLines.push(
        "Your Avalanche setting is focusing your fire on the most expensive debts first. That's strong strategy. The key now is making sure your extra payment is consistent so the plan actually hits the projected timeline."
      );
    } else {
      adviceLines.push(
        "Snowball is solid when you need emotional wins. It's perfectly fine to stay with it if it keeps you actually paying, not just planning."
      );
    }

    // 2) Extra payment guidance
    if (settings.monthly_extra <= 0 && totalDebt > 0) {
      adviceLines.push(
        "Right now you're only paying minimums. Even an extra $25–$50 a month can knock months off your payoff date. Use the What-If calculator to test a number that feels tough but realistic, then commit to it."
      );
    } else if (settings.monthly_extra > 0 && totalDebt > 0) {
      adviceLines.push(
        `You're already committing an extra $${settings.monthly_extra.toFixed(
          0
        )} per month. The next question is: can we lock that in as non-negotiable and then stack more when you get bonuses, tax refunds, or side income?`
      );
    }

    // 3) Goal tie-in
    if (activeGoals.length > 0) {
      adviceLines.push(
        "Since you've set explicit goals, use the Goal Planner as your scoreboard. If the projections slip past your target date, that's your cue to either adjust the goal or raise your extra payment. No shame either way—just honest math."
      );
    } else {
      adviceLines.push(
        "You haven't set any explicit payoff goals yet. I'd like you to pick one: either a target date for being debt-free or a target monthly extra amount. Goals give us something concrete to coach against."
      );
    }

    // Persona flavor
    let personaTag = "";
    if (persona === "marine") {
      personaTag =
        "Coach voice: disciplined, no-excuses, but still on your side.";
      adviceLines.unshift(
        "Bottom line: you don't need perfection. You need discipline and repetition. We'll treat this like a campaign—one target at a time until the field is clear."
      );
    } else if (persona === "accountability") {
      personaTag =
        "Coach voice: direct and structured—to keep you honest, not judged.";
    } else if (persona === "motivational") {
      personaTag =
        "Coach voice: encouraging. You're not behind; you're just earlier in the chapter.";
    } else if (persona === "strategist") {
      personaTag =
        "Coach voice: analytical and calm. We'll let the numbers drive the next steps.";
    } else {
      personaTag =
        "Coach voice: hybrid—part motivator, part strategist, part accountability partner.";
    }

    const replyText =
      `${personaTag}\n\n` +
      `You asked: "${prompt}"\n\n` +
      baseLines.join("\n") +
      `\n\nHere's how I'd think about your next moves:\n\n` +
      adviceLines.join("\n\n");

    const highlights: string[] = [
      `Projected debt-free: ${projection.debt_free_date} (${projection.months} month(s))`,
      `Total debt: $${totalDebt.toFixed(0)}, min payments: $${minTotal.toFixed(
        0
      )}`,
      `Extra payment: $${settings.monthly_extra.toFixed(
        0
      )} using ${settings.strategy}`,
      highestApr > 0 ? `Highest APR ~${highestApr.toFixed(1)}%` : ""
    ].filter(Boolean);

    // Log chat history (user + coach message)
    await supabase.from("coach_chat_messages").insert([
      {
        user_id: userId,
        role: "user",
        content: prompt
      },
      {
        user_id: userId,
        role: "coach",
        content: replyText
      }
    ]);

    const responseBody: CoachReply = {
      reply: replyText,
      persona_used: persona,
      highlights
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (e) {
    console.error("ask-the-coach error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
