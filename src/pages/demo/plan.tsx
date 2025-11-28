// ============================================================================
// FILE: src/pages/demo/DemoPlan.tsx
// Text summary of demo plan + quick preview of months
// ============================================================================

import { useNavigate } from "react-router-dom";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const money = (n: number) =>
  "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DemoPlan() {
  const navigate = useNavigate();
  const { demoDebts, demoPlan } = useDemoPlan();

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
          <CardTitle>Demo Plan</CardTitle>
          <CardDescription>
            This is a sample payoff plan based on the demo debts and the snowball method.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Debts used */}
          <div>
            <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              Debts used
            </div>
            <ul className="space-y-1 text-sm">
              {demoDebts.map(d => (
                <li key={d.id} className="flex items-center justify-between gap-2">
                  <span>{d.name}</span>
                  <span className="text-muted-foreground">
                    {money(d.balance as any)} @ {(d.apr ?? 0).toFixed(2)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {demoPlan ? (
            <>
              {/* Totals */}
              <div className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Months to freedom
                  </div>
                  <div className="text-lg font-semibold">
                    {demoPlan.months.length}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Total interest
                  </div>
                  <div className="text-lg font-semibold">
                    {money(demoPlan.totals.interest ?? 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Total paid
                  </div>
                  <div className="text-lg font-semibold">
                    {money(demoPlan.totals.totalPaid ?? 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Total principal
                  </div>
                  <div className="text-lg font-semibold">
                    {money(demoPlan.totals.principal ?? 0)}
                  </div>
                </div>
              </div>

              {/* First 3 months preview */}
              <div className="space-y-2 rounded-md border p-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  First 3 months (raw preview)
                </div>
                <pre className="max-h-72 overflow-auto rounded bg-muted p-2 text-xs">
                  {JSON.stringify(demoPlan.months.slice(0, 3), null, 2)}
                </pre>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => navigate("/demo/chart")}>
                  Open chart view
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate("/demo/power-pack")}>
                  Open power tools
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                Add some demo debts to generate a payoff plan.
              </div>
              <Button size="sm" onClick={() => navigate("/demo/debts")}>
                Add debts
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
