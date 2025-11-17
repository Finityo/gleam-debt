import React, { useMemo } from "react";
import { usePlan } from "@/context/PlanContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PayoffCalendarPage() {
  const { plan, compute, debts } = usePlan();
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

  // Generate calendar data from plan
  const cal = useMemo(() => {
    return plan.months.map(month => {
      const closedDebts = month.payments.filter(p => p.balanceEnd <= 0.01 && p.paid > 0);
      const payoffs = closedDebts.map(p => {
        const debt = debts.find(d => d.id === p.debtId);
        return { name: debt?.name || "Unknown" };
      });
      
      return {
        monthIndex: month.monthIndex,
        monthLabel: `Month ${month.monthIndex + 1}`,
        totalOutflow: month.totalPaid,
        totalInterest: month.totalInterest,
        totalPrincipal: month.totalPaid - month.totalInterest,
        payoffs,
      };
    });
  }, [plan, debts]);

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Payoff Calendar</h1>
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
