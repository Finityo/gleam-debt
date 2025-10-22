-- Create consent log table for Plaid authorization audit trail
CREATE TABLE IF NOT EXISTS public.plaid_consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consented_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  accepted_terms BOOLEAN NOT NULL DEFAULT true,
  accepted_privacy BOOLEAN NOT NULL DEFAULT true,
  plaid_privacy_version TEXT,
  finityo_terms_version TEXT
);

-- Enable RLS
ALTER TABLE public.plaid_consent_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own consent logs"
  ON public.plaid_consent_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert consent logs"
  ON public.plaid_consent_log FOR INSERT
  WITH CHECK (true);

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.plaid_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  ip_address TEXT
);

-- Index for fast rate limit queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action_time 
  ON public.plaid_rate_limits(user_id, action_type, attempted_at);

-- Enable RLS
ALTER TABLE public.plaid_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own rate limits"
  ON public.plaid_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert rate limits"
  ON public.plaid_rate_limits FOR INSERT
  WITH CHECK (true);

-- Create function to clean up Plaid data on user deletion
CREATE OR REPLACE FUNCTION public.cleanup_plaid_data_on_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete Plaid items (cascades to plaid_accounts via foreign key)
  DELETE FROM public.plaid_items WHERE user_id = OLD.id;
  
  -- Delete debts
  DELETE FROM public.debts WHERE user_id = OLD.id;
  
  -- Delete consent logs
  DELETE FROM public.plaid_consent_log WHERE user_id = OLD.id;
  
  -- Delete rate limit logs
  DELETE FROM public.plaid_rate_limits WHERE user_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user deletion cleanup
DROP TRIGGER IF EXISTS cleanup_on_user_delete ON auth.users;
CREATE TRIGGER cleanup_on_user_delete
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_plaid_data_on_user_delete();