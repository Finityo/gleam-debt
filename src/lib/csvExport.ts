// CSV Export utilities for debt data

export type DebtExportRow = {
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
  dueDay?: number;
  category?: string;
};

export function debtToCSV(debts: DebtExportRow[]): string {
  const headers = "Name,Balance,APR,Min Payment,Due Day,Category";
  const rows = debts.map(d => 
    [
      d.name,
      d.balance,
      d.apr,
      d.minPayment,
      d.dueDay ?? "",
      d.category ?? ""
    ].join(",")
  ).join("\n");
  return `${headers}\n${rows}`;
}

export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseExcelPaste(pasteText: string): DebtExportRow[] {
  const lines = pasteText.trim().split(/\r?\n/);
  const parsed: DebtExportRow[] = [];

  for (const line of lines) {
    const cols = line.split(/\t|,/);
    if (cols.length < 3) continue;

    const [name, balance, apr, minPay, dueDay, category] = cols;
    parsed.push({
      name: name?.trim() || "Unnamed Debt",
      balance: Number(balance || 0),
      apr: Number(apr || 0),
      minPayment: Number(minPay || 0),
      dueDay: dueDay ? Number(dueDay) : undefined,
      category: category?.trim() || undefined
    });
  }

  return parsed;
}
