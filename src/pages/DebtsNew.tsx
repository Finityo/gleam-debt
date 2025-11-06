import { usePlan } from "@/context/PlanContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";

export default function DebtsPage() {
  const { debts, updateDebts, settings, updateSettings } = usePlan();
  const navigate = useNavigate();

  const addDebt = () => {
    const next = [
      ...debts,
      {
        id: crypto.randomUUID(),
        name: "New Debt",
        balance: 0,
        apr: 0,
        minPayment: 0,
        include: true,
      },
    ];
    updateDebts(next);
  };

  const removeDebt = (id: string) => {
    updateDebts(debts.filter((d) => d.id !== id));
  };

  const updateDebt = (id: string, field: string, value: any) => {
    updateDebts(
      debts.map((d) =>
        d.id === id ? { ...d, [field]: value } : d
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Manage Debts</h1>
          <p className="text-muted-foreground">
            Add and edit your debts to create your payoff plan
          </p>
        </div>

        {/* Settings Card */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Settings</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="extra-monthly">Extra Monthly Payment ($)</Label>
              <Input
                id="extra-monthly"
                type="number"
                value={settings.extraMonthly}
                onChange={(e) =>
                  updateSettings({ extraMonthly: Number(e.target.value) || 0 })
                }
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Applied every month</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="one-time">One-Time Payment ($)</Label>
              <Input
                id="one-time"
                type="number"
                value={settings.oneTimeExtra}
                onChange={(e) =>
                  updateSettings({ oneTimeExtra: Number(e.target.value) || 0 })
                }
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Applied in Month 1</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy">Strategy</Label>
              <select
                id="strategy"
                value={settings.strategy}
                onChange={(e) =>
                  updateSettings({ strategy: e.target.value as "snowball" | "avalanche" })
                }
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="snowball">Snowball (Smallest First)</option>
                <option value="avalanche">Avalanche (Highest APR)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Debts List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Your Debts</h2>
            <Button onClick={addDebt}>
              <Plus className="w-4 h-4 mr-2" />
              Add Debt
            </Button>
          </div>

          {debts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No debts added yet</p>
              <Button onClick={addDebt}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Debt
              </Button>
            </Card>
          ) : (
            debts.map((debt) => (
              <Card key={debt.id} className="p-6">
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${debt.id}`}>Debt Name</Label>
                    <Input
                      id={`name-${debt.id}`}
                      value={debt.name}
                      onChange={(e) => updateDebt(debt.id, "name", e.target.value)}
                      placeholder="Credit Card"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`balance-${debt.id}`}>Balance ($)</Label>
                    <Input
                      id={`balance-${debt.id}`}
                      type="number"
                      value={debt.balance}
                      onChange={(e) => updateDebt(debt.id, "balance", Number(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`apr-${debt.id}`}>APR (%)</Label>
                    <Input
                      id={`apr-${debt.id}`}
                      type="number"
                      step="0.01"
                      value={debt.apr}
                      onChange={(e) => updateDebt(debt.id, "apr", Number(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`min-${debt.id}`}>Min Payment ($)</Label>
                    <Input
                      id={`min-${debt.id}`}
                      type="number"
                      value={debt.minPayment}
                      onChange={(e) => updateDebt(debt.id, "minPayment", Number(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`include-${debt.id}`}>Include in Plan</Label>
                    <div className="flex items-center gap-4 h-10">
                      <Switch
                        id={`include-${debt.id}`}
                        checked={debt.include !== false}
                        onCheckedChange={(checked) => updateDebt(debt.id, "include", checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDebt(debt.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {debt.dueDay !== undefined && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor={`due-${debt.id}`}>Due Day (1-28)</Label>
                      <Input
                        id={`due-${debt.id}`}
                        type="number"
                        min="1"
                        max="28"
                        value={debt.dueDay || ""}
                        onChange={(e) => updateDebt(debt.id, "dueDay", Number(e.target.value) || undefined)}
                        placeholder="15"
                        className="w-32"
                      />
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        {debts.length > 0 && (
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Debts</div>
                <div className="text-2xl font-bold">
                  {debts.filter((d) => d.include !== false).length}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Balance</div>
                <div className="text-2xl font-bold">
                  ${debts
                    .filter((d) => d.include !== false)
                    .reduce((sum, d) => sum + d.balance, 0)
                    .toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Min Payment</div>
                <div className="text-2xl font-bold">
                  ${debts
                    .filter((d) => d.include !== false)
                    .reduce((sum, d) => sum + d.minPayment, 0)
                    .toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg APR</div>
                <div className="text-2xl font-bold">
                  {debts.filter((d) => d.include !== false).length > 0
                    ? (
                        debts
                          .filter((d) => d.include !== false)
                          .reduce((sum, d) => sum + d.apr, 0) /
                        debts.filter((d) => d.include !== false).length
                      ).toFixed(2)
                    : "0.00"}
                  %
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={() => navigate("/debt-plan-new")} size="lg">
                Create Payoff Plan
              </Button>
              <Button onClick={() => navigate("/debt-visualization")} variant="outline" size="lg">
                View Visualization
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
