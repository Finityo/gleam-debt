// ===================================
// src/lib/exportExcel.ts
// ===================================
import * as XLSX from "xlsx";
import { Debt, UserSettings, DebtPlan } from "@/lib/computeDebtPlan";

export function exportPlanToExcel(
  debts: Debt[],
  settings: UserSettings,
  plan: DebtPlan
) {
  // ---- Sheet 1: Debts ----
  const debtsSheetData = [
    ["ID", "Name", "Balance", "APR", "Min Payment", "Due Day", "Include"],
    ...debts.map((d) => [
      d.id,
      d.name,
      d.balance,
      d.apr,
      d.minPayment,
      d.dueDay ?? "",
      d.include ?? true,
    ]),
  ];
  const debtsWS = XLSX.utils.aoa_to_sheet(debtsSheetData);

  // ---- Sheet 2: Settings ----
  const settingsSheetData = [
    ["Field", "Value"],
    ["Strategy", settings.strategy],
    ["Extra Monthly", settings.extraMonthly],
    ["One-time Extra (Month 1)", settings.oneTimeExtra],
  ];
  const settingsWS = XLSX.utils.aoa_to_sheet(settingsSheetData);

  // ---- Sheet 3: Plan ----
  // Each month → totals + per-debt breakdown
  const planSheetData: any[] = [];

  planSheetData.push([
    "Month",
    "Debt ID",
    "Paid",
    "Interest",
    "Principal",
    "Ending Balance",
    "Total Paid (mo)",
    "Total Interest (mo)",
  ]);

  plan.months.forEach((m) => {
    m.payments.forEach((p) => {
      planSheetData.push([
        m.monthIndex + 1,
        p.debtId,
        p.paid,
        p.interest,
        p.principal,
        p.balanceEnd,
        m.totalPaid,
        m.totalInterest,
      ]);
    });
  });

  const planWS = XLSX.utils.aoa_to_sheet(planSheetData);

  // ---- Build workbook ----
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, debtsWS, "Debts");
  XLSX.utils.book_append_sheet(wb, settingsWS, "Settings");
  XLSX.utils.book_append_sheet(wb, planWS, "Plan");

  // ---- Trigger download ----
  XLSX.writeFile(wb, "finityo_payoff_plan.xlsx");
}
