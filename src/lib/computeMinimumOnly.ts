// ===================================
// src/lib/computeMinimumOnly.ts
// ===================================
import { Debt, DebtPlan } from "@/lib/computeDebtPlan";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function computeMinimumOnly(
  inputDebts: Debt[],
  opts?: { startDate?: Date; maxMonths?: number }
): DebtPlan {
  const startDate = opts?.startDate ?? new Date();
  const maxMonths = opts?.maxMonths ?? 600;

  const debts = inputDebts.map((d) => ({
    ...d,
    balance: round2(Math.max(0, d.balance)),
    apr: Math.max(0, d.apr),
    minPayment: round2(Math.max(0, d.minPayment)),
    include: d.include ?? true,
  }));

  let months: DebtPlan["months"] = [];
  let totalInterest = 0;
  let totalPaid = 0;

  for (let monthIndex = 0; monthIndex < maxMonths; monthIndex++) {
    // stop if done
    const activeDebts = debts.filter(
      (d) => (d.include ?? true) && d.balance > 0.000001
    );
    if (!activeDebts.length) break;

    const payments = [];
    let monthInterest = 0;
    let monthPaid = 0;

    for (const d of debts) {
      if (!(d.include ?? true) || d.balance <= 0) {
        payments.push({
          debtId: d.id,
          paid: 0,
          interest: 0,
          principal: 0,
          balanceEnd: d.balance,
        });
        continue;
      }

      // interest
      const monthlyRate = d.apr > 0 ? (d.apr / 100) / 12 : 0;
      const interest = round2(d.balance * monthlyRate);

      // pay min
      const due = round2(d.balance + interest);
      const pay = round2(Math.min(d.minPayment, due));

      const interestPaid = round2(Math.min(interest, pay));
      const principalPaid = round2(pay - interestPaid);

      d.balance = round2(d.balance - principalPaid);

      payments.push({
        debtId: d.id,
        paid: pay,
        interest: interestPaid,
        principal: principalPaid,
        balanceEnd: d.balance,
      });

      monthInterest += interestPaid;
      monthPaid += pay;
    }

    totalInterest += round2(monthInterest);
    totalPaid += round2(monthPaid);

    months.push({
      monthIndex,
      payments,
      totalInterest: round2(monthInterest),
      totalPaid: round2(monthPaid),
      snowballPoolApplied: monthPaid,
    });
  }

  const finalMonthIndex = months.length ? months.at(-1)!.monthIndex : -1;
  const debtFreeDate = `${startDate.getUTCFullYear()}-${
    String(startDate.getUTCMonth() + 1 + finalMonthIndex + 1).padStart(2, "0")
  }`;

  return {
    months,
    debtFreeDate,
    totalInterest: round2(totalInterest),
    totalPaid: round2(totalPaid),
    summary: {
      firstDebtPaidMonth: null, // irrelevant for minimum-only
      initialOutflow: NaN,
      finalMonthIndex,
    },
  };
}
