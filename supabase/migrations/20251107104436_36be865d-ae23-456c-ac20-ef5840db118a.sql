-- ============================================
-- CRITICAL SECURITY FIXES (Revised)
-- ============================================

-- 1. REMOVE PLAINTEXT ACCESS_TOKEN COLUMN (Complete Plaid Token Migration)
-- This completes the migration from plaintext to encrypted storage
ALTER TABLE public.plaid_items DROP COLUMN IF EXISTS access_token;

-- 2. EXPLICIT ANONYMOUS ACCESS DENIAL FOR PROFILES TABLE
-- Protect customer personal data (phone, address, zip codes)
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;
CREATE POLICY "Block anonymous access to profiles"
  ON public.profiles
  FOR ALL
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 3. PHONE NUMBER HARVESTING PROTECTION
-- Add SELECT policy for OTP attempts (admin-only)
DROP POLICY IF EXISTS "Admins can view OTP verification attempts" ON public.otp_verification_attempts;
CREATE POLICY "Admins can view OTP verification attempts"
  ON public.otp_verification_attempts
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. FIX FUNCTION SEARCH PATHS (Security Issue)
-- Update cleanup_old_analytics function with proper search_path
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Anonymize PII in events older than 90 days
  UPDATE public.analytics_events
  SET 
    ip_address = NULL,
    user_agent = NULL,
    metadata = CASE 
      WHEN metadata IS NOT NULL THEN jsonb_build_object('anonymized', true, 'original_keys', jsonb_object_keys(metadata))
      ELSE NULL
    END
  WHERE created_at < now() - interval '90 days'
    AND (ip_address IS NOT NULL OR user_agent IS NOT NULL);
    
  -- Delete anonymous events older than 1 year (no user association)
  DELETE FROM public.analytics_events
  WHERE created_at < now() - interval '1 year'
    AND user_id IS NULL;
END;
$$;

-- Update update_coach_comments_updated_at with proper search_path
CREATE OR REPLACE FUNCTION public.update_coach_comments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 5. IP ADDRESS HASHING UTILITY (Privacy Enhancement)
-- Add function to hash IP addresses for consent logs
CREATE OR REPLACE FUNCTION public.hash_ip_address(ip_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN encode(digest(ip_text || 'finityo_salt_2025', 'sha256'), 'hex');
END;
$$;

-- 6. SECURITY DOCUMENTATION
COMMENT ON TABLE public.plaid_encrypted_tokens IS 'Encrypted Plaid access tokens stored securely. Direct access blocked by RLS.';
COMMENT ON TABLE public.otp_verification_attempts IS 'OTP verification attempt logs. Phone numbers visible to admins only for security monitoring.';
COMMENT ON TABLE public.profiles IS 'User profile information. Contains PII protected by RLS - only accessible to the owning user.';
COMMENT ON COLUMN public.plaid_items.vault_secret_id IS 'References encrypted token in plaid_encrypted_tokens table. Plaintext access_token column has been removed for security.';