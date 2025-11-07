import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/ui";
import { PlanList } from "@/components/PlanList";
import { TimelineChart } from "@/components/TimelineChart";
import { useEffect, useState } from "react";

const money = (n: number) => "$" + (n ?? 0).toLocaleString();

export default function DemoChartPolished() {
  const [plan, setPlan] = useState<any>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Read from demo localStorage
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("finityo:demoPlan") ?? "null");
      setPlan(p);
    } catch {}
  }, []);

  if (!plan) {
    return (
      <PageShell>
        <div className="p-6 text-white">No plan found</div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-white mb-6">Payoff Timeline</h1>

        <Card className="p-4">
          <TimelineChart
            plan={plan}
            hoverIndex={hoverIndex}
            setHoverIndex={setHoverIndex}
          />
        </Card>

        {hoverIndex != null && plan.months[hoverIndex] && (
          <div className="mt-4 text-finityo-textBody text-sm">
            Month {hoverIndex + 1} — Remaining:{" "}
            <span className="text-finityo-primary">
              {money(plan.months[hoverIndex]?.remaining)}
            </span>
          </div>
        )}

        <div className="mt-8">
          <PlanList plan={plan} />
        </div>
      </div>
    </PageShell>
  );
}
