import { useMilestones } from '@/hooks/useMilestones';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Zap, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';

const milestoneIcons: Record<string, any> = {
  first_debt_paid: Trophy,
  twenty_five_percent: Target,
  fifty_percent: Zap,
  seventy_five_percent: CheckCircle2,
  debt_free: Trophy,
};

const milestoneLabels: Record<string, string> = {
  first_debt_paid: 'First Debt Paid Off',
  twenty_five_percent: '25% Debt Eliminated',
  fifty_percent: 'Halfway There!',
  seventy_five_percent: '75% Complete',
  debt_free: 'Debt Free!',
};

export function MilestonesCard() {
  const { milestones, progress, loading, error } = useMilestones();

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return null;
  }

  return (
    <div className="space-y-4">
      {progress && (
        <Card className="p-6 bg-gradient-card border-border/50">
          <h3 className="text-lg font-semibold mb-4">Your Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Debt Paid Off</span>
                <span className="font-semibold">{progress.percentPaid.toFixed(1)}%</span>
              </div>
              <Progress value={progress.percentPaid} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Paid Off</p>
                <p className="text-2xl font-bold text-success">${progress.paidOff.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold">${progress.remaining.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Milestones Achieved
        </h3>
        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keep making payments to unlock milestones! 🎯
          </p>
        ) : (
          <div className="space-y-3">
            {milestones.map((milestone) => {
              const Icon = milestoneIcons[milestone.milestone_type] || Trophy;
              const label = milestoneLabels[milestone.milestone_type] || milestone.milestone_type;
              
              return (
                <div
                  key={milestone.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(milestone.date_reached), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant="secondary">✓</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
