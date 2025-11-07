// ===================================
// src/lib/exportPdf.ts
// ===================================
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Debt, UserSettings, DebtPlan } from "@/lib/computeDebtPlan";
import { remainingByMonth } from "@/lib/remaining";
import { getPayoffOrder } from "@/lib/payoffOrder";

export function exportPlanToPDF(
  debts: Debt[],
  settings: UserSettings,
  plan: DebtPlan
) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 32;
  let cursorY = margin;

  // --- Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Finityo Debt Payoff Summary", margin, cursorY);
  cursorY += 26;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Debt-Free Date: ${plan.debtFreeDate}`, margin, cursorY);
  cursorY += 18;

  doc.text(
    `Total Interest Paid: $${plan.totalInterest.toFixed(2)}`,
    margin,
    cursorY
  );
  cursorY += 18;

  doc.text(`Strategy: ${settings.strategy}`, margin, cursorY);
  cursorY += 30;

  // --- Debts Table ---
  autoTable(doc, {
    startY: cursorY,
    head: [["Name", "Balance", "APR", "Min"]],
    body: debts.map((d) => [
      d.name,
      `$${d.balance.toFixed(2)}`,
      `${d.apr}%`,
      `$${d.minPayment.toFixed(2)}`,
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [0, 0, 0] },
    theme: "striped",
  });

  cursorY = (doc as any).lastAutoTable.finalY + 30;

  // --- First 12 months table ---
  const firstMonths = plan.months.slice(0, 12);
  const remain = remainingByMonth(plan);

  autoTable(doc, {
    startY: cursorY,
    head: [["Month", "Total Paid", "Interest", "Principal", "Remaining"]],
    body: firstMonths.map((m) => {
      const totalPrincipal = m.payments.reduce(
        (a, p) => a + p.principal,
        0
      );
      const totalRemaining = remain[m.monthIndex]?.remaining ?? 0;
      return [
        m.monthIndex + 1,
        `$${m.totalPaid.toFixed(2)}`,
        `$${m.totalInterest.toFixed(2)}`,
        `$${totalPrincipal.toFixed(2)}`,
        `$${totalRemaining.toFixed(2)}`,
      ];
    }),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [0, 0, 0] },
    theme: "striped",
  });

  // --- Remaining Balance Table ---
  const remainSlice = remainingByMonth(plan).slice(0, 12);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 24,
    head: [["Month", "Remaining"]],
    body: remainSlice.map((r) => [
      r.monthIndex + 1,
      `$${r.remaining.toFixed(2)}`,
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [0, 0, 0] },
    theme: "striped",
  });

  // --- Payoff Order Table ---
  const payoffOrder = getPayoffOrder(plan);
  const debtMap = new Map(debts.map((d) => [d.id, d]));

  if (payoffOrder.length > 0) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 24,
      head: [["Order", "Debt Name", "Month Paid Off"]],
      body: payoffOrder.map((item, idx) => {
        const debt = debtMap.get(item.debtId);
        const debtName = debt?.name || item.debtId;
        return [idx + 1, debtName, item.monthIndex];
      }),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 0, 0] },
      theme: "striped",
    });
  }

  // Done
  doc.save("finityo_payoff_summary.pdf");
}
