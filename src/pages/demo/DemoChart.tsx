import React, { useMemo } from "react";
import DemoShell from "./_DemoShell";
import GlassCard from "@/components/GlassCard";
import NextBack from "@/components/NextBack";
import AIAdvisorBanner from "@/components/AIAdvisorBanner";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { Card } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingDown, Calendar, DollarSign, Sparkles } from "lucide-react";
import { format } from "date-fns";

export default function DemoChart() {
  const { plan, inputs } = useDemoPlan();

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

  const aiMessage = useMemo(() => {
    if (!plan) return "";
    
    const months = plan.totals.monthsToDebtFree;
    const interest = plan.totals.interest;
    
    return `Great job! With your ${inputs.strategy} strategy and $${inputs.extraMonthly}/month extra payment, you'll be debt-free in ${months} months, saving thousands in interest. Consider automating your extra payments for guaranteed success.`;
  }, [plan, inputs]);

  if (!plan) {
    return (
      <DemoShell title="Results" subtitle="Computing your debt freedom plan...">
        <GlassCard>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Analyzing your debts...</p>
          </div>
        </GlassCard>
      </DemoShell>
    );
  }

  return (
    <DemoShell 
      title="Your Debt Freedom Plan" 
      subtitle={`${inputs.strategy.charAt(0).toUpperCase() + inputs.strategy.slice(1)} Strategy Results`}
    >
      <GlassCard>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-medium">Debt Free Date</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {format(new Date(plan.startDateISO).setMonth(new Date(plan.startDateISO).getMonth() + plan.totals.monthsToDebtFree), "MMM d, yyyy")}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {plan.totals.monthsToDebtFree} months from now
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-teal-500/5 border border-teal-500/20">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Total Interest</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                ${Math.round(plan.totals.interest).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Over life of debts
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 mb-2">
                <TrendingDown className="w-5 h-5" />
                <span className="text-sm font-medium">Total Paid</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                ${Math.round(plan.totals.totalPaid).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Principal + Interest
              </div>
            </div>
          </div>

          <div className="pt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-500" />
              Debt Payoff Progress
            </h3>
            <Card className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="hsl(160, 84%, 39%)" 
                    fillOpacity={1} 
                    fill="url(#colorBalance)"
                    name="Remaining Balance"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="pt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Payoff Order</h3>
            <div className="space-y-3">
              {plan.debts
                .filter(debt => debt.payoffDateISO)
                .sort((a, b) => (a.payoffMonthIndex || 0) - (b.payoffMonthIndex || 0))
                .map((debt, idx) => (
                  <div 
                    key={debt.id} 
                    className="p-4 rounded-xl border border-border/50 bg-card/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{debt.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Paid off: {debt.payoffDateISO ? format(new Date(debt.payoffDateISO), "MMM yyyy") : "N/A"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        ${Math.round(debt.totalPaid).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${Math.round(debt.totalInterestPaid).toLocaleString()} interest
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <NextBack back="/demo/plan" nextLabel="Start Over" next="/demo/start" />
      </GlassCard>

      <AIAdvisorBanner visible={true} message={aiMessage} />
    </DemoShell>
  );
}
