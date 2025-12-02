// ============================================================
// FILE: src/lib/import/importDebtsFromExcel.ts
// Excel import orchestration with domain event emission
// ============================================================

import { emitDomainEvent } from "@/domain/domainEvents";
import { normalizeImportedDebt } from "@/lib/import/normalizeImportedDebt";
import { supabase } from "@/integrations/supabase/client";

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
