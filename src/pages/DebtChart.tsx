import React, { useMemo } from "react";
import { usePlanCharts } from "@/engine/usePlanCharts";
import { SafeRender } from "@/components/SafeRender";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DebtChartPage() {
  const navigate = useNavigate();
  const { plan, lineSeries, totals, recompute } = usePlanCharts();

  const data = useMemo(() => {
    if (!plan) return [];
    return lineSeries.map((pt) => ({
      label: `M${pt.x}`,
      remaining: pt.remainingBalance,
    }));
  }, [plan, lineSeries]);

  if (!plan) {
    return (
      <div className="p-4 pb-24">
        {/* TOP NAV */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 active:scale-[0.99]"
          >
            Back
          </button>
          <button
            onClick={recompute}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.99]"
          >
            Recalculate
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-4">Debt Chart</h1>
        <p>No plan computed yet.</p>

        {/* BOTTOM STICKY BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 shadow-2xl border-t border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 active:scale-[0.99]"
          >
            Back
          </button>
          <button
            onClick={recompute}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.99]"
          >
            Recalculate
          </button>
        </div>
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
    <SafeRender fallback={<div className="p-4 text-sm text-muted-foreground">Charts loading...</div>}>
    <div className="p-4 pb-24">
      {/* TOP NAV */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 active:scale-[0.99]"
        >
          Back
        </button>
        <button
          onClick={recompute}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.99]"
        >
          Recalculate
        </button>
      </div>

      <div className="container mx-auto">
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

      {/* BOTTOM STICKY BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 shadow-2xl border-t border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 active:scale-[0.99]"
        >
          Back
        </button>
        <button
          onClick={recompute}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.99]"
        >
          Recalculate
        </button>
      </div>
    </div>
    </SafeRender>
  );
}
