import { useMemo } from "react";
import { PageShell } from "@/components/PageShell";
import NextBack from "@/components/NextBack";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { PopIn } from "@/components/Animate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export default function DemoChart() {
  const { demoPlan } = useDemoPlan();
  const navigate = useNavigate();

  const data = useMemo(() => {
    if (!demoPlan) return [];
    let cumulative = 0;
    const startDate = new Date();

    return demoPlan.months.map((m) => {
      cumulative += m.totals.outflow;
      const totalBalance = m.payments.reduce(
        (sum, p) => sum + p.endingBalance,
        0
      );
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + m.monthIndex, 1);
      return {
        month: format(monthDate, "MMM yy"),
        balance: totalBalance,
        paid: cumulative,
      };
    });
  }, [demoPlan]);

  if (!demoPlan) {
    return (
      <PageShell>
        <div className="max-w-5xl mx-auto px-4 py-12 text-center text-finityo-textBody">
          No plan calculated. Start with debts.
          <NextBack back="/setup/start" next="/setup/debts" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold text-finityo-textMain mb-6">
          Your Debt Freedom Plan
        </h1>

        <PopIn>
          <Card className="p-6">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="c" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="10%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="90%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="hsl(var(--primary))"
                  fill="url(#c)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </PopIn>

        <NextBack back="/setup/plan" next="/setup/start" nextLabel="Start Over" />
      </div>
    </PageShell>
  );
}
