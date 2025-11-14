import * as XLSX from 'xlsx';

// CSV Export utilities for debt data

export type DebtExportRow = {
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
  dueDay?: number;
  category?: string;
  last4?: string;
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

export async function parseExcelFile(file: File): Promise<DebtExportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        
        const parsed: DebtExportRow[] = [];
        
        // Skip header row (first row)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 3) continue;
          
          const name = String(row[0] || "").trim();
          const last4 = String(row[1] || "").trim();
          const balance = String(row[2] || "").replace(/[$,]/g, '');
          const minPayment = String(row[3] || "").replace(/[$,]/g, '');
          const apr = String(row[4] || "").replace(/%/g, '');
          
          if (!name || name === "") continue;
          
          parsed.push({
            name,
            last4,
            balance: parseFloat(balance) || 0,
            minPayment: parseFloat(minPayment) || 0,
            apr: parseFloat(apr) || 0,
          });
        }
        
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsBinaryString(file);
  });
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
