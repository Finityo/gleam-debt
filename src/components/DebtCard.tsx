import React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CreditCard, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAPR } from "@/lib/debtPlan";

// Old API for backwards compatibility (Index.tsx)
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

// New Finityo-styled component (default export for demo pages)
export default function FinityoDebtCard({
  name,
  type = "Credit Card",
  balance,
  apr,
  minPayment,
  dueDay,
  progressPct,
  onPayNow,
}: {
  name: string;
  type?: string;
  balance: number;
  apr: number;
  minPayment: number;
  dueDay?: number;
  progressPct: number; // 0..100
  onPayNow?: () => void;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(progressPct || 0)));
  return (
    <div className="fin-card rounded-3xl p-5 md:p-6 fin-glow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/10 grid place-items-center">
            <div className="h-5 w-7 rounded-md bg-white/20" />
          </div>
          <div>
            <div className="text-white font-semibold text-lg">{name}</div>
            <div className="text-white/70 text-sm">{type}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white text-2xl font-extrabold">${balance.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
          <div className="text-white/60 text-xs">{apr.toFixed(2)}% APR</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-white/70 text-sm mb-1">
          <span>Payoff Progress</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div className="h-2 fin-bar" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="grid grid-cols-2 gap-6 text-white">
          <div>
            <div className="text-white/60 text-xs">Min. Payment</div>
            <div className="text-lg font-semibold">${minPayment.toFixed(2)}</div>
          </div>
        {typeof dueDay === "number" && (
          <div>
            <div className="text-white/60 text-xs">Due Day</div>
            <div className="text-lg font-semibold">Day {dueDay}</div>
          </div>
        )}
        </div>
        {onPayNow && (
          <button
            onClick={onPayNow}
            className="px-4 py-2 rounded-2xl text-white bg-white/10 hover:bg-white/15 border border-white/15 transition"
          >
            ↯ Pay Now
          </button>
        )}
      </div>
    </div>
  );
}
