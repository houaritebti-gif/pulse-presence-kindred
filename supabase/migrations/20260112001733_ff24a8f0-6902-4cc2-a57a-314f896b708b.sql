-- Add visibility settings columns to profiles table
-- Users can control what information is shown on their public profile

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_birth_year boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_zodiac boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_gender boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_city boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_vibe boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_tribes boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_music_styles boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_interests boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_looking_for boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_aesthetic_details boolean DEFAULT true;

-- Add comment explaining these columns
COMMENT ON COLUMN public.profiles.show_birth_year IS 'Whether to show birth year on public profile';
COMMENT ON COLUMN public.profiles.show_zodiac IS 'Whether to show zodiac sign on public profile';
COMMENT ON COLUMN public.profiles.show_gender IS 'Whether to show gender on public profile';
COMMENT ON COLUMN public.profiles.show_city IS 'Whether to show city on public profile';
COMMENT ON COLUMN public.profiles.show_vibe IS 'Whether to show vibe on public profile';
COMMENT ON COLUMN public.profiles.show_tribes IS 'Whether to show tribes on public profile';
COMMENT ON COLUMN public.profiles.show_music_styles IS 'Whether to show music styles on public profile';
COMMENT ON COLUMN public.profiles.show_interests IS 'Whether to show interests on public profile';
COMMENT ON COLUMN public.profiles.show_looking_for IS 'Whether to show looking for on public profile';
COMMENT ON COLUMN public.profiles.show_aesthetic_details IS 'Whether to show aesthetic details on public profile';