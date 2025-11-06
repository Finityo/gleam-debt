import React, { useMemo } from "react";
import { usePlan } from "@/context/PlanContext";
import { PlanService, Strategy, formatAPR } from "@/lib/debtPlan";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DebtPlanPage() {
  const { inputs, setInputs, plan, compute, resetDemo } = usePlan();
  const navigate = useNavigate();

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <div className="space-y-2">
            <Label>Strategy</Label>
            <Select
              value={inputs.strategy}
              onValueChange={(v) => setInputs({ strategy: v as Strategy })}
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
            <Label>Extra Monthly ($)</Label>
            <Input
              type="number"
              value={inputs.extraMonthly}
              onChange={(e) => setInputs({ extraMonthly: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label>One-time (Month 1) ($)</Label>
            <Input
              type="number"
              value={inputs.oneTimeExtra}
              onChange={(e) => setInputs({ oneTimeExtra: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label>Start Date (optional)</Label>
            <Input
              type="date"
              value={inputs.startDate ?? ""}
              onChange={(e) => setInputs({ startDate: e.target.value || undefined })}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={compute}>Compute Plan</Button>
          <Button variant="outline" onClick={resetDemo}>Reset Demo</Button>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Plan Summary</h2>
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
