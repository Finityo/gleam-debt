import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Calculator, TrendingDown } from "lucide-react";

export function InteractiveCalculator() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<string>("5000");
  const [apr, setApr] = useState<string>("18");
  const [minPayment, setMinPayment] = useState<string>("150");
  const [strategy, setStrategy] = useState<string>("snowball");

  // Simplified calculation
  const calculatePayoff = () => {
    const b = parseFloat(balance) || 0;
    const r = (parseFloat(apr) || 0) / 100 / 12;
    const m = parseFloat(minPayment) || 0;

    if (b <= 0 || m <= 0 || r < 0) {
      return { months: 0, totalInterest: 0, savings: 0 };
    }

    // Basic formula: months = -log(1 - (b * r) / m) / log(1 + r)
    const months = Math.ceil(-Math.log(1 - (b * r) / m) / Math.log(1 + r));
    const totalPaid = months * m;
    const totalInterest = totalPaid - b;

    // Estimate savings based on strategy
    const strategySavingsPercent = strategy === "avalanche" ? 0.15 : strategy === "hybrid" ? 0.20 : 0.05;
    const savings = totalInterest * strategySavingsPercent;

    return {
      months: isFinite(months) ? Math.max(1, months) : 0,
      totalInterest: Math.max(0, totalInterest),
      savings: Math.max(0, savings)
    };
  };

  const result = calculatePayoff();
  const progress = Math.min(100, (parseFloat(balance) / 10000) * 100);

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Calculator className="w-4 h-4" />
            <span className="text-sm font-medium">Try It Now</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            See Your Debt-Free Date
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get an instant estimate of when you'll be debt-free and how much you can save.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Input Form */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="balance">Total Debt Balance</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="balance"
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="pl-7"
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apr">Average APR (%)</Label>
                <div className="relative">
                  <Input
                    id="apr"
                    type="number"
                    value={apr}
                    onChange={(e) => setApr(e.target.value)}
                    className="pr-7"
                    placeholder="18"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minPayment">Minimum Payment</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="minPayment"
                    type="number"
                    value={minPayment}
                    onChange={(e) => setMinPayment(e.target.value)}
                    className="pl-7"
                    placeholder="150"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategy">Payoff Strategy</Label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger id="strategy">
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="snowball">Snowball (Smallest First)</SelectItem>
                    <SelectItem value="avalanche">Avalanche (Highest APR)</SelectItem>
                    <SelectItem value="hybrid">AI Hybrid (Smart)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <TrendingDown className="w-6 h-6" />
                <h3 className="text-xl font-semibold">Your Results</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-background/80 rounded-xl p-4 border border-border/50">
                  <div className="text-sm text-muted-foreground mb-1">Debt-Free In</div>
                  <div className="text-3xl font-bold text-foreground">
                    {result.months} {result.months === 1 ? "month" : "months"}
                  </div>
                </div>

                <div className="bg-background/80 rounded-xl p-4 border border-border/50">
                  <div className="text-sm text-muted-foreground mb-1">Total Interest</div>
                  <div className="text-2xl font-bold text-foreground">
                    ${result.totalInterest.toFixed(0)}
                  </div>
                </div>

                <div className="bg-background/80 rounded-xl p-4 border border-border/50">
                  <div className="text-sm text-muted-foreground mb-1">Potential Savings</div>
                  <div className="text-2xl font-bold text-green-500">
                    ${result.savings.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    with {strategy === "snowball" ? "Snowball" : strategy === "avalanche" ? "Avalanche" : "AI Hybrid"} strategy
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress Visualization</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-background/80 rounded-full overflow-hidden border border-border/50">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => navigate("/setup/start")}
                className="w-full h-12 text-base group"
                size="lg"
              >
                Try Full Calculator
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                This is a simplified estimate. Get your personalized plan with the full calculator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
