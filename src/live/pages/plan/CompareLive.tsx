import { usePlanLive } from "../../context/PlanContextLive";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PlanService } from "@/lib/debtPlan";

export default function CompareLive() {
  const { inputs } = usePlanLive();
  const navigate = useNavigate();

  // Compute both approaches fresh
  const snow = PlanService.compute({ ...inputs, strategy: "snowball" });
  const aval = PlanService.compute({ ...inputs, strategy: "avalanche" });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <h1 className="text-3xl font-bold text-finityo-textMain mb-2">Compare Methods</h1>
      <p className="text-finityo-textBody mb-8">See which strategy wins for your situation.</p>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 border border-border bg-card">
          <h2 className="text-xl font-bold text-finityo-textMain mb-2">Snowball</h2>
          <p className="text-sm text-finityo-textBody mb-2">Pay smallest‐balance first.</p>
          <div className="text-2xl font-bold text-finityo-textMain">
            {snow.totals.monthsToDebtFree} months
          </div>
          <div className="text-sm text-finityo-textBody">
            Interest: ${Math.round(snow.totals.interest).toLocaleString()}
          </div>
        </Card>

        <Card className="p-4 border border-border bg-card">
          <h2 className="text-xl font-bold text-finityo-textMain mb-2">Avalanche</h2>
          <p className="text-sm text-finityo-textBody mb-2">Pay highest APR first.</p>
          <div className="text-2xl font-bold text-finityo-textMain">
            {aval.totals.monthsToDebtFree} months
          </div>
          <div className="text-sm text-finityo-textBody">
            Interest: ${Math.round(aval.totals.interest).toLocaleString()}
          </div>
        </Card>
      </div>
    </div>
  );
}
