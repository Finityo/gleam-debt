-- Create table to track OTP verification attempts
CREATE TABLE IF NOT EXISTS public.otp_verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  ip_address TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.otp_verification_attempts ENABLE ROW LEVEL SECURITY;

-- System can insert logs (from edge functions using service role)
CREATE POLICY "System can insert OTP attempt logs"
ON public.otp_verification_attempts
FOR INSERT
WITH CHECK (true);

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(
  p_phone TEXT,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS TABLE (
  allowed BOOLEAN,
  attempts_count INTEGER,
  wait_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone_attempts INTEGER;
  v_ip_attempts INTEGER;
  v_recent_window TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check attempts in last 15 minutes
  v_recent_window := NOW() - INTERVAL '15 minutes';
  
  -- Count failed attempts by phone
  SELECT COUNT(*) INTO v_phone_attempts
  FROM public.otp_verification_attempts
  WHERE phone = p_phone
    AND success = false
    AND attempted_at > v_recent_window;
  
  -- Count failed attempts by IP (if provided)
  IF p_ip_address IS NOT NULL THEN
    SELECT COUNT(*) INTO v_ip_attempts
    FROM public.otp_verification_attempts
    WHERE ip_address = p_ip_address
      AND success = false
      AND attempted_at > v_recent_window;
  ELSE
    v_ip_attempts := 0;
  END IF;
  
  -- Allow if under 5 attempts for both phone and IP
  IF v_phone_attempts >= 5 OR v_ip_attempts >= 10 THEN
    RETURN QUERY SELECT false, GREATEST(v_phone_attempts, v_ip_attempts), 900; -- 15 min wait
  ELSE
    RETURN QUERY SELECT true, GREATEST(v_phone_attempts, v_ip_attempts), 0;
  END IF;
END;
$$;