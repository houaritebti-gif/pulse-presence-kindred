-- Add email_verified column to profiles table to track verification status
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- Create function to sync email verification status from auth.users
CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET email_verified = NEW.email_confirmed_at IS NOT NULL
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger to sync on auth.users update
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE FUNCTION public.sync_email_verified();

-- Backfill existing profiles with current verification status
UPDATE public.profiles p
SET email_verified = (
  SELECT email_confirmed_at IS NOT NULL 
  FROM auth.users u 
  WHERE u.id = p.user_id
);