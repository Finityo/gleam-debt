import React from "react";
import { Btn, Card } from "@/components/ui";

const money = (n: number) => "$" + (n ?? 0).toLocaleString();

export function MonthDrawer({
  month,
  open,
  onClose,
}: {
  month: any;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !month) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-finityo-bgA border-l border-white/10 flex flex-col text-finityo-textBody">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <div className="font-semibold text-white text-lg">
            Month {month.monthIndex + 1}
          </div>
          <Btn variant="ghost" onClick={onClose}>
            Close
          </Btn>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <Card title="Summary">
            <div className="text-sm">
              Remaining:{" "}
              <span className="text-finityo-primary">
                {money(month.remaining)}
              </span>
            </div>
          </Card>

          <Card title="Payments">
            <div className="space-y-2 text-sm">
              {month.payments?.map((p: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between border-b border-white/10 pb-1"
                >
                  <div>{p.debtId}</div>
                  <div className="text-right">
                    <div className="text-finityo-textMain">
                      {money(p.principal + p.interest)}
                    </div>
                    <div className="text-xs text-gray-400">
                      (P: {money(p.principal)} · I: {money(p.interest)})
                    </div>
                  </div>
                </div>
              ))}
              {!month.payments?.length && (
                <div className="text-xs text-gray-400">No payments</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
