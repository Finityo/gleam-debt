-- Drop existing user_milestones table if it exists (old schema)
DROP TABLE IF EXISTS public.user_milestones CASCADE;

-- Create new user_milestones table with enhanced schema
CREATE TABLE IF NOT EXISTS public.user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('bronze', 'silver', 'gold', 'platinum')),
  title TEXT NOT NULL,
  description TEXT,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_milestones_unique_code
  ON public.user_milestones (user_id, code);

CREATE INDEX IF NOT EXISTS user_milestones_user_created_idx
  ON public.user_milestones (user_id, achieved_at DESC);

-- Enable RLS
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own milestones"
  ON public.user_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones"
  ON public.user_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create debt_goals table
CREATE TABLE IF NOT EXISTS public.debt_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  target_value NUMERIC,
  target_date DATE,
  strategy TEXT CHECK (strategy IN ('snowball', 'avalanche')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'met', 'missed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS debt_goals_user_status_idx
  ON public.debt_goals (user_id, status, target_date);

-- Enable RLS
ALTER TABLE public.debt_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for debt_goals
CREATE POLICY "Users can view their own goals"
  ON public.debt_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON public.debt_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON public.debt_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON public.debt_goals FOR DELETE
  USING (auth.uid() = user_id);