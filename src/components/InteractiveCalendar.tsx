import { useState } from "react";
import { z } from "zod";
import type { DebtPlan } from "@/lib/computeDebtPlan";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { X, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";

type OneOff = { id: string; monthIndex: number; amount: number; note?: string };

const oneOffSchema = z.number().min(1, "Amount must be positive").max(100000, "Amount too large");
const genId = () => Math.random().toString(36).slice(2, 9);

type Props = {
  plan: DebtPlan;
  onApply: (oneOffs: OneOff[]) => void;
};

export function InteractiveCalendar({ plan, onApply }: Props) {
  const [oneOffs, setOneOffs] = useState<OneOff[]>([]);
  const months = plan.months ?? [];
  const totalOneOff = oneOffs.reduce((a, b) => a + b.amount, 0);

  function addOneOff(monthIndex: number) {
    const input = prompt(`Enter one-time payment amount for Month ${monthIndex + 1}:`);
    if (!input) return;

    const amount = Number(input);
    try {
      oneOffSchema.parse(amount);
      setOneOffs((prev) => [...prev, { id: genId(), monthIndex, amount }]);
      toast.success(`$${amount} scheduled for Month ${monthIndex + 1}`);
    } catch (e) {
      if (e instanceof z.ZodError) {
        toast.error(e.issues[0].message);
      }
    }
  }

  function removeOneOff(id: string) {
    setOneOffs((prev) => prev.filter((x) => x.id !== id));
  }

  function handleApply() {
    onApply(oneOffs);
    toast.success(`${oneOffs.length} one-time payments applied`);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Interactive Payoff Calendar
          </CardTitle>
          <Button onClick={handleApply} disabled={oneOffs.length === 0}>
            Apply {oneOffs.length} Payments (${totalOneOff.toFixed(0)})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {months.map((m) => {
            const monthOneOffs = oneOffs.filter((o) => o.monthIndex === m.monthIndex);
            const monthTotal = monthOneOffs.reduce((sum, o) => sum + o.amount, 0);

            return (
              <div key={m.monthIndex} className="border rounded-lg p-3 space-y-2 bg-card">
                <div className="font-semibold text-sm">Month {m.monthIndex + 1}</div>
                <div className="text-xs text-muted-foreground">
                  Remaining: ${m.payments.reduce((sum, p) => sum + p.balanceEnd, 0).toFixed(0)}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => addOneOff(m.monthIndex)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>

                {monthOneOffs.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-green-600 dark:text-green-400">
                      +${monthTotal.toFixed(0)}
                    </div>
                    {monthOneOffs.map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between bg-muted p-1 rounded text-xs"
                      >
                        <span>${o.amount}</span>
                        <button
                          onClick={() => removeOneOff(o.id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
