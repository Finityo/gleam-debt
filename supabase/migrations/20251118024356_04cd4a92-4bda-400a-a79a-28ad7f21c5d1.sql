-- Allow authenticated users to check their own team access status
-- This is needed for the login flow to verify team membership
CREATE POLICY "Users can view their own team access"
ON public.team_access
FOR SELECT
TO authenticated
USING (email = (auth.jwt() ->> 'email'::text));