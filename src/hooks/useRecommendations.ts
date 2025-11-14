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

  useEffect(() => {
    let mounted = true;

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated first
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (mounted) {
            setError('Not authenticated');
            setLoading(false);
          }
          return;
        }

        const { data: response, error: invokeError } = await supabase.functions.invoke('generate-recommendations');
        
        if (invokeError) throw invokeError;
        if (response && mounted) {
          setData(response);
        }
      } catch (err: any) {
        console.error('Error fetching recommendations:', err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      mounted = false;
    };
  }, []);

  const refresh = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      setLoading(true);
      setError(null);
      const { data: response, error: invokeError } = await supabase.functions.invoke('generate-recommendations');
      if (invokeError) throw invokeError;
      if (response) setData(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refresh };
}
