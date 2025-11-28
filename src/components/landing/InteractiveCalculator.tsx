import { useState } from "react";
import { Calculator, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const InteractiveCalculator = () => {
  const [balance, setBalance] = useState<string>("");
  const [apr, setApr] = useState<string>("");
  const [minimum, setMinimum] = useState<string>("");
  const [strategy, setStrategy] = useState<string>("snowball");
  const [result, setResult] = useState<{ months: number; saved: number } | null>(null);

  const calculatePayoff = () => {
    const balanceNum = parseFloat(balance) || 0;
    const aprNum = parseFloat(apr) || 0;
    const minNum = parseFloat(minimum) || 0;

    if (balanceNum <= 0 || minNum <= 0) {
      return;
    }

    // Simplified calculation
    const monthlyRate = aprNum / 100 / 12;
    let months = 0;
    let remaining = balanceNum;
    let totalInterest = 0;

    while (remaining > 0 && months < 600) {
      const interest = remaining * monthlyRate;
      const principal = minNum - interest;
      
      if (principal <= 0) {
        months = 999; // Indicate impossible payoff
        break;
      }
      
      totalInterest += interest;
      remaining -= principal;
      months++;
    }

    // Strategy bonuses (simplified)
    const strategyBonus = strategy === "avalanche" ? 0.9 : strategy === "ai" ? 0.85 : 1;
    const adjustedMonths = Math.ceil(months * strategyBonus);
    const interestSaved = Math.max(0, totalInterest * (1 - strategyBonus));

    setResult({
      months: adjustedMonths,
      saved: interestSaved,
    });
  };

  return (
    <section className="w-full py-20 px-4 bg-gradient-to-b from-background to-background/50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-finityo-textMain mb-4">
            Try Our Calculator
          </h2>
          <p className="text-lg text-finityo-textBody">
            Get an instant estimate of your debt payoff timeline
          </p>
        </div>

        <div className="glass rounded-2xl p-8 md:p-12 border-gradient-animate card-hover">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="balance" className="text-finityo-textMain">
                  Total Balance
                </Label>
                <Input
                  id="balance"
                  type="number"
                  placeholder="e.g., 15000"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="apr" className="text-finityo-textMain">
                  APR (%)
                </Label>
                <Input
                  id="apr"
                  type="number"
                  placeholder="e.g., 18.5"
                  value={apr}
                  onChange={(e) => setApr(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="minimum" className="text-finityo-textMain">
                  Monthly Payment
                </Label>
                <Input
                  id="minimum"
                  type="number"
                  placeholder="e.g., 300"
                  value={minimum}
                  onChange={(e) => setMinimum(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="strategy" className="text-finityo-textMain">
                  Strategy
                </Label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="snowball">Snowball (Smallest First)</SelectItem>
                    <SelectItem value="avalanche">Avalanche (Highest APR)</SelectItem>
                    <SelectItem value="ai">AI Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={calculatePayoff}
                className="w-full h-12 text-base font-semibold"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Calculate
              </Button>
            </div>

            {/* Results Section */}
            <div className="flex items-center justify-center">
              {result ? (
                <div className="text-center space-y-6 animate-fade-in">
                  <div className="glass rounded-xl p-6 border border-primary/20">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {result.months < 999 ? result.months : "∞"}
                    </div>
                    <div className="text-finityo-textBody">
                      {result.months < 999 ? "Months to debt-free" : "Increase payment"}
                    </div>
                  </div>

                  {result.months < 999 && result.saved > 0 && (
                    <div className="glass rounded-xl p-6 border border-accent/20">
                      <TrendingDown className="w-8 h-8 text-accent mx-auto mb-2" />
                      <div className="text-2xl font-bold text-finityo-textMain mb-1">
                        ${result.saved.toFixed(0)}
                      </div>
                      <div className="text-sm text-finityo-textBody">
                        Estimated interest saved
                      </div>
                    </div>
                  )}

                  <a href="/setup/start">
                    <Button variant="outline" className="w-full">
                      Try Full Calculator
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="text-center text-finityo-textBody">
                  <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Enter your details and click Calculate</p>
                  <p className="text-sm mt-2">to see your payoff estimate</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
