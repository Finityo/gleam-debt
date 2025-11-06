import React from "react";
import { usePlan } from "@/context/PlanContext";
import { PlanService } from "@/lib/debtPlan";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PayoffCalendarPage() {
  const { plan, compute } = usePlan();
  const navigate = useNavigate();

  if (!plan) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-4">Payoff Calendar</h1>
        <Card className="p-6">
          <p className="mb-4">No plan computed yet.</p>
          <Button onClick={compute}>Compute Plan</Button>
        </Card>
      </div>
    );
  }

  const cal = PlanService.calendar(plan);

  return (
    <div className="container mx-auto p-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <h1 className="text-3xl font-bold mb-6">Payoff Calendar</h1>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Month</th>
              <th className="text-right p-3">Outflow</th>
              <th className="text-right p-3">Interest</th>
              <th className="text-right p-3">Principal</th>
              <th className="text-left p-3">Payoffs</th>
            </tr>
          </thead>
          <tbody>
            {cal.map(m => (
              <tr key={m.monthIndex} className="border-b hover:bg-muted/50">
                <td className="p-3">{m.monthLabel}</td>
                <td className="text-right p-3">${m.totalOutflow.toFixed(2)}</td>
                <td className="text-right p-3">${m.totalInterest.toFixed(2)}</td>
                <td className="text-right p-3">${m.totalPrincipal.toFixed(2)}</td>
                <td className="p-3">{m.payoffs.map(p => p.name).join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
