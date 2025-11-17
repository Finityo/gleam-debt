import { Card } from "./Card";

type Payment = {
  debtId: string;
  debtName: string;
  principal: number;
  interest: number;
  balanceEnd: number;
};

type MonthData = {
  monthIndex: number;
  remaining: number;
  payments: Payment[];
};

type Props = {
  months: MonthData[];
  maxDisplay?: number;
};

export function MonthDetailAccordion({ months, maxDisplay = 24 }: Props) {
  if (!months || months.length === 0) {
    return (
      <Card title="Month Details">
        <div className="text-sm text-gray-500 text-center py-4">
          Compute your plan to see month-by-month details
        </div>
      </Card>
    );
  }

  return (
    <Card title="Month Details">
      <div className="max-h-96 overflow-y-auto space-y-2">
        {months.slice(0, maxDisplay).map((month) => (
          <details
            key={month.monthIndex}
            className="border border-border/40 rounded-base p-3 cursor-pointer hover:glass transition-colors"
          >
            <summary className="font-medium text-sm">
              Month {month.monthIndex + 1} — Remaining ${month.remaining.toLocaleString()}
            </summary>
            <div className="mt-3 space-y-2">
              {month.payments.map((payment) => (
                <div
                  key={payment.debtId}
                  className="text-xs glass p-2 rounded grid grid-cols-2 gap-2"
                >
                  <div className="font-medium col-span-2">{payment.debtName}</div>
                  <div>
                    <span className="text-gray-600">Principal:</span> ${payment.principal.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-gray-600">Interest:</span> ${payment.interest.toFixed(2)}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">End Balance:</span> ${payment.balanceEnd.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </Card>
  );
}
