import { useSpendingInsights } from '@/hooks/useSpendingInsights';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, AlertCircle, Info, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const severityConfig = {
  info: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Info },
  warning: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: AlertCircle },
  error: { color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: AlertCircle },
};

export function SpendingInsightsCard() {
  const { insights, loading, error } = useSpendingInsights();

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !insights) {
    return null;
  }

  const { totals, anomalies } = insights;

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">This Month's Spending</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Minimum Payments</p>
            <p className="text-2xl font-bold">${totals.minimumPayments.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Extra Payments</p>
            <p className="text-2xl font-bold text-success">${totals.extraPayments.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Interest Accrued</p>
            <p className="text-2xl font-bold text-warning">${totals.monthlyInterest.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Debt Payments</p>
            <p className="text-2xl font-bold">${totals.totalDebtPayments.toFixed(2)}</p>
          </div>
        </div>

        {totals.oneTimePayments > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                One-time payment: ${totals.oneTimePayments.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </Card>

      {anomalies.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Insights & Suggestions</h3>
          <div className="space-y-3">
            {anomalies.map((anomaly, index) => {
              const config = severityConfig[anomaly.severity];
              const Icon = config.icon;

              return (
                <Alert key={index} className={config.color}>
                  <Icon className="h-4 w-4" />
                  <AlertDescription className="ml-2">
                    <p className="font-medium mb-1">{anomaly.message}</p>
                    <p className="text-sm opacity-80">{anomaly.suggestion}</p>
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
