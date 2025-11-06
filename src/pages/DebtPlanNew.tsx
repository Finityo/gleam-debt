import React, { useMemo, useState } from "react";
import { usePlan } from "@/context/PlanContext";
import { PlanService, Strategy, formatAPR } from "@/lib/debtPlan";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Lock, Unlock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DebtPlanPage() {
  const { inputs, setInputs, plan, compute, resetDemo } = usePlan();
  const navigate = useNavigate();
  const [advancedMode, setAdvancedMode] = useState(false);

  const totalMins = useMemo(
    () => inputs.debts.filter(d => d.include !== false).reduce((a, d) => a + d.minPayment, 0),
    [inputs.debts]
  );

  return (
    <div className="container mx-auto p-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <h1 className="text-3xl font-bold mb-6">Debt Plan</h1>

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
                {advancedMode ? "Customize payment amounts" : "Locked to default Finityo plan"}
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
                <SelectItem value="snowball">Snowball (smallest balance first)</SelectItem>
                <SelectItem value="avalanche">Avalanche (highest APR first)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Extra Monthly ($)
              {!advancedMode && <Lock className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                className="pl-7"
                value={inputs.extraMonthly}
                disabled={!advancedMode}
                onChange={(e) => {
                  setInputs({ extraMonthly: Number(e.target.value) });
                  setTimeout(() => compute(), 100);
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Applied every month</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              One-time (Month 1) ($)
              {!advancedMode && <Lock className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                className="pl-7"
                value={inputs.oneTimeExtra}
                disabled={!advancedMode}
                onChange={(e) => {
                  setInputs({ oneTimeExtra: Number(e.target.value) });
                  setTimeout(() => compute(), 100);
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Applied first month only</p>
          </div>

          <div className="space-y-2">
            <Label>Start Date (optional)</Label>
            <Input
              type="date"
              value={inputs.startDate ?? ""}
              onChange={(e) => {
                setInputs({ startDate: e.target.value || undefined });
                setTimeout(() => compute(), 100);
              }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={compute}>Compute Plan</Button>
          <Button variant="outline" onClick={resetDemo}>Reset Demo</Button>
        </div>
      </Card>

      {/* Month 1 Payment Pool Summary */}
      {plan && (
        <Card className="p-6 mb-6 bg-gradient-primary/10 border-primary/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">💰</span> Month 1 Payment Pool Breakdown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">All Minimum Payments</div>
              <div className="text-2xl font-bold text-foreground">
                ${totalMins.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">+ Extra Monthly</div>
              <div className="text-2xl font-bold text-accent">
                +${inputs.extraMonthly.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">+ One-Time Payment</div>
              <div className="text-2xl font-bold text-accent">
                +${inputs.oneTimeExtra.toFixed(2)}
              </div>
            </div>
            <div className="bg-primary/10 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">= Total Month 1 Pool</div>
              <div className="text-3xl font-bold text-primary">
                ${(totalMins + inputs.extraMonthly + inputs.oneTimeExtra).toFixed(2)}
              </div>
            </div>
          </div>
          {plan.months[0] && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground mb-2">Month 1 Results:</div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Principal Paid: </span>
                  <span className="font-semibold">${plan.months[0].totals.principal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Interest: </span>
                  <span className="font-semibold">${plan.months[0].totals.interest.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Debts Closed: </span>
                  <span className="font-semibold text-success">
                    {plan.months[0].payments.filter(p => p.closedThisMonth).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Plan Summary</h2>
        
        {/* Payment Strategy Display - PROMINENT */}
        <div className="bg-gradient-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold mb-3 text-primary">💰 Your Payment Strategy</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Extra Monthly Payment</div>
              <div className="text-2xl font-bold text-foreground">${inputs.extraMonthly}</div>
              <div className="text-xs text-muted-foreground">Applied every month</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">One-Time Payment</div>
              <div className="text-2xl font-bold text-foreground">${inputs.oneTimeExtra}</div>
              <div className="text-xs text-muted-foreground">Applied in Month 1</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Strategy</div>
              <div className="text-2xl font-bold text-primary capitalize">{inputs.strategy}</div>
              <div className="text-xs text-muted-foreground">
                {inputs.strategy === "snowball" ? "Smallest balance first" : "Highest APR first"}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid gap-2">
          <div>
            <strong>Monthly Outflow (mins + extra):</strong> ${(totalMins + inputs.extraMonthly).toFixed(2)}
          </div>
          {plan && (
            <>
              <div>
                <strong>Months to Debt-Free:</strong> {plan.totals.monthsToDebtFree}
              </div>
              <div>
                <strong>Total Interest:</strong> ${plan.totals.interest.toFixed(2)}
              </div>
              <div>
                <strong>One-time Applied (Month 1):</strong> ${plan.totals.oneTimeApplied.toFixed(2)}
              </div>
            </>
          )}
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Creditor</th>
              <th className="text-right p-3">APR %</th>
              <th className="text-right p-3">Min</th>
              <th className="text-right p-3">Start Balance</th>
              <th className="text-left p-3">Payoff Date</th>
              <th className="text-right p-3">Total Interest</th>
              <th className="text-right p-3">Total Paid</th>
              <th className="text-center p-3">Included</th>
            </tr>
          </thead>
          <tbody>
            {(plan
              ? PlanService.debtsSummaryForPrintable(plan)
              : inputs.debts.map(d => ({
                  creditor: d.name,
                  apr: d.apr,
                  minPayment: d.minPayment,
                  startingBalance: d.balance,
                  payoffDate: "",
                  totalInterest: 0,
                  totalPaid: 0,
                  included: d.include !== false,
                }))
            ).map((row, i) => (
              <tr key={i} className="border-b hover:bg-muted/50">
                <td className="p-3">{row.creditor}</td>
                <td className="text-right p-3">{formatAPR(row.apr)}</td>
                <td className="text-right p-3">${row.minPayment.toFixed(2)}</td>
                <td className="text-right p-3">${row.startingBalance.toFixed(2)}</td>
                <td className="p-3">{row.payoffDate ?? ""}</td>
                <td className="text-right p-3">${row.totalInterest.toFixed(2)}</td>
                <td className="text-right p-3">${row.totalPaid.toFixed(2)}</td>
                <td className="text-center p-3">{row.included ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {!plan && (
        <p className="mt-4 text-sm text-muted-foreground">
          Tip: Tap <strong>Compute Plan</strong> to run the math and update all pages.
        </p>
      )}
    </div>
  );
}
