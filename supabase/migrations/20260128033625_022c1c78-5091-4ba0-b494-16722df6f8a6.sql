-- Add visibility toggle for optional details categories
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_optional_details boolean DEFAULT true;