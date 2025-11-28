import { useDemoPlan } from "@/context/DemoPlanContext";
import { PageShell } from "@/components/PageShell";
import NextBack from "@/components/NextBack";
import { PopIn } from "@/components/Animate";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ShareButton } from "@/components/ShareButton";

export default function DemoPlan() {
  const nav = useNavigate();
  const { demoDebts, demoPlan } = useDemoPlan();

  const submit = () => {
    nav("/setup/chart");
  };

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Button variant="ghost" onClick={() => nav(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold text-finityo-textMain mb-2">
          Your Plan
        </h1>
        <p className="text-finityo-textBody mb-8">
          Debt payoff plan using snowball strategy
        </p>

        <PopIn>
          <div className="space-y-6">
            <div className="space-y-6 pt-6">
              <Button className="w-full h-14 text-lg" onClick={submit}>
                View Chart
              </Button>

              <NextBack back="/setup/debts" next="/setup/chart" />
            </div>

            {demoPlan && (
              <div className="pt-6 space-y-3">
                <h3 className="text-sm font-semibold text-finityo-textMain">
                  Additional Tools
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={() => nav("/setup/plan/calendar")}
                  >
                    Calendar View
                  </Button>
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={() => nav("/setup/plan/summary")}
                  >
                    Summary
                  </Button>
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={() => nav("/setup/plan/compare")}
                  >
                    Compare Methods
                  </Button>
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={() => nav("/setup/plan/import")}
                  >
                    Import/Export
                  </Button>
                </div>
              </div>
            )}

            {demoPlan && (
              <div className="pt-10 max-w-md mx-auto">
                <ShareButton
                  snapshot={{
                    debts: demoDebts,
                    settings: { strategy: "snowball", extraMonthly: 200, oneTimeExtra: 1000 },
                    plan: demoPlan,
                  }}
                />
              </div>
            )}
          </div>
        </PopIn>
      </div>
    </PageShell>
  );
}
