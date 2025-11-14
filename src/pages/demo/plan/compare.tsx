import { PageShell } from "@/components/PageShell";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { PopIn } from "@/components/Animate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Btn } from "@/components/Btn";
import { computeDebtPlan } from "@/lib/computeDebtPlan";

export default function DemoComparePage() {
  const { inputs } = useDemoPlan();
  const navigate = useNavigate();
  const debts = inputs.debts;
  const settings = { strategy: inputs.strategy, extraMonthly: inputs.extraMonthly, oneTimeExtra: inputs.oneTimeExtra };

  // Compute both approaches fresh
  const snow = computeDebtPlan(debts, { ...settings, strategy: "snowball" });
  const aval = computeDebtPlan(debts, { ...settings, strategy: "avalanche" });

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold text-finityo-textMain mb-2">
          Compare Methods
        </h1>
        <p className="text-finityo-textBody mb-8">
          See which strategy wins for your situation.
        </p>

        <PopIn>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 border border-border bg-card">
              <h2 className="text-xl font-bold text-finityo-textMain mb-2">
                Snowball
              </h2>
              <p className="text-sm text-finityo-textBody mb-2">
                Pay smallest‐balance first.
              </p>
              <div className="text-2xl font-bold text-finityo-textMain">
                {snow.summary.finalMonthIndex + 1} months
              </div>
              <div className="text-sm text-finityo-textBody">
                Interest: ${Math.round(snow.totalInterest).toLocaleString()}
              </div>
            </Card>

            <Card className="p-4 border border-border bg-card">
              <h2 className="text-xl font-bold text-finityo-textMain mb-2">
                Avalanche
              </h2>
              <p className="text-sm text-finityo-textBody mb-2">
                Pay highest APR first.
              </p>
              <div className="text-2xl font-bold text-finityo-textMain">
                {aval.summary.finalMonthIndex + 1} months
              </div>
              <div className="text-sm text-finityo-textBody">
                Interest: ${Math.round(aval.totalInterest).toLocaleString()}
              </div>
            </Card>
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
