import { usePlanLive } from "../../context/PlanContextLive";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, addMonths } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CalendarLive() {
  const { plan } = usePlanLive();
  const navigate = useNavigate();

  if (!plan) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-finityo-textBody">
        No plan found — compute first.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <h1 className="text-3xl font-bold text-finityo-textMain mb-2">Payoff Calendar</h1>
      <p className="text-finityo-textBody mb-6">Month-by-month timeline of balances + interest.</p>

      <div className="space-y-4">
        {plan.months.map((m, idx) => {
          const totalBalance = m.payments.reduce((sum, p) => sum + p.endingBalance, 0);
          const startDate = new Date(plan.startDateISO);
          const monthDate = addMonths(startDate, idx);

          return (
            <Card key={idx} className="p-4 rounded-xl border border-border bg-card">
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
                <summary className="cursor-pointer text-finityo-textBody">Payments detail</summary>
                <ul className="mt-2 space-y-1">
                  {m.payments.map((p) => (
                    <li key={p.debtId} className="text-finityo-textBody">
                      Balance: ${Math.round(p.endingBalance).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </details>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
