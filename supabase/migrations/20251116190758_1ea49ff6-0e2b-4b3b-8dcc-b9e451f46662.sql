-- Add onboarding_completed column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Update existing profiles to have onboarding_completed = false
UPDATE public.profiles 
SET onboarding_completed = false 
WHERE onboarding_completed IS NULL;