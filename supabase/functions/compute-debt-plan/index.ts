import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Debt {
  id?: string;
  name: string;
  balance: number;
  apr: number;               // Annual interest rate (e.g. 18.99)
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

/**
 * Compute next month's interest and balance reduction
 */
function applyPayment(
  balance: number,
  apr: number,
  payment: number
): { newBalance: number; interestPaid: number } {
  const monthlyRate = apr / 100 / 12;
  const interest = balance * monthlyRate;
  let newBalance = balance + interest - payment;
  if (newBalance < 0) newBalance = 0;
  return { newBalance, interestPaid: interest };
}

/**
 * Core Debt Snowball computation
 */
function computeSnowball(
  debts: Debt[],
  strategy: "snowball" | "avalanche" | "highest_balance",
  extraMonthly = 0,
  oneTimePayment = 0
): DebtPlanData {
  // Sort debts by chosen strategy
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

      // Determine payment amount
      let payment = debt.min_payment;
      if (i === 0) payment += rollover + extra;

      // Apply one-time lump sum to first debt in first month
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

      // When a debt hits zero, roll its minimum into next month
      if (newBalance <= 0.01) {
        rollover += debt.min_payment;
      }
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

    // Stop if all debts cleared
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

/**
 * HTTP entry point (Deno-compatible)
 */
serve(async (req) => {
  // Handle CORS preflight requests
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { debts, strategy = "snowball", extra_monthly = 0, one_time_payment = 0 } =
      await req.json();

    if (!Array.isArray(debts)) {
      return new Response(
        JSON.stringify({ error: "Missing debts array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Computing debt plan for user ${user.id} with ${debts.length} debts`);

    const planData = computeSnowball(debts, strategy, extra_monthly, one_time_payment);

    // Persist plan record
    const { error } = await supabase.from("debt_plans").insert({
      user_id: user.id,
      strategy,
      extra_monthly,
      one_time: one_time_payment,
      plan_data: planData,
      debt_snapshot: debts,
    });

    if (error) {
      console.error("Error saving debt plan:", error);
      throw error;
    }

    console.log(`Debt plan computed successfully: ${planData.payoff_months} months`);

    return new Response(JSON.stringify(planData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("compute-debt-plan error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
