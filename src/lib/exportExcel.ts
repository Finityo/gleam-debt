// ===================================
// src/lib/exportExcel.ts
// ===================================
import * as XLSX from "xlsx";
import { Debt, UserSettings, DebtPlan } from "@/lib/computeDebtPlan";
import { remainingByMonth } from "@/lib/remaining";
import { getPayoffOrder } from "@/lib/payoffOrder";
import { computeMinimumOnly } from "@/lib/computeMinimumOnly";
import { comparePlans } from "@/lib/comparePlans";

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

  // ---- Sheet 2: Settings (with Comparison) ----
  const minPlan = computeMinimumOnly(debts);
  const comparison = comparePlans(plan, minPlan);

  const settingsSheetData = [
    ["Field", "Value"],
    ["Strategy", settings.strategy],
    ["Extra Monthly", settings.extraMonthly],
    ["One-time Extra (Month 1)", settings.oneTimeExtra],
    [""], // Empty row
    ["COMPARISON VS MINIMUM-ONLY", ""],
    ["Your Debt-Free Date", comparison.debtFreeDateReal],
    ["Minimum-Only Debt-Free Date", comparison.debtFreeDateMin],
    ["Months Saved", comparison.monthsSaved],
    ["Your Total Interest", `$${comparison.interestReal.toFixed(2)}`],
    ["Minimum-Only Total Interest", `$${comparison.interestMin.toFixed(2)}`],
    ["Interest Saved", `$${comparison.interestSaved.toFixed(2)}`],
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
    "Remaining (total)",
    "Total Paid (mo)",
    "Total Interest (mo)",
  ]);

  const remain = remainingByMonth(plan);

  plan.months.forEach((m) => {
    const rem = remain[m.monthIndex]?.remaining ?? 0;

    m.payments.forEach((p) => {
      planSheetData.push([
        m.monthIndex + 1,
        p.debtId,
        p.paid,
        p.interest,
        p.principal,
        p.balanceEnd,
        rem,
        m.totalPaid,
        m.totalInterest,
      ]);
    });
  });

  const planWS = XLSX.utils.aoa_to_sheet(planSheetData);

  // ---- Sheet 4: Payoff Order ----
  const payoffOrder = getPayoffOrder(plan);
  const payoffOrderSheetData: any[] = [
    ["Order", "Debt ID", "Debt Name", "Paid Off in Month"],
  ];

  payoffOrder.forEach((item, index) => {
    const debt = debts.find((d) => d.id === item.debtId);
    payoffOrderSheetData.push([
      index + 1,
      item.debtId,
      debt?.name || "Unknown",
      item.monthIndex,
    ]);
  });

  const payoffOrderWS = XLSX.utils.aoa_to_sheet(payoffOrderSheetData);

  // ---- Build workbook ----
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, debtsWS, "Debts");
  XLSX.utils.book_append_sheet(wb, settingsWS, "Settings");
  XLSX.utils.book_append_sheet(wb, planWS, "Plan");
  XLSX.utils.book_append_sheet(wb, payoffOrderWS, "Payoff Order");

  // ---- Trigger download ----
  XLSX.writeFile(wb, "finityo_payoff_plan.xlsx");
}
