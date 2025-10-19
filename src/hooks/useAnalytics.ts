import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAnalytics = () => {
  const trackEvent = async (eventType: string, metadata?: Record<string, any>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      await supabase.from('analytics_events').insert({
        event_type: eventType,
        user_id: session?.user?.id || null,
        page_path: window.location.pathname,
        metadata,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
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
