import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RecommendationImpact {
  months_saved?: number;
  interest_saved?: number;
  score_increase?: number;
}

export interface RecommendationAction {
  type: 'increase_payment' | 'pay_down_card' | 'switch_strategy';
  amount?: number;
  target_debt_id?: string;
}

export interface Recommendation {
  type: 'accelerate' | 'utilization' | 'strategy' | 'consolidation' | 'emergency';
  text: string;
  impact: RecommendationImpact;
  action?: RecommendationAction;
}

export interface RecommendationsResponse {
  strategy: string;
  recommendations: Recommendation[];
}

export function useRecommendations() {
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: response, error: invokeError } = await supabase.functions.invoke('generate-recommendations');
      
      if (invokeError) throw invokeError;
      if (response) {
        setData(response);
      }
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return { data, loading, error, refresh: fetchRecommendations };
}
