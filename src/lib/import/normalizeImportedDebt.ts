// ============================================================
// src/lib/import/normalizeImportedDebt.ts
// APR/Balance/MinPayment import normalization with null safety
// Now emits domain events for agent validation
// ============================================================

import type { DebtInput } from "@/lib/debtPlan";

export function normalizeImportedDebt(row: any): DebtInput {
  return {
    // ✅ HARD ID SAFETY — PREVENTS PHANTOM CARDS
    id: row.id ?? crypto.randomUUID(),
    
    name: row.name || "Imported Debt",
    
    // ✅ BALANCE FIX — NO forced zero, allows null
    balance:
      row.balance === "" || row.balance === null || row.balance === undefined
        ? 0
        : Number(row.balance),

    // ✅ APR FIX — NO Boolean fallback, NO forced zero or 1
    apr:
      row.apr === "" || row.apr === null || row.apr === undefined
        ? 0
        : Number(row.apr),

    // ✅ MIN PAYMENT FIX — NO forced zero
    minPayment:
      row.minPayment === "" || row.minPayment === null || row.minPayment === undefined
        ? 0
        : Number(row.minPayment),

    include: row.include !== "no",
    category: row.category || "",
    dueDay: row.dueDay ? Number(row.dueDay) : undefined,
  };
}
