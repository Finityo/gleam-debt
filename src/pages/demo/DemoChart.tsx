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
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p className="text-white/80">Analyzing your debts...</p>
        </div>
      </DemoShell>
    );
  }

  return (
    <DemoShell 
      title="Your Debt Freedom Plan" 
      subtitle={`${inputs.strategy.charAt(0).toUpperCase() + inputs.strategy.slice(1)} Strategy Results`}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-xl bg-white/10 border border-white/30 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-emerald-300 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium text-white">Debt Free Date</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {format(new Date(plan.startDateISO).setMonth(new Date(plan.startDateISO).getMonth() + plan.totals.monthsToDebtFree), "MMM d, yyyy")}
            </div>
            <div className="text-xs text-white/70 mt-1">
              {plan.totals.monthsToDebtFree} months from now
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/10 border border-white/30 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-cyan-300 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm font-medium text-white">Total Interest</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${Math.round(plan.totals.interest).toLocaleString()}
            </div>
            <div className="text-xs text-white/70 mt-1">
              Over life of debts
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/10 border border-white/30 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-teal-300 mb-2">
              <TrendingDown className="w-5 h-5" />
              <span className="text-sm font-medium text-white">Total Paid</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${Math.round(plan.totals.totalPaid).toLocaleString()}
            </div>
            <div className="text-xs text-white/70 mt-1">
              Principal + Interest
            </div>
          </div>
        </div>

        <div className="pt-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-emerald-300" />
            Debt Payoff Progress
          </h3>
          <Card className="p-6 bg-white/10 border-white/30 backdrop-blur-sm">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(255, 255, 255, 0.8)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="rgba(255, 255, 255, 0.2)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                <XAxis 
                  dataKey="month" 
                  stroke="rgba(255,255,255,0.6)"
                  tick={{ fill: 'rgba(255,255,255,0.8)' }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.6)"
                  tick={{ fill: 'rgba(255,255,255,0.8)' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#000'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                />
                <Legend wrapperStyle={{ color: 'white' }} />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="rgba(255, 255, 255, 0.9)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorBalance)"
                  name="Remaining Balance"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Payoff Order</h3>
          <div className="space-y-3">
            {plan.debts
              .filter(debt => debt.payoffDateISO)
              .sort((a, b) => (a.payoffMonthIndex || 0) - (b.payoffMonthIndex || 0))
              .map((debt, idx) => (
                <div 
                  key={debt.id} 
                  className="p-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 border border-white/30 text-white text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-white">{debt.name}</div>
                      <div className="text-sm text-white/70">
                        Paid off: {debt.payoffDateISO ? format(new Date(debt.payoffDateISO), "MMM yyyy") : "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      ${Math.round(debt.totalPaid).toLocaleString()}
                    </div>
                    <div className="text-xs text-white/70">
                      ${Math.round(debt.totalInterestPaid).toLocaleString()} interest
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <NextBack back="/demo/plan" nextLabel="Start Over" next="/demo/start" />

      <AIAdvisorBanner visible={true} message={aiMessage} />
    </DemoShell>
  );
}
