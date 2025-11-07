import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

// ===============================
// Demo Store (localStorage)
// ===============================
const DEMO_KEYS = {
  debts: "finityo:demoDebts",
  settings: "finityo:demoSettings",
  notes: "finityo:demoNotes",
  plan: "finityo:demoPlan",
};

function readLS<T>(k: string): T | null {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) as T : null;
  } catch {
    return null;
  }
}

function removeLS(k: string) {
  try {
    localStorage.removeItem(k);
  } catch {}
}

export const DemoStore = {
  getAll(): { debts: any[] | null; settings: any | null; notes: any | null; plan: any | null } {
    return {
      debts: readLS(DEMO_KEYS.debts),
      settings: readLS(DEMO_KEYS.settings),
      notes: readLS(DEMO_KEYS.notes),
      plan: readLS(DEMO_KEYS.plan),
    };
  },
  clear() {
    Object.values(DEMO_KEYS).forEach(removeLS);
  },
  hasData(): boolean {
    const a = DemoStore.getAll();
    return !!(a.debts?.length || a.settings || a.notes || a.plan);
  }
};

// =====================================
// useDemoMigration Hook
// =====================================
type Choice = "merge" | "replace" | "fresh" | null;

export function useDemoMigration() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (sessionStorage.getItem("demoChecked")) return;
    if (DemoStore.hasData()) setOpen(true);
    sessionStorage.setItem("demoChecked", "1");
  }, [user]);

  function Modal() {
    return <MigrationModal open={open} onClose={() => setOpen(false)} />;
  }

  return { Modal, open, setOpen };
}

// =====================================
// Migration Modal Component
// =====================================
function MigrationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [choice, setChoice] = useState<Choice>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function runMigration() {
    try {
      setLoading(true);
      const demo = DemoStore.getAll();

      if (choice === "fresh") {
        DemoStore.clear();
        toast({
          title: "Starting fresh",
          description: "Demo data cleared.",
        });
        onClose();
        window.location.href = "/dashboard";
        return;
      }

      // Call edge function to migrate
      const { data, error } = await supabase.functions.invoke("migrate-demo", {
        body: { demo, mode: choice },
      });

      if (error) throw error;

      DemoStore.clear();
      toast({
        title: "Migration complete",
        description: choice === "merge" 
          ? "Demo data merged into your account." 
          : "Demo data replaced your old data.",
      });
      onClose();
      window.location.href = "/dashboard";
    } catch (e: any) {
      toast({
        title: "Migration failed",
        description: e?.message || "Could not migrate demo data.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Bring your demo with you?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We found a demo plan on this device. You can import it into your new account, 
            replace your existing plan, or start fresh.
          </p>

          <RadioGroup value={choice || ""} onValueChange={(v) => setChoice(v as Choice)}>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="merge" id="merge" />
                <Label htmlFor="merge" className="cursor-pointer">
                  <div className="font-medium">Merge with my current plan</div>
                  <div className="text-xs text-muted-foreground">
                    Add demo debts/settings/notes to your existing data.
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="replace" id="replace" />
                <Label htmlFor="replace" className="cursor-pointer">
                  <div className="font-medium">Replace my current plan</div>
                  <div className="text-xs text-muted-foreground">
                    Use the demo as your new source of truth. Previous data will be overwritten.
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="fresh" id="fresh" />
                <Label htmlFor="fresh" className="cursor-pointer">
                  <div className="font-medium">Start fresh</div>
                  <div className="text-xs text-muted-foreground">
                    Discard demo data and continue with a clean slate.
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={runMigration} disabled={!choice || loading}>
              {loading ? "Working…" : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
