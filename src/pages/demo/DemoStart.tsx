import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { Btn, Card } from "@/components/ui";

export default function DemoStart() {
  const nav = useNavigate();

  // Auto-redirect if demo data exists
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem("finityo:demoDebts") ?? "null");
      if (Array.isArray(d) && d.length > 0) {
        nav("/demo/debts");
      }
    } catch {}
  }, [nav]);

  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-4 pt-12 pb-10">
        <Card>
          <h1 className="text-2xl text-finityo-textMain font-semibold mb-3">
            Try Finityo Demo
          </h1>
          <p className="text-sm text-finityo-textBody mb-6">
            No signup needed. Load sample debts and see your payoff plan.
          </p>

          <Btn onClick={() => nav("/demo/debts")} variant="primary" className="w-full">
            Start Demo
          </Btn>
        </Card>
      </div>
    </PageShell>
  );
}
