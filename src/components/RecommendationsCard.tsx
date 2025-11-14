import React, { useState, useEffect } from 'react';
import { useRecommendations, Recommendation } from '@/hooks/useRecommendations';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, CreditCard, Shuffle, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const iconMap = {
  accelerate: TrendingUp,
  utilization: CreditCard,
  strategy: Shuffle,
  consolidation: Lightbulb,
  emergency: AlertTriangle,
};

const colorMap = {
  accelerate: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  utilization: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
  strategy: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  consolidation: 'text-green-600 dark:text-green-400 bg-green-500/10',
  emergency: 'text-red-600 dark:text-red-400 bg-red-500/10',
};

interface RecommendationItemProps {
  recommendation: Recommendation;
  onApply: (rec: Recommendation) => void;
}

const RecommendationItem: React.FC<RecommendationItemProps> = ({ recommendation, onApply }) => {
  const [applied, setApplied] = useState(false);
  const Icon = iconMap[recommendation.type];

  const handleApply = () => {
    setApplied(true);
    onApply(recommendation);
    toast.success('Recommendation applied! Check your debt plan.');
  };

  return (
    <div className={`rounded-xl border border-border p-4 transition-all ${applied ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 ${colorMap[recommendation.type]}`}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 space-y-2">
          <p className="text-sm text-foreground leading-relaxed">{recommendation.text}</p>
          
          {Object.keys(recommendation.impact).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recommendation.impact.months_saved && (
                <Badge variant="secondary" className="text-[10px]">
                  Save {recommendation.impact.months_saved} months
                </Badge>
              )}
              {recommendation.impact.interest_saved && (
                <Badge variant="secondary" className="text-[10px]">
                  Save ${recommendation.impact.interest_saved} interest
                </Badge>
              )}
              {recommendation.impact.score_increase && (
                <Badge variant="secondary" className="text-[10px]">
                  +{recommendation.impact.score_increase} score
                </Badge>
              )}
            </div>
          )}

          {recommendation.action && !applied && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleApply}
              className="h-7 text-xs"
            >
              Apply suggestion <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}

          {applied && (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              Applied
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const RecommendationsCard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { data, loading, error } = useRecommendations();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  // Don't show when not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleApplyRecommendation = (rec: Recommendation) => {
    console.log('Applying recommendation:', rec);
    
    if (rec.action?.type === 'increase_payment') {
      toast.success(`Open your debt plan to add $${rec.action.amount}/month`, {
        description: 'Navigate to Debt Plan → Settings to update your extra monthly payment.'
      });
    } else if (rec.action?.type === 'pay_down_card') {
      toast.success('Make an extra payment on this card', {
        description: 'Consider making a one-time payment to reduce utilization.'
      });
    } else if (rec.action?.type === 'switch_strategy') {
      toast.success('Review debt strategies', {
        description: 'Navigate to Debt Plan → Settings to compare Snowball vs Avalanche.'
      });
    }
  };

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
          <Lightbulb className="h-4 w-4" />
          <span>Recommendations unavailable</span>
        </div>
      </Card>
    );
  }

  const { recommendations } = data;

  if (recommendations.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="font-semibold text-foreground">You're on track!</h3>
            <p className="text-sm text-muted-foreground">
              No urgent recommendations right now. Keep up the great work.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Smart Recommendations</h3>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Personalized insights to accelerate your debt-free journey using the <span className="font-semibold capitalize">{data.strategy}</span> method.
      </p>

      <div className="space-y-3">
        {recommendations.map((rec, idx) => (
          <RecommendationItem
            key={idx}
            recommendation={rec}
            onApply={handleApplyRecommendation}
          />
        ))}
      </div>
    </Card>
  );
};

export default RecommendationsCard;
