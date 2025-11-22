import { PageShell } from "@/components/PageShell";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { PopIn } from "@/components/Animate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Btn } from "@/components/Btn";
import { computeDebtPlan } from "@/lib/debtPlan";

export default function DemoComparePage() {
  const { inputs } = useDemoPlan();
  const navigate = useNavigate();
  const debts = inputs.debts;
  const settings = { strategy: inputs.strategy, extraMonthly: inputs.extraMonthly, oneTimeExtra: inputs.oneTimeExtra };

  // Compute both approaches fresh
  const snow = computeDebtPlan({ debts, ...settings, strategy: "snowball" });
  const aval = computeDebtPlan({ debts, ...settings, strategy: "avalanche" });

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

        <div className="max-w-4xl mx-auto">
        
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
                {snow.totals.monthsToDebtFree ?? snow.months.length} months
              </div>
              <div className="text-sm text-finityo-textBody">
                Interest: ${Math.round(snow.totals.interest).toLocaleString()}
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
                {aval.totals.monthsToDebtFree ?? aval.months.length} months
              </div>
              <div className="text-sm text-finityo-textBody">
                Interest: ${Math.round(aval.totals.interest).toLocaleString()}
              </div>
            </Card>
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
