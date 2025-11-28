import { useDemoPlan } from "@/context/DemoPlanContext";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NextBack from "@/components/NextBack";
import { PopIn } from "@/components/Animate";
import { z } from "zod";

const debtNameSchema = z.string().trim().max(100, "Name must be less than 100 characters");
const balanceSchema = z.number().min(0, "Balance must be positive").max(1000000000, "Balance too large");
const aprSchema = z.number().min(0, "APR must be positive").max(100, "APR must be 100% or less");
const minPaymentSchema = z.number().min(0, "Minimum payment must be positive").max(1000000000, "Payment too large");

export default function DemoDebts() {
  const nav = useNavigate();
  const { demoDebts, setDemoDebts } = useDemoPlan();

  const updateField = (id: string, field: string, value: any) => {
    setDemoDebts(prev =>
      prev.map(d => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const addDebt = () => {
    if (demoDebts.length >= 5) return;
    setDemoDebts(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "New Debt",
        balance: 500,
        apr: 12,
        minPayment: 25,
        include: true,
      },
    ]);
  };

  const removeDebt = (id: string) => {
    if (demoDebts.length <= 1) return;
    setDemoDebts(prev => prev.filter(d => d.id !== id));
  };

  const displayValue = (val: number) => val === 0 ? "" : val.toString();

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Button variant="ghost" onClick={() => nav(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold text-finityo-textMain mb-2">
          Your Debts
        </h1>
        <p className="text-finityo-textBody mb-8">
          Review and adjust the sample debt data
        </p>

        <PopIn>
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-finityo-textMain">
                Current Debts
              </h2>

              <Button onClick={addDebt} size="sm" variant="outline" disabled={demoDebts.length >= 5}>
                <Plus className="w-4 h-4 mr-2" />
                Add Debt {demoDebts.length >= 5 && "(Max 5)"}
              </Button>
            </div>

            <div className="space-y-4">
              {demoDebts.map((d) => (
                <div key={d.id} className="rounded-xl bg-card border p-4 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={d.name}
                        placeholder="e.g. Credit Card"
                        onChange={(e) => {
                          const val = e.target.value;
                          const validated = debtNameSchema.safeParse(val);
                          if (validated.success || val === "") {
                            updateField(d.id, "name", val);
                          }
                        }}
                      />
                    </div>

                    <div>
                      <Label>Balance</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          className="pl-7"
                          placeholder="5000"
                          value={displayValue(d.balance)}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              const validated = balanceSchema.safeParse(val);
                              if (validated.success) {
                                updateField(d.id, "balance", val);
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>APR %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="18.99"
                        value={displayValue(d.apr)}
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            const validated = aprSchema.safeParse(val);
                            if (validated.success) {
                              updateField(d.id, "apr", val);
                            }
                          }
                        }}
                      />
                    </div>

                    <div>
                      <Label>Min Payment</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          className="pl-7"
                          placeholder="150"
                          value={displayValue(d.minPayment)}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              const validated = minPaymentSchema.safeParse(val);
                              if (validated.success) {
                                updateField(d.id, "minPayment", val);
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {demoDebts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDebt(d.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Debt
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <NextBack back="/setup/start" next="/setup/plan" />
          </div>
        </PopIn>
      </div>
    </PageShell>
  );
}
