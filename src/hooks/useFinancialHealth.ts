import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FinancialHealthScore {
  score: number;
  factors: {
    totalDebt: number;
    cardUtilization: number;
    extraPayment: number;
    progressBonus: number;
  };
}

export function useFinancialHealth() {
  const [score, setScore] = useState<FinancialHealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = async () => {
    try {
      setLoading(true);
      setError(null);

      // Compute fresh score
      const { data, error: invokeError } = await supabase.functions.invoke('compute-financial-health');
      
      if (invokeError) throw invokeError;
      if (data) {
        setScore(data);
      }
    } catch (err: any) {
      console.error('Error fetching financial health:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScore();
  }, []);

  return { score, loading, error, refresh: fetchScore };
}
