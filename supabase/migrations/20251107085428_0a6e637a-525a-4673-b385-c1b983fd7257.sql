-- Create coach_comments table for sharing suggestions
CREATE TABLE IF NOT EXISTS public.coach_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id TEXT NOT NULL,
  coach_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read coach comments
CREATE POLICY "Anyone can read coach comments"
  ON public.coach_comments
  FOR SELECT
  USING (true);

-- Allow authenticated users to add coach comments
CREATE POLICY "Authenticated users can add coach comments"
  ON public.coach_comments
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own comments
CREATE POLICY "Users can update coach comments"
  ON public.coach_comments
  FOR UPDATE
  USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coach_comments_share_id ON public.coach_comments(share_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_coach_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coach_comments_updated_at
  BEFORE UPDATE ON public.coach_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_comments_updated_at();