// ============================================================================
// UNIFIED PLAN PROVIDER — DEMO + LIVE
// Finityo — 2025
//
// DEMO MODE  → localStorage only
// LIVE MODE  → debts + debt_calculator_settings (Lovable Cloud)
//
// - Debts
// - Settings
// - Notes
// - Plan (compute)
// - Sync on change
// - Auto-load after login
// ============================================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  Debt,
  UserSettings,
  DebtPlan,
} from "@/lib/computeDebtPlan";

import { computeDebtPlanUnified } from "@/engine/unified-engine";
import type { DebtInput } from "@/engine/plan-types";

import { useAuth } from "@/context/AuthContext";
import { PlanAPI, type VersionRecord } from "@/lib/planAPI";
import {
  loadActivePlan,
  savePlanSettings,
} from "@/lib/planStore";
import { supabase } from "@/integrations/supabase/client";

// ---- local storage helpers (demo only) ----
const LS_KEY = "finityo:planData";
const LS_NOTES = "finityo:notes";

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocal(data: any) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}

function clearLocal() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}

// ============================================================================
// CONTEXT SHAPE
// ============================================================================
type PlanContextType = {
  demoMode: boolean;
  debts: Debt[];
  settings: UserSettings;
  plan: DebtPlan | null;
  notes: string;
  history: VersionRecord[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  setPlan: React.Dispatch<React.SetStateAction<DebtPlan | null>>;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  updateDebts: (next: Debt[]) => Promise<void>;
  updateSettings: (next: Partial<UserSettings>) => Promise<void>;
  compute: () => Promise<void>;
  reset: () => Promise<void>;
  restore: (versionId: string) => Promise<void>;
};

const PlanContext = createContext<PlanContextType | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================
export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const demoMode = !user; // no user = demo

  const [debts, setDebts] = useState<Debt[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    extraMonthly: 0,
    oneTimeExtra: 0,
    strategy: "snowball",
  });
  const [plan, setPlan] = useState<DebtPlan | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [history, setHistory] = useState<VersionRecord[]>([]);

  // Load notes persistence
  useEffect(() => {
    const n = localStorage.getItem(LS_NOTES);
    if (n != null) setNotes(n);
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_NOTES, notes);
  }, [notes]);

  // --------------------------------------------------------------------------
  // LOAD PLAN (DEMO or LIVE)
  // --------------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      // DEMO
      if (demoMode) {
        const saved = loadLocal();
        if (saved) {
          const savedDebts: Debt[] = saved.debts ?? [];
          const savedSettings: UserSettings = saved.settings ?? settings;

          setDebts(savedDebts);
          setSettings(savedSettings);

          const engineDebts: DebtInput[] = savedDebts.map((d) => ({
            ...d,
            include: true,
          }));

          const p = computeDebtPlanUnified({
            debts: engineDebts,
            strategy: savedSettings.strategy || "snowball",
            extraMonthly: savedSettings.extraMonthly || 0,
            oneTimeExtra: savedSettings.oneTimeExtra || 0,
            startDate:
              savedSettings.startDate ||
              new Date().toISOString().slice(0, 10),
            maxMonths: savedSettings.maxMonths,
          });
          setPlan(p);
        }
        return;
      }

      // LIVE - Load from debts table + debt_calculator_settings
      try {
        const snapshot = await loadActivePlan(user!.id);

        // Convert snapshot to local state format
        const loadedDebts: Debt[] = snapshot.debts.map((d: any) => ({
          id: d.id,
          name: d.name,
          balance: d.balance,
          apr: d.apr,
          minPayment: d.minPayment ?? d.min_payment ?? 0,
          category: d.category ?? d.debt_type ?? "",
        }));

        setDebts(loadedDebts);
        setSettings({
          strategy: snapshot.meta.strategy as "snowball" | "avalanche",
          extraMonthly: snapshot.meta.extraMonthly,
          oneTimeExtra: snapshot.meta.oneTimeExtra,
        });
        setNotes(snapshot.notes || "");

        // Compute plan from loaded data
        if (loadedDebts.length > 0) {
          const engineDebts: DebtInput[] = loadedDebts.map((d) => ({
            ...d,
            include: true,
          }));

          const p = computeDebtPlanUnified({
            debts: engineDebts,
            strategy: snapshot.meta.strategy as "snowball" | "avalanche",
            extraMonthly: snapshot.meta.extraMonthly,
            oneTimeExtra: snapshot.meta.oneTimeExtra,
            startDate: new Date().toISOString().slice(0, 10),
          });
          setPlan(p);
        } else {
          setPlan(null);
        }
      } catch (err) {
        console.error("Failed to load plan data:", err);
      }

      // Load version history (still using historical table)
      try {
        const versions = await PlanAPI.listVersions(user!.id);
        setHistory(versions.reverse()); // newest first
      } catch (err) {
        console.error("Failed to load version history:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode, user?.id]);

  // --------------------------------------------------------------------------
  // REALTIME PLAN DATA SYNC (debts table only)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (demoMode || !user?.id) return;

    const channel = supabase
      .channel("plan-data-realtime-full")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "debts",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("📊 Debts changed, reloading...", payload.eventType);
          try {
            const snapshot = await loadActivePlan(user.id);

            const loadedDebts: Debt[] = snapshot.debts.map((d: any) => ({
              id: d.id,
              name: d.name,
              balance: d.balance,
              apr: d.apr,
              minPayment: d.minPayment ?? d.min_payment ?? 0,
              category: d.category ?? d.debt_type ?? "",
            }));

            setDebts(loadedDebts);
            setNotes(snapshot.notes || "");

            if (loadedDebts.length > 0) {
              const engineDebts: DebtInput[] = loadedDebts.map((d) => ({
                ...d,
                include: true,
              }));

              const p = computeDebtPlanUnified({
                debts: engineDebts,
                strategy: settings.strategy || "snowball",
                extraMonthly: settings.extraMonthly || 0,
                oneTimeExtra: settings.oneTimeExtra || 0,
                startDate: new Date().toISOString().slice(0, 10),
              });
              setPlan(p);
            } else {
              setPlan(null);
            }
          } catch (err) {
            console.error("Failed to reload plan data:", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [demoMode, user?.id, settings]);

  // --------------------------------------------------------------------------
  // SAVE PLAN: DEMO → localStorage | LIVE → settings table
  // --------------------------------------------------------------------------
  const persist = useCallback(
    async (
      nextDebts: Debt[],
      nextSettings: UserSettings,
      nextPlan: DebtPlan | null,
      changeDesc?: string
    ) => {
      // DEMO
      if (demoMode) {
        saveLocal({
          debts: nextDebts,
          settings: nextSettings,
        });
        return;
      }

      // LIVE - Save settings to debt_calculator_settings
      try {
        await savePlanSettings(user!.id, {
          strategy: nextSettings.strategy,
          extraPayment: nextSettings.extraMonthly,
          oneTimePayment: nextSettings.oneTimeExtra,
          notes,
        });
        console.log("✅ Settings saved to debt_calculator_settings");
      } catch (err) {
        console.error("Failed to save settings:", err);
      }

      // Note: debts are saved via debts table (Debts page CRUD).
      // Version history still uses PlanAPI + user_plan_versions.
    },
    [demoMode, notes, user?.id]
  );

  // --------------------------------------------------------------------------
  // COMPUTE + SYNC
  // --------------------------------------------------------------------------
  const compute = useCallback(async () => {
    try {
      console.log("🔄 Computing plan with", debts.length, "debts");

      const engineDebts: DebtInput[] = debts.map((d) => ({
        ...d,
        include: true,
      }));

      const p = computeDebtPlanUnified({
        debts: engineDebts,
        strategy: settings.strategy || "snowball",
        extraMonthly: settings.extraMonthly || 0,
        oneTimeExtra: settings.oneTimeExtra || 0,
        startDate:
          settings.startDate || new Date().toISOString().slice(0, 10),
        maxMonths: settings.maxMonths,
      });

      setPlan(p);
      await persist(debts, settings, p);
      console.log("✅ Plan computed successfully");
    } catch (err) {
      console.error("❌ compute error:", err);
    }
  }, [debts, settings, persist]);

  // --------------------------------------------------------------------------
  // UPDATE DEBTS
  // --------------------------------------------------------------------------
  const updateDebts = useCallback(
    async (next: Debt[]) => {
      setDebts(next);
      try {
        const engineDebts: DebtInput[] = next.map((d) => ({
          ...d,
          include: true,
        }));

        const p = computeDebtPlanUnified({
          debts: engineDebts,
          strategy: settings.strategy || "snowball",
          extraMonthly: settings.extraMonthly || 0,
          oneTimeExtra: settings.oneTimeExtra || 0,
          startDate:
            settings.startDate || new Date().toISOString().slice(0, 10),
          maxMonths: settings.maxMonths,
        });
        setPlan(p);
        await persist(next, settings, p, "Updated debts");
      } catch (err) {
        console.error("❌ compute error:", err);
      }
    },
    [settings, persist]
  );

  // --------------------------------------------------------------------------
  // UPDATE SETTINGS
  // --------------------------------------------------------------------------
  const updateSettings = useCallback(
    async (patch: Partial<UserSettings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      try {
        const engineDebts: DebtInput[] = debts.map((d) => ({
          ...d,
          include: true,
        }));

        const p = computeDebtPlanUnified({
          debts: engineDebts,
          strategy: next.strategy || "snowball",
          extraMonthly: next.extraMonthly || 0,
          oneTimeExtra: next.oneTimeExtra || 0,
          startDate:
            next.startDate || new Date().toISOString().slice(0, 10),
          maxMonths: next.maxMonths,
        });
        setPlan(p);
        await persist(debts, next, p, "Updated settings");
      } catch (err) {
        console.error("❌ compute error:", err);
      }
    },
    [debts, settings, persist]
  );

  // --------------------------------------------------------------------------
  // RESET
  // --------------------------------------------------------------------------
  const reset = useCallback(async () => {
    setDebts([]);
    setSettings({
      extraMonthly: 0,
      oneTimeExtra: 0,
      strategy: "snowball",
    });
    setPlan(null);
    setHistory([]);

    if (demoMode) {
      clearLocal();
      return;
    }

    // This still clears historical versions only
    await PlanAPI.clear(user!.id);
  }, [demoMode, user?.id]);

  // --------------------------------------------------------------------------
  // RESTORE VERSION (historical only)
  // --------------------------------------------------------------------------
  const restore = useCallback(
    async (versionId: string) => {
      if (demoMode) {
        console.warn("Version restore not available in demo mode");
        return;
      }

      try {
        const restored = await PlanAPI.restoreVersion(user!.id, versionId);
        if (restored) {
          setDebts(restored.debts ?? []);
          setSettings(
            restored.settings ?? {
              extraMonthly: 0,
              oneTimeExtra: 0,
              strategy: "snowball",
            }
          );
          setNotes(restored.notes ?? "");
          setPlan(restored.plan ?? null);

          const versions = await PlanAPI.listVersions(user!.id);
          setHistory(versions.reverse());
        }
      } catch (err) {
        console.error("Failed to restore version:", err);
        throw err;
      }
    },
    [demoMode, user?.id]
  );

  // --------------------------------------------------------------------------
  // FINAL VALUE
  // --------------------------------------------------------------------------
  return (
    <PlanContext.Provider
      value={{
        demoMode,
        debts,
        settings,
        plan,
        notes,
        history,
        setDebts,
        setSettings,
        setPlan,
        setNotes,
        updateDebts,
        updateSettings,
        compute,
        reset,
        restore,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================
export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used inside <PlanProvider>");
  return ctx;
}
