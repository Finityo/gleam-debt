-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warn', 'error', 'critical')),
  description TEXT NOT NULL,
  metadata JSONB,
  auto_fixed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view security audit logs
CREATE POLICY "Admins can view security audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert security audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);