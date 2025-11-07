import { useState } from "react";
import { usePlan } from "@/context/PlanContext";
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

export default function DemoPlanPowerPack() {
  const { plan, debts, settings, notes, updateSettings } = usePlan();
  const { createScenario, scenarios } = useScenarios();
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

  const alerts = generateAlerts(plan, debts);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Power Pack Demo</h1>
          <p className="text-sm text-muted-foreground">
            All features assembled: Budget Sync, Alerts, Calendar, Payment Playbook & more
          </p>
        </div>

        <BadgesBar plan={plan} />
        <NotesBox />

        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Budget Sync">
            <BudgetSync
              income={income}
              bills={bills}
              onSuggest={(amt) => {
                updateSettings({ ...settings, extraMonthly: amt });
                toast.success(`Set monthly extra to $${amt}`);
              }}
            />
          </Card>
          
          <Card title="Health Alerts">
            <AlertsPanel alerts={alerts} />
          </Card>
        </div>

        <Card title="Scenario Comparison">
          <ScenarioChart debts={debts} settings={settings} />
        </Card>

        <Card title="Payoff Timeline">
          <PayoffChartWithEvents plan={plan} debts={debts} showEvents />
        </Card>

        <InteractiveCalendar
          plan={plan}
          onApply={(oneOffs) => {
            console.log("Apply these one-offs into engine:", oneOffs);
            toast.info(`${oneOffs.length} one-off payments captured (hook to engine as needed)`);
          }}
        />

        <PaymentPlaybook plan={plan} debts={debts} />

        <Card title="Backup & Restore">
          <DataPorter
            getState={() => ({ debts, settings, notes, bills, income, scenarios })}
            setState={(obj) => {
              console.log("Restore payload:", obj);
              toast.success("Backup loaded (wire to context setters as needed)");
            }}
          />
        </Card>
      </div>
    </AppLayout>
  );
}
