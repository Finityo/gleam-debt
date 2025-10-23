-- Create Link events table for conversion analytics
CREATE TABLE IF NOT EXISTS public.plaid_link_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  link_session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  view_name TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  institution_id TEXT,
  institution_name TEXT,
  error_type TEXT,
  error_code TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_link_events_session ON public.plaid_link_events(link_session_id);
CREATE INDEX IF NOT EXISTS idx_link_events_user ON public.plaid_link_events(user_id);
CREATE INDEX IF NOT EXISTS idx_link_events_name ON public.plaid_link_events(event_name);
CREATE INDEX IF NOT EXISTS idx_link_events_timestamp ON public.plaid_link_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_link_events_institution ON public.plaid_link_events(institution_id);

-- Enable RLS
ALTER TABLE public.plaid_link_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own link events"
  ON public.plaid_link_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own link events"
  ON public.plaid_link_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create function to log Link events for conversion tracking
CREATE OR REPLACE FUNCTION public.log_plaid_link_event(
  p_user_id UUID,
  p_link_session_id TEXT,
  p_event_name TEXT,
  p_view_name TEXT DEFAULT NULL,
  p_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_institution_id TEXT DEFAULT NULL,
  p_institution_name TEXT DEFAULT NULL,
  p_error_type TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.plaid_link_events (
    user_id,
    link_session_id,
    event_name,
    view_name,
    timestamp,
    institution_id,
    institution_name,
    error_type,
    error_code,
    error_message,
    metadata
  ) VALUES (
    p_user_id,
    p_link_session_id,
    p_event_name,
    p_view_name,
    p_timestamp,
    p_institution_id,
    p_institution_name,
    p_error_type,
    p_error_code,
    p_error_message,
    p_metadata
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Create view for conversion analytics
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
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY date DESC;

-- Grant access to conversion stats view
GRANT SELECT ON public.plaid_link_conversion_stats TO authenticated;