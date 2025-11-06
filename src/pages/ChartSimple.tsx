import { usePlan } from "@/context/PlanContext";
import { remainingByMonth } from "@/lib/planUtils";
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
  
  // SVG chart dimensions
  const width = 800;
  const height = 300;
  const padding = 40;
  
  const maxRemaining = Math.max(...data.map(d => d.remaining), 1);
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  // Scale functions
  const xScale = (monthIndex: number) => 
    padding + (monthIndex / Math.max(data.length - 1, 1)) * chartWidth;
  
  const yScale = (remaining: number) => 
    height - padding - (remaining / maxRemaining) * chartHeight;
  
  // Create path
  const pathData = data.map((d, i) => {
    const x = xScale(d.monthIndex);
    const y = yScale(d.remaining);
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(" ");

  return (
    <div className="container mx-auto p-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <h1 className="text-3xl font-bold mb-6">Debt Payoff Chart</h1>
      
      <Card className="p-6">
        <svg 
          width={width} 
          height={height} 
          className="w-full h-auto border border-border rounded"
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Y-axis */}
          <line 
            x1={padding} 
            y1={padding} 
            x2={padding} 
            y2={height - padding} 
            stroke="currentColor" 
            strokeOpacity={0.3}
          />
          
          {/* X-axis */}
          <line 
            x1={padding} 
            y1={height - padding} 
            x2={width - padding} 
            y2={height - padding} 
            stroke="currentColor" 
            strokeOpacity={0.3}
          />
          
          {/* Chart line */}
          <path 
            d={pathData} 
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
          />
          
          {/* Data points */}
          {data.map((d) => (
            <circle
              key={d.monthIndex}
              cx={xScale(d.monthIndex)}
              cy={yScale(d.remaining)}
              r={4}
              fill="hsl(var(--primary))"
              stroke="hsl(var(--background))"
              strokeWidth={2}
            />
          ))}
          
          {/* Y-axis label */}
          <text 
            x={padding - 10} 
            y={padding} 
            fontSize={12} 
            fill="currentColor"
            textAnchor="end"
          >
            ${maxRemaining.toFixed(0)}
          </text>
          
          <text 
            x={padding - 10} 
            y={height - padding} 
            fontSize={12} 
            fill="currentColor"
            textAnchor="end"
          >
            $0
          </text>
          
          {/* X-axis label */}
          <text 
            x={width / 2} 
            y={height - 10} 
            fontSize={12} 
            fill="currentColor"
            textAnchor="middle"
          >
            Months
          </text>
        </svg>
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
