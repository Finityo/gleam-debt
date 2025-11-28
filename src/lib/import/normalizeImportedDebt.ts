export function normalizeImportedDebt(row: any) {
  return {
    id: row.id || crypto.randomUUID(),
    name: row.name || "Imported Debt",
    balance: Number(row.balance) || 0,

    // APR normalization: handle decimals OR whole percent
    apr: row.apr > 1 ? Number(row.apr) : Number(row.apr) * 100,

    minPayment: Number(row.minPayment) || 0,
    include: row.include !== "no",
    category: row.category || "",
    dueDay: row.dueDay ? Number(row.dueDay) : undefined,
  };
}
