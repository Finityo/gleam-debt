-- Add snapshot column to user_plan_versions for v2 API
-- This stores the full plan snapshot as JSON for version history
ALTER TABLE public.user_plan_versions
ADD COLUMN IF NOT EXISTS snapshot jsonb DEFAULT '{}'::jsonb;

-- Add description column (replaces change_description for consistency)
ALTER TABLE public.user_plan_versions
ADD COLUMN IF NOT EXISTS description text DEFAULT NULL;