import { useEffect, useMemo, useState } from "react";
import { usePlanLive } from "../context/PlanContextLive";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Lock, Unlock, Calendar, DollarSign, TrendingDown, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Strategy, DebtInput } from "@/lib/debtPlan";
import { toast } from "sonner";

const formatCurrency = (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatAPR = (apr: number) => `${apr.toFixed(2)}%`;

const sortDebtsByStrategy = (debts: DebtInput[], strategy: Strategy): DebtInput[] => {
  const active = debts.filter(d => (d.include ?? true) && d.balance > 0);
  const inactive = debts.filter(d => !(d.include ?? true) || d.balance <= 0);
  
  let sorted: DebtInput[];
  if (strategy === "snowball") {
    sorted = active.sort((a, b) =>
      a.balance !== b.balance ? a.balance - b.balance : b.apr - a.apr
    );
  } else {
    sorted = active.sort((a, b) =>
      a.apr !== b.apr ? b.apr - a.apr : a.balance - b.balance
    );
  }
  
  return [...sorted, ...inactive];
};

export default function DebtPlanLive() {
  const { inputs, setInputs, plan, compute, refreshFromBackend } = usePlanLive();
  const navigate = useNavigate();
  const [advancedMode, setAdvancedMode] = useState(false);

  useEffect(() => {
    refreshFromBackend();
  }, []);

  useEffect(() => {
    if (inputs.debts.length > 0) {
      compute();
    }
  }, [inputs.debts.length]);

  const totalMins = useMemo(
    () => inputs.debts.filter(d => d.include !== false).reduce((a, d) => a + d.minPayment, 0),
    [inputs.debts]
  );

  const sortedDebts = useMemo(
    () => plan ? sortDebtsByStrategy(inputs.debts, inputs.strategy) : inputs.debts,
    [inputs.debts, inputs.strategy, plan]
  );

  const handleCompute = () => {
    if (inputs.debts.length === 0) {
      toast.error("No debts to compute. Please add debts first.");
      return;
    }
    compute();
    toast.success("Plan computed successfully!");
  };

  return (
    <div className="container mx-auto p-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <h1 className="text-3xl font-bold mb-6">Debt Payoff Plan</h1>

      <Card className="p-6 mb-6">
        {/* Advanced Options Toggle */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            {advancedMode ? (
              <Unlock className="h-5 w-5 text-primary" />
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="advanced-mode" className="text-base font-semibold cursor-pointer">
                Advanced Options
              </Label>
              <p className="text-sm text-muted-foreground">
                {advancedMode ? "Customize payment amounts" : "Using default plan settings"}
              </p>
            </div>
          </div>
          <Switch
            id="advanced-mode"
            checked={advancedMode}
            onCheckedChange={setAdvancedMode}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <div className="space-y-2">
            <Label>Strategy</Label>
            <Select
              value={inputs.strategy}
              onValueChange={(v) => {
                setInputs({ strategy: v as Strategy });
                setTimeout(() => compute(), 100);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="snowball">Snowball (smallest balance)</SelectItem>
                <SelectItem value="avalanche">Avalanche (highest APR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Extra Monthly Payment</Label>
            <Input
              type="number"
              placeholder="0"
              value={inputs.extraMonthly || ""}
              onChange={(e) => setInputs({ extraMonthly: parseFloat(e.target.value) || 0 })}
              disabled={!advancedMode}
            />
          </div>

          <div className="space-y-2">
            <Label>One-Time Extra Payment</Label>
            <Input
              type="number"
              placeholder="0"
              value={inputs.oneTimeExtra || ""}
              onChange={(e) => setInputs({ oneTimeExtra: parseFloat(e.target.value) || 0 })}
              disabled={!advancedMode}
            />
          </div>

          <div className="space-y-2">
            <Label className="invisible">Action</Label>
            <Button onClick={handleCompute} className="w-full">
              Compute Plan
            </Button>
          </div>
        </div>

        {!advancedMode && (
          <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
            Enable <strong>Advanced Options</strong> to customize extra payments and optimize your payoff strategy.
          </div>
        )}
      </Card>

      {plan && (
        <>
          {/* Plan Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Payoff Time</Label>
              </div>
              <div className="text-2xl font-bold">
                {plan.totals.monthsToDebtFree} months
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.floor(plan.totals.monthsToDebtFree / 12)} years {plan.totals.monthsToDebtFree % 12} months
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Total Paid</Label>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(plan.totals.totalPaid)}
              </div>
              <div className="text-xs text-muted-foreground">
                {inputs.debts.filter(d => d.include !== false).length} debts
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Total Interest</Label>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(plan.totals.interest)}
              </div>
              <div className="text-xs text-muted-foreground">
                Principal: {formatCurrency(plan.totals.principal)}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Strategy</Label>
              </div>
              <div className="text-2xl font-bold capitalize">
                {inputs.strategy}
              </div>
              <div className="text-xs text-muted-foreground">
                {inputs.strategy === "snowball" ? "Smallest balance first" : "Highest APR first"}
              </div>
            </Card>
          </div>

          {/* Debt List in Payoff Order */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Payoff Order</h2>
            <div className="space-y-3">
              {sortedDebts.filter(d => (d.include ?? true) && d.balance > 0).map((debt, idx) => (
                <div key={debt.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{debt.name}</div>
                      <div className="text-sm text-muted-foreground">
                        APR: {formatAPR(debt.apr)} • Min: {formatCurrency(debt.minPayment)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(debt.balance)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {!plan && inputs.debts.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground mb-4">
            No debts found. Add debts to see your personalized payoff plan.
          </div>
          <Button onClick={() => navigate("/debts")}>
            Go to Debts
          </Button>
        </Card>
      )}
    </div>
  );
}
