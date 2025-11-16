import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Global analytics tracker component
 * Tracks page visits for analytics dashboard
 */
export const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageVisit();
  }, [location.pathname]);

  const trackPageVisit = async () => {
    try {
      const { error } = await supabase.functions.invoke('track-visit', {
        body: {
          page_path: location.pathname,
          referrer: document.referrer,
        },
      });

      if (error) {
        console.error('Failed to track visit:', error);
      }
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  };

  return null;
};
