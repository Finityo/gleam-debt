import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSharedPlan } from "@/live/api/share";
import { DebtPlan } from "@/lib/computeDebtPlan";
import { Skeleton } from "@/components/ui/skeleton";
import PayoffChartWithEvents from "@/components/PayoffChartWithEvents";
import DashboardSummary from "@/components/DashboardSummary";
import Milestones from "@/components/Milestones";
import BadgesBar from "@/components/BadgesBar";


export default function SharedPlan() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<DebtPlan | null>(null);
  const [debts, setDebts] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [metadata, setMetadata] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!id) return;

      try {
        const snapshot = await getSharedPlan(id);
        setPlan(snapshot.plan as DebtPlan);
        setDebts(snapshot.debts || []);
        setNotes(snapshot.notes || "");
        setMetadata(snapshot.metadata || null);
      } catch (e) {
        setError("Plan not found or expired");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold text-muted-foreground">
            {error || "Plan not found"}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shared Debt Payoff Plan</h1>
      </div>

      <BadgesBar plan={plan} />

      <div className="grid gap-6 md:grid-cols-2">
        <DashboardSummary plan={plan} />
        <Milestones plan={plan} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Payoff Timeline</h2>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">
            Debt-Free Date: <strong>{plan.debtFreeDate}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Total Months: <strong>{plan.summary.finalMonthIndex + 1}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Total Interest: <strong>${plan.totalInterest.toFixed(2)}</strong>
          </p>
        </div>
      </div>

      {notes && (
        <div className="p-4 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      <div className="text-center space-y-1 text-xs text-muted-foreground pt-4 border-t">
        <p>This is a read-only shared plan snapshot</p>
        {metadata?.sharedAt && (
          <p>Shared on {new Date(metadata.sharedAt).toLocaleDateString()}</p>
        )}
        {metadata?.privacySettings?.debtsAnonymized && (
          <p className="text-amber-600 dark:text-amber-400">• Debt names have been anonymized</p>
        )}
        {metadata?.privacySettings?.notesExcluded && (
          <p className="text-amber-600 dark:text-amber-400">• Personal notes excluded</p>
        )}
      </div>
    </div>
  );
}
