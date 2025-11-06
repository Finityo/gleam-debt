import { usePlan } from "@/context/PlanContext";
import { exportPlanToExcel } from "@/lib/exportExcel";
import { exportPlanToPDF } from "@/lib/exportPdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PlanPage() {
  const { debts, settings, plan, compute } = usePlan();
  const navigate = useNavigate();

  if (!plan) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-4">Payoff Plan</h1>
        <Card className="p-6">
          <p className="mb-4">No plan yet.</p>
          <Button onClick={compute}>Compute Plan</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex gap-2">
          <Button onClick={() => exportPlanToPDF(debts, settings, plan)}>
            <FileText className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          
          <Button onClick={() => exportPlanToExcel(debts, settings, plan)} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Excel
          </Button>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Payoff Plan</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Debt-Free Date: {plan.debtFreeDate}
      </p>

      <Card className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Month</th>
              <th className="text-right p-3">Total Paid</th>
              <th className="text-right p-3">Total Interest</th>
              <th className="text-right p-3">Principal</th>
            </tr>
          </thead>
          <tbody>
            {plan.months.map((m) => (
              <tr key={m.monthIndex} className="border-b hover:bg-muted/50">
                <td className="p-3">{m.monthIndex + 1}</td>
                <td className="text-right p-3">${m.totalPaid.toFixed(2)}</td>
                <td className="text-right p-3">${m.totalInterest.toFixed(2)}</td>
                <td className="text-right p-3">
                  ${(m.totalPaid - m.totalInterest).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-2">Summary</h3>
        <div className="grid gap-2">
          <p>Total Months: {plan.months.length}</p>
          <p>Total Interest: ${plan.totalInterest.toFixed(2)}</p>
          <p>Total Paid: ${plan.totalPaid.toFixed(2)}</p>
        </div>
      </Card>
    </div>
  );
}
