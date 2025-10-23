-- Remove duplicate user role from info@finityo.com (keep admin only)
DELETE FROM public.user_roles 
WHERE user_id = 'ef6f9eed-edbf-46e1-ae4c-b2a397f35404' 
AND role = 'user';

-- Drop the old unique constraint that allowed multiple roles per user
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Add unique constraint to ensure one user can only have ONE role
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Create function to validate admin email domain
CREATE OR REPLACE FUNCTION public.validate_admin_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Only validate for admin role
  IF NEW.role = 'admin' THEN
    -- Get user email from auth.users
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = NEW.user_id;
    
    -- Check if email ends with @finityo.com
    IF v_email NOT LIKE '%@finityo.com' THEN
      RAISE EXCEPTION 'Admin role requires a @finityo.com email address';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to validate admin emails
DROP TRIGGER IF EXISTS validate_admin_email_trigger ON public.user_roles;
CREATE TRIGGER validate_admin_email_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_admin_email();