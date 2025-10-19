-- Update handle_new_user function to auto-promote first user to admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_count INTEGER;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    address,
    zip_code,
    phone
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'zip_code',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Check if this is the first user
  SELECT COUNT(*) INTO v_user_count
  FROM public.user_roles;
  
  -- Assign admin role to first user, regular user role to others
  IF v_user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$function$;