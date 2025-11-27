// ============================================================================
// Finityo — PLAN API
// Unified plan CRUD + compute for LIVE mode
// Works with Lovable Cloud (AppDB)
// ============================================================================

import { AppDB } from "@/live/lovableCloudDB";
import { computeDebtPlanUnified } from "@/engine/unified-engine";
import { supabase } from "@/integrations/supabase/client";
import { uid, hashState, clone } from "@/lib/utils";

export type PlanData = {
  debts: any[];
  settings: any;
  notes: string;
  plan: any;
  updatedAt: string;
  versions?: any[];
  migratedFrom?: string;
  migratedMode?: string;
};

export type VersionRecord = {
  versionId: string;
  createdAt: string;
  debts: any[];
  settings: any;
  plan: any;
  notes: string | null;
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

    const plan = computeDebtPlanUnified({ 
      debts: row.debts, 
      strategy: row.settings?.strategy ?? 'snowball',
      extraMonthly: row.settings?.extraMonthly ?? 0,
      oneTimeExtra: row.settings?.oneTimeExtra ?? 0,
      startDate: row.settings?.startDate ?? new Date().toISOString().slice(0, 10),
      maxMonths: row.settings?.maxMonths
    });
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
    },
    changeDescription?: string
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

    const plan = computeDebtPlanUnified({ 
      debts: merged.debts ?? [], 
      strategy: merged.settings?.strategy ?? 'snowball',
      extraMonthly: merged.settings?.extraMonthly ?? 0,
      oneTimeExtra: merged.settings?.oneTimeExtra ?? 0,
      startDate: merged.settings?.startDate ?? new Date().toISOString().slice(0, 10),
      maxMonths: merged.settings?.maxMonths
    });
    const payload: PlanData = {
      debts: merged.debts,
      settings: merged.settings,
      notes: merged.notes,
      plan,
      updatedAt: nowISO(),
    };

    await AppDB.put(userId, payload);
    
    // Auto-log version after write+compute with description
    await this.logVersion(userId, changeDescription);

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

    const plan = computeDebtPlanUnified({ 
      debts: mergedDebts, 
      strategy: mergedSettings?.strategy ?? 'snowball',
      extraMonthly: mergedSettings?.extraMonthly ?? 0,
      oneTimeExtra: mergedSettings?.oneTimeExtra ?? 0,
      startDate: mergedSettings?.startDate ?? new Date().toISOString().slice(0, 10),
      maxMonths: mergedSettings?.maxMonths
    });

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

    const plan = computeDebtPlanUnified({ 
      debts, 
      strategy: settings?.strategy ?? 'snowball',
      extraMonthly: settings?.extraMonthly ?? 0,
      oneTimeExtra: settings?.oneTimeExtra ?? 0,
      startDate: settings?.startDate ?? new Date().toISOString().slice(0, 10),
      maxMonths: settings?.maxMonths
    });

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

  // -------------------------------------------------------------------------
  // VERSIONING (inline in user_plan_data + separate table for activity log)
  // -------------------------------------------------------------------------
  async logVersion(userId: string, changeDescription?: string): Promise<void> {
    const row = (await AppDB.get(userId)) ?? null;
    if (!row) return;

    const record: VersionRecord = {
      versionId: uid(),
      createdAt: new Date().toISOString(),
      debts: clone(row.debts),
      settings: clone(row.settings),
      plan: clone(row.plan),
      notes: row.notes ?? null,
    };

    const versions = Array.isArray(row.versions) ? row.versions : [];

    // dedupe if nothing changed
    const last = versions[versions.length - 1];
    if (last && hashState(last) === hashState(record)) {
      return; // identical → skip
    }

    // Save to inline versions
    await AppDB.put(userId, {
      ...row,
      versions: [...versions, record],
      updatedAt: new Date().toISOString(),
    });

    // Also save to separate table for activity log
    try {
      await supabase
        .from('user_plan_versions')
        .insert({
          user_id: userId,
          version_id: record.versionId,
          debts: record.debts,
          settings: record.settings,
          plan: record.plan,
          notes: record.notes,
          change_description: changeDescription || 'Plan updated',
        });
    } catch (error) {
      console.error('Error saving version to activity log:', error);
    }
  },

  async listVersions(userId: string): Promise<VersionRecord[]> {
    const row = (await AppDB.get(userId)) ?? null;
    return Array.isArray(row?.versions) ? row.versions : [];
  },

  async restoreVersion(userId: string, versionId: string): Promise<PlanData | null> {
    const row = (await AppDB.get(userId)) ?? null;
    if (!row?.versions) return null;

    const v = row.versions.find((x: any) => x.versionId === versionId);
    if (!v) return null;

    const payload: PlanData = {
      debts: clone(v.debts),
      settings: clone(v.settings),
      notes: v.notes ?? null,
      plan: clone(v.plan),
      updatedAt: new Date().toISOString(),
    };

    await AppDB.put(userId, {
      ...row,
      ...payload,
    });

    return payload;
  },
};
