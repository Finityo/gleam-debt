import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { testDemoComputation } from "@/utils/testDemoComputation";
import { PlanResult } from "@/lib/debtPlan";

/**
 * Demo Test Page - Verify Computation Logic
 * Navigate to /demo-test to run the test
 */
export default function DemoTestPage() {
  const [result, setResult] = useState<PlanResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const runTest = () => {
    // Capture console logs
    const originalLog = console.log;
    const capturedLogs: string[] = [];
    
    console.log = (...args) => {
      capturedLogs.push(args.join(" "));
      originalLog(...args);
    };

    const testResult = testDemoComputation();
    setResult(testResult);
    setLogs(capturedLogs);

    console.log = originalLog;
  };

  useEffect(() => {
    // Auto-run on mount
    runTest();
  }, []);

  if (!result) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Demo Computation Test</h1>
        <Card className="p-6">
          <p>Running test...</p>
        </Card>
      </div>
    );
  }

  const month1 = result.months[0];
  const closedDebts = month1?.payments.filter(p => p.closedThisMonth) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Demo Computation Test Results</h1>
      
      <Button onClick={runTest}>Re-run Test</Button>

      <Card className="p-6 space-y-4">
        <h2 className="text-2xl font-semibold">Plan Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Strategy</div>
            <div className="text-lg font-semibold">{result.strategy}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Months to Debt-Free</div>
            <div className="text-lg font-semibold">{result.totals.monthsToDebtFree}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total Interest</div>
            <div className="text-lg font-semibold">${result.totals.interest.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">One-Time Applied</div>
            <div className="text-lg font-semibold">${result.totals.oneTimeApplied.toFixed(2)}</div>
          </div>
        </div>
      </Card>

      {month1 && (
        <Card className="p-6 space-y-4">
          <h2 className="text-2xl font-semibold">Month 1 Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Principal Paid</div>
              <div className="text-lg font-semibold">${month1.totals.principal.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Interest Accrued</div>
              <div className="text-lg font-semibold">${month1.totals.interest.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Outflow</div>
              <div className="text-lg font-semibold">${month1.totals.outflow.toFixed(2)}</div>
            </div>
          </div>

          {closedDebts.length > 0 && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">✅ Debts Closed in Month 1:</h3>
              <ul className="list-disc list-inside">
                {closedDebts.map(p => (
                  <li key={p.debtId}>{p.debtId} - Paid in Full!</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Per-Debt Details:</h3>
            {month1.payments.map((payment) => (
              <div key={payment.debtId} className="border border-border rounded p-3 space-y-1">
                <div className="font-semibold">{payment.debtId}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Starting: ${payment.startingBalance.toFixed(2)}</div>
                  <div>Ending: ${payment.endingBalance.toFixed(2)}</div>
                  <div>Min: ${payment.minApplied.toFixed(2)}</div>
                  <div>Extra: ${payment.extraApplied.toFixed(2)}</div>
                  <div>Interest: ${payment.interestAccrued.toFixed(2)}</div>
                  <div className={payment.closedThisMonth ? "text-success font-semibold" : ""}>
                    {payment.closedThisMonth ? "✅ CLOSED" : "Open"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Console Logs</h2>
        <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">
          {logs.join("\n")}
        </pre>
      </Card>
    </div>
  );
}
