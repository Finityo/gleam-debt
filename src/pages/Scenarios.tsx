import { useNavigate } from "react-router-dom";
import { useScenarios } from "@/context/ScenarioContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, RefreshCw, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/layouts/AppLayout";
import { computeDebtPlan } from "@/lib/debtPlan";

export default function ScenariosPage() {
  const navigate = useNavigate();
  const {
    scenarios,
    currentId,
    setCurrentId,
    createScenario,
    deleteScenario,
    compareCurrent,
    computeCurrent,
  } = useScenarios();

  function handleCreateScenario() {
    const name = prompt("Scenario name:") || `Scenario ${scenarios.length + 1}`;
    createScenario(
      name.trim().slice(0, 100),
      [],
      { strategy: "snowball", extraMonthly: 200, oneTimeExtra: 0 }
    );
    toast.success("Scenario created");
  }

  function handleRecompute() {
    if (!currentId) return;
    computeCurrent();
    toast.success("Plan recomputed");
  }

  function handleCompare() {
    if (!currentId) {
      toast.error("Select a scenario first");
      return;
    }
    const result = compareCurrent();
    if (!result) return;

    const snowballMonths = result.snowball.totals.monthsToDebtFree ?? result.snowball.months.length;
    const avalancheMonths = result.avalanche.totals.monthsToDebtFree ?? result.avalanche.months.length;
    const minimumMonths = result.minimum.totals.monthsToDebtFree ?? result.minimum.months.length;

    const msg = `
Snowball: ${snowballMonths} months
Avalanche: ${avalancheMonths} months
Minimum Only: ${minimumMonths} months
    `.trim();

    alert(msg);
  }

  function handleDelete(id: string) {
    if (confirm("Delete this scenario?")) {
      deleteScenario(id);
      toast.success("Scenario deleted");
    }
  }

  return (
    <AppLayout>
      <div className="p-4 pb-24">
        {/* TOP NAV */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 active:scale-[0.99]"
          >
            Back
          </button>
        </div>

        <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scenario Builder</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and compare different debt payoff scenarios
            </p>
          </div>
        </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleCreateScenario}>
          <Plus className="h-4 w-4 mr-2" />
          New Scenario
        </Button>
        <Button onClick={handleRecompute} disabled={!currentId} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Recompute
        </Button>
        <Button onClick={handleCompare} disabled={!currentId} variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Quick Compare
        </Button>
      </div>

      {scenarios.length === 0 && (
        <Card className="glass-intense border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-primary mb-4" />
            <p className="text-lg font-medium text-foreground">No scenarios yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first scenario to get started
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {scenarios.map((s) => (
          <Card
            key={s.id}
            className={`cursor-pointer transition-all ${
              currentId === s.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setCurrentId(s.id)}
          >
            <CardContent className="p-6 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{s.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(s.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                {currentId === s.id && <Badge>Active</Badge>}
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Strategy:</span>
                  <span className="font-medium capitalize">{s.settings.strategy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Debts:</span>
                  <span className="font-medium">{s.debts.length}</span>
                </div>
                {s.plan && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Months:</span>
                    <span className="font-medium">
                      {s.plan.totals.monthsToDebtFree ?? s.plan.months.length}
                    </span>
                  </div>
                )}
                {s.plan && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest:</span>
                    <span className="font-medium">${s.plan.totals.interest.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(s.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
        </div>

        {/* BOTTOM STICKY BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 shadow-2xl border-t border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 active:scale-[0.99]"
          >
            Back
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
