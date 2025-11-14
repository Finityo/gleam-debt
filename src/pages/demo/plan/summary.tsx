import { PageShell } from "@/components/PageShell";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { PopIn } from "@/components/Animate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Btn } from "@/components/Btn";

export default function DemoSummaryPage() {
  const { plan } = useDemoPlan();
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
          Summary
        </h1>
        <p className="text-finityo-textBody mb-8">
          Key payoff metrics + dates.
        </p>

        <PopIn>
          <Card className="p-6 space-y-4 bg-card border border-border">
            <div>
              <div className="text-sm text-finityo-textBody">Debt-Free Date</div>
              <div className="text-2xl font-bold text-finityo-textMain">
                {plan.startDateISO && plan.months.length > 0 
                  ? new Date(new Date(plan.startDateISO).setMonth(new Date(plan.startDateISO).getMonth() + plan.months.length - 1)).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-finityo-textBody">Months to Freedom</div>
              <div className="text-2xl font-bold text-finityo-textMain">
                {plan.totals.monthsToDebtFree}
              </div>
            </div>
            <div>
              <div className="text-sm text-finityo-textBody">Total Interest</div>
              <div className="text-2xl font-bold text-finityo-textMain">
                ${Math.round(plan.totals.interest).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-finityo-textBody">Total Paid</div>
              <div className="text-2xl font-bold text-finityo-textMain">
                ${Math.round(plan.totals.totalPaid).toLocaleString()}
              </div>
            </div>
          </Card>
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
