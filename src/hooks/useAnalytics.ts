import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAnalytics = () => {
  const trackEvent = async (eventType: string, metadata?: Record<string, any>) => {
    try {
      // Call server-side analytics endpoint
      await supabase.functions.invoke('track-event', {
        body: {
          event_type: eventType,
          page_path: window.location.pathname,
          metadata,
        },
      });
    } catch (error) {
      // Silently fail analytics - don't disrupt user experience
      if (import.meta.env.DEV) {
        console.error('Analytics tracking error:', error);
      }
    }
  };

  const trackPageView = () => {
    trackEvent('page_view', {
      referrer: document.referrer,
      title: document.title,
    });
  };

  useEffect(() => {
    trackPageView();
  }, []);

  return { trackEvent, trackPageView };
};
