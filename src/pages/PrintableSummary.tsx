import React, { useMemo } from "react";
import { useUnifiedPlan } from "@/engine/useUnifiedPlan";

export default function PrintableSummary() {
  const {
    plan,
    orderedDebts,
    totals,
    payoffDateISO,
    months,
  } = useUnifiedPlan();

  const includedDebts = useMemo(() => {
    return (orderedDebts || []).filter(
      (d: any) => d?.include !== false && d?.included !== false
    );
  }, [orderedDebts]);

  const totalStartingBalance = useMemo(() => {
    return includedDebts.reduce(
      (sum: number, d: any) =>
        sum + Number(d.balance ?? d.originalBalance ?? 0),
      0
    );
  }, [includedDebts]);

  const totalInterest = Number(totals?.interest ?? 0);
  const totalPrincipal = Number(totals?.principal ?? 0);
  const monthsToDebtFree = Number(totals?.monthsToDebtFree ?? months?.length ?? 0);

  return (
    <div className="min-h-screen bg-white text-black p-6 print:p-0">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold">Finityo — Printable Debt Summary</h1>
          <p className="text-sm text-gray-600">
            Generated Plan Summary
          </p>
        </header>

        {!plan ? (
          <div className="p-4 border rounded-lg text-center">
            <p className="text-gray-700">No plan available yet. Compute a plan to print this summary.</p>
          </div>
        ) : (
          <>
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Plan Totals</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="border rounded p-3">
                  <div className="text-gray-600">Starting Included Debt</div>
                  <div className="font-semibold">${totalStartingBalance.toLocaleString()}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-gray-600">Total Principal Paid</div>
                  <div className="font-semibold">${totalPrincipal.toLocaleString()}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-gray-600">Total Interest Paid</div>
                  <div className="font-semibold">${totalInterest.toLocaleString()}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-gray-600">Months to Debt Free</div>
                  <div className="font-semibold">{monthsToDebtFree}</div>
                </div>
                <div className="border rounded p-3 col-span-2">
                  <div className="text-gray-600">Estimated Payoff Date</div>
                  <div className="font-semibold">
                    {payoffDateISO ? new Date(payoffDateISO).toLocaleDateString() : "—"}
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Active Debts (Included)</h2>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-2">Creditor</th>
                      <th className="text-left p-2">Balance</th>
                      <th className="text-left p-2">Min Payment</th>
                      <th className="text-left p-2">APR</th>
                      <th className="text-left p-2">Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {includedDebts.map((d: any) => (
                      <tr key={d.id} className="border-t">
                        <td className="p-2">{d.name || d.creditor || "Unnamed Debt"}</td>
                        <td className="p-2">${Number(d.balance ?? d.originalBalance ?? 0).toLocaleString()}</td>
                        <td className="p-2">${Number(d.minPayment ?? d.minimumPayment ?? 0).toLocaleString()}</td>
                        <td className="p-2">{Number(d.apr ?? 0).toFixed(2)}%</td>
                        <td className="p-2">{d.order ?? "—"}</td>
                      </tr>
                    ))}
                    {includedDebts.length === 0 && (
                      <tr className="border-t">
                        <td className="p-2 text-gray-600" colSpan={5}>No included debts found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <footer className="mt-8 pt-4 border-t text-xs text-gray-500">
              <div>Finityo — Debt Simplified.</div>
              <div className="mt-1">This summary is based on your current inputs and plan settings.</div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
