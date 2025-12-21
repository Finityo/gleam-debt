-- Enable pgcrypto extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Add encrypted columns for PII data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_encrypted bytea,
ADD COLUMN IF NOT EXISTS address_encrypted bytea,
ADD COLUMN IF NOT EXISTS zip_code_encrypted bytea;

-- Create encryption key function (uses a fixed application key - in production, use Vault)
CREATE OR REPLACE FUNCTION private_get_encryption_key()
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'finityo_pii_encryption_key_2025_v1'::text
$$;

-- Create encrypt function
CREATE OR REPLACE FUNCTION public.encrypt_pii(plaintext text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN NULL;
  END IF;
  RETURN extensions.pgp_sym_encrypt(plaintext, private_get_encryption_key());
END;
$$;

-- Create decrypt function
CREATE OR REPLACE FUNCTION public.decrypt_pii(ciphertext bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF ciphertext IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN extensions.pgp_sym_decrypt(ciphertext, private_get_encryption_key());
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL; -- Return NULL if decryption fails
END;
$$;

-- Migrate existing plaintext data to encrypted columns
UPDATE public.profiles
SET 
  phone_encrypted = public.encrypt_pii(phone),
  address_encrypted = public.encrypt_pii(address),
  zip_code_encrypted = public.encrypt_pii(zip_code)
WHERE phone IS NOT NULL OR address IS NOT NULL OR zip_code IS NOT NULL;

-- Create a trigger to auto-encrypt on insert/update
CREATE OR REPLACE FUNCTION public.encrypt_profile_pii()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt phone if provided in plaintext column
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    NEW.phone_encrypted := public.encrypt_pii(NEW.phone);
    NEW.phone := NULL; -- Clear plaintext
  END IF;
  
  -- Encrypt address if provided in plaintext column
  IF NEW.address IS NOT NULL AND NEW.address != '' THEN
    NEW.address_encrypted := public.encrypt_pii(NEW.address);
    NEW.address := NULL; -- Clear plaintext
  END IF;
  
  -- Encrypt zip_code if provided in plaintext column
  IF NEW.zip_code IS NOT NULL AND NEW.zip_code != '' THEN
    NEW.zip_code_encrypted := public.encrypt_pii(NEW.zip_code);
    NEW.zip_code := NULL; -- Clear plaintext
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS encrypt_profile_pii_trigger ON public.profiles;
CREATE TRIGGER encrypt_profile_pii_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_profile_pii();

-- Create a view that decrypts PII for authorized access
CREATE OR REPLACE VIEW public.profiles_decrypted AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  COALESCE(public.decrypt_pii(phone_encrypted), phone) as phone,
  COALESCE(public.decrypt_pii(address_encrypted), address) as address,
  COALESCE(public.decrypt_pii(zip_code_encrypted), zip_code) as zip_code,
  subscription_status,
  subscription_tier,
  subscription_product_id,
  subscription_price_id,
  trial_end_date,
  onboarding_completed,
  appearance_settings,
  created_at,
  updated_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.profiles_decrypted SET (security_invoker = on);

-- Clear the plaintext columns now that data is migrated
UPDATE public.profiles
SET 
  phone = NULL,
  address = NULL,
  zip_code = NULL
WHERE phone_encrypted IS NOT NULL 
   OR address_encrypted IS NOT NULL 
   OR zip_code_encrypted IS NOT NULL;