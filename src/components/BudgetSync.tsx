import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { DollarSign, TrendingUp } from "lucide-react";

type Props = {
  income: number;
  bills: { name: string; amount: number }[];
  onSuggest: (amount: number) => void;
};

export function BudgetSync({ income, bills, onSuggest }: Props) {
  const total = bills.reduce((a, b) => a + (b.amount || 0), 0);
  const available = Math.max(0, income - total);
  const percentAvailable = income > 0 ? (available / income) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Budget Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Income</div>
            <div className="text-lg font-semibold">${income.toFixed(0)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Bills</div>
            <div className="text-lg font-semibold">${total.toFixed(0)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Available</div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              ${available.toFixed(0)}
            </div>
          </div>
        </div>

        {available > 0 && (
          <>
            <div className="text-sm text-muted-foreground">
              You have {percentAvailable.toFixed(1)}% of your income available for debt payoff
            </div>
            <Button onClick={() => onSuggest(available)} className="w-full" variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Apply ${available.toFixed(0)} as Monthly Extra
            </Button>
          </>
        )}

        {available <= 0 && (
          <div className="text-sm text-amber-600 dark:text-amber-400">
            Your bills exceed your income. Consider reviewing your budget before adding extra
            payments.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
