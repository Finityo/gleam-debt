import { useMemo, useState } from "react";
import { z } from "zod";
import type { Debt, DebtPlan } from "@/lib/computeDebtPlan";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

type Log = { id: string; date: string; debtId: string; amount: number; note?: string };

const LS_LOGS = "finityo:paymentLogs";
const genLogId = () => Math.random().toString(36).slice(2, 9);

// Validation
const paymentSchema = z.object({
  debtId: z.string().min(1, "Select a debt"),
  amount: z.number().min(0.01, "Amount must be positive").max(1000000, "Amount too large"),
  note: z.string().max(200, "Note too long").optional(),
});

type Props = {
  plan: DebtPlan;
  debts: Debt[];
};

export function PaymentPlaybook({ plan, debts }: Props) {
  const [logs, setLogs] = useState<Log[]>(() => {
    try {
      const raw = localStorage.getItem(LS_LOGS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [debtId, setDebtId] = useState(debts[0]?.id ?? "");
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState("");

  const payoffOrder = useMemo(() => {
    const map: Record<string, number> = {};
    plan.months?.forEach((m) =>
      m.payments.forEach((p) => {
        if (p.balanceEnd === 0 && map[p.debtId] == null) {
          map[p.debtId] = m.monthIndex;
        }
      })
    );
    return debts.slice().sort((a, b) => (map[a.id] ?? 999) - (map[b.id] ?? 999));
  }, [plan, debts]);

  function save(next: Log[]) {
    setLogs(next);
    try {
      localStorage.setItem(LS_LOGS, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to save payment logs:", e);
    }
  }

  function addLog() {
    try {
      const validated = paymentSchema.parse({ debtId, amount, note });
      const entry: Log = {
        id: genLogId(),
        date: new Date().toISOString(),
        ...validated,
      };
      save([entry, ...logs]);
      setAmount(0);
      setNote("");
      toast.success("Payment logged");
    } catch (e) {
      if (e instanceof z.ZodError) {
        toast.error(e.issues[0].message);
      }
    }
  }

  function removeLog(id: string) {
    save(logs.filter((l) => l.id !== id));
    toast.success("Payment log removed");
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Recommended Payoff Order</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal ml-5 space-y-2">
            {payoffOrder.map((d, idx) => (
              <li key={d.id} className="text-sm">
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  Balance: ${d.balance.toFixed(2)} • Min Payment: ${d.minPayment.toFixed(2)}
                  {d.apr > 0 && ` • APR: ${d.apr.toFixed(1)}%`}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log a Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Debt</Label>
            <Select value={debtId} onValueChange={setDebtId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {debts.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value || 0))}
              placeholder="100.00"
              min={0.01}
              max={1000000}
              step={0.01}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Extra payment from bonus"
              maxLength={200}
            />
          </div>

          <Button onClick={addLog} disabled={!debtId || amount <= 0} className="w-full">
            <CheckCircle className="h-4 w-4 mr-2" />
            Log Payment
          </Button>

          <p className="text-xs text-muted-foreground">
            Payment logs are stored locally on your device
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 && (
            <p className="text-sm text-muted-foreground">No payments logged yet</p>
          )}
          <div className="space-y-2">
            {logs.map((l) => {
              const d = debts.find((x) => x.id === l.debtId);
              return (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-3 border rounded bg-card"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{d?.name ?? l.debtId}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(l.date).toLocaleString()} • ${l.amount.toFixed(2)}
                      {l.note && ` • ${l.note}`}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLog(l.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
