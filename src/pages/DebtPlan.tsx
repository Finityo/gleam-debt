import React, { useMemo, useState } from "react";
import { usePlan } from "@/context/PlanContext";
import { Strategy, Debt } from "@/lib/computeDebtPlan";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Lock, Unlock } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Helper to format APR
const formatAPR = (apr: number) => `${apr.toFixed(2)}%`;

// Sort debts by strategy (same logic as the engine)
const sortDebtsByStrategy = (debts: Debt[], strategy: Strategy): Debt[] => {
  const active = debts.filter(d => (d.include ?? true) && d.balance > 0);
  const inactive = debts.filter(d => !(d.include ?? true) || d.balance <= 0);
  
  let sorted: Debt[];
  if (strategy === "snowball") {
    // Snowball: smallest balance first, tiebreaker APR desc
    sorted = active.sort((a, b) =>
      a.balance !== b.balance
        ? a.balance - b.balance
        : b.apr - a.apr
    );
  } else {
    // Avalanche: highest APR first, tiebreaker balance asc
    sorted = active.sort((a, b) =>
      a.apr !== b.apr
        ? b.apr - a.apr
        : a.balance - b.balance
    );
  }
  
  // Return sorted active debts followed by inactive ones
  return [...sorted, ...inactive];
};

export default function DebtPlanPage() {
  const { debts, settings, plan, updateSettings, compute, reset } = usePlan();
  const navigate = useNavigate();
  const [advancedMode, setAdvancedMode] = useState(false);
  const [startDate, setStartDate] = useState<string>("");

  const totalMins = useMemo(
    () => debts.filter(d => d.include !== false).reduce((a, d) => a + d.minPayment, 0),
    [debts]
  );

  // Sort debts by strategy after plan is computed
  const sortedDebts = useMemo(
    () => plan ? sortDebtsByStrategy(debts, settings.strategy) : debts,
    [debts, settings.strategy, plan]
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
              value={settings.strategy}
              onValueChange={(v) => {
                updateSettings({ strategy: v as Strategy });
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
                value={settings.extraMonthly}
                disabled={!advancedMode}
                onChange={(e) => {
                  updateSettings({ extraMonthly: Number(e.target.value) });
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
                value={settings.oneTimeExtra}
                disabled={!advancedMode}
                onChange={(e) => {
                  updateSettings({ oneTimeExtra: Number(e.target.value) });
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
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setTimeout(() => compute(), 100);
              }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={compute}>Compute Plan</Button>
          <Button variant="outline" onClick={reset}>Reset Demo</Button>
        </div>
      </Card>

      {/* Full Monthly Schedule */}
      {plan && plan.months.length > 0 && (
        <>
          {/* Month 1 Payment Pool Summary */}
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
                  +${settings.extraMonthly.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">+ One-Time Payment</div>
                <div className="text-2xl font-bold text-accent">
                  +${settings.oneTimeExtra.toFixed(2)}
                </div>
              </div>
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="text-sm text-muted-foreground">= Total Month 1 Pool</div>
                <div className="text-3xl font-bold text-primary">
                  ${(totalMins + settings.extraMonthly + settings.oneTimeExtra).toFixed(2)}
                </div>
              </div>
            </div>
            {plan.months[0] && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground mb-2">Month 1 Results:</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Principal Paid: </span>
                    <span className="font-semibold">${(plan.months[0].totalPaid - plan.months[0].totalInterest).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Interest: </span>
                    <span className="font-semibold">${plan.months[0].totalInterest.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Debts Closed: </span>
                    <span className="font-semibold text-success">
                      {plan.months[0].payments.filter(p => p.balanceEnd <= 0.01 && p.paid > 0).length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* All Months Timeline */}
          <Card className="p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">📅 Complete Payment Schedule</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Showing all {plan.months.length} months until debt-free
            </p>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {plan.months.map((month) => {
                const closedDebts = month.payments.filter(p => p.balanceEnd <= 0.01 && p.paid > 0);
                return (
                  <div 
                    key={month.monthIndex} 
                    className={`p-4 rounded-lg border ${
                      closedDebts.length > 0 
                        ? 'bg-success/10 border-success/30' 
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold">Month {month.monthIndex + 1}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Total Payment</div>
                        <div className="font-bold">${month.totalPaid.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Principal: </span>
                        <span className="font-semibold">${(month.totalPaid - month.totalInterest).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Interest: </span>
                        <span className="font-semibold">${month.totalInterest.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Debts Paid Off: </span>
                        <span className={`font-semibold ${closedDebts.length > 0 ? 'text-success' : ''}`}>
                          {closedDebts.length}
                        </span>
                      </div>
                    </div>
                    {closedDebts.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-success/20">
                        <div className="text-sm font-semibold text-success">
                          🎉 Paid Off: {closedDebts.map(p => {
                            const debt = debts.find(d => d.id === p.debtId);
                            return debt?.name;
                          }).join(", ")}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Plan Summary</h2>
        
        {/* Payment Strategy Display - PROMINENT */}
        <div className="bg-gradient-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold mb-3 text-primary">💰 Your Payment Strategy</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Extra Monthly Payment</div>
              <div className="text-2xl font-bold text-foreground">${settings.extraMonthly}</div>
              <div className="text-xs text-muted-foreground">Applied every month</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">One-Time Payment</div>
              <div className="text-2xl font-bold text-foreground">${settings.oneTimeExtra}</div>
              <div className="text-xs text-muted-foreground">Applied in Month 1</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Strategy</div>
              <div className="text-2xl font-bold text-primary capitalize">{settings.strategy}</div>
              <div className="text-xs text-muted-foreground">
                {settings.strategy === "snowball" ? "Smallest balance first" : "Highest APR first"}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid gap-2">
          <div>
            <strong>Monthly Outflow (mins + extra):</strong> ${(totalMins + settings.extraMonthly).toFixed(2)}
          </div>
          {plan && (
            <>
              <div>
                <strong>Months to Debt-Free:</strong> {plan.summary.finalMonthIndex + 1}
              </div>
              <div>
                <strong>Total Interest:</strong> ${plan.totalInterest.toFixed(2)}
              </div>
              <div>
                <strong>One-time Applied (Month 1):</strong> ${settings.oneTimeExtra.toFixed(2)}
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
            {sortedDebts.map((d, i) => {
              // Calculate totals from plan if available
              const debtPayments = plan?.months.flatMap(m => m.payments.filter(p => p.debtId === d.id)) || [];
              const totalInterest = debtPayments.reduce((sum, p) => sum + p.interest, 0);
              const totalPaid = debtPayments.reduce((sum, p) => sum + p.paid, 0);
              const payoffMonth = plan?.months.find(m => 
                m.payments.some(p => p.debtId === d.id && p.balanceEnd <= 0.01 && p.paid > 0)
              );
              const isActive = (d.include ?? true) && d.balance > 0;
              
              return (
                <tr key={d.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium">
                    {isActive && plan && (
                      <span className="inline-block w-8 text-primary font-bold">#{i + 1}</span>
                    )}
                    {d.name}
                  </td>
                  <td className="text-right p-3">{formatAPR(d.apr)}</td>
                  <td className="text-right p-3">${d.minPayment.toFixed(2)}</td>
                  <td className="text-right p-3">${d.balance.toFixed(2)}</td>
                  <td className="p-3">{payoffMonth ? `Month ${payoffMonth.monthIndex + 1}` : ""}</td>
                  <td className="text-right p-3">${totalInterest.toFixed(2)}</td>
                  <td className="text-right p-3">${totalPaid.toFixed(2)}</td>
                  <td className="text-center p-3">{d.include !== false ? "✅" : "❌"}</td>
                </tr>
              );
            })}
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
