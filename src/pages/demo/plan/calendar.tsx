import { PageShell } from "@/components/PageShell";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { PopIn } from "@/components/Animate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Btn } from "@/components/Btn";
import { format, addMonths } from "date-fns";

export default function DemoPayoffCalendarPage() {
  const { plan, inputs } = useDemoPlan();
  const navigate = useNavigate();
  const debts = inputs.debts;

  if (!plan) {
    return (
      <PageShell>
        <div className="p-4 pb-24">
          {/* TOP NAV */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 active:scale-[0.99]"
            >
              Back
            </button>
          </div>

          <h1 className="text-3xl font-bold mb-4">Payoff Calendar</h1>
          <p>No plan found — compute first.</p>

          {/* BOTTOM STICKY BAR */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 shadow-2xl border-t border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 active:scale-[0.99]"
            >
              Back
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="p-4 pb-24">
        {/* TOP NAV */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 active:scale-[0.99]"
          >
            Back
          </button>
        </div>

        <div className="max-w-3xl mx-auto">
        
        <h1 className="text-3xl font-bold text-finityo-textMain mb-2">
          Payoff Calendar
        </h1>
        <p className="text-finityo-textBody mb-6">
          Month-by-month timeline of balances + interest.
        </p>

        <PopIn>
          <div className="space-y-4">
            {plan.months.map((m, idx) => {
              const totalBalance = m.payments.reduce(
                (sum, p) => sum + p.endingBalance,
                0
              );
              
              // Calculate the date for this month
              const monthDate = addMonths(new Date(), m.monthIndex);

              return (
                <Card
                  key={idx}
                  className="p-4 rounded-xl border border-border bg-card"
                >
                  <div className="text-finityo-textMain font-semibold">
                    {format(monthDate, "MMM yyyy")}
                  </div>
                  <div className="text-sm text-finityo-textBody">
                    Remaining balance: ${Math.round(totalBalance).toLocaleString()}
                  </div>
                  <div className="text-xs text-finityo-textBody">
                    Outflow: ${Math.round(m.totals.outflow).toLocaleString()}
                  </div>

                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer">
                      Payments detail
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {m.payments.map((p) => {
                        const debt = debts.find(d => d.id === p.debtId);
                        return (
                          <li key={p.debtId} className="text-finityo-textBody">
                            {debt?.name || 'Unknown'}: ${Math.round(p.endingBalance).toLocaleString()}
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                </Card>
              );
            })}
          </div>
        </PopIn>
        </div>

        {/* BOTTOM STICKY BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 shadow-2xl border-t border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 active:scale-[0.99]"
          >
            Back
          </button>
        </div>
      </div>
    </PageShell>
  );
}
