import { PageShell } from "@/components/PageShell";
import NextBack from "@/components/NextBack";
import { usePlan } from "@/context/PlanContext";
import { PopIn } from "@/components/Animate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, DollarSign } from "lucide-react";

export default function DemoDebts() {
  const { debts, updateDebts } = usePlan();

  const addDebt = () => {
    const next = [
      ...debts,
      {
        id: crypto.randomUUID(),
        name: "",
        balance: 0,
        apr: 0,
        minPayment: 0,
        dueDay: null,
      },
    ];
    updateDebts(next);
  };

  const removeDebt = (id: string) => {
    updateDebts(debts.filter((d) => d.id !== id));
  };

  const update = (id: string, patch: any) => {
    updateDebts(
      debts.map((d) => (d.id === id ? { ...d, ...patch } : d))
    );
  };

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 py-10">
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

              <Button onClick={addDebt} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Debt
              </Button>
            </div>

            <div className="space-y-4">
              {debts.map((d) => (
                <div key={d.id} className="rounded-xl bg-card border p-4 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={d.name}
                        onChange={(e) =>
                          update(d.id, { name: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label>Balance</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          className="pl-7"
                          value={d.balance}
                          onChange={(e) =>
                            update(d.id, {
                              balance: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label>APR %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={d.apr}
                        onChange={(e) =>
                          update(d.id, { apr: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>

                    <div>
                      <Label>Min Payment</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          className="pl-7"
                          value={d.minPayment}
                          onChange={(e) =>
                            update(d.id, {
                              minPayment: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {debts.length > 1 && (
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

            <NextBack back="/demo/start" next="/demo/plan" />
          </div>
        </PopIn>
      </div>
    </PageShell>
  );
}
