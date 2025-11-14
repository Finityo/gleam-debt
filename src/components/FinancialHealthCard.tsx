import { useFinancialHealth } from '@/hooks/useFinancialHealth';
import { StatCard } from '@/components/ui/stat-card';
import { Activity, TrendingUp, CreditCard, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function FinancialHealthCard() {
  const { score, loading, error } = useFinancialHealth();

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (error || !score) {
    return null;
  }

  const scoreColor = score.score >= 700 ? 'text-success' : score.score >= 600 ? 'text-warning' : 'text-destructive';
  const progressPercent = ((score.score - 300) / (850 - 300)) * 100;

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-border/50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Financial Health Score</h3>
            <p className={`text-5xl font-bold ${scoreColor} mt-2`}>{score.score}</p>
            <p className="text-xs text-muted-foreground mt-1">out of 850</p>
          </div>
          <Activity className="w-8 h-8 text-primary" />
        </div>
        <Progress value={progressPercent} className="h-2" />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Total Debt"
          value={`$${score.factors.totalDebt.toLocaleString()}`}
          icon={DollarSign}
          subtitle="Current balance"
        />
        <StatCard
          title="Card Utilization"
          value={`${score.factors.cardUtilization.toFixed(1)}%`}
          icon={CreditCard}
          subtitle="Credit usage"
          trend={score.factors.cardUtilization < 30 ? {
            value: 'Excellent',
            isPositive: true
          } : undefined}
        />
        <StatCard
          title="Extra Payment"
          value={`$${score.factors.extraPayment.toLocaleString()}`}
          icon={TrendingUp}
          subtitle="Monthly extra"
        />
        <StatCard
          title="Progress Bonus"
          value={`+${score.factors.progressBonus}`}
          icon={Activity}
          subtitle="Score boost"
        />
      </div>
    </div>
  );
}
