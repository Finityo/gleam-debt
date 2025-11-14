import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SpendingTotals {
  minimumPayments: number;
  extraPayments: number;
  oneTimePayments: number;
  totalDebtPayments: number;
  monthlyInterest: number;
}

export interface SpendingAnomaly {
  type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion: string;
}

export interface SpendingInsights {
  month: string;
  totals: SpendingTotals;
  anomalies: SpendingAnomaly[];
}

export function useSpendingInsights() {
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: invokeError } = await supabase.functions.invoke('generate-spending-insights');
      
      if (invokeError) throw invokeError;
      
      if (data) {
        setInsights(data);
      }
    } catch (err: any) {
      console.error('Error generating spending insights:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInsights();
  }, []);

  return { insights, loading, error, refresh: generateInsights };
}
