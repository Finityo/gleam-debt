import { useState } from "react";
import { z } from "zod";
import type { Debt, UserSettings } from "@/lib/computeDebtPlan";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";

// Validation schemas
const incomeSchema = z.number().min(0, "Income must be positive").max(1000000, "Income too large");
const billSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(50, "Name too long"),
  amount: z.number().min(0, "Amount must be positive").max(100000, "Amount too large"),
});
const extraSchema = z.number().min(0, "Must be positive").max(100000, "Amount too large");

type Props = {
  onFinish: (debts: Debt[], settings: UserSettings) => void;
};

export function OnboardingWizard({ onFinish }: Props) {
  const [step, setStep] = useState(1);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [income, setIncome] = useState<number>(0);
  const [bills, setBills] = useState<{ name: string; amount: number }[]>([]);
  const [strategy, setStrategy] = useState<UserSettings["strategy"]>("snowball");
  const [extraMonthly, setExtraMonthly] = useState<number>(200);
  const [oneTimeExtra, setOneTimeExtra] = useState<number>(0);

  const totalBills = bills.reduce((a, b) => a + (b.amount || 0), 0);
  const computedExtra = Math.max(0, income - totalBills);

  function validateAndNext(validator?: () => boolean) {
    if (validator && !validator()) return;
    setStep((s) => s + 1);
  }

  function addSampleDebts() {
    setDebts([
      {
        id: "1",
        name: "Credit Card",
        balance: 1200,
        apr: 19.9,
        minPayment: 45,
        dueDay: 15,
      },
      {
        id: "2",
        name: "Medical Bill",
        balance: 800,
        apr: 0,
        minPayment: 40,
        dueDay: 10,
      },
    ]);
    toast.success("Sample debts added");
  }

  function validateIncome() {
    try {
      incomeSchema.parse(income);
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        toast.error(e.issues[0].message);
      }
      return false;
    }
  }

  function addBill() {
    setBills([...bills, { name: "", amount: 0 }]);
  }

  function updateBill(index: number, field: "name" | "amount", value: string | number) {
    const updated = [...bills];
    updated[index] = { ...updated[index], [field]: value };
    setBills(updated);
  }

  function validateExtras() {
    try {
      extraSchema.parse(extraMonthly);
      extraSchema.parse(oneTimeExtra);
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        toast.error(e.issues[0].message);
      }
      return false;
    }
  }

  function handleFinish() {
    if (!debts.length) {
      toast.error("Please add at least one debt");
      return;
    }
    onFinish(debts, { strategy, extraMonthly, oneTimeExtra });
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="text-sm text-muted-foreground">Step {step} of 6</div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Import Your Debts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Start by adding your debts. You can manually enter them or use sample data.
            </p>
            <Button onClick={addSampleDebts} variant="outline">
              Add Sample Debts
            </Button>
            {debts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Your Debts:</h4>
                {debts.map((d) => (
                  <div key={d.id} className="text-sm p-2 bg-muted rounded">
                    {d.name} - ${d.balance.toFixed(2)} @ {d.apr}% APR
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => validateAndNext(() => debts.length > 0)} disabled={!debts.length}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="income">Monthly Take-Home Income</Label>
              <Input
                id="income"
                type="number"
                placeholder="3500"
                value={income || ""}
                onChange={(e) => setIncome(Number(e.target.value || 0))}
                min={0}
                max={1000000}
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => validateAndNext(validateIncome)} disabled={!income}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Bills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={addBill} variant="outline" size="sm">
              + Add Bill
            </Button>
            {bills.map((b, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Bill name"
                  value={b.name}
                  onChange={(e) => updateBill(i, "name", e.target.value)}
                  maxLength={50}
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={b.amount || ""}
                  onChange={(e) => updateBill(i, "amount", Number(e.target.value || 0))}
                  min={0}
                  max={100000}
                />
              </div>
            ))}
            <div className="text-sm text-muted-foreground">
              Bills total: ${totalBills.toFixed(2)}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => validateAndNext()}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Payoff Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Strategy</Label>
              <Select value={strategy} onValueChange={(v) => setStrategy(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="snowball">Snowball (smallest balance first)</SelectItem>
                  <SelectItem value="avalanche">Avalanche (highest APR first)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded text-sm">
              Based on your budget, you can safely allocate up to{" "}
              <strong>${computedExtra.toFixed(0)}</strong> per month toward debt.
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button onClick={() => validateAndNext()}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Extra Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="extra-monthly">Monthly Extra Payment</Label>
              <Input
                id="extra-monthly"
                type="number"
                value={extraMonthly}
                onChange={(e) => setExtraMonthly(Number(e.target.value || 0))}
                min={0}
                max={100000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="one-time">One-Time Payment (Month 1)</Label>
              <Input
                id="one-time"
                type="number"
                value={oneTimeExtra || 0}
                onChange={(e) => setOneTimeExtra(Number(e.target.value || 0))}
                min={0}
                max={100000}
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(4)}>
                Back
              </Button>
              <Button onClick={() => validateAndNext(validateExtras)}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 6 && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Compute</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We'll compute your personalized debt payoff plan and show your estimated debt-free
              date.
            </p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(5)}>
                Back
              </Button>
              <Button onClick={handleFinish} disabled={!debts.length}>
                Compute My Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
