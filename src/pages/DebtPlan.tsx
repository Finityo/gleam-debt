import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDebtEngineFromStore } from "@/engine/useDebtEngineFromStore";

export default function DebtPlan() {
  const navigate = useNavigate();
  const { plan, debtsUsed, settingsUsed, recompute } = useDebtEngineFromStore();

  const months = plan?.months || [];
  const lastMonth = months.length ? months[months.length - 1] : null;

  const totalDebt = plan?.totals?.principal ?? 0;
  const monthlyOutflow = plan?.totals?.outflowMonthly ?? settingsUsed?.extraMonthly ?? 0;
  const monthsToDebtFree = plan?.totals?.monthsToDebtFree ?? months.length;
  const totalInterest = plan?.totals?.interest ?? 0;
  const payoffDateISO = lastMonth?.dateISO ?? null;

  const orderedDebts = useMemo(() => {
    const list = plan?.debts || debtsUsed || [];
    return [...list].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  }, [plan, debtsUsed]);

  return (
    <div className="p-4 pb-24">
      {/* TOP NAV */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 active:scale-[0.99]"
        >
          Back
        </button>
        <button
          onClick={recompute}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.99]"
        >
          Recalculate
        </button>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Your Debt Plan</h1>
        <div className="text-sm text-muted-foreground">
          Strategy: <span className="font-medium text-foreground">{plan?.strategy || settingsUsed?.strategy || "snowball"}</span>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Total Debt</div>
          <div className="text-xl font-semibold mt-1">
            {Number(totalDebt).toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Monthly Snowball</div>
          <div className="text-xl font-semibold mt-1">
            {Number(monthlyOutflow).toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Months to Debt-Free</div>
          <div className="text-xl font-semibold mt-1">{monthsToDebtFree || "—"}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Total Interest</div>
          <div className="text-xl font-semibold mt-1">
            {Number(totalInterest).toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </div>
        </div>
      </div>

      {/* Payoff date */}
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Projected Payoff Date</div>
          <div className="text-lg font-semibold">
            {payoffDateISO ? new Date(payoffDateISO).toLocaleDateString() : "In progress"}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Extra Monthly: {Number(settingsUsed?.extraMonthly || 0).toLocaleString("en-US", { style: "currency", currency: "USD" })}
        </div>
      </div>

      {/* Ordered plan list */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-muted/40 text-sm font-medium">Snowball Order</div>
        {orderedDebts.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">Add debts to generate your plan.</div>
        ) : (
          orderedDebts.map((d: any, i: number) => (
            <div
              key={d.id || `${d.name}-${i}`}
              className={`px-4 py-3 flex items-center justify-between ${i < orderedDebts.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="flex flex-col">
                <div className="font-medium">{i + 1}. {d.creditor || d.name}</div>
                <div className="text-xs text-muted-foreground">
                  APR: {d.apr != null ? Number(d.apr).toFixed(2) + "%" : "—"} • Min: {Number(d.minPayment || d.minimum || 0).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                </div>
              </div>
              <div className="font-semibold">
                {Number(d.balance || d.currentBalance || 0).toLocaleString("en-US", { style: "currency", currency: "USD" })}
              </div>
            </div>
          ))
        )}
      </div>
      </div>

      {/* BOTTOM STICKY BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 shadow-2xl border-t border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 active:scale-[0.99]"
        >
          Back
        </button>
        <button
          onClick={recompute}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.99]"
        >
          Recalculate
        </button>
      </div>
    </div>
  );
}
