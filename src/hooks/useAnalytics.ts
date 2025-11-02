import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type EventType = 
  | 'page_view'
  | 'signup'
  | 'login'
  | 'debt_added'
  | 'debt_deleted'
  | 'debt_imported'
  | 'plan_calculated'
  | 'bank_connected'
  | 'bank_disconnected'
  | 'hero_cta_click'
  | 'demo_cta_click';

export const useAnalytics = () => {
  const trackEvent = async (eventType: EventType, metadata?: Record<string, any>) => {
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
