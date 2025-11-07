-- Add versions column to user_plan_data for inline version history
ALTER TABLE public.user_plan_data 
ADD COLUMN IF NOT EXISTS versions JSONB DEFAULT '[]'::jsonb;