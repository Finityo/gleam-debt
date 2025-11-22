// ==================================
// 4. PAYMENT CALENDAR COMPONENT
// ==================================
// FILE: src/components/PaymentCalendar.tsx

import React from "react";
import { useUnifiedPlan } from "@/engine/useUnifiedPlan";

export default function PaymentCalendar() {
  const { plan } = useUnifiedPlan();

  if (!plan?.months?.length) {
    return <div className="text-muted-foreground text-sm">No payment data available.</div>;
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold">Payment Calendar</h2>

      {plan.months.map((m: any, idx: number) => (
        <div
          key={idx}
          className="rounded-xl border border-border bg-card p-4 space-y-3"
        >
          <div className="flex justify-between items-center">
            <div className="font-medium">
              {new Date(m.dateISO).toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </div>

            <div className="text-sm text-muted-foreground">
              Total Paid:{" "}
              <span className="font-semibold text-foreground">
                {Number(m.totalPaid).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border divide-y divide-border">
            {m.payments.map((p: any, i: number) => (
              <div
                key={i}
                className="p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Interest:{" "}
                    {p.interestPaid.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}{" "}
                    | Principal:{" "}
                    {p.principalPaid.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </div>
                </div>

                <div className="font-semibold">
                  {p.endingBalance.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground text-right">
            Remaining Balance:{" "}
            {m.remainingBalance.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
