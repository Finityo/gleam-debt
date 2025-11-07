import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Export shared plan to PDF
 */
export function exportPlanToPDF(data: any) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Finityo Shared Plan", margin, y);
  y += 30;

  // Metadata
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (data.createdAt) {
    doc.text(`Shared: ${new Date(data.createdAt).toLocaleString()}`, margin, y);
    y += 14;
  }
  if (data.expiresAt) {
    doc.text(`Expires: ${new Date(data.expiresAt).toLocaleString()}`, margin, y);
    y += 14;
  }

  // Summary
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Summary", margin, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (data.plan?.debtFreeDate) {
    doc.text(`Debt-Free Date: ${data.plan.debtFreeDate}`, margin, y);
    y += 14;
  }
  if (data.plan?.totalInterest) {
    doc.text(`Total Interest: $${data.plan.totalInterest.toFixed(2)}`, margin, y);
    y += 14;
  }

  // Badges
  if (Array.isArray(data.badges) && data.badges.length > 0) {
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Achievements", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    data.badges.forEach((badge: any) => {
      doc.text(`• ${badge.label}`, margin + 12, y);
      y += 12;
    });
  }

  // Debts table
  if (Array.isArray(data.debts) && data.debts.length > 0) {
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Debts", margin, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [["Name", "Balance", "APR", "Min Payment"]],
      body: data.debts.map((d: any) => [
        d.name,
        `$${d.balance?.toFixed(2) || "0.00"}`,
        `${d.apr?.toFixed(2) || "0.00"}%`,
        `$${d.minPayment?.toFixed(2) || "0.00"}`,
      ]),
      margin: { left: margin, right: margin },
      theme: "grid",
    });

    y = (doc as any).lastAutoTable.finalY + 20;
  }

  // Notes
  if (data.notes && data.includeNotes) {
    if (y > 700) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Notes", margin, y);
    y += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const wrapped = doc.splitTextToSize(data.notes, 515);
    doc.text(wrapped, margin, y);
  }

  doc.save("Finityo_Shared_Plan.pdf");
}
