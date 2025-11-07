import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { computeDebtPlan } from "@/lib/computeDebtPlan";

type Props = {
  debts: any[];
  settings: any;
};

export default function ScenarioCompareChart({ debts, settings }: Props) {
  const scenarios = useMemo(() => {
    if (!debts?.length) return null;

    // Current plan
    const currentPlan = computeDebtPlan(debts, {
      extraMonthly: settings.extra_monthly || 0,
      oneTimeExtra: settings.one_time || 0,
      strategy: settings.strategy || "snowball",
    });

    // Minimum-only plan (no extra payments)
    const minOnlyPlan = computeDebtPlan(debts, {
      extraMonthly: 0,
      oneTimeExtra: 0,
      strategy: settings.strategy || "snowball",
    });

    // Build chart data from plan months
    const maxMonths = Math.max(
      currentPlan.months.length,
      minOnlyPlan.months.length
    );

    const chartData = [];
    for (let m = 0; m < maxMonths; m++) {
      const currentMonth = currentPlan.months[m];
      const minOnlyMonth = minOnlyPlan.months[m];
      
      // Calculate remaining balance for each month
      const currentRemaining = currentMonth 
        ? currentMonth.payments.reduce((sum, p) => sum + p.balanceEnd, 0)
        : 0;
      const minOnlyRemaining = minOnlyMonth
        ? minOnlyMonth.payments.reduce((sum, p) => sum + p.balanceEnd, 0)
        : 0;

      chartData.push({
        month: m + 1,
        current: currentRemaining,
        minOnly: minOnlyRemaining,
      });
    }

    return {
      chartData,
      currentPlan,
      minOnlyPlan,
    };
  }, [debts, settings]);

  if (!scenarios) return null;

  const { chartData, currentPlan, minOnlyPlan } = scenarios;
  const monthsSaved = minOnlyPlan.summary.finalMonthIndex - currentPlan.summary.finalMonthIndex;
  const interestSaved = minOnlyPlan.totalInterest - currentPlan.totalInterest;

  return (
    <div className="p-4 border rounded-lg bg-card space-y-4">
      <h2 className="text-lg font-semibold">Scenario Comparison</h2>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Current Plan</div>
          <div className="font-semibold">
            {currentPlan.summary.finalMonthIndex + 1} months
          </div>
          <div className="text-xs text-muted-foreground">
            ${currentPlan.totalInterest.toFixed(2)} interest
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Minimum Only</div>
          <div className="font-semibold">
            {minOnlyPlan.summary.finalMonthIndex + 1} months
          </div>
          <div className="text-xs text-muted-foreground">
            ${minOnlyPlan.totalInterest.toFixed(2)} interest
          </div>
        </div>
      </div>

      {monthsSaved > 0 && (
        <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-sm">
          <div className="font-semibold text-green-900 dark:text-green-100">
            You're saving {monthsSaved} months and ${interestSaved.toFixed(2)} in interest!
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <XAxis 
            dataKey="month" 
            label={{ value: "Month", position: "insideBottom", offset: -5 }}
          />
          <YAxis />
          <Tooltip 
            formatter={(value: any) => `$${value.toFixed(2)}`}
            labelFormatter={(label) => `Month ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="current"
            name="Your Plan"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="minOnly"
            name="Minimum Only"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
