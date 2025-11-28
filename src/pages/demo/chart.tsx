// ============================================================================
// FILE: src/pages/demo/DemoChart.tsx
// Simple chart-style preview using JSON; avoids tight coupling to chart engine
// ============================================================================

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function DemoChart() {
  const navigate = useNavigate();
  const { demoPlan } = useDemoPlan();

  const data = useMemo(() => {
    if (!demoPlan) return [];
    return demoPlan.months.map((m, idx) => ({
      label: `Month ${idx + 1}`,
      summary: {
        totalPaid: m.totals?.outflow ?? 0,
        remainingTotal: m.payments.reduce((sum, p) => sum + p.endingBalance, 0),
      },
    }));
  }, [demoPlan]);

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
          <CardTitle>Demo Chart Preview</CardTitle>
          <CardDescription>
            High-level view of your demo payoff path. In the live app this powers the full charts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!demoPlan && (
            <div className="space-y-3">
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                No plan yet. Add some demo debts first to generate a payoff schedule.
              </div>
              <Button size="sm" onClick={() => navigate("/demo/debts")}>
                Add demo debts
              </Button>
            </div>
          )}

          {demoPlan && (
            <>
              <div className="rounded-md border p-3 text-sm">
                <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  First 6 months (condensed)
                </div>
                <pre className="max-h-72 overflow-auto rounded bg-muted p-2 text-xs">
                  {JSON.stringify(data.slice(0, 6), null, 2)}
                </pre>
              </div>

              <Button size="sm" variant="outline" onClick={() => navigate("/demo/plan")}>
                Back to demo plan
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
