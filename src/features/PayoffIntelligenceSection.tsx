import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, DollarSign, Target } from 'lucide-react';

type ProjectionResult = {
  strategy: 'snowball' | 'avalanche';
  months: number;
  debt_free_date: string;
  total_interest: number;
  monthly_projection: { month: number; remaining: number }[];
};

type ProjectionResponse = {
  snowball: ProjectionResult;
  avalanche: ProjectionResult;
};

type Recommendation = {
  type: 'accelerate' | 'strategy_compare' | 'momentum' | 'interest_savings';
  text: string;
};

type SmartRecommendationsResponse = {
  base_strategy: 'snowball' | 'avalanche';
  snowball: ProjectionResult;
  avalanche: ProjectionResult;
  recommendations: Recommendation[];
};

function useEdgeFunction<T>(name: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke(name, { body: {} });
        if (error) throw error;
        if (!cancelled) {
          setData(data as T);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? 'Something went wrong');
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
  }, [name]);

  return { data, loading, error };
}

function formatCurrency(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return '$0';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

const DebtFreeProjectionCard: React.FC = () => {
  const { data, loading, error } = useEdgeFunction<ProjectionResponse>('calculate-projection');

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="h-20 w-full animate-pulse rounded bg-muted" />
          <div className="h-20 w-full animate-pulse rounded bg-muted" />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          <span>Debt-free projection unavailable. Add debts to see your timeline.</span>
        </div>
      </Card>
    );
  }

  const { snowball, avalanche } = data;

  const betterTime = snowball.months < avalanche.months ? 'Snowball' : 
                     avalanche.months < snowball.months ? 'Avalanche' : 'Both';
  
  const betterInterest = snowball.total_interest < avalanche.total_interest ? 'Snowball' :
                         avalanche.total_interest < snowball.total_interest ? 'Avalanche' : 'Both';

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Debt-Free Projection</h3>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Compare Snowball (smallest balances first) vs Avalanche (highest APRs first) strategies.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Snowball
            </span>
            <Badge variant="secondary" className="text-[10px]">
              Motivation
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold text-foreground">{snowball.months}</span>
              <span className="text-sm text-muted-foreground">months</span>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Debt-free by <span className="font-semibold text-foreground">{snowball.debt_free_date}</span>
            </div>
            
            <div className="flex items-center gap-1 text-xs">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Interest:</span>
              <span className="font-semibold text-foreground">{formatCurrency(snowball.total_interest)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Avalanche
            </span>
            <Badge variant="secondary" className="text-[10px]">
              Math Optimal
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold text-foreground">{avalanche.months}</span>
              <span className="text-sm text-muted-foreground">months</span>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Debt-free by <span className="font-semibold text-foreground">{avalanche.debt_free_date}</span>
            </div>
            
            <div className="flex items-center gap-1 text-xs">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Interest:</span>
              <span className="font-semibold text-foreground">{formatCurrency(avalanche.total_interest)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Faster timeline:</span>
            <span className="ml-2 font-semibold text-foreground">{betterTime}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Less interest:</span>
            <span className="ml-2 font-semibold text-foreground">{betterInterest}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

const SmartRecommendationsCard: React.FC = () => {
  const { data, loading, error } = useEdgeFunction<SmartRecommendationsResponse>('smart-recommendations');

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="h-16 w-full animate-pulse rounded bg-muted" />
          <div className="h-16 w-full animate-pulse rounded bg-muted" />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>Smart recommendations unavailable</span>
        </div>
      </Card>
    );
  }

  const { base_strategy, recommendations, snowball, avalanche } = data;

  const iconMap = {
    accelerate: '⚡',
    strategy_compare: '🎯',
    interest_savings: '💰',
    momentum: '🔥'
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Smart Recommendations</h3>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Currently using <span className="font-semibold capitalize text-foreground">{base_strategy}</span> strategy • 
        Snowball: {snowball.months}mo, {formatCurrency(snowball.total_interest)} • 
        Avalanche: {avalanche.months}mo, {formatCurrency(avalanche.total_interest)}
      </p>

      {recommendations.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          No specific tweaks to suggest right now. Keep making consistent payments!
        </div>
      ) : (
        <div className="space-y-2">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex gap-3 rounded-xl border border-border bg-muted/30 p-3 text-sm"
            >
              <span className="text-lg" aria-hidden="true">
                {iconMap[rec.type] || '•'}
              </span>
              <span className="flex-1 text-foreground">{rec.text}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export const PayoffIntelligenceSection: React.FC = () => {
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <DebtFreeProjectionCard />
      <SmartRecommendationsCard />
    </div>
  );
};

export default PayoffIntelligenceSection;
