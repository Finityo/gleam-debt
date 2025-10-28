-- Remove the restrictive email validation trigger for admin roles
DROP TRIGGER IF EXISTS validate_admin_email_trigger ON public.user_roles;
DROP FUNCTION IF EXISTS public.validate_admin_email();

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_roles_user_id_role_key'
    ) THEN
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
    END IF;
END $$;

-- Now assign admin role to the user
INSERT INTO public.user_roles (user_id, role)
VALUES ('ed8bd133-efa8-457b-94e2-a41192420614', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;