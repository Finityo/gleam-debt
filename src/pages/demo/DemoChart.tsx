import React, { useMemo, useState, useEffect } from "react";
import { PageShell } from "@/components/PageShell";
import NextBack from "@/components/NextBack";
import AIChatDrawer from "@/components/AIChatDrawer";
import DebtCard from "@/components/DebtCard";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { PopIn } from "@/components/Animate";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingDown, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function DemoChart() {
  const { plan, inputs } = useDemoPlan();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => {
    if (!plan) return [];
    
    let cumulativePaid = 0;
    return plan.months.map((month) => {
      const totalBalance = month.payments.reduce((sum, p) => sum + p.endingBalance, 0);
      cumulativePaid += month.totals.outflow;
      return {
        month: format(new Date(month.dateISO), "MMM yy"),
        balance: Math.round(totalBalance),
        paid: Math.round(cumulativePaid),
      };
    });
  }, [plan]);

  const progressPercent = useMemo(() => {
    if (!plan || plan.months.length === 0) return 0;
    const totalMonths = plan.totals.monthsToDebtFree || plan.months.length;
    return Math.round((1 / totalMonths) * 100);
  }, [plan]);

  if (!plan) {
    return (
      <PageShell>
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-finityo-textMain mb-8">Results</h1>
          <PopIn>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-finityo-textBody">Analyzing your debts...</p>
            </div>
          </PopIn>
        </div>
      </PageShell>
    );
  }

  return (
    <>
      <PageShell>
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-finityo-textMain mb-2">Your Debt Freedom Plan</h1>
          <p className="text-finityo-textBody mb-8">{`${inputs.strategy.charAt(0).toUpperCase() + inputs.strategy.slice(1)} Strategy Results`}</p>
        
          <PopIn>
            <div className="space-y-6">
              <div className="rounded-2xl bg-card border p-4 mb-6">
                <div className="text-finityo-textBody text-xs mb-2">Your Progress (Month 1 Snapshot)</div>
                <Progress value={progressPercent} className="h-3 mb-2" />
                <div className="text-sm text-finityo-textMain">{progressPercent}% of your journey visualized</div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-xl bg-card border">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-medium">Debt Free Date</span>
                  </div>
                  <div className="text-2xl font-bold text-finityo-textMain">
                    {format(new Date(plan.startDateISO).setMonth(new Date(plan.startDateISO).getMonth() + plan.totals.monthsToDebtFree), "MMM d, yyyy")}
                  </div>
                  <div className="text-xs text-finityo-textBody mt-1">
                    {plan.totals.monthsToDebtFree} months from now
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card border">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm font-medium">Total Interest</span>
                  </div>
                  <div className="text-2xl font-bold text-finityo-textMain">
                    ${Math.round(plan.totals.interest).toLocaleString()}
                  </div>
                  <div className="text-xs text-finityo-textBody mt-1">
                    Over life of debts
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card border">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-sm font-medium">Total Paid</span>
                  </div>
                  <div className="text-2xl font-bold text-finityo-textMain">
                    ${Math.round(plan.totals.totalPaid).toLocaleString()}
                  </div>
                  <div className="text-xs text-finityo-textBody mt-1">
                    Principal + Interest
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <h3 className="text-lg font-semibold text-finityo-textMain mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-primary" />
                  Debt Payoff Progress
                </h3>
                {mounted && chartData.length > 0 ? (
                  <Card className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis 
                          dataKey="month" 
                          className="fill-finityo-textBody"
                        />
                        <YAxis 
                          className="fill-finityo-textBody"
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorBalance)"
                          name="Remaining Balance"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>
                ) : (
                  <Card className="p-6">
                    <p className="text-finityo-textBody text-center">Loading chart...</p>
                  </Card>
                )}
              </div>

              <div className="pt-6">
                <h3 className="text-lg font-semibold text-finityo-textMain mb-4">Payoff Order</h3>
                <div className="space-y-4">
                  {plan.debts
                    .filter(debt => debt.payoffDateISO)
                    .sort((a, b) => (a.payoffMonthIndex || 0) - (b.payoffMonthIndex || 0))
                    .map((debt, idx) => {
                      const totalMonths = plan.totals.monthsToDebtFree;
                      const payoffMonth = debt.payoffMonthIndex || 0;
                      const progressPct = totalMonths > 0 ? ((totalMonths - payoffMonth) / totalMonths) * 100 : 0;
                      
                      return (
                        <div key={debt.id}>
                          <div className="flex items-center gap-2 mb-2 px-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 border border-primary text-finityo-textMain text-xs font-bold">
                              {idx + 1}
                            </div>
                            <div className="text-sm text-finityo-textBody">
                              Paid off: {debt.payoffDateISO ? format(new Date(debt.payoffDateISO), "MMM yyyy") : "N/A"}
                            </div>
                          </div>
                          <DebtCard
                            name={debt.name}
                            type="Credit Card"
                            balance={debt.originalBalance}
                            apr={debt.apr}
                            minPayment={debt.minPayment}
                            progressPct={progressPct}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>

              <NextBack back="/demo/plan" nextLabel="Start Over" next="/demo/start" />
            </div>
          </PopIn>
        </div>
      </PageShell>

      <AIChatDrawer plan={plan} />
    </>
  );
}
