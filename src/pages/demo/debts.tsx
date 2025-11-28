// ============================================================================
// FILE: src/pages/demo/DemoDebts.tsx
// Edit demo debts (purely client-side, backed by DemoPlanContext)
// ============================================================================

import { useNavigate } from "react-router-dom";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, Plus, ArrowLeft } from "lucide-react";

export default function DemoDebts() {
  const navigate = useNavigate();
  const { demoDebts, setDemoDebts, reset } = useDemoPlan();

  const updateField = (id: string, field: keyof (typeof demoDebts)[number], value: any) => {
    setDemoDebts(prev =>
      prev.map(d => (d.id === id ? { ...d, [field]: value } : d)),
    );
  };

  const addDebt = () => {
    setDemoDebts(prev => {
      if (prev.length >= 5) return prev;
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: "New Debt",
          balance: 500,
          apr: 12,
          minPayment: 25,
          include: true,
        } as any,
      ];
    });
  };

  const removeDebt = (id: string) => {
    setDemoDebts(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(d => d.id !== id);
    });
  };

  const displayNumber = (val: number | undefined | null) =>
    !val || val === 0 ? "" : String(val);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-1 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <Card>
        <CardHeader>
          <CardTitle>Your Demo Debts</CardTitle>
          <CardDescription>
            Adjust these sample debts to see how the payoff plan responds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              You can add up to 5 demo debts.
            </div>
            <Button size="sm" variant="outline" onClick={addDebt} disabled={demoDebts.length >= 5}>
              <Plus className="mr-1 h-4 w-4" />
              Add Debt {demoDebts.length >= 5 && "(Max 5)"}
            </Button>
          </div>

          <div className="space-y-3">
            {demoDebts.map(d => (
              <div
                key={d.id}
                className="grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto]"
              >
                {/* Name */}
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    Name
                  </div>
                  <Input
                    value={d.name ?? ""}
                    onChange={e => updateField(d.id, "name", e.target.value)}
                    placeholder="e.g., Credit Card"
                  />
                </div>

                {/* Balance */}
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    Balance
                  </div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={displayNumber(d.balance as any)}
                    onChange={e =>
                      updateField(d.id, "balance", e.target.value === "" ? 0 : Number(e.target.value))
                    }
                    placeholder="0"
                  />
                </div>

                {/* APR */}
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    APR %
                  </div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={displayNumber(d.apr as any)}
                    onChange={e =>
                      updateField(d.id, "apr", e.target.value === "" ? 0 : Number(e.target.value))
                    }
                    placeholder="0"
                  />
                </div>

                {/* Min Payment */}
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    Min Payment
                  </div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={displayNumber(d.minPayment as any)}
                    onChange={e =>
                      updateField(
                        d.id,
                        "minPayment",
                        e.target.value === "" ? 0 : Number(e.target.value),
                      )
                    }
                    placeholder="0"
                  />
                </div>

                {/* Remove */}
                <div className="flex items-center justify-end">
                  {demoDebts.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeDebt(d.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2 md:flex-row md:items-center md:justify-between">
            <Button variant="outline" size="sm" onClick={reset}>
              Reset to defaults
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                type="button"
                size="sm"
                onClick={() => navigate("/demo/plan")}
              >
                View plan
              </Button>
              <Button type="button" size="sm" onClick={() => navigate("/demo/chart")}>
                View chart preview
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
