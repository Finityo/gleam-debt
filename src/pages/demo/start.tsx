// ============================================================================
// FILE: src/pages/demo/DemoStart.tsx
// Simple entry screen for demo flow
// Routes to /demo/debts
// ============================================================================

import { useNavigate } from "react-router-dom";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DemoStart() {
  const navigate = useNavigate();
  const { demoDebts, reset } = useDemoPlan();

  const handleStart = () => {
    reset();
    navigate("/demo/debts");
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Try Finityo in Demo Mode</CardTitle>
          <CardDescription>
            Play with sample debts, see a real payoff plan, and test the tools before connecting real accounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" size="lg" onClick={handleStart}>
            Start Demo
          </Button>

          {demoDebts?.length > 0 && (
            <button
              type="button"
              className="mt-2 text-xs text-finityo-textBody underline"
              onClick={() => navigate("/demo/debts")}
            >
              Continue where you left off →
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
