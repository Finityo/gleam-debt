-- ============================================================================
-- SECURITY FIX: User Roles Table - Add Write Policies
-- ============================================================================
-- Purpose: Enable role management while preventing privilege escalation
-- Security: Admins can modify roles but cannot change their own role
-- DO NOT DELETE: These policies are critical for secure role management
-- ============================================================================

-- Allow admins to insert new roles
CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update roles (EXCEPT their own - prevents privilege escalation)
CREATE POLICY "Admins can update other user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() != user_id
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() != user_id
);

-- Allow admins to delete roles (EXCEPT their own - prevents self-demotion)
CREATE POLICY "Admins can delete other user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() != user_id
);

-- ============================================================================
-- SECURITY FIX: Plaid Encrypted Tokens - Block Direct Access
-- ============================================================================
-- Purpose: Encrypted tokens should ONLY be accessed via SECURITY DEFINER functions
-- Security: No user should ever query this table directly, only backend functions
-- DO NOT DELETE: Critical protection for financial access tokens
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE public.plaid_encrypted_tokens ENABLE ROW LEVEL SECURITY;

-- Block ALL direct access - forces use of secure vault functions
CREATE POLICY "Block all direct access to encrypted tokens"
ON public.plaid_encrypted_tokens
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Service role (backend functions) can still access - bypasses RLS automatically
-- This ensures only get_plaid_token_from_vault() and store_plaid_token_in_vault() 
-- can read/write tokens, maintaining the encryption boundary