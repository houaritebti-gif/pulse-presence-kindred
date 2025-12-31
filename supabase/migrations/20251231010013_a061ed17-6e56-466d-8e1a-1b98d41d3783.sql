-- Add bio (description) field to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add "looking_for" field to store what users are seeking in KIKI
-- Using a text array to allow multiple selections
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS looking_for TEXT[];