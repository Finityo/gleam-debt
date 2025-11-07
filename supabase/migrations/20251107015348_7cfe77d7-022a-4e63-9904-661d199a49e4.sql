-- Create shared_plans table for public read-only plan snapshots
CREATE TABLE public.shared_plans (
  id TEXT PRIMARY KEY DEFAULT substring(gen_random_uuid()::text, 1, 8),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_data JSONB NOT NULL,
  debts_data JSONB NOT NULL,
  settings_data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days')
);

-- Enable RLS
ALTER TABLE public.shared_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view shared plans (public read)
CREATE POLICY "Anyone can view shared plans"
ON public.shared_plans
FOR SELECT
USING (true);

-- Policy: Users can create their own shared plans
CREATE POLICY "Users can create shared plans"
ON public.shared_plans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own shared plans
CREATE POLICY "Users can delete own shared plans"
ON public.shared_plans
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_shared_plans_user_id ON public.shared_plans(user_id);
CREATE INDEX idx_shared_plans_created_at ON public.shared_plans(created_at);

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_shared_plan_views(p_plan_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.shared_plans
  SET views_count = views_count + 1
  WHERE id = p_plan_id;
END;
$function$;