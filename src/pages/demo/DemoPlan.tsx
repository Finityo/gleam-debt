import { PageShell } from "@/components/PageShell";
import NextBack from "@/components/NextBack";
import { usePlan } from "@/context/PlanContext";
import { PopIn } from "@/components/Animate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ShareButton } from "@/components/ShareButton";
import CoachDrawer from "@/components/CoachDrawer";

export default function DemoPlan() {
  const { debts, settings, plan, updateSettings, compute } = usePlan();
  const navigate = useNavigate();

  const submit = () => {
    compute();
    navigate("/demo/chart");
  };

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-finityo-textMain mb-2">
          Optimize Your Plan
        </h1>
        <p className="text-finityo-textBody mb-8">
          Add extra payments to accelerate debt freedom
        </p>

        <PopIn>
          <div className="space-y-6">
            {/* Extra monthly */}
            <div>
              <Label className="flex items-center gap-2 text-finityo-textMain">
                <DollarSign className="w-5 h-5" />
                Extra Monthly
              </Label>
              <Input
                type="number"
                value={settings.extraMonthly}
                onChange={(e) =>
                  updateSettings({
                    extraMonthly: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            {/* One-time */}
            <div>
              <Label className="flex items-center gap-2 text-finityo-textMain">
                <Zap className="w-5 h-5" />
                One-Time Extra
              </Label>
              <Input
                type="number"
                value={settings.oneTimeExtra}
                onChange={(e) =>
                  updateSettings({
                    oneTimeExtra: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            {/* Strategy */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateSettings({ strategy: "snowball" })}
                className={`p-4 rounded-xl border transition-all ${
                  settings.strategy === "snowball"
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border"
                }`}
              >
                <div className="font-semibold">Snowball</div>
                <div className="text-xs">Smallest first</div>
              </button>

              <button
                onClick={() => updateSettings({ strategy: "avalanche" })}
                className={`p-4 rounded-xl border transition-all ${
                  settings.strategy === "avalanche"
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border"
                }`}
              >
                <div className="font-semibold">Avalanche</div>
                <div className="text-xs">Highest APR first</div>
              </button>
            </div>

            {/* Bottom actions */}
            <div className="space-y-6 pt-6">
              <Button className="w-full h-14 text-lg" onClick={submit}>
                <Zap className="w-5 h-5 mr-2" />
                Compute My Plan
              </Button>

              <NextBack back="/demo/debts" next="/demo/chart" />
            </div>

            {plan && (
              <div className="pt-10">
                <ShareButton
                  snapshot={{
                    debts,
                    settings,
                    plan,
                  }}
                />
              </div>
            )}

            <CoachDrawer plan={plan} />
          </div>
        </PopIn>
      </div>
    </PageShell>
  );
}
