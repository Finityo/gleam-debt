import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Milestone = {
  code: string;
  level: "bronze" | "silver" | "gold" | "platinum";
  title: string;
  description: string;
  achieved_at: string;
};

type MilestonesResponse = {
  milestones: Milestone[];
};

type HeatDebt = {
  id: string;
  name: string | null;
  balance: number;
  apr: number;
  min_payment: number;
  risk_band: "low" | "medium" | "high";
};

type HeatMapResponse = {
  debts: HeatDebt[];
};

type GoalEvaluation = {
  on_track: boolean | null;
  message: string;
};

type Goal = {
  id: string;
  label: string;
  goal_type: string;
  target_value: number | null;
  target_date: string | null;
  strategy: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  evaluation?: GoalEvaluation;
};

type GoalsListResponse = {
  goals: Goal[];
};

type GoalsMode = "list" | "create" | "update";

function useEdgeFunction<T>(name: string, payload?: any) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
        if (!cancelled) setData(data as T);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [name, JSON.stringify(payload ?? {})]);

  return { data, loading, error, setData };
}

const MilestonesCard: React.FC = () => {
  const { data, loading, error, setData } = useEdgeFunction<MilestonesResponse>("milestones-engine");

  const refresh = async () => {
    const { data, error } = await supabase.functions.invoke("milestones-engine", { body: {} });
    if (!error) {
      setData(data as MilestonesResponse);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-card/60 p-4 md:p-5">
        <div className="mb-2 h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-primary/60 bg-card p-4 md:p-5 text-xs text-muted-foreground">
        <div className="text-sm font-semibold">Milestones</div>
        <p className="mt-2">We could not load milestones right now.</p>
      </div>
    );
  }

  const milestones = data.milestones ?? [];
  const levelBadge = (level: Milestone["level"]) => {
    if (level === "bronze") return "🥉 Bronze";
    if (level === "silver") return "🥈 Silver";
    if (level === "gold") return "🥇 Gold";
    return "🏆 Platinum";
  };

  return (
    <div className="rounded-2xl border border-primary/40 bg-card p-4 md:p-5 shadow-lg">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
        Milestones
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Celebrate your wins as you knock out debts and build streaks.
      </p>

      {milestones.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No milestones yet. Close your first debt or log payoff events to start unlocking badges.
        </p>
      ) : (
        <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-xs">
          {milestones.map((m) => (
            <li key={m.code} className="flex gap-2 rounded-xl bg-muted/40 px-3 py-2">
              <span aria-hidden="true">🎉</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{m.title}</span>
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
                    {levelBadge(m.level)}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">{m.description}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  Earned: {new Date(m.achieved_at).toLocaleDateString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const PayoffHeatMapCard: React.FC = () => {
  const { data, loading, error } = useEdgeFunction<HeatMapResponse>("heat-map-data");

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-card/60 p-4 md:p-5">
        <div className="mb-2 h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-primary/60 bg-card p-4 md:p-5 text-xs text-muted-foreground">
        <div className="text-sm font-semibold">Payoff Heat Map</div>
        <p className="mt-2">We could not load heat map data right now.</p>
      </div>
    );
  }

  const debts = data.debts ?? [];
  if (debts.length === 0) {
    return (
      <div className="rounded-2xl border border-primary/40 bg-card p-4 md:p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
          Payoff Heat Map
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Add at least one active debt to see your heat map.
        </p>
      </div>
    );
  }

  const maxBalance = Math.max(...debts.map((d) => d.balance || 0)) || 1;

  const riskColorClass = (band: HeatDebt["risk_band"]) => {
    if (band === "high") return "bg-destructive/60";
    if (band === "medium") return "bg-warning/60";
    return "bg-success/60";
  };

  return (
    <div className="rounded-2xl border border-primary/40 bg-card p-4 md:p-5 shadow-lg">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
        Payoff Heat Map
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        See which debts are hottest by APR and balance.
      </p>

      <div className="mt-3 space-y-2 text-xs">
        {debts
          .slice()
          .sort((a, b) => b.apr - a.apr || b.balance - a.balance)
          .map((d) => {
            const widthPct = Math.max(10, Math.round((d.balance / maxBalance) * 100));
            return (
              <div key={d.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="truncate pr-2 text-[11px] text-foreground">
                    {d.name || "Debt"}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{d.apr.toFixed(1)}% APR</span>
                    <span>${d.balance.toFixed(0)}</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${riskColorClass(d.risk_band)}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>

      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="h-2 w-4 rounded-full bg-destructive/70" />
          <span>High APR</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-4 rounded-full bg-warning/70" />
          <span>Medium APR</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-4 rounded-full bg-success/70" />
          <span>Low APR</span>
        </div>
      </div>
    </div>
  );
};

const GoalPlannerCard: React.FC = () => {
  const { data, loading, error, setData } = useEdgeFunction<GoalsListResponse>("goals-engine", { mode: "list" });
  const [label, setLabel] = useState("");
  const [goalType, setGoalType] = useState("debt_free_by");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const refresh = async () => {
    const { data, error } = await supabase.functions.invoke("goals-engine", { body: { mode: "list" } });
    if (!error) setData(data as GoalsListResponse);
  };

  const createGoal = async () => {
    if (!label.trim() || !goalType) return;
    try {
      setSaving(true);
      setUpdateError(null);
      const payload: any = { mode: "create" as GoalsMode, label, goal_type: goalType };
      if (goalType === "debt_free_by") {
        if (!targetDate) {
          setUpdateError("Target date is required for this goal.");
          setSaving(false);
          return;
        }
        payload.target_date = targetDate;
      }
      if (goalType === "extra_amount_by_date") {
        if (!targetDate || !targetValue.trim()) {
          setUpdateError("Target date and target amount are required for this goal.");
          setSaving(false);
          return;
        }
        payload.target_date = targetDate;
        payload.target_value = Number(targetValue);
      }

      const { error } = await supabase.functions.invoke("goals-engine", { body: payload });
      if (error) throw error;

      setLabel("");
      setTargetValue("");
      setTargetDate("");
      await refresh();
    } catch (e: any) {
      setUpdateError(e.message ?? "Could not create goal.");
    } finally {
      setSaving(false);
    }
  };

  const updateGoalStatus = async (id: string, status: "met" | "missed" | "archived") => {
    try {
      setUpdateError(null);
      const { error } = await supabase.functions.invoke("goals-engine", {
        body: { mode: "update", id, status }
      });
      if (error) throw error;
      await refresh();
    } catch (e: any) {
      setUpdateError(e.message ?? "Could not update goal.");
    }
  };

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-card/60 p-4 md:p-5">
        <div className="mb-2 h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-primary/60 bg-card p-4 md:p-5 text-xs text-muted-foreground">
        <div className="text-sm font-semibold">Goal Planner</div>
        <p className="mt-2">We could not load your goals yet.</p>
      </div>
    );
  }

  const goals = data?.goals ?? [];

  return (
    <div className="rounded-2xl border border-primary/40 bg-card p-4 md:p-5 shadow-lg">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
        Goal Planner
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Set debt payoff goals and see if your current plan lines up.
      </p>

      {updateError && (
        <div className="mt-2 rounded-md bg-destructive/20 p-2 text-[11px] text-destructive">
          {updateError}
        </div>
      )}

      <div className="mt-3 space-y-2 text-xs">
        <div>
          <div className="mb-1 text-[11px] text-muted-foreground">New goal</div>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mb-2 w-full rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none"
            placeholder='Example: "Debt-free by my 40th birthday"'
          />
          <div className="grid gap-2 md:grid-cols-3">
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value)}
              className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none"
            >
              <option value="debt_free_by">Debt free by date</option>
              <option value="extra_amount_by_date">Extra payment target</option>
            </select>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none"
            />
            {goalType === "extra_amount_by_date" && (
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none"
                placeholder="Target extra (per month)"
              />
            )}
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={createGoal}
              disabled={saving || !label.trim()}
              className="rounded-lg border border-primary bg-primary/20 px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/30 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add goal"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-2 text-xs">
        <div className="mb-1 text-[11px] text-muted-foreground">Your goals</div>
        {goals.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            No goals yet. Add your first payoff goal above.
          </p>
        ) : (
          <ul className="space-y-2">
            {goals.map((g) => (
              <li key={g.id} className="rounded-xl bg-muted/40 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold text-foreground">{g.label}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      Type:{" "}
                      {g.goal_type === "debt_free_by"
                        ? "Debt free by date"
                        : g.goal_type === "extra_amount_by_date"
                        ? "Extra payment target"
                        : g.goal_type}
                    </div>
                    {g.target_date && (
                      <div className="text-[10px] text-muted-foreground">
                        Target date: {new Date(g.target_date).toLocaleDateString()}
                      </div>
                    )}
                    {g.target_value != null && (
                      <div className="text-[10px] text-muted-foreground">
                        Target value: ${g.target_value.toFixed(0)}
                      </div>
                    )}
                    {g.evaluation && (
                      <div className="mt-1 text-[10px] text-foreground">{g.evaluation.message}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{g.status}</span>
                    {g.status === "active" && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateGoalStatus(g.id, "met")}
                          className="rounded-lg border border-success bg-success/20 px-2 py-1 text-[10px] text-success hover:bg-success/30"
                        >
                          Mark met
                        </button>
                        <button
                          type="button"
                          onClick={() => updateGoalStatus(g.id, "missed")}
                          className="rounded-lg border border-destructive bg-destructive/20 px-2 py-1 text-[10px] text-destructive hover:bg-destructive/30"
                        >
                          Mark missed
                        </button>
                      </>
                    )}
                    {g.status !== "archived" && (
                      <button
                        type="button"
                        onClick={() => updateGoalStatus(g.id, "archived")}
                        className="rounded-lg border border-border bg-muted/60 px-2 py-1 text-[10px] hover:bg-muted"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export const EngagementSuite: React.FC = () => {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <MilestonesCard />
      <PayoffHeatMapCard />
      <GoalPlannerCard />
    </div>
  );
};

export default EngagementSuite;
