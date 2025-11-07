// ============================================================================
// UNIFIED PLAN PROVIDER — DEMO + LIVE
// Finityo — 2025
//
// DEMO MODE  → localStorage only
// LIVE MODE  → AppDB (Lovable Cloud) + fallback local
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
  useCallback
} from "react";

import {
  Debt,
  UserSettings,
  DebtPlan,
  computeDebtPlan,
} from "@/lib/computeDebtPlan";

import { useAuth } from "@/context/AuthContext";
import { PlanAPI } from "@/lib/planAPI";

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
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  setPlan: React.Dispatch<React.SetStateAction<DebtPlan | null>>;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  updateDebts: (next: Debt[]) => Promise<void>;
  updateSettings: (next: Partial<UserSettings>) => Promise<void>;
  compute: () => Promise<void>;
  reset: () => Promise<void>;
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
          setDebts(saved.debts ?? []);
          setSettings(saved.settings ?? settings);
          const p = computeDebtPlan(saved.debts ?? [], saved.settings ?? settings);
          setPlan(p);
        }
        return;
      }

      // LIVE
      const row = await PlanAPI.get(user.id);
      if (row) {
        setDebts(row.debts ?? []);
        setSettings(row.settings ?? settings);
        setNotes(row.notes ?? "");
        setPlan(row.plan ?? null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode, user?.id]);


  // --------------------------------------------------------------------------
  // SAVE PLAN: DEMO → localStorage | LIVE → PlanAPI.save + smart auto-version
  // --------------------------------------------------------------------------
  const persist = useCallback(
    async (nextDebts: Debt[], nextSettings: UserSettings, nextPlan: DebtPlan | null, changeDesc?: string) => {
      // DEMO
      if (demoMode) {
        saveLocal({
          debts: nextDebts,
          settings: nextSettings,
        });
        return;
      }

      // LIVE
      const planData = {
        debts: nextDebts,
        settings: nextSettings,
        notes,
        plan: nextPlan,
        updatedAt: new Date().toISOString(),
      };

      await PlanAPI.save(user.id, planData);

      // Auto-log version (deduplication handled internally)
      if (changeDesc) {
        try {
          await PlanAPI.logVersion(user.id);
          console.log('✅ Version logged:', changeDesc);
        } catch (err) {
          console.error('Failed to log version:', err);
        }
      }
    },
    [demoMode, notes, user?.id]
  );


  // --------------------------------------------------------------------------
  // COMPUTE + SYNC
  // --------------------------------------------------------------------------
  const compute = useCallback(async () => {
    try {
      const p = computeDebtPlan(debts, settings);
      setPlan(p);
      await persist(debts, settings, p);
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
        const p = computeDebtPlan(next, settings);
        setPlan(p);
        await persist(next, settings, p, 'Updated debts');
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
        const p = computeDebtPlan(debts, next);
        setPlan(p);
        await persist(debts, next, p, 'Updated settings');
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

    if (demoMode) {
      clearLocal();
      return;
    }

    await PlanAPI.clear(user.id);
  }, [demoMode, user?.id]);


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
        setDebts,
        setSettings,
        setPlan,
        setNotes,
        updateDebts,
        updateSettings,
        compute,
        reset,
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
