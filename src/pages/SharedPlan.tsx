import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getSharedPlan, deleteSharedPlan, verifyPin } from "@/live/api/share";
import { DebtPlan } from "@/lib/computeDebtPlan";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PayoffChartWithEvents from "@/components/PayoffChartWithEvents";
import DashboardSummary from "@/components/DashboardSummary";
import Milestones from "@/components/Milestones";
import BadgesBar from "@/components/BadgesBar";
import JournalTimeline from "@/components/JournalTimeline";
import ScenarioCompareChart from "@/components/ScenarioCompareChart";
import { QRCodeSVG } from "qrcode.react";
import { exportPlanToPDF } from "@/lib/export/pdf";
import { exportDebtsToCSV } from "@/lib/export/csv";
import { FileDown, Lock, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { CoachInviteBar } from "@/components/CoachInviteBar";
import { CoachSuggestDrawer } from "@/components/CoachSuggestDrawer";
import { CoachSuggestions } from "@/components/CoachSuggestions";
import { CoachDrawer } from "@/components/CoachDrawer";


export default function SharedPlan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [unsharing, setUnsharing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [pinNeeded, setPinNeeded] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [openCoach, setOpenCoach] = useState(false);

  const coachFromUrl = new URLSearchParams(location.search).get("coach") || "";

  useEffect(() => {
    async function load() {
      if (!id) return;

      try {
        const snapshot = await getSharedPlan(id);
        if (snapshot.requiresPin) {
          setPinNeeded(true);
        } else {
          setData(snapshot);
        }
      } catch (e) {
        setError("Plan not found or expired");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function handlePinSubmit() {
    if (!id) return;
    
    setPinError("");
    try {
      const isValid = await verifyPin(id, pin);
      if (!isValid) {
        setPinError("Incorrect PIN");
        toast.error("Incorrect PIN");
        return;
      }
      
      // Load plan after successful PIN
      const snapshot = await getSharedPlan(id);
      setData(snapshot);
      setPinNeeded(false);
      toast.success("Access granted");
    } catch (e) {
      setPinError("Verification failed");
      toast.error("Verification failed");
    }
  }

  async function handleUnshare() {
    if (!id) return;
    
    try {
      setUnsharing(true);
      await deleteSharedPlan(id);
      toast.success("Share link removed");
      navigate("/");
    } catch (e) {
      console.error("Unshare error:", e);
      toast.error("Failed to remove share");
    } finally {
      setUnsharing(false);
    }
  }

  function handleExportPDF() {
    if (!data) return;
    exportPlanToPDF(data);
    toast.success("PDF exported successfully");
  }

  function handleExportCSV() {
    if (!data) return;
    exportDebtsToCSV(data);
    toast.success("CSV exported successfully");
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (pinNeeded) {
    return (
      <div className="container mx-auto p-8">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-semibold">This plan is protected</h1>
              <p className="text-sm text-muted-foreground">Enter the PIN to view this plan</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              maxLength={8}
              onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
            />
            {pinError && <p className="text-sm text-destructive">{pinError}</p>}
          </div>
          
          <Button onClick={handlePinSubmit} className="w-full">
            View Plan
          </Button>
        </div>
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
  
  // Derive coach drawer inputs
  const monthsCount = plan?.months?.length ?? 0;
  const debtsMini = (debts ?? []).map((d: any) => ({ id: d.id, name: d.name }));

  return (
    <div className="container mx-auto p-8 space-y-6 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Shared Debt Payoff Plan</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Coach Invite */}
      <CoachInviteBar shareId={id!} />

      {/* Coach Suggestions Section */}
      {coachFromUrl && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Main content will go here */}
          </div>
          <div>
            <CoachSuggestions shareId={id!} coachName={coachFromUrl} />
          </div>
        </div>
      )}

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
        <Trash2 className="h-4 w-4 mr-2" />
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

      {/* Floating Coach Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <Button onClick={() => setOpenCoach(true)} size="lg" className="shadow-lg">
          <MessageSquare className="h-5 w-5 mr-2" />
          Coach Notes
        </Button>
      </div>

      {/* Coach Drawer - Mobile Optimized */}
      <CoachDrawer
        planId={id!}
        coachName={coachFromUrl || "Coach"}
        open={openCoach}
        onClose={() => setOpenCoach(false)}
      />
    </div>
  );
}
