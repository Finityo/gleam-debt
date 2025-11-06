import React from "react";
import DemoShell from "./_DemoShell";
import GlassCard from "@/components/GlassCard";
import NextBack from "@/components/NextBack";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DemoPlan() {
  const { inputs, setInputs, compute } = useDemoPlan();
  const navigate = useNavigate();

  const handleCompute = () => {
    compute();
    navigate("/demo/chart");
  };

  return (
    <DemoShell 
      title="Optimize Your Plan" 
      subtitle="Add extra payments to accelerate debt freedom"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium text-white mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-300" />
              Extra Monthly Payment
            </Label>
            <p className="text-sm text-white/70 mb-3">
              Add any extra amount you can pay each month beyond minimum payments
            </p>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-5 h-5 text-white/60" />
              <Input
                type="number"
                value={inputs.extraMonthly}
                onChange={(e) => setInputs({ extraMonthly: parseFloat(e.target.value) || 0 })}
                className="pl-10 text-lg h-12 bg-white/10 border-white/30 text-white placeholder:text-white/40"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label className="text-base font-medium text-white mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-300" />
              One-Time Extra Payment
            </Label>
            <p className="text-sm text-white/70 mb-3">
              Add a bonus, tax refund, or windfall to apply immediately
            </p>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-5 h-5 text-white/60" />
              <Input
                type="number"
                value={inputs.oneTimeExtra}
                onChange={(e) => setInputs({ oneTimeExtra: parseFloat(e.target.value) || 0 })}
                className="pl-10 text-lg h-12 bg-white/10 border-white/30 text-white placeholder:text-white/40"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/20">
          <div className="p-4 rounded-xl bg-white/10 border border-white/30 backdrop-blur-sm">
            <Label className="text-sm font-medium text-white">Total Monthly Payment</Label>
            <div className="text-3xl font-bold text-white mt-1">
              ${(inputs.debts.reduce((sum, d) => sum + d.minPayment, 0) + inputs.extraMonthly).toLocaleString()}
            </div>
            <p className="text-xs text-white/70 mt-1">
              Minimum payments + extra = faster freedom
            </p>
          </div>
        </div>

        <div className="pt-6">
          <Button
            onClick={handleCompute}
            className="w-full h-14 text-lg bg-white/20 text-white border border-white/30 hover:bg-white/30 backdrop-blur-sm"
          >
            <Zap className="w-5 h-5 mr-2" />
            Compute My Debt Freedom Plan
          </Button>
          <p className="text-xs text-center text-white/70 mt-3">
            Our engine will calculate both snowball and avalanche strategies
          </p>
        </div>
      </div>

      <NextBack back="/demo/debts" />
    </DemoShell>
  );
}
