-- Add last_login column to profiles table
-- This enables tracking first vs returning visits

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add index for performance
CREATE INDEX IF NOT EXISTS profiles_last_login_idx ON public.profiles(last_login);

-- Verification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'last_login';
