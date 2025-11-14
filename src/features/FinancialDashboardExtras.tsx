import React, { useEffect, useState } from "react";

// --------------------------------------------------------
// Types
// --------------------------------------------------------

type FinancialHealthFactors = {
  totalDebt: number;
  cardUtil?: number;
  progress?: number;
};

type FinancialHealthResponse = {
  score: number;
  factors: FinancialHealthFactors;
};

type MilestonesResponse = {
  achieved: string[];
};

type SpendingTotals = Record<string, number>;

type Anomaly = {
  amount: number;
  merchant?: string;
  date?: string;
};

type SpendingInsightsResponse = {
  month: string;
  totals: SpendingTotals;
  anomalies: Anomaly[];
};

// --------------------------------------------------------
// Generic fetch hook
// --------------------------------------------------------

function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function run() {
      try {
        setLoading(true);
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const json = (await res.json()) as T;
        if (!cancelled) {
          setData(json);
        }
      } catch (err: any) {
        if (!cancelled && err.name !== "AbortError") {
          setError(err.message || "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  return { data, loading, error };
}

// --------------------------------------------------------
// Specific hooks
// --------------------------------------------------------

function useFinancialHealth() {
  return useApi<FinancialHealthResponse>("/api/financial-health");
}

function useMilestones() {
  return useApi<MilestonesResponse>("/api/milestones");
}

function useSpendingInsights() {
  return useApi<SpendingInsightsResponse>("/api/spending-insights");
}

// --------------------------------------------------------
// Helper functions
// --------------------------------------------------------

function formatCurrency(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "$0";
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD"
  });
}

function formatPercent(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "0%";
  return `${value.toFixed(1)}%`;
}

function prettifyMilestoneKey(key: string): string {
  switch (key) {
    case "first_debt_paid":
      return "First Debt Paid Off";
    case "twenty_five_percent":
      return "25% Of Debt Paid";
    case "fifty_percent":
      return "50% Of Debt Paid";
    case "debt_free":
      return "Debt Free";
    default:
      return key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

// --------------------------------------------------------
// Card components
// --------------------------------------------------------

export const FinancialHealthScoreCard: React.FC = () => {
  const { data, loading, error } = useFinancialHealth();

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 md:p-5">
        <div className="mb-2 h-4 w-32 animate-pulse rounded bg-neutral-800" />
        <div className="h-10 w-24 animate-pulse rounded bg-neutral-800" />
        <div className="mt-3 h-3 w-40 animate-pulse rounded bg-neutral-800" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-600/60 bg-red-950/40 p-4 md:p-5 text-sm text-red-100">
        <div className="font-semibold">Financial Health Score</div>
        <p className="mt-2">Could not load your score. Try again in a bit.</p>
      </div>
    );
  }

  const { score, factors } = data;

  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-neutral-900/70 p-4 md:p-5 shadow-lg shadow-emerald-500/15">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
            Financial Health Score
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            A quick snapshot of where you stand today.
          </p>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/60 bg-black/40 text-2xl font-bold text-emerald-300">
          {score}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-neutral-300 sm:grid-cols-3">
        <div>
          <div className="text-neutral-500">Total debt</div>
          <div className="font-semibold">{formatCurrency(factors.totalDebt)}</div>
        </div>
        <div>
          <div className="text-neutral-500">Card utilization</div>
          <div className="font-semibold">
            {factors.cardUtil != null ? formatPercent(factors.cardUtil) : "N/A"}
          </div>
        </div>
        <div>
          <div className="text-neutral-500">Plan engagement</div>
          <div className="font-semibold">
            {factors.progress != null ? `${factors.progress.toFixed(0)} pts` : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MilestoneCelebrationsCard: React.FC = () => {
  const { data, loading, error } = useMilestones();

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 md:p-5">
        <div className="mb-2 h-4 w-32 animate-pulse rounded bg-neutral-800" />
        <div className="h-4 w-40 animate-pulse rounded bg-neutral-800" />
        <div className="mt-2 h-4 w-28 animate-pulse rounded bg-neutral-800" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-amber-600/60 bg-amber-950/40 p-4 md:p-5 text-sm text-amber-100">
        <div className="font-semibold">Milestones</div>
        <p className="mt-2">Could not load milestones right now.</p>
      </div>
    );
  }

  const achieved = data.achieved ?? [];

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-neutral-900/70 p-4 md:p-5 shadow-lg shadow-amber-500/15">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-300">
        Milestones
      </h3>
      <p className="mt-1 text-xs text-neutral-400">
        Every step counts. Here are the wins you have unlocked.
      </p>

      {achieved.length === 0 ? (
        <p className="mt-3 text-xs text-neutral-400">
          No new milestones yet. Keep making payments and you will see them start to light up.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {achieved.map((m) => (
            <li
              key={m}
              className="flex items-center gap-2 rounded-xl bg-black/40 px-3 py-1.5 text-amber-50"
            >
              <span className="text-lg" aria-hidden="true">
                🎉
              </span>
              <span>{prettifyMilestoneKey(m)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const SpendingInsightsCard: React.FC = () => {
  const { data, loading, error } = useSpendingInsights();

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 md:p-5">
        <div className="mb-2 h-4 w-40 animate-pulse rounded bg-neutral-800" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-800" />
        <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-sky-600/60 bg-sky-950/40 p-4 md:p-5 text-sm text-sky-100">
        <div className="font-semibold">Spending Insights</div>
        <p className="mt-2">Could not load spending data.</p>
      </div>
    );
  }

  const { month, totals, anomalies } = data;

  const sortedCategories = Object.entries(totals || {}).sort(
    (a, b) => b[1] - a[1]
  );
  const topFive = sortedCategories.slice(0, 5);

  return (
    <div className="rounded-2xl border border-sky-500/40 bg-neutral-900/70 p-4 md:p-5 shadow-lg shadow-sky-500/15">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-300">
            Spending Insights
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            Month: <span className="font-semibold text-neutral-200">{month}</span>
          </p>
        </div>
      </div>

      {topFive.length === 0 ? (
        <p className="mt-3 text-xs text-neutral-400">
          No spending data yet. Once your linked accounts start posting
          transactions, you will see category insights here.
        </p>
      ) : (
        <>
          <div className="mt-3">
            <div className="mb-1 text-xs font-semibold text-neutral-400">
              Top categories
            </div>
            <ul className="space-y-1 text-xs text-neutral-200">
              {topFive.map(([cat, amount]) => (
                <li
                  key={cat}
                  className="flex items-center justify-between rounded-lg bg-black/30 px-2 py-1"
                >
                  <span className="truncate pr-2">{cat}</span>
                  <span className="font-semibold">{formatCurrency(amount)}</span>
                </li>
              ))}
            </ul>
          </div>

          {anomalies && anomalies.length > 0 && (
            <div className="mt-4 border-t border-neutral-800 pt-2">
              <div className="mb-1 text-xs font-semibold text-neutral-400">
                Large transactions
              </div>
              <ul className="space-y-1 text-xs text-neutral-200">
                {anomalies.slice(0, 3).map((a, idx) => (
                  <li
                    key={`${a.date}-${a.amount}-${idx}`}
                    className="flex items-center justify-between rounded-lg bg-black/30 px-2 py-1"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {a.merchant || "Transaction"}
                      </span>
                      {a.date && (
                        <span className="text-[10px] text-neutral-500">
                          {a.date}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(a.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// --------------------------------------------------------
// Wrapper for Dashboard
// --------------------------------------------------------

export const FinancialDashboardExtras: React.FC = () => {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <FinancialHealthScoreCard />
      <MilestoneCelebrationsCard />
      <SpendingInsightsCard />
    </div>
  );
};

export default FinancialDashboardExtras;
