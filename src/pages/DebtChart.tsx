import React, { useMemo } from "react";
import { useDebtEngineFromStore } from "@/engine/useDebtEngineFromStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DebtChartPage() {
  const { plan } = useDebtEngineFromStore();
  const navigate = useNavigate();

  const data = useMemo(() => {
    if (!plan) return [];
    // Calculate remaining principal over time
    return plan.months.map((month) => ({
      label: `M${month.monthIndex + 1}`,
      remaining: month.payments.reduce((sum, p) => sum + p.endingBalance, 0),
    }));
  }, [plan]);

  if (!plan) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-4">Debt Chart</h1>
        <Card className="p-6">
          <p className="mb-4">No plan computed yet.</p>
        </Card>
      </div>
    );
  }

  // Build simple SVG path
  const w = 800,
    h = 260,
    pad = 24;
  const maxY = Math.max(...data.map(d => d.remaining), 1);
  const xStep = (w - pad * 2) / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => {
    const x = pad + i * xStep;
    const y = pad + (1 - d.remaining / maxY) * (h - pad * 2);
    return [x, y] as const;
  });

  const path = points.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");

  return (
    <div className="container mx-auto p-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <h1 className="text-3xl font-bold mb-6">Debt Remaining Over Time</h1>
      <Card className="p-6 overflow-x-auto">
        <svg width={w} height={h} className="border border-border bg-background">
          {/* axes */}
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="currentColor" strokeOpacity="0.2" />
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="currentColor" strokeOpacity="0.2" />
          {/* path */}
          <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} />
          {/* points */}
          {points.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={3} stroke="hsl(var(--primary))" fill="hsl(var(--background))" />
          ))}
          {/* labels */}
          <text x={pad} y={12} fontSize="10" fill="currentColor">
            Max: ${maxY.toFixed(2)}
          </text>
        </svg>
        <div className="flex gap-2 flex-wrap mt-4 text-xs text-muted-foreground">
          {data.map((d, i) => (
            <div key={i}>{d.label}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}
