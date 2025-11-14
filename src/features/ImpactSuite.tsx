import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, CheckSquare } from 'lucide-react';

type Alert = {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
};

type RiskAlertsResponse = {
  alerts: Alert[];
};

type StreakStatsResponse = {
  current_streak_months: number;
  longest_streak_months: number;
  total_events: number;
  total_debts_closed: number;
  last_event_date: string | null;
};

type CoachAction = {
  id: string;
  label: string;
  action_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
};

type ActionListResponse = {
  actions: CoachAction[];
};

function useEdgeFunction<T>(name: string, payload?: any) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Wait for session to be ready
        let session = null;
        let retries = 0;
        while (!session && retries < 3 && !cancelled) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          session = currentSession;
          if (!session && retries < 2) {
            await new Promise(resolve => setTimeout(resolve, 500));
            retries++;
          }
        }
        
        if (!session) {
          if (!cancelled) setError('Not authenticated');
          if (!cancelled) setLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke(name, {
          body: payload ?? {},
        });
        if (error) throw error;
        if (!cancelled) setData(data as T);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Something went wrong');
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

const RiskAlertsCard: React.FC = () => {
  const { data, loading, error } = useEdgeFunction<RiskAlertsResponse>('risk-alerts');

  if (loading && !data) {
    return (
      <Card className="p-6 bg-background/60 backdrop-blur-sm border-border/50">
        <div className="space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6 border-destructive/40 bg-destructive/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-destructive mb-1">Early Warnings</h3>
            <p className="text-xs text-muted-foreground">
              We couldn't load risk alerts right now.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const alerts = data.alerts ?? [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return '•';
    }
  };

  return (
    <Card className="p-6 bg-background/60 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            Early Warnings
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Heads-up signals that your plan might be under pressure.
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-lg bg-muted/30 p-4">
          <p className="text-xs text-foreground">
            No major risk flags right now. Keep doing what you're doing and checking back in.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a, idx) => (
            <li
              key={`${a.type}-${idx}`}
              className="flex gap-3 rounded-lg bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <span className="text-lg shrink-0" aria-hidden="true">
                {getSeverityIcon(a.severity)}
              </span>
              <span className={`text-xs flex-1 ${getSeverityColor(a.severity)}`}>
                {a.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

const StreakCard: React.FC = () => {
  const { data, loading, error } = useEdgeFunction<StreakStatsResponse>('streak-stats');

  if (loading && !data) {
    return (
      <Card className="p-6 bg-background/60 backdrop-blur-sm border-border/50">
        <div className="space-y-3">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6 border-amber-500/40 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-500 mb-1">Payoff Streak</h3>
            <p className="text-xs text-muted-foreground">
              We couldn't load your streak yet.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const {
    current_streak_months,
    longest_streak_months,
    total_events,
    total_debts_closed,
    last_event_date,
  } = data;

  return (
    <Card className="p-6 bg-background/60 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all">
      <div className="flex items-start gap-3 mb-4">
        <TrendingUp className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            Payoff Streak
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Built from months where you took action: extra payments, closed debts, or marked wins.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-muted/30 p-4">
          <div className="text-xs text-muted-foreground mb-1">Current streak</div>
          <div className="text-2xl font-bold text-foreground">
            {current_streak_months}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {current_streak_months === 1 ? 'month' : 'months'}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2">
            Longest: <span className="font-semibold text-foreground">{longest_streak_months}</span>{' '}
            {longest_streak_months === 1 ? 'month' : 'months'}
          </div>
        </div>

        <div className="rounded-lg bg-muted/30 p-4">
          <div className="text-xs text-muted-foreground mb-1">Total wins logged</div>
          <div className="text-2xl font-bold text-foreground">{total_events}</div>
          <div className="text-[11px] text-muted-foreground mt-2">
            Debts paid off: <span className="font-semibold text-foreground">{total_debts_closed}</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Last event: <span className="font-semibold text-foreground">
              {last_event_date ? new Date(last_event_date).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
        {current_streak_months > 0 ? (
          <span>
            Keep the streak alive by logging new wins as you clear debts or apply extra payments.
            Streaks are about consistency, not perfection.
          </span>
        ) : (
          <span>
            Your streak will start as soon as payoff events are logged. One strong month at a time is
            all it takes.
          </span>
        )}
      </div>
    </Card>
  );
};

const ActionQueueCard: React.FC = () => {
  const { data, loading, error, setData } = useEdgeFunction<ActionListResponse>('action-queue', {
    mode: 'list',
  });
  const [label, setLabel] = useState('');
  const [actionType, setActionType] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const actions = data?.actions ?? [];

  const refresh = async () => {
    const { data: newData, error } = await supabase.functions.invoke('action-queue', {
      body: { mode: 'list' },
    });
    if (!error) {
      setData(newData as ActionListResponse);
    }
  };

  const createAction = async () => {
    if (!label.trim()) return;
    try {
      setSubmitting(true);
      setUpdateError(null);
      const { error } = await supabase.functions.invoke('action-queue', {
        body: {
          mode: 'create',
          label,
          action_type: actionType,
          payload: {},
        },
      });
      if (error) throw error;
      setLabel('');
      await refresh();
    } catch (e: any) {
      setUpdateError(e.message ?? 'Could not create action.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: 'completed' | 'ignored') => {
    try {
      setUpdateError(null);
      const { error } = await supabase.functions.invoke('action-queue', {
        body: { mode: 'update', id, status },
      });
      if (error) throw error;
      await refresh();
    } catch (e: any) {
      setUpdateError(e.message ?? 'Could not update action.');
    }
  };

  if (loading && !data) {
    return (
      <Card className="p-6 bg-background/60 backdrop-blur-sm border-border/50">
        <div className="space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className="p-6 border-sky-500/40 bg-sky-500/5">
        <div className="flex items-start gap-3">
          <CheckSquare className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-sky-500 mb-1">Action Queue</h3>
            <p className="text-xs text-muted-foreground">
              We couldn't load your action queue yet.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-background/60 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all">
      <div className="flex items-start gap-3 mb-4">
        <CheckSquare className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            Action Queue
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Turn recommendations into concrete moves you can check off.
          </p>
        </div>
      </div>

      {updateError && (
        <div className="mb-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
          {updateError}
        </div>
      )}

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Add a new action</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
            placeholder="Example: Increase monthly extra by $25"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
          >
            <option value="general">General</option>
            <option value="increase_extra">Increase extra</option>
            <option value="target_debt">Target debt</option>
            <option value="habit">Habit</option>
          </select>
          <button
            type="button"
            onClick={createAction}
            disabled={submitting || !label.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="text-xs text-muted-foreground mb-2">Open actions</div>
        {actions.length === 0 ? (
          <div className="rounded-lg bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">
              No open actions. Convert a recommendation into a task or add your own.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {actions.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-lg bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="text-[10px] uppercase text-muted-foreground mb-1">
                    {a.action_type}
                  </div>
                  <div className="text-sm text-foreground">{a.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Created: {new Date(a.created_at).toLocaleDateString()}
                  </div>
                </div>
                {a.status === 'open' ? (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => updateStatus(a.id, 'completed')}
                      className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/30 transition-colors"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(a.id, 'ignored')}
                      className="rounded-lg bg-muted/50 border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    {a.status === 'completed' ? '✓ Completed' : '⊘ Ignored'}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};

export const ImpactSuite: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 bg-background/60 backdrop-blur-sm">
            <div className="space-y-3">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <RiskAlertsCard />
      <StreakCard />
      <ActionQueueCard />
    </div>
  );
};

export default ImpactSuite;
