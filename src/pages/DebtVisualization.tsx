import React, { useMemo } from "react";
import { usePlan } from "@/context/PlanContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Simple color picker for pie chart
function pickColor(name: string): string {
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
    "#f59e0b",
    "#10b981",
    "#6366f1",
    "#ec4899",
  ];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function DebtVisualizationPage() {
  const { plan, compute } = usePlan();
  const navigate = useNavigate();

  if (!plan) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-4">Debt Visualization</h1>
        <Card className="p-6">
          <p className="mb-4">No plan computed yet.</p>
          <Button onClick={compute}>Compute Plan</Button>
        </Card>
      </div>
    );
  }

  // Normalize APRs so they show correctly
  const normalizedDebts = plan.debts.map(d => ({
    ...d,
    apr: d.apr > 100 ? d.apr / 100 : d.apr,
  }));

  // Calculate key totals from computed data
  const totalDebt = normalizedDebts
    .filter(d => d.included)
    .reduce((sum, d) => sum + d.originalBalance, 0);

  const totalAvailableCredit = normalizedDebts
    .filter(d => !d.included)
    .reduce((sum, d) => sum + d.originalBalance, 0);

  const utilization = totalDebt > 0
    ? (totalDebt / (totalDebt + totalAvailableCredit)) * 100
    : 0;

  // Prepare pie chart data from computed plan
  const pieData = useMemo(() => {
    const included = normalizedDebts.filter(d => d.included);
    const sum = included.reduce((s, d) => s + d.originalBalance, 0);
    if (sum === 0) return [];
    return included.map(d => ({
      label: d.name,
      value: ((d.originalBalance / sum) * 100),
      color: pickColor(d.name),
    }));
  }, [normalizedDebts]);

  // Simple Pie SVG
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const arcs = pieData.map((slice, i) => {
    const length = (slice.value / 100) * circumference;
    const arc = (
      <circle
        key={i}
        r={radius}
        cx="50%"
        cy="50%"
        fill="transparent"
        stroke={slice.color}
        strokeWidth={25}
        strokeDasharray={`${length} ${circumference - length}`}
        strokeDashoffset={-offset}
      />
    );
    offset += length;
    return arc;
  });

  return (
    <div className="container mx-auto p-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <h1 className="text-3xl font-bold mb-6">Debt Overview</h1>

      {/* Totals */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Debt</div>
          <div className="text-2xl font-bold mt-1">${totalDebt.toFixed(2)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Available Credit</div>
          <div className="text-2xl font-bold mt-1">${totalAvailableCredit.toFixed(2)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Utilization</div>
          <div className="text-2xl font-bold mt-1">{utilization.toFixed(1)}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Debts in Plan</div>
          <div className="text-2xl font-bold mt-1">{normalizedDebts.filter(d => d.included).length}</div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Debt Distribution</h2>
        <div className="flex flex-col items-center">
          <svg width="250" height="250" viewBox="0 0 250 250" style={{ transform: "rotate(-90deg)" }}>
            <g transform="translate(125,125)">{arcs}</g>
          </svg>
          <div className="mt-6 grid gap-2">
            {pieData.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div style={{ width: 12, height: 12, background: p.color, borderRadius: 2 }}></div>
                <div className="text-sm">{p.label} – {p.value.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Table of normalized APRs */}
      <Card className="p-6 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Debt Details</h2>
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3">Creditor</th>
              <th className="text-right p-3">Balance</th>
              <th className="text-right p-3">Min Payment</th>
              <th className="text-right p-3">APR %</th>
              <th className="text-left p-3">Payoff Date</th>
            </tr>
          </thead>
          <tbody>
            {normalizedDebts.map((d, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="p-3">{d.name}</td>
                <td className="text-right p-3">${d.originalBalance.toFixed(2)}</td>
                <td className="text-right p-3">${d.minPayment.toFixed(2)}</td>
                <td className="text-right p-3">{d.apr.toFixed(2)}%</td>
                <td className="p-3">{d.payoffDateISO ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
