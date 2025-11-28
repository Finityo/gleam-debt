// ============================================================================
// FILE: src/pages/demo/DemoPowerPack.tsx
// Hooks demo plan into scenarios / power tools
// ============================================================================

import { useNavigate } from "react-router-dom";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { useScenarios } from "@/context/ScenarioContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function DemoPowerPack() {
  const navigate = useNavigate();
  const { demoPlan, demoDebts } = useDemoPlan();
  const { createScenario } = useScenarios();

  const handleCreateScenario = () => {
    if (!demoPlan) return;
    createScenario("Demo Plan Scenario", demoDebts, {
      strategy: "snowball",
      extraMonthly: 200,
      oneTimeExtra: 1000,
    });
    toast.success("Demo scenario created!");
    navigate("/scenarios");
  };

  if (!demoPlan) {
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
            <CardTitle>Power Tools (Demo)</CardTitle>
            <CardDescription>
              You need a demo plan first before using the power tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Create a demo payoff plan, then come back here to explore scenarios and extras.
            </div>
            <Button size="sm" onClick={() => navigate("/demo/plan")}>
              Go to demo plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
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
          <CardTitle>Power Tools (Demo)</CardTitle>
          <CardDescription>
            Use the same engines as the live app to build scenarios from your demo debts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-4">
            <h3 className="mb-2 font-semibold">Demo Plan Summary</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Debts:</span>
                <span>{demoDebts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Months to freedom:</span>
                <span>{demoPlan.months.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total interest:</span>
                <span>${(demoPlan.totals.interest ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button className="w-full" onClick={handleCreateScenario}>
              Create Scenario from Demo
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate("/demo/plan")}
            >
              Back to Demo Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
