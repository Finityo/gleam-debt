import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export const WhatIfCalculator: React.FC = () => {
  const [extraPayment, setExtraPayment] = useState(0);
  const [oneTimePayment, setOneTimePayment] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Simulated calculation (replace with actual debt plan calculation)
  const baseMonths = 37;
  const baseInterest = 4522;
  const totalDebt = 30000;

  const monthsSaved = Math.floor((extraPayment * 0.5) + (oneTimePayment / 1000));
  const interestSaved = Math.round((monthsSaved / baseMonths) * baseInterest);
  const newMonths = Math.max(1, baseMonths - monthsSaved);
  const newInterest = Math.max(0, baseInterest - interestSaved);

  const handleCalculate = () => {
    setShowResults(true);
  };

  const handleReset = () => {
    setExtraPayment(0);
    setOneTimePayment(0);
    setShowResults(false);
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">What-If Calculator</h3>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        See how different payment strategies impact your debt-free date and total interest.
      </p>

      <div className="space-y-6">
        {/* Extra Monthly Payment */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Extra Monthly Payment</Label>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-primary">${extraPayment}</span>
          </div>
          <Slider
            value={[extraPayment]}
            onValueChange={(val) => setExtraPayment(val[0])}
            max={500}
            step={10}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$0</span>
            <span>$500</span>
          </div>
        </div>

        {/* One-Time Payment */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">One-Time Extra Payment</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="number"
              value={oneTimePayment || ''}
              onChange={(e) => setOneTimePayment(Number(e.target.value))}
              placeholder="0"
              className="pl-9"
            />
          </div>
        </div>

        {/* Calculate Button */}
        <div className="flex gap-2">
          <Button onClick={handleCalculate} className="flex-1">
            Calculate Impact
          </Button>
          {showResults && (
            <Button onClick={handleReset} variant="outline">
              Reset
            </Button>
          )}
        </div>

        {/* Results */}
        {showResults && (extraPayment > 0 || oneTimePayment > 0) && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <h4 className="text-sm font-semibold text-foreground">Impact Analysis</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Payoff Time
                </div>
                <div className="text-lg font-semibold text-foreground">{newMonths} months</div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Save {monthsSaved} months
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3" />
                  Total Interest
                </div>
                <div className="text-lg font-semibold text-foreground">
                  ${newInterest.toLocaleString()}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Save ${interestSaved.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-foreground">
                <span className="font-semibold">Bottom line:</span> By adding ${extraPayment}/month
                {oneTimePayment > 0 && ` plus a $${oneTimePayment.toLocaleString()} one-time payment`},
                you'll be debt-free <span className="font-semibold">{monthsSaved} months earlier</span> and 
                save <span className="font-semibold">${interestSaved.toLocaleString()}</span> in interest!
              </p>
            </div>
          </div>
        )}

        {showResults && extraPayment === 0 && oneTimePayment === 0 && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            Adjust the sliders above to see the impact of extra payments.
          </div>
        )}
      </div>
    </Card>
  );
};

export default WhatIfCalculator;
