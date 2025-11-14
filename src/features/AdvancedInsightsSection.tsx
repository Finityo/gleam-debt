import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type TransactionsAnalysis = {
  month: string;
  totals_by_category: Record<string, number>;
  top_merchants: { merchant: string; total: number }[];
  avg_daily_spend: number;
  net_cash_flow: number;
  large_transactions: {
    amount: number;
    merchant: string | null;
    date: string;
  }[];
};

type InsightSettings = {
  user_id: string;
  anomaly_threshold: number;
  ignored_categories: string[];
  daily_alerts: boolean;
  weekly_reports: boolean;
};

type ScorePoint = {
  score: number;
  created_at: string;
};

type ScoreHistoryResponse = {
  points: ScorePoint[];
};

function useEdgeFunction<T>(name: string, payload?: any) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke(name, {
          body: payload ?? {}
        });
        if (error) throw error;
        if (!cancelled) {
          setData(data as T);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [name, JSON.stringify(payload)]);

  return { data, loading, error };
}

function formatCurrency(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return "$0";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD"
  });
}

const TransactionsAnalysisCard: React.FC = () => {
  const { data, loading, error } =
    useEdgeFunction<TransactionsAnalysis>("analyze-transactions");

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
        <div className="mb-2 h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 md:p-5 text-xs text-muted-foreground">
        <div className="text-sm font-semibold text-foreground">Transaction Analysis</div>
        <p className="mt-2">Unable to load transaction insights.</p>
      </div>
    );
  }

  const {
    month,
    totals_by_category,
    top_merchants,
    avg_daily_spend,
    net_cash_flow,
    large_transactions
  } = data;

  const categoriesSorted = Object.entries(totals_by_category).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="rounded-2xl border border-primary/40 bg-card p-4 md:p-5 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
            Transaction Analysis
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Month: <span className="font-semibold text-foreground">{month}</span>
          </p>
        </div>
        <div className="text-right text-xs">
          <div className="text-muted-foreground">Avg daily spend</div>
          <div className="font-semibold text-foreground">
            {formatCurrency(avg_daily_spend)}
          </div>
          <div className="mt-1 text-muted-foreground">Net cash flow</div>
          <div className={`font-semibold ${net_cash_flow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {formatCurrency(net_cash_flow)}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
        <div>
          <div className="mb-1 text-[11px] font-semibold text-muted-foreground">
            Top categories
          </div>
          {categoriesSorted.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              No categorized transactions yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {categoriesSorted.slice(0, 5).map(([cat, total]) => (
                <li
                  key={cat}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-2 py-1"
                >
                  <span className="truncate pr-2">{cat}</span>
                  <span className="font-semibold">{formatCurrency(total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="mb-1 text-[11px] font-semibold text-muted-foreground">
            Top merchants
          </div>
          {top_merchants.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              No merchant data yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {top_merchants.map((m) => (
                <li
                  key={m.merchant}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-2 py-1"
                >
                  <span className="truncate pr-2">{m.merchant}</span>
                  <span className="font-semibold">{formatCurrency(m.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {large_transactions.length > 0 && (
        <div className="mt-3 border-t border-border pt-2">
          <div className="mb-1 text-[11px] font-semibold text-muted-foreground">
            Large transactions
          </div>
          <ul className="space-y-1 text-[11px]">
            {large_transactions.slice(0, 3).map((t, idx) => (
              <li
                key={`${t.date}-${t.amount}-${idx}`}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-2 py-1"
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{t.merchant ?? "Transaction"}</span>
                  <span className="text-[10px] text-muted-foreground">{t.date}</span>
                </div>
                <span className={`font-semibold ${t.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                  {formatCurrency(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const InsightsSettingsCard: React.FC = () => {
  const { data, loading, error } = useEdgeFunction<InsightSettings>("insight-settings");
  const [local, setLocal] = useState<InsightSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  useEffect(() => {
    if (data && !local) {
      setLocal(data);
    }
  }, [data, local]);

  const handleToggle = (field: "daily_alerts" | "weekly_reports") => {
    if (!local) return;
    setLocal({ ...local, [field]: !local[field] });
  };

  const handleThresholdChange = (val: string) => {
    if (!local) return;
    const num = Number(val.replace(/[^\d.]/g, ""));
    setLocal({ ...local, anomaly_threshold: Number.isNaN(num) ? 0 : num });
  };

  const handleSave = async () => {
    if (!local) return;
    try {
      setSaving(true);
      setSaveError(null);
      setSaveOk(false);
      const { data, error } = await supabase.functions.invoke("insight-settings", {
        body: {
          anomaly_threshold: local.anomaly_threshold,
          ignored_categories: local.ignored_categories,
          daily_alerts: local.daily_alerts,
          weekly_reports: local.weekly_reports
        }
      });
      if (error) throw error;
      setLocal(data as InsightSettings);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
    } catch (err: any) {
      setSaveError(err.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !local) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
        <div className="mb-2 h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if ((error && !local) || (!data && !local)) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 md:p-5 text-xs text-muted-foreground">
        <div className="text-sm font-semibold text-foreground">Insight Settings</div>
        <p className="mt-2">Unable to load settings.</p>
      </div>
    );
  }

  if (!local) return null;

  return (
    <div className="rounded-2xl border border-secondary/40 bg-card p-4 md:p-5 shadow-lg">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary-foreground">
        Insight Settings
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Control how Finityo flags activity and insights frequency.
      </p>

      <div className="mt-3 space-y-3 text-xs">
        <div>
          <div className="mb-1 text-[11px] text-muted-foreground">
            Large transaction threshold
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="w-28 rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              value={local.anomaly_threshold}
              onChange={(e) => handleThresholdChange(e.target.value)}
            />
            <span className="text-[11px] text-muted-foreground">
              Transactions above this get flagged.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] text-muted-foreground">Daily alerts</div>
            <div className="text-[11px] text-muted-foreground">
              Quick heads-up about big movements.
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("daily_alerts")}
            className={`flex h-6 w-11 items-center rounded-full px-1 transition-colors ${
              local.daily_alerts ? "justify-end bg-primary" : "justify-start bg-muted"
            }`}
          >
            <span className="h-4 w-4 rounded-full bg-background shadow" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] text-muted-foreground">Weekly summary email</div>
            <div className="text-[11px] text-muted-foreground">
              One clean recap instead of constant pings.
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("weekly_reports")}
            className={`flex h-6 w-11 items-center rounded-full px-1 transition-colors ${
              local.weekly_reports ? "justify-end bg-primary" : "justify-start bg-muted"
            }`}
          >
            <span className="h-4 w-4 rounded-full bg-background shadow" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-[11px]">
        <div className="flex flex-col">
          {saveError && <span className="text-destructive">{saveError}</span>}
          {saveOk && <span className="text-green-600 dark:text-green-400">Saved.</span>}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 disabled:opacity-60 transition-colors"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </div>
  );
};

