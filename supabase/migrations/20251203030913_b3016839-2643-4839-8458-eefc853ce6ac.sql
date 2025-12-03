-- Add notes column to debt_calculator_settings for user notes storage
-- (since user_plan_data is now read-only)
ALTER TABLE public.debt_calculator_settings
ADD COLUMN IF NOT EXISTS notes text DEFAULT '';