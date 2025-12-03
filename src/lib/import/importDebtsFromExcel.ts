// ============================================================
// FILE: src/lib/import/importDebtsFromExcel.ts
// Excel import orchestration with domain event emission
// Supports both direct import and staged import hydration
// ============================================================

import { emitDomainEvent } from "@/agents/DebtIntegrityAgent";
import { normalizeImportedDebt } from "@/lib/import/normalizeImportedDebt";
import { supabase } from "@/integrations/supabase/client";

/**
 * Direct import from Excel rows (legacy flow).
 * Normalizes, validates, and writes to debts table.
 */
export async function importDebtsFromExcel(rows: any[], userId?: string) {
  // 1) Normalize
  const normalized = rows.map((row) => normalizeImportedDebt(row));

  // 2) Tell the agent a batch arrived
  await emitDomainEvent({
    type: "DebtBatchImported",
    debts: normalized,
    source: "excel",
    userId,
  });

  // 3) If the agent didn't throw, it passed integrity checks
  //    → now write to Lovable Cloud
  if (userId) {
    const { error } = await supabase.from("debts").upsert(
      normalized.map((d) => ({
        id: d.id,
        user_id: userId,
        name: d.name,
        balance: d.balance,
        min_payment: d.minPayment,
        apr: d.apr,
        debt_type: d.category,
        due_date: d.dueDay ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(d.dueDay).padStart(2, "0")}` : null,
      }))
    );

    if (error) throw error;
  }

  return normalized;
}

/**
 * Process a staged import row from debt_imports:
 * - Load unused import row
 * - Normalize payload
 * - Hydrate debts table
 * - Mark import row as used (prevents re-hydration)
 */
export async function hydrateDebtsFromImport(
  userId: string,
  importId: string
): Promise<number> {
  // 1. Load the import row (must be unused)
  const { data: imports, error: importErr } = await supabase
    .from("debt_imports")
    .select("*")
    .eq("id", importId)
    .eq("user_id", userId)
    .eq("used", false)
    .limit(1);

  if (importErr) {
    console.error("hydrateDebtsFromImport: load error", importErr);
    throw importErr;
  }

  const importRow = imports?.[0];
  if (!importRow) {
    throw new Error("Import row not found or already used.");
  }

  // 2. Normalize raw payload → array of normalized debts
  const rawData = importRow.raw_data as any[];
  
  if (!Array.isArray(rawData) || !rawData.length) {
    throw new Error("No debts found in import payload.");
  }

  const normalizedDebts = rawData.map((row) => normalizeImportedDebt(row));

  // 3. Emit domain event for validation
  await emitDomainEvent({
    type: "DebtBatchImported",
    debts: normalizedDebts,
    source: (importRow.source as "excel" | "plaid") || "excel",
    userId,
  });

  // 4. Insert normalized debts into debts table
  const { error: insertErr } = await supabase.from("debts").insert(
    normalizedDebts.map((d) => ({
      id: d.id,
      user_id: userId,
      name: d.name,
      balance: d.balance,
      min_payment: d.minPayment,
      apr: d.apr,
      debt_type: d.category || null,
      due_date: d.dueDay ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(d.dueDay).padStart(2, "0")}` : null,
    }))
  );

  if (insertErr) {
    console.error("hydrateDebtsFromImport: insert error", insertErr);
    throw insertErr;
  }

  // 5. Mark import row as used so it can NEVER re-seed
  const { error: usedErr } = await supabase
    .from("debt_imports")
    .update({ used: true })
    .eq("id", importId);

  if (usedErr) {
    console.error("hydrateDebtsFromImport: mark used error", usedErr);
    throw usedErr;
  }

  return normalizedDebts.length;
}

/**
 * Stage an import for later hydration.
 * Creates a debt_imports row with used = false.
 * Returns the import ID for subsequent hydration.
 */
export async function stageImportForHydration(
  userId: string,
  rawData: any[],
  source: "excel" | "plaid" | "manual" = "excel"
): Promise<string> {
  const { data, error } = await supabase
    .from("debt_imports")
    .insert({
      user_id: userId,
      raw_data: rawData,
      source,
      used: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("stageImportForHydration: error", error);
    throw error;
  }

  return data.id;
}

/**
 * Get all unused imports for a user (for UI display/selection).
 */
export async function getUnusedImports(userId: string) {
  const { data, error } = await supabase
    .from("debt_imports")
    .select("*")
    .eq("user_id", userId)
    .eq("used", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUnusedImports: error", error);
    throw error;
  }

  return data || [];
}
