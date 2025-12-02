-- ============================================================
-- Create debt_integrity_logs table for agent violation tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS public.debt_integrity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('excel', 'plaid', 'manual', 'engine')),
  context TEXT NOT NULL CHECK (context IN ('import', 'edit', 'compute')),
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.debt_integrity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own integrity logs"
  ON public.debt_integrity_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert integrity logs"
  ON public.debt_integrity_logs
  FOR INSERT
  WITH CHECK (true);

-- Index for performance
CREATE INDEX idx_debt_integrity_logs_user_created 
  ON public.debt_integrity_logs(user_id, created_at DESC);

CREATE INDEX idx_debt_integrity_logs_source_context 
  ON public.debt_integrity_logs(source, context);