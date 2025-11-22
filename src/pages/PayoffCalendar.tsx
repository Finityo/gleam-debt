import React, { useMemo } from "react";
import { useDebtEngineFromStore } from "@/engine/useDebtEngineFromStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PayoffCalendarPage() {
  const navigate = useNavigate();
  const { plan, debtsUsed, recompute } = useDebtEngineFromStore();

  if (!plan) {
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

        <h1 className="text-3xl font-bold mb-4">Payoff Calendar</h1>
        <p>No plan computed yet.</p>

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

  // Generate calendar data from plan
  const cal = useMemo(() => {
    return plan.months.map(month => {
      const closedDebts = month.payments.filter(p => p.endingBalance <= 0.01 && p.totalPaid > 0);
      const payoffs = closedDebts.map(p => {
        const debt = debtsUsed.find(d => d.id === p.debtId);
        return { name: debt?.name || "Unknown" };
      });
      
      return {
        monthIndex: month.monthIndex,
        monthLabel: `Month ${month.monthIndex + 1}`,
        totalOutflow: month.totals.outflow,
        totalInterest: month.totals.interest,
        totalPrincipal: month.totals.outflow - month.totals.interest,
        payoffs,
      };
    });
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

      <div className="container mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Payoff Calendar</h1>
      <Card className="overflow-x-auto glass-intense border-border/40">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-primary/30 glass">
              <th className="text-left p-3 text-foreground">Month</th>
              <th className="text-right p-3 text-foreground">Outflow</th>
              <th className="text-right p-3 text-foreground">Interest</th>
              <th className="text-right p-3 text-foreground">Principal</th>
              <th className="text-left p-3 text-foreground">Payoffs</th>
            </tr>
          </thead>
          <tbody>
            {cal.map(m => (
              <tr key={m.monthIndex} className="border-b border-border/20 hover:glass transition-colors">
                <td className="p-3 text-foreground">{m.monthLabel}</td>
                <td className="text-right p-3 text-foreground">${m.totalOutflow.toFixed(2)}</td>
                <td className="text-right p-3 text-muted-foreground">${m.totalInterest.toFixed(2)}</td>
                <td className="text-right p-3 text-foreground">${m.totalPrincipal.toFixed(2)}</td>
                <td className="p-3 text-foreground">{m.payoffs.map(p => p.name).join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
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
