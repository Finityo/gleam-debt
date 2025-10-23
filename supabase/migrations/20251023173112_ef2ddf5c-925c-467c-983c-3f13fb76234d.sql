-- Add Plaid API request logging table for debugging and support
CREATE TABLE IF NOT EXISTS public.plaid_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id TEXT,
  endpoint TEXT NOT NULL,
  request_id TEXT NOT NULL,
  status_code INTEGER,
  error_code TEXT,
  error_type TEXT,
  error_message TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add token rotation tracking to plaid_items
ALTER TABLE public.plaid_items 
ADD COLUMN IF NOT EXISTS token_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS token_last_rotated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS token_rotation_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS token_rotation_reason TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_plaid_api_logs_user_id ON public.plaid_api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_api_logs_created_at ON public.plaid_api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plaid_api_logs_request_id ON public.plaid_api_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_plaid_items_token_rotation ON public.plaid_items(token_rotation_required) WHERE token_rotation_required = TRUE;

-- Enable RLS
ALTER TABLE public.plaid_api_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for plaid_api_logs
CREATE POLICY "Users can view their own API logs"
  ON public.plaid_api_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert API logs"
  ON public.plaid_api_logs
  FOR INSERT
  WITH CHECK (true);

-- Create function to log Plaid API calls
CREATE OR REPLACE FUNCTION public.log_plaid_api_call(
  p_user_id UUID,
  p_item_id TEXT,
  p_endpoint TEXT,
  p_request_id TEXT,
  p_status_code INTEGER DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_error_type TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_response_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.plaid_api_logs (
    user_id,
    item_id,
    endpoint,
    request_id,
    status_code,
    error_code,
    error_type,
    error_message,
    response_time_ms
  ) VALUES (
    p_user_id,
    p_item_id,
    p_endpoint,
    p_request_id,
    p_status_code,
    p_error_code,
    p_error_type,
    p_error_message,
    p_response_time_ms
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;