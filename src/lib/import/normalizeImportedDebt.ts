// ============================================================
// src/lib/import/normalizeImportedDebt.ts
// APR/Balance/MinPayment import normalization with null safety
// ============================================================

export function normalizeImportedDebt(row: any) {
  return {
    // ✅ HARD ID SAFETY — PREVENTS PHANTOM CARDS
    id: row.id ?? crypto.randomUUID(),
    
    name: row.name || "Imported Debt",
    
    // ✅ BALANCE FIX — NO forced zero, allows null
    balance:
      row.balance === "" || row.balance === null || row.balance === undefined
        ? null
        : Number(row.balance),

    // ✅ APR FIX — NO Boolean fallback, NO forced zero or 1
    apr:
      row.apr === "" || row.apr === null || row.apr === undefined
        ? null
        : Number(row.apr),

    // ✅ MIN PAYMENT FIX — NO forced zero
    minPayment:
      row.minPayment === "" || row.minPayment === null || row.minPayment === undefined
        ? null
        : Number(row.minPayment),

    include: row.include !== "no",
    category: row.category || "",
    dueDay: row.dueDay ? Number(row.dueDay) : undefined,
  };
}
