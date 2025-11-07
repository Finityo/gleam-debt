import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSharedPlan, deleteSharedPlan } from "@/live/api/share";
import { DebtPlan } from "@/lib/computeDebtPlan";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import PayoffChartWithEvents from "@/components/PayoffChartWithEvents";
import DashboardSummary from "@/components/DashboardSummary";
import Milestones from "@/components/Milestones";
import BadgesBar from "@/components/BadgesBar";
import JournalTimeline from "@/components/JournalTimeline";
import ScenarioCompareChart from "@/components/ScenarioCompareChart";
import { QRCodeSVG } from "qrcode.react";


export default function SharedPlan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [unsharing, setUnsharing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!id) return;

      try {
        const snapshot = await getSharedPlan(id);
        setData(snapshot);
      } catch (e) {
        setError("Plan not found or expired");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function handleUnshare() {
    if (!id) return;
    
    try {
      setUnsharing(true);
      await deleteSharedPlan(id);
      navigate("/");
    } catch (e) {
      console.error("Unshare error:", e);
    } finally {
      setUnsharing(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
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

  const {
    plan,
    debts,
    settings,
    notes,
    badges,
    metadata,
    createdAt,
    expiresAt,
    includeNotes = true,
  } = data;

  // Check expiration
  const expired = expiresAt && new Date(expiresAt).getTime() < Date.now();

  if (expired) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold text-muted-foreground">
            Link expired
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            This shared plan is no longer available.
          </p>
        </div>
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/p/${id}`;

  return (
    <div className="container mx-auto p-8 space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shared Debt Payoff Plan</h1>
      </div>

      {/* Share metadata */}
      <div className="text-xs text-muted-foreground space-y-1">
        {createdAt && <div>Shared: {new Date(createdAt).toLocaleString()}</div>}
        {expiresAt && <div>Expires: {new Date(expiresAt).toLocaleString()}</div>}
        <div>Read-only view</div>
      </div>

      {badges?.length > 0 && <BadgesBar plan={plan} />}

      <div className="grid gap-6 md:grid-cols-2">
        <DashboardSummary plan={plan} />
        <Milestones plan={plan} />
      </div>

      {/* Scenario Comparison */}
      {debts?.length > 0 && settings && (
        <ScenarioCompareChart debts={debts} settings={settings} />
      )}

      {/* Payoff Chart */}
      <PayoffChartWithEvents plan={plan} debts={debts} showEvents={true} />

      {/* Journal Timeline */}
      <JournalTimeline plan={plan} debts={debts} />

      {/* Notes (privacy controlled) */}
      {includeNotes && notes && (
        <div className="p-4 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {/* QR Code */}
      <div className="p-4 border rounded-lg bg-card space-y-2">
        <div className="text-sm font-medium">Share this link</div>
        <div className="flex items-center gap-4">
          <QRCodeSVG value={publicUrl} size={120} />
          <div className="text-xs break-all text-muted-foreground flex-1">{publicUrl}</div>
        </div>
      </div>

      {/* Unshare Button */}
      <Button
        onClick={handleUnshare}
        disabled={unsharing}
        variant="destructive"
        size="sm"
      >
        {unsharing ? "Removing..." : "Unshare / Remove Link"}
      </Button>

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
