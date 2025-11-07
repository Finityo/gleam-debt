import { usePlanLive } from "../../context/PlanContextLive";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, addMonths } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SummaryLive() {
  const { plan } = usePlanLive();
  const navigate = useNavigate();

  if (!plan) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-finityo-textBody">
        No plan found — compute first.
      </div>
    );
  }

  const dfDate = format(
    addMonths(new Date(plan.startDateISO), plan.totals.monthsToDebtFree),
    "MMM d, yyyy"
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <h1 className="text-3xl font-bold text-finityo-textMain mb-2">Summary</h1>
      <p className="text-finityo-textBody mb-8">Key payoff metrics + dates.</p>

      <Card className="p-6 space-y-4 bg-card border border-border">
        <div>
          <div className="text-sm text-finityo-textBody">Debt-Free Date</div>
          <div className="text-2xl font-bold text-finityo-textMain">{dfDate}</div>
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
    </div>
  );
}
