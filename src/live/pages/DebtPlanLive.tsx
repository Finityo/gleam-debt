import { usePlanLive } from "../context/PlanContextLive";

export default function DebtPlanLive() {
  const { plan, compute } = usePlanLive();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Live Debt Plan</h1>
      <button onClick={compute} className="bg-blue-600 text-white px-4 py-2 rounded">
        Compute Live Plan
      </button>

      {plan ? (
        <pre className="mt-6 bg-gray-50 p-3 text-xs rounded overflow-auto">
{JSON.stringify(plan.totals, null, 2)}
        </pre>
      ) : (
        <p className="text-gray-600 mt-4">No plan computed yet.</p>
      )}
    </div>
  );
}
