import * as XLSX from 'xlsx';

// CSV Export utilities for debt data

export type DebtExportRow = {
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
  dueDay?: number;
  dueDate?: string;
  category?: string;
  last4?: string;
  notes?: string;
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
        
        // Skip header row (index 0) and sample row (index 1)
        for (let i = 2; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 3) continue;
          
          const creditor = String(row[0] || "").trim();
          const balance = String(row[1] || "").replace(/[$,]/g, '');
          const apr = String(row[2] || "").replace(/%/g, '');
          const minPayment = String(row[3] || "").replace(/[$,]/g, '');
          const dueDate = row[4] ? String(row[4]).trim() : "";
          const notes = row[5] ? String(row[5]).trim() : "";
          
          // Skip empty rows or sample row
          if (!creditor || creditor === "" || creditor.toLowerCase().includes("sample")) continue;
          
          parsed.push({
            name: creditor,
            balance: parseFloat(balance) || 0,
            apr: parseFloat(apr) || 0,
            minPayment: parseFloat(minPayment) || 0,
            dueDate: dueDate || undefined,
            notes: notes || undefined,
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

// Export template XLSX file for user to fill in
export function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  
  // Create worksheet with headers and sample row
  const data = [
    ["Creditor", "Balance", "APR (%)", "Minimum Payment", "Due Date (MM/DD/YYYY)", "Notes"],
    ["Sample Credit Card", 1200, 19.99, 45, "01/15/2026", "Sample debt — replace with your own"]
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths for better readability
  ws['!cols'] = [
    { wch: 25 },  // Creditor
    { wch: 12 },  // Balance
    { wch: 10 },  // APR
    { wch: 18 },  // Minimum Payment
    { wch: 22 },  // Due Date
    { wch: 40 },  // Notes
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, "Debts");
  XLSX.writeFile(wb, "Finityo_Debt_Import_Template.xlsx");
}

// Export current debts to XLSX
export function exportDebtsToXLSX(debts: DebtExportRow[]) {
  const wb = XLSX.utils.book_new();
  
  const data = [
    ["Creditor", "Balance", "APR (%)", "Minimum Payment", "Due Date (MM/DD/YYYY)", "Notes"],
    ...debts.map(d => [
      d.name,
      d.balance,
      d.apr,
      d.minPayment,
      d.dueDate || "",
      d.notes || ""
    ])
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  ws['!cols'] = [
    { wch: 25 },
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 22 },
    { wch: 40 },
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, "Debts");
  XLSX.writeFile(wb, "Finityo_My_Debts.xlsx");
}
