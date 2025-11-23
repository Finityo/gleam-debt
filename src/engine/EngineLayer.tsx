// ============================================================================
// FILE: src/engine/EngineLayer.tsx
// ============================================================================
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DebtEngineProvider, useDebtEngine } from "@/engine/DebtEngineContext";
import { useAuth } from "@/context/AuthContext";
import { PlanAPI } from "@/lib/planAPI";
import type { DebtInput, Strategy } from "@/engine/plan-types";

const DEMO_KEY = "finityo_demo_plan_v1";

type NotesCtx = { notes: string; setNotes: (n: string) => void };
const NotesContext = createContext<NotesCtx | null>(null);

type PlanCompat = {
  debts: DebtInput[];
  settings: {
    strategy: Strategy;
    extraMonthly: number;
    oneTimeExtra: number;
    startDate: string;
    maxMonths: number;
  };
  plan: any;
  history: any[];
  updateDebts: (next: DebtInput[]) => Promise<void>;
  updateSettings: (patch: any) => Promise<void>;
  restore: (versionId: string) => Promise<void>;
  recompute: () => void;
  reset: () => void;
};

const PlanCompatContext = createContext<PlanCompat | null>(null);

function PersistBridge({ userId }: { userId?: string }) {
  const { debtsUsed, settingsUsed, plan, setDebts, setSettings, recompute, reset } = useDebtEngine();
  const { notes } = useNotes();
  const [history, setHistory] = useState<any[]>([]);
  const prevRef = useRef<string>("");

  // load history in live mode
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const versions = await PlanAPI.listVersions(userId);
        setHistory(versions.reverse());
      } catch (e) {
        console.error("Failed to load versions:", e);
      }
    })();
  }, [userId]);

  // persist demo or live on changes (debounced by string compare)
  useEffect(() => {
    const payload = JSON.stringify({ debtsUsed, settingsUsed, notes });
    if (payload === prevRef.current) return;
    prevRef.current = payload;

    const run = async () => {
      if (!userId) {
        localStorage.setItem(DEMO_KEY, payload);
        return;
      }
      try {
        await PlanAPI.save(userId, {
          debts: debtsUsed,
          settings: settingsUsed,
          notes,
          plan,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.error("Persist failed:", e);
      }
    };
    run();
  }, [debtsUsed, settingsUsed, notes, plan, userId]);

  const compatValue: PlanCompat = useMemo(() => ({
    debts: debtsUsed,
    settings: settingsUsed,
    plan,
    history,
    updateDebts: async (next) => { setDebts(next); recompute(); },
    updateSettings: async (patch) => { setSettings(patch); recompute(); },
    restore: async (versionId) => {
      if (!userId) return;
      const restored = await PlanAPI.restoreVersion(userId, versionId);
      if (restored) {
        setDebts(restored.debts ?? []);
        setSettings(restored.settings ?? settingsUsed);
        recompute();
        const versions = await PlanAPI.listVersions(userId);
        setHistory(versions.reverse());
      }
    },
    recompute,
    reset,
  }), [debtsUsed, settingsUsed, plan, history, userId, setDebts, setSettings, recompute, reset]);

  return (
    <PlanCompatContext.Provider value={compatValue}>
      {/* children are already rendered by EngineLayer */}
    </PlanCompatContext.Provider>
  );
}

export function EngineLayer({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [initialDebts, setInitialDebts] = useState<DebtInput[]>([]);
  const [initialSettings, setInitialSettings] = useState<any>({});
  const [notes, setNotes] = useState("");

  // initial load
  useEffect(() => {
    (async () => {
      // demo
      if (!userId) {
        const raw = localStorage.getItem(DEMO_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setInitialDebts(parsed.debtsUsed ?? []);
          setInitialSettings(parsed.settingsUsed ?? {});
          setNotes(parsed.notes ?? "");
        }
        return;
      }

      // live
      const row = await PlanAPI.get(userId);
      if (row) {
        setInitialDebts(row.debts ?? []);
        setInitialSettings(row.settings ?? {});
        setNotes(row.notes ?? "");
      }
    })();
  }, [userId]);

  return (
    <NotesContext.Provider value={{ notes, setNotes }}>
      <DebtEngineProvider initialDebts={initialDebts} initialSettings={initialSettings}>
        <PersistBridge userId={userId} />
        {children}
      </DebtEngineProvider>
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used inside EngineLayer");
  return ctx;
}

export function usePlanCompat() {
  const ctx = useContext(PlanCompatContext);
  if (!ctx) throw new Error("usePlanCompat must be used inside EngineLayer");
  return ctx;
}
