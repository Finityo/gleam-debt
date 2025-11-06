import { usePlanLive } from "../context/PlanContextLive";

export default function DebtsLive() {
  const { inputs, refreshFromBackend } = usePlanLive();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Live Debts</h1>
      <button onClick={refreshFromBackend} className="bg-emerald-600 text-white px-4 py-2 rounded mb-4">
        Refresh From Backend
      </button>
      {inputs.debts.length ? (
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">Creditor</th>
              <th>Balance</th>
              <th>APR</th>
              <th>Min</th>
            </tr>
          </thead>
          <tbody>
            {inputs.debts.map(d => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>${d.balance.toFixed(2)}</td>
                <td>{d.apr}%</td>
                <td>${d.minPayment.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600">No debts loaded yet.</p>
      )}
    </div>
  );
}
