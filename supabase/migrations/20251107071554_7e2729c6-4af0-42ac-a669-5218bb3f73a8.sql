-- Drop existing shared_plans table
DROP TABLE IF EXISTS public.shared_plans CASCADE;

-- Create simple public_shares table
CREATE TABLE public.public_shares (
  id TEXT PRIMARY KEY DEFAULT substring(gen_random_uuid()::text, 1, 8),
  snapshot JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.public_shares ENABLE ROW LEVEL SECURITY;

-- Anyone can view shared plans
CREATE POLICY "Anyone can view public shares"
  ON public.public_shares
  FOR SELECT
  USING (true);

-- Authenticated users can create shares
CREATE POLICY "Authenticated users can create shares"
  ON public.public_shares
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Drop the increment function as we're simplifying
DROP FUNCTION IF EXISTS public.increment_shared_plan_views(text);