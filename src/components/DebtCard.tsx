import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CreditCard, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAPR } from "@/lib/debtPlan";

interface DebtCardProps {
  creditor: string;
  balance: number;
  apr: number;
  minPayment: number;
  dueDay?: number;
  type: string;
  originalBalance?: number;
  className?: string;
}

export function DebtCard({
  creditor,
  balance,
  apr,
  minPayment,
  dueDay,
  type,
  originalBalance = balance * 1.5,
  className
}: DebtCardProps) {
  const progress = ((originalBalance - balance) / originalBalance) * 100;
  
  return (
    <Card className={cn(
      "p-6 bg-gradient-card border-border/50 hover:shadow-vibrant hover:-translate-y-1 transition-all duration-300",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <CreditCard className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{creditor}</h3>
            <p className="text-sm text-muted-foreground capitalize">{type}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">
            ${(balance / 100).toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatAPR(apr)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Payoff Progress</span>
            <span className="font-medium text-foreground">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div>
            <p className="text-sm text-muted-foreground">Min. Payment</p>
            <p className="font-semibold text-foreground">
              ${(minPayment / 100).toLocaleString()}
            </p>
          </div>
          {dueDay && (
            <div>
              <p className="text-sm text-muted-foreground">Due Day</p>
              <p className="font-semibold text-foreground">Day {dueDay}</p>
            </div>
          )}
          <Button size="sm" className="bg-gradient-primary hover:shadow-glow transition-all">
            <TrendingDown className="w-4 h-4 mr-2" />
            Pay Now
          </Button>
        </div>
      </div>
    </Card>
  );
}
