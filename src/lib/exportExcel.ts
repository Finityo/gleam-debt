// ===================================
// src/lib/exportExcel.ts
// ===================================
import * as XLSX from "xlsx";
import { Debt, UserSettings, DebtPlan } from "@/lib/computeDebtPlan";
import { remainingByMonth } from "@/lib/remaining";
import { getPayoffOrder } from "@/lib/payoffOrder";
import { computeMinimumOnly } from "@/lib/computeMinimumOnly";
import { comparePlans } from "@/lib/comparePlans";
import { getMilestones } from "@/lib/milestones";

export function exportPlanToExcel(
  debts: Debt[],
  settings: UserSettings,
  plan: DebtPlan,
  notes?: string
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
  const cmp = comparePlans(plan, minPlan);

  const settingsSheetData = [
    ["Field", "Value"],
    ["Strategy", settings.strategy],
    ["Extra Monthly", settings.extraMonthly],
    ["One-time Extra (Month 1)", settings.oneTimeExtra],
    [],
    ["== Minimum-Only Comparison ==", ""],
    ["Debt-Free (Plan)", cmp.debtFreeDateReal],
    ["Debt-Free (Min Only)", cmp.debtFreeDateMin],
    ["Months Saved", cmp.monthsSaved],
    ["Interest (Plan)", cmp.interestReal],
    ["Interest (Min Only)", cmp.interestMin],
    ["Interest Saved", cmp.interestSaved],
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
  const payoff = getPayoffOrder(plan);
  const nameMap = Object.fromEntries(debts.map((d) => [d.id, d.name]));

  const payoffSheetData = [
    ["Rank", "Debt", "Month Paid"],
    ...payoff.map((p, i) => [
      i + 1,
      nameMap[p.debtId] || p.debtId,
      p.monthIndex,
    ]),
  ];

  const payoffWS = XLSX.utils.aoa_to_sheet(payoffSheetData);

  // ---- Sheet 5: Milestones ----
  const ms = getMilestones(plan);

  const milestoneSheetData = [
    ["Milestone", "Month", "Remaining"],
    ...ms.map((m) => [
      m.label,
      m.monthIndex + 1,
      m.remaining,
    ]),
  ];

  const milestoneWS = XLSX.utils.aoa_to_sheet(milestoneSheetData);

  // ---- Sheet 6: Notes ----
  const notesSheetData = [
    ["Notes"],
    ...(notes ? notes.split("\n").map((line) => [line]) : [[""]]),
  ];

  const notesWS = XLSX.utils.aoa_to_sheet(notesSheetData);

  // ---- Build workbook ----
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, debtsWS, "Debts");
  XLSX.utils.book_append_sheet(wb, settingsWS, "Settings");
  XLSX.utils.book_append_sheet(wb, planWS, "Plan");
  XLSX.utils.book_append_sheet(wb, payoffWS, "Payoff Order");
  XLSX.utils.book_append_sheet(wb, milestoneWS, "Milestones");
  XLSX.utils.book_append_sheet(wb, notesWS, "Notes");

  // ---- Trigger download ----
  XLSX.writeFile(wb, "finityo_payoff_plan.xlsx");
}
