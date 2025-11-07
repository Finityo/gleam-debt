import { PageShell } from "@/components/PageShell";
import { usePlan } from "@/context/PlanContext";
import { PopIn } from "@/components/Animate";
import { Card } from "@/components/ui/card";
import { Btn } from "@/components/Btn";
import { computeDebtPlan } from "@/lib/computeDebtPlan";

export default function DemoComparePage() {
  const { debts, settings } = usePlan();

  // Compute both approaches fresh
  const snow = computeDebtPlan(debts, { ...settings, strategy: "snowball" });
  const aval = computeDebtPlan(debts, { ...settings, strategy: "avalanche" });

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 py-10">
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
