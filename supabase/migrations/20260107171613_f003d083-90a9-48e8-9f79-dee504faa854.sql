-- Add new aesthetic columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS colored_hair boolean DEFAULT null,
ADD COLUMN IF NOT EXISTS shaved_head boolean DEFAULT null,
ADD COLUMN IF NOT EXISTS vintage_style boolean DEFAULT null,
ADD COLUMN IF NOT EXISTS gothic_style boolean DEFAULT null;