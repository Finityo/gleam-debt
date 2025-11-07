import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { Btn } from "@/components/Btn";
import { usePlan } from "@/context/PlanContext";

export default function DemoStart() {
  const nav = useNavigate();
  const { debts, reset } = usePlan();

  const handleStart = () => {
    // For setup, wipe whatever's in memory/local.
    reset();
    nav("/setup/debts");
  };

  return (
    <PageShell>
      <section className="max-w-lg mx-auto px-4 pt-16 pb-20 text-center">
        <h1 className="text-4xl font-bold text-finityo-textMain mb-4">
          Try Finityo Demo
        </h1>

        <p className="text-finityo-textBody mb-10">
          Load sample debts and see how the debt payoff engine works — no signup
          required.
        </p>

        <Btn
          variant="cta"
          className="w-full h-12 text-lg"
          onClick={handleStart}
        >
          🚀 Start Demo
        </Btn>

        {debts?.length > 0 && (
          <button
            onClick={() => nav("/setup/debts")}
            className="text-xs text-finityo-textBody mt-4 underline"
          >
            Continue where you left off →
          </button>
        )}
      </section>
    </PageShell>
  );
}
