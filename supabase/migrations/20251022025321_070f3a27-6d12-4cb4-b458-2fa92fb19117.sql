-- Remove anonymous insert policy for analytics_events (now using server-side tracking)
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;

-- Analytics are now inserted via track-event edge function using service role
-- No direct client inserts allowed