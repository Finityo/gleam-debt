export function normalizeImportedDebt(row: any) {
  return {
    id: row.id || crypto.randomUUID(),
    name: row.name || "Imported Debt",
    balance: Number(row.balance) || 0,

    // Store APR EXACTLY AS USER ENTERED (real percent, not decimal)
    apr: Number(row.apr) || 0,

    minPayment: Number(row.minPayment) || 0,
    include: row.include !== "no",
    category: row.category || "",
    dueDay: row.dueDay ? Number(row.dueDay) : undefined,
  };
}
