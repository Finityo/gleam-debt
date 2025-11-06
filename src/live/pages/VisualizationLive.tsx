import { usePlanLive } from "../context/PlanContextLive";

export default function VisualizationLive() {
  const { plan } = usePlanLive();

  if (!plan) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-4">Visualization</h1>
        <p className="text-gray-600">Compute your plan first on the Debt Plan page.</p>
      </div>
    );
  }

  const closed = plan.months[0]?.payments.filter(p => p.closedThisMonth).length ?? 0;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Visualization</h1>
      <p className="text-gray-600 mb-4">
        Start: {plan.startDateISO} — Strategy: {plan.strategy.toUpperCase()} — Months to Debt Free: {plan.totals.monthsToDebtFree}
      </p>
      <div className="rounded border p-4">
        <p>Debts Closed (Month 1): <strong>{closed}</strong></p>
        <p>Total Interest Lifetime: <strong>${plan.totals.interest.toFixed(2)}</strong></p>
      </div>
    </div>
  );
}
