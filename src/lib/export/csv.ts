import * as XLSX from "xlsx";

/**
 * Export shared plan debts to CSV
 */
export function exportDebtsToCSV(data: any) {
  const rows: any[][] = [["Name", "Balance", "APR", "Min Payment", "Type"]];
  
  (data.debts || []).forEach((debt: any) => {
    rows.push([
      debt.name || "",
      debt.balance?.toFixed(2) || "0.00",
      debt.apr?.toFixed(2) || "0.00",
      debt.minPayment?.toFixed(2) || "0.00",
      debt.debt_type || "personal",
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Debts");
  XLSX.writeFile(wb, "Finityo_Debts.csv");
}
