import { usePlan } from "@/context/PlanContext";
import { remainingByMonth } from "@/lib/remaining";
import { MyChart } from "@/components/MyChart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ChartPage() {
  const { plan, compute } = usePlan();
  const navigate = useNavigate();

  if (!plan) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-4">Debt Chart</h1>
        <Card className="p-6">
          <p className="mb-4">No plan yet.</p>
          <Button onClick={compute}>Compute Plan</Button>
        </Card>
      </div>
    );
  }

  const data = remainingByMonth(plan);

  return (
    <div className="container mx-auto p-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <h1 className="text-3xl font-bold mb-6">Debt Payoff Chart</h1>
      
      <Card className="p-6">
        <MyChart data={data} />
      </Card>

      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-2">Details</h3>
        <div className="grid gap-2">
          <p>Starting Balance: ${data[0]?.remaining.toFixed(2) || "0.00"}</p>
          <p>Final Balance: ${data[data.length - 1]?.remaining.toFixed(2) || "0.00"}</p>
          <p>Total Months: {data.length}</p>
        </div>
      </Card>
    </div>
  );
}
