import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lightbulb, Calculator, BookOpen, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type Strategy = 'snowball' | 'avalanche';

type ProjectionResult = {
  strategy: Strategy;
  months: number;
  debt_free_date: string;
  total_interest: number;
};

type RecommendationAction =
  | { kind: 'set_strategy'; value: Strategy }
  | { kind: 'set_monthly_extra'; value: number };

type Recommendation = {
  id: string;
  type: 'accelerate' | 'strategy_compare' | 'interest_savings' | 'momentum';
  text: string;
  action?: RecommendationAction;
};

type RecommendationEngineResponse = {
  base_strategy: Strategy;
  snowball: ProjectionResult;
  avalanche: ProjectionResult;
  recommendations: Recommendation[];
};

type WhatIfResponse = {
  strategy: Strategy;
  baseline: ProjectionResult;
  scenario: ProjectionResult;
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
        
        // Check if user is authenticated first
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelled) setError('Not authenticated');
          return;
        }

        const { data, error } = await supabase.functions.invoke(name, { body: payload ?? {} });
        if (error) throw error;
        if (!cancelled) setData(data as T);
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? 'Something went wrong');
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

function formatCurrency(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return '$0';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

const SmartRecommendationsCard: React.FC = () => {
  const { data, loading, error, setData } = useEdgeFunction<RecommendationEngineResponse>('recommendation-engine');
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const handleApply = async (rec: Recommendation) => {
    if (!rec.action) return;
    
    try {
      setApplyingId(rec.id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (rec.action.kind === 'set_strategy') {
        const { error } = await supabase
          .from('debt_calculator_settings')
          .upsert({ user_id: user.id, strategy: rec.action.value }, { onConflict: 'user_id' });
        if (error) throw error;
        toast.success(`Strategy changed to ${rec.action.value === 'snowball' ? 'Snowball' : 'Avalanche'}`);
      }

      if (rec.action.kind === 'set_monthly_extra') {
        const { error } = await supabase
          .from('debt_calculator_settings')
          .upsert({ user_id: user.id, extra_monthly: rec.action.value }, { onConflict: 'user_id' });
        if (error) throw error;
        toast.success(`Monthly extra set to $${rec.action.value}`);
      }

      const { data: newData, error: reloadError } = await supabase.functions.invoke('recommendation-engine', { body: {} });
      if (reloadError) throw reloadError;
      setData(newData as RecommendationEngineResponse);

    } catch (err: any) {
      toast.error(err.message ?? 'Could not apply suggestion');
    } finally {
      setApplyingId(null);
    }
  };

  if (loading && !data) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="h-20 w-full animate-pulse rounded bg-muted" />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4" />
          <span>Smart recommendations unavailable</span>
        </div>
      </Card>
    );
  }

  const { base_strategy, snowball, avalanche, recommendations } = data;

  const iconMap = {
    accelerate: '⚡',
    strategy_compare: '🎯',
    interest_savings: '💰',
    momentum: '🔥'
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Smart Recommendations</h3>
      </div>

      <p className="mb-2 text-sm text-muted-foreground">
        Currently using <span className="font-semibold capitalize text-foreground">{base_strategy}</span> strategy
      </p>

      <div className="mb-4 text-xs text-muted-foreground">
        Snowball: {snowball.months}mo, {formatCurrency(snowball.total_interest)} •
        Avalanche: {avalanche.months}mo, {formatCurrency(avalanche.total_interest)}
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          No specific tweaks to suggest. Keep making consistent payments!
        </div>
      ) : (
        <div className="space-y-2">
          {recommendations.map(rec => (
            <div key={rec.id} className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex gap-2 text-sm">
                <span className="text-lg" aria-hidden="true">{iconMap[rec.type] || '•'}</span>
                <span className="flex-1 text-foreground">{rec.text}</span>
              </div>
              {rec.action && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleApply(rec)}
                    disabled={applyingId === rec.id}
                    className="h-7 text-xs"
                  >
                    {applyingId === rec.id ? (
                      <>Applying...</>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Apply this
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

const WhatIfCalculatorCard: React.FC = () => {
  const [strategy, setStrategy] = useState<Strategy>('snowball');
  const [monthlyExtra, setMonthlyExtra] = useState<string>('');
  const [lumpSum, setLumpSum] = useState<string>('');
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const runWhatIf = async () => {
    try {
      setLoading(true);

      const extraVal = monthlyExtra.trim() ? Number(monthlyExtra) : undefined;
      const lumpVal = lumpSum.trim() ? Number(lumpSum) : undefined;

      const { data, error } = await supabase.functions.invoke('what-if-calculator', {
        body: {
          strategy,
          monthly_extra: extraVal,
          lump_sum: lumpVal
        }
      });
      if (error) throw error;
      setResult(data as WhatIfResponse);
    } catch (e: any) {
      toast.error(e.message ?? 'What-if calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">What-If Calculator</h3>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Test extra payments or lump sums without changing your actual plan.
      </p>

      <div className="space-y-4">
        <div>
          <Label className="text-xs">Strategy to simulate</Label>
          <div className="mt-1 inline-flex rounded-lg border border-border bg-muted p-1">
            <Button
              size="sm"
              variant={strategy === 'snowball' ? 'default' : 'ghost'}
              onClick={() => setStrategy('snowball')}
              className="h-7 text-xs"
            >
              Snowball
            </Button>
            <Button
              size="sm"
              variant={strategy === 'avalanche' ? 'default' : 'ghost'}
              onClick={() => setStrategy('avalanche')}
              className="h-7 text-xs"
            >
              Avalanche
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="extra" className="text-xs">Monthly extra (what-if)</Label>
            <Input
              id="extra"
              type="number"
              value={monthlyExtra}
              onChange={e => setMonthlyExtra(e.target.value)}
              placeholder="Leave blank for current"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="lump" className="text-xs">One-time lump sum</Label>
            <Input
              id="lump"
              type="number"
              value={lumpSum}
              onChange={e => setLumpSum(e.target.value)}
              placeholder="0"
              className="mt-1"
            />
          </div>
        </div>

        <Button onClick={runWhatIf} disabled={loading} className="w-full">
          {loading ? 'Calculating...' : 'Run what-if'}
        </Button>
      </div>

      {result && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">Baseline</div>
            <div className="mt-1 text-xl font-bold text-foreground">{result.baseline.months} mo</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Debt-free: <span className="font-semibold text-foreground">{result.baseline.debt_free_date}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Interest: <span className="font-semibold text-foreground">{formatCurrency(result.baseline.total_interest)}</span>
            </div>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="text-xs text-muted-foreground">Scenario</div>
            <div className="mt-1 text-xl font-bold text-foreground">{result.scenario.months} mo</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Debt-free: <span className="font-semibold text-foreground">{result.scenario.debt_free_date}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Interest: <span className="font-semibold text-foreground">{formatCurrency(result.scenario.total_interest)}</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-primary">
              Save {result.baseline.months - result.scenario.months} months &
              {formatCurrency(result.baseline.total_interest - result.scenario.total_interest)} interest
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export const CoachRecommendationsPanel: React.FC = () => {
  const { data, loading, error } = useEdgeFunction<RecommendationEngineResponse>('recommendation-engine');

  if (loading && !data) {
    return (
      <Card className="p-6">
        <div className="h-32 w-full animate-pulse rounded bg-muted" />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>Coach playbook unavailable</span>
        </div>
      </Card>
    );
  }

  const { base_strategy, recommendations } = data;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Coach Playbook</h3>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Your coach would likely start with these moves, based on your current{' '}
        <span className="font-semibold capitalize text-foreground">{base_strategy}</span> plan.
      </p>

      {recommendations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You're on a solid path. No urgent adjustments needed right now.
        </p>
      ) : (
        <ol className="space-y-2">
          {recommendations.map((rec, idx) => (
            <li key={rec.id} className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
              <span className="font-semibold text-muted-foreground">Step {idx + 1}: </span>
              <span className="text-foreground">{rec.text}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
};

export const SmartPayoffSuite: React.FC = () => {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
      <SmartRecommendationsCard />
      <WhatIfCalculatorCard />
      <CoachRecommendationsPanel />
    </div>
  );
};

export default SmartPayoffSuite;
