-- Create RPC function to get decrypted profile for current user
CREATE OR REPLACE FUNCTION public.get_my_profile_decrypted()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  phone text,
  address text,
  zip_code text,
  subscription_status text,
  subscription_tier text,
  subscription_product_id text,
  subscription_price_id text,
  trial_end_date timestamptz,
  onboarding_completed boolean,
  appearance_settings jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    COALESCE(public.decrypt_pii(p.phone_encrypted), p.phone) as phone,
    COALESCE(public.decrypt_pii(p.address_encrypted), p.address) as address,
    COALESCE(public.decrypt_pii(p.zip_code_encrypted), p.zip_code) as zip_code,
    p.subscription_status,
    p.subscription_tier,
    p.subscription_product_id,
    p.subscription_price_id,
    p.trial_end_date,
    p.onboarding_completed,
    p.appearance_settings,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
END;
$$;