-- ============================================================================
-- SECURITY FIX: Analytics Events - Proper RLS and Data Protection
-- ============================================================================
-- Purpose: Prevent data exfiltration and abuse of analytics table
-- Security: Only edge functions can insert, users can view their own data
-- DO NOT DELETE: Critical protection against analytics abuse
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- SECURITY: Only service role (edge functions) can insert analytics
-- Prevents direct client-side insertion and data exfiltration attacks
CREATE POLICY "Service role can insert analytics"
ON public.analytics_events
FOR INSERT
TO service_role
WITH CHECK (true);

-- SECURITY: Users can view their own analytics (GDPR compliance)
CREATE POLICY "Users can view own analytics"
ON public.analytics_events
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- SECURITY: No one can update or delete analytics (append-only audit log)
-- Analytics are immutable for compliance and audit trail integrity

-- ============================================================================
-- SECURITY: Analytics Data Retention and PII Anonymization
-- ============================================================================
-- Purpose: GDPR/CCPA compliance - anonymize old PII data
-- DO NOT DELETE: Required for privacy law compliance
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Anonymize PII in events older than 90 days
  UPDATE public.analytics_events
  SET 
    ip_address = NULL,
    user_agent = NULL,
    metadata = CASE 
      WHEN metadata IS NOT NULL THEN jsonb_build_object('anonymized', true, 'original_keys', jsonb_object_keys(metadata))
      ELSE NULL
    END
  WHERE created_at < now() - interval '90 days'
    AND (ip_address IS NOT NULL OR user_agent IS NOT NULL);
    
  -- Delete anonymous events older than 1 year (no user association)
  DELETE FROM public.analytics_events
  WHERE created_at < now() - interval '1 year'
    AND user_id IS NULL;
END;
$$;

-- ============================================================================
-- SECURITY FIX: Error Logging Table for Secure Audit Trail
-- ============================================================================
-- Purpose: Store detailed errors server-side without exposing to clients
-- Security: Only admins can view error logs
-- DO NOT DELETE: Critical for debugging without information disclosure
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  error_message text NOT NULL,
  error_type text,
  error_stack text,
  user_id uuid,
  request_path text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can insert error logs
CREATE POLICY "Service role can insert error logs"
ON public.error_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Only admins can view error logs
CREATE POLICY "Admins can view error logs"
ON public.error_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- No updates or deletes (append-only audit log)

COMMENT ON TABLE public.error_logs IS 'Server-side error logging for security and debugging. Never expose to clients.';
COMMENT ON FUNCTION public.cleanup_old_analytics() IS 'GDPR/CCPA compliance: Anonymizes PII in analytics after 90 days, deletes anonymous events after 1 year. Run daily via cron.';