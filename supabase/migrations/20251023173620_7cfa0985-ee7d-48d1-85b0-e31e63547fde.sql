-- Add link_session_id tracking to plaid_items for diagnostics
ALTER TABLE public.plaid_items
ADD COLUMN IF NOT EXISTS link_session_id TEXT;

-- Add account_id to plaid_api_logs for better diagnostics
ALTER TABLE public.plaid_api_logs
ADD COLUMN IF NOT EXISTS account_id TEXT;

-- Create frontend error logging table for Plaid Link errors
CREATE TABLE IF NOT EXISTS public.plaid_link_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  link_session_id TEXT NOT NULL,
  request_id TEXT,
  error_type TEXT,
  error_code TEXT,
  error_message TEXT,
  display_message TEXT,
  institution_id TEXT,
  institution_name TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add index for link_session_id lookups
CREATE INDEX IF NOT EXISTS idx_plaid_items_link_session_id ON public.plaid_items(link_session_id);
CREATE INDEX IF NOT EXISTS idx_plaid_link_errors_session ON public.plaid_link_errors(link_session_id);
CREATE INDEX IF NOT EXISTS idx_plaid_link_errors_user ON public.plaid_link_errors(user_id);

-- Enable RLS on plaid_link_errors
ALTER TABLE public.plaid_link_errors ENABLE ROW LEVEL SECURITY;

-- RLS policies for plaid_link_errors
CREATE POLICY "Users can view their own link errors"
  ON public.plaid_link_errors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own link errors"
  ON public.plaid_link_errors
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create function to log Plaid Link errors
CREATE OR REPLACE FUNCTION public.log_plaid_link_error(
  p_user_id UUID,
  p_link_session_id TEXT,
  p_request_id TEXT DEFAULT NULL,
  p_error_type TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_display_message TEXT DEFAULT NULL,
  p_institution_id TEXT DEFAULT NULL,
  p_institution_name TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.plaid_link_errors (
    user_id,
    link_session_id,
    request_id,
    error_type,
    error_code,
    error_message,
    display_message,
    institution_id,
    institution_name,
    status
  ) VALUES (
    p_user_id,
    p_link_session_id,
    p_request_id,
    p_error_type,
    p_error_code,
    p_error_message,
    p_display_message,
    p_institution_id,
    p_institution_name,
    p_status
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;