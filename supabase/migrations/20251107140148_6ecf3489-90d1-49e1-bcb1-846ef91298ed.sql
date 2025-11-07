-- Create user_plan_versions table for plan history tracking
CREATE TABLE public.user_plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_id TEXT NOT NULL,
  debts JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT DEFAULT '',
  plan JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_description TEXT
);

-- Enable RLS
ALTER TABLE public.user_plan_versions ENABLE ROW LEVEL SECURITY;

-- Users can view their own versions
CREATE POLICY "Users can view their own plan versions"
ON public.user_plan_versions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own versions
CREATE POLICY "Users can insert their own plan versions"
ON public.user_plan_versions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own versions
CREATE POLICY "Users can delete their own plan versions"
ON public.user_plan_versions
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX idx_user_plan_versions_user_id ON public.user_plan_versions(user_id);
CREATE INDEX idx_user_plan_versions_created_at ON public.user_plan_versions(created_at DESC);
CREATE INDEX idx_user_plan_versions_version_id ON public.user_plan_versions(version_id);

-- Enable realtime for live updates
ALTER TABLE public.user_plan_versions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_plan_versions;