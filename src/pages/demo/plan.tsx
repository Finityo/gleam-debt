import { PageShell } from "@/components/PageShell";
import NextBack from "@/components/NextBack";
import { usePlan } from "@/context/PlanContext";
import { PopIn } from "@/components/Animate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, Zap, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ShareButton } from "@/components/ShareButton";
import CoachDrawer from "@/components/CoachDrawer";
import { toast } from "sonner";
import { z } from "zod";

// Validation schemas
const extraPaymentSchema = z.number().min(0, "Payment must be positive").max(1000000000, "Amount too large");

export default function DemoPlan() {
  const { debts, settings, plan, updateSettings, compute } = usePlan();
  const navigate = useNavigate();

  // Helper to display number value (empty string if 0)
  const displayValue = (val: number) => val === 0 ? "" : val.toString();

  const submit = () => {
    compute();
    
    // Check if high interest and suggest upgrade
    if (plan && plan.totalInterest > plan.totalPaid * 0.4) {
      toast("You could save money with Ultimate's Avalanche coaching.");
    }
    
    navigate("/setup/chart");
  };

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
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
                placeholder="0"
                value={displayValue(settings.extraMonthly)}
                onChange={(e) => {
                  const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    const validated = extraPaymentSchema.safeParse(val);
                    if (validated.success) {
                      updateSettings({ extraMonthly: val });
                    }
                  }
                }}
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
                placeholder="0"
                value={displayValue(settings.oneTimeExtra)}
                onChange={(e) => {
                  const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    const validated = extraPaymentSchema.safeParse(val);
                    if (validated.success) {
                      updateSettings({ oneTimeExtra: val });
                    }
                  }
                }}
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

              <NextBack back="/setup/debts" next="/setup/chart" />
            </div>

            {/* Additional Tools */}
            {plan && (
              <div className="pt-6 space-y-3">
                <h3 className="text-sm font-semibold text-finityo-textMain">
                  Additional Tools
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={() => navigate("/setup/plan/calendar")}
                  >
                    Calendar View
                  </Button>
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={() => navigate("/setup/plan/summary")}
                  >
                    Summary
                  </Button>
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={() => navigate("/setup/plan/compare")}
                  >
                    Compare Methods
                  </Button>
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={() => navigate("/setup/plan/import")}
                  >
                    Import/Export
                  </Button>
                </div>
              </div>
            )}

            {plan && (
              <div className="pt-10 max-w-md mx-auto">
                <ShareButton
                  snapshot={{
                    debts,
                    settings,
                    plan,
                  }}
                />
              </div>
            )}
          </div>
        </PopIn>

        <CoachDrawer plan={plan} />
      </div>
    </PageShell>
  );
}
