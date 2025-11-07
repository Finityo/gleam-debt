// ============================================================================
// Finityo — PLAN API
// Unified plan CRUD + compute for LIVE mode
// Works with Lovable Cloud (AppDB)
// ============================================================================

import { AppDB } from "@/live/lovableCloudDB";
import { computeDebtPlan } from "@/lib/computeDebtPlan";

export type PlanData = {
  debts: any[];
  settings: any;
  notes: string;
  plan: any;
  updatedAt: string;
  migratedFrom?: string;
  migratedMode?: string;
};

function nowISO() {
  return new Date().toISOString();
}

export const PlanAPI = {
  // -------------------------------------------------------------------------
  // GET USER PLAN
  // -------------------------------------------------------------------------
  async get(userId: string): Promise<PlanData | null> {
    return (await AppDB.get(userId)) ?? null;
  },

  // -------------------------------------------------------------------------
  // SAVE (no recompute)
  // (use if plan already computed by client or server)
  // -------------------------------------------------------------------------
  async save(userId: string, data: Partial<PlanData>): Promise<void> {
    const prev = (await AppDB.get(userId)) ?? {
      debts: [],
      settings: { extraMonthly: 0, oneTimeExtra: 0, strategy: 'snowball' },
      notes: '',
      plan: null,
      updatedAt: nowISO(),
    };
    await AppDB.put(userId, {
      ...prev,
      ...data,
      updatedAt: nowISO(),
    } as any);
  },

  // -------------------------------------------------------------------------
  // COMPUTE + SAVE
  // canonical server compute
  // -------------------------------------------------------------------------
  async compute(userId: string): Promise<PlanData> {
    const row = (await AppDB.get(userId)) ?? {
      debts: [],
      settings: { extraMonthly: 0, oneTimeExtra: 0, strategy: 'snowball' },
      notes: '',
      plan: null,
      updatedAt: nowISO(),
    };

    const plan = computeDebtPlan(row.debts, row.settings);
    const payload: PlanData = {
      debts: row.debts,
      settings: row.settings,
      notes: row.notes,
      plan,
      updatedAt: nowISO(),
    };

    await AppDB.put(userId, payload);
    return payload;
  },

  // -------------------------------------------------------------------------
  // SAVE ALL (debts + settings + notes) + compute
  // (good for UI updates)
  // -------------------------------------------------------------------------
  async writeAndCompute(
    userId: string,
    next: {
      debts?: any[];
      settings?: any;
      notes?: string;
    }
  ): Promise<PlanData> {
    const prev = (await AppDB.get(userId)) ?? {
      debts: [],
      settings: { extraMonthly: 0, oneTimeExtra: 0, strategy: 'snowball' },
      notes: '',
      plan: null,
      updatedAt: nowISO(),
    };

    const merged = {
      debts: next.debts ?? prev.debts,
      settings: next.settings ?? prev.settings,
      notes: next.notes ?? prev.notes,
    };

    const plan = computeDebtPlan(merged.debts ?? [], merged.settings ?? {});
    const payload: PlanData = {
      debts: merged.debts,
      settings: merged.settings,
      notes: merged.notes,
      plan,
      updatedAt: nowISO(),
    };

    await AppDB.put(userId, payload);
    return payload;
  },

  // -------------------------------------------------------------------------
  // CLEAR plan (reset to defaults)
  // -------------------------------------------------------------------------
  async clear(userId: string): Promise<void> {
    const payload: PlanData = {
      debts: [],
      settings: {
        extraMonthly: 0,
        oneTimeExtra: 0,
        strategy: "snowball",
      },
      notes: "",
      plan: null,
      updatedAt: nowISO(),
    };
    await AppDB.put(userId, payload);
  },

  // -------------------------------------------------------------------------
  // MIGRATION HELPERS
  // merge → dedupe + union debts, shallow-merge settings
  // replace → overwrite
  // -------------------------------------------------------------------------

  async merge(userId: string, incoming: PlanData): Promise<PlanData> {
    const current = (await AppDB.get(userId)) ?? {
      debts: [],
      settings: { extraMonthly: 0, oneTimeExtra: 0, strategy: 'snowball' },
      notes: '',
      plan: null,
      updatedAt: nowISO(),
    };

    // debt signature to detect dupes
    const sig = (d: any) =>
      `${d.name}|${Math.round(d.balance)}|${Math.round(d.apr * 100)}`;

    const seen = new Set(current.debts.map(sig));

    const mergedDebts = [
      ...current.debts,
      ...(incoming.debts ?? []).filter((d: any) => {
        const s = sig(d);
        if (seen.has(s)) return false;
        seen.add(s);
        return true;
      }),
    ];

    const mergedSettings = {
      ...current.settings,
      ...(incoming.settings ?? {}),
    };

    const mergedNotes = incoming.notes || current.notes || '';

    const plan = computeDebtPlan(mergedDebts, mergedSettings);

    const payload: PlanData = {
      debts: mergedDebts,
      settings: mergedSettings,
      notes: mergedNotes,
      plan,
      updatedAt: nowISO(),
      migratedFrom: incoming.migratedFrom ?? "demo",
      migratedMode: "merge",
    };

    await AppDB.put(userId, payload);
    return payload;
  },

  async replace(userId: string, incoming: PlanData): Promise<PlanData> {
    const debts = incoming.debts ?? [];
    const settings = incoming.settings ?? {
      extraMonthly: 0,
      oneTimeExtra: 0,
      strategy: "snowball",
    };
    const notes = incoming.notes || '';

    const plan = computeDebtPlan(debts, settings);

    const payload: PlanData = {
      debts,
      settings,
      notes,
      plan,
      updatedAt: nowISO(),
      migratedFrom: incoming.migratedFrom ?? "demo",
      migratedMode: "replace",
    };

    await AppDB.put(userId, payload);
    return payload;
  },
};
