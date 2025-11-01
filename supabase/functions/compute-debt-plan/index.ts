import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const debtSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  balance: z.number().min(0, "Balance must be positive").max(100000000, "Balance is too large"),
  apr: z.number().min(0, "APR must be positive").max(100, "APR must be 100 or less"),
  min_payment: z.number().min(0, "Minimum payment must be positive").max(1000000, "Minimum payment is too large"),
});

const requestSchema = z.object({
  debts: z.array(debtSchema).min(1, "At least one debt is required").max(100, "Too many debts"),
  extra_monthly: z.number().min(0, "Extra monthly must be positive").max(1000000, "Extra monthly is too large").default(0),
  one_time_payment: z.number().min(0, "One-time payment must be positive").max(10000000, "One-time payment is too large").default(0),
});

type Strategy = "snowball" | "avalanche" | "highest_balance";

interface Debt {
  id?: string;
  name: string;
  balance: number;
  apr: number;
  min_payment: number;
}

interface PaymentScheduleItem {
  month: number;
  date: string;
  debts: Array<{
    name: string;
    payment: number;
    remaining_balance: number;
    is_paid_off?: boolean;
  }>;
  total_payment: number;
  total_remaining: number;
}

interface DebtPlanData {
  payoff_months: number;
  total_interest: number;
  monthly_schedule: PaymentScheduleItem[];
  summary: {
    total_debt: number;
    total_minimum_payment: number;
    strategy: string;
    extra_monthly: number;
    one_time_payment: number;
  };
}

function applyPayment(balance: number, apr: number, payment: number) {
  const monthlyRate = apr / 100 / 12;
  const interest = balance * monthlyRate;
  let newBalance = balance + interest - payment;
  if (newBalance < 0) newBalance = 0;
  return { newBalance, interestPaid: interest };
}

function computePlan(
  debts: Debt[],
  strategy: Strategy,
  extraMonthly = 0,
  oneTimePayment = 0
): DebtPlanData {
  const ordered = [...debts].sort((a, b) => {
    if (strategy === "snowball") return a.balance - b.balance;
    if (strategy === "avalanche") return b.apr - a.apr;
    if (strategy === "highest_balance") return b.balance - a.balance;
    return 0;
  });

  const monthlySchedule: PaymentScheduleItem[] = [];
  const totalDebt = ordered.reduce((sum, d) => sum + d.balance, 0);
  const totalMinimumPayment = ordered.reduce((s, d) => s + d.min_payment, 0);

  let month = 0;
  let remainingDebts = [...ordered];
  let totalInterest = 0;
  let rollover = 0;
  let extra = extraMonthly;
  let oneTime = oneTimePayment;

  while (remainingDebts.some(d => d.balance > 0) && month < 600) {
    month++;
    const now = new Date();
    const monthDate = new Date(now.getFullYear(), now.getMonth() + month, 1);
    const monthLabel = monthDate.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    let monthInterest = 0;
    let monthPayment = 0;
    const debtsThisMonth: PaymentScheduleItem["debts"] = [];

    for (let i = 0; i < remainingDebts.length; i++) {
      const debt = remainingDebts[i];
      if (debt.balance <= 0) continue;

      let payment = debt.min_payment;
      if (i === 0) payment += rollover + extra;

      if (month === 1 && i === 0 && oneTime > 0) {
        payment += oneTime;
        oneTime = 0;
      }

      const { newBalance, interestPaid } = applyPayment(
        debt.balance,
        debt.apr,
        payment
      );

      monthInterest += interestPaid;
      monthPayment += payment;
      debt.balance = newBalance;

      debtsThisMonth.push({
        name: debt.name,
        payment,
        remaining_balance: newBalance,
        is_paid_off: newBalance <= 0.01,
      });

      if (newBalance <= 0.01) rollover += debt.min_payment;
    }

    totalInterest += monthInterest;

    const totalRemaining = remainingDebts.reduce(
      (sum, d) => sum + Math.max(d.balance, 0),
      0
    );

    monthlySchedule.push({
      month,
      date: monthLabel,
      debts: debtsThisMonth,
      total_payment: monthPayment,
      total_remaining: totalRemaining,
    });

    if (totalRemaining <= 0.01) break;
  }

  return {
    payoff_months: month,
    total_interest: Number(totalInterest.toFixed(2)),
    monthly_schedule: monthlySchedule,
    summary: {
      total_debt: totalDebt,
      total_minimum_payment: totalMinimumPayment,
      strategy,
      extra_monthly: extraMonthly,
      one_time_payment: oneTimePayment,
    },
  };
}

function validatePlans(snowballPlan: DebtPlanData, avalanchePlan: DebtPlanData) {
  const compare = (a: DebtPlanData, b: DebtPlanData) => ({
    faster: a.payoff_months < b.payoff_months ? a.summary.strategy : b.summary.strategy,
    lessInterest:
      a.total_interest < b.total_interest
        ? a.summary.strategy
        : b.summary.strategy,
  });

  const summary = compare(snowballPlan, avalanchePlan);

  return {
    snowball: {
      payoff_months: snowballPlan.payoff_months,
      total_interest: snowballPlan.total_interest,
    },
    avalanche: {
      payoff_months: avalanchePlan.payoff_months,
      total_interest: avalanchePlan.total_interest,
    },
    comparison: summary,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Verify authentication
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization') || '' },
      },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Please sign in to use this feature.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validated = requestSchema.parse(body);

    console.log(`Computing debt plans for user ${user.id} with ${validated.debts.length} debts`);

    // Compute all three strategies
    const snowballPlan = computePlan(
      validated.debts,
      "snowball",
      validated.extra_monthly,
      validated.one_time_payment
    );
    
    const avalanchePlan = computePlan(
      validated.debts,
      "avalanche",
      validated.extra_monthly,
      validated.one_time_payment
    );
    
    const highestBalancePlan = computePlan(
      validated.debts,
      "highest_balance",
      validated.extra_monthly,
      validated.one_time_payment
    );

    const validation = validatePlans(snowballPlan, avalanchePlan);

    // Use service role key to insert data
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) {
      throw new Error("Missing service role key");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Save all three plans to database
    const { error: insertError } = await supabaseAdmin.from("debt_plans").insert([
      {
        user_id: user.id,
        strategy: "snowball",
        extra_monthly: validated.extra_monthly,
        one_time: validated.one_time_payment,
        plan_data: snowballPlan,
        debt_snapshot: validated.debts,
      },
      {
        user_id: user.id,
        strategy: "avalanche",
        extra_monthly: validated.extra_monthly,
        one_time: validated.one_time_payment,
        plan_data: avalanchePlan,
        debt_snapshot: validated.debts,
      },
      {
        user_id: user.id,
        strategy: "highest_balance",
        extra_monthly: validated.extra_monthly,
        one_time: validated.one_time_payment,
        plan_data: highestBalancePlan,
        debt_snapshot: validated.debts,
      },
    ]);

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log('Successfully computed and saved all debt plans');

    return new Response(
      JSON.stringify({
        snowballPlan,
        avalanchePlan,
        highestBalancePlan,
        validation,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data', 
          details: error.errors 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    console.error("compute-debt-plan error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
