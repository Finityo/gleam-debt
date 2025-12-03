-- ==========================================
-- 1. user_plan_data → READ-ONLY / HISTORICAL ONLY
-- ==========================================

-- Add an is_historical flag if it doesn't exist yet
ALTER TABLE user_plan_data
ADD COLUMN IF NOT EXISTS is_historical boolean DEFAULT false;

-- Optional safety: snapshot backup BEFORE we touch behavior
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'user_plan_data_backup'
  ) THEN
    CREATE TABLE user_plan_data_backup AS
    SELECT * FROM user_plan_data;
  END IF;
END$$;

-- Mark ALL existing rows as historical.
-- We are officially saying: nothing in here is authoritative anymore.
UPDATE user_plan_data
SET is_historical = true
WHERE is_historical = false;

-- Hard guard: prevent new writes to user_plan_data from app code
-- (You can still bypass this manually as admin if needed.)
CREATE OR REPLACE FUNCTION public.prevent_user_plan_data_writes()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'user_plan_data is read-only; use debts table instead';
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS trg_prevent_user_plan_data_insupd ON user_plan_data;

-- Recreate trigger to block INSERT / UPDATE
CREATE TRIGGER trg_prevent_user_plan_data_insupd
BEFORE INSERT OR UPDATE ON user_plan_data
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_plan_data_writes();

-- ==========================================
-- 2. debt_imports → ONE-TIME STAGING TABLE (CREATE IF NOT EXISTS)
-- ==========================================

-- Create debt_imports table for one-time staging
CREATE TABLE IF NOT EXISTS public.debt_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  raw_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.debt_imports ENABLE ROW LEVEL SECURITY;

-- RLS policies for debt_imports
CREATE POLICY "Users can view their own imports"
ON public.debt_imports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own imports"
ON public.debt_imports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own imports"
ON public.debt_imports FOR UPDATE
USING (auth.uid() = user_id);

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_debt_imports_user_used
ON debt_imports (user_id, used);

-- ==========================================
-- 3. Mark demo/test rows as historical (by user_id pattern)
-- ==========================================

-- Mark any clearly demo/test users as historical only by known patterns
UPDATE user_plan_data
SET is_historical = true
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000000'
);