-- Add debt_type and notes columns to debts table
ALTER TABLE public.debts 
ADD COLUMN debt_type TEXT DEFAULT 'personal',
ADD COLUMN notes TEXT;

-- Add a comment to describe the debt_type field
COMMENT ON COLUMN public.debts.debt_type IS 'Type of debt: personal, child, parent, spouse, or other';
COMMENT ON COLUMN public.debts.notes IS 'Optional notes about the debt for context';