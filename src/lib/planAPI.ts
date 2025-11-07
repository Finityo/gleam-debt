// ============================================================================
// Finityo — PLAN API
// Unified plan CRUD + compute for LIVE mode
// Works with Lovable Cloud (AppDB)
// ============================================================================

import { AppDB } from "@/live/lovableCloudDB";
import { computeDebtPlan } from "@/lib/computeDebtPlan";
import { supabase } from "@/integrations/supabase/client";

export type PlanData = {
  debts: any[];
  settings: any;
  notes: string;
  plan: any;
  updatedAt: string;
  migratedFrom?: string;
  migratedMode?: string;
};

export type VersionRecord = {
  id: string;
  versionId: string;
  userId: string;
  createdAt: string;
  debts: any[];
  settings: any;
  plan: any;
  notes: string;
  changeDescription?: string;
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

  // -------------------------------------------------------------------------
  // VERSION HISTORY
  // -------------------------------------------------------------------------

  async saveVersion(
    userId: string,
    data: PlanData,
    changeDescription?: string
  ): Promise<VersionRecord> {
    const versionId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const { data: version, error } = await supabase
      .from('user_plan_versions')
      .insert({
        user_id: userId,
        version_id: versionId,
        debts: data.debts as any,
        settings: data.settings as any,
        notes: data.notes,
        plan: data.plan as any,
        change_description: changeDescription,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: version.id,
      versionId: version.version_id,
      userId: version.user_id,
      createdAt: version.created_at,
      debts: version.debts as any,
      settings: version.settings as any,
      plan: version.plan as any,
      notes: version.notes || '',
      changeDescription: version.change_description || undefined,
    };
  },

  async getVersions(userId: string, limit = 50): Promise<VersionRecord[]> {
    const { data, error } = await supabase
      .from('user_plan_versions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((v) => ({
      id: v.id,
      versionId: v.version_id,
      userId: v.user_id,
      createdAt: v.created_at,
      debts: v.debts as any,
      settings: v.settings as any,
      plan: v.plan as any,
      notes: v.notes || '',
      changeDescription: v.change_description || undefined,
    }));
  },

  async getVersion(userId: string, versionId: string): Promise<VersionRecord | null> {
    const { data, error } = await supabase
      .from('user_plan_versions')
      .select('*')
      .eq('user_id', userId)
      .eq('version_id', versionId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      versionId: data.version_id,
      userId: data.user_id,
      createdAt: data.created_at,
      debts: data.debts as any,
      settings: data.settings as any,
      plan: data.plan as any,
      notes: data.notes || '',
      changeDescription: data.change_description || undefined,
    };
  },

  async restoreVersion(userId: string, versionId: string): Promise<PlanData> {
    const version = await this.getVersion(userId, versionId);
    if (!version) throw new Error('Version not found');

    const payload: PlanData = {
      debts: version.debts,
      settings: version.settings,
      notes: version.notes,
      plan: version.plan,
      updatedAt: nowISO(),
    };

    await AppDB.put(userId, payload);
    
    // Save a new version marking this as a restore
    await this.saveVersion(
      userId,
      payload,
      `Restored from version ${version.createdAt}`
    );

    return payload;
  },

  async deleteVersion(userId: string, versionId: string): Promise<void> {
    const { error } = await supabase
      .from('user_plan_versions')
      .delete()
      .eq('user_id', userId)
      .eq('version_id', versionId);

    if (error) throw error;
  },

  async pruneVersions(userId: string, keepCount = 20): Promise<void> {
    const versions = await this.getVersions(userId, 1000);
    if (versions.length <= keepCount) return;

    const toDelete = versions.slice(keepCount);
    for (const version of toDelete) {
      await this.deleteVersion(userId, version.versionId);
    }
  },
};
