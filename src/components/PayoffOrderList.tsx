import { DebtPlan, Debt } from "@/lib/computeDebtPlan";
import { getPayoffOrder } from "@/lib/payoffOrder";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

type Props = {
  plan: DebtPlan;
  debts: Debt[];
};

export default function PayoffOrderList({ plan, debts }: Props) {
  const payoffOrder = getPayoffOrder(plan);

  if (!payoffOrder.length) {
    return null;
  }

  // Create a map for quick debt lookup
  const debtMap = new Map(debts.map((d) => [d.id, d]));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-primary" />
        Debt Payoff Order
      </h3>

      <div className="space-y-3">
        {payoffOrder.map((item, idx) => {
          const debt = debtMap.get(item.debtId);
          const debtName = debt?.name || item.debtId;

          return (
            <div
              key={item.debtId}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {idx + 1}
                </div>
                <span className="font-medium">{debtName}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Month {item.monthIndex}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
