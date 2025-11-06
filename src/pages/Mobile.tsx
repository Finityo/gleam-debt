import React from "react";
import { usePlan } from "@/context/PlanContext";
import { formatAPR } from "@/lib/debtPlan";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CreditCard, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MobileViewPage() {
  const { plan, compute, inputs } = usePlan();
  const navigate = useNavigate();

  // Helper to get debt type from name
  const getDebtType = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("card")) return "Credit Card";
    if (lower.includes("loan")) return "Loan";
    if (lower.includes("medical")) return "Medical Bill";
    return "Credit Card";
  };

  // Helper to calculate payoff progress (0% at start, 100% when paid off)
  const calculateProgress = (debt: typeof plan.debts[0]) => {
    if (!debt.payoffMonthIndex || debt.payoffMonthIndex === null) return 0;
    // Progress based on time elapsed vs total time
    const totalMonths = debt.payoffMonthIndex + 1;
    // For now, show 0% since we're at the start of the plan
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">Active Debts</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Track and manage all your debt accounts in one place
          </p>
          <Button 
            variant="outline" 
            size="lg"
            className="w-full sm:w-auto border-primary/20 hover:bg-primary/5"
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Connect Accounts
          </Button>
        </div>

        {!plan ? (
          <Card className="p-8 text-center">
            <TrendingDown className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No plan computed yet</h2>
            <p className="text-muted-foreground mb-4">
              Create your debt payoff plan to see your active debts
            </p>
            <Button onClick={compute} size="lg">
              Compute Plan
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {plan.debts.filter(d => d.included).map(debt => {
              const inputDebt = inputs.debts.find(d => d.id === debt.id);
              const progress = calculateProgress(debt);
              const dueDay = inputDebt?.dueDay || 15;

              return (
                <Card key={debt.id} className="p-6 bg-card/50 backdrop-blur border-primary/10 hover:border-primary/20 transition-all">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-full bg-primary/10">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold mb-1 text-foreground truncate">
                        {debt.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {getDebtType(debt.name)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        ${debt.originalBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatAPR(debt.apr)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Payoff Progress</span>
                      <span className="text-sm font-semibold text-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="flex items-end justify-between gap-4">
                    <div className="flex gap-6">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Min. Payment</div>
                        <div className="text-lg font-semibold text-foreground">
                          ${debt.minPayment.toFixed(0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Due Day</div>
                        <div className="text-lg font-semibold text-foreground">
                          Day {dueDay}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      className="border-primary/20 hover:bg-primary hover:text-primary-foreground"
                    >
                      <TrendingDown className="mr-2 h-4 w-4" />
                      Pay Now
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
