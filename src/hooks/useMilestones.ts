import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Milestone {
  id: string;
  milestone_type: string;
  date_reached: string;
  metadata: any;
}

export interface MilestoneProgress {
  totalOriginal: number;
  remaining: number;
  paidOff: number;
  percentPaid: number;
  paidOffCount: number;
}

export function useMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [progress, setProgress] = useState<MilestoneProgress | null>(null);
  const [newMilestones, setNewMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkMilestones = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: invokeError } = await supabase.functions.invoke('check-milestones');
      
      if (invokeError) throw invokeError;
      
      if (data) {
        setMilestones(data.milestones || []);
        setProgress(data.progress);
        if (data.newMilestones?.length > 0) {
          setNewMilestones(data.newMilestones);
        }
      }
    } catch (err: any) {
      console.error('Error checking milestones:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMilestones();
  }, []);

  return { milestones, progress, newMilestones, loading, error, refresh: checkMilestones };
}
