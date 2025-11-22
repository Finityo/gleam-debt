import { useState } from "react";
import { useDemoPlan } from "@/context/DemoPlanContext";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { PaymentPlaybook } from "@/components/PaymentPlaybook";
import { BudgetSync } from "@/components/BudgetSync";
import { AlertsPanel } from "@/components/AlertsPanel";
import { generateAlerts } from "@/lib/alerts";
import { InteractiveCalendar } from "@/components/InteractiveCalendar";
import { DataPorter } from "@/components/DataPorter";
import { useScenarios } from "@/context/ScenarioContext";
import ScenarioChart from "@/components/ScenarioChart";
import PayoffChartWithEvents from "@/components/PayoffChartWithEvents";
import NotesBox from "@/components/NotesBox";
import BadgesBar from "@/components/BadgesBar";
import { Card } from "@/components/Card";
import AppLayout from "@/layouts/AppLayout";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function DemoPlanPowerPack() {
  const navigate = useNavigate();
  const { plan, inputs, setInputs } = useDemoPlan();
  const { createScenario, scenarios } = useScenarios();
  const debts = inputs.debts;
  const settings = { strategy: inputs.strategy, extraMonthly: inputs.extraMonthly, oneTimeExtra: inputs.oneTimeExtra };
  const notes = "";
  const [income, setIncome] = useState(5000);
  const [bills, setBills] = useState<{ name: string; amount: number }[]>([
    { name: "Rent", amount: 1800 }, 
    { name: "Utilities", amount: 250 }, 
    { name: "Phone", amount: 75 },
  ]);

  if (!plan) {
    return (
      <AppLayout>
        <OnboardingWizard
          onFinish={(d, s) => {
            createScenario("My First Plan", d, s);
            toast.success("Scenario created! Open Scenarios page to view.");
          }}
        />
      </AppLayout>
    );
  }

  // Temporarily disable components that expect DebtPlan type
  // The demo context uses PlanResult which has a different structure
  return (
    <AppLayout>
      <div className="p-4 pb-24">
        {/* TOP NAV */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 active:scale-[0.99]"
          >
            Back
          </button>
        </div>

        <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Power Pack Demo</h1>
          <p className="text-sm text-muted-foreground">
            Demo temporarily disabled - incompatible plan types need refactoring
          </p>
        </div>
        
        <Card title="Info">
          <p>This demo page needs to be updated to work with the new PlanResult type structure.</p>
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
        </div>
      </div>
    </AppLayout>
  );
}
