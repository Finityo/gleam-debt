-- Fix: Remove SECURITY DEFINER from view and recreate
DROP VIEW IF EXISTS public.plaid_link_conversion_stats;

CREATE OR REPLACE VIEW public.plaid_link_conversion_stats AS
SELECT 
  DATE_TRUNC('day', timestamp) as date,
  COUNT(DISTINCT link_session_id) as total_sessions,
  COUNT(DISTINCT CASE WHEN event_name = 'HANDOFF' THEN link_session_id END) as successful_sessions,
  COUNT(DISTINCT CASE WHEN event_name = 'EXIT' THEN link_session_id END) as abandoned_sessions,
  COUNT(DISTINCT CASE WHEN event_name = 'ERROR' THEN link_session_id END) as error_sessions,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_name = 'HANDOFF' THEN link_session_id END) / 
    NULLIF(COUNT(DISTINCT link_session_id), 0), 
    2
  ) as conversion_rate_pct
FROM public.plaid_link_events
WHERE event_name IN ('OPEN', 'HANDOFF', 'EXIT', 'ERROR')
  AND (auth.uid() = user_id OR user_id IS NULL)
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY date DESC;

-- Grant access to conversion stats view
GRANT SELECT ON public.plaid_link_conversion_stats TO authenticated;