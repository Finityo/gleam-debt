import React from "react";

/**
 * ShareCardPreview
 * - Theme-safe: uses app tokens/classes only (bg-background, text-foreground, border-border).
 * - Data-safe: accepts any shape and renders best-effort fields.
 * - Export-safe: forwardRef so parent can capture DOM for html-to-image.
 */

export type ShareCardPreviewProps = {
  plan?: any;
  debts?: any[];
  userName?: string;
};

export const ShareCardPreview = React.forwardRef<HTMLDivElement, ShareCardPreviewProps>(
  ({ plan, debts = [], userName }, ref) => {
    const totalDebt =
      plan?.totalDebt ??
      plan?.summary?.totalDebt ??
      debts.reduce((s: number, d: any) => s + (Number(d.balance) || 0), 0);

    const monthlySnowball =
      plan?.monthlySnowball ??
      plan?.summary?.monthlySnowball ??
      plan?.settings?.extraMonthly ??
      0;

    const payoffDate =
      plan?.debtFreeDate ??
      plan?.summary?.debtFreeDate ??
      null;

    const topDebts = debts
      .filter(Boolean)
      .slice(0, 3)
      .map((d: any) => ({
        name: d.name ?? "Debt",
        balance: d.balance ?? 0,
        apr: d.apr ?? null,
      }));

    return (
      <div
        ref={ref}
        className="w-full max-w-[720px] rounded-2xl border border-border bg-background text-foreground shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Finityo</span>
            <h2 className="text-2xl font-semibold tracking-tight">
              Debt Payoff Plan
            </h2>
            {userName ? (
              <span className="text-sm text-muted-foreground mt-1">
                {userName}'s snapshot
              </span>
            ) : null}
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Generated</div>
            <div className="text-sm font-medium">
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border p-4 bg-card">
            <div className="text-xs text-muted-foreground">Total Debt</div>
            <div className="text-2xl font-semibold mt-1">
              {Number(totalDebt || 0).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 bg-card">
            <div className="text-xs text-muted-foreground">Monthly Snowball</div>
            <div className="text-2xl font-semibold mt-1">
              {Number(monthlySnowball || 0).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 bg-card">
            <div className="text-xs text-muted-foreground">Target Payoff</div>
            <div className="text-2xl font-semibold mt-1">
              {payoffDate
                ? new Date(payoffDate).toLocaleDateString()
                : "In progress"}
            </div>
          </div>
        </div>

        {/* Top debts */}
        <div className="px-6 pb-6">
          <div className="text-sm font-medium mb-2">Next up</div>
          <div className="rounded-xl border border-border overflow-hidden">
            {topDebts.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                Add debts to see your next targets.
              </div>
            ) : (
              topDebts.map((d, i) => (
                <div
                  key={`${d.name}-${i}`}
                  className={`p-4 flex items-center justify-between ${
                    i < topDebts.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{i + 1}. {d.name}</span>
                    {d.apr != null ? (
                      <span className="text-xs text-muted-foreground">
                        APR: {Number(d.apr).toFixed(2)}%
                      </span>
                    ) : null}
                  </div>
                  <div className="font-semibold">
                    {Number(d.balance || 0).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Debt Simplified.</span>
          <span>finityo.app</span>
        </div>
      </div>
    );
  }
);

ShareCardPreview.displayName = "ShareCardPreview";

export default ShareCardPreview;
