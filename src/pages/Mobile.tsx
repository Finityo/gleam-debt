import React from "react";
import { usePlan } from "@/context/PlanContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MobileViewPage() {
  const { plan, compute } = usePlan();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <h1 className="text-3xl font-bold mb-6">Mobile View</h1>
      {!plan ? (
        <Card className="p-6">
          <p className="mb-4">No plan computed yet.</p>
          <Button onClick={compute}>Compute Plan</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {plan.debts.filter(d => d.included).map(d => (
            <Card key={d.id} className="p-4">
              <div className="font-semibold text-lg mb-2">{d.name}</div>
              <div className="text-sm text-muted-foreground mb-3">
                APR {d.apr.toFixed(2)}% • Min ${d.minPayment.toFixed(2)}
              </div>
              <div className="space-y-1 text-sm">
                <div>Start: ${d.originalBalance.toFixed(2)}</div>
                <div>Payoff: {d.payoffDateISO ?? "—"}</div>
                <div className="text-muted-foreground">
                  Interest: ${d.totalInterestPaid.toFixed(2)} • Total: ${d.totalPaid.toFixed(2)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