const ScoreHistoryCard: React.FC = () => {
  const { data, loading, error } = useEdgeFunction<ScoreHistoryResponse>("score-history");

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
        <div className="mb-2 h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-24 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 md:p-5 text-xs text-muted-foreground">
        <div className="text-sm font-semibold text-foreground">Score History</div>
        <p className="mt-2">Unable to load score history.</p>
      </div>
    );
  }

  const points = data.points ?? [];
  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-accent/40 bg-card p-4 md:p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-foreground">
          Score History
        </h3>
        <p className="mt-2 text-xs text-muted-foreground">
          Once your Financial Health Score starts updating, the trendline will appear here.
        </p>
      </div>
    );
  }

  const scores = points.map((p) => p.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = Math.max(1, maxScore - minScore);

  return (
    <div className="rounded-2xl border border-accent/40 bg-card p-4 md:p-5 shadow-lg">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-foreground">
        Score History
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Your Financial Health Score over time.
      </p>

      <div className="mt-3 h-32 w-full rounded-xl bg-muted/50 p-2">
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-accent"
            points={points
              .map((p, i) => {
                const x = (points.length === 1 ? 50 : (i / (points.length - 1)) * 100).toFixed(2);
                const yVal = 40 - (((p.score - minScore) / range) * 30 + 5);
                const y = yVal.toFixed(2);
                return `${x},${y}`;
              })
              .join(" ")}
          />
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px]">
        <div>
          <div className="text-muted-foreground">Lowest</div>
          <div className="font-semibold text-foreground">{minScore}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Latest</div>
          <div className="font-semibold text-foreground">
            {points[points.length - 1]?.score}
          </div>
        </div>
        <div className="text-right">
          <div className="text-muted-foreground">Highest</div>
          <div className="font-semibold text-foreground">{maxScore}</div>
        </div>
      </div>
    </div>
  );
};

export const AdvancedInsightsSection: React.FC = () => {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <TransactionsAnalysisCard />
      <InsightsSettingsCard />
      <ScoreHistoryCard />
    </div>
  );
};

export default AdvancedInsightsSection;
