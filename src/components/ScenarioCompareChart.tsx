import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { computeDebtPlan, type PlanResult } from "@/lib/debtPlan";
import { useUnifiedPlan } from "@/engine/useUnifiedPlan";

type Props = { debts?: any[]; settings?: any };

export default function ScenarioCompareChart({ debts, settings }: Props) {
  const { plan: enginePlan, debtsUsed, settingsUsed } = useUnifiedPlan();

  const scenarios = useMemo(() => {
    const activeDebts = debts && debts.length ? debts : debtsUsed;
    const activeSettings = settings || settingsUsed || {};
    if (!activeDebts?.length) return null;

    // Baseline: use computed engine plan (no duplicate compute)
    const currentPlan: PlanResult = enginePlan ?? computeDebtPlan({
      debts: activeDebts,
      extraMonthly: activeSettings.extraMonthly || 0,
      oneTimeExtra: activeSettings.oneTimeExtra || 0,
      strategy: activeSettings.strategy || "snowball",
      startDate: activeSettings.startDate,
      maxMonths: activeSettings.maxMonths,
    });

    // Only allowed additional compute: min-only scenario
    const minOnlyPlan: PlanResult = computeDebtPlan({
      debts: activeDebts,
      extraMonthly: 0,
      oneTimeExtra: 0,
      strategy: activeSettings.strategy || "snowball",
      startDate: activeSettings.startDate,
      maxMonths: activeSettings.maxMonths,
    });

    const monthsA = currentPlan.months || [];
    const monthsB = minOnlyPlan.months || [];
    const maxMonths = Math.max(monthsA.length, monthsB.length);

    const chartData: any[] = [];
    for (let m = 0; m < maxMonths; m++) {
      const a = monthsA[m];
      const b = monthsB[m];

      // Remaining balance per month derived from computed schedules
      const currentRemaining = a?.payments
        ? a.payments.reduce((sum: number, p: any) => sum + (p.balanceEnd ?? p.endingBalance ?? 0), 0)
        : 0;
      const minOnlyRemaining = b?.payments
        ? b.payments.reduce((sum: number, p: any) => sum + (p.balanceEnd ?? p.endingBalance ?? 0), 0)
        : 0;

      chartData.push({ month: m + 1, current: currentRemaining, minOnly: minOnlyRemaining });
    }

    return {
      chartData,
      currentPlan,
      minOnlyPlan,
    };
  }, [debts, settings, enginePlan, debtsUsed, settingsUsed]);

  if (!scenarios) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Add debts to compare scenarios
      </div>
    );
  }

  const { chartData, currentPlan, minOnlyPlan } = scenarios;

  const monthsSaved =
    (minOnlyPlan.totals.monthsToDebtFree ?? minOnlyPlan.months.length ?? 0) -
    (currentPlan.totals.monthsToDebtFree ?? currentPlan.months.length ?? 0);
  const interestSaved =
    (minOnlyPlan.totals.interest ?? 0) -
    (currentPlan.totals.interest ?? 0);

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Scenario Comparison</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-sm font-medium">Current Plan</div>
          <div className="text-xs text-muted-foreground">
            {currentPlan.totals.monthsToDebtFree} months
          </div>
          <div className="text-xs text-muted-foreground">
            {Number(currentPlan.totals.interest).toLocaleString("en-US", { style: "currency", currency: "USD" })} interest
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-sm font-medium">Minimum Only</div>
          <div className="text-xs text-muted-foreground">
            {minOnlyPlan.totals.monthsToDebtFree} months
          </div>
          <div className="text-xs text-muted-foreground">
            {Number(minOnlyPlan.totals.interest).toLocaleString("en-US", { style: "currency", currency: "USD" })} interest
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Months saved: <span className="font-medium text-foreground">{monthsSaved}</span> • Interest saved:{" "}
        <span className="font-medium text-foreground">
          {Number(interestSaved).toLocaleString("en-US", { style: "currency", currency: "USD" })}
        </span>
      </div>

      <div className="h-[320px] w-full rounded-xl border border-border bg-card p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="current" name="Current Plan" stroke="hsl(var(--primary))" dot={false} />
            <Line type="monotone" dataKey="minOnly" name="Minimum Only" stroke="hsl(var(--muted-foreground))" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
