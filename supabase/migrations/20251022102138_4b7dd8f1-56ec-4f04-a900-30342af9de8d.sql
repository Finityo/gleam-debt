-- Clear all user roles to start fresh
DELETE FROM public.user_roles;

-- The existing handle_new_user() trigger will automatically assign
-- admin role to the next user who signs up (since user_roles will be empty)