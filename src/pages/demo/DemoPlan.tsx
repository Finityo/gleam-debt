import React from "react";
import { PageShell } from "@/components/PageShell";
import NextBack from "@/components/NextBack";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { PopIn } from "@/components/Animate";
import AIChatDrawer from "@/components/AIChatDrawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DemoPlan() {
  const { inputs, setInputs, compute, plan } = useDemoPlan();
  const navigate = useNavigate();

  const handleCompute = () => {
    compute();
    navigate("/demo/chart");
  };

  return (
    <>
      <PageShell>
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-finityo-textMain mb-2">Optimize Your Plan</h1>
          <p className="text-finityo-textBody mb-8">Add extra payments to accelerate debt freedom</p>

          <PopIn>
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium text-finityo-textMain mb-2 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Extra Monthly Payment
                  </Label>
                  <p className="text-sm text-finityo-textBody mb-3">
                    Add any extra amount you can pay each month beyond minimum payments
                  </p>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="number"
                      value={inputs.extraMonthly}
                      onChange={(e) => setInputs({ extraMonthly: parseFloat(e.target.value) || 0 })}
                      className="pl-10 text-lg h-12"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium text-finityo-textMain mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    One-Time Extra Payment
                  </Label>
                  <p className="text-sm text-finityo-textBody mb-3">
                    Add a bonus, tax refund, or windfall to apply immediately
                  </p>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="number"
                      value={inputs.oneTimeExtra}
                      onChange={(e) => setInputs({ oneTimeExtra: parseFloat(e.target.value) || 0 })}
                      className="pl-10 text-lg h-12"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <div>
                  <Label className="text-base font-medium text-finityo-textMain mb-3">Strategy</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setInputs({ strategy: "snowball" as any })}
                      className={`p-4 rounded-xl border transition-all ${
                        inputs.strategy === "snowball"
                          ? "bg-primary/10 border-primary text-finityo-textMain"
                          : "bg-card border-border text-finityo-textBody hover:bg-accent"
                      }`}
                    >
                      <div className="font-semibold mb-1">Snowball</div>
                      <div className="text-xs">Pay smallest balance first</div>
                    </button>
                    <button
                      onClick={() => setInputs({ strategy: "avalanche" as any })}
                      className={`p-4 rounded-xl border transition-all ${
                        inputs.strategy === "avalanche"
                          ? "bg-primary/10 border-primary text-finityo-textMain"
                          : "bg-card border-border text-finityo-textBody hover:bg-accent"
                      }`}
                    >
                      <div className="font-semibold mb-1">Avalanche</div>
                      <div className="text-xs">Pay highest APR first</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <div className="p-4 rounded-xl bg-card border">
                  <Label className="text-sm font-medium">Total Monthly Payment</Label>
                  <div className="text-3xl font-bold text-finityo-textMain mt-1">
                    ${(inputs.debts.reduce((sum, d) => sum + d.minPayment, 0) + inputs.extraMonthly).toLocaleString()}
                  </div>
                  <p className="text-xs text-finityo-textBody mt-1">
                    Minimum payments + extra = faster freedom
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  onClick={handleCompute}
                  className="w-full h-14 text-lg"
                  variant="default"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Compute My Debt Freedom Plan
                </Button>
                <p className="text-xs text-center text-finityo-textBody mt-3">
                  Our engine will calculate both snowball and avalanche strategies
                </p>
              </div>

              <NextBack back="/demo/debts" next="/demo/chart" nextDisabled={!plan} />
            </div>
          </PopIn>
        </div>
      </PageShell>

      <AIChatDrawer plan={plan} />
    </>
  );
}
