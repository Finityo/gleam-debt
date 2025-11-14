import { PageShell } from "@/components/PageShell";
import { usePlan } from "@/context/PlanContext";
import { PopIn } from "@/components/Animate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Btn } from "@/components/Btn";
import { format, addMonths } from "date-fns";

export default function DemoPayoffCalendarPage() {
  const { plan, debts } = usePlan();
  const navigate = useNavigate();

  if (!plan) {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto px-4 py-12 text-center text-finityo-textBody">
          No plan found — compute first.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
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
                (sum, p) => sum + p.balanceEnd,
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
                    Outflow: ${Math.round(m.totalPaid).toLocaleString()}
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
                            {debt?.name || 'Unknown'}: ${Math.round(p.balanceEnd).toLocaleString()}
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

        <div className="pt-8">
          <Btn variant="outline" onClick={() => history.back()}>
            Back
          </Btn>
        </div>
      </div>
    </PageShell>
  );
}
