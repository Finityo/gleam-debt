-- Create table to store pre-computed debt plans
CREATE TABLE IF NOT EXISTS public.debt_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy TEXT NOT NULL CHECK (strategy IN ('snowball', 'avalanche')),
  extra_monthly NUMERIC NOT NULL DEFAULT 0,
  one_time NUMERIC NOT NULL DEFAULT 0,
  plan_data JSONB NOT NULL,
  debt_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, strategy)
);

-- Enable RLS
ALTER TABLE public.debt_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own debt plans"
  ON public.debt_plans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debt plans"
  ON public.debt_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debt plans"
  ON public.debt_plans
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debt plans"
  ON public.debt_plans
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_debt_plans_updated_at
  BEFORE UPDATE ON public.debt_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_debt_plans_user_strategy ON public.debt_plans(user_id, strategy);