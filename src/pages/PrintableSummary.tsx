import React, { useMemo } from "react";
import { usePlan } from "@/context/PlanContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Helper to format APR
const formatAPR = (apr: number) => `${apr.toFixed(2)}%`;

export default function PrintableSummaryPage() {
  const { plan, compute, debts } = usePlan();
  const navigate = useNavigate();

  if (!plan) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-4">Printable Summary</h1>
        <Card className="p-6">
          <p className="mb-4">No plan computed yet.</p>
          <Button onClick={compute}>Compute Plan</Button>
        </Card>
      </div>
    );
  }

  // Generate debt summary rows
  const rows = useMemo(() => {
    return debts.map(d => {
      const debtPayments = plan.months.flatMap(m => m.payments.filter(p => p.debtId === d.id));
      const totalInterest = debtPayments.reduce((sum, p) => sum + p.interest, 0);
      const totalPaid = debtPayments.reduce((sum, p) => sum + p.paid, 0);
      const payoffMonth = plan.months.find(m => 
        m.payments.some(p => p.debtId === d.id && p.balanceEnd <= 0.01 && p.paid > 0)
      );
      
      return {
        creditor: d.name,
        apr: d.apr,
        minPayment: d.minPayment,
        startingBalance: d.balance,
        payoffDate: payoffMonth ? `Month ${payoffMonth.monthIndex + 1}` : "",
        totalInterest,
        totalPaid,
        included: d.include !== false,
      };
    });
  }, [plan, debts]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-6">Printable Summary</h1>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Creditor</th>
              <th className="text-right p-3">APR %</th>
              <th className="text-right p-3">Min</th>
              <th className="text-right p-3">Start Balance</th>
              <th className="text-left p-3">Payoff Date</th>
              <th className="text-right p-3">Total Interest</th>
              <th className="text-right p-3">Total Paid</th>
              <th className="text-left p-3">Included</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b hover:bg-muted/50">
                <td className="p-3">{r.creditor}</td>
                <td className="text-right p-3">{formatAPR(r.apr)}</td>
                <td className="text-right p-3">${r.minPayment.toFixed(2)}</td>
                <td className="text-right p-3">${r.startingBalance.toFixed(2)}</td>
                <td className="p-3">{r.payoffDate ?? ""}</td>
                <td className="text-right p-3">${r.totalInterest.toFixed(2)}</td>
                <td className="text-right p-3">${r.totalPaid.toFixed(2)}</td>
                <td className="p-3">{r.included ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-4 text-sm text-muted-foreground print:hidden">
        Tip: Use your browser's Print dialog for a clean print/export to PDF.
      </p>
    </div>
  );
}
