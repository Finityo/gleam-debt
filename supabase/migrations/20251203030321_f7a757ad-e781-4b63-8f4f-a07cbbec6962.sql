-- Fix security issues from previous migration

-- 1. Enable RLS on the backup table (it's a copy, should have same protection)
ALTER TABLE public.user_plan_data_backup ENABLE ROW LEVEL SECURITY;

-- Policy for backup table - admin only access
CREATE POLICY "Admins can view backup data"
ON public.user_plan_data_backup FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Fix function search_path for prevent_user_plan_data_writes
CREATE OR REPLACE FUNCTION public.prevent_user_plan_data_writes()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'user_plan_data is read-only; use debts table instead';
END;
$$;