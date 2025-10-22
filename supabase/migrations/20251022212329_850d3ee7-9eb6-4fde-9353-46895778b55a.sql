-- Security Fix Part 2: Only add missing RLS policies for support_tickets
-- The other fixes were already applied

-- Check if policies exist before creating them
DO $$
BEGIN
  -- Only create policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'support_tickets' 
    AND policyname = 'Users can view their own tickets'
  ) THEN
    CREATE POLICY "Users can view their own tickets"
    ON public.support_tickets
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'support_tickets' 
    AND policyname = 'Users can create their own tickets'
  ) THEN
    CREATE POLICY "Users can create their own tickets"
    ON public.support_tickets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'support_tickets' 
    AND policyname = 'Users can update their own tickets'
  ) THEN
    CREATE POLICY "Users can update their own tickets"
    ON public.support_tickets
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'support_tickets' 
    AND policyname = 'Admins can view all tickets'
  ) THEN
    CREATE POLICY "Admins can view all tickets"
    ON public.support_tickets
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'support_tickets' 
    AND policyname = 'Admins can update all tickets'
  ) THEN
    CREATE POLICY "Admins can update all tickets"
    ON public.support_tickets
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;